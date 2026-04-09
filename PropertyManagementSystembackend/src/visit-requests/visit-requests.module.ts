import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitRequest } from './entities/visit-request.entity';
import { VisitRequestsService } from './visit-requests.service';
import { VisitRequestCodeService } from './visit-request-code.service';
import { VisitRequestsController } from './visit-requests.controller';
import { SiteSlotsModule } from '../site-slots/site-slots.module';
import { VisitFeedbackModule } from '../visit-feedback/visit-feedback.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VisitRequest]),
    SiteSlotsModule,
    VisitFeedbackModule,
  ],
  controllers: [VisitRequestsController],
  providers: [VisitRequestsService, VisitRequestCodeService],
  exports: [VisitRequestsService],
})
export class VisitRequestsModule {}
