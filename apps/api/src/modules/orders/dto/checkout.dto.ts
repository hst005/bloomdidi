import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CheckoutDto {
  @IsUUID()
  addressId!: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cardMessage?: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
