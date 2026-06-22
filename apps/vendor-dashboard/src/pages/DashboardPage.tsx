import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ORDER_STATUS } from '@bloomdidi/shared';
import type { Order, Product, Shop } from '@bloomdidi/shared';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { OrderCard } from '../components/OrderCard';
import { InventoryPanel } from '../components/InventoryPanel';
import { PayoutPanel } from '../components/PayoutPanel';

const STATUS_FLOW = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
] as const;

interface DashboardSummary {
  commissionPct: number;
  pendingOrders: number;
  todayOrders: number;
  todayGross: number;
  lifetimeGross: number;
  lifetimeCommission: number;
  lifetimeNet: number;
}

interface PayoutSummary {
  commissionPct: number;
  pending: {
    grossAmount: number;
    commission: number;
    netAmount: number;
    orderCount: number;
  };
  history: {
    id: string;
    grossAmount: number;
    commission: number;
    netAmount: number;
    status: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
  }[];
}

export function DashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutSummary | null>(null);
  const [tab, setTab] = useState<'orders' | 'inventory' | 'earnings'>('orders');
  const logout = useAuthStore((s) => s.logout);

  const loadShops = useCallback(async () => {
    const list = await api.fetch<Shop[]>('/shops/vendor/mine');
    setShops(list);
    if (list[0] && !shopId) setShopId(list[0].id);
  }, [shopId]);

  const loadOrders = useCallback(async () => {
    if (!shopId) return;
    const list = await api.fetch<Order[]>(`/orders/shop/${shopId}`);
    setOrders(list);
  }, [shopId]);

  const loadProducts = useCallback(async () => {
    if (!shopId) return;
    const list = await api.fetch<Product[]>(`/catalog/shops/${shopId}/products/manage`);
    setProducts(list);
  }, [shopId]);

  const loadEarnings = useCallback(async () => {
    if (!shopId) return;
    const [dash, pay] = await Promise.all([
      api.fetch<DashboardSummary>(`/vendor/dashboard?shopId=${shopId}`),
      api.fetch<PayoutSummary>(`/vendor/payouts?shopId=${shopId}`),
    ]);
    setDashboard(dash);
    setPayouts(pay);
  }, [shopId]);

  useEffect(() => {
    loadShops().catch(console.error);
  }, [loadShops]);

  useEffect(() => {
    loadOrders().catch(console.error);
    loadProducts().catch(console.error);
    loadEarnings().catch(console.error);
    const interval = setInterval(() => loadOrders().catch(console.error), 15000);
    return () => clearInterval(interval);
  }, [loadOrders, loadProducts, loadEarnings]);

  const handleOrderAction = async (orderId: string, action: string) => {
    await api.fetch(`/vendor/orders/${orderId}/${action}`, { method: 'POST' });
    await loadOrders();
    if (action === 'delivered') await loadEarnings();
  };

  const activeOrders = orders.filter(
    (o) => !['DELIVERED', 'CANCELLED', 'REFUNDED', 'SCHEDULED'].includes(o.status),
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-850 text-white px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">BloomDidi Vendor</h1>
            {shops[0] && <p className="text-sm text-slate-400">{shops[0].name}</p>}
          </div>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {shops.length > 1 && (
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="mb-4 px-3 py-2 rounded-lg border border-slate-200 text-sm"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        <div className="flex gap-2 mb-6">
          {(['orders', 'inventory', 'earnings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {t}
              {t === 'orders' && activeOrders.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {activeOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {STATUS_FLOW.slice(0, 4).map((status) => {
                const count = orders.filter((o) => o.status === status).length;
                return (
                  <div key={status} className="p-3 bg-white rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 capitalize">{status.toLowerCase().replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-brand-800">{count}</p>
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="popLayout">
              {activeOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-12">No active orders — waiting for customers.</p>
              ) : (
                <ul className="space-y-4">
                  {activeOrders.map((order, i) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={i}
                      onAction={handleOrderAction}
                    />
                  ))}
                </ul>
              )}
            </AnimatePresence>
          </>
        )}

        {tab === 'inventory' && (
          <InventoryPanel products={products} onRefresh={loadProducts} />
        )}

        {tab === 'earnings' && (
          <PayoutPanel
            shopId={shopId}
            dashboard={dashboard}
            payouts={payouts}
            onRefresh={loadEarnings}
          />
        )}
      </div>
    </div>
  );
}
