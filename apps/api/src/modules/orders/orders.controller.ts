import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PlaceOrderDto } from './dto/place-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';

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

  @Get(':id')
  getOrder(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.ordersService.getOrder(id, user.sub, user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, user.sub, dto);
  }
}
