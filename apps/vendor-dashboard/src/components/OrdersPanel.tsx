import { useCallback, useEffect, useRef, useState } from 'react';
import { ORDER_STATUS, type Order, type OrderStatus } from '@bloomdidi/shared';
import { api, formatPrice } from '../lib/api';

type Filter = 'active' | 'all' | 'today';

const COUNT_STRIP: { label: string; status: OrderStatus }[] = [
  { label: 'Placed', status: ORDER_STATUS.PLACED },
  { label: 'Accepted', status: ORDER_STATUS.ACCEPTED },
  { label: 'Preparing', status: ORDER_STATUS.PREPARING },
  { label: 'Ready', status: ORDER_STATUS.READY },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.OUT_FOR_DELIVERY,
];

const FLOW: Record<
  string,
  { label: string; pill: [string, string] }
> = {
  [ORDER_STATUS.PLACED]: { label: 'New', pill: ['var(--bd-amber-soft)', '#a9701f'] },
  [ORDER_STATUS.ACCEPTED]: { label: 'Accepted', pill: ['var(--bd-rose-soft)', 'var(--bd-rose)'] },
  [ORDER_STATUS.PREPARING]: { label: 'Preparing', pill: ['var(--bd-rose-soft)', 'var(--bd-rose)'] },
  [ORDER_STATUS.READY]: { label: 'Ready', pill: ['var(--bd-green-soft)', 'var(--bd-green)'] },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: {
    label: 'Out for delivery',
    pill: ['var(--bd-green-soft)', 'var(--bd-green)'],
  },
  [ORDER_STATUS.DELIVERED]: {
    label: 'Delivered',
    pill: ['var(--bd-surface-alt)', 'var(--bd-ink-soft)'],
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Rejected',
    pill: ['var(--bd-danger-soft)', 'var(--bd-danger)'],
  },
};

const ACTION_NEXT: Record<string, OrderStatus> = {
  accept: ORDER_STATUS.ACCEPTED,
  reject: ORDER_STATUS.CANCELLED,
  preparing: ORDER_STATUS.PREPARING,
  ready: ORDER_STATUS.READY,
  'out-for-delivery': ORDER_STATUS.OUT_FOR_DELIVERY,
  delivered: ORDER_STATUS.DELIVERED,
};

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function orderCode(id: string) {
  return id.slice(0, 8).toUpperCase();
}

interface OrdersPanelProps {
  shopId: string;
}

export function OrdersPanel({ shopId }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('active');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const prevActiveCount = useRef(0);
  const notifiedPermission = useRef(false);

  const load = useCallback(async () => {
    if (!shopId) return;
    setError('');
    try {
      const list = await api.fetch<Order[]>(`/orders/shop/${shopId}`);
      setOrders(list);

      const activeCount = list.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
      if (
        prevActiveCount.current > 0 &&
        activeCount > prevActiveCount.current &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        const newest = list.find((o) => o.status === ORDER_STATUS.PLACED);
        new Notification('New BloomDidi order', {
          body: newest
            ? `Order #${orderCode(newest.id)} — ${formatPrice(newest.total)}`
            : 'A new order just arrived.',
          tag: 'bloomdidi-vendor-order',
        });
      }
      prevActiveCount.current = activeCount;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (!notifiedPermission.current && typeof Notification !== 'undefined') {
      notifiedPermission.current = true;
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => undefined);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().catch(console.error);
    const id = setInterval(() => load().catch(console.error), 15000);
    return () => clearInterval(id);
  }, [load]);

  const advance = async (order: Order, action: string) => {
    const nextStatus = ACTION_NEXT[action];
    if (!nextStatus) return;

    const backup = orders;
    setActionError('');
    setOrders((p) => p.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));

    try {
      await api.fetch(`/vendor/orders/${order.id}/${action}`, { method: 'POST' });
      await load();
    } catch (e) {
      setOrders(backup);
      setActionError(e instanceof Error ? e.message : 'Action failed — try again');
    }
  };

  const counts = orders.reduce<Partial<Record<OrderStatus, number>>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const visible = orders.filter((o) => {
    if (filter === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'today') return isToday(o.createdAt);
    return true;
  });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--bd-ink)' }}>
          Orders
        </h2>
        <button
          type="button"
          className="bd-btn bd-btn-ghost"
          style={{ fontSize: 13, padding: '6px 12px' }}
          onClick={() => load()}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 10,
          marginBottom: 18,
          marginTop: 12,
        }}
      >
        {COUNT_STRIP.map(({ label, status }) => (
          <div key={status} className="bd-card bd-card-static" style={{ padding: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--bd-ink)' }}>
              {counts[status] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(
          [
            ['active', 'Active'],
            ['today', 'Today'],
            ['all', 'All'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              background: filter === id ? 'var(--bd-rose)' : 'var(--bd-surface-alt)',
              color: filter === id ? '#fff' : 'var(--bd-ink-soft)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bd-error" style={{ marginBottom: 12 }}>
          {error}
          <button
            type="button"
            onClick={() => load()}
            style={{
              marginLeft: 8,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="bd-error" style={{ marginBottom: 12 }}>
          {actionError}
        </div>
      )}

      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bd-skeleton" style={{ height: 120, marginBottom: 10 }} />
          ))
        : visible.length === 0
          ? <OrdersEmptyState filter={filter} />
          : visible.map((order, i) => (
              <VendorOrderCard key={order.id} order={order} index={i} onAdvance={advance} />
            ))}
    </div>
  );
}

function VendorOrderCard({
  order,
  index,
  onAdvance,
}: {
  order: Order;
  index: number;
  onAdvance: (order: Order, action: string) => Promise<void>;
}) {
  const meta = FLOW[order.status] ?? FLOW[ORDER_STATUS.PLACED];
  const [pillBg, pillFg] = meta.pill;
  const itemsLabel = order.items.map((it) => `${it.qty}× ${it.productName}`).join(' · ');
  const addressLine = order.address
    ? `${order.address.recipientName}, ${order.address.line1}, ${order.address.city}`
    : null;

  return (
    <div
      className="bd-card bd-rise"
      style={{ padding: 16, marginBottom: 10, animationDelay: `${index * 50}ms` }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 8,
              background: pillBg,
              color: pillFg,
              fontWeight: 500,
            }}
          >
            {meta.label}
          </span>
          <span style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>#{orderCode(order.id)}</span>
        </div>
        <div style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>{formatPrice(order.total)}</div>
      </div>

      <div style={{ fontSize: 14, color: 'var(--bd-ink-soft)', margin: '10px 0' }}>
        {itemsLabel}
      </div>

      {order.cardMessage && (
        <p style={{ fontSize: 13, color: 'var(--bd-ink-soft)', fontStyle: 'italic', margin: '0 0 8px' }}>
          Card: &ldquo;{order.cardMessage}&rdquo;
        </p>
      )}

      {order.scheduledFor && (
        <p style={{ fontSize: 12, color: 'var(--bd-amber)', margin: '0 0 8px' }}>
          Scheduled: {new Date(order.scheduledFor).toLocaleString('en-IN')}
        </p>
      )}

      {addressLine && (
        <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginBottom: 12 }}>
          ⊙ {addressLine}
        </div>
      )}

      <OrderActions order={order} onAdvance={onAdvance} />
    </div>
  );
}

function OrderActions({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (order: Order, action: string) => Promise<void>;
}) {
  const btn = (label: string, action: string, primary: boolean) => (
    <button
      type="button"
      className={`bd-btn ${primary ? 'bd-btn-primary' : ''}`}
      style={{ flex: 1 }}
      onClick={() => onAdvance(order, action)}
    >
      {label}
    </button>
  );

  switch (order.status) {
    case ORDER_STATUS.PLACED:
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          {btn('Accept', 'accept', true)}
          <button
            type="button"
            className="bd-btn"
            style={{ flex: 1, color: 'var(--bd-danger)' }}
            onClick={() => onAdvance(order, 'reject')}
          >
            Reject
          </button>
        </div>
      );
    case ORDER_STATUS.ACCEPTED:
      return btn('Start preparing', 'preparing', true);
    case ORDER_STATUS.PREPARING:
      return btn('Mark ready', 'ready', true);
    case ORDER_STATUS.READY:
      return btn('Out for delivery', 'out-for-delivery', true);
    case ORDER_STATUS.OUT_FOR_DELIVERY:
      return btn('Mark delivered', 'delivered', true);
    default:
      return null;
  }
}

function OrdersEmptyState({ filter }: { filter: Filter }) {
  const message =
    filter === 'today'
      ? 'No orders placed today yet.'
      : filter === 'all'
        ? 'No orders yet for this shop.'
        : 'New orders will appear here automatically.';

  return (
    <div
      className="bd-card bd-rise bd-card-static"
      style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--bd-ink-soft)' }}
    >
      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} aria-hidden>
        🌸
      </div>
      <div style={{ fontWeight: 500, color: 'var(--bd-ink)' }}>No active orders</div>
      <div style={{ fontSize: 14, marginTop: 4 }}>{message}</div>
      <div style={{ fontSize: 13, marginTop: 12, color: 'var(--bd-ink-soft)' }}>
        Place a test order from the customer app to try Accept → Preparing → Ready → Delivered.
      </div>
    </div>
  );
}
