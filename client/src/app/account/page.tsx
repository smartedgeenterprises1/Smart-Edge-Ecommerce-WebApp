'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Spinner } from '@/components/ui/misc';
import type { User } from '@/types';

export default function AccountProfilePage() {
  const { user, loading, refresh } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (loading) return <Spinner />;
  if (!user) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api<User>('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, phone }),
      });
      await refresh();
      setMsg('Profile updated');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg rounded-2xl border border-border bg-white p-6">
      <h1 className="font-display text-2xl font-bold text-primary-ink">Profile</h1>
      <p className="mt-1 text-sm text-muted">{user.email}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Full name" htmlFor="fullName">
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        {msg ? <p className="text-sm text-primary-ink">{msg}</p> : null}
        <Button type="submit" disabled={busy}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
