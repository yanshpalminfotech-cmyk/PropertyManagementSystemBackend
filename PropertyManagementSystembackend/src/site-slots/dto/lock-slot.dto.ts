import { IsUUID, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockSlotDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID of the property' })
  @IsUUID()
  propertyId!: string;

  @ApiProperty({ example: '2025-04-15', description: 'Date of the visit (YYYY-MM-DD)' })
  @IsDateString()
  visitDate!: string;

  @ApiProperty({ example: '11:00:00', description: 'Start time of the visit' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '12:00:00', description: 'End time of the visit' })
  @IsString()
  endTime!: string;
}
