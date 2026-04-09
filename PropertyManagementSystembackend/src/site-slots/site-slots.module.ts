import { Module } from '@nestjs/common';
import { SiteSlotsController } from './site-slots.controller';
import { SiteSlotsService } from './site-slots.service';

@Module({
  controllers: [SiteSlotsController],
  providers: [SiteSlotsService],
  exports: [SiteSlotsService],
})
export class SiteSlotsModule {}
