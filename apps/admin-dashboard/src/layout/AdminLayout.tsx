import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/vendors', label: 'Vendors' },
  { to: '/orders', label: 'Orders' },
  { to: '/customers', label: 'Customers' },
  { to: '/payouts', label: 'Payouts' },
  { to: '/disputes', label: 'Disputes' },
  { to: '/settings', label: 'Settings' },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    api.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className="bd-ambient"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bd-bg)',
      }}
    >
      <aside
        className="bd-sidebar"
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <div
          style={{
            fontWeight: 500,
            fontSize: 18,
            marginBottom: 20,
            color: 'var(--bd-rose)',
          }}
        >
          BloomDidi
        </div>
        <p style={{ fontSize: 12, color: 'var(--bd-ink-soft)', marginTop: -12, marginBottom: 16 }}>
          Admin
        </p>
        <nav style={{ flex: 1 }}>
          {NAV.map(({ to, label, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest}
              className={({ isActive }) => `bd-nav-btn${isActive ? ' is-active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <button type="button" onClick={logout} className="bd-nav-btn">
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, padding: 28, overflow: 'auto' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
