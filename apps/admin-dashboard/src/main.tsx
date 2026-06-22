import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, fmt } from './lib/api';
import './index.css';

const DEMO_ADMIN = {
  email: 'admin@bloomdidi.com',
  password: 'Admin@123456',
};

function App() {
  const [authed, setAuthed] = useState(!!api.token);
  const [email, setEmail] = useState(DEMO_ADMIN.email);
  const [password, setPassword] = useState(DEMO_ADMIN.password);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [dashboard, setDashboard] = useState<{ activeFlorists: number; ordersToday: number; gmvToday: number; commissionEarned: number } | null>(null);
  const [settings, setSettings] = useState<{ globalDiscoveryRadiusKm: number; commissionPct: number; deliveryFeePaise: number } | null>(null);
  const [vendors, setVendors] = useState<{ id: string; shopName: string; status: string }[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    const [d, s, v] = await Promise.all([
      api.fetch<typeof dashboard>('/admin/dashboard'),
      api.fetch<typeof settings>('/admin/settings'),
      api.fetch<typeof vendors>('/admin/vendors?status=PENDING'),
    ]);
    setDashboard(d);
    setSettings(s);
    setVendors(v ?? []);
  };

  useEffect(() => {
    if (authed) load().catch((e) => setError(e.message));
  }, [authed]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.fetch<{ accessToken: string }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      api.setToken(res.accessToken);
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    await api.fetch('/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) });
    await load();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg('Password must be at least 8 characters');
      return;
    }
    try {
      await api.fetch('/auth/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordMsg('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword(newPassword);
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-xl font-bold">BloomDidi Admin</h1>
          <p className="text-xs text-slate-500 mt-2">
            Demo: {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
          </p>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <label className="block text-sm text-slate-400 mt-4">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
            autoComplete="username"
          />
          <label className="block text-sm text-slate-400 mt-3">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
            autoComplete="current-password"
          />
          <button type="submit" className="mt-4 w-full py-2.5 bg-emerald-600 rounded-lg font-medium">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mission control</h1>
        <button
          onClick={() => {
            api.setToken(null);
            setAuthed(false);
          }}
          className="text-slate-400 text-sm"
        >
          Logout
        </button>
      </header>

      {error && <p className="text-red-400">{error}</p>}

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Active florists', dashboard.activeFlorists],
            ['Orders today', dashboard.ordersToday],
            ['GMV today', fmt(dashboard.gmvToday)],
            ['Commission', fmt(dashboard.commissionEarned)],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-2xl font-bold mt-1">{val}</p>
            </div>
          ))}
        </div>
      )}

      {settings && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold">Platform settings</h2>
          <div>
            <label className="text-sm text-slate-400">Discovery radius — {settings.globalDiscoveryRadiusKm} km</label>
            <input
              type="range"
              min={1}
              max={20}
              value={settings.globalDiscoveryRadiusKm}
              onChange={(e) => setSettings({ ...settings, globalDiscoveryRadiusKm: +e.target.value })}
              className="w-full mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">Max distance customers see florists. Applies platform-wide.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Commission %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.commissionPct}
                onChange={(e) => setSettings({ ...settings, commissionPct: +e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Delivery fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryFeePaise / 100}
                onChange={(e) => setSettings({ ...settings, deliveryFeePaise: +e.target.value * 100 })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              />
            </div>
          </div>
          <button onClick={saveSettings} className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-medium">
            Save settings
          </button>
        </section>
      )}

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <form onSubmit={changePassword} className="grid gap-3 max-w-md">
          <div>
            <label className="text-sm text-slate-400">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
              minLength={8}
              required
            />
          </div>
          {passwordMsg && (
            <p className={`text-sm ${passwordMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
              {passwordMsg}
            </p>
          )}
          <button type="submit" className="px-4 py-2 border border-slate-600 rounded-lg text-sm w-fit hover:bg-slate-800">
            Update password
          </button>
        </form>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Pending vendor approvals</h2>
        {vendors.length === 0 ? (
          <p className="text-slate-500 text-sm">No pending vendors.</p>
        ) : (
          <ul className="space-y-3">
            {vendors.map((v) => (
              <li key={v.id} className="flex justify-between items-center py-2 border-b border-slate-800">
                <span>{v.shopName}</span>
                <button
                  onClick={() => api.fetch(`/admin/vendors/${v.id}/approve`, { method: 'POST' }).then(load)}
                  className="text-sm px-3 py-1 border border-emerald-600 text-emerald-400 rounded-lg"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
