import { Module } from '@nestjs/common';
import { VisitFeedbackService } from './visit-feedback.service';
import { VisitFeedbackController } from './visit-feedback.controller';

@Module({
  controllers: [VisitFeedbackController],
  providers: [VisitFeedbackService],
  exports: [VisitFeedbackService],
})
export class VisitFeedbackModule {}

