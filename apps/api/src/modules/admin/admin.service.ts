import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PayoutStatus, UserRole, VendorStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeFlorists, ordersToday, gmvResult, settings, pendingVendors, pendingPayouts] =
      await Promise.all([
        this.prisma.shop.count({ where: { status: VendorStatus.ACTIVE } }),
        this.prisma.order.count({ where: { createdAt: { gte: today } } }),
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: today },
            status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
          },
          _sum: { total: true },
        }),
        this.settings.get(),
        this.prisma.shop.count({ where: { status: VendorStatus.PENDING } }),
        this.prisma.payout.count({ where: { status: PayoutStatus.PENDING } }),
      ]);

    const gmvToday = gmvResult._sum.total ?? 0;
    const commissionEarned = Math.round(gmvToday * (settings.commissionPct / 100));

    return {
      activeFlorists,
      ordersToday,
      gmvToday,
      commissionEarned,
      commissionPct: settings.commissionPct,
      pendingVendors,
      pendingPayouts,
    };
  }

  getSettings() {
    return this.settings.get();
  }

  updateSettings(dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }

  async listVendors(status?: string) {
    const where = status ? { status: status as VendorStatus } : {};
    const vendors = await this.prisma.shop.findMany({
      where,
      include: { owner: { select: { phone: true, name: true } } },
      orderBy: { name: 'asc' },
    });

    const stats = await this.prisma.order.groupBy({
      by: ['shopId'],
      where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } },
      _count: { id: true },
      _sum: { total: true },
    });
    const statsMap = new Map(stats.map((s) => [s.shopId, s]));

    return vendors.map((v) => {
      const s = statsMap.get(v.id);
      return {
        id: v.id,
        shopName: v.name,
        ownerName: v.owner.name,
        phone: v.owner.phone,
        status: v.status,
        serviceRadiusKm: v.deliveryRadiusKm,
        orderCount: s?._count.id ?? 0,
        totalGmv: s?._sum.total ?? 0,
        rating: v.rating,
        location: { lat: v.lat, lng: v.lng },
        createdAt: v.createdAt.toISOString(),
      };
    });
  }

  async getVendor(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, phone: true, name: true, email: true } },
        products: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            stockQty: true,
            isAvailable: true,
            category: true,
          },
          orderBy: { name: 'asc' },
        },
        orders: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { name: true, phone: true } },
          },
        },
        payouts: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!shop) throw new NotFoundException('Vendor not found');

    const stats = await this.prisma.order.aggregate({
      where: {
        shopId: id,
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    return {
      id: shop.id,
      shopName: shop.name,
      description: shop.description,
      status: shop.status,
      isOpen: shop.isOpen,
      serviceRadiusKm: shop.deliveryRadiusKm,
      rating: shop.rating,
      reviewCount: shop.reviewCount,
      owner: shop.owner,
      orderCount: stats._count.id,
      totalGmv: stats._sum.total ?? 0,
      products: shop.products,
      recentOrders: shop.orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        customerName: o.customer.name,
        customerPhone: o.customer.phone,
        createdAt: o.createdAt.toISOString(),
      })),
      payouts: shop.payouts.map((p) => ({
        id: p.id,
        grossAmount: p.grossAmount,
        commission: p.commission,
        netAmount: p.netAmount,
        status: p.status,
        periodStart: p.periodStart.toISOString(),
        periodEnd: p.periodEnd.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
      createdAt: shop.createdAt.toISOString(),
    };
  }

  async listOrders(status?: string, limit = 100) {
    const where = status ? { status: status as OrderStatus } : {};
    const orders = await this.prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
      },
    });
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      shopName: o.shop.name,
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async listCustomers() {
    const customers = await this.prisma.user.findMany({
      where: { role: UserRole.CUSTOMER },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      orderCount: c._count.orders,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async listPayouts(status?: string) {
    const where = status ? { status: status as PayoutStatus } : {};
    const payouts = await this.prisma.payout.findMany({
      where,
      include: { shop: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return payouts.map((p) => ({
      id: p.id,
      shopId: p.shopId,
      shopName: p.shop.name,
      grossAmount: p.grossAmount,
      commission: p.commission,
      netAmount: p.netAmount,
      status: p.status,
      periodStart: p.periodStart.toISOString(),
      periodEnd: p.periodEnd.toISOString(),
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async approvePayout(id: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException('Payout not found');
    return this.prisma.payout.update({
      where: { id },
      data: { status: PayoutStatus.APPROVED },
    });
  }

  async settlePayout(id: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException('Payout not found');
    return this.prisma.payout.update({
      where: { id },
      data: { status: PayoutStatus.SETTLED },
    });
  }

  async listDisputes() {
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { status: { in: [OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.PAYMENT_FAILED] } },
          { payment: { status: 'REFUNDED' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        shop: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        payment: { select: { status: true, method: true } },
      },
    });
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      shopName: o.shop.name,
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      paymentStatus: o.payment?.status ?? null,
      paymentMethod: o.payment?.method ?? null,
      updatedAt: o.updatedAt.toISOString(),
      createdAt: o.createdAt.toISOString(),
    }));
  }

  async getReports() {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
      },
      select: { createdAt: true, total: true, shopId: true },
    });

    const gmvByDay: { date: string; gmv: number; orders: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      gmvByDay.push({ date: key, gmv: 0, orders: 0 });
    }

    const vendorGmv = new Map<string, number>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const day = gmvByDay.find((g) => g.date === key);
      if (day) {
        day.gmv += o.total;
        day.orders += 1;
      }
      vendorGmv.set(o.shopId, (vendorGmv.get(o.shopId) ?? 0) + o.total);
    }

    const shopIds = [...vendorGmv.keys()];
    const shops = await this.prisma.shop.findMany({
      where: { id: { in: shopIds } },
      select: { id: true, name: true },
    });
    const shopNames = new Map(shops.map((s) => [s.id, s.name]));

    const topVendors = [...vendorGmv.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([shopId, gmv]) => ({
        shopId,
        shopName: shopNames.get(shopId) ?? 'Unknown',
        gmv,
      }));

    return { gmvByDay, topVendors };
  }

  async approveVendor(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Vendor not found');
    return this.prisma.shop.update({
      where: { id },
      data: { status: VendorStatus.ACTIVE, isOpen: true },
    });
  }

  async suspendVendor(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Vendor not found');
    return this.prisma.shop.update({
      where: { id },
      data: { status: VendorStatus.SUSPENDED, isOpen: false },
    });
  }

  async reactivateVendor(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Vendor not found');
    return this.prisma.shop.update({
      where: { id },
      data: { status: VendorStatus.ACTIVE, isOpen: true },
    });
  }
}
