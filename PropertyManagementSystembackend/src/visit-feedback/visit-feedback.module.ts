import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitFeedback } from './entities/visit-feedback.entity';
import { VisitFeedbackService } from './visit-feedback.service';

@Module({
  imports: [TypeOrmModule.forFeature([VisitFeedback])],
  controllers: [],
  providers: [VisitFeedbackService],
  exports: [VisitFeedbackService],
})
export class VisitFeedbackModule {}
