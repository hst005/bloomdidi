import { useCallback, useEffect, useState } from 'react';
import type { Order, Product, Shop } from '@bloomdidi/shared';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { ThemeToggle } from '@bloomdidi/design/ThemeToggle';
import { OrdersPanel } from '../components/OrdersPanel';
import { InventoryPanel } from '../components/InventoryPanel';
import { EarningsPanel } from '../components/EarningsPanel';
import { StoreProfilePanel } from '../components/StoreProfilePanel';

export function DashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState('');
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'inventory' | 'earnings' | 'store'>('orders');
  const logout = useAuthStore((s) => s.logout);

  const currentShop = shops.find((s) => s.id === shopId) ?? shops[0];

  const loadShops = useCallback(async () => {
    const list = await api.fetch<Shop[]>('/shops/vendor/mine');
    setShops(list);
    if (list[0] && !shopId) setShopId(list[0].id);
  }, [shopId]);

  const loadActiveCount = useCallback(async () => {
    if (!shopId) return;
    try {
      const list = await api.fetch<Order[]>(`/orders/shop/${shopId}`);
      const active = list.filter(
        (o) =>
          !['DELIVERED', 'CANCELLED', 'REFUNDED', 'PAYMENT_FAILED'].includes(o.status),
      ).length;
      setActiveOrderCount(active);
    } catch {
      setActiveOrderCount(0);
    }
  }, [shopId]);

  const loadProducts = useCallback(async () => {
    if (!shopId) return;
    setProductsLoading(true);
    try {
      const list = await api.fetch<Product[]>(`/catalog/shops/${shopId}/products/manage`);
      setProducts(list);
    } finally {
      setProductsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadShops().catch(console.error);
  }, [loadShops]);

  useEffect(() => {
    loadActiveCount().catch(console.error);
    loadProducts().catch(console.error);
    const interval = setInterval(() => loadActiveCount().catch(console.error), 15000);
    return () => clearInterval(interval);
  }, [loadActiveCount, loadProducts]);

  return (
    <div className="min-h-screen flex flex-col w-full min-w-0 overflow-x-hidden bd-ambient">
      <header
        className="shrink-0"
        style={{
          background: 'var(--bd-surface)',
          borderBottom: '1px solid var(--bd-border)',
          color: 'var(--bd-ink)',
        }}
      >
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pr-12 py-4 flex items-center justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">
              Bloom<span style={{ color: 'var(--bd-rose)' }}>Didi</span> Vendor
            </h1>
            {currentShop && (
              <p className="text-sm truncate" style={{ color: 'var(--bd-ink-soft)' }}>
                {currentShop.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={logout}
              className="bd-btn bd-btn-ghost text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pr-10 py-6 flex-1 min-w-0">
        {shops.length > 1 && (
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="mb-4 px-3 py-2 rounded-lg border border-slate-200 text-sm w-full max-w-xs"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {(['orders', 'inventory', 'earnings', 'store'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`bd-filter-chip capitalize${tab === t ? ' is-active' : ''}`}
            >
              {t}
              {t === 'orders' && activeOrderCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {activeOrderCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'orders' && shopId && <OrdersPanel shopId={shopId} />}

        {tab === 'inventory' && shopId && (
          <InventoryPanel
            shopId={shopId}
            products={products}
            loading={productsLoading}
            onRefresh={loadProducts}
          />
        )}

        {tab === 'earnings' && shopId && <EarningsPanel shopId={shopId} />}

        {tab === 'store' && shopId && <StoreProfilePanel shopId={shopId} />}
      </div>
    </div>
  );
}
