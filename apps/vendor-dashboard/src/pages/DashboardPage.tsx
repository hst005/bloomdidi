import { useCallback, useEffect, useState } from 'react';
import type { Order, Product, Shop } from '@bloomdidi/shared';
import { BrandMark } from '@bloomdidi/design/BrandMark';
import { ThemeToggle } from '@bloomdidi/design/ThemeToggle';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { OrdersPanel } from '../components/OrdersPanel';
import { InventoryPanel } from '../components/InventoryPanel';
import { EarningsPanel } from '../components/EarningsPanel';
import { StoreProfilePanel } from '../components/StoreProfilePanel';

export function DashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState('');
  const [shopId, setShopId] = useState('');
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'inventory' | 'earnings' | 'store'>('orders');
  const logout = useAuthStore((s) => s.logout);

  const currentShop = shops.find((s) => s.id === shopId) ?? shops[0];

  const loadShops = useCallback(async () => {
    setShopsLoading(true);
    setShopsError('');
    try {
      const list = await api.fetch<Shop[]>('/shops/vendor/mine');
      setShops(list);
      if (list[0]) setShopId((current) => current || list[0].id);
    } catch (e) {
      setShops([]);
      setShopsError(e instanceof Error ? e.message : 'Could not load your store');
    } finally {
      setShopsLoading(false);
    }
  }, []);

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
    <div className="bd-portal-shell bd-ambient">
      <header className="bd-portal-topbar">
        <div className="bd-portal-topbar-meta">
          <BrandMark portal="vendor" size="sm" />
          {currentShop && (
            <p className="bd-portal-topbar-sub" style={{ marginTop: 8 }}>
              {currentShop.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <button type="button" onClick={logout} className="bd-btn bd-btn-outline text-sm">
            Sign out
          </button>
        </div>
      </header>

      <div className="bd-portal-body">
        {shops.length > 1 && (
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="bd-select mb-4 max-w-xs"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <div className="bd-segmented">
          {(['orders', 'inventory', 'earnings', 'store'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`bd-segmented-btn capitalize${tab === t ? ' is-active' : ''}`}
            >
              {t}
              {t === 'orders' && activeOrderCount > 0 && (
                <span style={{ marginLeft: 6, opacity: 0.9 }}>({activeOrderCount})</span>
              )}
            </button>
          ))}
        </div>

        {shopsLoading && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--bd-ink-soft)' }}>
            Loading your storefront…
          </div>
        )}

        {!shopsLoading && shopsError && (
          <div className="bd-error" style={{ marginTop: 16 }}>
            {shopsError}
            <button type="button" onClick={() => loadShops()} className="bd-btn bd-btn-outline text-sm ml-3">
              Retry
            </button>
          </div>
        )}

        {!shopsLoading && !shopsError && shops.length === 0 && (
          <div className="bd-callout" style={{ marginTop: 16, maxWidth: 480 }}>
            <strong>No store linked to this account</strong>
            <p style={{ margin: '8px 0 0', color: 'var(--bd-ink-soft)', fontSize: 14 }}>
              Demo vendors use <code>+919876543210</code> or <code>+919876543211</code>. Sign out and
              sign in again with a demo number, or contact support to link your shop.
            </p>
          </div>
        )}

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
