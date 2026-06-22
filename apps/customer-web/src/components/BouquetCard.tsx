import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product, Shop } from '@bloomdidi/shared';
import { formatPrice } from '../lib/api';
import { DEMO_PRODUCT_IMAGE, resolveImageUrl } from '../lib/demo-images';
import { useCartStore, useFlyStore, useMotionPrefs } from '../store/cart';
import { addToCart, isLoggedIn } from '../lib/cart-api';

interface BouquetCardProps {
  product: Product;
  shop: Shop;
  index?: number;
}

export function BouquetCard({ product, shop, index = 0 }: BouquetCardProps) {
  const [flipped, setFlipped] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const triggerFly = useFlyStore((s) => s.triggerFly);
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    triggerFly(rect);
    const item = { productId: product.id, qty: 1, customizations: [] };
    if (isLoggedIn()) {
      try {
        await addToCart(item);
      } catch (err) {
        console.error(err);
      }
    } else {
      addItem(shop.id, item);
    }
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="card-perspective">
        <div
          className={`card-flip-inner relative ${flipped ? 'is-flipped' : ''}`}
          onMouseEnter={() => !reduced && setFlipped(true)}
          onMouseLeave={() => setFlipped(false)}
        >
          {/* Front */}
          <div className="card-face">
            <Link to={`/product/${product.id}`} state={{ product, shop }}>
              <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-brand-100 hover:shadow-md transition-shadow">
                <div className="aspect-[4/5] overflow-hidden relative">
                  <motion.img
                    layoutId={`hero-${product.id}`}
                    src={resolveImageUrl(product.imageUrl, DEMO_PRODUCT_IMAGE)}
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEMO_PRODUCT_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stockQty <= 5 && (
                    <span className="absolute top-3 left-3 px-2 py-1 bg-brand-700/90 text-white text-xs rounded-full">
                      Only {product.stockQty} left
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-brand-400 uppercase tracking-wider">{shop.name}</p>
                  <h3 className="font-display text-lg text-brand-800 mt-1">{product.name}</h3>
                  <p className="text-brand-600 font-semibold mt-2">{formatPrice(product.basePrice)}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Back */}
          <div className="card-face card-face-back absolute inset-0">
            <div className="h-full rounded-2xl bg-brand-700 text-white p-5 flex flex-col justify-between shadow-lg">
              <div>
                <p className="font-display text-xl">{product.name}</p>
                <p className="text-brand-200 text-sm mt-2 line-clamp-3">{product.description}</p>
                <p className="text-2xl font-semibold mt-4">{formatPrice(product.basePrice)}</p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleAdd}
                  className="w-full py-2.5 bg-white text-brand-700 rounded-xl font-medium hover:bg-brand-50 transition-colors"
                >
                  Add to cart
                </button>
                <p className="text-xs text-brand-300 text-center">Tap card to flip back</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
