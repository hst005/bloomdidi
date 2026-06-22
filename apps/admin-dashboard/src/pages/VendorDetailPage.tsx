import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt } from '../lib/api';
import type { VendorDetail } from '../lib/types';
import { KpiCard, PageHeader, StatusBadge, Td, Th, TableShell } from '../components/ui';

export function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    const v = await api.fetch<VendorDetail>(`/admin/vendors/${id}`);
    setVendor(v);
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);

  const action = async (endpoint: string) => {
    if (!id) return;
    setBusy(true);
    try {
      await api.fetch(`/admin/vendors/${id}/${endpoint}`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (!vendor && !error) {
    return <p className="text-slate-500">Loading…</p>;
  }

  if (!vendor) {
    return (
      <>
        <p className="text-red-400">{error}</p>
        <Link to="/vendors" className="text-sm text-emerald-400 mt-2 inline-block">
          ← Back to vendors
        </Link>
      </>
    );
  }

  return (
    <>
      <Link to="/vendors" className="text-sm text-slate-500 hover:text-slate-300">
        ← Vendors
      </Link>
      <PageHeader
        title={vendor.shopName}
        action={
            <div className="flex gap-2">
              {vendor.status === 'PENDING' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => action('approve')}
                  className="px-3 py-1.5 text-sm bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50"
                >
                  Approve
                </button>
              )}
              {vendor.status === 'ACTIVE' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => action('suspend')}
                  className="px-3 py-1.5 text-sm border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
              {vendor.status === 'SUSPENDED' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => action('reactivate')}
                  className="px-3 py-1.5 text-sm bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
            </div>
          }
      />
      <div className="flex items-center gap-3 text-sm text-slate-400 mb-6">
          <StatusBadge status={vendor.status} />
          <span>{vendor.owner.name ?? vendor.owner.phone}</span>
          <span>·</span>
          <span>{vendor.serviceRadiusKm} km radius</span>
          <span>·</span>
          <span>{vendor.isOpen ? 'Open' : 'Closed'}</span>
        </div>
        {vendor.description && (
          <p className="text-sm text-slate-500 mt-2 max-w-2xl mb-6">{vendor.description}</p>
        )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard label="Total orders" value={vendor.orderCount} />
        <KpiCard label="Lifetime GMV" value={fmt(vendor.totalGmv)} />
        <KpiCard label="Products" value={vendor.products.length} />
        <KpiCard label="Rating" value={vendor.rating.toFixed(1)} sub={`${vendor.reviewCount} reviews`} />
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Menu ({vendor.products.length})</h2>
          <TableShell>
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="text-right">Stock</Th>
                  <Th>Available</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {vendor.products.map((p) => (
                  <tr key={p.id}>
                    <Td>{p.name}</Td>
                    <Td className="text-slate-400">{p.category}</Td>
                    <Td className="text-right">{fmt(p.basePrice)}</Td>
                    <Td className="text-right">{p.stockQty}</Td>
                    <Td>{p.isAvailable ? 'Yes' : 'Hidden'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent orders</h2>
          <TableShell>
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {vendor.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  vendor.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <Td className="font-mono text-xs text-slate-400">{o.id.slice(0, 8)}…</Td>
                      <Td>{o.customerName ?? o.customerPhone}</Td>
                      <Td>
                        <StatusBadge status={o.status} />
                      </Td>
                      <Td className="text-right">{fmt(o.total)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableShell>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Payout history</h2>
          <TableShell>
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr>
                  <Th>Period</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Gross</Th>
                  <Th className="text-right">Net</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {vendor.payouts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No payouts recorded.
                    </td>
                  </tr>
                ) : (
                  vendor.payouts.map((p) => (
                    <tr key={p.id}>
                      <Td className="text-slate-400 text-xs">
                        {p.periodStart.slice(0, 10)} → {p.periodEnd.slice(0, 10)}
                      </Td>
                      <Td>
                        <StatusBadge status={p.status} />
                      </Td>
                      <Td className="text-right">{fmt(p.grossAmount)}</Td>
                      <Td className="text-right">{fmt(p.netAmount)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableShell>
        </section>
      </div>
    </>
  );
}
