import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPrice } from '../lib/api';
import { resolveImageUrl } from '../lib/demo-images';
import { useCartStore, useMotionPrefs } from '../store/cart';
import type { Product } from '@bloomdidi/shared';
import {
  clearServerCart,
  fetchCart,
  isLoggedIn,
  removeFromCart,
  type ServerCart,
} from '../lib/cart-api';

export function CartPage() {
  const localItems = useCartStore((s) => s.items);
  const localShopId = useCartStore((s) => s.shopId);
  const localRemove = useCartStore((s) => s.removeItem);
  const localClear = useCartStore((s) => s.clear);
  const [serverCart, setServerCart] = useState<ServerCart | null>(null);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(isLoggedIn());
  const navigate = useNavigate();
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  const loadServerCart = useCallback(async () => {
    if (!isLoggedIn()) {
      setServerCart(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setServerCart(await fetchCart());
    } catch {
      setServerCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServerCart();
  }, [loadServerCart]);

  useEffect(() => {
    if (isLoggedIn() || !localShopId || localItems.length === 0) return;
    api
      .fetch<Product[]>(`/catalog/shops/${localShopId}/products`)
      .then((list) => setProducts(new Map(list.map((p) => [p.id, p]))))
      .catch(() => setProducts(new Map()));
  }, [localShopId, localItems.length]);

  const useServer = isLoggedIn() && serverCart !== null;
  const guestSubtotal = localItems.reduce((sum, item) => {
    const p = products.get(item.productId);
    const customTotal = item.customizations.reduce((s, c) => s + c.priceDelta, 0);
    return sum + (p ? p.basePrice + customTotal : 0) * item.qty;
  }, 0);
  const guestDeliveryFee = 5000;
  const items = useServer
    ? serverCart.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        imageUrl: i.imageUrl,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      }))
    : localItems.map((i) => {
        const p = products.get(i.productId);
        const customTotal = i.customizations.reduce((s, c) => s + c.priceDelta, 0);
        const unitPrice = p ? p.basePrice + customTotal : 0;
        return {
          ...i,
          productName: p?.name ?? 'Item',
          imageUrl: p?.imageUrl ?? null,
          unitPrice,
          lineTotal: unitPrice * i.qty,
        };
      });

  const subtotal = useServer ? serverCart!.subtotal : guestSubtotal;
  const deliveryFee = useServer ? serverCart!.deliveryFee : guestDeliveryFee;
  const total = useServer ? serverCart!.total : guestSubtotal + guestDeliveryFee;

  const handleRemove = async (productId: string) => {
    if (useServer) {
      setServerCart(await removeFromCart(productId));
    } else {
      localRemove(productId);
    }
  };

  const handleClear = async () => {
    if (useServer) {
      await clearServerCart();
      setServerCart({ shopId: null, shopName: null, items: [], subtotal: 0, deliveryFee: 0, total: 0 });
    } else {
      localClear();
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-brand-400">Loading cart…</div>
    );
  }

  const itemCount = useServer ? serverCart!.items.length : localItems.length;

  if (itemCount === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="font-display text-2xl text-brand-700">Your cart is empty</p>
        <p className="text-brand-400 mt-2">Discover local florists and add a bouquet.</p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          Browse florists
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      <h1 className="font-display text-3xl text-brand-800">Your cart</h1>
      {useServer && serverCart?.shopName && (
        <p className="text-sm text-brand-400 mt-1">From {serverCart.shopName}</p>
      )}

      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex gap-4 p-4 bg-white rounded-2xl border border-brand-100"
          >
            {item.imageUrl && (
              <img
                src={resolveImageUrl(item.imageUrl)}
                alt=""
                className="w-20 h-20 rounded-xl object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-brand-800">
                {item.productName || 'Item'}
              </p>
              <p className="text-sm text-brand-400">Qty {item.qty}</p>
              {useServer || products.has(item.productId) ? (
                <p className="text-brand-600 font-semibold mt-1">{formatPrice(item.lineTotal)}</p>
              ) : null}
            </div>
            <button
              onClick={() => handleRemove(item.productId)}
              className="text-brand-400 hover:text-brand-600 text-sm self-start"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 p-6 bg-white rounded-2xl border border-brand-100 space-y-3">
        <div className="flex justify-between text-brand-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-brand-600">
          <span>Delivery</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-brand-800 pt-3 border-t border-brand-100">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleClear}
          className="px-4 py-3 text-brand-500 hover:text-brand-700 transition-colors"
        >
          Clear cart
        </button>
        <button
          onClick={() => navigate('/checkout')}
          className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
        >
          Proceed to checkout
        </button>
      </div>
    </motion.div>
  );
}
