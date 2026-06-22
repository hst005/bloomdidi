/** Local demo images — served from customer-web/public/demo (always load, no CDN) */
export const DEMO_IMAGES = {
  shops: {
    lilyCo: '/demo/shops/lily-co.jpg',
    petalHub: '/demo/shops/petal-hub.jpg',
  },
  products: {
    redRoses: '/demo/products/red-roses.jpg',
    mixed: '/demo/products/mixed-bouquet.jpg',
    lilies: '/demo/products/lilies.jpg',
    wedding: '/demo/products/wedding.jpg',
    orchid: '/demo/products/orchid.jpg',
    pastel: '/demo/products/pastel.jpg',
    default: '/demo/products/default.jpg',
  },
} as const;

export const DEMO_SHOP_IMAGE = DEMO_IMAGES.shops.lilyCo;
export const DEMO_PRODUCT_IMAGE = DEMO_IMAGES.products.default;
