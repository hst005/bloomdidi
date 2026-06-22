import { useEffect, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { OrderTracking } from '../components/OrderTracking';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPrice } from '../lib/api';
import { isLoggedIn } from '../lib/cart-api';
import { useMotionPrefs } from '../store/cart';
import type { Order } from '@bloomdidi/shared';

export function OrdersPage() {
  const { orderId } = useParams<{ orderId?: string }>();
  const location = useLocation();
  const orderPlaced = !!(location.state as { orderPlaced?: boolean } | null)?.orderPlaced;
  const reduced = useMotionPrefs((s) => s.reducedMotion);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    if (orderId) {
      setLoading(false);
      return;
    }
    api
      .fetch<Order[]>('/orders/mine')
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!isLoggedIn()) {
    return (
      <PageContainer className="py-16 text-center max-w-lg">
        <p style={{ color: 'var(--bd-ink)', fontWeight: 500 }}>Sign in to track your orders</p>
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
          className="bd-btn bd-btn-primary"
          style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </PageContainer>
    );
  }

  if (orderId) {
    return (
      <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
        <OrderTracking orderId={orderId} orderPlaced={orderPlaced} />
      </motion.div>
    );
  }

  if (loading) {
    return (
      <PageContainer className="py-16 text-center max-w-lg">
        <div className="bd-skeleton" style={{ height: 28, width: 160, marginBottom: 16 }} />
        <div className="bd-skeleton" style={{ height: 72, marginBottom: 10 }} />
        <div className="bd-skeleton" style={{ height: 72 }} />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="py-16 text-center max-w-lg">
        {error}
      </PageContainer>
    );
  }

  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PageContainer className="max-w-lg py-6 px-5">
        <h1 className="font-display" style={{ fontSize: 22, color: 'var(--bd-ink)', margin: 0 }}>
          Your orders
        </h1>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--bd-ink-soft)', marginTop: 24, textAlign: 'center', padding: '48px 0' }}>
            No orders yet.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/orders/${o.id}`}
                  className="bd-card bd-card-static"
                  style={{
                    display: 'block',
                    padding: 14,
                    textDecoration: 'none',
                    background: 'var(--bd-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: 'var(--bd-ink)', textTransform: 'capitalize' }}>
                        {o.status.toLowerCase().replace(/_/g, ' ')}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--bd-ink-soft)' }}>
                        {o.shopName ?? 'Florist'} · {new Date(o.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--bd-ink)' }}>{formatPrice(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </motion.div>
  );
}
