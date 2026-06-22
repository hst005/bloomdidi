import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../lib/api';
import type { DashboardStats, ReportsData, VendorRow } from '../lib/types';
import { EmptyRow, KpiCard, PageHeader, StatusBadge, Td, Th, TableShell } from '../components/ui';

export function OverviewPage() {
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.fetch<DashboardStats>('/admin/dashboard'),
      api.fetch<ReportsData>('/admin/reports'),
      api.fetch<VendorRow[]>('/admin/vendors'),
    ])
      .then(([d, r, v]) => {
        setDashboard(d);
        setReports(r);
        setVendors(v);
      })
      .catch((e) => setError(e.message));
  }, []);

  const maxGmv = Math.max(...(reports?.gmvByDay.map((d) => d.gmv) ?? [1]), 1);

  return (
    <div className="bd-rise">
      <PageHeader title="Overview" />

      {error && <div className="bd-error" style={{ marginBottom: 16 }}>{error}</div>}

      {dashboard && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <KpiCard label="Active florists" value={dashboard.activeFlorists} />
          <KpiCard label="Orders today" value={dashboard.ordersToday} />
          <KpiCard label="GMV today" value={fmt(dashboard.gmvToday)} />
          <KpiCard
            label="Commission"
            value={fmt(dashboard.commissionEarned)}
            sub={`${dashboard.commissionPct}% rate`}
          />
        </div>
      )}

      {reports && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            marginBottom: 28,
          }}
        >
          <section className="bd-card bd-card-static" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--bd-ink)', marginBottom: 16 }}>
              GMV — last 7 days
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 128 }}>
              {reports.gmvByDay.map((d) => (
                <div
                  key={d.date}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  <div
                    style={{
                      width: '100%',
                      borderRadius: '4px 4px 0 0',
                      background: 'var(--bd-rose)',
                      opacity: 0.75,
                      minHeight: 4,
                      height: `${Math.max(4, (d.gmv / maxGmv) * 100)}%`,
                    }}
                    title={fmt(d.gmv)}
                  />
                  <span style={{ fontSize: 10, color: 'var(--bd-ink-soft)' }}>{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bd-card bd-card-static" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--bd-ink)', marginBottom: 16 }}>
              Top vendors (7d)
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {reports.topVendors.length === 0 ? (
                <li style={{ fontSize: 14, color: 'var(--bd-ink-soft)' }}>No orders yet this week.</li>
              ) : (
                reports.topVendors.map((v, i) => (
                  <li
                    key={v.shopId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: 'var(--bd-ink)' }}>
                      {i + 1}.{' '}
                      <Link to={`/vendors/${v.shopId}`} style={{ color: 'var(--bd-rose)' }}>
                        {v.shopName}
                      </Link>
                    </span>
                    <span style={{ color: 'var(--bd-ink-soft)' }}>{fmt(v.gmv)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      )}

      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--bd-ink)', margin: 0 }}>
            Vendors
          </h2>
          <Link to="/vendors" style={{ fontSize: 12, color: 'var(--bd-rose)' }}>
            View all →
          </Link>
        </div>
        <TableShell>
          <table className="bd-table">
            <thead>
              <tr>
                <Th>Florist</Th>
                <Th>Status</Th>
                <Th>Orders</Th>
                <Th>GMV</Th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <EmptyRow colSpan={4} message="No vendors yet." />
              ) : (
                vendors.slice(0, 8).map((v) => (
                  <tr key={v.id} onClick={() => window.location.assign(`/vendors/${v.id}`)}>
                    <Td>
                      <span style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>{v.shopName}</span>
                    </Td>
                    <Td>
                      <StatusBadge status={v.status} />
                    </Td>
                    <Td>{v.orderCount}</Td>
                    <Td>{fmt(v.totalGmv)}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>
      </section>
    </div>
  );
}
