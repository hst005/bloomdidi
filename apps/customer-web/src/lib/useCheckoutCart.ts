import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@bloomdidi/shared';
import { api } from './api';
import {
  clearServerCart,
  fetchCart,
  isLoggedIn,
  removeFromCart,
  syncLocalCartToServer,
  updateCartItem,
  type ServerCart,
} from './cart-api';
import { DISPLAY_DELIVERY_FEE_PAISE } from './delivery-slots';
import { useCartStore } from '../store/cart';

export type CheckoutLine = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export function useCheckoutCart() {
  const localItems = useCartStore((s) => s.items);
  const localShopId = useCartStore((s) => s.shopId);
  const localShopName = useCartStore((s) => s.shopName);
  const setLocalQty = useCartStore((s) => s.setItemQty);
  const localClear = useCartStore((s) => s.clear);

  const [serverCart, setServerCart] = useState<ServerCart | null>(null);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setServerCart(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (localItems.length) {
        await syncLocalCartToServer(localItems, async () =>
          window.confirm(
            `Your cart has items from ${localShopName ?? 'another florist'}. Replace with this cart?`,
          ),
        );
        localClear();
      }
      setServerCart(await fetchCart());
    } catch {
      setServerCart(null);
    } finally {
      setLoading(false);
    }
  }, [localItems, localShopName, localClear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const shopId = isLoggedIn() ? serverCart?.shopId : localShopId;
    if (!shopId) return;
    api
      .fetch<Product[]>(`/catalog/shops/${shopId}/products`)
      .then((list) => setProducts(new Map(list.map((p) => [p.id, p]))))
      .catch(() => setProducts(new Map()));
  }, [serverCart?.shopId, localShopId]);

  const useServer = isLoggedIn() && serverCart !== null && serverCart.items.length > 0;

  const lines: CheckoutLine[] = useMemo(() => {
    if (useServer) {
      return serverCart!.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        imageUrl: i.imageUrl,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      }));
    }
    return localItems.map((item) => {
      const p = products.get(item.productId);
      const customTotal = item.customizations.reduce((s, c) => s + c.priceDelta, 0);
      const unitPrice = p ? p.basePrice + customTotal : 0;
      return {
        productId: item.productId,
        productName: p?.name ?? 'Item',
        imageUrl: p?.imageUrl ?? null,
        qty: item.qty,
        unitPrice,
        lineTotal: unitPrice * item.qty,
      };
    });
  }, [useServer, serverCart, localItems, products]);

  const shopId = useServer ? serverCart!.shopId : localShopId;
  const shopName = useServer ? serverCart!.shopName : localShopName;
  const itemTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = useServer ? serverCart!.deliveryFee : DISPLAY_DELIVERY_FEE_PAISE;
  const toPay = useServer ? serverCart!.total : itemTotal + (lines.length ? deliveryFee : 0);

  const setQty = useCallback(
    async (productId: string, qty: number) => {
      if (isLoggedIn()) {
        try {
          if (qty <= 0) setServerCart(await removeFromCart(productId));
          else setServerCart(await updateCartItem(productId, qty));
        } catch (err) {
          console.error(err);
        }
      } else {
        setLocalQty(productId, qty);
      }
    },
    [setLocalQty],
  );

  const orderItems = useMemo(
    () =>
      (useServer ? serverCart!.items : localItems).map((i) => ({
        productId: i.productId,
        qty: i.qty,
        customizations: 'customizations' in i ? i.customizations : [],
      })),
    [useServer, serverCart, localItems],
  );

  const clearAfterPayment = useCallback(async () => {
    localClear();
    if (isLoggedIn()) await clearServerCart();
  }, [localClear]);

  return {
    loading,
    lines,
    shopId,
    shopName,
    itemTotal,
    deliveryFee,
    toPay,
    setQty,
    orderItems,
    clearAfterPayment,
    refresh,
    isEmpty: !loading && lines.length === 0,
  };
}
