import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { PoolConnection } from 'mysql';
import { USER_GET_LATEST_CODE_QUERY } from './user.queries';

interface IUserCode {
  user_code: string;
}

@Injectable()
export class UserCodeService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Generates a sequential user code like USR-2025-001
   * Uses a pessimistic FOR UPDATE lock within a transaction to ensure uniqueness under concurrency.
   */
  async generateNextCode(connection: PoolConnection): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `USR-${currentYear}-`;

    const [lastUser] = await this.db.execute<IUserCode[]>(
      connection,
      USER_GET_LATEST_CODE_QUERY,
      [`${prefix}%`],
    );

    let nextNumber = 1;
    if (lastUser) {
      const parts = lastUser.user_code.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${paddedNumber}`;
  }
}
