import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SiteSlot, SlotStatus } from './entities/site-slot.entity';
import { STATUS } from '../common/enums/status.constant';
import { LockSlotDto } from './dto/lock-slot.dto';
import { v4 as uuidv4 } from 'uuid';

export interface Slot {
  startTime: string;
  endTime: string;
}

@Injectable()
export class SiteSlotsService {
  constructor(
    @InjectRepository(SiteSlot)
    private readonly siteSlotRepo: Repository<SiteSlot>,
  ) {}

  private mapSlot(raw: any) {
    if (!raw) return null;
    return {
      id: raw.id,
      propertyId: raw.property_id,
      visitDate: raw.visit_date,
      startTime: raw.start_time,
      endTime: raw.end_time,
      slotStatus: raw.slot_status,
      lockedBy: raw.locked_by,
      lockedUntil: raw.locked_until,
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }

  // 🔹 Generate slots (from startHour → 7 PM)
  private generateSlots(startHour: number = 9): Slot[] {
    const slots: Slot[] = [];

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

  // 🔥 MAIN METHOD
  async getAvailableSlots(propertyId: string, visitDate: string): Promise<Slot[]> {
    if (!propertyId || !visitDate) {
      throw new BadRequestException('propertyId and visitDate are required');
    }

    const today = new Date().toISOString().split('T')[0];

    // Prevent past date bookings entirely
    if (visitDate < today) {
      throw new BadRequestException('Cannot book slots for past dates');
    }

    // Step 1: Generate all valid slots
    let startHour = 9;
    if (visitDate === today) {
      const now = new Date();

      if (now.getHours() >= 17) {
        throw new BadRequestException('Same-day bookings are not permitted after 5:00 PM. Please select a future date.');
      }

      // Add a 2-hour buffer. If it's 10AM, start at 12PM. But keep 9AM as hard minimum.
      startHour = Math.max(9, now.getHours() + 2);
    }
    const allSlots = this.generateSlots(startHour);

    // Step 2: Fetch booked slots from DB using raw SQL for performance and adherence to repository rules
    const sql = `
      SELECT start_time as startTime 
      FROM site_slots 
      WHERE property_id = ? 
        AND visit_date = ? 
        AND status = ?
        AND (
        slot_status = ?
        OR slot_status = ?
        OR (slot_status = ? AND locked_until > NOW())
      )
    `;
    
    // Using parameter binding for raw sql
    const bookedSlots: { startTime: string }[] = await this.siteSlotRepo.query(sql, [
      propertyId,
      visitDate,
      STATUS.ACTIVE,
      SlotStatus.BOOKED,
      SlotStatus.REQUESTED,
      SlotStatus.LOCKED,
    ]);

    // Step 3: Extract booked start times
    const bookedStartTimes = bookedSlots.map((slot) => slot.startTime);

    const availableSlots = allSlots.filter((slot) => !bookedStartTimes.includes(slot.startTime));

    return availableSlots;
  }

  async lockSlot(dto: LockSlotDto, userId: string) {
    const { propertyId, visitDate, startTime, endTime } = dto;

    const lockDurationMs = 5 * 60 * 1000; // 5 minutes
    const lockedUntil = new Date(Date.now() + lockDurationMs);

    try {
      // 🔥 Try inserting new slot (handles first-time lock)
      const id = uuidv4();
      await this.siteSlotRepo.query(`
        INSERT INTO site_slots (id, property_id, visit_date, start_time, end_time, slot_status, locked_by, locked_until, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, propertyId, visitDate, startTime, endTime, SlotStatus.LOCKED, userId, lockedUntil, STATUS.ACTIVE]);

      const [newSlot] = await this.siteSlotRepo.query('SELECT * FROM site_slots WHERE id = ?', [id]);
      return this.mapSlot(newSlot);
    } catch (error: any) {
      // 🔴 UNIQUE constraint triggered → slot already exists
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        // Fetch existing slot
        const [existingSlot] = await this.siteSlotRepo.query(`
          SELECT * FROM site_slots 
          WHERE property_id = ? AND visit_date = ? AND start_time = ? AND status = ?
        `, [propertyId, visitDate, startTime, STATUS.ACTIVE]);

        if (!existingSlot) {
          throw new ConflictException('Slot already taken');
        }

        const now = new Date();

        // ❌ If already booked or requested
        if (existingSlot.slot_status === SlotStatus.BOOKED || existingSlot.slot_status === SlotStatus.REQUESTED) {
          throw new ConflictException(`Slot already ${existingSlot.slot_status.toLowerCase()}`);
        }

        // ❌ If locked by someone else and not expired
        const existingLockedUntil = existingSlot.locked_until ? new Date(existingSlot.locked_until) : null;
        if (
          existingSlot.slot_status === SlotStatus.LOCKED &&
          existingLockedUntil &&
          existingLockedUntil > now &&
          existingSlot.locked_by !== userId
        ) {
          throw new ConflictException('Slot is currently locked by another user');
        }

        // ✅ Lock expired OR same user → update lock
        await this.siteSlotRepo.query(`
          UPDATE site_slots
          SET slot_status = ?, locked_by = ?, locked_until = ?
          WHERE id = ?
        `, [SlotStatus.LOCKED, userId, lockedUntil, existingSlot.id]);

        const [updatedSlot] = await this.siteSlotRepo.query('SELECT * FROM site_slots WHERE id = ?', [existingSlot.id]);
        return this.mapSlot(updatedSlot);
      }

      throw error;
    }
  }

  async requestTimeSlot(propertyId: string, visitDate: string, startTime: string, endTime: string, userId: string, manager?: EntityManager) {
    const runner = manager || this.siteSlotRepo;
    try {
      // 🔥 Try inserting directly; if no one locked or booked it prior, this works instantly.
      const id = uuidv4();
      await runner.query(`
        INSERT INTO site_slots (id, property_id, visit_date, start_time, end_time, slot_status, locked_by, locked_until, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, propertyId, visitDate, startTime, endTime, SlotStatus.REQUESTED, null, null, STATUS.ACTIVE]);

      const [newSlot] = await runner.query('SELECT * FROM site_slots WHERE id = ?', [id]);
      return this.mapSlot(newSlot);
    } catch (error: any) {
      // 🔴 UNIQUE constraint triggered → slot already exists in some form (LOCKED, CANCELLED, BOOKED, REQUESTED)
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        const [existingSlot] = await runner.query(`
          SELECT * FROM site_slots 
          WHERE property_id = ? AND visit_date = ? AND start_time = ? AND status = ?
        `, [propertyId, visitDate, startTime, STATUS.ACTIVE]);

        if (!existingSlot) {
          throw new ConflictException('Slot is unavailable');
        }

        const now = new Date();

        // ❌ If already booked or requested
        if (existingSlot.slot_status === SlotStatus.BOOKED || existingSlot.slot_status === SlotStatus.REQUESTED) {
          throw new ConflictException(`This slot has already been ${existingSlot.slot_status.toLowerCase()}`);
        }

        // ❌ If locked by someone else and the lock has NOT expired
        const existingLockedUntil = existingSlot.locked_until ? new Date(existingSlot.locked_until) : null;
        if (
          existingSlot.slot_status === SlotStatus.LOCKED &&
          existingLockedUntil &&
          existingLockedUntil > now &&
          existingSlot.locked_by !== userId
        ) {
          throw new ConflictException('This slot is currently locked by another user');
        }

        // ✅ If it's locked by THIS user, or lock expired, or it's CANCELLED/AVAILABLE → Update to REQUESTED
        await runner.query(`
          UPDATE site_slots
          SET slot_status = ?, locked_by = NULL, locked_until = NULL
          WHERE id = ?
        `, [SlotStatus.REQUESTED, existingSlot.id]);

        const [updatedSlot] = await runner.query('SELECT * FROM site_slots WHERE id = ?', [existingSlot.id]);
        return this.mapSlot(updatedSlot);
      }

      throw error;
    }
  }
}
