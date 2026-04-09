import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  PropertyType,
  PropertyCategory,
  TransactionType,
  PropertyLocation,
  PropertyAvailabilityStatus,
} from '../entities/property.entity';

export enum AdminPropertyQueryStatus {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

export class PropertyQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Search in address or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: PropertyType, required: false })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiProperty({ enum: PropertyCategory, required: false })
  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @ApiProperty({ enum: TransactionType, required: false })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiProperty({ enum: PropertyLocation, required: false })
  @IsOptional()
  @IsEnum(PropertyLocation)
  location?: PropertyLocation;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @Type(() => Boolean)
  availableForVisit?: boolean;

  @ApiProperty({ enum: PropertyAvailabilityStatus, required: false, default: PropertyAvailabilityStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(PropertyAvailabilityStatus)
  propertiesstatus?: PropertyAvailabilityStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ enum: AdminPropertyQueryStatus, required: false, description: 'Filter by property status (ADMIN ONLY: ALL, ACTIVE, INACTIVE, DELETED)' })
  @IsOptional()
  @IsEnum(AdminPropertyQueryStatus)
  status?: AdminPropertyQueryStatus;
}
