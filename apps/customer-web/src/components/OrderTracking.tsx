import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../lib/api';
import { clearServerCart, isLoggedIn } from '../lib/cart-api';
import { useCartStore } from '../store/cart';

export type TrackOrder = {
  id: string;
  code: string;
  vendorName: string;
  vendorPhone: string;
  status: string;
  items: { id: string; name: string; qty: number; price: number }[];
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  timeline: Record<string, string>;
  reviewed: boolean;
};

const STEPS = [
  { status: 'confirmed', label: 'Order confirmed', icon: 'ti-check' },
  { status: 'accepted', label: 'Accepted by florist', icon: 'ti-check' },
  { status: 'preparing', label: 'Being prepared', icon: 'ti-scissors' },
  { status: 'ready', label: 'Ready for pickup', icon: 'ti-package' },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: 'ti-truck' },
  { status: 'delivered', label: 'Delivered', icon: 'ti-circle-check' },
] as const;

const STATUS_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.status, i]));

interface OrderTrackingProps {
  orderId: string;
  orderPlaced?: boolean;
}

export function OrderTracking({ orderId, orderPlaced }: OrderTrackingProps) {
  const [order, setOrder] = useState<TrackOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const clearedCart = useRef(false);
  const localClear = useCartStore((s) => s.clear);

  const load = useCallback(() => {
    api
      .fetch<TrackOrder>(`/orders/${orderId}/track`)
      .then((data) => {
        setOrder(data);
        setError('');
        if (!clearedCart.current && data.status !== 'rejected') {
          clearedCart.current = true;
          localClear();
          if (isLoggedIn()) clearServerCart().catch(() => undefined);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId, localClear]);

  useEffect(() => {
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bd-skeleton" style={{ height: 100, marginBottom: 12, borderRadius: 14 }} />
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--bd-danger)', fontSize: 14 }}>{error || 'Order not found'}</p>
        <Link to="/orders" className="bd-btn bd-btn-primary" style={{ marginTop: 16, textDecoration: 'none' }}>
          Back to orders
        </Link>
      </div>
    );
  }

  const currentIdx = STATUS_INDEX[order.status] ?? 0;
  const isTerminal = ['delivered', 'rejected'].includes(order.status);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '1rem 1.25rem 2rem',
        background: 'var(--bd-bg)',
        minHeight: '100%',
      }}
    >
      {orderPlaced && (
        <div
          className="bd-card bd-card-static"
          style={{
            padding: 14,
            marginBottom: 12,
            background: 'var(--bd-green-soft)',
            border: '0.5px solid var(--bd-green)',
            fontSize: 13,
            color: 'var(--bd-ink)',
          }}
        >
          Order placed successfully. We&apos;ll update you as it moves along.
        </div>
      )}

      <Link to="/orders" style={{ fontSize: 13, color: 'var(--bd-ink-soft)', textDecoration: 'none' }}>
        ← All orders
      </Link>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 600, color: 'var(--bd-ink)' }}>
            Order #{order.code}
          </h2>
          <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)' }}>{order.vendorName}</div>
        </div>
        <StatusPill status={order.status} />
      </div>

      {order.status === 'rejected' && (
        <div
          className="bd-card bd-card-static"
          style={{
            padding: 16,
            marginBottom: 12,
            background: 'var(--bd-danger-soft)',
            border: '0.5px solid var(--bd-danger)',
          }}
        >
          <div style={{ fontWeight: 500, color: 'var(--bd-danger)' }}>Order rejected</div>
          <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginTop: 4 }}>
            {formatPrice(order.total)} will be refunded to your payment method within 5–7 business days.
          </div>
        </div>
      )}

      {order.status !== 'rejected' && (
        <div className="bd-card bd-card-static" style={{ padding: 16, marginBottom: 12, background: 'var(--bd-surface)' }}>
          {STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const pending = i > currentIdx;
            const last = i === STEPS.length - 1;
            return (
              <div key={step.status} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: done
                        ? 'var(--bd-green-soft)'
                        : active
                          ? 'var(--bd-rose-soft)'
                          : 'var(--bd-surface-alt)',
                    }}
                  >
                    {done ? (
                      <i className="ti ti-check" style={{ fontSize: 12, color: 'var(--bd-green)' }} aria-hidden />
                    ) : active ? (
                      <i className={`ti ${step.icon}`} style={{ fontSize: 12, color: 'var(--bd-rose)' }} aria-hidden />
                    ) : null}
                  </div>
                  {!last && (
                    <div
                      style={{
                        width: 1.5,
                        flex: 1,
                        minHeight: 24,
                        marginTop: 2,
                        background: done ? 'var(--bd-green)' : 'var(--bd-border)',
                      }}
                    />
                  )}
                </div>
                <div style={{ paddingTop: 2, paddingBottom: last ? 0 : 16 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      color: pending
                        ? 'var(--bd-ink-soft)'
                        : active
                          ? 'var(--bd-rose)'
                          : 'var(--bd-green)',
                    }}
                  >
                    {step.label}
                  </div>
                  {order.timeline[step.status] && (
                    <div style={{ fontSize: 11, color: 'var(--bd-ink-soft)', marginTop: 1 }}>
                      {order.timeline[step.status]}
                    </div>
                  )}
                  {active && !isTerminal && (
                    <div style={{ fontSize: 11, color: 'var(--bd-ink-soft)', marginTop: 1 }}>In progress</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bd-card bd-card-static" style={{ padding: 14, marginBottom: 12, background: 'var(--bd-surface)' }}>
        <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginBottom: 4 }}>Delivering to</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <i className="ti ti-map-pin" style={{ fontSize: 16, color: 'var(--bd-rose)' }} aria-hidden />
          <span style={{ fontSize: 14, color: 'var(--bd-ink)' }}>{order.deliveryAddress}</span>
        </div>
      </div>

      <div className="bd-card bd-card-static" style={{ padding: '4px 14px', marginBottom: 12, background: 'var(--bd-surface)' }}>
        {order.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '9px 0',
              fontSize: 13,
              borderBottom: '0.5px solid var(--bd-border)',
            }}
          >
            <span style={{ color: 'var(--bd-ink-soft)' }}>
              {item.qty}× {item.name}
            </span>
            <span style={{ color: 'var(--bd-ink)' }}>{formatPrice(item.qty * item.price)}</span>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '9px 0',
            fontSize: 13,
            borderBottom: '0.5px solid var(--bd-border)',
          }}
        >
          <span style={{ color: 'var(--bd-ink-soft)' }}>Delivery fee</span>
          <span style={{ color: 'var(--bd-ink)' }}>{formatPrice(order.deliveryFee)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '11px 0',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <span style={{ color: 'var(--bd-ink)' }}>Total paid</span>
          <span style={{ color: 'var(--bd-ink)' }}>{formatPrice(order.total)}</span>
        </div>
      </div>

      <HelpSection order={order} onCancelled={load} />

      {order.status === 'delivered' && !order.reviewed && <RatingPrompt orderId={orderId} onSubmitted={load} />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    confirmed: ['var(--bd-amber-soft)', '#a9701f', 'Confirmed'],
    accepted: ['var(--bd-rose-soft)', 'var(--bd-rose)', 'Accepted'],
    preparing: ['var(--bd-rose-soft)', 'var(--bd-rose)', 'Preparing'],
    ready: ['var(--bd-green-soft)', 'var(--bd-green)', 'Ready'],
    out_for_delivery: ['var(--bd-green-soft)', 'var(--bd-green)', 'On the way'],
    delivered: ['var(--bd-green-soft)', 'var(--bd-green)', 'Delivered'],
    rejected: ['var(--bd-danger-soft)', 'var(--bd-danger)', 'Rejected'],
  };
  const [bg, fg, label] = map[status] ?? map.confirmed;
  return (
    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, background: bg, color: fg }}>
      {label}
    </span>
  );
}

function HelpSection({ order, onCancelled }: { order: TrackOrder; onCancelled: () => void }) {
  const canCancel = ['confirmed', 'accepted'].includes(order.status);

  async function requestCancel() {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.fetch(`/orders/${order.id}/cancel`, { method: 'POST' });
      onCancelled();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not cancel order');
    }
  }

  const rows = [
    {
      icon: 'ti-message',
      label: 'Chat with florist',
      color: 'var(--bd-ink)',
      iconColor: 'var(--bd-rose)',
      action: () => window.open(`https://wa.me/${order.vendorPhone}`, '_blank'),
    },
    {
      icon: 'ti-headset',
      label: 'Call BloomDidi support',
      color: 'var(--bd-ink)',
      iconColor: 'var(--bd-rose)',
      action: () => window.open('tel:+911800000000'),
    },
    canCancel && {
      icon: 'ti-x',
      label: 'Cancel order',
      color: 'var(--bd-danger)',
      iconColor: 'var(--bd-danger)',
      action: requestCancel,
    },
  ].filter(Boolean) as {
    icon: string;
    label: string;
    color: string;
    iconColor: string;
    action: () => void;
  }[];

  return (
    <div className="bd-card bd-card-static" style={{ padding: 14, marginBottom: 12, background: 'var(--bd-surface)' }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--bd-ink)', marginBottom: 10 }}>Need help?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={row.action}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              width: '100%',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 10,
              background: 'var(--bd-surface-alt)',
              color: row.color,
            }}
          >
            <i className={`ti ${row.icon}`} style={{ fontSize: 18, color: row.iconColor }} aria-hidden />
            <span style={{ flex: 1, fontSize: 13 }}>{row.label}</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 14, color: 'var(--bd-ink-soft)' }} aria-hidden />
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--bd-ink-soft)', marginTop: 10 }}>Support hours: 9 AM – 9 PM daily</div>
    </div>
  );
}

function RatingPrompt({ orderId, onSubmitted }: { orderId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  async function submit(r: number) {
    setRating(r);
    try {
      await api.fetch(`/orders/${orderId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating: r }),
      });
      setSubmitted(true);
      onSubmitted();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not submit rating');
    }
  }

  return (
    <div className="bd-card bd-card-static bd-rise" style={{ padding: 16, textAlign: 'center', background: 'var(--bd-surface)' }}>
      {submitted ? (
        <div style={{ color: 'var(--bd-green)', fontSize: 14 }}>Thanks for your rating!</div>
      ) : (
        <>
          <div style={{ fontWeight: 500, color: 'var(--bd-ink)', marginBottom: 12 }}>How were your flowers?</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => submit(n)}
                style={{
                  fontSize: 24,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: rating && n > rating ? 0.3 : 1,
                }}
                aria-label={`Rate ${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
