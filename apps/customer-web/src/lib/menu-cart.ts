import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product, Shop } from '@bloomdidi/shared';
import {
  addToCart,
  fetchCart,
  isLoggedIn,
  replaceCart,
  removeFromCart,
  updateCartItem,
  type ServerCart,
} from './cart-api';
import { useCartStore } from '../store/cart';

function isVendorConflict(err: unknown) {
  const msg = err instanceof Error ? err.message : '';
  return msg.includes('DIFFERENT_VENDOR') || msg.includes('another florist');
}

/** Cart actions for the shop menu — guest Zustand + logged-in server cart. */
export function useMenuCart(shop: Shop, products: Product[]) {
  const [serverCart, setServerCart] = useState<ServerCart | null>(null);
  const localItems = useCartStore((s) => s.items);
  const localShopId = useCartStore((s) => s.shopId);
  const addLocal = useCartStore((s) => s.addItem);
  const setLocalQty = useCartStore((s) => s.setItemQty);

  const priceMap = useMemo(
    () => new Map(products.map((p) => [p.id, p.basePrice])),
    [products],
  );

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setServerCart(null);
      return;
    }
    try {
      setServerCart(await fetchCart());
    } catch {
      setServerCart(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const useServer = isLoggedIn() && serverCart !== null;
  const cartIsThisShop = useServer ? serverCart!.shopId === shop.id : localShopId === shop.id;

  const getQty = useCallback(
    (productId: string) => {
      if (useServer) {
        if (serverCart!.shopId !== shop.id) return 0;
        return serverCart!.items.find((i) => i.productId === productId)?.qty ?? 0;
      }
      if (localShopId !== shop.id) return 0;
      return localItems.find((i) => i.productId === productId)?.qty ?? 0;
    },
    [useServer, serverCart, shop.id, localShopId, localItems],
  );

  const count = useMemo(() => {
    if (!cartIsThisShop) return 0;
    if (useServer) return serverCart!.items.reduce((s, i) => s + i.qty, 0);
    return localItems.reduce((s, i) => s + i.qty, 0);
  }, [cartIsThisShop, useServer, serverCart, localItems]);

  const subtotal = useMemo(() => {
    if (!cartIsThisShop) return 0;
    if (useServer) return serverCart!.subtotal;
    return localItems.reduce((sum, item) => {
      const price = priceMap.get(item.productId) ?? 0;
      return sum + price * item.qty;
    }, 0);
  }, [cartIsThisShop, useServer, serverCart, localItems, priceMap]);

  const addOne = useCallback(
    async (product: Product) => {
      const item = { productId: product.id, qty: 1, customizations: [] };
      if (isLoggedIn()) {
        try {
          setServerCart(await addToCart(item));
        } catch (err) {
          if (isVendorConflict(err)) {
            const ok = window.confirm(
              `Your cart has items from ${serverCart?.shopName ?? 'another florist'}. Start a new cart with ${shop.name}?`,
            );
            if (ok) setServerCart(await replaceCart(item));
          } else {
            console.error(err);
          }
        }
      } else {
        addLocal(shop.id, shop.name, item);
      }
    },
    [addLocal, shop.id, shop.name, serverCart?.shopName],
  );

  const setQty = useCallback(
    async (product: Product, qty: number) => {
      if (isLoggedIn()) {
        try {
          if (qty <= 0) {
            setServerCart(await removeFromCart(product.id));
          } else {
            setServerCart(await updateCartItem(product.id, qty));
          }
        } catch (err) {
          console.error(err);
        }
      } else if (qty <= 0) {
        setLocalQty(product.id, 0);
      } else if (getQty(product.id) === 0) {
        addLocal(shop.id, shop.name, { productId: product.id, qty, customizations: [] });
      } else {
        setLocalQty(product.id, qty);
      }
    },
    [addLocal, getQty, setLocalQty, shop.id, shop.name],
  );

  return { getQty, addOne, setQty, count, subtotal, refresh, cartIsThisShop };
}
