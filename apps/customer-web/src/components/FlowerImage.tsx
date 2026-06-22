import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { resolveImageUrl, shouldUsePlaceholder } from '../lib/demo-images';

function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.85" />
      <ellipse cx="12" cy="7" rx="3" ry="4.5" fill="currentColor" opacity="0.55" />
      <ellipse cx="16.5" cy="10" rx="3" ry="4.5" fill="currentColor" opacity="0.55" transform="rotate(72 12 12)" />
      <ellipse cx="14.8" cy="15.5" rx="3" ry="4.5" fill="currentColor" opacity="0.55" transform="rotate(144 12 12)" />
      <ellipse cx="9.2" cy="15.5" rx="3" ry="4.5" fill="currentColor" opacity="0.55" transform="rotate(216 12 12)" />
      <ellipse cx="7.5" cy="10" rx="3" ry="4.5" fill="currentColor" opacity="0.55" transform="rotate(288 12 12)" />
    </svg>
  );
}

interface FlowerImageProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
  imgClassName?: string;
  layoutId?: string;
}

export function FlowerImage({
  name,
  imageUrl,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  layoutId,
}: FlowerImageProps) {
  const [failed, setFailed] = useState(() => shouldUsePlaceholder(imageUrl));

  useEffect(() => {
    setFailed(shouldUsePlaceholder(imageUrl));
  }, [imageUrl]);

  if (failed) {
    const inner = (
      <>
        <FlowerIcon className="w-10 h-10 md:w-12 md:h-12 opacity-70 shrink-0" />
        <span className="mt-2 px-3 text-center text-xs md:text-sm font-medium text-brand-700 line-clamp-2 max-w-full">
          {name}
        </span>
      </>
    );
    const placeholderClass = `flex flex-col items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-brand-50 text-brand-600 ${className}`;
    return layoutId ? (
      <motion.div layoutId={layoutId} className={placeholderClass}>
        {inner}
      </motion.div>
    ) : (
      <div className={placeholderClass}>{inner}</div>
    );
  }

  const src = resolveImageUrl(imageUrl);

  if (layoutId) {
    return (
      <motion.img
        layoutId={layoutId}
        src={src}
        alt={name}
        className={`${imgClassName} ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${imgClassName} ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
