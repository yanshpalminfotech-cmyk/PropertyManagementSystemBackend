import { Module } from '@nestjs/common';
import { VisitFeedbackService } from './visit-feedback.service';

@Module({
  controllers: [],
  providers: [VisitFeedbackService],
  exports: [VisitFeedbackService],
})
export class VisitFeedbackModule {}
