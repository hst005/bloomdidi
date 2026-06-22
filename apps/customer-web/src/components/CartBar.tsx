import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../lib/api';

interface CartBarProps {
  count: number;
  subtotal: number;
}

export function CartBar({ count, subtotal }: CartBarProps) {
  const navigate = useNavigate();

  if (count === 0) return null;

  return (
    <div
      className="bd-rise"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 35,
        background: 'var(--bd-rose)',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--bd-shadow-lg)',
      }}
    >
      <span style={{ color: 'var(--bd-rose-on)', fontSize: 14 }}>
        {count} item{count !== 1 ? 's' : ''} · {formatPrice(subtotal)}
      </span>
      <button
        type="button"
        onClick={() => navigate('/cart')}
        style={{
          border: 'none',
          cursor: 'pointer',
          borderRadius: 10,
          background: 'var(--bd-surface)',
          color: 'var(--bd-rose)',
          padding: '8px 20px',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        View cart →
      </button>
    </div>
  );
}
