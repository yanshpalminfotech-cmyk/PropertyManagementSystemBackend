import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSlot } from './entities/site-slot.entity';
import { SiteSlotsController } from './site-slots.controller';
import { SiteSlotsService } from './site-slots.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSlot])],
  controllers: [SiteSlotsController],
  providers: [SiteSlotsService],
  exports: [SiteSlotsService],
})
export class SiteSlotsModule {}
