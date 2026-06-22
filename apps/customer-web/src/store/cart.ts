import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@bloomdidi/shared';

interface CartState {
  shopId: string | null;
  items: CartItem[];
  addItem: (shopId: string, item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      shopId: null,
      items: [],
      addItem: (shopId, item) =>
        set((state) => {
          if (state.shopId && state.shopId !== shopId) {
            return { shopId, items: [item] };
          }
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              shopId,
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, qty: i.qty + item.qty } : i,
              ),
            };
          }
          return { shopId, items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
          shopId: state.items.length <= 1 ? null : state.shopId,
        })),
      clear: () => set({ shopId: null, items: [] }),
      itemCount: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: 'bloomdidi-cart' },
  ),
);

interface FlyState {
  flying: boolean;
  from: DOMRect | null;
  triggerFly: (rect: DOMRect) => void;
  endFly: () => void;
}

export const useFlyStore = create<FlyState>((set) => ({
  flying: false,
  from: null,
  triggerFly: (rect) => set({ flying: true, from: rect }),
  endFly: () => set({ flying: false, from: null }),
}));

interface MotionPrefs {
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

export const useMotionPrefs = create<MotionPrefs>((set) => ({
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  setReducedMotion: (v) => set({ reducedMotion: v }),
}));
