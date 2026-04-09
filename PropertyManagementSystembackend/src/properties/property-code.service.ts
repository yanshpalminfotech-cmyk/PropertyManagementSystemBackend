import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Property } from './entities/property.entity';

@Injectable()
export class PropertyCodeService {
  /**
   * Generates a sequential property code like PROP-2025-001
   * Uses a pessimistic lock within a transaction to ensure uniqueness under concurrency.
   */
  async generateNextCode(manager: EntityManager): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `PROP-${currentYear}-`;

    // Fetch the last property code for the current year
    // We use raw query or queryBuilder with lock to ensure absolute sequential accuracy
    const lastProperty = await manager
      .createQueryBuilder(Property, 'property')
      .setLock('pessimistic_write')
      .where('property.property_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('property.property_code', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastProperty) {
      const lastCode = lastProperty.propertyCode;
      const parts = lastCode.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Pad the number to 3 digits (e.g., 001, 002)
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${paddedNumber}`;
  }
}
