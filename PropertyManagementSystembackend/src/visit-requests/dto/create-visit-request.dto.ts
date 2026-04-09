import { IsString, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVisitRequestDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  propertyId!: string;

  @ApiProperty({ example: '2025-04-15' })
  @IsDateString()
  @IsNotEmpty()
  visitDate!: string;

  @ApiProperty({ example: '11:00:00' })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: '12:00:00' })
  @IsString()
  @IsNotEmpty()
  endTime!: string;
}
