import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/api';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link to={`/shop/${florist.id}`} className="block bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors">
        <div className="h-40 bg-slate-800 flex items-center justify-center overflow-hidden">
          {florist.imageUrl ? (
            <img src={florist.imageUrl} alt="" className="w-full h-full object-cover opacity-90" />
          ) : (
            <span className="text-4xl">🌸</span>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-white">{florist.name}</h3>
            <span className="shrink-0 flex items-center gap-1 text-emerald-400 text-sm font-medium">
              ★ {florist.rating.toFixed(1)}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">{florist.categories ?? 'Bouquets • Gifting'}</p>
          {florist.description && (
            <p className="text-slate-500 text-xs mt-1 line-clamp-2">{florist.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
            <span>📍 {florist.distanceKm.toFixed(1)} km</span>
            <span>🕐 {florist.deliveryEtaMin}–{florist.deliveryEtaMax} min</span>
            {florist.minPricePaise && (
              <span className="text-slate-300 ml-auto">From {formatPrice(florist.minPricePaise)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
