import { Injectable, Logger } from '@nestjs/common';
import { VendorStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

export type FloristSort = 'nearest' | 'rating' | 'price' | 'fastest';

export interface FloristResult {
  id: string;
  name: string;
  description: string | null;
  location: { lat: number; lng: number };
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  serviceRadiusKm: number;
  imageUrl: string | null;
  categories: string | null;
  minPricePaise: number | null;
  distanceKm: number;
  deliveryEtaMin: number;
  deliveryEtaMax: number;
  delivers: boolean;
}

type ShopRow = {
  id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  rating: number;
  review_count: number;
  is_open: boolean;
  delivery_radius_km: number;
  image_url: string | null;
  categories: string | null;
  min_price_paise: number | null;
  distance_km: number;
};

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private postgisAvailable: boolean | null = null;

  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async discoverFlorists(
    lat: number,
    lng: number,
    sort: FloristSort = 'nearest',
    q?: string,
    maxPricePaise?: number,
  ): Promise<FloristResult[]> {
    const { globalDiscoveryRadiusKm } = await this.settings.get();
    const globalRadiusM = globalDiscoveryRadiusKm * 1000;

    let results: FloristResult[];
    if (await this.hasPostgis()) {
      results = await this.discoverPostgis(lat, lng, globalRadiusM);
    } else {
      results = await this.discoverHaversine(lat, lng, globalDiscoveryRadiusKm);
    }

    results = results.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q.toLowerCase()) &&
          !(r.description?.toLowerCase().includes(q.toLowerCase()))) return false;
      if (maxPricePaise && r.minPricePaise && r.minPricePaise > maxPricePaise) return false;
      return true;
    });

    return this.sortFlorists(results, sort);
  }

  private async hasPostgis(): Promise<boolean> {
    if (this.postgisAvailable !== null) return this.postgisAvailable;
    try {
      const rows = await this.prisma.$queryRaw<{ ext: string }[]>`
        SELECT extname AS ext FROM pg_extension WHERE extname = 'postgis'
      `;
      this.postgisAvailable = rows.length > 0;
      if (!this.postgisAvailable) {
        this.logger.warn('PostGIS not installed — using Haversine fallback. Run: brew install postgis');
      }
    } catch {
      this.postgisAvailable = false;
    }
    return this.postgisAvailable;
  }

  private async discoverPostgis(lat: number, lng: number, globalRadiusM: number): Promise<FloristResult[]> {
    try {
      const rows = await this.prisma.$queryRaw<ShopRow[]>`
        SELECT s.id, s.name, s.description, s.lat, s.lng, s.rating, s.review_count,
               s.is_open, s.delivery_radius_km, s.image_url, s.categories, s.min_price_paise,
               ST_Distance(
                 ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography,
                 ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
               ) / 1000.0 AS distance_km
        FROM shops s
        WHERE s.status = 'ACTIVE'
          AND s.is_open = true
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${globalRadiusM}
          )
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            s.delivery_radius_km * 1000
          )
        ORDER BY distance_km ASC
      `;
      return rows.map((r) => this.mapRow(r));
    } catch (err) {
      this.logger.warn(`PostGIS query failed, falling back to Haversine: ${err}`);
      this.postgisAvailable = false;
      const { globalDiscoveryRadiusKm } = await this.settings.get();
      return this.discoverHaversine(lat, lng, globalDiscoveryRadiusKm);
    }
  }

  private async discoverHaversine(lat: number, lng: number, globalRadiusKm: number): Promise<FloristResult[]> {
    const shops = await this.prisma.shop.findMany({
      where: { status: VendorStatus.ACTIVE, isOpen: true },
    });

    return shops
      .map((shop) => {
        const distanceKm = this.haversineKm(lat, lng, shop.lat, shop.lng);
        return this.mapRow({
          id: shop.id,
          name: shop.name,
          description: shop.description,
          lat: shop.lat,
          lng: shop.lng,
          rating: shop.rating,
          review_count: shop.reviewCount,
          is_open: shop.isOpen,
          delivery_radius_km: shop.deliveryRadiusKm,
          image_url: shop.imageUrl,
          categories: shop.categories,
          min_price_paise: shop.minPricePaise,
          distance_km: distanceKm,
        });
      })
      .filter((r) => r.distanceKm <= globalRadiusKm && r.distanceKm <= r.serviceRadiusKm);
  }

  private mapRow(r: ShopRow): FloristResult {
    const etaBase = Math.round(15 + r.distance_km * 5);
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      location: { lat: r.lat, lng: r.lng },
      rating: r.rating,
      reviewCount: r.review_count,
      isOpen: r.is_open,
      serviceRadiusKm: r.delivery_radius_km,
      imageUrl: r.image_url,
      categories: r.categories,
      minPricePaise: r.min_price_paise,
      distanceKm: Math.round(r.distance_km * 10) / 10,
      deliveryEtaMin: etaBase,
      deliveryEtaMax: etaBase + 10,
      delivers: true,
    };
  }

  private sortFlorists(list: FloristResult[], sort: FloristSort): FloristResult[] {
    const copy = [...list];
    switch (sort) {
      case 'rating':
        return copy.sort((a, b) => b.rating - a.rating);
      case 'price':
        return copy.sort((a, b) => (a.minPricePaise ?? 999999) - (b.minPricePaise ?? 999999));
      case 'fastest':
        return copy.sort((a, b) => a.deliveryEtaMin - b.deliveryEtaMin);
      default:
        return copy.sort((a, b) => a.distanceKm - b.distanceKm);
    }
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
}
