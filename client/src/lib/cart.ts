import type { CartLineLocal } from '@/types';

export const CART_STORAGE_KEY = 'smart-edge-cart-v1';
export const GUEST_ORDER_KEY = 'smart-edge-guest-order';

export function readCart(): CartLineLocal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLineLocal[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((i) => i?.variantId && i.quantity > 0);
  } catch {
    return [];
  }
}

export function writeCart(items: CartLineLocal[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('smart-edge:cart'));
}

export function upsertCartItem(variantId: string, quantity: number) {
  const items = readCart();
  const idx = items.findIndex((i) => i.variantId === variantId);
  if (quantity <= 0) {
    if (idx >= 0) items.splice(idx, 1);
  } else if (idx >= 0) {
    items[idx].quantity = Math.min(20, quantity);
  } else {
    items.push({ variantId, quantity: Math.min(20, quantity) });
  }
  writeCart(items);
  return items;
}

export function addToCart(variantId: string, quantity = 1) {
  const items = readCart();
  const existing = items.find((i) => i.variantId === variantId);
  const nextQty = Math.min(20, (existing?.quantity ?? 0) + quantity);
  return upsertCartItem(variantId, nextQty);
}

export function cartCount(items?: CartLineLocal[]) {
  return (items ?? readCart()).reduce((sum, i) => sum + i.quantity, 0);
}

export function saveGuestOrder(payload: { orderNumber: string; accessToken: string }) {
  localStorage.setItem(GUEST_ORDER_KEY, JSON.stringify(payload));
}

export function readGuestOrder(): { orderNumber: string; accessToken: string } | null {
  try {
    const raw = localStorage.getItem(GUEST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCart() {
  writeCart([]);
}

export function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
  }
  return `se-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
