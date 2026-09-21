'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { readGuestOrder } from '@/lib/cart';
import { formatPkr, formatDate } from '@/lib/format';
import { Spinner } from '@/components/ui/misc';
import { OrderStatusPanel } from '@/components/features/order-status';
import type { Order } from '@/types';
import { useAuth } from '@/context/auth-context';

export function OrderConfirmation({
  orderNumber,
  token,
}: {
  orderNumber?: string;
  token?: string;
}) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const guest = readGuestOrder();
        const num = orderNumber || guest?.orderNumber;
        const access = token || guest?.accessToken;
        if (!num) {
          setError('No order reference found.');
          return;
        }
        if (user) {
          const data = await api<Order>(`/api/orders/mine/${encodeURIComponent(num)}`);
          setOrder(data);
        } else if (access) {
          const data = await api<Order>('/api/orders/guest-lookup', {
            method: 'POST',
            body: JSON.stringify({ orderNumber: num, accessToken: access }),
          });
          setOrder(data);
        } else {
          setOrder({
            _id: '',
            orderNumber: num,
            items: [],
            subtotalMinor: 0,
            discountMinor: 0,
            shippingMinor: 0,
            totalMinor: 0,
            currency: 'PKR',
            paymentMethod: 'cod',
            paymentStatus: 'pending',
            fulfillmentStatus: 'pending',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load order');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [orderNumber, token, user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-bold">Order lookup failed</h1>
        <p className="mt-2 text-sm text-danger">{error}</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-success">Thank you</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary-ink">Order placed</h1>
        <p className="mt-2 text-muted">
          Your order <strong>{order?.orderNumber}</strong> is placed with Cash on Delivery.
        </p>
        {order?.createdAt ? <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p> : null}
        {order?.items?.length ? (
          <ul className="mt-6 space-y-3 border-t border-border pt-4">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 text-sm">
                <span>
                  {item.title} × {item.quantity}
                </span>
                <span className="font-medium">{formatPkr(item.lineTotalMinor)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {order?.totalMinor ? (
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatPkr(order.totalMinor)}</span>
          </div>
        ) : null}
      </div>

      {order?._id ? <OrderStatusPanel order={order} /> : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-primary">
          Continue shopping
        </Link>
        {user ? (
          <Link href="/account/orders" className="btn btn-secondary">
            View orders
          </Link>
        ) : null}
      </div>
    </div>
  );
}
