import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { CreateVisitFeedbackDto } from './dto/create-visit-feedback.dto';
import { VisitRequestStatus } from '../visit-requests/visit-requests.service';
import type { UserInfo } from '../common/types';
import { v4 as uuidv4 } from 'uuid';
import {
  VISIT_FEEDBACK_FIND_BY_VISIT_ID_QUERY,
  VISIT_FEEDBACK_INSERT_QUERY,
  VISIT_FEEDBACK_UPDATE_QUERY,
  VISIT_FEEDBACK_FIND_BY_ID_QUERY,
  VISIT_REQUEST_MINIMAL_FOR_FEEDBACK_QUERY,
} from './visit-feedback.queries';

export enum InterestLevel {
  NOT_INTERESTED = 'NOT_INTERESTED',
  MAYBE = 'MAYBE',
  INTERESTED = 'INTERESTED',
  VERY_INTERESTED = 'VERY_INTERESTED',
}

export interface IRawVisitFeedback {
  id: string;
  visit_request_id: string;
  interest_level: InterestLevel;
  feedback: string;
  created_at: Date;
}

export interface IRawVisitMinimal {
  visit_request_status: string;
  customer_id: string;
}

export interface IVisitFeedback {
  id: string;
  visitRequestId: string;
  interestLevel: InterestLevel;
  feedback: string;
  createdAt: Date;
}

@Injectable()
export class VisitFeedbackService {
  constructor(
    private readonly db: DatabaseService,
  ) { }

  private mapFeedback(raw: IRawVisitFeedback | null): IVisitFeedback | null {
    if (!raw) return null;
    return {
      id: raw.id,
      visitRequestId: raw.visit_request_id,
      interestLevel: raw.interest_level,
      feedback: raw.feedback,
      createdAt: raw.created_at,
    };
  }

  async upsertFeedback(visitRequestId: string, dto: CreateVisitFeedbackDto, user: UserInfo): Promise<IVisitFeedback | null> {
    const { interestLevel, feedback } = dto;

    const [visit] = await this.db.query(VISIT_REQUEST_MINIMAL_FOR_FEEDBACK_QUERY, [visitRequestId]) as IRawVisitMinimal[];

    if (!visit) {
      throw new NotFoundException('Visit request not found');
    }

    if (visit.visit_request_status !== VisitRequestStatus.COMPLETED) {
      throw new ConflictException('Feedback can only be submitted for completed visits');
    }

    if (visit.customer_id !== user.id) {
      throw new ForbiddenException('Only the customer who requested the visit can provide feedback');
    }

    const [existing] = await this.db.query(VISIT_FEEDBACK_FIND_BY_VISIT_ID_QUERY, [visitRequestId]) as IRawVisitFeedback[];

    if (existing) {
      await this.db.query(VISIT_FEEDBACK_UPDATE_QUERY, [interestLevel, feedback, visitRequestId]);
      const [updated] = await this.db.query(VISIT_FEEDBACK_FIND_BY_ID_QUERY, [existing.id]) as IRawVisitFeedback[];
      return this.mapFeedback(updated);
    } else {
      const id = uuidv4();
      await this.db.query(VISIT_FEEDBACK_INSERT_QUERY, [id, visitRequestId, interestLevel, feedback]);
      const [inserted] = await this.db.query(VISIT_FEEDBACK_FIND_BY_ID_QUERY, [id]) as IRawVisitFeedback[];
      return this.mapFeedback(inserted);
    }
  }
}
