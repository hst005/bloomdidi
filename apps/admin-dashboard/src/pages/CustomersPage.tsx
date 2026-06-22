import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { CustomerRow } from '../lib/types';
import { EmptyRow, PageHeader, Td, Th, TableShell } from '../components/ui';

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .fetch<CustomerRow[]>('/admin/customers')
      .then(setCustomers)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader title="Customers" />
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <TableShell>
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900">
            <tr>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th className="text-right">Orders</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {customers.length === 0 ? (
              <EmptyRow colSpan={4} message="No customers yet." />
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30">
                  <Td>{c.name ?? '—'}</Td>
                  <Td>{c.phone}</Td>
                  <Td className="text-right tabular-nums">{c.orderCount}</Td>
                  <Td className="text-slate-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
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
