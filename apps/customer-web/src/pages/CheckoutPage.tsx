import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, formatPrice } from '../lib/api';
import { startRazorpayCheckout } from '../lib/checkout';
import { DELIVERY_SLOTS, slotToScheduledFor, type DeliverySlotId } from '../lib/delivery-slots';
import { isLoggedIn } from '../lib/cart-api';
import { useCheckoutCart } from '../lib/useCheckoutCart';
import { FlowerImage } from '../components/FlowerImage';
import { MiniStepper } from '../components/MiniStepper';
import { useMotionPrefs } from '../store/cart';
import type { Address } from '@bloomdidi/shared';

export function CheckoutPage() {
  const navigate = useNavigate();
  const reduced = useMotionPrefs((s) => s.reducedMotion);
  const cart = useCheckoutCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [slot, setSlot] = useState<DeliverySlotId | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) return;
    api
      .fetch<Address[]>('/users/me/addresses')
      .then((list) => {
        setAddresses(list);
        if (list[0]) setAddressId(list[0].id);
      })
      .catch(console.error);
  }, []);

  async function payNow() {
    setError('');
    if (!isLoggedIn()) {
      navigate('/login?redirect=/checkout');
      return;
    }
    if (!addressId) {
      setError('Please choose a delivery address.');
      return;
    }
    if (!slot) {
      setError('Please pick a delivery slot.');
      return;
    }
    if (!cart.shopId || !cart.orderItems.length) {
      setError('Your cart is empty.');
      return;
    }

    setPlacing(true);
    try {
      const order = await api.fetch<{ id: string; total: number }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          shopId: cart.shopId,
          addressId,
          scheduledFor: slotToScheduledFor(slot),
          paymentMethod: 'UPI',
          items: cart.orderItems,
        }),
      });

      await startRazorpayCheckout(order.id);
      await cart.clearAfterPayment();
      navigate(`/orders/${order.id}`, { replace: true, state: { orderPlaced: true } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPlacing(false);
    }
  }

  if (cart.loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div className="bd-skeleton" style={{ height: 28, width: 140, marginBottom: 20 }} />
        <div className="bd-skeleton" style={{ height: 120, marginBottom: 12 }} />
        <div className="bd-skeleton" style={{ height: 100, marginBottom: 12 }} />
      </div>
    );
  }

  if (cart.isEmpty) {
    return <EmptyCheckout />;
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 480, margin: '0 auto', padding: '1rem 1.25rem 2rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Link to="/cart" style={{ color: 'var(--bd-ink-soft)', textDecoration: 'none', fontSize: 18 }}>
          ←
        </Link>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--bd-ink)' }}>Checkout</h2>
      </div>

      <CheckoutSection>
        <div style={{ fontSize: 13, color: 'var(--bd-ink-soft)', marginBottom: 10 }}>
          From {cart.shopName ?? 'Florist'}
        </div>
        {cart.lines.map((line) => (
          <div
            key={line.productId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderTop: '0.5px solid var(--bd-border)',
            }}
          >
            <FlowerImage
              name={line.productName}
              imageUrl={line.imageUrl}
              className="shrink-0"
              imgClassName="w-12 h-12 rounded-lg object-cover"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: 'var(--bd-ink)' }}>{line.productName}</div>
              <div style={{ fontSize: 12, color: 'var(--bd-ink-soft)' }}>
                {formatPrice(line.unitPrice)}
              </div>
            </div>
            <MiniStepper
              qty={line.qty}
              onDec={() => cart.setQty(line.productId, line.qty - 1)}
              onInc={() => cart.setQty(line.productId, line.qty + 1)}
            />
          </div>
        ))}
      </CheckoutSection>

      <CheckoutSection title="Deliver to">
        {isLoggedIn() ? (
          addresses.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--bd-ink-soft)' }}>
              No saved addresses. Add one in your profile to continue.
            </p>
          ) : (
            addresses.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAddressId(a.id)}
                style={{
                  display: 'flex',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 'var(--bd-radius)',
                  background: 'transparent',
                  border:
                    addressId === a.id
                      ? '1.5px solid var(--bd-rose)'
                      : '0.5px solid var(--bd-border)',
                }}
              >
                <span style={{ fontSize: 18, color: 'var(--bd-rose)' }} aria-hidden>
                  🏠
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--bd-ink)' }}>
                    {a.label ?? a.recipientName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--bd-ink-soft)' }}>
                    {a.line1}, {a.city}
                  </div>
                </div>
              </button>
            ))
          )
        ) : (
          <p style={{ fontSize: 13, color: 'var(--bd-ink-soft)' }}>
            Sign in at payment to choose your delivery address.
          </p>
        )}
      </CheckoutSection>

      <CheckoutSection title="Delivery slot">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DELIVERY_SLOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSlot(s.id)}
              className={`bd-filter-chip${slot === s.id ? ' is-active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection>
        <BillRow label="Item total" value={formatPrice(cart.itemTotal)} />
        <BillRow label="Delivery fee" value={formatPrice(cart.deliveryFee)} border />
        <BillRow label="To pay" value={formatPrice(cart.toPay)} border strong />
        <p style={{ fontSize: 11, color: 'var(--bd-ink-soft)', marginTop: 8, marginBottom: 0 }}>
          Display total is an estimate — you are charged the amount confirmed by the server at payment.
        </p>
      </CheckoutSection>

      {error && (
        <div className="bd-error" style={{ marginBottom: 10, fontSize: 13 }}>
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={payNow}
        disabled={placing}
        className="bd-btn bd-btn-primary"
        style={{
          width: '100%',
          padding: 14,
          fontSize: 15,
          opacity: placing ? 0.7 : 1,
          cursor: placing ? 'default' : 'pointer',
        }}
      >
        {placing ? 'Processing…' : `Pay ${formatPrice(cart.toPay)}`}
      </button>
    </motion.div>
  );
}

function CheckoutSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      className="bd-card bd-card-static"
      style={{ padding: 14, marginBottom: 12, background: 'var(--bd-surface)' }}
    >
      {title && (
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--bd-ink)', marginBottom: 10 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function BillRow({
  label,
  value,
  border,
  strong,
}: {
  label: string;
  value: string;
  border?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: strong ? '11px 0' : '9px 0',
        fontSize: strong ? 15 : 13,
        fontWeight: strong ? 500 : 400,
        borderTop: border ? '0.5px solid var(--bd-border)' : 'none',
      }}
    >
      <span style={{ color: strong ? 'var(--bd-ink)' : 'var(--bd-ink-soft)' }}>{label}</span>
      <span style={{ color: 'var(--bd-ink)' }}>{value}</span>
    </div>
  );
}

function EmptyCheckout() {
  return (
    <div
      style={{
        maxWidth: 420,
        margin: '60px auto',
        textAlign: 'center',
        padding: '36px 28px',
        background: 'var(--bd-surface-alt)',
        borderRadius: 'var(--bd-radius-lg)',
      }}
    >
      <div style={{ fontSize: 36, color: 'var(--bd-ink-soft)', opacity: 0.6 }} aria-hidden>
        🛍
      </div>
      <div style={{ fontWeight: 500, fontSize: 17, color: 'var(--bd-ink)', marginTop: 12 }}>
        Your cart is empty
      </div>
      <p style={{ color: 'var(--bd-ink-soft)', fontSize: 14, margin: '8px 0 20px' }}>
        Browse florists near you to start an order.
      </p>
      <Link to="/" className="bd-btn bd-btn-primary" style={{ textDecoration: 'none' }}>
        Discover florists
      </Link>
    </div>
  );
}
