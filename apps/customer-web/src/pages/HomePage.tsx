import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { FloristCard, type Florist } from '../components/FloristCard';
import { LocationPicker } from '../components/LocationPicker';
import { useMotionPrefs } from '../store/cart';
import { useLocationStore } from '../store/location';

type Sort = 'nearest' | 'rating' | 'price' | 'fastest';

export function HomePage() {
  const routeLocation = useLocation();
  const deliveryLocation = useLocationStore((s) => s.location);
  const [orderPlaced, setOrderPlaced] = useState(
    !!(routeLocation.state as { orderPlaced?: boolean } | null)?.orderPlaced,
  );
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<Sort>('nearest');
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  const loadFlorists = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : '';
      const maxPrice = sort === 'price' ? '&maxPrice=50000' : '';
      const list = await api.fetch<Florist[]>(
        `/florists?lat=${deliveryLocation.lat}&lng=${deliveryLocation.lng}&sort=${sort}${q}${maxPrice}`,
      );
      setFlorists(list);
    } catch (e) {
      setFlorists([]);
      const msg = e instanceof Error ? e.message : 'Request failed';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED')) {
        setError(
          'Cannot reach the API. Start it first: npm run dev:api — then run npm run db:seed if this is a fresh setup.',
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [sort, search, deliveryLocation.lat, deliveryLocation.lng]);

  useEffect(() => {
    const t = setTimeout(loadFlorists, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadFlorists, search]);

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

      <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 text-left w-full hover:opacity-90 transition-opacity"
        >
          <span className="text-blue-400">📍</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">Deliver to</p>
            <p className="font-semibold text-sm truncate">{deliveryLocation.label}</p>
          </div>
          <span className="ml-auto text-slate-500 shrink-0">▾</span>
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
          [1, 2].map((i) => <div key={i} className="h-56 rounded-2xl bg-slate-900 animate-pulse" />)
        ) : error ? (
          <div className="text-center py-12 px-4">
            <p className="text-amber-400 text-sm">{error}</p>
            <button
              onClick={loadFlorists}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : florists.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-slate-500 text-sm">
              No florists deliver to {deliveryLocation.label}. Try a nearby area or pick Green Park, South Delhi.
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium"
            >
              Change location
            </button>
          </div>
        ) : (
          florists.map((f, i) => <FloristCard key={f.id} florist={f} index={i} />)
        )}
      </div>

      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </motion.div>
  );
}
