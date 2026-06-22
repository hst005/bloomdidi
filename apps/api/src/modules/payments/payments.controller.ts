import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePaymentOrderDto, VerifyPaymentDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-order')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreatePaymentOrderDto) {
    return this.paymentsService.createRazorpayOrder(dto.orderId, user.sub);
  }

  @Post('verify')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  verify(@CurrentUser() user: JwtPayload, @Body() dto: VerifyPaymentDto) {
    const valid = this.paymentsService.verifyPaymentSignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    if (!valid) {
      throw new BadRequestException('Invalid payment signature');
    }
    return this.paymentsService.confirmPayment(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      user.sub,
    );
  }
}
