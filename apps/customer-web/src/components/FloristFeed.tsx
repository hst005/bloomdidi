import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { FloristCard, type Florist } from './FloristCard';
import { LocationPicker } from './LocationPicker';
import { FeedGrid, PageContainer } from './PageContainer';
import { useMotionPrefs } from '../store/cart';
import { useLocationStore } from '../store/location';

export type FeedSort = 'nearest' | 'rating' | 'price' | 'fastest';

const FILTERS: { id: FeedSort; label: string }[] = [
  { id: 'nearest', label: 'Nearest' },
  { id: 'rating', label: 'Top rated' },
  { id: 'price', label: 'Under ₹500' },
  { id: 'fastest', label: 'Fastest' },
];

interface FloristFeedProps {
  orderPlaced?: boolean;
  onDismissOrderPlaced?: () => void;
}

/** Fully tokenized discovery feed — zero hardcoded hex; themes via CSS variables. */
export function FloristFeed({ orderPlaced, onDismissOrderPlaced }: FloristFeedProps) {
  const deliveryLocation = useLocationStore((s) => s.location);
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<FeedSort>('nearest');
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
      style={{ background: 'var(--bd-bg)', minHeight: '100%' }}
    >
      {orderPlaced && (
        <div
          className="text-center py-3 text-sm"
          style={{ background: 'var(--bd-rose)', color: 'var(--bd-rose-on)' }}
        >
          Order placed!{' '}
          <Link to="/orders" className="underline font-medium">
            Track your order
          </Link>
          {' · '}
          <button type="button" onClick={onDismissOrderPlaced} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bd-feed-toolbar py-4">
        <PageContainer>
          <div style={{ maxWidth: 720, margin: '0 auto 12px', padding: '0 0 4px' }}>
            <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: 'var(--bd-ink)', margin: 0 }}>
              Florists near you
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--bd-ink-soft)' }}>
              Curated local partners · Same-day delivery · Enterprise-grade tracking
            </p>
          </div>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 8px' }}>
            <LocationBar location={deliveryLocation.label} onClick={() => setPickerOpen(true)} />
            <SearchBar value={search} onChange={setSearch} />
            <FilterChips active={sort} onFilter={setSort} />
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        {loading ? (
          <FeedGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bd-skeleton" style={{ height: 230, borderRadius: 14 }} />
            ))}
          </FeedGrid>
        ) : error ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <p className="text-sm" style={{ color: 'var(--bd-amber)' }}>
              {error}
            </p>
            <button type="button" onClick={loadFlorists} className="bd-btn bd-btn-primary mt-4">
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

function LocationBar({ location, onClick }: { location: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <span style={{ fontSize: 16, color: 'var(--bd-rose)' }} aria-hidden>
        📍
      </span>
      <span style={{ fontSize: 13, color: 'var(--bd-ink-soft)' }}>Deliver to</span>
      <span style={{ fontSize: 14, color: 'var(--bd-ink)', fontWeight: 500, flex: 1, minWidth: 0 }} className="truncate">
        {location}
      </span>
      <span style={{ fontSize: 15, color: 'var(--bd-ink-soft)' }} aria-hidden>
        ▾
      </span>
    </button>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="bd-search-wrap">
      <span style={{ fontSize: 17, color: 'var(--bd-ink-soft)' }} aria-hidden>
        🔍
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search roses, lilies, bouquets"
        className="bd-search-input"
      />
    </div>
  );
}

function FilterChips({ active, onFilter }: { active: FeedSort; onFilter: (id: FeedSort) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', marginTop: 12 }}>
      {FILTERS.map(({ id, label }) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onFilter(id)}
            className={`bd-filter-chip${on ? ' is-active' : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyFeed({
  location,
  onChangeLocation,
}: {
  location: string;
  onChangeLocation: () => void;
}) {
  return (
    <div
      style={{
        maxWidth: 420,
        margin: '60px auto',
        textAlign: 'center',
        padding: '36px 28px',
        background: 'var(--bd-surface-alt)',
        borderRadius: 'var(--bd-radius-lg)',
      }}
    >
      <div style={{ fontSize: 36, color: 'var(--bd-ink-soft)', opacity: 0.6 }} aria-hidden>
        📍
      </div>
      <div style={{ fontWeight: 500, fontSize: 17, color: 'var(--bd-ink)', marginTop: 12 }}>
        No florists nearby yet
      </div>
      <p style={{ color: 'var(--bd-ink-soft)', fontSize: 14, margin: '8px 0 20px' }}>
        We couldn&apos;t find florists delivering to {location}. Try a nearby area.
      </p>
      <button type="button" onClick={onChangeLocation} className="bd-btn bd-btn-primary">
        Change location
      </button>
    </div>
  );
}
