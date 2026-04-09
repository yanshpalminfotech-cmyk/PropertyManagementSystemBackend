import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VisitRequest } from './entities/visit-request.entity';

@Injectable()
export class VisitRequestCodeService {
  /**
   * Generates a sequential visit code like VISIT-2025-001
   * Uses a pessimistic lock within a transaction to ensure uniqueness under concurrency.
   */
  async generateNextCode(manager: EntityManager): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `VISIT-${currentYear}-`;

    const lastRequest = await manager
      .createQueryBuilder(VisitRequest, 'visit')
      .setLock('pessimistic_write')
      .where('visit.visit_code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('visit.visit_code', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastRequest) {
      const lastCode = lastRequest.visitCode;
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
