import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  IsPositive,
  IsInt,
  IsDecimal,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PropertyType,
  PropertyCategory,
  TransactionType,
  PropertyLocation,
  FurnishingStatus,
  PropertyAvailabilityStatus,
} from '../entities/property.entity';

export class CreatePropertyDto {
  @ApiProperty({ enum: PropertyType })
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @ApiProperty({ enum: PropertyCategory })
  @IsEnum(PropertyCategory)
  category!: PropertyCategory;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @ApiProperty({ enum: PropertyLocation })
  @IsEnum(PropertyLocation)
  location!: PropertyLocation;

  @ApiProperty({ example: '123 Street Name, Adajan, Surat' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ownerName!: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ownerMobileNumber!: string;

  @ApiProperty({ example: 1200, description: 'Must be positive and less than builtUpArea' })
  @IsNumber()
  @IsPositive()
  carpetArea!: number;

  @ApiProperty({ example: 1500, description: 'Must be positive and greater than carpetArea' })
  @IsNumber()
  @IsPositive()
  builtUpArea!: number;

  @ApiProperty({ example: 5000000, description: 'Must be a positive number' })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({ example: 2000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maintenanceCost?: number;

  @ApiProperty({ example: 1000, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  brokerCommission?: number;

  @ApiProperty({ enum: FurnishingStatus })
  @IsEnum(FurnishingStatus)
  furnishing!: FurnishingStatus;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  parking?: boolean;

  @ApiProperty({ example: 4, required: false, description: 'Must be ≤ totalFloors when both are provided' })
  @IsInt()
  @IsOptional()
  @IsPositive()
  floorNumber?: number;

  @ApiProperty({ example: 10, required: false, description: 'Total number of floors in the building' })
  @IsInt()
  @IsOptional()
  @IsPositive()
  totalFloors?: number;

  @ApiProperty({ example: 5, required: false, description: 'Age of the property in years (must be ≥ 0)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  propertyAge?: number;

  @ApiProperty({ example: 'North', required: false })
  @IsString()
  @IsOptional()
  facing?: string;

  @ApiProperty({ example: 'A beautiful luxury apartment', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'WiFi,Gym,Pool,Parking,Security',
    required: false,
    description: 'Comma-separated list of amenities',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9\s_-]+(,[a-zA-Z0-9\s_-]+)*$/, {
    message: 'Amenities must be a comma-separated list of words (e.g., "WiFi, Gym, Pool").',
  })
  amenities?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  availableForVisit?: boolean;

  @ApiProperty({ enum: PropertyAvailabilityStatus, default: PropertyAvailabilityStatus.AVAILABLE })
  @IsEnum(PropertyAvailabilityStatus)
  @IsOptional()
  propertiesstatus?: PropertyAvailabilityStatus;

  @ApiProperty({ example: '2025-04-07', required: false })
  @IsOptional()
  postedDate?: Date;
}