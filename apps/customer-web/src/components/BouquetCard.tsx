import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product, Shop } from '@bloomdidi/shared';
import { formatPrice } from '../lib/api';
import { FlowerImage } from './FlowerImage';
import { QtyStepper } from './QtyStepper';
import { useMotionPrefs } from '../store/cart';

interface BouquetCardProps {
  product: Product;
  shop: Shop;
  index?: number;
  qty?: number;
  onAdd?: () => void;
  onDec?: () => void;
  onInc?: () => void;
}

export function BouquetCard({
  product,
  shop,
  index = 0,
  qty = 0,
  onAdd,
  onDec,
  onInc,
}: BouquetCardProps) {
  const [flipped, setFlipped] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  const soldOut = !product.isAvailable || product.stockQty <= 0;
  const maxQty = Math.min(product.stockQty, 99);

  const hoverCapable = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const openFlip = useCallback(() => {
    if (reduced || soldOut || !hoverCapable()) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setFlipped(true);
  }, [reduced, soldOut]);

  const closeFlip = useCallback(() => {
    if (!hoverCapable()) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setFlipped(false), 160);
  }, []);

  const toggleFlip = useCallback(() => {
    if (reduced || soldOut || hoverCapable()) return;
    setFlipped((f) => !f);
  }, [reduced, soldOut]);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bouquet-card-wrap"
    >
      <div
        className="card-perspective"
        onMouseEnter={openFlip}
        onMouseLeave={closeFlip}
        onClick={toggleFlip}
        onKeyDown={(e) => {
          if (hoverCapable()) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFlip();
          }
        }}
        role={hoverCapable() ? undefined : 'button'}
        tabIndex={hoverCapable() ? undefined : 0}
        aria-label={`${product.name}, tap for details`}
        aria-pressed={flipped}
      >
        <div className={`card-flip-inner${flipped ? ' is-flipped' : ''}`}>
          {/* Front */}
          <div className="card-face card-face-front">
            <div
              className="bouquet-card-face"
              style={{ background: 'var(--bd-surface)', borderColor: 'var(--bd-border)' }}
            >
              <Link
                to={`/product/${product.id}`}
                state={{ product, shop }}
                className="bouquet-card-link"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bouquet-card-media">
                  <FlowerImage
                    name={product.name}
                    imageUrl={product.imageUrl}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover"
                  />
                  {product.stockQty <= 5 && product.stockQty > 0 && (
                    <span className="bouquet-card-badge">Only {product.stockQty} left</span>
                  )}
                </div>
                <div className="bouquet-card-body">
                  <p className="bouquet-card-shop">{shop.name}</p>
                  <h3 className="bouquet-card-title font-display">{product.name}</h3>
                  <p className="bouquet-card-price">{formatPrice(product.basePrice)}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Back */}
          <div className="card-face card-face-back">
            <div className="bouquet-card-back">
              <div>
                <p className="font-display bouquet-card-back-title">{product.name}</p>
                <p className="bouquet-card-back-desc">{product.description}</p>
                <p className="bouquet-card-back-price">{formatPrice(product.basePrice)}</p>
              </div>
              <div className="bouquet-card-back-actions">
                {soldOut ? (
                  <span style={{ fontSize: 13, opacity: 0.85 }}>Sold out</span>
                ) : qty === 0 ? (
                  <button
                    type="button"
                    className="bouquet-card-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd?.();
                    }}
                  >
                    Add to cart
                  </button>
                ) : (
                  <div onClick={(e) => e.stopPropagation()}>
                    <QtyStepper
                      qty={qty}
                      onDec={() => onDec?.()}
                      onInc={() => onInc?.()}
                      max={maxQty}
                      variant="on-rose"
                    />
                  </div>
                )}
                <p className="bouquet-card-flip-hint bouquet-card-flip-hint--hover">Move away to flip back</p>
                <p className="bouquet-card-flip-hint bouquet-card-flip-hint--touch">Tap to flip back</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
