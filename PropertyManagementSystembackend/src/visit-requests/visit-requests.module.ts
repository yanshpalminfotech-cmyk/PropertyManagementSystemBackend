import { Module } from '@nestjs/common';
import { VisitRequestsService } from './visit-requests.service';
import { VisitRequestCodeService } from './visit-request-code.service';
import { VisitRequestsController } from './visit-requests.controller';
import { SiteSlotsModule } from '../site-slots/site-slots.module';
import { VisitFeedbackModule } from '../visit-feedback/visit-feedback.module';

@Module({
  imports: [
    SiteSlotsModule,
    VisitFeedbackModule,
  ],
  controllers: [VisitRequestsController],
  providers: [VisitRequestsService, VisitRequestCodeService],
  exports: [VisitRequestsService],
})
export class VisitRequestsModule {}
