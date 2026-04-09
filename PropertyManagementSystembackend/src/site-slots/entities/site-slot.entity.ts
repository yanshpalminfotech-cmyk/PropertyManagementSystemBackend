import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  Unique,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { STATUS } from '../../common/enums/status.constant';

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  LOCKED = 'LOCKED',
  REQUESTED = 'REQUESTED'
}

@Entity('site_slots')
@Check(`end_time > start_time`)
@Unique('idx_slots_property_date_time', ['propertyId', 'visitDate', 'startTime'])
@Index('idx_slots_property_date', ['propertyId', 'visitDate'])
export class SiteSlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'property_id', type: 'varchar', length: 36 })
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property!: Property;

  @Column({ name: 'visit_date', type: 'date' })
  visitDate!: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({
    name: 'slot_status',
    type: 'enum',
    enum: SlotStatus,
    default: SlotStatus.AVAILABLE,
  })
  slotStatus!: SlotStatus;

  @Column({
    type: 'tinyint',
    default: STATUS.ACTIVE,
  })
  status!: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil?: Date;

  @Column({ name: 'locked_by', type: 'varchar', length: 36, nullable: true })
  lockedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
