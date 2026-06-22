import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@bloomdidi/shared';

interface CartState {
  shopId: string | null;
  shopName: string | null;
  items: CartItem[];
  /** Returns false if user declined vendor switch */
  addItem: (shopId: string, shopName: string, item: CartItem) => boolean;
  setItemQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  itemCount: () => number;
  subtotalForShop: (shopId: string, priceByProductId: Map<string, number>) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      shopId: null,
      shopName: null,
      items: [],
      addItem: (shopId, shopName, item) => {
        const state = get();
        if (state.shopId && state.shopId !== shopId && state.items.length > 0) {
          const ok = window.confirm(
            `Your cart has items from ${state.shopName ?? 'another florist'}. Start a new cart with ${shopName}?`,
          );
          if (!ok) return false;
          set({ shopId, shopName, items: [item] });
          return true;
        }
        const existing = state.items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            shopId,
            shopName,
            items: state.items.map((i) =>
              i.productId === item.productId ? { ...i, qty: i.qty + item.qty } : i,
            ),
          });
        } else {
          set({ shopId, shopName, items: [...state.items, item] });
        }
        return true;
      },
      setItemQty: (productId, qty) =>
        set((state) => {
          if (qty < 1) {
            const items = state.items.filter((i) => i.productId !== productId);
            return {
              items,
              shopId: items.length ? state.shopId : null,
              shopName: items.length ? state.shopName : null,
            };
          }
          return {
            items: state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
          };
        }),
      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.productId !== productId);
          return {
            items,
            shopId: items.length ? state.shopId : null,
            shopName: items.length ? state.shopName : null,
          };
        }),
      clear: () => set({ shopId: null, shopName: null, items: [] }),
      itemCount: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotalForShop: (shopId, priceByProductId) => {
        const state = get();
        if (state.shopId !== shopId) return 0;
        return state.items.reduce((sum, item) => {
          const price = priceByProductId.get(item.productId) ?? 0;
          return sum + price * item.qty;
        }, 0);
      },
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
