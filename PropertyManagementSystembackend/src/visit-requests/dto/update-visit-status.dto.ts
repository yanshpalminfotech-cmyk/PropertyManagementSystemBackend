import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VisitRequestStatus } from '../entities/visit-request.entity';

export class UpdateVisitStatusDto {
  @ApiProperty({
    enum: [VisitRequestStatus.CONFIRMED, VisitRequestStatus.CANCELLED, VisitRequestStatus.COMPLETED],
    example: VisitRequestStatus.CONFIRMED,
  })
  @IsEnum(VisitRequestStatus)
  @IsNotEmpty()
  status!: VisitRequestStatus;
}
