import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, VendorStatus } from '@prisma/client';
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

    const [activeFlorists, ordersToday, gmvResult, settings] = await Promise.all([
      this.prisma.shop.count({ where: { status: VendorStatus.ACTIVE } }),
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } },
        _sum: { total: true },
      }),
      this.settings.get(),
    ]);

    const gmvToday = gmvResult._sum.total ?? 0;
    const commissionEarned = Math.round(gmvToday * (settings.commissionPct / 100));

    return {
      activeFlorists,
      ordersToday,
      gmvToday,
      commissionEarned,
      commissionPct: settings.commissionPct,
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
      orderBy: { createdAt: 'desc' },
    });
    return vendors.map((v) => ({
      id: v.id,
      shopName: v.name,
      ownerName: v.owner.name,
      phone: v.owner.phone,
      status: v.status,
      serviceRadiusKm: v.deliveryRadiusKm,
      rating: v.rating,
      location: { lat: v.lat, lng: v.lng },
      createdAt: v.createdAt.toISOString(),
    }));
  }

  async approveVendor(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Vendor not found');
    return this.prisma.shop.update({
      where: { id },
      data: { status: VendorStatus.ACTIVE },
    });
  }

  async suspendVendor(id: string) {
    return this.prisma.shop.update({
      where: { id },
      data: { status: VendorStatus.SUSPENDED, isOpen: false },
    });
  }

  async reactivateVendor(id: string) {
    return this.prisma.shop.update({
      where: { id },
      data: { status: VendorStatus.ACTIVE, isOpen: true },
    });
  }
}
