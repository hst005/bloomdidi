import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (!phone.trim() || !otp.trim()) {
      setError('Enter phone and OTP.');
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-850">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl"
      >
        <h1 className="text-2xl font-bold text-brand-800">BloomDidi Vendor</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage orders & inventory</p>

        {isDev && (
          <div className="mt-4 p-3 bg-brand-50 rounded-xl text-xs text-brand-700 space-y-1.5">
            <p className="font-medium">Quick select (dev only)</p>
            {DEMO_FLORISTS.map((f) => (
              <button
                key={f.phone}
                type="button"
                onClick={() => {
                  setPhone(f.phone);
                  setError('');
                }}
                className={`block w-full text-left px-2 py-1 rounded ${phone === f.phone ? 'bg-brand-100 font-medium' : 'hover:bg-brand-50'}`}
              >
                {f.shop} — {f.phone}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <label className="block mt-6 text-sm font-medium text-slate-600">Phone</label>
        <input
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError('');
            setOtpSent(false);
          }}
          className="mt-1 w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="+919876543210"
          autoComplete="tel"
        />

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="mt-2 text-sm text-brand-600 hover:underline disabled:opacity-50"
        >
          {otpSent ? 'Resend OTP' : 'Send OTP'}
        </button>

        <label className="block mt-4 text-sm font-medium text-slate-600">OTP</label>
        <input
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value);
            setError('');
          }}
          className="mt-1 w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="6-digit code"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
