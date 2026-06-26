import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BrandMark } from '@bloomdidi/design/BrandMark';
import { ThemeToggle } from '@bloomdidi/design/ThemeToggle';
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
    <div className="bd-ambient" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bd-bg)' }}>
      <aside className="bd-sidebar" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BrandMark portal="admin" size="md" />
        <p className="bd-page-lead" style={{ marginTop: 8, marginBottom: 16, fontSize: 13 }}>
          Marketplace operations
        </p>
        <ThemeToggle />
        <nav style={{ flex: 1, marginTop: 20 }}>
          <p className="bd-sidebar-label">Platform</p>
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
        <div className="bd-sidebar-section">
          <button type="button" onClick={logout} className="bd-nav-btn">
            Sign out
          </button>
        </div>
      </aside>
      <main className="bd-admin-main">
        <div className="bd-admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
