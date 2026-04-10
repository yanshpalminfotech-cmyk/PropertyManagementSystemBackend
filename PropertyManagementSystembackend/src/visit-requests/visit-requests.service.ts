import { Injectable, NotFoundException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { SqlParam } from '../common/types';
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
import { IRawPropertyMinimal, PropertyAvailabilityStatus } from '../properties/properties.service';
import {
  VISIT_REQUEST_INSERT_QUERY,
  VISIT_REQUEST_FIND_BY_ID_QUERY,
  VISIT_REQUEST_FIND_WITH_BROKER_QUERY,
  VISIT_REQUEST_UPDATE_STATUS_QUERY,
  PROPERTY_CHECK_ACTIVE_QUERY,
  SITE_SLOT_SYNC_STATUS_QUERY,
  VISIT_REQUEST_FIND_ALL_BASE_QUERY,
  VISIT_REQUEST_CHECK_EXISTING_ACTIVE_QUERY,
} from './visit-requests.queries';

export enum VisitRequestStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IRawVisitRequest {
  id: string;
  visit_code: string;
  property_id: string;
  customer_id: string;
  slot_id: string;
  visit_request_status: VisitRequestStatus;
  status: number;
  created_at: Date;
  updated_at: Date;
  // Join fields
  property_code?: string;
  category?: string;
  property_type?: string;
  visit_date?: string;
  start_time?: string;
  end_time?: string;
  broker_id?: string;
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

export interface IVisitRequestWithDetails extends IVisitRequest {
  property: {
    id: string;
    propertyCode: string;
    category: string;
    propertyType: string;
  };
  slot: {
    id: string;
    visitDate: string;
    startTime: string;
    endTime: string;
  };
}


@Injectable()
export class VisitRequestsService {
  private readonly logger = new Logger(VisitRequestsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly codeService: VisitRequestCodeService,
    private readonly siteSlotsService: SiteSlotsService,
  ) { }

  private mapVisitRequest(raw: IRawVisitRequest | null): IVisitRequest | null {
    if (!raw) return null;
    return {
      id: raw.id,
      visitCode: raw.visit_code,
      propertyId: raw.property_id,
      customerId: raw.customer_id,
      slotId: raw.slot_id,
      visitRequestStatus: raw.visit_request_status,
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }

  async create(dto: CreateVisitRequestDto, user: UserInfo): Promise<IVisitRequest | null> {
    const { propertyId, visitDate, startTime, endTime } = dto;

    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customers can create visit requests');
    }

    return this.db.transaction(async (conn) => {
      // Check for existing active (unexpired) requests for the same property
      const existing = await this.db.execute(conn, VISIT_REQUEST_CHECK_EXISTING_ACTIVE_QUERY, [
        user.id,
        propertyId,
        STATUS.ACTIVE,
        VisitRequestStatus.PENDING,
        VisitRequestStatus.CONFIRMED,
      ]) as Array<{ id: string; visit_code: string; visit_request_status: string }>;

      if (existing.length > 0) {
        const { visit_request_status } = existing[0];
        throw new ConflictException(`You already have an active visit request for this property with status ${visit_request_status}.`);
      }

      const [property] = await this.db.execute(conn, PROPERTY_CHECK_ACTIVE_QUERY, [
        propertyId,
        STATUS.ACTIVE,
        PropertyAvailabilityStatus.AVAILABLE
      ]) as IRawPropertyMinimal[];

      if (!property) {
        throw new NotFoundException('Property not found, inactive, or not available for visits (sold/rented).');
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

      const [newRequest] = await this.db.execute(conn, VISIT_REQUEST_FIND_BY_ID_QUERY, [id]) as IRawVisitRequest[];
      return this.mapVisitRequest(newRequest);
    });
  }

  async updateStatus(id: string, dto: UpdateVisitStatusDto, user: UserInfo): Promise<IVisitRequest | null> {
    const { status } = dto;

    return this.db.transaction(async (conn) => {
      const [visit] = await this.db.execute(conn, VISIT_REQUEST_FIND_WITH_BROKER_QUERY, [id, STATUS.ACTIVE]) as IRawVisitRequest[];

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
      await this.db.execute(conn, SITE_SLOT_SYNC_STATUS_QUERY, [slotStatus, visit.slot_id]);

      const [updated] = await this.db.execute(conn, VISIT_REQUEST_FIND_BY_ID_QUERY, [id]) as IRawVisitRequest[];
      return this.mapVisitRequest(updated);
    });
  }

  async findAllMy(user: UserInfo): Promise<IVisitRequestWithDetails[]> {
    let sql = VISIT_REQUEST_FIND_ALL_BASE_QUERY;
    const params: SqlParam[] = [STATUS.ACTIVE];

    if (user.role === UserRole.CUSTOMER) {
      sql += ' AND vr.customer_id = ?';
      params.push(user.id);
    } else if (user.role === UserRole.BROKER) {
      sql += ' AND p.broker_id = ?';
      params.push(user.id);
    }

    sql += ' ORDER BY vr.created_at DESC';

    const results = await this.db.query(sql, params) as IRawVisitRequest[];

    return results.map((raw) => {
      const request = this.mapVisitRequest(raw);
      if (!request) return null;

      return {
        ...request,
        property: {
          id: raw.property_id,
          propertyCode: raw.property_code ?? 'N/A',
          category: raw.category ?? 'N/A',
          propertyType: raw.property_type ?? 'N/A',
        },
        slot: {
          id: raw.slot_id,
          visitDate: raw.visit_date ?? 'N/A',
          startTime: raw.start_time ?? 'N/A',
          endTime: raw.end_time ?? 'N/A',
        }
      };
    }).filter((r): r is IVisitRequestWithDetails => r !== null);
  }
}
