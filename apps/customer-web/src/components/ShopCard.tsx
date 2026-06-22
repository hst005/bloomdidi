import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Shop } from '@bloomdidi/shared';
import { FlowerImage } from './FlowerImage';
import { formatDistance } from '../lib/format';
import { useMotionPrefs } from '../store/cart';

interface ShopCardProps {
  shop: Shop;
  index?: number;
}

export function ShopCard({ shop, index = 0 }: ShopCardProps) {
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Link
        to={`/shop/${shop.id}`}
        className="flex gap-4 p-4 rounded-2xl bg-white border border-brand-100 hover:border-brand-200 hover:shadow-md transition-all group"
      >
        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
          <FlowerImage
            name={shop.name}
            imageUrl={shop.imageUrl}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg text-brand-800 truncate">{shop.name}</h3>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${shop.isOpen ? 'bg-sage-500/15 text-sage-500' : 'bg-brand-100 text-brand-400'}`}>
              {shop.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-sm text-brand-500 line-clamp-2 mt-1">{shop.description}</p>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-brand-600 font-medium">★ {shop.rating.toFixed(1)}</span>
            <span className="text-brand-300">·</span>
            <span className="text-brand-400">{shop.reviewCount} reviews</span>
            {shop.distanceKm != null && (
              <>
                <span className="text-brand-300">·</span>
                <span className="text-brand-400">{formatDistance(shop.distanceKm)}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
