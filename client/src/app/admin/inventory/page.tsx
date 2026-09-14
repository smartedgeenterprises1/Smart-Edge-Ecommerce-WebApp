'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Spinner } from '@/components/ui/misc';

type Movement = {
  _id: string;
  variantId: string;
  delta: number;
  reason: string;
  createdAt: string;
};

type VariantRow = {
  _id: string;
  sku: string;
  color: string;
  stockOnHand: number;
  stockReserved: number;
  lowStockThreshold: number;
  productId?: { title?: string };
};

export default function AdminInventoryPage() {
  const [lowStock, setLowStock] = useState<VariantRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ variantId: '', delta: '1', reason: 'Manual adjustment' });
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const dash = await api<{ lowStock: VariantRow[] }>('/api/admin/dashboard');
      setLowStock(dash.lowStock || []);
      const moves = await api<Movement[]>('/api/admin/inventory/movements');
      setMovements(moves);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          variantId: form.variantId,
          delta: Number(form.delta),
          reason: form.reason,
        }),
      });
      setMsg('Stock adjusted');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Adjust failed');
    }
  }

  if (loading) return <Spinner className="size-8" />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary-ink">Inventory</h1>

      <form onSubmit={onSubmit} className="grid max-w-xl gap-3 rounded-2xl border border-border bg-white p-4">
        <Field label="Variant ID" htmlFor="variantId">
          <Input
            id="variantId"
            required
            value={form.variantId}
            onChange={(e) => setForm({ ...form, variantId: e.target.value })}
          />
        </Field>
        <Field label="Delta (+/-)" htmlFor="delta">
          <Input
            id="delta"
            type="number"
            required
            value={form.delta}
            onChange={(e) => setForm({ ...form, delta: e.target.value })}
          />
        </Field>
        <Field label="Reason" htmlFor="reason">
          <Textarea
            id="reason"
            required
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </Field>
        <Button type="submit">Adjust stock</Button>
        {msg ? <p className="text-sm text-primary-ink">{msg}</p> : null}
      </form>

      <section className="rounded-2xl border border-border bg-white p-4">
        <h2 className="font-semibold">Low stock variants</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lowStock.map((v) => (
            <li key={v._id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
              <div>
                <p className="font-medium">{v.productId?.title || v.sku}</p>
                <p className="text-xs text-muted">
                  {v.sku} · {v.color} · id {v._id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-warning">
                  {Math.max(0, v.stockOnHand - v.stockReserved)} avail
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setForm((f) => ({ ...f, variantId: v._id, delta: '5' }))}
                >
                  Adjust
                </Button>
              </div>
            </li>
          ))}
          {!lowStock.length ? <li className="text-muted">No low-stock items.</li> : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-white p-4">
        <h2 className="font-semibold">Recent movements</h2>
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
          {movements.map((m) => (
            <li key={m._id} className="flex justify-between gap-3 border-b border-border py-2">
              <span>
                {m.variantId} · {m.reason}
              </span>
              <span className={m.delta >= 0 ? 'text-success' : 'text-danger'}>
                {m.delta >= 0 ? '+' : ''}
                {m.delta}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
