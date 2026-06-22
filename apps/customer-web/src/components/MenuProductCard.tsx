import { motion } from 'framer-motion';
import type { Product, Shop } from '@bloomdidi/shared';
import { formatPrice } from '../lib/api';
import { FlowerImage } from './FlowerImage';
import { QtyStepper } from './QtyStepper';
import { useMotionPrefs } from '../store/cart';

interface MenuProductCardProps {
  product: Product;
  shop: Shop;
  index: number;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  onInc: () => void;
}

export function MenuProductCard({
  product,
  shop,
  index,
  qty,
  onAdd,
  onDec,
  onInc,
}: MenuProductCardProps) {
  const reduced = useMotionPrefs((s) => s.reducedMotion);
  const soldOut = !product.isAvailable || product.stockQty <= 0;
  const maxQty = Math.min(product.stockQty, 99);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bd-card bd-rise bd-card-static"
      style={{
        overflow: 'hidden',
        background: 'var(--bd-surface)',
        opacity: soldOut ? 0.6 : 1,
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div style={{ aspectRatio: '16/6', maxHeight: 140, overflow: 'hidden' }}>
        <FlowerImage
          name={product.name}
          imageUrl={product.imageUrl}
          className="w-full h-full"
          imgClassName="w-full h-full object-cover"
        />
      </div>
      <div style={{ padding: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: 'var(--bd-rose)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {shop.name}
        </div>
        <div style={{ fontWeight: 500, color: 'var(--bd-ink)', margin: '4px 0' }}>
          {product.name}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>
            {formatPrice(product.basePrice)}
          </span>
          {soldOut ? (
            <span style={{ fontSize: 12, color: 'var(--bd-ink-soft)' }}>Sold out</span>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="bd-btn bd-btn-primary"
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              Add
            </button>
          ) : (
            <QtyStepper qty={qty} onDec={onDec} onInc={onInc} max={maxQty} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
