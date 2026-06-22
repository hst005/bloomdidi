import { PrismaClient, UserRole, VendorStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEV_OTP_HINT = '123456';

/** Bundled in customer-web/public/demo — reliable local paths (Unsplash CDN links rot) */
const IMG = {
  shopLily: '/demo/shops/lily-co.jpg',
  shopPetal: '/demo/shops/petal-hub.jpg',
  redRoses: '/demo/products/red-roses.jpg',
  mixed: '/demo/products/mixed-bouquet.jpg',
  lilies: '/demo/products/lilies.jpg',
  wedding: '/demo/products/wedding.jpg',
  orchid: '/demo/products/orchid.jpg',
  pastel: '/demo/products/pastel.jpg',
  default: '/demo/products/default.jpg',
} as const;

/** Temporary demo credentials — change admin password after first login in production */
const CREDENTIALS = {
  customer: { phone: '+919123456789', otp: DEV_OTP_HINT },
  florists: [
    {
      shop: 'Lily & Co Florals',
      phone: '+919876543210',
      otp: DEV_OTP_HINT,
      ownerName: 'Ananya Mehta',
    },
    {
      shop: 'Petal Hub',
      phone: '+919876543211',
      otp: DEV_OTP_HINT,
      ownerName: 'Rahul Kapoor',
    },
  ],
  admin: {
    email: 'admin@bloomdidi.com',
    password: 'Admin@123456',
    phone: '+919999999999',
    otp: DEV_OTP_HINT,
  },
} as const;

async function main() {
  const adminPasswordHash = await bcrypt.hash(CREDENTIALS.admin.password, 10);

  const vendor1 = await prisma.user.upsert({
    where: { phone: CREDENTIALS.florists[0].phone },
    update: { name: CREDENTIALS.florists[0].ownerName, role: UserRole.VENDOR },
    create: {
      phone: CREDENTIALS.florists[0].phone,
      name: CREDENTIALS.florists[0].ownerName,
      role: UserRole.VENDOR,
    },
  });

  const vendor2 = await prisma.user.upsert({
    where: { phone: CREDENTIALS.florists[1].phone },
    update: { name: CREDENTIALS.florists[1].ownerName, role: UserRole.VENDOR },
    create: {
      phone: CREDENTIALS.florists[1].phone,
      name: CREDENTIALS.florists[1].ownerName,
      role: UserRole.VENDOR,
    },
  });

  await prisma.user.upsert({
    where: { phone: CREDENTIALS.customer.phone },
    update: {},
    create: {
      phone: CREDENTIALS.customer.phone,
      name: 'Priya Sharma',
      role: UserRole.CUSTOMER,
    },
  });

  await prisma.user.upsert({
    where: { phone: CREDENTIALS.admin.phone },
    update: {
      name: 'BloomDidi Admin',
      role: UserRole.ADMIN,
      email: CREDENTIALS.admin.email,
      passwordHash: adminPasswordHash,
    },
    create: {
      phone: CREDENTIALS.admin.phone,
      email: CREDENTIALS.admin.email,
      passwordHash: adminPasswordHash,
      name: 'BloomDidi Admin',
      role: UserRole.ADMIN,
    },
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

  const shop1 = await prisma.shop.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {
      ownerId: vendor1.id,
      name: 'Lily & Co Florals',
      description: 'Premium roses & occasion bouquets. Same-day delivery across South Delhi.',
      status: VendorStatus.ACTIVE,
      minPricePaise: 29900,
      categories: 'Bouquets • Roses • Gifting',
      lat: 28.5244,
      lng: 77.1855,
      imageUrl: IMG.shopLily,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      ownerId: vendor1.id,
      name: 'Lily & Co Florals',
      description: 'Premium roses & occasion bouquets. Same-day delivery across South Delhi.',
      lat: 28.5244,
      lng: 77.1855,
      rating: 4.8,
      reviewCount: 124,
      isOpen: true,
      status: VendorStatus.ACTIVE,
      deliveryRadiusKm: 8,
      minPricePaise: 29900,
      categories: 'Bouquets • Roses • Gifting',
      openUntil: '9 PM',
      imageUrl: IMG.shopLily,
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {
      ownerId: vendor2.id,
      name: 'Petal Hub',
      description: 'Artisan arrangements for weddings, celebrations, and everyday joy.',
      status: VendorStatus.ACTIVE,
      minPricePaise: 34900,
      categories: 'Mixed • Seasonal • Weddings',
      lat: 28.531,
      lng: 77.198,
      imageUrl: IMG.shopPetal,
    },
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      ownerId: vendor2.id,
      name: 'Petal Hub',
      description: 'Artisan arrangements for weddings, celebrations, and everyday joy.',
      lat: 28.531,
      lng: 77.198,
      rating: 4.6,
      reviewCount: 89,
      isOpen: true,
      status: VendorStatus.ACTIVE,
      deliveryRadiusKm: 6,
      minPricePaise: 34900,
      categories: 'Mixed • Seasonal • Weddings',
      openUntil: '9 PM',
      imageUrl: IMG.shopPetal,
    },
  });

  const lilyMenu = [
    {
      id: '00000000-0000-4000-8000-000000000101',
      shopId: shop1.id,
      name: 'Classic Red Roses (12)',
      description: 'A dozen premium long-stem red roses, hand-tied with satin ribbon.',
      basePrice: 89900,
      category: 'Roses',
      stockQty: 15,
      imageUrl: IMG.redRoses,
    },
    {
      id: '00000000-0000-4000-8000-000000000102',
      shopId: shop1.id,
      name: 'Sunshine Mixed Bouquet',
      description: 'Gerberas, carnations, and seasonal greens in kraft wrap.',
      basePrice: 64900,
      category: 'Mixed',
      stockQty: 20,
      imageUrl: IMG.mixed,
    },
    {
      id: '00000000-0000-4000-8000-000000000103',
      shopId: shop1.id,
      name: 'White Lily Sympathy',
      description: 'Elegant white lilies for condolences — calm and respectful.',
      basePrice: 129900,
      category: 'Occasion',
      stockQty: 8,
      imageUrl: IMG.lilies,
    },
    {
      id: '00000000-0000-4000-8000-000000000104',
      shopId: shop1.id,
      name: 'Anniversary Heart Box',
      description: 'Red & pink roses arranged in a heart-shaped gift box.',
      basePrice: 149900,
      category: 'Gifting',
      stockQty: 10,
      imageUrl: IMG.redRoses,
    },
    {
      id: '00000000-0000-4000-8000-000000000105',
      shopId: shop1.id,
      name: 'Orchid Elegance',
      description: 'Single-stem purple orchid in a ceramic pot — lasts weeks.',
      basePrice: 79900,
      category: 'Gifting',
      stockQty: 12,
      imageUrl: IMG.orchid,
    },
    {
      id: '00000000-0000-4000-8000-000000000106',
      shopId: shop1.id,
      name: "Baby's Breath Cloud",
      description: 'Fluffy white gypsophila bundle — minimalist & Instagram-ready.',
      basePrice: 29900,
      category: 'Bouquets',
      stockQty: 25,
      imageUrl: IMG.pastel,
    },
  ];

  const petalMenu = [
    {
      id: '00000000-0000-4000-8000-000000000201',
      shopId: shop2.id,
      name: 'Pastel Dream',
      description: 'Soft pinks and lavenders in a jute wrap with eucalyptus.',
      basePrice: 79900,
      category: 'Mixed',
      stockQty: 18,
      imageUrl: IMG.pastel,
    },
    {
      id: '00000000-0000-4000-8000-000000000202',
      shopId: shop2.id,
      name: 'Wedding Centerpiece',
      description: 'Low table arrangement with roses, hydrangeas, and ferns.',
      basePrice: 249900,
      category: 'Weddings',
      stockQty: 5,
      imageUrl: IMG.wedding,
    },
    {
      id: '00000000-0000-4000-8000-000000000203',
      shopId: shop2.id,
      name: 'Tulip Trio',
      description: 'Three-tone tulip bunch — yellow, pink, and white.',
      basePrice: 54900,
      category: 'Seasonal',
      stockQty: 14,
      imageUrl: IMG.mixed,
    },
    {
      id: '00000000-0000-4000-8000-000000000204',
      shopId: shop2.id,
      name: 'Get Well Soon',
      description: 'Bright gerberas and chrysanthemums to lift spirits.',
      basePrice: 59900,
      category: 'Occasion',
      stockQty: 16,
      imageUrl: IMG.lilies,
    },
    {
      id: '00000000-0000-4000-8000-000000000205',
      shopId: shop2.id,
      name: 'Corporate Desk Arrangement',
      description: 'Compact neutral-toned arrangement for office desks.',
      basePrice: 44900,
      category: 'Corporate',
      stockQty: 20,
      imageUrl: IMG.orchid,
    },
    {
      id: '00000000-0000-4000-8000-000000000206',
      shopId: shop2.id,
      name: 'Bird of Paradise Exotic',
      description: 'Bold tropical stems — statement bouquet for celebrations.',
      basePrice: 119900,
      category: 'Exotic',
      stockQty: 6,
      imageUrl: IMG.lilies,
    },
  ];

  for (const p of [...lilyMenu, ...petalMenu]) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        category: p.category,
        stockQty: p.stockQty,
        imageUrl: p.imageUrl,
        isAvailable: true,
      },
      create: p,
    });
  }

  const customizations = [
    { productId: lilyMenu[0].id, type: 'addon', name: 'Greeting card', priceDelta: 5000 },
    { productId: lilyMenu[0].id, type: 'upgrade', name: 'Upgrade to 24 roses', priceDelta: 75000 },
    { productId: lilyMenu[0].id, type: 'wrap', name: 'Premium velvet wrap', priceDelta: 8000 },
    { productId: lilyMenu[1].id, type: 'addon', name: 'Ferrero Rocher box (16pc)', priceDelta: 45000 },
    { productId: lilyMenu[1].id, type: 'addon', name: 'Soft toy (medium)', priceDelta: 35000 },
    { productId: lilyMenu[3].id, type: 'addon', name: 'Personalised message plaque', priceDelta: 12000 },
    { productId: lilyMenu[4].id, type: 'wrap', name: 'Gift bag upgrade', priceDelta: 6000 },
    { productId: petalMenu[0].id, type: 'addon', name: 'Scented candle', priceDelta: 25000 },
    { productId: petalMenu[1].id, type: 'upgrade', name: 'Add candle holders (pair)', priceDelta: 18000 },
    { productId: petalMenu[2].id, type: 'wrap', name: 'Glass vase included', priceDelta: 15000 },
    { productId: petalMenu[5].id, type: 'addon', name: 'Tropical leaf accent', priceDelta: 9000 },
  ];

  await prisma.customization.deleteMany({
    where: { productId: { in: [...lilyMenu, ...petalMenu].map((p) => p.id) } },
  });
  for (const c of customizations) {
    await prisma.customization.create({ data: c });
  }

  const customer = await prisma.user.findUnique({ where: { phone: CREDENTIALS.customer.phone } });
  if (customer) {
    await prisma.address.upsert({
      where: { id: '00000000-0000-4000-8000-000000000301' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000301',
        userId: customer.id,
        label: 'Home',
        recipientName: 'Rahul Verma',
        phone: '+919988776655',
        line1: '42, Green Park Extension',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110016',
        lat: 28.559,
        lng: 77.207,
      },
    });
  }

  console.log('\n══════════════════════════════════════════');
  console.log('  BloomDidi — Demo credentials (temporary)');
  console.log('══════════════════════════════════════════\n');
  console.log('Customer app (OTP login)');
  console.log(`  Phone: ${CREDENTIALS.customer.phone}  OTP: ${CREDENTIALS.customer.otp}\n`);
  console.log('Florist vendor dashboards (OTP login)');
  for (const f of CREDENTIALS.florists) {
    console.log(`  ${f.shop}`);
    console.log(`    Phone: ${f.phone}  OTP: ${f.otp}`);
    console.log(`    Owner: ${f.ownerName}\n`);
  }
  console.log('Admin portal (email + password)');
  console.log(`  Email:    ${CREDENTIALS.admin.email}`);
  console.log(`  Password: ${CREDENTIALS.admin.password}`);
  console.log(`  (OTP fallback — Phone: ${CREDENTIALS.admin.phone}  OTP: ${CREDENTIALS.admin.otp})\n`);
  console.log('Change admin password after login → Settings → Change password');
  console.log('══════════════════════════════════════════\n');
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
