'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatPkr } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Spinner, Badge } from '@/components/ui/misc';
import type { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '10',
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    description: '',
  });

  async function load() {
    setLoading(true);
    try {
      setCoupons(await api<Coupon[]>('/api/admin/coupons'));
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
      await api('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          description: form.description || undefined,
        }),
      });
      setForm((f) => ({ ...f, code: '', description: '' }));
      setMsg('Coupon created');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Create failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary-ink">Coupons</h1>

      <form onSubmit={onSubmit} className="grid max-w-2xl gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2">
        <Field label="Code" htmlFor="code">
          <Input
            id="code"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="Type" htmlFor="type">
          <Select
            id="type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
          >
            <option value="percent">Percent</option>
            <option value="fixed">Fixed (PKR major or minor per API)</option>
          </Select>
        </Field>
        <Field label="Value" htmlFor="value">
          <Input
            id="value"
            type="number"
            required
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
        </Field>
        <Field label="Description" htmlFor="description">
          <Input
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Starts" htmlFor="startsAt">
          <Input
            id="startsAt"
            type="date"
            required
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </Field>
        <Field label="Ends" htmlFor="endsAt">
          <Input
            id="endsAt"
            type="date"
            required
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit">Create coupon</Button>
          {msg ? <p className="mt-2 text-sm text-primary-ink">{msg}</p> : null}
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Window</th>
                <th className="px-4 py-3">Usage</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{c.code}</p>
                    <Badge>{c.isActive === false ? 'inactive' : 'active'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {c.type === 'percent' ? `${c.value}%` : formatPkr(c.value)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(c.startsAt)} → {formatDate(c.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {c.usageCount ?? 0}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
