import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../lib/api';
import type { PayoutRow } from '../lib/types';
import { EmptyRow, PageHeader, StatusBadge, Td, Th, TableShell } from '../components/ui';

export function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = status ? `?status=${status}` : '';
    setPayouts(await api.fetch<PayoutRow[]>(`/admin/payouts${q}`));
  }, [status]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const act = async (id: string, action: 'approve' | 'settle') => {
    setBusy(id);
    try {
      await api.fetch(`/admin/payouts/${id}/${action}`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Payouts"
        action={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SETTLED">Settled</option>
            <option value="FAILED">Failed</option>
          </select>
        }
      />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <TableShell>
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr>
              <Th>Florist</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th className="text-right">Gross</Th>
              <Th className="text-right">Commission</Th>
              <Th className="text-right">Net owed</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {payouts.length === 0 ? (
              <EmptyRow colSpan={7} message="No payouts found." />
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <Td>
                    <Link to={`/vendors/${p.shopId}`} className="hover:text-emerald-400">
                      {p.shopName}
                    </Link>
                  </Td>
                  <Td className="text-xs text-slate-400">
                    {p.periodStart.slice(0, 10)} → {p.periodEnd.slice(0, 10)}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td className="text-right">{fmt(p.grossAmount)}</Td>
                  <Td className="text-right text-slate-400">{fmt(p.commission)}</Td>
                  <Td className="text-right font-medium">{fmt(p.netAmount)}</Td>
                  <Td>
                    <div className="flex gap-2">
                      {p.status === 'PENDING' && (
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() => act(p.id, 'approve')}
                          className="text-xs px-2 py-1 rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
                        >
                          Approve
                        </button>
                      )}
                      {p.status === 'APPROVED' && (
                        <button
                          type="button"
                          disabled={busy === p.id}
                          onClick={() => act(p.id, 'settle')}
                          className="text-xs px-2 py-1 rounded border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 disabled:opacity-40"
                        >
                          Mark settled
                        </button>
                      )}
                    </div>
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
