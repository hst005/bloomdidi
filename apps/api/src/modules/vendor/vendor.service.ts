import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PayoutStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { OrdersService } from '../orders/orders.service';
import type { PatchStoreBankDto, PatchStoreDto } from './dto/patch-store.dto';

const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  Mon: { open: '09:00', close: '21:00', closed: false },
  Tue: { open: '09:00', close: '21:00', closed: false },
  Wed: { open: '09:00', close: '21:00', closed: false },
  Thu: { open: '09:00', close: '21:00', closed: false },
  Fri: { open: '09:00', close: '21:00', closed: false },
  Sat: { open: '09:00', close: '21:00', closed: false },
  Sun: { open: '10:00', close: '20:00', closed: false },
};

type ShopRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isOpen: boolean;
  deliveryRadiusKm: number;
  deliveryFeePaise: number;
  openingHours: Prisma.JsonValue;
  bankAccountName: string | null;
  bankAccountLast4: string | null;
  bankIfsc: string | null;
  rating: number;
  reviewCount: number;
};

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
    const shop = await this.assertShopOwner(shopId, ownerId);
    const { commissionPct } = await this.settings.get();

    const payouts = await this.prisma.payout.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unsettled = await this.prisma.order.findMany({
      where: { shopId, status: OrderStatus.DELIVERED },
      select: { subtotal: true },
    });

    const pendingGross = unsettled.reduce((s, o) => s + o.subtotal, 0);
    const pendingCommission = Math.round(pendingGross * (commissionPct / 100));
    const pendingNet = pendingGross - pendingCommission;

    const items = payouts.map((p) => this.mapPayoutRow(p, shop.bankAccountLast4));

    if (pendingNet > 0) {
      const expected = new Date();
      expected.setDate(expected.getDate() + ((8 - expected.getDay()) % 7 || 7));
      items.unshift({
        id: 'pending-unsettled',
        period: 'Current unsettled deliveries',
        gross: pendingGross,
        commission: pendingCommission,
        adjustments: 0,
        net: pendingNet,
        status: 'pending' as const,
        expectedDate: expected.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        bankLast4: shop.bankAccountLast4,
        downloadable: false,
      });
    }

    return {
      commissionPct,
      items,
      pending: {
        grossAmount: pendingGross,
        commission: pendingCommission,
        netAmount: pendingNet,
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

  async getEarnings(shopId: string, ownerId: string, range: string) {
    await this.assertShopOwner(shopId, ownerId);
    const { commissionPct } = await this.settings.get();
    const { start, end } = this.rangeToDates(range);

    const [delivered, refundedOrders, payoutAdjustments] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          shopId,
          status: OrderStatus.DELIVERED,
          updatedAt: { gte: start, lte: end },
        },
        select: { subtotal: true, updatedAt: true },
      }),
      this.prisma.order.findMany({
        where: {
          shopId,
          status: { in: [OrderStatus.REFUNDED, OrderStatus.CANCELLED] },
          updatedAt: { gte: start, lte: end },
        },
        select: { subtotal: true },
      }),
      this.prisma.payout.aggregate({
        where: {
          shopId,
          periodStart: { gte: start },
          periodEnd: { lte: end },
        },
        _sum: { adjustments: true },
      }),
    ]);

    const gross = delivered.reduce((s, o) => s + o.subtotal, 0);
    const commission = Math.round(gross * (commissionPct / 100));
    const refunds = refundedOrders.reduce((s, o) => s + o.subtotal, 0);
    const adjustments = payoutAdjustments._sum.adjustments ?? 0;

    const summary = {
      gross,
      commission,
      commissionPct,
      adjustments,
      refunds,
      net: gross - commission - adjustments - refunds,
      orderCount: delivered.length,
    };

    const dayMap = new Map<string, number>();
    for (const o of delivered) {
      const key = o.updatedAt.toISOString().slice(0, 10);
      const dayNet = o.subtotal - Math.round(o.subtotal * (commissionPct / 100));
      dayMap.set(key, (dayMap.get(key) ?? 0) + dayNet);
    }

    const trend: { label: string; date: string; amount: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      trend.push({
        label: key.slice(5),
        date: key,
        amount: dayMap.get(key) ?? 0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    return { summary, trend };
  }

  async getPayoutStatement(shopId: string, ownerId: string, payoutId: string) {
    await this.assertShopOwner(shopId, ownerId);
    const payout = await this.prisma.payout.findFirst({
      where: { id: payoutId, shopId },
      include: { shop: { select: { name: true, bankAccountLast4: true, bankIfsc: true } } },
    });
    if (!payout) throw new NotFoundException('Payout not found');

    const periodLabel = `${payout.periodStart.toLocaleDateString('en-IN')} – ${payout.periodEnd.toLocaleDateString('en-IN')}`;
    const lines = [
      'BloomDidi Vendor Settlement Statement',
      `Shop,${this.csvEscape(payout.shop.name)}`,
      `Period,${periodLabel}`,
      `Status,${payout.status}`,
      '',
      'Line item,Amount (INR paise)',
      `Gross sales,${payout.grossAmount}`,
      `Platform commission,${payout.commission}`,
      `Adjustments,${payout.adjustments}`,
      `Net payout,${payout.netAmount}`,
      '',
      `Bank account,••${payout.shop.bankAccountLast4 ?? '----'}`,
      `IFSC,${payout.shop.bankIfsc ?? ''}`,
      `Generated,${new Date().toISOString()}`,
    ];
    return lines.join('\n');
  }

  private mapPayoutRow(
    p: {
      id: string;
      grossAmount: number;
      commission: number;
      adjustments: number;
      netAmount: number;
      status: PayoutStatus;
      periodStart: Date;
      periodEnd: Date;
    },
    bankLast4: string | null,
  ) {
    const status =
      p.status === PayoutStatus.SETTLED
        ? ('paid' as const)
        : p.status === PayoutStatus.FAILED
          ? ('failed' as const)
          : ('pending' as const);
    return {
      id: p.id,
      period: `${p.periodStart.toLocaleDateString('en-IN')} – ${p.periodEnd.toLocaleDateString('en-IN')}`,
      gross: p.grossAmount,
      commission: p.commission,
      adjustments: p.adjustments,
      net: p.netAmount,
      status,
      expectedDate: p.periodEnd.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      bankLast4,
      downloadable: true,
    };
  }

  private rangeToDates(range: string): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (range === '30d') start.setDate(start.getDate() - 29);
    else if (range === 'mtd') start.setDate(1);
    else start.setDate(start.getDate() - 6);
    return { start, end };
  }

  private csvEscape(value: string) {
    return `"${value.replace(/"/g, '""')}"`;
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

  async getShopProfile(shopId: string, ownerId: string) {
    const shop = await this.assertShopOwner(shopId, ownerId);
    const reviews = await this.prisma.review.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true } } },
    });
    return {
      ...this.mapStore(shop),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        customerName: r.user.name,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  /** Alias — vendor store profile hub */
  async getStore(shopId: string, ownerId: string) {
    return this.getShopProfile(shopId, ownerId);
  }

  async patchStoreStatus(shopId: string, ownerId: string, isOpen: boolean) {
    await this.assertShopOwner(shopId, ownerId);
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data: { isOpen },
    });
    return this.mapStore(shop);
  }

  async patchStoreRadius(shopId: string, ownerId: string, serviceRadiusKm: number) {
    await this.assertShopOwner(shopId, ownerId);
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data: { deliveryRadiusKm: serviceRadiusKm },
    });
    return this.mapStore(shop);
  }

  async patchStoreDeliveryFee(shopId: string, ownerId: string, deliveryFeePaise: number) {
    await this.assertShopOwner(shopId, ownerId);
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data: { deliveryFeePaise },
    });
    return this.mapStore(shop);
  }

  async patchStore(shopId: string, ownerId: string, dto: PatchStoreDto) {
    await this.assertShopOwner(shopId, ownerId);

    const data: Prisma.ShopUpdateInput = {};

    if (dto.shopName !== undefined) data.name = dto.shopName.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl || null;
    if (dto.hours !== undefined) data.openingHours = dto.hours as Prisma.InputJsonValue;

    if (dto.bank) {
      this.applyBankUpdate(data, dto.bank);
    }

    const shop = await this.prisma.shop.update({ where: { id: shopId }, data });
    return this.mapStore(shop);
  }

  private applyBankUpdate(data: Prisma.ShopUpdateInput, bank: PatchStoreBankDto) {
    const digits = bank.accountNumber.replace(/\D/g, '');
    if (digits.length < 9) {
      throw new BadRequestException('Account number must be at least 9 digits');
    }
    data.bankAccountName = bank.accountName.trim();
    data.bankAccountLast4 = digits.slice(-4);
    data.bankIfsc = bank.ifsc.toUpperCase();
  }

  private parseHours(raw: Prisma.JsonValue): Record<string, { open: string; close: string; closed: boolean }> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ...DEFAULT_HOURS };
    }
    return { ...DEFAULT_HOURS, ...(raw as Record<string, { open: string; close: string; closed: boolean }>) };
  }

  private mapStore(shop: ShopRow) {
    const hours = this.parseHours(shop.openingHours);
    return {
      id: shop.id,
      shopName: shop.name,
      name: shop.name,
      description: shop.description,
      imageUrl: shop.imageUrl,
      isOpen: shop.isOpen,
      serviceRadiusKm: shop.deliveryRadiusKm,
      deliveryRadiusKm: shop.deliveryRadiusKm,
      deliveryFeePaise: shop.deliveryFeePaise,
      hours,
      bank:
        shop.bankAccountLast4 && shop.bankIfsc
          ? {
              accountName: shop.bankAccountName,
              last4: shop.bankAccountLast4,
              ifsc: shop.bankIfsc,
            }
          : null,
      rating: shop.rating,
      reviewCount: shop.reviewCount,
    };
  }

  async updateShop(
    shopId: string,
    ownerId: string,
    data: { isOpen?: boolean; deliveryRadiusKm?: number; openUntil?: string; description?: string },
  ) {
    await this.assertShopOwner(shopId, ownerId);
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data,
    });
    return {
      id: shop.id,
      name: shop.name,
      description: shop.description,
      isOpen: shop.isOpen,
      deliveryRadiusKm: shop.deliveryRadiusKm,
      openUntil: shop.openUntil,
      rating: shop.rating,
      reviewCount: shop.reviewCount,
    };
  }
}
