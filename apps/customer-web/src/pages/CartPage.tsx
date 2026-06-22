import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPrice } from '../lib/api';
import { FlowerImage } from '../components/FlowerImage';
import { PageContainer } from '../components/PageContainer';
import { useCartStore, useMotionPrefs } from '../store/cart';
import type { Product, Shop } from '@bloomdidi/shared';
import {
  clearServerCart,
  fetchCart,
  isLoggedIn,
  removeFromCart,
  updateCartItem,
  type ServerCart,
} from '../lib/cart-api';
import { DISPLAY_DELIVERY_FEE_PAISE } from '../lib/delivery-slots';

export function CartPage() {
  const localItems = useCartStore((s) => s.items);
  const localShopId = useCartStore((s) => s.shopId);
  const localRemove = useCartStore((s) => s.removeItem);
  const localSetQty = useCartStore((s) => s.setItemQty);
  const localClear = useCartStore((s) => s.clear);
  const [serverCart, setServerCart] = useState<ServerCart | null>(null);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [guestDeliveryFee, setGuestDeliveryFee] = useState(DISPLAY_DELIVERY_FEE_PAISE);
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
    api
      .fetch<Shop>(`/shops/${localShopId}`)
      .then((s) => setGuestDeliveryFee(s.deliveryFeePaise ?? DISPLAY_DELIVERY_FEE_PAISE))
      .catch(() => setGuestDeliveryFee(DISPLAY_DELIVERY_FEE_PAISE));
  }, [localShopId, localItems.length]);

  const useServer = isLoggedIn() && serverCart !== null;
  const guestSubtotal = localItems.reduce((sum, item) => {
    const p = products.get(item.productId);
    const customTotal = item.customizations.reduce((s, c) => s + c.priceDelta, 0);
    return sum + (p ? p.basePrice + customTotal : 0) * item.qty;
  }, 0);
  const guestDeliveryFeeAmount = guestDeliveryFee;
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
  const deliveryFee = useServer ? serverCart!.deliveryFee : guestDeliveryFeeAmount;
  const total = useServer ? serverCart!.total : guestSubtotal + guestDeliveryFeeAmount;

  const handleRemove = async (productId: string) => {
    if (useServer) {
      setServerCart(await removeFromCart(productId));
    } else {
      localRemove(productId);
    }
  };

  const handleQtyChange = async (productId: string, qty: number) => {
    if (qty < 1) {
      await handleRemove(productId);
      return;
    }
    if (useServer) {
      setServerCart(await updateCartItem(productId, qty));
    } else {
      localSetQty(productId, qty);
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
      <PageContainer className="py-20 text-center text-brand-400 max-w-2xl">
        Loading cart…
      </PageContainer>
    );
  }

  const itemCount = useServer ? serverCart!.items.length : localItems.length;

  if (itemCount === 0) {
    return (
      <PageContainer className="py-20 text-center max-w-2xl">
        <p className="font-display text-2xl text-brand-700">Your cart is empty</p>
        <p className="text-brand-400 mt-2">Discover local florists and add a bouquet.</p>
        <Link
          to="/"
          className="inline-block mt-6 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          Browse florists
        </Link>
      </PageContainer>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <PageContainer className="py-10 max-w-2xl">
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
              <FlowerImage
                name={item.productName || 'Item'}
                imageUrl={item.imageUrl}
                className="w-20 h-20 rounded-xl shrink-0"
                imgClassName="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-brand-800">{item.productName || 'Item'}</p>
                <div className="mt-2 inline-flex items-center rounded-lg border border-brand-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item.productId, item.qty - 1)}
                    className="px-2.5 py-1 text-brand-700 hover:bg-brand-50"
                  >
                    −
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(item.productId, item.qty + 1)}
                    className="px-2.5 py-1 text-brand-700 hover:bg-brand-50"
                  >
                    +
                  </button>
                </div>
                {useServer || products.has(item.productId) ? (
                  <p className="text-brand-600 font-semibold mt-2">{formatPrice(item.lineTotal)}</p>
                ) : null}
              </div>
              <button
                type="button"
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
            type="button"
            onClick={handleClear}
            className="px-4 py-3 text-brand-500 hover:text-brand-700 transition-colors"
          >
            Clear cart
          </button>
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            {isLoggedIn() ? 'Proceed to checkout' : 'Checkout — sign in when ready'}
          </button>
        </div>
      </PageContainer>
    </motion.div>
  );
}
