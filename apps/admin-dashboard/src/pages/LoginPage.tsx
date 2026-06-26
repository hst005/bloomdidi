import { useState } from 'react';
import { AuthShell } from '@bloomdidi/design/AuthShell';

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
    <AuthShell
      portal="admin"
      title="Admin console"
      subtitle="Secure access for marketplace operations and compliance."
    >
      <div className="bd-callout">
        <strong>Demo credentials</strong>
        {DEMO.email} · {DEMO.password}
      </div>

      {error && <div className="bd-error" style={{ marginTop: 16 }}>{error}</div>}

      <form onSubmit={submit} className="bd-form-stack" style={{ marginTop: 20 }}>
        <div>
          <label className="bd-label" htmlFor="admin-email">Work email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bd-input"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="bd-label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bd-input"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading} className="bd-btn bd-btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in to console'}
        </button>
      </form>
    </AuthShell>
  );
}
