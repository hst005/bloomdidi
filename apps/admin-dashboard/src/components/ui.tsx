import type { ReactNode } from 'react';

const statusClass: Record<string, string> = {
  ACTIVE: 'bd-status-active',
  PENDING: 'bd-status-pending',
  SUSPENDED: 'bd-status-suspended',
  REJECTED: 'bd-status-suspended',
  APPROVED: 'bd-status-active',
  SETTLED: 'bd-status-active',
  FAILED: 'bd-status-suspended',
  DELIVERED: 'bd-status-active',
  CANCELLED: 'bd-status-suspended',
  REFUNDED: 'bd-status-pending',
  PAYMENT_FAILED: 'bd-status-suspended',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ').toLowerCase();
  const cls = statusClass[status] ?? 'bd-status-pending';
  return <span className={`bd-status-pill ${cls}`}>{label}</span>;
}

export function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="bd-kpi bd-rise">
      <div className="bd-kpi-label">{label}</div>
      <div className="bd-kpi-value">{value}</div>
      {sub && <div className="bd-kpi-sub">{sub}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 28,
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1 className="bd-page-title">{title}</h1>
        {lead && <p className="bd-page-lead">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="bd-card bd-table-wrap bd-card-static">
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  );
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={className}>{children}</th>;
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={className} style={{ color: 'var(--bd-ink-muted)' }}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--bd-ink-soft)' }}>
        {message}
      </td>
    </tr>
  );
}
