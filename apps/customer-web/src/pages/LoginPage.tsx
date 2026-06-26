import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@bloomdidi/design/AuthShell';
import { authClient } from '../lib/auth-client';
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
      await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
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
    <AuthShell
      portal="customer"
      title="Sign in to BloomDidi"
      subtitle="Secure OTP login — save addresses, track orders, and checkout faster."
      footer={
        <Link to="/">← Continue browsing without signing in</Link>
      }
    >
      <div className="bd-callout">
        <strong>Demo account</strong>
        Phone {DEMO_PHONE} · OTP {DEMO_OTP}
      </div>

      {error && <div className="bd-error" style={{ marginTop: 16 }}>{error}</div>}

      <form onSubmit={handleLogin} className="bd-form-stack" style={{ marginTop: 20 }}>
        <div>
          <label className="bd-label" htmlFor="login-name">Full name</label>
          <input
            id="login-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bd-input"
            placeholder="Priya Sharma"
          />
        </div>

        <div>
          <label className="bd-label" htmlFor="login-phone">Phone number</label>
          <input
            id="login-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bd-input"
            placeholder="+919123456789"
            autoComplete="tel"
          />
        </div>

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="bd-btn bd-btn-ghost self-start text-sm px-0"
        >
          {otpSent ? 'Resend verification code' : 'Send verification code'}
        </button>

        <div>
          <label className="bd-label" htmlFor="login-otp">Verification code</label>
          <input
            id="login-otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="bd-input"
            placeholder="6-digit code"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </div>

        <button type="submit" disabled={loading} className="bd-btn bd-btn-primary w-full">
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </AuthShell>
  );
}
