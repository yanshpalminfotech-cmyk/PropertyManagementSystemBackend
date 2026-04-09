import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InterestLevel } from '../entities/visit-feedback.entity';

export class CreateVisitFeedbackDto {
  @ApiProperty({
    enum: InterestLevel,
    example: InterestLevel.INTERESTED,
  })
  @IsEnum(InterestLevel)
  @IsNotEmpty()
  interestLevel!: InterestLevel;

  @ApiProperty({
    example: 'The property is in a great location, but I am looking for a larger kitchen.',
  })
  @IsString()
  @IsOptional()
  feedback?: string;
}
