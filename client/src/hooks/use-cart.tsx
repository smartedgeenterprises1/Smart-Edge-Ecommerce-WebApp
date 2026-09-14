'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CartLine, Quote } from '@/types/store';
import { apiFetch } from '@/lib/api';

const STORAGE_KEY = 'se_cart_v1';

type CartContextValue = {
  lines: CartLine[];
  count: number;
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  addItem: (variantId: string, quantity?: number) => void;
  updateQty: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  refreshQuote: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed.filter((l) => l.variantId && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const linesRef = useRef(lines);
  const couponRef = useRef(couponCode);
  linesRef.current = lines;
  couponRef.current = couponCode;

  useEffect(() => {
    setLines(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const refreshQuote = useCallback(async () => {
    const current = linesRef.current;
    if (!current.length) {
      setQuote(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Quote>('/api/cart/quote', {
        method: 'POST',
        body: JSON.stringify({
          items: current,
          couponCode: couponRef.current || undefined,
        }),
      });
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not validate cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refreshQuote();
  }, [hydrated, lines, couponCode, refreshQuote]);

  const addItem = useCallback((variantId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === variantId ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l,
        );
      }
      return [...prev, { variantId, quantity }];
    });
  }, []);

  const updateQty = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.variantId === variantId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      quote,
      loading,
      error,
      couponCode,
      setCouponCode,
      addItem,
      updateQty,
      removeItem,
      clear,
      refreshQuote,
    }),
    [lines, quote, loading, error, couponCode, addItem, updateQty, removeItem, clear, refreshQuote],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
