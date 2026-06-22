import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { PageContainer } from './PageContainer';

/** Single dark header on every customer screen — rose accent throughout */
export function Layout({ children }: { children: React.ReactNode }) {
  const count = useCartStore((s) => s.itemCount());
  const location = useLocation();
  const { isAuthenticated, phone, name, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const displayName = name ?? (phone ? phone.slice(-10) : 'Account');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/95 border-b border-slate-800">
        <PageContainer className="h-16 flex items-center justify-between gap-3 min-w-0">
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl font-semibold text-white tracking-tight shrink-0"
          >
            Bloom<span className="text-brand-400">Didi</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              to="/"
              className={`text-sm transition-colors hidden sm:inline ${
                location.pathname === '/'
                  ? 'text-brand-300 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Discover
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className={`text-sm transition-colors hidden sm:inline ${
                  location.pathname.startsWith('/orders')
                    ? 'text-brand-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Orders
              </Link>
            )}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span
                  className="hidden md:inline text-sm text-slate-400 max-w-[100px] truncate"
                  title={phone ?? ''}
                >
                  Hi, {displayName.split(' ')[0]}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to={`/login${location.pathname !== '/' && location.pathname !== '/login' ? `?redirect=${encodeURIComponent(location.pathname)}` : ''}`}
                className="text-sm px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
              >
                Sign in
              </Link>
            )}
            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
              aria-label="Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-slate-200"
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
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-500 text-white text-xs font-semibold rounded-full flex items-center justify-center"
                >
                  {count}
                </motion.span>
              )}
            </Link>
          </nav>
        </PageContainer>
      </header>
      <main className="flex-1 min-w-0">{children}</main>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 bg-white">
        <PageContainer>© {new Date().getFullYear()} BloomDidi — Flowers, delivered with care.</PageContainer>
      </footer>
    </div>
  );
}
