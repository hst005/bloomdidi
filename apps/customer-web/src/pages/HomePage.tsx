import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { FloristCard, type Florist } from '../components/FloristCard';
import { LocationPicker } from '../components/LocationPicker';
import { FeedGrid, PageContainer } from '../components/PageContainer';
import { useMotionPrefs } from '../store/cart';
import { useLocationStore } from '../store/location';

type Sort = 'nearest' | 'rating' | 'price' | 'fastest';

const FILTERS: { id: Sort; label: string }[] = [
  { id: 'nearest', label: 'Nearest' },
  { id: 'rating', label: 'Top rated' },
  { id: 'price', label: 'Under ₹500' },
  { id: 'fastest', label: 'Fastest' },
];

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

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 text-slate-100"
    >
      {orderPlaced && (
        <div className="bg-brand-600 text-center py-3 text-sm text-white">
          Order placed!{' '}
          <Link to="/orders" className="underline font-medium">
            Track your order
          </Link>
          {' · '}
          <button type="button" onClick={() => setOrderPlaced(false)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Location + search — narrow band centered like Swiggy */}
      <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 py-3">
        <PageContainer>
          <div className="max-w-[640px] mx-auto">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 text-left w-full hover:opacity-90 transition-opacity"
            >
              <span className="text-brand-400" aria-hidden>
                📍
              </span>
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
              className="mt-3 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSort(f.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sort === f.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        {loading ? (
          <FeedGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bd-skeleton rounded-[14px]" style={{ height: 230 }} />
            ))}
          </FeedGrid>
        ) : error ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <p className="text-amber-400 text-sm">{error}</p>
            <button
              type="button"
              onClick={loadFlorists}
              className="mt-4 px-4 py-2 bg-brand-600 rounded-lg text-sm font-medium text-white hover:bg-brand-500"
            >
              Retry
            </button>
          </div>
        ) : florists.length === 0 ? (
          <EmptyFeed location={deliveryLocation.label} onChangeLocation={() => setPickerOpen(true)} />
        ) : (
          <FeedGrid>
            {florists.map((f, i) => (
              <FloristCard key={f.id} florist={f} index={i} />
            ))}
          </FeedGrid>
        )}
      </PageContainer>

      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </motion.div>
  );
}

function EmptyFeed({
  location,
  onChangeLocation,
}: {
  location: string;
  onChangeLocation: () => void;
}) {
  return (
    <div
      className="max-w-[420px] mx-auto my-14 text-center px-7 py-9 rounded-[var(--bd-radius-lg)]"
      style={{ background: 'var(--bd-surface-alt)' }}
    >
      <div className="text-4xl mb-3 opacity-60" aria-hidden>
        📍
      </div>
      <div className="font-medium text-lg" style={{ color: 'var(--bd-ink)' }}>
        No florists nearby yet
      </div>
      <p className="text-sm mt-2 mb-5" style={{ color: 'var(--bd-ink-soft)' }}>
        We couldn&apos;t find florists delivering to {location}. Try a nearby area like Green Park.
      </p>
      <button
        type="button"
        onClick={onChangeLocation}
        className="bd-btn bd-btn-primary"
        style={{ background: 'var(--bd-rose)', color: '#fff' }}
      >
        Change location
      </button>
    </div>
  );
}
