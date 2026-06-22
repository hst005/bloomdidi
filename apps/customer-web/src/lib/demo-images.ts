import lilyCo from '../assets/demo/shops/lily-co.jpg';
import petalHub from '../assets/demo/shops/petal-hub.jpg';
import redRoses from '../assets/demo/products/red-roses.jpg';
import mixedBouquet from '../assets/demo/products/mixed-bouquet.jpg';
import lilies from '../assets/demo/products/lilies.jpg';
import wedding from '../assets/demo/products/wedding.jpg';
import orchid from '../assets/demo/products/orchid.jpg';
import pastel from '../assets/demo/products/pastel.jpg';
import defaultProduct from '../assets/demo/products/default.jpg';

/** Vite-bundled demo images — always resolve, no reliance on /public at runtime */
const ASSET_MAP: Record<string, string> = {
  '/demo/shops/lily-co.jpg': lilyCo,
  '/demo/shops/petal-hub.jpg': petalHub,
  '/demo/products/red-roses.jpg': redRoses,
  '/demo/products/mixed-bouquet.jpg': mixedBouquet,
  '/demo/products/lilies.jpg': lilies,
  '/demo/products/wedding.jpg': wedding,
  '/demo/products/orchid.jpg': orchid,
  '/demo/products/pastel.jpg': pastel,
  '/demo/products/default.jpg': defaultProduct,
};

export const DEMO_IMAGES = {
  shops: { lilyCo, petalHub },
  products: { redRoses, mixedBouquet, lilies, wedding, orchid, pastel, default: defaultProduct },
} as const;

export const DEMO_SHOP_IMAGE = lilyCo;
export const DEMO_PRODUCT_IMAGE = defaultProduct;

/** Map API `/demo/...` paths (or null) to bundled asset URLs. Returns empty string when missing. */
export function resolveImageUrl(path: string | null | undefined, fallback = DEMO_PRODUCT_IMAGE): string {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;
  return ASSET_MAP[path] ?? fallback;
}

/** True when we should show the flower placeholder instead of a photo */
export function shouldUsePlaceholder(path: string | null | undefined): boolean {
  if (!path?.trim()) return true;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return false;
  return !ASSET_MAP[path];
}
