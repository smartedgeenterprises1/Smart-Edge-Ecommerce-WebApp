'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { api } from '@/lib/api';
import {
  addToCart as addLocal,
  cartCount,
  clearCart as clearLocal,
  readCart,
  upsertCartItem,
  writeCart,
} from '@/lib/cart';
import type { CartLineLocal, CartQuote } from '@/types';

type CartContextValue = {
  items: CartLineLocal[];
  count: number;
  quote: CartQuote | null;
  loadingQuote: boolean;
  quoteError: string | null;
  couponCode: string;
  setCouponCode: (c: string) => void;
  addItem: (variantId: string, qty?: number) => void;
  setQuantity: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  refreshQuote: () => Promise<CartQuote | null>;
};

const CartContext = createContext<CartContextValue | null>(null);

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener('storage', handler);
  window.addEventListener('smart-edge:cart', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('smart-edge:cart', handler);
  };
}

function getSnapshot() {
  return JSON.stringify(readCart());
}

function getServerSnapshot() {
  return '[]';
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => JSON.parse(raw) as CartLineLocal[], [raw]);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const refreshQuote = useCallback(async () => {
    const current = readCart();
    if (!current.length) {
      setQuote(null);
      setQuoteError(null);
      return null;
    }
    setLoadingQuote(true);
    setQuoteError(null);
    try {
      const data = await api<CartQuote>('/api/cart/quote', {
        method: 'POST',
        body: JSON.stringify({
          items: current,
          couponCode: couponCode || undefined,
        }),
      });
      setQuote(data);
      // Sync quantities if stock constrained
      const synced = data.items.map((i) => ({
        variantId: i.variantId,
        quantity: Math.min(i.quantity, i.available || i.quantity),
      }));
      if (JSON.stringify(synced) !== JSON.stringify(current)) {
        writeCart(synced);
      }
      return data;
    } catch (e) {
      setQuote(null);
      setQuoteError(e instanceof Error ? e.message : 'Could not refresh cart');
      return null;
    } finally {
      setLoadingQuote(false);
    }
  }, [couponCode]);

  useEffect(() => {
    void refreshQuote();
  }, [raw, refreshQuote]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      quote,
      loadingQuote,
      quoteError,
      couponCode,
      setCouponCode,
      addItem: (variantId, qty = 1) => addLocal(variantId, qty),
      setQuantity: (variantId, qty) => upsertCartItem(variantId, qty),
      removeItem: (variantId) => upsertCartItem(variantId, 0),
      clear: () => clearLocal(),
      refreshQuote,
    }),
    [items, quote, loadingQuote, quoteError, couponCode, refreshQuote],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
