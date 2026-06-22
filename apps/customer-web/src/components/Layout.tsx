import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@bloomdidi/design/ThemeToggle';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { PageContainer } from './PageContainer';

export function Layout({ children }: { children: React.ReactNode }) {
  const count = useCartStore((s) => s.itemCount());
  const location = useLocation();
  const { isAuthenticated, phone, name, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const displayName = name ?? (phone ? phone.slice(-10) : 'Account');
  const loginHref =
    location.pathname !== '/' && location.pathname !== '/login'
      ? `/login?redirect=${encodeURIComponent(location.pathname)}`
      : '/login';

  return (
    <div className="bd-app-shell">
      <header className="bd-app-header">
        <PageContainer className="h-16 flex items-center justify-between gap-3 min-w-0">
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl font-semibold tracking-tight shrink-0"
            style={{ color: 'var(--bd-ink)' }}
          >
            Bloom<span style={{ color: 'var(--bd-rose)' }}>Didi</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Link
              to="/"
              className={`bd-nav-link hidden sm:inline ${location.pathname === '/' ? 'is-active' : ''}`}
            >
              Discover
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className={`bd-nav-link hidden sm:inline ${location.pathname.startsWith('/orders') ? 'is-active' : ''}`}
              >
                Orders
              </Link>
            )}
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span
                  className="hidden md:inline text-sm max-w-[100px] truncate"
                  style={{ color: 'var(--bd-ink-soft)' }}
                  title={phone ?? ''}
                >
                  Hi, {displayName.split(' ')[0]}
                </span>
                <button type="button" onClick={logout} className="bd-btn bd-btn-outline text-sm py-1.5 px-3">
                  Logout
                </button>
              </div>
            ) : (
              <Link to={loginHref} className="bd-btn bd-btn-primary text-sm py-1.5 px-3 no-underline">
                Sign in
              </Link>
            )}
            <Link
              to="/cart"
              className="relative p-2 rounded-full transition-colors"
              style={{ color: 'var(--bd-ink)' }}
              aria-label="Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 text-xs font-semibold rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bd-rose)', color: 'var(--bd-rose-on)' }}
                >
                  {count}
                </motion.span>
              )}
            </Link>
          </nav>
        </PageContainer>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
      <footer className="bd-app-footer py-8 text-center text-sm">
        <PageContainer>© {new Date().getFullYear()} BloomDidi — Flowers, delivered with care.</PageContainer>
      </footer>
    </div>
  );
}
