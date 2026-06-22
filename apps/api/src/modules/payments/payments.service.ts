import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private rzp: Razorpay | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (keyId && keySecret) {
      this.rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  isConfigured(): boolean {
    return !!this.rzp;
  }

  /** POST /payments/create-order — amount computed server-side from order.total (paise) */
  async createRazorpayOrder(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) throw new ForbiddenException('Not your order');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not awaiting payment');
    }

    const amountPaise = order.total;

    if (!this.rzp) {
      const stubId = `order_stub_${orderId.slice(0, 8)}`;
      await this.prisma.payment.update({
        where: { orderId },
        data: { razorpayOrderId: stubId, status: PaymentStatus.PENDING },
      });
      return {
        razorpayOrderId: stubId,
        amount: amountPaise,
        currency: 'INR',
        keyId: 'rzp_test_stub',
        stub: true,
      };
    }

    const rzpOrder = await this.rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.id,
      notes: { bloomdidi_order_id: order.id },
    });

    await this.prisma.payment.update({
      where: { orderId },
      data: { razorpayOrderId: rzpOrder.id, status: PaymentStatus.PENDING },
    });

    return {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: this.config.get<string>('RAZORPAY_KEY_ID'),
    };
  }

  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    const secret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      // Dev stub mode — accept stub signatures
      return razorpayOrderId.startsWith('order_stub_');
    }
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return expected === razorpaySignature;
  }

  /** POST /payments/verify */
  async confirmPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    customerId: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { order: { include: { shop: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.order.customerId !== customerId) throw new ForbiddenException('Not your order');

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          status: PaymentStatus.CAPTURED,
        },
      });

      const targetStatus =
        payment.order.scheduledFor &&
        payment.order.scheduledFor.getTime() > Date.now() + 60 * 60 * 1000
          ? OrderStatus.SCHEDULED
          : OrderStatus.PLACED;

      return tx.order.update({
        where: { id: payment.orderId },
        data: { status: targetStatus },
        include: { shop: true },
      });
    });

    if (order.status === OrderStatus.PLACED) {
      await this.notifications.notifyVendorNewOrder(order.shop.ownerId, order.id);
    }

    return { orderId: order.id, status: order.status };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return expected === signature;
  }

  /** Webhook handler — source of truth */
  async handleWebhookEvent(event: {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; status: string } };
      refund?: { entity: { payment_id: string } };
    };
  }) {
    switch (event.event) {
      case 'payment.captured': {
        const entity = event.payload.payment?.entity;
        if (!entity) break;
        await this.capturePayment(entity.order_id, entity.id);
        break;
      }
      case 'payment.failed': {
        const entity = event.payload.payment?.entity;
        if (!entity) break;
        await this.failPayment(entity.order_id);
        break;
      }
      case 'refund.processed': {
        const entity = event.payload.refund?.entity;
        if (!entity) break;
        await this.prisma.payment.updateMany({
          where: { razorpayPaymentId: entity.payment_id },
          data: { status: PaymentStatus.REFUNDED },
        });
        break;
      }
      default:
        this.logger.log(`Unhandled webhook event: ${event.event}`);
    }
    return { received: true };
  }

  private async capturePayment(rzpOrderId: string, rzpPaymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: rzpOrderId },
      include: { order: { include: { shop: true } } },
    });
    if (!payment || payment.status === PaymentStatus.CAPTURED) return;

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { razorpayPaymentId: rzpPaymentId, status: PaymentStatus.CAPTURED },
      });
      const targetStatus =
        payment.order.scheduledFor &&
        payment.order.scheduledFor.getTime() > Date.now() + 60 * 60 * 1000
          ? OrderStatus.SCHEDULED
          : OrderStatus.PLACED;
      return tx.order.update({
        where: { id: payment.orderId, status: OrderStatus.PENDING_PAYMENT },
        data: { status: targetStatus },
        include: { shop: true },
      });
    });

    if (order?.status === OrderStatus.PLACED) {
      await this.notifications.notifyVendorNewOrder(order.shop.ownerId, order.id);
    }
  }

  private async failPayment(rzpOrderId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { razorpayOrderId: rzpOrderId } });
    if (!payment) return;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.PAYMENT_FAILED },
      }),
    ]);
  }

  async issueRefund(orderId: string, reason = 'vendor_rejected') {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.CAPTURED },
    });
    if (!payment?.razorpayPaymentId) throw new BadRequestException('No captured payment to refund');

    if (this.rzp) {
      await this.rzp.payments.refund(payment.razorpayPaymentId, {
        notes: { reason, bloomdidi_order_id: orderId },
      });
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      }),
    ]);
  }
}
