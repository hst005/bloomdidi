import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPrice } from '../lib/api';
import { useCartStore, useMotionPrefs } from '../store/cart';
import { startRazorpayCheckout } from '../lib/checkout';
import {
  fetchCart,
  isLoggedIn,
  syncLocalCartToServer,
  type ServerCart,
} from '../lib/cart-api';
import type { Address } from '@bloomdidi/shared';

type Step = 'login' | 'details' | 'confirm';
type PaymentMethod = 'COD' | 'UPI' | 'CARD' | 'WALLET';

export function CheckoutPage() {
  const localItems = useCartStore((s) => s.items);
  const localClear = useCartStore((s) => s.clear);
  const [step, setStep] = useState<Step>(isLoggedIn() ? 'details' : 'login');
  const [phone, setPhone] = useState('+919123456789');
  const [otp, setOtp] = useState('123456');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [cart, setCart] = useState<ServerCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  const loadCart = async () => {
    if (!isLoggedIn()) return;
    try {
      const c = await fetchCart();
      setCart(c);
      if (!c.items.length && !localItems.length) navigate('/cart');
    } catch {
      if (!localItems.length) navigate('/cart');
    }
  };

  useEffect(() => {
    if (isLoggedIn()) loadCart();
    else if (localItems.length === 0) navigate('/cart');
  }, [localItems.length, navigate]);

  useEffect(() => {
    if (step === 'details' && isLoggedIn() && !addresses.length) {
      api.fetch<Address[]>('/users/me/addresses').then((addrs) => {
        setAddresses(addrs);
        if (addrs[0]) setAddressId(addrs[0].id);
      }).catch(console.error);
    }
  }, [step, addresses.length]);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.fetch('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.fetch<{ accessToken: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, name: 'Customer' }),
      });
      api.setToken(res.accessToken);

      if (localItems.length) {
        await syncLocalCartToServer(localItems, async () => window.confirm(
          'Your cart has items from another florist. Replace with this cart?',
        ));
        localClear();
      }

      const addrs = await api.fetch<Address[]>('/users/me/addresses');
      setAddresses(addrs);
      if (addrs[0]) setAddressId(addrs[0].id);
      await loadCart();
      setStep('details');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!addressId) {
      setError('Select a delivery address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const order = await api.fetch<{ id: string; status: string }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          addressId,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
          cardMessage: cardMessage || undefined,
          paymentMethod,
        }),
      });

      if (paymentMethod !== 'COD') {
        await startRazorpayCheckout(order.id);
      }

      localClear();
      navigate('/', { replace: true, state: { orderPlaced: true } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const total = cart?.total ?? 0;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-lg mx-auto px-4 py-10"
    >
      <h1 className="font-display text-3xl text-brand-800">Checkout</h1>
      {cart && (
        <p className="text-brand-400 mt-1">Total {formatPrice(total)} incl. delivery</p>
      )}

      {error && (
        <p className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</p>
      )}

      {step === 'login' && (
        <div className="mt-8 space-y-4">
          <div>
            <label className="block text-sm text-brand-600 mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full py-3 border border-brand-300 text-brand-700 rounded-xl hover:bg-brand-50 transition-colors disabled:opacity-50"
          >
            Send OTP
          </button>
          <div>
            <label className="block text-sm text-brand-600 mb-1">OTP (dev: 123456)</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            Verify & continue
          </button>
        </div>
      )}

      {step === 'details' && (
        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-sm text-brand-600 mb-1">Delivery address</label>
            <select
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.recipientName} — {a.line1}, {a.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-brand-600 mb-1">Schedule delivery (optional)</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <p className="text-xs text-brand-400 mt-1">Leave blank for same-day delivery</p>
          </div>

          <div>
            <label className="block text-sm text-brand-600 mb-1">Card message (optional)</label>
            <textarea
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Happy anniversary! Love always…"
              className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-brand-600 mb-2">Payment method</label>
            <div className="grid grid-cols-2 gap-2">
              {(['UPI', 'CARD', 'WALLET', 'COD'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    paymentMethod === m
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-brand-600 border-brand-200 hover:border-brand-400'
                  }`}
                >
                  {m === 'COD' ? 'Pay on delivery' : m}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep('confirm')}
            className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
          >
            Review order
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-brand-100 text-sm text-brand-600 space-y-2">
            <p>{cart?.items.length ?? 0} item(s)</p>
            {scheduledFor && (
              <p>Scheduled: {new Date(scheduledFor).toLocaleString()}</p>
            )}
            {cardMessage && <p className="italic">"{cardMessage}"</p>}
            <p className="font-semibold text-brand-800">
              {paymentMethod === 'COD' ? 'Pay on delivery (COD)' : `Pay online (${paymentMethod})`}
            </p>
            {cart && <p>Total: {formatPrice(cart.total)}</p>}
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing…' : paymentMethod === 'COD' ? 'Place order' : 'Pay & place order'}
          </button>
          <button
            onClick={() => setStep('details')}
            className="w-full py-2 text-brand-500 hover:text-brand-700"
          >
            ← Edit details
          </button>
        </div>
      )}
    </motion.div>
  );
}
