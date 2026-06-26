import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthShell } from '@bloomdidi/design/AuthShell';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';

const isDev = import.meta.env.DEV;

const DEMO_FLORISTS = [
  { shop: 'Lily & Co Florals', phone: '+919876543210' },
  { shop: 'Petal Hub', phone: '+919876543211' },
];

export function LoginPage() {
  const [phone, setPhone] = useState(isDev ? DEMO_FLORISTS[0].phone : '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Enter your phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.fetch<{ message: string; devOtp?: string }>(
        '/auth/otp/send',
        { method: 'POST', body: JSON.stringify({ phone }) },
      );
      setDevOtpHint(res.devOtp ?? '');
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !otp.trim()) {
      setError('Enter phone and verification code.');
      return;
    }
    if (!otpSent) {
      setError('Tap “Send verification code” first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(phone, otp);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      portal="vendor"
      title="Vendor sign in"
      subtitle="Manage orders, inventory, earnings, and your storefront."
    >
      {isDev && (
        <div className="bd-callout">
          <strong>Quick select (dev)</strong>
          {DEMO_FLORISTS.map((f) => (
            <button
              key={f.phone}
              type="button"
              onClick={() => {
                setPhone(f.phone);
                setError('');
              }}
              className="bd-btn bd-btn-ghost block w-full text-left mt-2 px-2 py-1.5 text-sm"
              style={{
                background: phone === f.phone ? 'var(--bd-accent-soft)' : 'transparent',
              }}
            >
              {f.shop} — {f.phone}
            </button>
          ))}
        </div>
      )}

      {error && <div className="bd-error" style={{ marginTop: 16 }}>{error}</div>}

      <form onSubmit={handleLogin} className="bd-form-stack" style={{ marginTop: 20 }}>
        <div>
          <label className="bd-label" htmlFor="vendor-phone">Phone</label>
          <input
            id="vendor-phone"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError('');
              setOtpSent(false);
              setDevOtpHint('');
            }}
            className="bd-input"
            placeholder="+919876543210"
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

        {devOtpHint && (
          <p className="text-sm" style={{ color: 'var(--bd-ink-soft)' }}>
            Demo OTP (no SMS configured): <strong style={{ color: 'var(--bd-ink)' }}>{devOtpHint}</strong>
          </p>
        )}

        <div>
          <label className="bd-label" htmlFor="vendor-otp">Verification code</label>
          <input
            id="vendor-otp"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setError('');
            }}
            className="bd-input"
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
          />
        </div>

        <button type="submit" disabled={loading} className="bd-btn bd-btn-primary w-full">
          {loading ? 'Signing in…' : 'Enter dashboard'}
        </button>
      </form>
    </AuthShell>
  );
}
