import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DatabaseService } from '../../common/database/database.service';
import { STATUS } from '../../common/enums/status.constant';
import { UserRole } from '../../user/entities/user.entity';
import {
  PropertyType,
  PropertyCategory,
  TransactionType,
  PropertyLocation,
  FurnishingStatus,
  PropertyAvailabilityStatus
} from '../../properties/entities/property.entity';
import { SlotStatus } from '../../site-slots/site-slots.service';
import { VisitRequestStatus } from '../../visit-requests/visit-requests.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);
  const db = app.get(DatabaseService);

  try {
    logger.log('Starting seed process...');

    // 1. Seed Users
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const users = [
      { id: uuidv4(), code: 'USR-ADMIN-001', name: 'System Admin', email: 'admin@example.com', role: UserRole.ADMIN },
      { id: uuidv4(), code: 'USR-BROK-001', name: 'Real Estate Broker', email: 'broker@example.com', role: UserRole.BROKER },
      { id: uuidv4(), code: 'USR-CUST-001', name: 'Home Buyer', email: 'customer@example.com', role: UserRole.CUSTOMER },
    ];

    for (const u of users) {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]) as any[];
      if (!existing) {
        await db.query(
          `INSERT INTO users (id, user_code, name, email, phone, password_hash, role, failed_login_attempts, is_locked, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.code, u.name, u.email, '9999999999', passwordHash, u.role, 0, 0, STATUS.ACTIVE]
        );
        logger.log(`Created user: ${u.email}`);
      } else {
        u.id = existing.id;
      }
    }

    const brokerId = users[1].id;
    const customerId = users[2].id;

    // 2. Seed Properties
    const propertyData = [
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK2, loc: PropertyLocation.VESU, trans: TransactionType.SALE, price: 7500000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK3, loc: PropertyLocation.ADAJAN, trans: TransactionType.SALE, price: 9500000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.COMMERCIAL, cat: PropertyCategory.SHOP, loc: PropertyLocation.VESU, trans: TransactionType.RENT, price: 45000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.VILLA, loc: PropertyLocation.PAL, trans: TransactionType.SALE, price: 25000000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK1, loc: PropertyLocation.VESU, trans: TransactionType.RENT, price: 15000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.COMMERCIAL, cat: PropertyCategory.OFFICE, loc: PropertyLocation.VESU, trans: TransactionType.RENT, price: 65000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK3, loc: PropertyLocation.VESU, trans: TransactionType.SALE, price: 8500000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK2, loc: PropertyLocation.ADAJAN, trans: TransactionType.RENT, price: 18000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.COMMERCIAL, cat: PropertyCategory.SHOP, loc: PropertyLocation.ADAJAN, trans: TransactionType.SALE, price: 12000000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK1, loc: PropertyLocation.ADAJAN, trans: TransactionType.SALE, price: 3500000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.VILLA, loc: PropertyLocation.VESU, trans: TransactionType.SALE, price: 18000000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK3 as any || PropertyCategory.VILLA, loc: PropertyLocation.CITYLIGHT, trans: TransactionType.SALE, price: 15000000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK2, loc: PropertyLocation.CITYLIGHT, trans: TransactionType.RENT, price: 22000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.COMMERCIAL, cat: PropertyCategory.SHOP, loc: PropertyLocation.CITYLIGHT, trans: TransactionType.RENT, price: 35000, status: PropertyAvailabilityStatus.AVAILABLE },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK3, loc: PropertyLocation.PIPLOD, trans: TransactionType.SALE, price: 11000000, status: PropertyAvailabilityStatus.AVAILABLE },
      // Sold/Rented Properties
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK2, loc: PropertyLocation.VESU, trans: TransactionType.SALE, price: 7200000, status: PropertyAvailabilityStatus.SOLD },
      { type: PropertyType.RESIDENTIAL, cat: PropertyCategory.BHK3, loc: PropertyLocation.PAL, trans: TransactionType.RENT, price: 25000, status: PropertyAvailabilityStatus.RENTED },
      { type: PropertyType.COMMERCIAL, cat: PropertyCategory.OFFICE, loc: PropertyLocation.ADAJAN, trans: TransactionType.SALE, price: 85000000, status: PropertyAvailabilityStatus.SOLD },
    ];

    const propertyIds: string[] = [];
    for (let i = 0; i < propertyData.length; i++) {
      const p = propertyData[i];
      const id = uuidv4();
      const code = `PROP-${2025}-${String(i + 1).padStart(3, '0')}`;

      const [existing] = await db.query('SELECT id FROM properties WHERE property_code = ?', [code]) as any[];
      if (!existing) {
        await db.query(
          `INSERT INTO properties (
            id, property_code, broker_id, property_type, category, transaction_type, 
            location, address, owner_name, owner_mobile_number, carpet_area, built_up_area, 
            price, maintenance_cost, furnishing, parking, floor_number, total_floors, 
            property_age, facing, description, amenities, available_for_visit, 
            propertiesstatus, broker_commission, status, status_change_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, code, brokerId, p.type, p.cat, p.trans, p.loc, `Address ${i + 1}, ${p.loc}`, 'Owner Name', '9123456789',
            800 + (i * 10), 1000 + (i * 10), p.price, 2000, FurnishingStatus.SEMI_FURNISHED, 1, 2, 5, 5, 'North',
            'Description text', 'Pool,Gym', 1, p.status, 200000, STATUS.ACTIVE, p.status !== PropertyAvailabilityStatus.AVAILABLE ? new Date() : null
          ]
        );
        propertyIds.push(id);
      } else {
        propertyIds.push(existing.id);
      }
    }
    logger.log(`Seeded ${propertyIds.length} properties`);

    // 3. Seed Site Visit Slots
    const slotIds: string[] = [];
    const dates = [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
      new Date(Date.now() + 172800000).toISOString().split('T')[0],
      new Date(Date.now() - 86400000).toISOString().split('T')[0], // Past date
    ];

    for (let i = 0; i < 30; i++) {
      const id = uuidv4();
      const propId = propertyIds[i % propertyIds.length];
      const date = dates[i % dates.length];
      const hour = 9 + (i % 8);
      const startTime = `${String(hour).padStart(2, '0')}:00:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00:00`;

      const statusValue = i < 10 ? SlotStatus.AVAILABLE : (i < 20 ? SlotStatus.BOOKED : SlotStatus.REQUESTED);

      const [existing] = await db.query('SELECT id FROM site_slots WHERE property_id = ? AND visit_date = ? AND start_time = ?', [propId, date, startTime]) as any[];
      if (!existing) {
        await db.query(
          `INSERT INTO site_slots (id, property_id, visit_date, start_time, end_time, slot_status, locked_by, locked_until, status) 
           VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
          [id, propId, date, startTime, endTime, statusValue, STATUS.ACTIVE]
        );
        slotIds.push(id);
      } else {
        slotIds.push(existing.id);
      }
    }
    logger.log(`Seeded ${slotIds.length} slots`);

    // 4. Seed Visit Requests
    const reqStatuses = [VisitRequestStatus.PENDING, VisitRequestStatus.CONFIRMED, VisitRequestStatus.COMPLETED, VisitRequestStatus.CANCELLED];
    for (let i = 0; i < 20; i++) {
      const id = uuidv4();
      const code = `VISIT-2025-${String(i + 1).padStart(3, '0')}`;
      const slotId = slotIds[i % slotIds.length];

      // Need propertyId for this slot
      const [slot] = await db.query('SELECT property_id FROM site_slots WHERE id = ?', [slotId]) as any[];
      if (!slot) continue;

      const [existing] = await db.query('SELECT id FROM visit_requests WHERE visit_code = ?', [code]) as any[];
      if (!existing) {
        await db.query(
          `INSERT INTO visit_requests (id, visit_code, property_id, customer_id, slot_id, visit_request_status, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, code, slot.property_id, customerId, slotId, reqStatuses[i % reqStatuses.length], STATUS.ACTIVE]
        );
      }
    }
    logger.log('Seeded 20 visit requests');

    logger.log('Seed process completed successfully!');
  } catch (error) {
    logger.error('Seed process failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
