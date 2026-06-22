import { useCallback, useEffect, useState } from 'react';
import { api, fmt } from '../lib/api';
import type { OrderRow } from '../lib/types';
import { EmptyRow, PageHeader, StatusBadge, Td, Th, TableShell } from '../components/ui';

const STATUSES = [
  '',
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'PENDING_PAYMENT',
];

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const q = status ? `?status=${status}` : '';
    setOrders(await api.fetch<OrderRow[]>(`/admin/orders${q}`));
  }, [status]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  return (
    <>
      <PageHeader
        title="Orders"
        action={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
          >
            {STATUSES.map((s) => (
              <option key={s || 'all'} value={s}>
                {s ? s.replace(/_/g, ' ') : 'All statuses'}
              </option>
            ))}
          </select>
        }
      />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <TableShell>
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr>
              <Th>Order ID</Th>
              <Th>Florist</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {orders.length === 0 ? (
              <EmptyRow colSpan={6} message="No orders match this filter." />
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/30">
                  <Td className="font-mono text-xs text-slate-400">{o.id.slice(0, 8)}…</Td>
                  <Td>{o.shopName}</Td>
                  <Td>
                    <span>{o.customerName ?? '—'}</span>
                    <p className="text-xs text-slate-500">{o.customerPhone}</p>
                  </Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className="text-right tabular-nums">{fmt(o.total)}</Td>
                  <Td className="text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
