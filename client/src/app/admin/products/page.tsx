'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPkr, toMinor } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Spinner, Badge } from '@/components/ui/misc';
import type { ProductListItem } from '@/types';

type ListResult = { items: ProductListItem[]; total: number; page: number; limit: number };

export default function AdminProductsPage() {
  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    basePrice: '1999',
    status: 'active',
    caseType: 'Soft case',
    material: 'TPU',
    isFeatured: false,
    isNewArrival: true,
  });

  async function load(page = 1) {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) q.set('status', status);
    try {
      const res = await api<ListResult>(`/api/admin/products?${q}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          basePriceMinor: toMinor(Number(form.basePrice) || 0),
          status: form.status,
          caseType: form.caseType,
          material: form.material,
          isFeatured: form.isFeatured,
          isNewArrival: form.isNewArrival,
        }),
      });
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        basePrice: '1999',
        status: 'active',
        caseType: 'Soft case',
        material: 'TPU',
        isFeatured: false,
        isNewArrival: true,
      });
      await load();
      setMsg('Product created');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function toggleStatus(p: ProductListItem) {
    const next = p.status === 'active' ? 'archived' : 'active';
    await api(`/api/admin/products/${p._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    await load(data?.page || 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-primary-ink">Products</h1>
        <div className="flex gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : 'New product'}</Button>
        </div>
      </div>

      {msg ? <p className="text-sm text-primary-ink">{msg}</p> : null}

      {showForm ? (
        <form onSubmit={createProduct} className="grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title">
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Base price (PKR)" htmlFor="basePrice">
            <Input
              id="basePrice"
              type="number"
              required
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Case type" htmlFor="caseType">
            <Input id="caseType" value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })} />
          </Field>
          <Field label="Material" htmlFor="material">
            <Input id="material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
              />
              New arrival
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Create product</Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items || []).map((p) => (
                <tr key={p._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">{formatPkr(p.basePriceMinor)}</td>
                  <td className="px-4 py-3">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="secondary" onClick={() => void toggleStatus(p)}>
                      {p.status === 'active' ? 'Archive' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-muted">{data?.total ?? 0} products</p>
        </div>
      )}
    </div>
  );
}
