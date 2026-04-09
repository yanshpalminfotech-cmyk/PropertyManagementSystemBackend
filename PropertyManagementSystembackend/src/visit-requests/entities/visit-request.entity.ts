import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../user/entities/user.entity';
import { SiteSlot } from '../../site-slots/entities/site-slot.entity';
import { STATUS } from '../../common/enums/status.constant';

export enum VisitRequestStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('visit_requests')
export class VisitRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'visit_code', type: 'varchar', length: 50 })
  visitCode!: string;

  @Column({ name: 'property_id', type: 'varchar', length: 36 })
  propertyId!: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  @Column({ name: 'customer_id', type: 'varchar', length: 36 })
  @Index('idx_visit_customer')
  customerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customer_id' })
  customer!: User;

  @Column({ name: 'slot_id', type: 'varchar', length: 36 })
  slotId!: string;

  @ManyToOne(() => SiteSlot)
  @JoinColumn({ name: 'slot_id' })
  slot!: SiteSlot;

  @Column({
    name: 'visit_request_status',
    type: 'enum',
    enum: VisitRequestStatus,
    default: VisitRequestStatus.PENDING,
  })
  visitRequestStatus!: VisitRequestStatus;

  @Column({
    type: 'tinyint',
    default: STATUS.ACTIVE,
  })
  status!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
