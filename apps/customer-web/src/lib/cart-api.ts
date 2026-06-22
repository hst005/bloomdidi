import { api } from './api';
import type { CartItem } from '@bloomdidi/shared';

export interface ServerCart {
  shopId: string | null;
  shopName: string | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    imageUrl: string | null;
    qty: number;
    unitPrice: number;
    customizations: unknown;
    lineTotal: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('bloomdidi_token');
}

export async function fetchCart(): Promise<ServerCart> {
  return api.fetch<ServerCart>('/cart');
}

export async function addToCart(item: CartItem): Promise<ServerCart> {
  return api.fetch<ServerCart>('/cart/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function replaceCart(item: CartItem): Promise<ServerCart> {
  return api.fetch<ServerCart>('/cart/items/replace', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateCartItem(productId: string, qty: number): Promise<ServerCart> {
  return api.fetch<ServerCart>(`/cart/items/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ qty }),
  });
}

export async function removeFromCart(productId: string): Promise<ServerCart> {
  return api.fetch<ServerCart>(`/cart/items/${productId}`, { method: 'DELETE' });
}

export async function clearServerCart(): Promise<void> {
  await api.fetch('/cart', { method: 'DELETE' });
}

export async function syncLocalCartToServer(
  items: CartItem[],
  onConflict?: () => Promise<boolean>,
): Promise<ServerCart | null> {
  if (!items.length) return null;
  let cart: ServerCart | null = null;
  for (const item of items) {
    try {
      cart = await addToCart(item);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('DIFFERENT_VENDOR') || msg.includes('another florist')) {
        if (onConflict && (await onConflict())) {
          cart = await replaceCart(item);
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }
  return cart;
}
