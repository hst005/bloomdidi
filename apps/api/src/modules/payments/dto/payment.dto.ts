import { IsString, IsUUID } from 'class-validator';

export class CreatePaymentOrderDto {
  @IsUUID()
  orderId!: string;
}

export class VerifyPaymentDto {
  @IsString()
  razorpay_order_id!: string;

  @IsString()
  razorpay_payment_id!: string;

  @IsString()
  razorpay_signature!: string;
}
