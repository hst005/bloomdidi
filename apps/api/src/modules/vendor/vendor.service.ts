import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class VendorService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private orders: OrdersService,
  ) {}

  private async assertShopOwner(shopId: string, ownerId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized for this shop');
    }
    return shop;
  }

  private async assertOrderOwner(orderId: string, ownerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shop.ownerId !== ownerId) throw new ForbiddenException('Not authorized');
    return order;
  }

  async getDashboard(shopId: string, ownerId: string) {
    const shop = await this.assertShopOwner(shopId, ownerId);
    const { commissionPct } = await this.settings.get();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [pendingCount, todayOrders, deliveredOrders] = await Promise.all([
      this.prisma.order.count({
        where: {
          shopId,
          status: { in: [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY] },
        },
      }),
      this.prisma.order.findMany({
        where: { shopId, createdAt: { gte: startOfDay }, status: { not: OrderStatus.PENDING_PAYMENT } },
        select: { total: true, subtotal: true },
      }),
      this.prisma.order.findMany({
        where: { shopId, status: OrderStatus.DELIVERED },
        select: { subtotal: true, createdAt: true },
      }),
    ]);

    const todayGross = todayOrders.reduce((s, o) => s + o.subtotal, 0);
    const lifetimeGross = deliveredOrders.reduce((s, o) => s + o.subtotal, 0);
    const commission = Math.round(lifetimeGross * (commissionPct / 100));

    return {
      shopId: shop.id,
      shopName: shop.name,
      commissionPct,
      pendingOrders: pendingCount,
      todayOrders: todayOrders.length,
      todayGross,
      lifetimeGross,
      lifetimeCommission: commission,
      lifetimeNet: lifetimeGross - commission,
    };
  }

  async getPayouts(shopId: string, ownerId: string) {
    await this.assertShopOwner(shopId, ownerId);
    const { commissionPct } = await this.settings.get();

    const payouts = await this.prisma.payout.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unsettled = await this.prisma.order.findMany({
      where: { shopId, status: OrderStatus.DELIVERED },
      select: { subtotal: true, createdAt: true },
    });

    const pendingGross = unsettled.reduce((s, o) => s + o.subtotal, 0);
    const pendingCommission = Math.round(pendingGross * (commissionPct / 100));

    return {
      commissionPct,
      pending: {
        grossAmount: pendingGross,
        commission: pendingCommission,
        netAmount: pendingGross - pendingCommission,
        orderCount: unsettled.length,
      },
      history: payouts.map((p) => ({
        id: p.id,
        grossAmount: p.grossAmount,
        commission: p.commission,
        adjustments: p.adjustments,
        netAmount: p.netAmount,
        status: p.status,
        periodStart: p.periodStart.toISOString(),
        periodEnd: p.periodEnd.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  async acceptOrder(orderId: string, ownerId: string) {
    await this.assertOrderOwner(orderId, ownerId);
    return this.orders.updateStatus(orderId, ownerId, { status: OrderStatus.ACCEPTED });
  }

  async rejectOrder(orderId: string, ownerId: string) {
    await this.assertOrderOwner(orderId, ownerId);
    return this.orders.updateStatus(orderId, ownerId, { status: OrderStatus.CANCELLED });
  }

  async startPreparing(orderId: string, ownerId: string) {
    await this.assertOrderOwner(orderId, ownerId);
    return this.orders.updateStatus(orderId, ownerId, { status: OrderStatus.PREPARING });
  }

  async markReady(orderId: string, ownerId: string) {
    await this.assertOrderOwner(orderId, ownerId);
    return this.orders.updateStatus(orderId, ownerId, { status: OrderStatus.READY });
  }

  async handToRider(orderId: string, ownerId: string) {
    await this.assertOrderOwner(orderId, ownerId);
    return this.orders.updateStatus(orderId, ownerId, { status: OrderStatus.OUT_FOR_DELIVERY });
  }

  async markDelivered(orderId: string, ownerId: string) {
    await this.assertOrderOwner(orderId, ownerId);
    return this.orders.updateStatus(orderId, ownerId, { status: OrderStatus.DELIVERED });
  }
}
