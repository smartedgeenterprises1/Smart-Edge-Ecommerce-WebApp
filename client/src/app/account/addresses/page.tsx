'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Spinner, EmptyState } from '@/components/ui/misc';
import type { Address } from '@/types';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: true,
  });

  async function load() {
    const data = await api<Address[]>('/api/account/addresses');
    setAddresses(data);
  }

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api('/api/account/addresses', {
      method: 'POST',
      body: JSON.stringify({ ...form, country: 'PK' }),
    });
    await load();
  }

  async function remove(id?: string) {
    if (!id) return;
    await api(`/api/account/addresses/${id}`, { method: 'DELETE' });
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="mb-4 font-display text-2xl font-bold text-primary-ink">Addresses</h1>
        {!addresses.length ? <EmptyState title="No saved addresses" /> : null}
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a._id} className="rounded-2xl border border-border bg-white p-4 text-sm">
              <p className="font-semibold">
                {a.label || 'Address'} {a.isDefault ? '· Default' : ''}
              </p>
              <p className="mt-1 text-muted">
                {a.fullName} · {a.phone}
                <br />
                {a.street}, {a.city}, {a.province}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-danger"
                onClick={() => void remove(a._id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-semibold">Add address</h2>
        {(
          [
            ['label', 'Label'],
            ['fullName', 'Full name'],
            ['phone', 'Phone'],
            ['street', 'Address'],
            ['city', 'City'],
            ['province', 'Province'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label} htmlFor={key}>
            <Input
              id={key}
              required={key !== 'label'}
              value={form[key] as string}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </Field>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          Default address
        </label>
        <Button type="submit">Save address</Button>
      </form>
    </div>
  );
}
