import { useEffect, useState } from 'react';
import { api, formatPrice } from '../lib/api';

type Range = '7d' | '30d' | 'mtd';

const RANGES: [Range, string][] = [
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['mtd', 'This month'],
];

type EarningsSummary = {
  gross: number;
  commission: number;
  commissionPct: number;
  adjustments: number;
  refunds: number;
  net: number;
  orderCount: number;
};

type TrendPoint = { label: string; date: string; amount: number };

type PayoutRow = {
  id: string;
  period: string;
  gross: number;
  commission: number;
  adjustments: number;
  net: number;
  status: 'pending' | 'paid' | 'failed';
  expectedDate?: string;
  bankLast4?: string | null;
  downloadable?: boolean;
};

interface EarningsPanelProps {
  shopId: string;
}

function qs(shopId: string, extra = '') {
  return `?shopId=${encodeURIComponent(shopId)}${extra}`;
}

async function downloadStatement(shopId: string, payoutId: string) {
  const token = api.getToken();
  const res = await fetch(
    `/api/v1/vendor/payouts/${payoutId}/statement${qs(shopId)}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (!res.ok) throw new Error('Could not download statement');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bloomdidi-payout-${payoutId.slice(0, 8)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EarningsPanel({ shopId }: EarningsPanelProps) {
  const [range, setRange] = useState<Range>('7d');
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    setError('');
    Promise.all([
      api.fetch<{ summary: EarningsSummary; trend: TrendPoint[] }>(
        `/vendor/earnings${qs(shopId, `&range=${range}`)}`,
      ),
      api.fetch<{ items: PayoutRow[] }>(`/vendor/payouts${qs(shopId)}`),
    ])
      .then(([e, p]) => {
        setSummary(e.summary);
        setTrend(e.trend);
        setPayouts(p.items ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load earnings'))
      .finally(() => setLoading(false));
  }, [shopId, range]);

  const nextPayout = payouts.find((p) => p.status === 'pending');

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 600, color: 'var(--bd-ink)' }}>
        Earnings
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {RANGES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRange(id)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              background: range === id ? 'var(--bd-rose)' : 'var(--bd-surface-alt)',
              color: range === id ? '#fff' : 'var(--bd-ink-soft)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="bd-error" style={{ marginBottom: 14 }}>{error}</div>}

      {loading ? (
        <div className="bd-skeleton" style={{ height: 300 }} />
      ) : (
        <>
          <SummaryStrip s={summary} />
          <Breakdown s={summary} />
          <TrendChart data={trend} />
          {nextPayout && <NextPayoutBanner payout={nextPayout} />}
          <SettlementHistory shopId={shopId} payouts={payouts} />
        </>
      )}
    </div>
  );
}

function SummaryStrip({ s }: { s: EarningsSummary | null }) {
  const cards: [string, string, string?][] = [
    ['Gross sales', formatPrice(s?.gross ?? 0)],
    ['Commission', '− ' + formatPrice(s?.commission ?? 0)],
    ['Net earnings', formatPrice(s?.net ?? 0), 'var(--bd-green)'],
    ['Orders', String(s?.orderCount ?? 0)],
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
        marginBottom: 16,
      }}
    >
      {cards.map(([label, val, color], i) => (
        <div
          key={label}
          className="bd-card bd-rise bd-card-static"
          style={{ padding: 14, animationDelay: `${i * 40}ms` }}
        >
          <div style={{ fontSize: 12, color: 'var(--bd-ink-soft)' }}>{label}</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: color ?? 'var(--bd-ink)',
            }}
          >
            {val}
          </div>
        </div>
      ))}
    </div>
  );
}

function Breakdown({ s }: { s: EarningsSummary | null }) {
  if (!s) return null;
  const rows: [string, string, string][] = [
    ['Gross sales', formatPrice(s.gross), 'var(--bd-ink)'],
    [
      `Platform commission (${s.commissionPct}%)`,
      '− ' + formatPrice(s.commission),
      'var(--bd-danger)',
    ],
    ['Delivery adjustments', '− ' + formatPrice(s.adjustments), 'var(--bd-danger)'],
    ['Refunds', '− ' + formatPrice(s.refunds), 'var(--bd-danger)'],
  ];
  return (
    <div className="bd-card bd-rise bd-card-static" style={{ padding: '4px 18px', marginBottom: 16 }}>
      {rows.map(([label, val, color]) => (
        <div
          key={label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '0.5px solid #efe7dd',
            fontSize: 14,
          }}
        >
          <span style={{ color: 'var(--bd-ink-soft)' }}>{label}</span>
          <span style={{ color }}>{val}</span>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '14px 0',
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        <span>Net earnings</span>
        <span style={{ color: 'var(--bd-green)' }}>{formatPrice(s.net)}</span>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) {
    return (
      <div
        className="bd-card bd-card-static"
        style={{ padding: 18, marginBottom: 16, color: 'var(--bd-ink-soft)', fontSize: 14 }}
      >
        No delivered orders in this period yet.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.amount), 1);
  const W = 680;
  const H = 140;
  const pad = 20;
  const gap = 6;
  const barW = Math.max(4, (W - pad * 2) / data.length - gap);

  return (
    <div className="bd-card bd-rise bd-card-static" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10, color: 'var(--bd-ink)' }}>
        Daily net earnings
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily earnings bar chart">
        {data.map((d, i) => {
          const h = (d.amount / max) * (H - pad * 2);
          const x = pad + i * (barW + gap);
          const y = H - pad - h;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, d.amount > 0 ? 4 : 0)}
                rx={4}
                fill="var(--bd-rose)"
                opacity={0.85}
              >
                <title>
                  {d.date}: {formatPrice(d.amount)}
                </title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function NextPayoutBanner({ payout }: { payout: PayoutRow }) {
  return (
    <div
      className="bd-card bd-rise bd-card-static"
      style={{
        padding: 16,
        marginBottom: 16,
        background: 'var(--bd-rose-soft)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)' }}>Next payout</div>
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--bd-rose)' }}>
          {formatPrice(payout.net)}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', textAlign: 'right' }}>
        {payout.expectedDate && (
          <>
            Expected {payout.expectedDate}
            <br />
          </>
        )}
        {payout.bankLast4 ? `to ••${payout.bankLast4}` : 'Add bank details in Store profile'}
      </div>
    </div>
  );
}

function SettlementHistory({
  shopId,
  payouts,
}: {
  shopId: string;
  payouts: PayoutRow[];
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const statusPill = (status: PayoutRow['status']) => {
    const map = {
      paid: ['var(--bd-green-soft)', 'var(--bd-green)', 'Paid'],
      pending: ['var(--bd-amber-soft)', '#a9701f', 'Pending'],
      failed: ['var(--bd-danger-soft)', 'var(--bd-danger)', 'Failed'],
    } as const;
    const [bg, fg, label] = map[status];
    return (
      <span
        style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 6,
          background: bg,
          color: fg,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    );
  };

  const download = async (id: string) => {
    setDownloading(id);
    try {
      await downloadStatement(shopId, id);
    } catch {
      // ignore
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bd-card bd-rise bd-card-static" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 18px 8px',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--bd-ink)',
        }}
      >
        Settlement history
      </div>
      {payouts.length === 0 ? (
        <p style={{ padding: '12px 18px 24px', fontSize: 14, color: 'var(--bd-ink-soft)', margin: 0 }}>
          No settlements yet. Delivered orders roll into payouts on the admin schedule.
        </p>
      ) : (
        <table className="bd-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 18px' }}>Period</th>
              <th>Gross</th>
              <th>Net</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: 18 }}></th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} style={{ cursor: 'default' }}>
                <td style={{ padding: '12px 18px', color: 'var(--bd-ink)' }}>{p.period}</td>
                <td style={{ color: 'var(--bd-ink-soft)' }}>{formatPrice(p.gross)}</td>
                <td style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>{formatPrice(p.net)}</td>
                <td>{statusPill(p.status)}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>
                  {p.downloadable !== false && p.id !== 'pending-unsettled' ? (
                    <button
                      type="button"
                      className="bd-btn bd-btn-ghost"
                      style={{ fontSize: 13, padding: '4px 10px' }}
                      disabled={downloading === p.id}
                      onClick={() => download(p.id)}
                    >
                      {downloading === p.id ? '…' : '⬇ Statement'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
