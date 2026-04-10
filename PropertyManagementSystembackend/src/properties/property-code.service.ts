import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import * as mysql from 'mysql';
import { PROPERTY_GET_LATEST_CODE_QUERY } from './properties.queries';

@Injectable()
export class PropertyCodeService {
  constructor(private readonly db: DatabaseService) { }

  /**
   * Generates a sequential property code like PROP-2025-001
   * Uses a pessimistic lock within a transaction to ensure uniqueness under concurrency.
   */
  async generateNextCode(conn: mysql.PoolConnection): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `PROP-${currentYear}-`;

    // Fetch the last property code for the current year using raw SQL with FOR UPDATE lock
    interface ILastProperty { property_code: string; }
    const [lastProperty] = await this.db.execute(conn, PROPERTY_GET_LATEST_CODE_QUERY, [`${prefix}%`]) as ILastProperty[];

    let nextNumber = 1;
    if (lastProperty) {
      const lastCode = lastProperty.property_code;
      const parts = lastCode.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${paddedNumber}`;
  }
}
