import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { CreateVisitFeedbackDto } from './dto/create-visit-feedback.dto';
import { VisitRequestStatus } from '../visit-requests/visit-requests.service';
import type { UserInfo } from '../common/types';
import { v4 as uuidv4 } from 'uuid';
import {
  VISIT_FEEDBACK_FIND_BY_VISIT_ID_QUERY,
  VISIT_FEEDBACK_INSERT_QUERY,
  VISIT_FEEDBACK_FIND_BY_ID_QUERY,
  VISIT_REQUEST_MINIMAL_FOR_FEEDBACK_QUERY,
  VISIT_FEEDBACK_FIND_ALL_QUERY,
  VISIT_FEEDBACK_FIND_BY_BROKER_QUERY,
  VISIT_FEEDBACK_FIND_BY_PROPERTY_QUERY,
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

export interface IRawVisitFeedbackDetail extends IRawVisitFeedback {
  visit_code: string;
  visit_date: string;
  start_time: string;
  end_time: string;
  property_id: string;
  property_code: string;
  property_type: string;
  category: string;
  location: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
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

export interface IVisitFeedbackDetail {
  id: string;
  visitRequestId: string;
  visitCode: string;
  interestLevel: InterestLevel;
  feedback: string;
  createdAt: Date;
  visitDate: string;
  startTime: string;
  endTime: string;
  property: {
    id: string;
    propertyCode: string;
    propertyType: string;
    category: string;
    location: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable()
export class VisitFeedbackService {
  private readonly logger = new Logger(VisitFeedbackService.name);

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

  private mapFeedbackDetail(raw: IRawVisitFeedbackDetail): IVisitFeedbackDetail {
    return {
      id: raw.id,
      visitRequestId: raw.visit_request_id,
      visitCode: raw.visit_code,
      interestLevel: raw.interest_level,
      feedback: raw.feedback,
      createdAt: raw.created_at,
      visitDate: raw.visit_date,
      startTime: raw.start_time,
      endTime: raw.end_time,
      property: {
        id: raw.property_id,
        propertyCode: raw.property_code,
        propertyType: raw.property_type,
        category: raw.category,
        location: raw.location,
      },
      customer: {
        id: raw.customer_id,
        name: raw.customer_name,
        email: raw.customer_email,
      },
    };
  }

  /**
   * List all feedbacks scoped by role:
   *  - ADMIN  → all feedback across all properties
   *  - BROKER → only feedback for their own properties
   */
  async findAll(user: UserInfo): Promise<IVisitFeedbackDetail[]> {
    let rows: IRawVisitFeedbackDetail[];

    if (user.role === 'ADMIN') {
      rows = await this.db.query(VISIT_FEEDBACK_FIND_ALL_QUERY) as IRawVisitFeedbackDetail[];
    } else {
      rows = await this.db.query(VISIT_FEEDBACK_FIND_BY_BROKER_QUERY, [user.id]) as IRawVisitFeedbackDetail[];
    }

    return rows.map((r) => this.mapFeedbackDetail(r));
  }

  /**
   * List all feedbacks for a specific property.
   *  - ADMIN  → sees all feedback for the property
   *  - BROKER → only sees if they are the broker for this property
   */
  async findByProperty(propertyId: string, user: UserInfo): Promise<IVisitFeedbackDetail[]> {
    const isAdmin = user.role === 'ADMIN';
    const brokerId = isAdmin ? null : user.id;
    const skipBrokerCheck = isAdmin ? 1 : 0;

    const rows = await this.db.query(
      VISIT_FEEDBACK_FIND_BY_PROPERTY_QUERY,
      [propertyId, brokerId, skipBrokerCheck]
    ) as IRawVisitFeedbackDetail[];

    return rows.map((r) => this.mapFeedbackDetail(r));
  }

  /**
   * Submit feedback for a completed visit.
   * A customer can only submit feedback ONCE per visit — subsequent attempts throw 409 Conflict.
   */
  async createFeedback(visitRequestId: string, dto: CreateVisitFeedbackDto, user: UserInfo): Promise<IVisitFeedback | null> {
    const { interestLevel, feedback } = dto;

    // 1. Verify the visit exists and is active
    const [visit] = await this.db.query(VISIT_REQUEST_MINIMAL_FOR_FEEDBACK_QUERY, [visitRequestId]) as IRawVisitMinimal[];

    if (!visit) {
      throw new NotFoundException('Visit request not found');
    }

    // 2. Only completed visits can receive feedback
    if (visit.visit_request_status !== VisitRequestStatus.COMPLETED) {
      throw new ConflictException('Feedback can only be submitted for completed visits');
    }

    // 3. Only the customer who made the visit can submit feedback
    if (visit.customer_id !== user.id) {
      throw new ForbiddenException('Only the customer who requested the visit can provide feedback');
    }

    // 4. One-time feedback rule — reject if already submitted
    const [existing] = await this.db.query(VISIT_FEEDBACK_FIND_BY_VISIT_ID_QUERY, [visitRequestId]) as IRawVisitFeedback[];

    if (existing) {
      this.logger.warn(`Customer ${user.id} attempted to re-submit feedback for visit ${visitRequestId}`);
      throw new ConflictException('Feedback has already been submitted for this visit. It cannot be changed.');
    }

    // 5. Insert new feedback record
    const id = uuidv4();
    await this.db.query(VISIT_FEEDBACK_INSERT_QUERY, [id, visitRequestId, interestLevel, feedback]);
    const [inserted] = await this.db.query(VISIT_FEEDBACK_FIND_BY_ID_QUERY, [id]) as IRawVisitFeedback[];

    this.logger.log(`Feedback ${id} submitted by customer ${user.id} for visit ${visitRequestId}`);
    return this.mapFeedback(inserted);
  }
}

