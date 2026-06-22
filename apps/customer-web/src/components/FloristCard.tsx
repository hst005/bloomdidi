import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/api';
import { formatDistance } from '../lib/format';
import { FlowerImage } from './FlowerImage';
import { useMotionPrefs } from '../store/cart';

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
  badge?: string | null;
}

export function FloristCard({ florist, index = 0 }: { florist: Florist; index?: number }) {
  const reduced = useMotionPrefs((s) => s.reducedMotion);
  const categories = (florist.categories ?? 'Bouquets · Gifting').replace(/ • /g, ' · ');
  const distanceLabel = formatDistance(florist.distanceKm);
  const etaLabel = `${florist.deliveryEtaMin}–${florist.deliveryEtaMax} min`;
  const fromPrice =
    florist.minPricePaise != null ? formatPrice(florist.minPricePaise) : null;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link
        to={`/shop/${florist.id}`}
        className="bd-card bd-rise bd-card-static florist-card"
        style={{
          display: 'block',
          overflow: 'hidden',
          textDecoration: 'none',
          color: 'inherit',
          background: 'var(--bd-surface)',
          cursor: 'pointer',
        }}
      >
        <div className="florist-card-media">
          <FlowerImage
            name={florist.name}
            imageUrl={florist.imageUrl}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover"
          />
          {florist.badge && (
            <span className="florist-card-badge">{florist.badge}</span>
          )}
        </div>

        <div className="florist-card-body">
          <div className="florist-card-title-row">
            <span className="florist-card-name">{florist.name}</span>
            <span className="florist-card-rating">★ {florist.rating.toFixed(1)}</span>
          </div>
          <div className="florist-card-categories">{categories}</div>
          <div className="florist-card-meta">
            <span>{distanceLabel}</span>
            <span className="florist-card-meta-dot" aria-hidden>
              ·
            </span>
            <span>{etaLabel}</span>
            {fromPrice && (
              <>
                <span className="florist-card-meta-dot" aria-hidden>
                  ·
                </span>
                <span>From {fromPrice}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
