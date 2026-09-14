'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Spinner } from '@/components/ui/misc';
import type { User } from '@/types';

type ListResult = { items: User[]; total: number; page: number; limit: number };

export default function AdminCustomersPage() {
  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<ListResult>('/api/admin/customers?limit=50')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="size-8" />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary-ink">Customers</h1>
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((u) => (
              <tr key={u._id || u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-muted">
                  {formatDate((u as User & { createdAt?: string }).createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-xs text-muted">{data?.total ?? 0} customers</p>
      </div>
    </div>
  );
}
