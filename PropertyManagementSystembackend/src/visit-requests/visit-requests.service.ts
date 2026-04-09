import { Injectable, NotFoundException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VisitRequest, VisitRequestStatus } from './entities/visit-request.entity';
import { CreateVisitRequestDto } from './dto/create-visit-request.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { VisitRequestCodeService } from './visit-request-code.service';
import { SiteSlotsService } from '../site-slots/site-slots.service';
import { SlotStatus } from '../site-slots/entities/site-slot.entity';
import { STATUS } from '../common/enums/status.constant';
import type { UserInfo } from '../common/types';
import { UserRole } from '../user/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VisitRequestsService {
  private readonly logger = new Logger(VisitRequestsService.name);

  constructor(
    @InjectRepository(VisitRequest)
    private readonly visitRequestRepo: Repository<VisitRequest>,
    private readonly codeService: VisitRequestCodeService,
    private readonly siteSlotsService: SiteSlotsService,
    private readonly dataSource: DataSource,
  ) { }

  private mapVisitRequest(raw: any) {
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

  async create(dto: CreateVisitRequestDto, user: UserInfo) {
    const { propertyId, visitDate, startTime, endTime } = dto;

    // 1. Authorization Check (Only Customer)
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customers can create visit requests');
    }

    return this.dataSource.transaction(async (manager) => {
      // 2. Check Property Existence and Status
      const [property] = await manager.query(
        'SELECT id FROM properties WHERE id = ? AND status = ?',
        [propertyId, STATUS.ACTIVE]
      );

      if (!property) {
        throw new NotFoundException('Property not found or inactive');
      }

      // 3. Request Time Slot (Atomic via shared manager)
      const slot = await this.siteSlotsService.requestTimeSlot(
        propertyId,
        visitDate,
        startTime,
        endTime,
        user.id,
        manager
      );

      if (!slot) {
        throw new ConflictException('Failed to secure time slot.');
      }

      // 4. Generate Unique Visit Code (Pessimistic locked)
      const visitCode = await this.codeService.generateNextCode(manager);

      // 5. Create Visit Request via Raw SQL
      const id = uuidv4();
      await manager.query(`
        INSERT INTO visit_requests (id, visit_code, property_id, customer_id, slot_id, visit_request_status, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, visitCode, propertyId, user.id, slot.id, VisitRequestStatus.PENDING, STATUS.ACTIVE]);

      const [newRequest] = await manager.query('SELECT * FROM visit_requests WHERE id = ?', [id]);
      return this.mapVisitRequest(newRequest);
    });
  }

  async updateStatus(id: string, dto: UpdateVisitStatusDto, user: UserInfo) {
    const { status } = dto;

    return this.dataSource.transaction(async (manager) => {
      // 1. Fetch visit request along with property broker_id for permission check
      const [visit] = await manager.query(`
        SELECT vr.*, p.broker_id 
        FROM visit_requests vr
        JOIN properties p ON vr.property_id = p.id
        WHERE vr.id = ? AND vr.status = ?
      `, [id, STATUS.ACTIVE]);

      if (!visit) {
        throw new NotFoundException('Visit request not found');
      }

      // 2. Permission Validation
      if (status === VisitRequestStatus.CONFIRMED) {
        // Only broker can confirm
        if (user.role !== UserRole.ADMIN && (user.role !== UserRole.BROKER || visit.broker_id !== user.id)) {
          throw new ForbiddenException('Only the property broker can confirm this visit');
        }
      }

      if (status === VisitRequestStatus.CANCELLED) {
        // Customer can cancel own, Broker can cancel for own property
        const isCustomerOwner = user.role === UserRole.CUSTOMER && visit.customer_id === user.id;
        const isBrokerOwner = user.role === UserRole.BROKER && visit.broker_id === user.id;

        if (user.role !== UserRole.ADMIN && !isCustomerOwner && !isBrokerOwner) {
          throw new ForbiddenException('You do not have permission to cancel this visit');
        }
      }

      // 3. Status Transition Logic
      if (visit.visit_request_status === status) {
        throw new ConflictException(`Visit is already ${status.toLowerCase()}`);
      }

      // 4. Update Visit Request Status
      await manager.query(
        'UPDATE visit_requests SET visit_request_status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );

      // 5. Sync with Site Slot Status
      const slotStatus = status === VisitRequestStatus.CONFIRMED ? SlotStatus.BOOKED : SlotStatus.CANCELLED;
      await manager.query(
        'UPDATE site_slots SET slot_status = ?, updated_at = NOW() WHERE id = ?',
        [slotStatus, visit.slot_id]
      );

      const [updated] = await manager.query('SELECT * FROM visit_requests WHERE id = ?', [id]);
      return this.mapVisitRequest(updated);
    });
  }

  async findAllMy(user: UserInfo) {
    let sql = `
      SELECT 
        vr.*, 
        p.title as property_title, 
        p.property_code,
        ss.visit_date, 
        ss.start_time, 
        ss.end_time
      FROM visit_requests vr
      JOIN properties p ON vr.property_id = p.id
      JOIN site_slots ss ON vr.slot_id = ss.id
      WHERE vr.status = ?
    `;

    const params: any[] = [STATUS.ACTIVE];

    if (user.role === UserRole.CUSTOMER) {
      sql += ' AND vr.customer_id = ?';
      params.push(user.id);
    } else if (user.role === UserRole.BROKER) {
      sql += ' AND p.broker_id = ?';
      params.push(user.id);
    } else if (user.role === UserRole.ADMIN) {
      // Admins see everything in the "Manage" view, but here we'll let them see all
    } else {
      throw new ForbiddenException('User role not authorized for this view');
    }

    sql += ' ORDER BY vr.created_at DESC';

    const results = await this.visitRequestRepo.query(sql, params);
    
    return results.map((raw: any) => ({
      ...this.mapVisitRequest(raw),
      property: {
        id: raw.property_id,
        title: raw.property_title,
        propertyCode: raw.property_code,
      },
      slot: {
        id: raw.slot_id,
        visitDate: raw.visit_date,
        startTime: raw.start_time,
        endTime: raw.end_time,
      }
    }));
  }
}
