import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/api';
import { formatDistance } from '../lib/format';
import { FlowerImage } from './FlowerImage';

export interface Florist {
  id: string;
  name: string;
  description: string | null;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  categories: string | null;
  distanceKm: number;
  deliveryEtaMin: number;
  deliveryEtaMax: number;
  minPricePaise: number | null;
}

export function FloristCard({ florist, index = 0 }: { florist: Florist; index?: number }) {
  const categories = florist.categories ?? 'Bouquets · Gifting';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link
        to={`/shop/${florist.id}`}
        className="bd-card bd-rise bd-card-static"
        style={{
          display: 'block',
          overflow: 'hidden',
          textDecoration: 'none',
          color: 'inherit',
          background: 'var(--bd-surface)',
          cursor: 'pointer',
        }}
      >
        <div style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
          <FlowerImage
            name={florist.name}
            imageUrl={florist.imageUrl}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover"
          />
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>{florist.name}</span>
            <span style={{ color: 'var(--bd-green)', fontSize: 13, whiteSpace: 'nowrap' }}>
              ★ {florist.rating.toFixed(1)}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginTop: 3 }}>
            {categories.replace(/ • /g, ' · ')}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 10,
              fontSize: 12,
              color: 'var(--bd-ink-soft)',
            }}
          >
            <span>{formatDistance(florist.distanceKm)}</span>
            <span>
              {florist.deliveryEtaMin}–{florist.deliveryEtaMax} min
            </span>
            {florist.minPricePaise != null && (
              <span style={{ marginLeft: 'auto', color: 'var(--bd-ink)' }}>
                From {formatPrice(florist.minPricePaise)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
