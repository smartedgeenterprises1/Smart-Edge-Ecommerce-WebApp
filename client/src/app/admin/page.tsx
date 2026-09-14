'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '@/lib/api';
import { formatDate, formatPkr } from '@/lib/format';
import { Spinner } from '@/components/ui/misc';
import type { AdminDashboard } from '@/types';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<AdminDashboard>('/api/admin/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="size-8" />;
  if (error || !data) return <p className="text-danger">{error || 'No data'}</p>;

  const m = data.metrics;
  const cards = [
    { label: 'Orders', value: String(m.ordersCount) },
    { label: 'Products', value: String(m.productsCount) },
    { label: 'Pending', value: String(m.pendingOrders) },
    { label: 'Collected revenue', value: formatPkr(m.revenueMinor) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-ink sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">{m.revenueDefinition}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Sales trend (30 days)</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="collectedMinor"
                stroke="#75d1ff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary-ink underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {data.recentOrders.map((o) => (
              <li key={o._id} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p>{formatPkr(o.totalMinor)}</p>
                  <p className="text-xs capitalize text-muted">{o.fulfillmentStatus}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Low stock</h2>
            <Link href="/admin/inventory" className="text-sm text-primary-ink underline">
              Inventory
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {data.lowStock.map((v) => (
              <li key={v._id} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
                <div>
                  <p className="font-medium">{v.productId?.title || v.sku}</p>
                  <p className="text-xs text-muted">
                    {v.sku} · {v.color}
                  </p>
                </div>
                <p className="font-semibold text-warning">
                  {Math.max(0, v.stockOnHand - v.stockReserved)} left
                </p>
              </li>
            ))}
            {!data.lowStock.length ? <li className="text-muted">No low-stock variants.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
