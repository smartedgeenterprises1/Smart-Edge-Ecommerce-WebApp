'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiRequestError } from '@/lib/api';
import { clearCart, makeIdempotencyKey, saveGuestOrder } from '@/lib/cart';
import { formatPkr } from '@/lib/format';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { EmptyState, Spinner } from '@/components/ui/misc';
import type { Address } from '@/types';

export function CheckoutForm() {
  const { items, quote, loadingQuote, refreshQuote, couponCode } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [idempotencyKey] = useState(() => makeIdempotencyKey());
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
  });

  useEffect(() => {
    void refreshQuote();
  }, [refreshQuote]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: user.fullName || f.fullName,
        email: user.email || f.email,
        phone: user.phone || f.phone,
      }));
      void api<Address[]>('/api/account/addresses')
        .then((list) => {
          setAddresses(list);
          const def = list.find((a) => a.isDefault) || list[0];
          if (def) {
            setForm((f) => ({
              ...f,
              fullName: def.fullName || f.fullName,
              phone: def.phone || f.phone,
              street: def.street,
              city: def.city,
              province: def.province,
              postalCode: def.postalCode || '',
            }));
          }
        })
        .catch(() => undefined);
    }
  }, [user]);

  if (!items.length) {
    return (
      <EmptyState
        title="Nothing to checkout"
        description="Add covers to your cart first."
        action={
          <Link href="/shop" className="btn btn-primary">
            Shop now
          </Link>
        }
      />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api<{
        order: { orderNumber: string; totalMinor: number };
        guestAccessToken?: string | null;
        replayed?: boolean;
      }>('/api/cart/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items,
          couponCode: couponCode || undefined,
          paymentMethod: 'cod',
          idempotencyKey,
          customer: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
          },
          shippingAddress: {
            street: form.street,
            city: form.city,
            province: form.province,
            postalCode: form.postalCode || '',
            country: 'PK',
          },
          notes: form.notes || '',
        }),
      });

      if (result.guestAccessToken) {
        saveGuestOrder({
          orderNumber: result.order.orderNumber,
          accessToken: result.guestAccessToken,
        });
      }
      clearCart();
      const q = new URLSearchParams({
        order: result.order.orderNumber,
      });
      if (result.guestAccessToken) q.set('token', result.guestAccessToken);
      router.push(`/order-confirmation?${q.toString()}`);
    } catch (err) {
      setError(err instanceof ApiRequestError || err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div>
          <h2 className="font-display text-xl font-bold">Contact</h2>
          {!user ? (
            <p className="mt-1 text-sm text-muted">
              Checking out as guest.{' '}
              <Link href="/login?next=/checkout" className="text-primary-ink underline">
                Sign in
              </Link>{' '}
              for faster checkout.
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName">
            <Input id="fullName" required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              className="sm:col-span-2"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
        </div>

        {addresses.length > 1 ? (
          <Field label="Saved address" htmlFor="saved">
            <select
              id="saved"
              className="select"
              defaultValue=""
              onChange={(e) => {
                const a = addresses.find((x) => x._id === e.target.value);
                if (!a) return;
                setForm((f) => ({
                  ...f,
                  fullName: a.fullName,
                  phone: a.phone,
                  street: a.street,
                  city: a.city,
                  province: a.province,
                  postalCode: a.postalCode || '',
                }));
              }}
            >
              <option value="">Choose…</option>
              {addresses.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.label || a.street} — {a.city}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <h2 className="font-display text-xl font-bold">Shipping (Pakistan)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Address" htmlFor="street">
              <Input id="street" required value={form.street} onChange={(e) => set('street', e.target.value)} />
            </Field>
          </div>
          <Field label="City" htmlFor="city">
            <Input id="city" required value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="Province" htmlFor="province">
            <Input id="province" required value={form.province} onChange={(e) => set('province', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Order notes" htmlFor="notes">
              <Textarea id="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-ink">
          Payment method: <strong>Cash on Delivery (COD)</strong> only.
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={busy || loadingQuote || !quote} className="w-full sm:w-auto">
          {busy ? <Spinner className="size-4 border-white border-t-transparent" /> : null}
          Place order · {formatPkr(quote?.totalMinor)}
        </Button>
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold">Summary</h2>
        {loadingQuote && !quote ? <Spinner className="mt-4" /> : null}
        <ul className="mt-4 space-y-3 text-sm">
          {quote?.items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-3">
              <span className="text-muted">
                {i.title} × {i.quantity}
              </span>
              <span className="font-medium">{formatPkr(i.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Shipping</span>
            <span>{formatPkr(quote?.shippingMinor)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Discount</span>
            <span>{formatPkr(quote?.discountMinor)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPkr(quote?.totalMinor)}</span>
          </div>
        </div>
      </aside>
    </form>
  );
}
