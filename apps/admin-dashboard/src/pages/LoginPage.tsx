import { useState } from 'react';

const DEMO = { email: 'admin@bloomdidi.com', password: 'Admin@123456' };

export function LoginPage({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState(DEMO.email);
  const [password, setPassword] = useState(DEMO.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-xl font-bold text-white">BloomDidi Admin</h1>
        <p className="text-xs text-slate-500 mt-2">
          Demo: {DEMO.email} / {DEMO.password}
        </p>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        <label className="block text-sm text-slate-400 mt-4">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
          autoComplete="username"
        />
        <label className="block text-sm text-slate-400 mt-3">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-2.5 bg-emerald-600 rounded-lg font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
