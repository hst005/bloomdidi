import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cart';

export function Layout({ children }: { children: React.ReactNode }) {
  const count = useCartStore((s) => s.itemCount());
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-cream/80 border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-semibold text-brand-700 tracking-tight">
            Bloom<span className="text-brand-500">Didi</span>
          </Link>
          <nav className="flex items-center gap-4">
            {!isHome && (
              <Link to="/" className="text-sm text-brand-600 hover:text-brand-800 transition-colors">
                Discover
              </Link>
            )}
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-brand-100 transition-colors">
              <svg id="cart-icon" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-brand-100 py-8 text-center text-sm text-brand-500">
        © {new Date().getFullYear()} BloomDidi — Flowers, delivered with care.
      </footer>
    </div>
  );
}
