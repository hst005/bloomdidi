import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/roles.decorator';
import { GeoService, FloristSort } from './geo.service';
import { DiscoverFloristsDto } from './dto/discover-florists.dto';

@Controller('florists')
export class FloristsController {
  constructor(private geo: GeoService) {}

  @Public()
  @Get()
  discover(@Query() query: DiscoverFloristsDto) {
    return this.geo.discoverFlorists(
      query.lat,
      query.lng,
      (query.sort as FloristSort) ?? 'nearest',
      query.q,
      query.maxPrice,
    );
  }
}
