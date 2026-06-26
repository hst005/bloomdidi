import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';

export function AuthShell({
  portal,
  title,
  subtitle,
  children,
  footer,
}: {
  portal: 'customer' | 'vendor' | 'admin';
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={`bd-auth-page bd-auth-page--${portal}`}>
      <aside className="bd-auth-hero" aria-hidden={false}>
        <div className="bd-auth-hero-inner">
          <BrandMark portal={portal} size="lg" />
          <h2 className="bd-auth-hero-title">
            {portal === 'customer' && 'Premium flowers, delivered with precision.'}
            {portal === 'vendor' && 'Run your florist business from one command center.'}
            {portal === 'admin' && 'Operate the marketplace with clarity and control.'}
          </h2>
          <p className="bd-auth-hero-copy">
            {portal === 'customer' &&
              'Discover trusted local florists, customize bouquets, and track every delivery.'}
            {portal === 'vendor' &&
              'Orders, inventory, earnings, and store settings — unified for your team.'}
            {portal === 'admin' &&
              'Vendors, payouts, disputes, and platform health at a glance.'}
          </p>
          <ul className="bd-auth-hero-stats">
            <li>
              <strong>99.9%</strong>
              <span>Platform uptime</span>
            </li>
            <li>
              <strong>2h</strong>
              <span>Avg. delivery window</span>
            </li>
            <li>
              <strong>4.8★</strong>
              <span>Customer satisfaction</span>
            </li>
          </ul>
        </div>
      </aside>
      <main className="bd-auth-main">
        <div className="bd-auth-card bd-rise">
          <header className="bd-auth-card-head">
            <BrandMark portal={portal} size="sm" />
            <h1 className="bd-auth-title">{title}</h1>
            {subtitle && <p className="bd-auth-subtitle">{subtitle}</p>}
          </header>
          {children}
          {footer && <footer className="bd-auth-footer">{footer}</footer>}
        </div>
      </main>
    </div>
  );
}
