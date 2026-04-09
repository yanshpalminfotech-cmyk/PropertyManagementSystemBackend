import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PropertyAvailabilityStatus } from '../entities/property.entity';

export class UpdatePropertyAvailabilityDto {
  @ApiProperty({
    enum: PropertyAvailabilityStatus,
    description: 'The availability status of the property',
    example: PropertyAvailabilityStatus.SOLD,
  })
  @IsEnum(PropertyAvailabilityStatus)
  @IsNotEmpty()
  propertiesstatus!: PropertyAvailabilityStatus;
}
