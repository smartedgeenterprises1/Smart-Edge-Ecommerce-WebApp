'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, formatPkr } from '@/lib/format';
import { Spinner, EmptyState, Badge } from '@/components/ui/misc';
import { fulfillmentLabel } from '@/lib/whatsapp';
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
              {o.trackingNumber ? (
                <p className="mt-1 text-xs text-primary-ink">Tracking: {o.trackingNumber}</p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPkr(o.totalMinor)}</p>
              <div className="mt-1 flex flex-wrap justify-end gap-1">
                <Badge>{fulfillmentLabel(o.fulfillmentStatus)}</Badge>
              </div>
              <p className="mt-1 text-xs capitalize text-muted">{o.paymentStatus}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
