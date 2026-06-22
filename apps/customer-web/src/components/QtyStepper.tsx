interface QtyStepperProps {
  qty: number;
  onDec: () => void;
  onInc: () => void;
  max?: number;
}

export function QtyStepper({ qty, onDec, onInc, max = 99 }: QtyStepperProps) {
  const btnStyle: React.CSSProperties = {
    border: 'none',
    cursor: 'pointer',
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'var(--bd-rose-soft)',
    color: 'var(--bd-rose)',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" style={btnStyle} onClick={onDec} aria-label="Decrease quantity">
        −
      </button>
      <span
        style={{
          fontWeight: 500,
          minWidth: 16,
          textAlign: 'center',
          color: 'var(--bd-ink)',
        }}
      >
        {qty}
      </span>
      <button
        type="button"
        style={{ ...btnStyle, opacity: qty >= max ? 0.4 : 1 }}
        onClick={onInc}
        disabled={qty >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
