import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  Mon: { open: '09:00', close: '21:00', closed: false },
  Tue: { open: '09:00', close: '21:00', closed: false },
  Wed: { open: '09:00', close: '21:00', closed: false },
  Thu: { open: '09:00', close: '21:00', closed: false },
  Fri: { open: '09:00', close: '21:00', closed: false },
  Sat: { open: '09:00', close: '21:00', closed: false },
  Sun: { open: '10:00', close: '20:00', closed: false },
};

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  /** Haversine distance in km */
  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async discover(lat: number, lng: number, radiusKm = 5) {
    const shops = await this.prisma.shop.findMany({
      where: { isOpen: true },
    });

    return shops
      .map((shop) => ({
        ...this.mapShop(shop),
        distanceKm: this.distanceKm(lat, lng, shop.lat, shop.lng),
      }))
      .filter((s) => s.distanceKm <= Math.min(radiusKm, s.deliveryRadiusKm))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async findById(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Shop not found');
    return this.mapShop(shop);
  }

  async findByOwner(ownerId: string) {
    const shops = await this.prisma.shop.findMany({ where: { ownerId } });
    return shops.map((s) => this.mapShop(s));
  }

  private mapShop(shop: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    lat: number;
    lng: number;
    rating: number;
    reviewCount: number;
    isOpen: boolean;
    deliveryRadiusKm: number;
    imageUrl: string | null;
    deliveryFeePaise: number;
    openingHours?: Prisma.JsonValue;
  }) {
    return {
      id: shop.id,
      ownerId: shop.ownerId,
      name: shop.name,
      description: shop.description,
      location: { lat: shop.lat, lng: shop.lng },
      rating: shop.rating,
      reviewCount: shop.reviewCount,
      isOpen: shop.isOpen,
      deliveryRadiusKm: shop.deliveryRadiusKm,
      imageUrl: shop.imageUrl,
      deliveryFeePaise: shop.deliveryFeePaise,
      openingHours: this.parseHours(shop.openingHours),
    };
  }

  private parseHours(raw?: Prisma.JsonValue) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { ...DEFAULT_HOURS };
    }
    return { ...DEFAULT_HOURS, ...(raw as Record<string, { open: string; close: string; closed: boolean }>) };
  }
}
