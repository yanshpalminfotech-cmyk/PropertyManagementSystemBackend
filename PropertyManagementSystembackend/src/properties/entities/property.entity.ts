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
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../user/entities/user.entity';

import { STATUS } from '../../common/enums/status.constant';

export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
}

export enum PropertyCategory {
  BHK1 = '1BHK',
  BHK2 = '2BHK',
  BHK3 = '3BHK',
  VILLA = 'VILLA',
  PLOT = 'PLOT',
  SHOP = 'SHOP',
  OFFICE = 'OFFICE',
}

export enum TransactionType {
  SALE = 'SALE',
  RENT = 'RENT',
}

export enum PropertyLocation {
  ADAJAN = 'ADAJAN',
  VESU = 'VESU',
  CITYLIGHT = 'CITYLIGHT',
  PIPLOD = 'PIPLOD',
  PAL = 'PAL',
  MAGDALLA = 'MAGDALLA',
}

export enum FurnishingStatus {
  FURNISHED = 'FURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  UNFURNISHED = 'UNFURNISHED',
}

export enum PropertyAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  UNDER_NEGOTIATION = 'UNDER_NEGOTIATION',
}

@Entity('properties')
@Check(`price > 0`)
@Check(`carpet_area < built_up_area`)
@Check(`floor_number IS NULL OR total_floors IS NULL OR floor_number <= total_floors`)
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'property_code', type: 'varchar', length: 50 })
  propertyCode!: string;

  @Column({ name: 'broker_id', type: 'varchar', length: 36 })
  brokerId!: string;

  // // 🔗 Relation with User (Commented out to decouple from TypeORM metadata logic)
  // @ManyToOne(() => User, (user) => user.properties)
  // @JoinColumn({ name: 'broker_id' })
  // broker!: User;

  @Column({
    name: 'property_type',
    type: 'enum',
    enum: PropertyType,
  })
  propertyType!: PropertyType;

  @Column({
    type: 'enum',
    enum: PropertyCategory,
  })
  category!: PropertyCategory;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TransactionType,
  })
  transactionType!: TransactionType;

  @Column({
    type: 'enum',
    enum: PropertyLocation,
  })
  location!: PropertyLocation;

  @Column({ type: 'text' })
  address!: string;

  @Exclude() // 🔒 Hidden from customers
  @Column({ name: 'owner_name', type: 'varchar', length: 255 })
  ownerName!: string;

  @Exclude() // 🔒 Hidden from customers
  @Column({ name: 'owner_mobile_number', type: 'varchar', length: 20 })
  ownerMobileNumber!: string;

  @Column({ name: 'carpet_area', type: 'decimal', precision: 10, scale: 2 })
  carpetArea!: number;

  @Column({ name: 'built_up_area', type: 'decimal', precision: 10, scale: 2 })
  builtUpArea!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({ name: 'maintenance_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maintenanceCost?: number;

  @Exclude() // 🔒 Hidden from customers
  @Column({ name: 'broker_commission', type: 'decimal', precision: 10, scale: 2, nullable: true })
  brokerCommission?: number;

  @Column({
    type: 'enum',
    enum: FurnishingStatus,
  })
  furnishing!: FurnishingStatus;

  @Column({ type: 'boolean', default: false })
  parking!: boolean;

  @Column({ name: 'floor_number', type: 'int', nullable: true })
  floorNumber?: number;

  @Column({ name: 'total_floors', type: 'int', nullable: true })
  totalFloors?: number;

  @Column({ name: 'property_age', type: 'int', nullable: true })
  propertyAge?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  facing?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true, comment: 'Comma-separated list of amenities e.g. "WiFi,Gym,Pool"' })
  amenities?: string;

  @Column({ name: 'available_for_visit', type: 'boolean', default: true })
  availableForVisit!: boolean;

  @Column({
    name: 'propertiesstatus',
    type: 'enum',
    enum: PropertyAvailabilityStatus,
    default: PropertyAvailabilityStatus.AVAILABLE,
  })
  propertiesstatus!: PropertyAvailabilityStatus;

  @Column({ name: 'posted_date', type: 'date', nullable: true })
  postedDate?: Date;
  
  @Column({ name: 'status_change_date', type: 'datetime', nullable: true })
  statusChangeDate?: Date;

  @Index()
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
