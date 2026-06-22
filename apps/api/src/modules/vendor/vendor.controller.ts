import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { VendorService } from './vendor.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('vendor')
@Roles(UserRole.VENDOR, UserRole.ADMIN)
export class VendorController {
  constructor(private vendorService: VendorService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: JwtPayload, @Query('shopId') shopId: string) {
    return this.vendorService.getDashboard(shopId, user.sub);
  }

  @Get('payouts')
  payouts(@CurrentUser() user: JwtPayload, @Query('shopId') shopId: string) {
    return this.vendorService.getPayouts(shopId, user.sub);
  }

  @Post('orders/:id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vendorService.acceptOrder(id, user.sub);
  }

  @Post('orders/:id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vendorService.rejectOrder(id, user.sub);
  }

  @Post('orders/:id/preparing')
  preparing(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vendorService.startPreparing(id, user.sub);
  }

  @Post('orders/:id/ready')
  ready(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vendorService.markReady(id, user.sub);
  }

  @Post('orders/:id/out-for-delivery')
  outForDelivery(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vendorService.handToRider(id, user.sub);
  }

  @Post('orders/:id/delivered')
  delivered(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.vendorService.markDelivered(id, user.sub);
  }
}
