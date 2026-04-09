import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { STATUS } from '../common/enums/status.constant';
import { LockSlotDto } from './dto/lock-slot.dto';
import { v4 as uuidv4 } from 'uuid';
import * as mysql from 'mysql';
import {
  SITE_SLOT_FIND_BOOKED_QUERY,
  SITE_SLOT_INSERT_QUERY,
  SITE_SLOT_FIND_BY_UNIQUE_QUERY,
  SITE_SLOT_FIND_BY_ID_QUERY,
  SITE_SLOT_UPDATE_LOCK_QUERY,
  SITE_SLOT_UPDATE_STATUS_QUERY,
} from './site-slots.queries';

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  REQUESTED = 'REQUESTED',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
}

export interface ISlot {
  startTime: string;
  endTime: string;
}

export interface ISiteSlot {
  id: string;
  propertyId: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  slotStatus: SlotStatus;
  lockedBy?: string | null;
  lockedUntil?: Date | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SiteSlotsService {
  constructor(
    private readonly db: DatabaseService,
  ) { }

  private validateSlotDuration(startTime: string, endTime: string): void {
    const timeRegex = /^(\d{2}):00:00$/;
    const startMatch = startTime.match(timeRegex);
    const endMatch = endTime.match(timeRegex);

    if (!startMatch || !endMatch) {
      throw new BadRequestException('Slots must start and end on the hour (e.g., 09:00:00)');
    }

    const startHour = parseInt(startMatch[1], 10);
    const endHour = parseInt(endMatch[1], 10);

    if (endHour !== startHour + 1) {
      throw new BadRequestException('Visit duration must be exactly 1 hour');
    }
  }

  private mapSlot(raw: Record<string, unknown>): ISiteSlot | null {
    if (!raw) return null;
    return {
      id: raw.id as string,
      propertyId: raw.property_id as string,
      visitDate: raw.visit_date as string,
      startTime: raw.start_time as string,
      endTime: raw.end_time as string,
      slotStatus: raw.slot_status as SlotStatus,
      lockedBy: (raw.locked_by as string) || null,
      lockedUntil: raw.locked_until ? new Date(raw.locked_until as string) : null,
      status: raw.status as number,
      createdAt: new Date(raw.created_at as string),
      updatedAt: new Date(raw.updated_at as string),
    };
  }

  private generateSlots(startHour: number = 9): ISlot[] {
    const slots: ISlot[] = [];

    for (let hour = startHour; hour < 19; hour++) {
      const start = `${String(hour).padStart(2, '0')}:00:00`;
      const end = `${String(hour + 1).padStart(2, '0')}:00:00`;

      slots.push({
        startTime: start,
        endTime: end,
      });
    }

    return slots;
  }

  async getAvailableSlots(propertyId: string, visitDate: string): Promise<ISlot[]> {
    if (!propertyId || !visitDate) {
      throw new BadRequestException('propertyId and visitDate are required');
    }

    const today = new Date().toISOString().split('T')[0];

    if (visitDate < today) {
      throw new BadRequestException('Cannot book slots for past dates');
    }

    let startHour = 9;
    if (visitDate === today) {
      const now = new Date();

      if (now.getHours() >= 17) {
        throw new BadRequestException('Same-day bookings are not permitted after 5:00 PM. Please select a future date.');
      }

      startHour = Math.max(9, now.getHours() + 2);
    }
    const allSlots = this.generateSlots(startHour);

    const bookedSlots = await this.db.query(SITE_SLOT_FIND_BOOKED_QUERY, [
      propertyId,
      visitDate,
      STATUS.ACTIVE,
      SlotStatus.BOOKED,
      SlotStatus.REQUESTED,
      SlotStatus.LOCKED,
    ]) as { start_time: string }[];

    const bookedStartTimes = bookedSlots.map((slot) => slot.start_time);

    return allSlots.filter((slot) => !bookedStartTimes.includes(slot.startTime));
  }

  async lockSlot(dto: LockSlotDto, userId: string): Promise<ISiteSlot | null> {
    const { propertyId, visitDate, startTime, endTime } = dto;
    this.validateSlotDuration(startTime, endTime);

    const lockDurationMs = 5 * 60 * 1000; // 5 minutes
    const lockedUntil = new Date(Date.now() + lockDurationMs);

    try {
      const id = uuidv4();
      await this.db.query(SITE_SLOT_INSERT_QUERY, [
        id, propertyId, visitDate, startTime, endTime, SlotStatus.LOCKED, userId, lockedUntil, STATUS.ACTIVE
      ]);

      const [newSlot] = await this.db.query(SITE_SLOT_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
      return this.mapSlot(newSlot);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        const [existingSlot] = await this.db.query(SITE_SLOT_FIND_BY_UNIQUE_QUERY, [
          propertyId, visitDate, startTime, STATUS.ACTIVE
        ]) as Record<string, unknown>[];

        if (!existingSlot) {
          throw new ConflictException('Slot already taken');
        }

        const now = new Date();

        if (existingSlot.slot_status === SlotStatus.BOOKED || existingSlot.slot_status === SlotStatus.REQUESTED) {
          throw new ConflictException(`Slot already ${existingSlot.slot_status}`);
        }

        const existingLockedUntil = existingSlot.locked_until ? new Date(existingSlot.locked_until as string) : null;
        if (
          existingSlot.slot_status === SlotStatus.LOCKED &&
          existingLockedUntil &&
          existingLockedUntil > now &&
          existingSlot.locked_by !== userId
        ) {
          throw new ConflictException('Slot is currently locked by another user');
        }

        await this.db.query(SITE_SLOT_UPDATE_LOCK_QUERY, [
          SlotStatus.LOCKED, userId, lockedUntil, existingSlot.id as string
        ]);

        const [updatedSlot] = await this.db.query(SITE_SLOT_FIND_BY_ID_QUERY, [existingSlot.id as string]) as Record<string, unknown>[];
        return this.mapSlot(updatedSlot);
      }

      throw error;
    }
  }

  async requestTimeSlot(
    propertyId: string,
    visitDate: string,
    startTime: string,
    endTime: string,
    userId: string,
    conn?: mysql.PoolConnection
  ): Promise<ISiteSlot | null> {
    this.validateSlotDuration(startTime, endTime);
    
    try {
      const id = uuidv4();
      const params = [
        id, propertyId, visitDate, startTime, endTime, SlotStatus.REQUESTED, null, null, STATUS.ACTIVE
      ];

      if (conn) {
        await this.db.execute(conn, SITE_SLOT_INSERT_QUERY, params);
        const [newSlot] = await this.db.execute(conn, SITE_SLOT_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
        return this.mapSlot(newSlot);
      } else {
        await this.db.query(SITE_SLOT_INSERT_QUERY, params);
        const [newSlot] = await this.db.query(SITE_SLOT_FIND_BY_ID_QUERY, [id]) as Record<string, unknown>[];
        return this.mapSlot(newSlot);
      }
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        const queryParams = [propertyId, visitDate, startTime, STATUS.ACTIVE];
        const [existingSlot] = conn 
          ? await this.db.execute(conn, SITE_SLOT_FIND_BY_UNIQUE_QUERY, queryParams) as Record<string, unknown>[]
          : await this.db.query(SITE_SLOT_FIND_BY_UNIQUE_QUERY, queryParams) as Record<string, unknown>[];

        if (!existingSlot) {
          throw new ConflictException('Slot is unavailable');
        }

        const now = new Date();

        if (existingSlot.slot_status === SlotStatus.BOOKED || existingSlot.slot_status === SlotStatus.REQUESTED) {
          throw new ConflictException(`This slot has already been ${existingSlot.slot_status}`);
        }

        const existingLockedUntil = existingSlot.locked_until ? new Date(existingSlot.locked_until as string) : null;
        if (
          existingSlot.slot_status === SlotStatus.LOCKED &&
          existingLockedUntil &&
          existingLockedUntil > now &&
          existingSlot.locked_by !== userId
        ) {
          throw new ConflictException('This slot is currently locked by another user');
        }

        const updateParams = [SlotStatus.REQUESTED, existingSlot.id as string];
        if (conn) {
          await this.db.execute(conn, SITE_SLOT_UPDATE_STATUS_QUERY, updateParams);
          const [updatedSlot] = await this.db.execute(conn, SITE_SLOT_FIND_BY_ID_QUERY, [existingSlot.id as string]) as Record<string, unknown>[];
          return this.mapSlot(updatedSlot);
        } else {
          await this.db.query(SITE_SLOT_UPDATE_STATUS_QUERY, updateParams);
          const [updatedSlot] = await this.db.query(SITE_SLOT_FIND_BY_ID_QUERY, [existingSlot.id as string]) as Record<string, unknown>[];
          return this.mapSlot(updatedSlot);
        }
      }

      throw error;
    }
  }
}
