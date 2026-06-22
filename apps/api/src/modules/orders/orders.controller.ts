import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlaceOrderDto } from './dto/place-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ReviewOrderDto } from './dto/review-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  checkout(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutDto) {
    return this.ordersService.checkoutFromCart(user.sub, dto);
  }

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  placeOrder(@CurrentUser() user: JwtPayload, @Body() dto: PlaceOrderDto) {
    return this.ordersService.placeOrder(user.sub, dto);
  }

  @Get('mine')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  myOrders(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getCustomerOrders(user.sub);
  }

  @Get('shop/:shopId')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  shopOrders(@Param('shopId') shopId: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getShopOrders(shopId, user.sub);
  }

  @Get(':id/track')
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN)
  trackOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getOrderTrack(id, user.sub, user.role);
  }

  @Get(':id')
  getOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getOrder(id, user.sub, user.role);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  cancelOrder(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.cancelOrder(id, user.sub);
  }

  @Post(':id/review')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  reviewOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReviewOrderDto,
  ) {
    return this.ordersService.reviewOrder(id, user.sub, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.sub, dto);
  }
}
