import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { ORDER_TRANSITIONS } from '@bloomdidi/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CartService } from '../cart/cart.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ReviewOrderDto } from './dto/review-order.dto';

const TRACK_STEPS = [
  'confirmed',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
] as const;

const STATUS_TO_TRACK: Record<string, string> = {
  PENDING_PAYMENT: 'confirmed',
  SCHEDULED: 'confirmed',
  PLACED: 'confirmed',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'out_for_delivery',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'rejected',
  REFUNDED: 'rejected',
  PAYMENT_FAILED: 'rejected',
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventory: InventoryService,
    private payments: PaymentsService,
    private notifications: NotificationsService,
    private cart: CartService,
  ) {}

  /** Checkout from server-side cart */
  async checkoutFromCart(customerId: string, dto: CheckoutDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: customerId },
      include: { items: true },
    });
    if (!cart?.items.length) throw new BadRequestException('Cart is empty');

    const placeDto: PlaceOrderDto = {
      shopId: cart.shopId,
      addressId: dto.addressId,
      scheduledFor: dto.scheduledFor,
      cardMessage: dto.cardMessage,
      paymentMethod: dto.paymentMethod,
      items: cart.items.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        customizations: i.customizations as unknown as PlaceOrderDto['items'][0]['customizations'],
      })),
    };

    const order = await this.placeOrder(customerId, placeDto);
    return order;
  }

  async placeOrder(customerId: string, dto: PlaceOrderDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId: customerId },
    });
    if (!address) throw new BadRequestException('Invalid delivery address');

    const shop = await this.prisma.shop.findUnique({ where: { id: dto.shopId } });
    if (!shop?.isOpen) throw new BadRequestException('Shop is closed');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId: dto.shopId },
      include: { customizations: true },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Invalid products in cart');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const lineItems: {
      productId: string;
      productName: string;
      qty: number;
      unitPrice: number;
      customizations: Prisma.InputJsonValue;
      lineTotal: number;
    }[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      const customizationTotal = item.customizations.reduce((s, c) => s + c.priceDelta, 0);
      const unitPrice = product.basePrice + customizationTotal;
      const lineTotal = unitPrice * item.qty;
      subtotal += lineTotal;
      lineItems.push({
        productId: product.id,
        productName: product.name,
        qty: item.qty,
        unitPrice,
        customizations: item.customizations as unknown as Prisma.InputJsonValue,
        lineTotal,
      });
    }

    const deliveryFee = shop.deliveryFeePaise;
    const total = subtotal + deliveryFee;

    const isOnline = dto.paymentMethod !== PaymentMethod.COD;
    const scheduledFor = dto.scheduledFor ? new Date(dto.scheduledFor) : null;
    const isFutureScheduled =
      !isOnline && scheduledFor && scheduledFor.getTime() > Date.now() + 60 * 60 * 1000;

    let initialStatus: OrderStatus;
    if (isOnline) {
      initialStatus = OrderStatus.PENDING_PAYMENT;
    } else if (isFutureScheduled) {
      initialStatus = OrderStatus.SCHEDULED;
    } else {
      initialStatus = OrderStatus.PLACED;
    }

    const order = await this.prisma.$transaction(async (tx) => {
      await this.inventory.decrementStock(
        tx,
        dto.items.map((i) => ({ productId: i.productId, qty: i.qty })),
      );

      const created = await tx.order.create({
        data: {
          customerId,
          shopId: dto.shopId,
          addressId: dto.addressId,
          status: initialStatus,
          scheduledFor,
          subtotal,
          deliveryFee,
          total,
          cardMessage: dto.cardMessage,
          items: { create: lineItems },
        },
        include: {
          items: true,
          shop: true,
          address: true,
        },
      });

      await tx.payment.create({
        data: {
          orderId: created.id,
          amount: total,
          method: dto.paymentMethod as PaymentMethod,
          status: PaymentStatus.PENDING,
        },
      });

      return created;
    });

    if (initialStatus === OrderStatus.PLACED) {
      await this.notifications.notifyVendorNewOrder(order.shop.ownerId, order.id);
    }

    return this.mapOrder(order);
  }

  async getCustomerOrders(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true, shop: true, address: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  async getShopOrders(shopId: string, ownerId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        shopId,
        status: { notIn: [OrderStatus.SCHEDULED, OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED] },
      },
      include: { items: true, shop: true, address: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  async getOrder(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shop: true, address: true, payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isCustomer = order.customerId === userId;
    const isVendor = order.shop.ownerId === userId;
    if (!isCustomer && !isVendor && role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized');
    }

    return this.mapOrder(order);
  }

  async getOrderTrack(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shop: { include: { owner: true } },
        address: true,
        payment: true,
        review: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isCustomer = order.customerId === userId;
    const isVendor = order.shop.ownerId === userId;
    if (!isCustomer && !isVendor && role !== 'ADMIN') {
      throw new ForbiddenException('Not authorized');
    }

    const trackStatus = STATUS_TO_TRACK[order.status] ?? 'confirmed';
    const trackIdx = TRACK_STEPS.indexOf(trackStatus as (typeof TRACK_STEPS)[number]);

    return {
      id: order.id,
      code: `BD-${order.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`,
      vendorName: order.shop.name,
      vendorPhone: order.shop.owner.phone.replace(/\D/g, ''),
      status: trackStatus,
      items: order.items.map((i) => ({
        id: i.id,
        name: i.productName,
        qty: i.qty,
        price: i.unitPrice,
      })),
      deliveryFee: order.deliveryFee,
      total: order.total,
      deliveryAddress: [order.address.line1, order.address.line2, order.address.city]
        .filter(Boolean)
        .join(', '),
      timeline: this.buildTrackTimeline(order.createdAt, order.updatedAt, trackIdx, trackStatus),
      reviewed: !!order.review,
    };
  }

  async cancelOrder(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) throw new ForbiddenException('Not authorized');
    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.ACCEPTED) {
      throw new BadRequestException('This order can no longer be cancelled');
    }

    if (order.payment?.status === PaymentStatus.CAPTURED) {
      await this.payments.issueRefund(orderId, 'customer_cancelled');
      const updated = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, shop: true, address: true },
      });
      return this.mapOrder(updated!);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: { items: true, shop: true, address: true },
    });

    await this.notifications.notifyCustomerOrderUpdate(customerId, orderId, OrderStatus.CANCELLED);
    return this.mapOrder(updated);
  }

  async reviewOrder(orderId: string, customerId: string, dto: ReviewOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customerId) throw new ForbiddenException('Not authorized');
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can only review delivered orders');
    }
    if (order.review) throw new BadRequestException('Already reviewed');

    await this.prisma.review.create({
      data: {
        orderId,
        shopId: order.shopId,
        userId: customerId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });

    const agg = await this.prisma.review.aggregate({
      where: { shopId: order.shopId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.shop.update({
      where: { id: order.shopId },
      data: {
        rating: agg._avg.rating ?? dto.rating,
        reviewCount: agg._count,
      },
    });

    return { ok: true };
  }

  private buildTrackTimeline(
    createdAt: Date,
    updatedAt: Date,
    trackIdx: number,
    trackStatus: string,
  ): Record<string, string> {
    if (trackStatus === 'rejected') return {};

    const fmt = (d: Date) =>
      d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

    const timeline: Record<string, string> = {};
    for (let i = 0; i < TRACK_STEPS.length; i++) {
      if (i > trackIdx) break;
      if (i === 0) {
        timeline[TRACK_STEPS[i]] = fmt(createdAt);
      } else if (i < trackIdx) {
        timeline[TRACK_STEPS[i]] = fmt(
          new Date(createdAt.getTime() + i * 3 * 60 * 1000),
        );
      } else if (i === trackIdx) {
        timeline[TRACK_STEPS[i]] = fmt(updatedAt);
      }
    }
    return timeline;
  }

  async updateStatus(orderId: string, ownerId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true, items: true, address: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shop.ownerId !== ownerId) throw new ForbiddenException('Not authorized');

    const allowed = ORDER_TRANSITIONS[order.status as keyof typeof ORDER_TRANSITIONS] ?? [];
    if (!allowed.includes(dto.status as typeof allowed[number])) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    if (dto.status === 'CANCELLED' && order.status === OrderStatus.PLACED) {
      const payment = await this.prisma.payment.findUnique({ where: { orderId } });
      if (payment?.status === PaymentStatus.CAPTURED) {
        await this.payments.issueRefund(orderId, 'vendor_rejected');
        return this.getOrder(orderId, ownerId, 'VENDOR');
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status as OrderStatus },
      include: { items: true, shop: true, address: true },
    });

    await this.notifications.notifyCustomerOrderUpdate(order.customerId, orderId, dto.status);

    return this.mapOrder(updated);
  }

  async activateScheduledOrders() {
    // Handled by SchedulingService cron — kept for manual/admin trigger if needed
    return { activated: 0 };
  }

  private mapOrder(order: {
    id: string;
    customerId: string;
    shopId: string;
    status: OrderStatus;
    scheduledFor: Date | null;
    subtotal: number;
    deliveryFee: number;
    total: number;
    cardMessage: string | null;
    createdAt: Date;
    shop?: { name: string; ownerId: string };
    address?: {
      id: string;
      label: string | null;
      recipientName: string;
      phone: string;
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      pincode: string;
      lat: number | null;
      lng: number | null;
    };
    items: {
      id: string;
      productId: string;
      productName: string;
      qty: number;
      unitPrice: number;
      customizations: unknown;
      lineTotal: number;
    }[];
  }) {
    return {
      id: order.id,
      customerId: order.customerId,
      shopId: order.shopId,
      shopName: order.shop?.name,
      status: order.status,
      scheduledFor: order.scheduledFor?.toISOString() ?? null,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      cardMessage: order.cardMessage,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        qty: i.qty,
        unitPrice: i.unitPrice,
        customizations: i.customizations,
        lineTotal: i.lineTotal,
      })),
      address: order.address
        ? {
            id: order.address.id,
            label: order.address.label,
            recipientName: order.address.recipientName,
            phone: order.address.phone,
            line1: order.address.line1,
            line2: order.address.line2,
            city: order.address.city,
            state: order.address.state,
            pincode: order.address.pincode,
            location:
              order.address.lat != null && order.address.lng != null
                ? { lat: order.address.lat, lng: order.address.lng }
                : null,
          }
        : {
            id: '',
            label: null,
            recipientName: '—',
            phone: '',
            line1: 'Address unavailable',
            line2: null,
            city: '',
            state: '',
            pincode: '',
            location: null,
          },
      createdAt: order.createdAt.toISOString(),
    };
  }
}
