'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatPkr } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import { OrderStatusPanel } from '@/components/features/order-status';
import type { Order } from '@/types';

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!orderNumber) return;
    setRefreshing(true);
    try {
      const data = await api<Order>(`/api/orders/mine/${encodeURIComponent(orderNumber)}`);
      setOrder(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Order not found');
    } finally {
      setRefreshing(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !order) {
    return (
      <div>
        <p className="text-danger">{error}</p>
        <Link href="/account/orders" className="btn btn-secondary mt-4">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) return <Spinner />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/orders" className="text-sm text-muted hover:text-primary-ink">
            ← Orders
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-primary-ink">{order.orderNumber}</h1>
          <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void load()} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh status'}
        </Button>
      </div>

      <OrderStatusPanel order={order} />

      <ul className="space-y-3 rounded-2xl border border-border bg-white p-4">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
            <div>
              <p className="font-semibold">{i.title}</p>
              <p className="text-muted">
                {i.deviceModelName} · {i.color} · Qty {i.quantity}
              </p>
            </div>
            <span className="font-medium">{formatPkr(i.lineTotalMinor)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatPkr(order.subtotalMinor)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Discount</dt>
          <dd>{formatPkr(order.discountMinor)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd>{formatPkr(order.shippingMinor)}</dd>
        </div>
        <div className="flex justify-between text-base font-bold">
          <dt>Total</dt>
          <dd>{formatPkr(order.totalMinor)}</dd>
        </div>
      </dl>
      {order.shippingAddress ? (
        <p className="text-sm text-muted">
          Ship to {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
          {order.shippingAddress.province}
        </p>
      ) : null}
    </div>
  );
}
