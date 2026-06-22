import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmt } from '../lib/api';
import type { VendorRow } from '../lib/types';
import { EmptyRow, PageHeader, StatusBadge, Td, Th, TableShell } from '../components/ui';

type SortKey = 'shopName' | 'status' | 'orderCount' | 'totalGmv' | 'serviceRadiusKm';

export function VendorsPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('shopName');
  const [sortAsc, setSortAsc] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const q = statusFilter ? `?status=${statusFilter}` : '';
    const list = await api.fetch<VendorRow[]>(`/admin/vendors${q}`);
    setVendors(list);
  }, [statusFilter]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...vendors];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [vendors, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <Th>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="bd-btn bd-btn-ghost"
        style={{ padding: 0, fontSize: 13 }}
      >
        {children} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
      </button>
    </Th>
  );

  const approveVendor = async (e: React.MouseEvent, vendorId: string) => {
    e.stopPropagation();
    await api.fetch(`/admin/vendors/${vendorId}/approve`, { method: 'POST' });
    await load();
  };

  return (
    <div className="bd-rise">
      <PageHeader
        title="Vendors"
        action={
          <select
            className="bd-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        }
      />

      {error && (
        <div className="bd-error" style={{ marginBottom: 16 }}>
          {error}
          {(error.includes('Session expired') || error.includes('Unauthorized')) && (
            <span>
              {' '}
              <Link to="/login" style={{ color: 'inherit', fontWeight: 600 }}>
                Sign in again
              </Link>
            </span>
          )}
        </div>
      )}

      <TableShell>
        <table className="bd-table">
          <thead>
            <tr>
              <SortTh k="shopName">Florist</SortTh>
              <SortTh k="status">Status</SortTh>
              <SortTh k="serviceRadiusKm">Radius</SortTh>
              <SortTh k="orderCount">Orders</SortTh>
              <SortTh k="totalGmv">GMV</SortTh>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <EmptyRow colSpan={6} message="No vendors match this filter." />
            ) : (
              sorted.map((v) => (
                <tr key={v.id} onClick={() => navigate(`/vendors/${v.id}`)}>
                  <Td>
                    <span style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>{v.shopName}</span>
                    <p style={{ fontSize: 12, color: 'var(--bd-ink-soft)', margin: '2px 0 0' }}>
                      {v.phone}
                    </p>
                  </Td>
                  <Td>
                    <StatusBadge status={v.status} />
                  </Td>
                  <Td>{v.serviceRadiusKm} km</Td>
                  <Td>{v.orderCount}</Td>
                  <Td>{fmt(v.totalGmv)}</Td>
                  <Td>
                    {v.status === 'PENDING' && (
                      <button
                        type="button"
                        className="bd-btn bd-btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={(e) => approveVendor(e, v.id)}
                      >
                        Approve
                      </button>
                    )}
                    {v.status !== 'PENDING' && (
                      <Link
                        to={`/vendors/${v.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 12, color: 'var(--bd-rose)' }}
                      >
                        Manage →
                      </Link>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
