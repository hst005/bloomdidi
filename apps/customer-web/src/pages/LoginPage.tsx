import { useState } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { syncLocalCartToServer } from '../lib/cart-api';
import { useCartStore } from '../store/cart';

const DEMO_PHONE = '+919123456789';
const DEMO_OTP = '123456';

export function LoginPage() {
  const [phone, setPhone] = useState(DEMO_PHONE);
  const [otp, setOtp] = useState(DEMO_OTP);
  const [name, setName] = useState('Priya Sharma');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const login = useAuthStore((s) => s.login);
  const localItems = useCartStore((s) => s.items);
  const clearLocalCart = useCartStore((s) => s.clear);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? searchParams.get('next') ?? '/';

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.fetch('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, otp, name);

      if (localItems.length) {
        await syncLocalCartToServer(localItems, async () =>
          window.confirm('Your cart has items from another florist. Replace with this cart?'),
        );
        clearLocalCart();
      }

      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <PageContainer className="py-12 max-w-md">
      <h1 className="font-display text-3xl text-brand-800">Sign in</h1>
      <p className="text-brand-500 mt-2 text-sm">
        OTP login — save addresses, track orders, and checkout faster.
      </p>

      <div className="mt-4 p-3 rounded-xl bg-brand-50 border border-brand-100 text-xs text-brand-600">
        <p className="font-medium">Demo customer</p>
        <p className="mt-1">Phone: {DEMO_PHONE} · OTP: {DEMO_OTP}</p>
      </div>

      {error && (
        <p className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</p>
      )}

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="Priya Sharma"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">Phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="+919123456789"
          />
        </div>

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="text-sm text-brand-600 hover:text-brand-800 underline"
        >
          {otpSent ? 'Resend OTP' : 'Send OTP'}
        </button>

        <div>
          <label className="block text-sm font-medium text-brand-700 mb-1">OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="6-digit code"
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-400">
        <Link to="/" className="hover:text-brand-600">← Continue browsing without signing in</Link>
      </p>
      </PageContainer>
    </motion.div>
  );
}
