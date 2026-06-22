import { motion } from 'framer-motion';
import { useFlyStore, useMotionPrefs } from '../store/cart';

export function FlyToCart() {
  const { flying, from, endFly } = useFlyStore();
  const reduced = useMotionPrefs((s) => s.reducedMotion);

  if (reduced || !flying || !from) return null;

  const cartIcon = document.getElementById('cart-icon');
  const cartRect = cartIcon?.getBoundingClientRect();
  if (!cartRect) return null;

  return (
    <motion.div
      className="fixed z-50 w-10 h-10 rounded-full bg-brand-500 shadow-lg pointer-events-none"
      initial={{
        left: from.left + from.width / 2 - 20,
        top: from.top + from.height / 2 - 20,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        left: cartRect.left + cartRect.width / 2 - 20,
        top: cartRect.top + cartRect.height / 2 - 20,
        scale: 0.3,
        opacity: 0.6,
      }}
      transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      onAnimationComplete={endFly}
    />
  );
}
