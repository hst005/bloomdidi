import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { api } from '../lib/api';
import { DEMO_SHOP_IMAGE } from '../lib/demo-images';
import { BouquetCard } from '../components/BouquetCard';
import { useMotionPrefs } from '../store/cart';
import type { Product, Shop } from '@bloomdidi/shared';

export function ShopPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  const parallaxY = useTransform(scrollY, [0, 300], [0, reduced ? 0 : 80]);
  const parallaxScale = useTransform(scrollY, [0, 300], [1, reduced ? 1 : 1.1]);

  useEffect(() => {
    if (!shopId) return;
    api.fetch<Shop>(`/shops/${shopId}`).then(setShop).catch(() => setShop(null));
    api.fetch<Product[]>(`/catalog/shops/${shopId}/products`).then(setProducts).catch(() => setProducts([]));
  }, [shopId]);

  if (!shop) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-64 rounded-2xl bg-brand-100 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35 }}
    >
      {/* Parallax header */}
      <div ref={headerRef} className="relative h-56 md:h-72 overflow-hidden">
        <motion.div style={{ y: parallaxY, scale: parallaxScale }} className="absolute inset-0">
          <img
            src={shop.imageUrl ?? DEMO_SHOP_IMAGE}
            alt={shop.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEMO_SHOP_IMAGE;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/20 to-transparent" />
        </motion.div>
        <div className="relative z-10 h-full flex flex-col justify-end max-w-6xl mx-auto px-4 pb-6">
          <Link to="/" className="text-brand-200 text-sm mb-2 hover:text-white transition-colors">
            ← Back to discover
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-white">{shop.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-brand-100 text-sm">
            <span>★ {shop.rating.toFixed(1)}</span>
            <span>·</span>
            <span>{shop.reviewCount} reviews</span>
            <span>·</span>
            <span>{shop.deliveryRadiusKm} km delivery</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-brand-500 max-w-2xl">{shop.description}</p>

        <h2 className="font-display text-2xl text-brand-800 mt-10 mb-6">Menu</h2>
        {products.length === 0 ? (
          <p className="text-brand-400">No products available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <BouquetCard key={product.id} product={product} shop={shop} index={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
