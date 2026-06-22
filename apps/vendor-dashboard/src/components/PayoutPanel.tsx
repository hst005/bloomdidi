import { formatPrice } from '../lib/api';

interface PayoutSummary {
  commissionPct: number;
  pending: {
    grossAmount: number;
    commission: number;
    netAmount: number;
    orderCount: number;
  };
  history: {
    id: string;
    grossAmount: number;
    commission: number;
    netAmount: number;
    status: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  }[];
}

interface DashboardSummary {
  commissionPct: number;
  pendingOrders: number;
  todayOrders: number;
  todayGross: number;
  lifetimeGross: number;
  lifetimeCommission: number;
  lifetimeNet: number;
}

interface PayoutPanelProps {
  shopId: string;
  dashboard: DashboardSummary | null;
  payouts: PayoutSummary | null;
  onRefresh: () => void;
}

export function PayoutPanel({ dashboard, payouts }: PayoutPanelProps) {
  if (!dashboard || !payouts) {
    return <p className="text-slate-400 text-center py-12">Loading earnings…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Today's orders" value={String(dashboard.todayOrders)} />
        <StatCard label="Today's gross" value={formatPrice(dashboard.todayGross)} />
        <StatCard label="Pending orders" value={String(dashboard.pendingOrders)} />
        <StatCard label="Commission rate" value={`${dashboard.commissionPct}%`} />
      </div>

      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <h2 className="font-semibold text-brand-900">Pending payout</h2>
        <p className="text-sm text-slate-500 mt-1">
          From {payouts.pending.orderCount} delivered order(s) — commission set by admin
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Gross earnings" value={formatPrice(payouts.pending.grossAmount)} />
          <Row label={`Platform commission (${payouts.commissionPct}%)`} value={`−${formatPrice(payouts.pending.commission)}`} />
          <Row label="Net payout" value={formatPrice(payouts.pending.netAmount)} bold />
        </dl>
      </div>

      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <h2 className="font-semibold text-brand-900">Lifetime summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Total gross" value={formatPrice(dashboard.lifetimeGross)} />
          <Row label="Total commission" value={formatPrice(dashboard.lifetimeCommission)} />
          <Row label="Total net" value={formatPrice(dashboard.lifetimeNet)} bold />
        </dl>
      </div>

      {payouts.history.length > 0 && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <h2 className="font-semibold text-brand-900 mb-4">Payout history</h2>
          <ul className="space-y-3">
            {payouts.history.map((p) => (
              <li key={p.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                <div>
                  <p className="font-medium text-brand-800">{formatPrice(p.netAmount)}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
                  {p.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-brand-800 mt-1">{value}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-brand-900 pt-2 border-t border-slate-100' : 'text-slate-600'}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
