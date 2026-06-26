import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrandMark } from '@bloomdidi/design/BrandMark';
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
        <PageContainer className="h-[4.25rem] flex items-center justify-between gap-4 min-w-0">
          <Link to="/" className="no-underline shrink-0">
            <BrandMark portal="customer" size="md" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/"
              className={`bd-nav-link hidden sm:inline px-3 py-2 rounded-lg ${location.pathname === '/' ? 'is-active' : ''}`}
            >
              Discover
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className={`bd-nav-link hidden sm:inline px-3 py-2 rounded-lg ${location.pathname.startsWith('/orders') ? 'is-active' : ''}`}
              >
                Orders
              </Link>
            )}
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span
                  className="hidden md:inline text-sm max-w-[100px] truncate"
                  style={{ color: 'var(--bd-ink-muted)' }}
                  title={phone ?? ''}
                >
                  {displayName.split(' ')[0]}
                </span>
                <button type="button" onClick={logout} className="bd-btn bd-btn-outline text-sm py-2 px-3">
                  Logout
                </button>
              </div>
            ) : (
              <Link to={loginHref} className="bd-btn bd-btn-primary text-sm py-2 px-4 no-underline">
                Sign in
              </Link>
            )}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full transition-colors hover:bg-[var(--bd-surface-alt)]"
              style={{ color: 'var(--bd-ink)' }}
              aria-label="Cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 text-[11px] font-semibold rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bd-accent)', color: 'var(--bd-accent-on)' }}
                >
                  {count}
                </motion.span>
              )}
            </Link>
          </nav>
        </PageContainer>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
      <footer className="bd-app-footer py-10 text-center text-sm">
        <PageContainer>
          <p style={{ color: 'var(--bd-ink-soft)', margin: 0 }}>
            © {new Date().getFullYear()} BloomDidi · Enterprise-grade flower delivery
          </p>
        </PageContainer>
      </footer>
    </div>
  );
}
