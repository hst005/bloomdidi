import { useEffect, useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPrice } from '../lib/api';
import { isLoggedIn } from '../lib/cart-api';
import { useMotionPrefs } from '../store/cart';
import type { Order } from '@bloomdidi/shared';

const STATUS_STEPS = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

function statusIndex(status: string) {
  if (status === 'SCHEDULED') return 0;
  if (status === 'PENDING_PAYMENT') return -1;
  const i = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return i >= 0 ? i : 0;
}

export function OrdersPage() {
  const { orderId } = useParams<{ orderId?: string }>();
  const location = useLocation();
  const orderPlaced = !!(location.state as { orderPlaced?: boolean } | null)?.orderPlaced;
  const reduced = useMotionPrefs((s) => s.reducedMotion);
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }
    if (orderId) {
      api
        .fetch<Order>(`/orders/${orderId}`)
        .then(setOrder)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      api
        .fetch<Order[]>('/orders/mine')
        .then(setOrders)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  if (!isLoggedIn()) {
    return (
      <PageContainer className="py-16 text-center max-w-lg">
        <p className="text-brand-700 font-medium">Sign in to track your orders</p>
        <Link
          to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
          className="inline-block mt-4 px-6 py-3 bg-brand-600 text-white rounded-xl"
        >
          Sign in
        </Link>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer className="py-16 text-center text-brand-400">
        Loading orders…
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="py-16 text-center text-red-600">
        {error}
      </PageContainer>
    );
  }

  if (orderId && order) {
    const step = statusIndex(order.status);
    const cancelled = ['CANCELLED', 'REFUNDED', 'PAYMENT_FAILED'].includes(order.status);

    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PageContainer className="py-8 max-w-lg">
        {orderPlaced && (
          <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-800">
            Order placed successfully. We&apos;ll notify you as it moves along.
          </div>
        )}
        <Link to="/orders" className="text-sm text-brand-500 hover:text-brand-700">
          ← All orders
        </Link>
        <h1 className="font-display text-2xl text-brand-800 mt-4">Order tracking</h1>
        <p className="text-sm text-brand-400 mt-1 font-mono">#{order.id.slice(0, 8)}</p>

        <div className="mt-6 p-5 bg-white rounded-2xl border border-brand-100">
          <p className="text-lg font-semibold text-brand-800 capitalize">
            {order.status.toLowerCase().replace(/_/g, ' ')}
          </p>
          <p className="text-brand-600 font-medium mt-1">{formatPrice(order.total)}</p>

          {!cancelled && (
            <ol className="mt-6 space-y-3">
              {STATUS_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i <= step
                        ? 'bg-brand-600 text-white'
                        : 'bg-brand-100 text-brand-400'
                    }`}
                  >
                    {i <= step ? '✓' : i + 1}
                  </span>
                  <span className={i <= step ? 'text-brand-800 font-medium' : 'text-brand-400'}>
                    {s.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <ul className="mt-6 pt-4 border-t border-brand-100 text-sm text-brand-600 space-y-1">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.qty}× {item.productName}
              </li>
            ))}
          </ul>
          <p className="text-xs text-brand-400 mt-3">
            Deliver to {order.address.recipientName}, {order.address.line1}
          </p>
        </div>
        </PageContainer>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <PageContainer className="py-8 max-w-lg">
      <h1 className="font-display text-2xl text-brand-800">Your orders</h1>
      {orders.length === 0 ? (
        <p className="text-brand-400 mt-6 text-center py-12">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/orders/${o.id}`}
                className="block p-4 bg-white rounded-xl border border-brand-100 hover:border-brand-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-brand-800 capitalize">
                      {o.status.toLowerCase().replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-brand-400 mt-0.5">
                      {new Date(o.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="font-semibold text-brand-700">{formatPrice(o.total)}</span>
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
