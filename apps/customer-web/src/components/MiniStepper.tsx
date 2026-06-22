interface MiniStepperProps {
  qty: number;
  onDec: () => void;
  onInc: () => void;
}

export function MiniStepper({ qty, onDec, onInc }: MiniStepperProps) {
  const btn: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: 'var(--bd-rose-soft)',
    color: 'var(--bd-rose)',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button type="button" style={btn} onClick={onDec} aria-label="Decrease quantity">
        −
      </button>
      <span style={{ minWidth: 14, textAlign: 'center', color: 'var(--bd-ink)', fontWeight: 500 }}>
        {qty}
      </span>
      <button type="button" style={btn} onClick={onInc} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
