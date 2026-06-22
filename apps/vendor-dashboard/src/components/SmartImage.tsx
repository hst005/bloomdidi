import { useEffect, useState } from 'react';
import { resolveImageUrl } from '../lib/demo-images';

function FlowerIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity="0.6"
      aria-hidden
    >
      <path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      <path d="M12 8c0-3 1.5-4 1.5-4s1.5 1 1.5 3M12 8c0-3-1.5-4-1.5-4s-1.5 1-1.5 3" />
      <path d="M12 14c0 3 1.5 4 1.5 4s1.5-1 1.5-3M12 14c0 3-1.5 4-1.5 4s-1.5-1-1.5-3" />
    </svg>
  );
}

interface SmartImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Flower image or blush placeholder — never a black box */
export function SmartImage({ src, alt, className = '', style }: SmartImageProps) {
  const resolved = src ? resolveImageUrl(src) : null;
  const [failed, setFailed] = useState(!resolved);

  useEffect(() => {
    setFailed(!resolved);
  }, [resolved]);

  if (failed || !resolved) {
    return (
      <div
        className={`bd-img-fallback ${className}`}
        style={{ width: 56, height: 56, ...style }}
        role="img"
        aria-label={alt}
      >
        <FlowerIcon />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={`bd-img ${className}`}
      style={{ width: 56, height: 56, borderRadius: 'var(--bd-radius)', ...style }}
      onError={() => setFailed(true)}
    />
  );
}
