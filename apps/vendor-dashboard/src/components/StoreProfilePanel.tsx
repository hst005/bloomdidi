import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SmartImage } from './SmartImage';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type DayHours = { open: string; close: string; closed: boolean };

type StoreBank = {
  accountName?: string | null;
  last4?: string;
  ifsc?: string;
};

export type VendorStore = {
  id: string;
  shopName: string;
  description: string | null;
  imageUrl: string | null;
  isOpen: boolean;
  serviceRadiusKm: number;
  hours: Record<string, DayHours>;
  bank: StoreBank | null;
  rating: number;
  reviewCount: number;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    customerName: string | null;
    createdAt: string;
  }[];
};

interface StoreProfilePanelProps {
  shopId: string;
}

function qs(shopId: string) {
  return `?shopId=${encodeURIComponent(shopId)}`;
}

function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) reject(new Error('Choose a JPG or PNG image.'));
    else if (file.size > 2 * 1024 * 1024) reject(new Error('Image must be under 2 MB.'));
    else {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not read image.'));
      reader.readAsDataURL(file);
    }
  });
}

export function StoreProfilePanel({ shopId }: StoreProfilePanelProps) {
  const [store, setStore] = useState<VendorStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.fetch<VendorStore>(`/vendor/store${qs(shopId)}`);
      setStore(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load store profile');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    setLoading(true);
    load().catch(console.error);
  }, [load]);

  const patch = (changes: Partial<VendorStore>) => {
    setStore((s) => (s ? { ...s, ...changes } : s));
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bd-skeleton" style={{ height: 120, marginBottom: 14 }} />
        ))}
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bd-error" style={{ maxWidth: 640, margin: '0 auto' }}>
        {error || 'Store not found'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600, color: 'var(--bd-ink)' }}>
        Store profile
      </h2>
      <p style={{ color: 'var(--bd-ink-soft)', fontSize: 14, marginTop: 4, marginBottom: 20 }}>
        Hours, delivery radius, and how customers see your shop.
      </p>

      {error && <div className="bd-error" style={{ marginBottom: 14 }}>{error}</div>}

      <StatusToggle shopId={shopId} store={store} onChange={patch} onError={setError} />
      <StoreDetailsSection shopId={shopId} store={store} onChange={patch} onError={setError} />
      <HoursSection shopId={shopId} store={store} onChange={patch} onError={setError} />
      <RadiusSection shopId={shopId} store={store} onChange={patch} onError={setError} />
      <BankSection shopId={shopId} store={store} onChange={patch} onError={setError} />
      <ReviewsSection store={store} />
    </div>
  );
}

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      className={`bd-switch ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
    >
      <span className="bd-switch-knob" />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bd-card bd-rise bd-card-static" style={{ padding: 18, marginBottom: 14 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--bd-ink)' }}>{title}</h3>
      {children}
    </div>
  );
}

function SaveRow({
  dirty,
  onSave,
  saveLabel = 'Save',
}: {
  dirty: boolean;
  onSave: () => Promise<void>;
  saveLabel?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const go = async () => {
    setSaving(true);
    setErr('');
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          className="bd-btn bd-btn-primary"
          disabled={!dirty || saving}
          onClick={go}
        >
          {saving ? 'Saving…' : saveLabel}
        </button>
        {saved && <span style={{ fontSize: 13, color: 'var(--bd-green)' }}>Saved ✓</span>}
      </div>
      {err && <p style={{ fontSize: 13, color: 'var(--bd-danger)', marginTop: 8 }}>{err}</p>}
    </div>
  );
}

function StatusToggle({
  shopId,
  store,
  onChange,
  onError,
}: {
  shopId: string;
  store: VendorStore;
  onChange: (c: Partial<VendorStore>) => void;
  onError: (msg: string) => void;
}) {
  const open = store.isOpen;

  const toggle = async () => {
    const prev = open;
    onChange({ isOpen: !open });
    onError('');
    try {
      const updated = await api.fetch<VendorStore>(`/vendor/store/status${qs(shopId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isOpen: !open }),
      });
      onChange({ isOpen: updated.isOpen });
    } catch (e) {
      onChange({ isOpen: prev });
      onError(e instanceof Error ? e.message : 'Could not update status');
    }
  };

  return (
    <div
      className="bd-card bd-rise bd-card-static"
      style={{
        padding: 18,
        marginBottom: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        background: open ? 'var(--bd-green-soft)' : 'var(--bd-surface-alt)',
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 16,
            color: open ? 'var(--bd-green)' : 'var(--bd-ink-soft)',
          }}
        >
          {open ? 'You are online' : 'You are offline'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginTop: 2 }}>
          {open ? 'Customers can place orders now.' : 'Hidden from the customer app.'}
        </div>
      </div>
      <Switch on={open} onClick={toggle} label={open ? 'Go offline' : 'Go online'} />
    </div>
  );
}

function StoreDetailsSection({
  shopId,
  store,
  onChange,
  onError,
}: {
  shopId: string;
  store: VendorStore;
  onChange: (c: Partial<VendorStore>) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState({
    shopName: store.shopName,
    description: store.description ?? '',
    imageUrl: store.imageUrl ?? '',
  });

  useEffect(() => {
    setDraft({
      shopName: store.shopName,
      description: store.description ?? '',
      imageUrl: store.imageUrl ?? '',
    });
  }, [store.shopName, store.description, store.imageUrl]);

  const dirty =
    draft.shopName !== store.shopName ||
    draft.description !== (store.description ?? '') ||
    draft.imageUrl !== (store.imageUrl ?? '');

  const save = async () => {
    onError('');
    const updated = await api.fetch<VendorStore>(`/vendor/store${qs(shopId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        shopName: draft.shopName.trim(),
        description: draft.description.trim() || undefined,
        ...(draft.imageUrl ? { imageUrl: draft.imageUrl } : {}),
      }),
    });
    onChange({
      shopName: updated.shopName,
      description: updated.description,
      imageUrl: updated.imageUrl,
    });
  };

  return (
    <Section title="Store details">
      <label className="bd-label-block">Shop name</label>
      <input
        className="bd-input"
        value={draft.shopName}
        onChange={(e) => setDraft((d) => ({ ...d, shopName: e.target.value }))}
      />
      <label className="bd-label-block">Description</label>
      <textarea
        className="bd-input"
        rows={3}
        value={draft.description}
        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        style={{ resize: 'vertical' }}
        placeholder="Tell customers what makes your shop special…"
      />
      <p style={{ fontSize: 12, color: 'var(--bd-ink-soft)', marginTop: 10 }}>
        Photo: clear bouquet or storefront on a neutral background — no event setup shots.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <SmartImage src={draft.imageUrl} alt={draft.shopName} />
        <label className="bd-btn" style={{ cursor: 'pointer' }}>
          ↑ Upload photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              readPhoto(file)
                .then((imageUrl) => setDraft((d) => ({ ...d, imageUrl })))
                .catch((err) => onError(err instanceof Error ? err.message : 'Invalid image'));
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <SaveRow dirty={dirty && draft.shopName.trim().length >= 2} onSave={save} />
    </Section>
  );
}

function HoursSection({
  shopId,
  store,
  onChange,
  onError,
}: {
  shopId: string;
  store: VendorStore;
  onChange: (c: Partial<VendorStore>) => void;
  onError: (msg: string) => void;
}) {
  const [hours, setHours] = useState(store.hours);
  const [baseline, setBaseline] = useState(JSON.stringify(store.hours));

  useEffect(() => {
    setHours(store.hours);
    setBaseline(JSON.stringify(store.hours));
  }, [store.hours]);

  const dirty = JSON.stringify(hours) !== baseline;

  const setDay = (day: string, field: keyof DayHours, val: string | boolean) => {
    setHours((h) => ({
      ...h,
      [day]: { ...h[day], [field]: val },
    }));
  };

  const save = async () => {
    onError('');
    const updated = await api.fetch<VendorStore>(`/vendor/store${qs(shopId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ hours }),
    });
    onChange({ hours: updated.hours });
    setBaseline(JSON.stringify(updated.hours));
  };

  return (
    <Section title="Opening hours">
      {DAYS.map((day) => {
        const d = hours[day] ?? { open: '09:00', close: '21:00', closed: false };
        return (
          <div
            key={day}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ width: 38, fontSize: 14, fontWeight: 500 }}>{day}</span>
            {d.closed ? (
              <span style={{ flex: 1, color: 'var(--bd-ink-soft)', fontSize: 14 }}>Closed</span>
            ) : (
              <>
                <input
                  type="time"
                  className="bd-input"
                  style={{ width: 'auto', flex: 1, minWidth: 100 }}
                  value={d.open}
                  onChange={(e) => setDay(day, 'open', e.target.value)}
                />
                <span style={{ color: 'var(--bd-ink-soft)' }}>–</span>
                <input
                  type="time"
                  className="bd-input"
                  style={{ width: 'auto', flex: 1, minWidth: 100 }}
                  value={d.close}
                  onChange={(e) => setDay(day, 'close', e.target.value)}
                />
              </>
            )}
            <Switch
              on={!d.closed}
              onClick={() => setDay(day, 'closed', !d.closed)}
              label={`${day} open`}
            />
          </div>
        );
      })}
      <SaveRow dirty={dirty} onSave={save} />
    </Section>
  );
}

function RadiusSection({
  shopId,
  store,
  onChange,
  onError,
}: {
  shopId: string;
  store: VendorStore;
  onChange: (c: Partial<VendorStore>) => void;
  onError: (msg: string) => void;
}) {
  const [km, setKm] = useState(store.serviceRadiusKm);
  const dirty = km !== store.serviceRadiusKm;
  const reachHint = Math.round(km * km * 120);

  useEffect(() => {
    setKm(store.serviceRadiusKm);
  }, [store.serviceRadiusKm]);

  const save = async () => {
    onError('');
    const updated = await api.fetch<VendorStore>(`/vendor/store/radius${qs(shopId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ serviceRadiusKm: km }),
    });
    onChange({ serviceRadiusKm: updated.serviceRadiusKm });
  };

  return (
    <Section title="Delivery radius">
      <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginBottom: 12 }}>
        How far you&apos;ll deliver. Customers beyond this won&apos;t see your shop in discovery.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <input
          type="range"
          min={1}
          max={15}
          step={1}
          value={km}
          onChange={(e) => setKm(+e.target.value)}
          style={{ flex: 1, accentColor: 'var(--bd-rose)' }}
        />
        <span style={{ fontWeight: 500, minWidth: 56, textAlign: 'right' }}>{km} km</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--bd-rose)', marginTop: 8 }}>
        ≈ {reachHint.toLocaleString('en-IN')} households in range
      </div>
      <SaveRow dirty={dirty} onSave={save} saveLabel="Save radius" />
    </Section>
  );
}

function BankSection({
  shopId,
  store,
  onChange,
  onError,
}: {
  shopId: string;
  store: VendorStore;
  onChange: (c: Partial<VendorStore>) => void;
  onError: (msg: string) => void;
}) {
  const [bank, setBank] = useState({
    accountName: store.bank?.accountName ?? '',
    accountNumber: '',
    ifsc: store.bank?.ifsc ?? '',
  });

  const hasExisting = !!store.bank?.last4;
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc);
  const acctValid = bank.accountNumber.length >= 9;
  const valid = bank.accountName.trim().length >= 2 && ifscValid && acctValid;

  const save = async () => {
    onError('');
    const updated = await api.fetch<VendorStore>(`/vendor/store${qs(shopId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        bank: {
          accountName: bank.accountName.trim(),
          accountNumber: bank.accountNumber,
          ifsc: bank.ifsc.toUpperCase(),
        },
      }),
    });
    onChange({ bank: updated.bank });
    setBank((b) => ({ ...b, accountNumber: '' }));
  };

  return (
    <Section title="Payout bank account">
      {hasExisting && (
        <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginBottom: 10 }}>
          Current: account ending ••{store.bank!.last4} · {store.bank!.ifsc}
        </div>
      )}
      <label className="bd-label-block">Account holder name</label>
      <input
        className="bd-input"
        value={bank.accountName}
        onChange={(e) => setBank((b) => ({ ...b, accountName: e.target.value }))}
      />
      <label className="bd-label-block">Account number</label>
      <input
        className="bd-input"
        value={bank.accountNumber}
        inputMode="numeric"
        placeholder={hasExisting ? 'Enter to replace' : ''}
        onChange={(e) =>
          setBank((b) => ({ ...b, accountNumber: e.target.value.replace(/\D/g, '') }))
        }
      />
      <label className="bd-label-block">IFSC code</label>
      <input
        className="bd-input"
        value={bank.ifsc}
        onChange={(e) => setBank((b) => ({ ...b, ifsc: e.target.value.toUpperCase() }))}
        style={{
          boxShadow:
            bank.ifsc && !ifscValid
              ? '0 0 0 2px var(--bd-danger-soft)'
              : undefined,
        }}
      />
      {bank.ifsc && !ifscValid && (
        <div style={{ fontSize: 12, color: 'var(--bd-danger)', marginTop: 4 }}>
          IFSC looks invalid (format: ABCD0123456)
        </div>
      )}
      <SaveRow dirty={valid} onSave={save} saveLabel="Save bank details" />
    </Section>
  );
}

function ReviewsSection({ store }: { store: VendorStore }) {
  return (
    <Section title="Reviews">
      <p style={{ fontSize: 13, color: 'var(--bd-ink-soft)', margin: '0 0 12px' }}>
        ★ {store.rating.toFixed(1)} · {store.reviewCount} total
      </p>
      {store.reviews.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--bd-ink-soft)', margin: 0 }}>No reviews yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {store.reviews.map((r) => (
            <li
              key={r.id}
              style={{
                fontSize: 14,
                borderBottom: '0.5px solid #efe7dd',
                paddingBottom: 12,
                marginBottom: 12,
              }}
            >
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--bd-ink)' }}>
                {'★'.repeat(r.rating)}
                <span style={{ color: 'var(--bd-ink-soft)', fontWeight: 400, marginLeft: 8 }}>
                  {r.customerName ?? 'Customer'}
                </span>
              </p>
              {r.comment && (
                <p style={{ margin: '6px 0 0', color: 'var(--bd-ink-soft)' }}>{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
