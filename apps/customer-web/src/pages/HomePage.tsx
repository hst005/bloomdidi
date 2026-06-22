import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { FloristCard, type Florist } from '../components/FloristCard';
import { useMotionPrefs } from '../store/cart';

const DEFAULT_LAT = 28.5244;
const DEFAULT_LNG = 77.1855;
const LOCATION_LABEL = 'Green Park, South Delhi';

type Sort = 'nearest' | 'rating' | 'price' | 'fastest';

export function HomePage() {
  const location = useLocation();
  const [orderPlaced, setOrderPlaced] = useState(
    !!(location.state as { orderPlaced?: boolean } | null)?.orderPlaced,
  );
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>('nearest');
  const [search, setSearch] = useState('');
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const q = search ? `&q=${encodeURIComponent(search)}` : '';
        const list = await api.fetch<Florist[]>(
          `/florists?lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}&sort=${sort}${q}`,
        );
        setFlorists(list);
      } catch {
        setFlorists([]);
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [sort, search]);

  const filters: { id: Sort; label: string }[] = [
    { id: 'nearest', label: 'Nearest' },
    { id: 'rating', label: 'Top rated' },
    { id: 'price', label: 'Under ₹500' },
    { id: 'fastest', label: 'Fastest' },
  ];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 text-slate-100"
    >
      {orderPlaced && (
        <div className="bg-emerald-600 text-center py-3 text-sm">
          Order placed!{' '}
          <button onClick={() => setOrderPlaced(false)} className="underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Location bar */}
      <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <button className="flex items-center gap-2 text-left w-full">
          <span className="text-blue-400">📍</span>
          <div>
            <p className="text-xs text-slate-400">Deliver to</p>
            <p className="font-semibold text-sm">{LOCATION_LABEL}</p>
          </div>
          <span className="ml-auto text-slate-500">▾</span>
        </button>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roses, lilies, bouquets"
          className="mt-3 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSort(f.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sort === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-56 rounded-2xl bg-slate-900 animate-pulse" />)
        ) : florists.length === 0 ? (
          <p className="text-slate-500 text-center py-12">
            No florists deliver to your area. Try a different location or ask admin to increase discovery radius.
          </p>
        ) : (
          florists.map((f, i) => <FloristCard key={f.id} florist={f} index={i} />)
        )}
      </div>
    </motion.div>
  );
}
