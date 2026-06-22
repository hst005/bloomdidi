import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Product, Shop } from '@bloomdidi/shared';
import { formatPrice } from '../lib/api';
import { FlowerImage } from '../components/FlowerImage';
import { PageContainer } from '../components/PageContainer';
import { useCartStore, useFlyStore, useMotionPrefs } from '../store/cart';
import { addToCart, isLoggedIn } from '../lib/cart-api';

export function ProductPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { product?: Product; shop?: Shop } | null;
  const product = state?.product;
  const shop = state?.shop;
  const addItem = useCartStore((s) => s.addItem);
  const triggerFly = useFlyStore((s) => s.triggerFly);
  const reduced = useMotionPrefs((s) => s.reducedMotion);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product || !shop) {
    return (
      <PageContainer className="py-16 text-center">
        <p className="text-brand-500">Product not found.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 text-brand-600 underline">
          Back to discover
        </button>
      </PageContainer>
    );
  }

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    triggerFly(rect);
    const item = { productId: product.id, qty, customizations: [] };
    if (isLoggedIn()) {
      try {
        await addToCart(item);
      } catch (err) {
        console.error(err);
      }
    } else {
      addItem(shop.id, shop.name, item);
    }
    setAdded(true);
  };

  const maxQty = Math.min(product.stockQty, 99);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
    >
      <PageContainer className="py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-brand-500 hover:text-brand-700 text-sm mb-6 transition-colors"
        >
          ← Back
        </button>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.div
            layoutId={`hero-${product.id}`}
            className="rounded-2xl overflow-hidden h-[280px]"
          >
            <FlowerImage
              name={product.name}
              imageUrl={product.imageUrl}
              className="w-full h-full"
              imgClassName="w-full h-full object-cover"
            />
          </motion.div>

          <div>
            <p className="text-sm text-brand-400 uppercase tracking-wider">{shop.name}</p>
            <h1 className="font-display text-3xl md:text-4xl text-brand-800 mt-2">{product.name}</h1>
            <p className="text-brand-500 mt-4 leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-brand-700">{formatPrice(product.basePrice)}</span>
              {product.stockQty <= 5 && (
                <span className="text-sm text-brand-500">Only {product.stockQty} left today</span>
              )}
            </div>

            {product.customizations && product.customizations.length > 0 && (
              <div className="mt-8">
                <h3 className="font-medium text-brand-700 mb-3">Add-ons</h3>
                <ul className="space-y-2">
                  {product.customizations.map((c) => (
                    <li
                      key={c.id}
                      className="flex justify-between text-sm text-brand-600 py-2 border-b border-brand-100"
                    >
                      <span>{c.name}</span>
                      <span>+{formatPrice(c.priceDelta)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-brand-400 mt-2">Customize fully at checkout (Phase 2 builder)</p>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="inline-flex items-center rounded-xl border border-brand-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-brand-700 hover:bg-brand-50"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-4 py-3 min-w-[3rem] text-center font-semibold text-brand-800">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  className="px-4 py-3 text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!product.isAvailable || product.stockQty < 1}
                className="flex-1 py-3.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add to cart — {formatPrice(product.basePrice * qty)}
              </button>
            </div>

            {added && (
              <div className="mt-4 flex gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="text-brand-600 font-medium hover:underline"
                >
                  View cart →
                </button>
                <button
                  type="button"
                  onClick={() => setAdded(false)}
                  className="text-brand-400 hover:text-brand-600"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </motion.div>
  );
}
