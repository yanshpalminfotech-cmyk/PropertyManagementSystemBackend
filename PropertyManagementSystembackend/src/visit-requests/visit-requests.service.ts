import { Injectable, NotFoundException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { CreateVisitRequestDto } from './dto/create-visit-request.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { VisitRequestCodeService } from './visit-request-code.service';
import { SiteSlotsService } from '../site-slots/site-slots.service';
import { SlotStatus } from '../site-slots/site-slots.service';
import { STATUS } from '../common/enums/status.constant';
import type { UserInfo } from '../common/types';
import { UserRole } from '../user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  VISIT_REQUEST_INSERT_QUERY,
  VISIT_REQUEST_FIND_BY_ID_QUERY,
  VISIT_REQUEST_FIND_WITH_BROKER_QUERY,
  VISIT_REQUEST_UPDATE_STATUS_QUERY,
  PROPERTY_CHECK_ACTIVE_QUERY,
  SITE_SLOT_SYNC_STATUS_QUERY,
  VISIT_REQUEST_FIND_ALL_BASE_QUERY,
} from './visit-requests.queries';

export enum VisitRequestStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IVisitRequest {
  id: string;
  visitCode: string;
  propertyId: string;
  customerId: string;
  slotId: string;
  visitRequestStatus: VisitRequestStatus;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VisitRequestsService {
  private readonly logger = new Logger(VisitRequestsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly codeService: VisitRequestCodeService,
    private readonly siteSlotsService: SiteSlotsService,
  ) { }

  private mapVisitRequest(raw: Record<string, unknown>): IVisitRequest | null {
    if (!raw) return null;
    return {
      id: raw.id as string,
      visitCode: raw.visit_code as string,
      propertyId: raw.property_id as string,
      customerId: raw.customer_id as string,
      slotId: raw.slot_id as string,
      visitRequestStatus: raw.visit_request_status as VisitRequestStatus,
      status: raw.status as number,
      createdAt: raw.created_at as Date,
      updatedAt: raw.updated_at as Date,
    };
  }

  async create(dto: CreateVisitRequestDto, user: UserInfo): Promise<IVisitRequest | null> {
    const { propertyId, visitDate, startTime, endTime } = dto;

    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customers can create visit requests');
    }

    return this.db.transaction(async (conn) => {
      const [property] = await this.db.execute(conn, PROPERTY_CHECK_ACTIVE_QUERY, [propertyId, STATUS.ACTIVE]) as Record<string, unknown>[];

      if (!property) {
        throw new NotFoundException('Property not found or inactive');
      }

      const slot = await this.siteSlotsService.requestTimeSlot(
        propertyId,
        visitDate,
        startTime,
        endTime,
        user.id,
        conn
      );

      if (!slot) {
        throw new ConflictException('Failed to secure time slot.');
      }

      const visitCode = await this.codeService.generateNextCode(conn);
      const id = uuidv4();
      
      await this.db.execute(conn, VISIT_REQUEST_INSERT_QUERY, [
        id, 
        visitCode, 
        propertyId, 
        user.id, 
        slot.id, 
        VisitRequestStatus.PENDING, 
        STATUS.ACTIVE
      ]);

      const [newRequest] = await this.db.execute(conn, VISIT_REQUEST_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
      return this.mapVisitRequest(newRequest);
    });
  }

  async updateStatus(id: string, dto: UpdateVisitStatusDto, user: UserInfo): Promise<IVisitRequest | null> {
    const { status } = dto;

    return this.db.transaction(async (conn) => {
      const [visit] = await this.db.execute(conn, VISIT_REQUEST_FIND_WITH_BROKER_QUERY, [id, STATUS.ACTIVE]) as Record<string, unknown>[];

      if (!visit) {
        throw new NotFoundException('Visit request not found');
      }

      if (status === VisitRequestStatus.CONFIRMED) {
        if (user.role !== UserRole.ADMIN && (user.role !== UserRole.BROKER || visit.broker_id !== user.id)) {
          throw new ForbiddenException('Only the property broker can confirm this visit');
        }
      }

      if (status === VisitRequestStatus.CANCELLED) {
        const isCustomerOwner = user.role === UserRole.CUSTOMER && visit.customer_id === user.id;
        const isBrokerOwner = user.role === UserRole.BROKER && visit.broker_id === user.id;

        if (user.role !== UserRole.ADMIN && !isCustomerOwner && !isBrokerOwner) {
          throw new ForbiddenException('You do not have permission to cancel this visit');
        }
      }

      if (visit.visit_request_status === status) {
        throw new ConflictException(`Visit is already ${status.toLowerCase()}`);
      }

      await this.db.execute(conn, VISIT_REQUEST_UPDATE_STATUS_QUERY, [status, id]);

      const slotStatus = status === VisitRequestStatus.CONFIRMED ? SlotStatus.BOOKED : SlotStatus.CANCELLED;
      await this.db.execute(conn, SITE_SLOT_SYNC_STATUS_QUERY, [slotStatus, visit.slot_id as string]);

      const [updated] = await this.db.execute(conn, VISIT_REQUEST_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
      return this.mapVisitRequest(updated);
    });
  }

  async findAllMy(user: UserInfo): Promise<any[]> {
    let sql = VISIT_REQUEST_FIND_ALL_BASE_QUERY;
    const params: unknown[] = [STATUS.ACTIVE];

    if (user.role === UserRole.CUSTOMER) {
      sql += ' AND vr.customer_id = ?';
      params.push(user.id);
    } else if (user.role === UserRole.BROKER) {
      sql += ' AND p.broker_id = ?';
      params.push(user.id);
    }

    sql += ' ORDER BY vr.created_at DESC';

    const results = await this.db.query(sql, params) as Record<string, unknown>[];
    
    return results.map((raw) => {
      const request = this.mapVisitRequest(raw);
      return {
        ...request,
        property: {
          id: raw.property_id,
          propertyCode: raw.property_code,
          category: raw.category,
          propertyType: raw.property_type,
        },
        slot: {
          id: raw.slot_id,
          visitDate: raw.visit_date,
          startTime: raw.start_time,
          endTime: raw.end_time,
        }
      };
    });
  }
}
