import { Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { FloristsController } from './florists.controller';

@Module({
  controllers: [FloristsController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
