import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import * as mysql from 'mysql';
import { VISIT_REQUEST_GET_LATEST_CODE_QUERY } from './visit-requests.queries';

@Injectable()
export class VisitRequestCodeService {
  constructor(private readonly db: DatabaseService) { }

  /**
   * Generates a sequential visit code like VISIT-2025-001
   * Uses a pessimistic lock within a transaction to ensure uniqueness under concurrency.
   */
  async generateNextCode(conn: mysql.PoolConnection): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `VISIT-${currentYear}-`;

    const [lastRequest] = await this.db.execute(conn, VISIT_REQUEST_GET_LATEST_CODE_QUERY, [`${prefix}%`]) as { visit_code: string }[];

    let nextNumber = 1;
    if (lastRequest) {
      const lastCode = lastRequest.visit_code;
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
