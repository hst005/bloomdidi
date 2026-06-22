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
        className="block bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors h-full"
      >
        <div className="aspect-[16/10] overflow-hidden">
          <FlowerImage
            name={florist.name}
            imageUrl={florist.imageUrl}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover opacity-90"
          />
        </div>
        <div className="p-3.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-medium text-white">{florist.name}</h3>
            <span className="shrink-0 text-brand-400 text-sm font-medium whitespace-nowrap">
              ★ {florist.rating.toFixed(1)}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{categories.replace(/ • /g, ' · ')}</p>
          <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500">
            <span>{formatDistance(florist.distanceKm)}</span>
            <span>
              {florist.deliveryEtaMin}–{florist.deliveryEtaMax} min
            </span>
            {florist.minPricePaise != null && (
              <span className="text-slate-300 ml-auto">
                From {formatPrice(florist.minPricePaise)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
