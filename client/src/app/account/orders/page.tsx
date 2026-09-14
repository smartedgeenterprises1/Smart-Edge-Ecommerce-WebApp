'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, formatPkr } from '@/lib/format';
import { Spinner, EmptyState } from '@/components/ui/misc';
import type { Order } from '@/types';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<Order[]>('/api/orders/mine')
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order, it will show up here."
        action={
          <Link href="/shop" className="btn btn-primary">
            Shop covers
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary-ink">Orders</h1>
      {orders.map((o) => (
        <Link
          key={o._id}
          href={`/account/orders/${encodeURIComponent(o.orderNumber)}`}
          className="block rounded-2xl border border-border bg-white p-4 transition hover:border-primary"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{o.orderNumber}</p>
              <p className="text-sm text-muted">{formatDate(o.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPkr(o.totalMinor)}</p>
              <p className="text-xs capitalize text-muted">
                {o.fulfillmentStatus} · {o.paymentStatus}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
