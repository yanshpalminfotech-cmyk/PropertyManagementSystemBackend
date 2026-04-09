import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { USER_GET_LATEST_CODE_QUERY } from './user.queries';

@Injectable()
export class UserCodeService {
  /**
   * Generates a sequential user code like USR-2025-001
   * Uses a pessimistic lock within a transaction to ensure uniqueness under concurrency.
   */
  async generateNextCode(manager: EntityManager): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `USR-${currentYear}-`;

    // Fetch the last user code for the current year using raw SQL with FOR UPDATE lock
    const [lastUser] = await manager.query(USER_GET_LATEST_CODE_QUERY, [`${prefix}%`]);

    let nextNumber = 1;
    if (lastUser) {
      const lastCode = lastUser.user_code; // raw result uses snake_case column name
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
