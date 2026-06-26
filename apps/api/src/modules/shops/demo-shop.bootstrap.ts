import { PrismaClient, UserRole, VendorStatus } from '@prisma/client';
import { normalizePhone } from '../auth/otp.util';

const DEMO_VENDOR_BOOTSTRAP: Record<
  string,
  {
    ownerName: string;
    shopId: string;
    shop: {
      name: string;
      description: string;
      lat: number;
      lng: number;
      rating: number;
      reviewCount: number;
      deliveryRadiusKm: number;
      minPricePaise: number;
      categories: string;
      imageUrl: string;
    };
    products: {
      id: string;
      name: string;
      description: string;
      basePrice: number;
      category: string;
      stockQty: number;
      imageUrl: string;
    }[];
  }
> = {
  '+919876543210': {
    ownerName: 'Ananya Mehta',
    shopId: '00000000-0000-4000-8000-000000000001',
    shop: {
      name: 'Lily & Co Florals',
      description: 'Premium roses & occasion bouquets. Same-day delivery across South Delhi.',
      lat: 28.5244,
      lng: 77.1855,
      rating: 4.8,
      reviewCount: 124,
      deliveryRadiusKm: 8,
      minPricePaise: 29900,
      categories: 'Bouquets • Roses • Gifting',
      imageUrl: '/demo/shops/lily-co.jpg',
    },
    products: [
      {
        id: '00000000-0000-4000-8000-000000000101',
        name: 'Classic Red Roses (12)',
        description: 'A dozen premium long-stem red roses, hand-tied with satin ribbon.',
        basePrice: 89900,
        category: 'Roses',
        stockQty: 15,
        imageUrl: '/demo/products/red-roses.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000102',
        name: 'Sunshine Mixed Bouquet',
        description: 'Gerberas, carnations, and seasonal greens in kraft wrap.',
        basePrice: 64900,
        category: 'Mixed',
        stockQty: 20,
        imageUrl: '/demo/products/mixed-bouquet.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000103',
        name: 'White Lily Sympathy',
        description: 'Elegant white lilies for condolences — calm and respectful.',
        basePrice: 129900,
        category: 'Occasion',
        stockQty: 8,
        imageUrl: '/demo/products/lilies.jpg',
      },
    ],
  },
  '+919876543211': {
    ownerName: 'Rahul Kapoor',
    shopId: '00000000-0000-4000-8000-000000000002',
    shop: {
      name: 'Petal Hub',
      description: 'Artisan arrangements for weddings, celebrations, and everyday joy.',
      lat: 28.531,
      lng: 77.198,
      rating: 4.6,
      reviewCount: 89,
      deliveryRadiusKm: 6,
      minPricePaise: 34900,
      categories: 'Mixed • Seasonal • Weddings',
      imageUrl: '/demo/shops/petal-hub.jpg',
    },
    products: [
      {
        id: '00000000-0000-4000-8000-000000000201',
        name: 'Pastel Dream',
        description: 'Soft pinks and lavenders in a jute wrap with eucalyptus.',
        basePrice: 79900,
        category: 'Mixed',
        stockQty: 18,
        imageUrl: '/demo/products/pastel.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000202',
        name: 'Wedding Centerpiece',
        description: 'Low table arrangement with roses, hydrangeas, and ferns.',
        basePrice: 249900,
        category: 'Weddings',
        stockQty: 5,
        imageUrl: '/demo/products/wedding.jpg',
      },
      {
        id: '00000000-0000-4000-8000-000000000203',
        name: 'Tulip Trio',
        description: 'Three-tone tulip bunch — yellow, pink, and white.',
        basePrice: 54900,
        category: 'Seasonal',
        stockQty: 14,
        imageUrl: '/demo/products/mixed-bouquet.jpg',
      },
    ],
  },
};

/** Idempotent demo catalog for seeded vendor phones when production DB was not seeded. */
export async function ensureDemoVendorShop(
  prisma: PrismaClient,
  ownerId: string,
  phone: string,
): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const demo = DEMO_VENDOR_BOOTSTRAP[normalized];
  if (!demo) return false;

  await prisma.user.update({
    where: { id: ownerId },
    data: { role: UserRole.VENDOR, name: demo.ownerName },
  });

  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      globalDiscoveryRadiusKm: 6,
      commissionPct: 8,
      deliveryFeePaise: 4000,
      minOrderValuePaise: 0,
    },
  });

  await prisma.shop.upsert({
    where: { id: demo.shopId },
    update: {
      ownerId,
      ...demo.shop,
      isOpen: true,
      status: VendorStatus.ACTIVE,
      openUntil: '9 PM',
    },
    create: {
      id: demo.shopId,
      ownerId,
      ...demo.shop,
      isOpen: true,
      status: VendorStatus.ACTIVE,
      openUntil: '9 PM',
    },
  });

  for (const product of demo.products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: { shopId: demo.shopId, ...product, isAvailable: true },
      create: { shopId: demo.shopId, ...product, isAvailable: true },
    });
  }

  return true;
}

export function isDemoVendorPhone(phone: string): boolean {
  return normalizePhone(phone) in DEMO_VENDOR_BOOTSTRAP;
}

/** Seed demo florists on empty production DB (first customer or vendor request). */
export async function ensureDemoCatalogIfEmpty(prisma: PrismaClient): Promise<void> {
  const count = await prisma.shop.count();
  if (count > 0) return;

  for (const phone of Object.keys(DEMO_VENDOR_BOOTSTRAP)) {
    const demo = DEMO_VENDOR_BOOTSTRAP[phone];
    const user = await prisma.user.upsert({
      where: { phone },
      update: { role: UserRole.VENDOR, name: demo.ownerName },
      create: { phone, role: UserRole.VENDOR, name: demo.ownerName },
    });
    await ensureDemoVendorShop(prisma, user.id, phone);
  }
}
