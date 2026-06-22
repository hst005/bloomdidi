import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { CartBar } from '../components/CartBar';
import { FlowerImage } from '../components/FlowerImage';
import { MenuProductCard } from '../components/MenuProductCard';
import { PageContainer } from '../components/PageContainer';
import { useMenuCart } from '../lib/menu-cart';
import { useMotionPrefs } from '../store/cart';
import type { Product, Shop } from '@bloomdidi/shared';

function ShopMenu({ shop, products }: { shop: Shop; products: Product[] }) {
  const menuCart = useMenuCart(shop, products);

  return (
    <>
      <PageContainer>
        {shop.description && (
          <p style={{ color: 'var(--bd-ink-soft)', maxWidth: 640, margin: '20px 0' }}>
            {shop.description}
          </p>
        )}
        <h2 className="font-display" style={{ color: 'var(--bd-ink)', margin: '8px 0 0' }}>
          Menu
        </h2>
        {products.length === 0 ? (
          <p style={{ color: 'var(--bd-ink-soft)', padding: '24px 0' }}>No products available.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              padding: '12px 0 32px',
            }}
          >
            {products.map((product, i) => {
              const qty = menuCart.getQty(product.id);
              const maxQty = Math.min(product.stockQty, 99);
              return (
                <MenuProductCard
                  key={product.id}
                  product={product}
                  shop={shop}
                  index={i}
                  qty={qty}
                  onAdd={() => menuCart.addOne(product)}
                  onDec={() => menuCart.setQty(product, qty - 1)}
                  onInc={() => menuCart.setQty(product, Math.min(maxQty, qty + 1))}
                />
              );
            })}
          </div>
        )}
      </PageContainer>

      {menuCart.cartIsThisShop && (
        <CartBar count={menuCart.count} subtotal={menuCart.subtotal} />
      )}
    </>
  );
}

export function ShopPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    Promise.all([
      api.fetch<Shop>(`/shops/${shopId}`),
      api.fetch<Product[]>(`/catalog/shops/${shopId}/products`),
    ])
      .then(([s, p]) => {
        setShop(s);
        setProducts(p);
      })
      .catch(() => {
        setShop(null);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) {
    return (
      <div style={{ background: 'var(--bd-bg)', minHeight: '100vh' }}>
        <div className="bd-skeleton" style={{ height: 240, borderRadius: 0 }} />
        <PageContainer>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              padding: '24px 0',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bd-skeleton" style={{ height: 260 }} />
            ))}
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!shop) {
    return (
      <PageContainer className="py-16 text-center">
        <p style={{ color: 'var(--bd-ink-soft)' }}>Florist not found.</p>
        <Link to="/" style={{ color: 'var(--bd-rose)' }}>
          ← Back to discover
        </Link>
      </PageContainer>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'var(--bd-bg)', minHeight: '100vh', paddingBottom: 80 }}
    >
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        <FlowerImage
          name={shop.name}
          imageUrl={shop.imageUrl}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.05))',
          }}
        />
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
          <PageContainer>
            <Link
              to="/"
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              ← Back to discover
            </Link>
            <h1
              className="font-display"
              style={{ color: '#fff', margin: '6px 0 4px', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
            >
              {shop.name}
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              ★ {shop.rating.toFixed(1)} · {shop.reviewCount} reviews · {shop.deliveryRadiusKm} km
              delivery
            </div>
          </PageContainer>
        </div>
      </div>

      <ShopMenu shop={shop} products={products} />
    </motion.div>
  );
}
