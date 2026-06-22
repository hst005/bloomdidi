import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

const vendorTransitions = [
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.PICKED_UP,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
] as const;

export class UpdateOrderStatusDto {
  @IsEnum(vendorTransitions)
  status!: (typeof vendorTransitions)[number];
}
