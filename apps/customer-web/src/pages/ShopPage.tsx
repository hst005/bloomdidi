import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { api } from '../lib/api';
import { FlowerImage } from '../components/FlowerImage';
import { BouquetCard } from '../components/BouquetCard';
import { FeedGrid, PageContainer } from '../components/PageContainer';
import { useMotionPrefs } from '../store/cart';
import type { Product, Shop } from '@bloomdidi/shared';

export function ShopPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  const parallaxY = useTransform(scrollY, [0, 280], [0, reduced ? 0 : 60]);
  const parallaxScale = useTransform(scrollY, [0, 280], [1, reduced ? 1 : 1.08]);

  useEffect(() => {
    if (!shopId) return;
    api.fetch<Shop>(`/shops/${shopId}`).then(setShop).catch(() => setShop(null));
    api.fetch<Product[]>(`/catalog/shops/${shopId}/products`).then(setProducts).catch(() => setProducts([]));
  }, [shopId]);

  if (!shop) {
    return (
      <PageContainer className="py-12">
        <div className="h-64 rounded-2xl bg-brand-100 animate-pulse" />
      </PageContainer>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35 }}
    >
      <div ref={headerRef} className="relative h-[280px] overflow-hidden">
        <motion.div style={{ y: parallaxY, scale: parallaxScale }} className="absolute inset-0">
          <FlowerImage
            name={shop.name}
            imageUrl={shop.imageUrl}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/20 to-transparent" />
        </motion.div>
        <PageContainer className="relative z-10 h-full flex flex-col justify-end pb-6">
          <Link to="/" className="text-brand-200 text-sm mb-2 hover:text-white transition-colors">
            ← Back to discover
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-white">{shop.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-brand-100 text-sm flex-wrap">
            <span>★ {shop.rating.toFixed(1)}</span>
            <span>·</span>
            <span>{shop.reviewCount} reviews</span>
            <span>·</span>
            <span>{shop.deliveryRadiusKm} km delivery</span>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-10">
        <p className="text-brand-500 max-w-2xl">{shop.description}</p>

        <h2 className="font-display text-2xl text-brand-800 mt-10 mb-6">Menu</h2>
        {products.length === 0 ? (
          <p className="text-brand-400">No products available.</p>
        ) : (
          <FeedGrid>
            {products.map((product, i) => (
              <BouquetCard key={product.id} product={product} shop={shop} index={i} />
            ))}
          </FeedGrid>
        )}
      </PageContainer>
    </motion.div>
  );
}
