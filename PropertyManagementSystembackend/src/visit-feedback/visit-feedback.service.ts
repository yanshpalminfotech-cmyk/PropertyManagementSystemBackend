import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VisitFeedback } from './entities/visit-feedback.entity';
import { CreateVisitFeedbackDto } from './dto/create-visit-feedback.dto';
import { VisitRequestStatus } from '../visit-requests/entities/visit-request.entity';
import type { UserInfo } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VisitFeedbackService {
  constructor(
    @InjectRepository(VisitFeedback)
    private readonly feedbackRepo: Repository<VisitFeedback>,
    private readonly dataSource: DataSource,
  ) {}

  async upsertFeedback(visitRequestId: string, dto: CreateVisitFeedbackDto, user: UserInfo) {
    const { interestLevel, feedback } = dto;

    // 1. Fetch the visit request to validate status and ownership
    const [visit] = await this.dataSource.query(`
      SELECT id, customer_id, visit_request_status 
      FROM visit_requests 
      WHERE id = ? AND status = 1
    `, [visitRequestId]);

    if (!visit) {
      throw new NotFoundException('Visit request not found');
    }

    // 2. Validation: Must be COMPLETED
    if (visit.visit_request_status !== VisitRequestStatus.COMPLETED) {
      throw new ConflictException('Feedback can only be submitted for completed visits');
    }

    // 3. Validation: Ownership (Must be the customer)
    if (visit.customer_id !== user.id) {
      throw new ForbiddenException('Only the customer who requested the visit can provide feedback');
    }

    // 4. Upsert Logic (Raw SQL)
    const [existing] = await this.feedbackRepo.query(
      'SELECT id FROM visit_feedback WHERE visit_request_id = ?',
      [visitRequestId]
    );

    if (existing) {
      await this.feedbackRepo.query(`
        UPDATE visit_feedback 
        SET interest_level = ?, feedback = ?, created_at = NOW()
        WHERE visit_request_id = ?
      `, [interestLevel, feedback, visitRequestId]);
      
      const [updated] = await this.feedbackRepo.query('SELECT * FROM visit_feedback WHERE id = ?', [existing.id]);
      return updated;
    } else {
      const id = uuidv4();
      await this.feedbackRepo.query(`
        INSERT INTO visit_feedback (id, visit_request_id, interest_level, feedback, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [id, visitRequestId, interestLevel, feedback]);

      const [inserted] = await this.feedbackRepo.query('SELECT * FROM visit_feedback WHERE id = ?', [id]);
      return inserted;
    }
  }
}
