import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyCodeService } from './property-code.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyCodeService],
  exports: [PropertiesService, PropertyCodeService],
})
export class PropertiesModule { }
