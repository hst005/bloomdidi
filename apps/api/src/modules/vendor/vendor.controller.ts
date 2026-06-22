import { Body, Controller, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { VendorService } from './vendor.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateVendorShopDto } from './dto/update-shop.dto';
import { PatchStoreDto, PatchStoreRadiusDto, PatchStoreStatusDto } from './dto/patch-store.dto';

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

  @Get('earnings')
  earnings(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId: string,
    @Query('range') range = '7d',
  ) {
    return this.vendorService.getEarnings(shopId, user.sub, range);
  }

  @Get('payouts/:id/statement')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment')
  async payoutStatement(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId: string,
    @Param('id') id: string,
  ) {
    const csv = await this.vendorService.getPayoutStatement(shopId, user.sub, id);
    return csv;
  }

  @Get('shop')
  shopProfile(@CurrentUser() user: JwtPayload, @Query('shopId') shopId: string) {
    return this.vendorService.getShopProfile(shopId, user.sub);
  }

  @Get('store')
  storeProfile(@CurrentUser() user: JwtPayload, @Query('shopId') shopId: string) {
    return this.vendorService.getStore(shopId, user.sub);
  }

  @Patch('store/status')
  patchStoreStatus(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId: string,
    @Body() dto: PatchStoreStatusDto,
  ) {
    return this.vendorService.patchStoreStatus(shopId, user.sub, dto.isOpen);
  }

  @Patch('store/radius')
  patchStoreRadius(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId: string,
    @Body() dto: PatchStoreRadiusDto,
  ) {
    return this.vendorService.patchStoreRadius(shopId, user.sub, dto.serviceRadiusKm);
  }

  @Patch('store')
  patchStore(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId: string,
    @Body() dto: PatchStoreDto,
  ) {
    return this.vendorService.patchStore(shopId, user.sub, dto);
  }

  @Patch('shop')
  updateShop(
    @CurrentUser() user: JwtPayload,
    @Query('shopId') shopId: string,
    @Body() dto: UpdateVendorShopDto,
  ) {
    return this.vendorService.updateShop(shopId, user.sub, dto);
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
