import { useEffect, useState } from 'react';
import { api, fmt } from '../lib/api';
import type { DisputeRow } from '../lib/types';
import { EmptyRow, PageHeader, StatusBadge, Td, Th, TableShell } from '../components/ui';

export function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .fetch<DisputeRow[]>('/admin/disputes')
      .then(setDisputes)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader title="Disputes & refunds" />
      <p className="text-sm text-slate-500 mb-4">
        Cancelled orders, failed payments, and refund cases requiring review.
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <TableShell>
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr>
              <Th>Order</Th>
              <Th>Florist</Th>
              <Th>Customer</Th>
              <Th>Order status</Th>
              <Th>Payment</Th>
              <Th className="text-right">Amount</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {disputes.length === 0 ? (
              <EmptyRow colSpan={7} message="No disputes in queue — all clear." />
            ) : (
              disputes.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30">
                  <Td className="font-mono text-xs text-slate-400">{d.id.slice(0, 8)}…</Td>
                  <Td>{d.shopName}</Td>
                  <Td>
                    {d.customerName ?? '—'}
                    <p className="text-xs text-slate-500">{d.customerPhone}</p>
                  </Td>
                  <Td>
                    <StatusBadge status={d.status} />
                  </Td>
                  <Td className="text-slate-400 text-xs">
                    {d.paymentStatus ?? '—'}
                    {d.paymentMethod && ` · ${d.paymentMethod}`}
                  </Td>
                  <Td className="text-right">{fmt(d.total)}</Td>
                  <Td className="text-xs text-slate-400">
                    {new Date(d.updatedAt).toLocaleDateString('en-IN')}
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
