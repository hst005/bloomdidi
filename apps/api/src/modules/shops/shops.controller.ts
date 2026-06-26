import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { Public } from '../../common/decorators/roles.decorator';
import { DiscoverShopsDto } from './dto/discover.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('shops')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Public()
  @Get('discover')
  discover(@Query() query: DiscoverShopsDto) {
    return this.shopsService.discover(query.lat, query.lng, query.radiusKm);
  }

  @Get('vendor/mine')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  findMine(@CurrentUser() user: JwtPayload) {
    return this.shopsService.findByOwner(user.sub, user.phone);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findById(id);
  }
}
