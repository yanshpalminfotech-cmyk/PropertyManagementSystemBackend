import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { VisitRequest } from '../../visit-requests/entities/visit-request.entity';

export enum InterestLevel {
  NOT_INTERESTED = 'NOT_INTERESTED',
  MAYBE = 'MAYBE',
  INTERESTED = 'INTERESTED',
  VERY_INTERESTED = 'VERY_INTERESTED',
}

@Entity('visit_feedback')
export class VisitFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'visit_request_id', type: 'varchar', length: 36 })
  @Index({ unique: true })
  visitRequestId!: string;

  // // 🔗 Relation with VisitRequest (Commented out to decouple from TypeORM metadata logic)
  // @OneToOne(() => VisitRequest, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'visit_request_id' })
  // visitRequest!: VisitRequest;

  @Column({
    name: 'interest_level',
    type: 'enum',
    enum: InterestLevel,
    nullable: true,
  })
  interestLevel!: InterestLevel;

  @Column({ type: 'text', nullable: true })
  feedback!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
