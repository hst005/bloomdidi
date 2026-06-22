import { useTheme } from './useTheme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={className}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: 20,
        lineHeight: 1,
        color: 'var(--bd-ink-soft)',
        padding: 6,
        transition: 'transform 200ms ease, color 200ms ease',
      }}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
