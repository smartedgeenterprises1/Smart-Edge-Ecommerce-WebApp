'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatPkr } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { Spinner, Badge } from '@/components/ui/misc';
import { WhatsAppOrderCard } from '@/components/admin/whatsapp-order-card';
import { fulfillmentLabel } from '@/lib/whatsapp';
import type { Order } from '@/types';

type ListResult = { items: Order[]; total: number; page: number; limit: number };

const fulfillmentOptions = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export default function AdminOrdersPage() {
  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [msg, setMsg] = useState('');

  async function load(page = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q) params.set('q', q);
    if (fulfillmentStatus) params.set('fulfillmentStatus', fulfillmentStatus);
    try {
      const res = await api<ListResult>(`/api/admin/orders?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [fulfillmentStatus]);

  async function openOrder(id: string) {
    const order = await api<Order>(`/api/admin/orders/${id}`);
    setSelected(order);
    setTrackingNumber(order.trackingNumber || '');
    setTrackingCarrier(order.trackingCarrier || '');
    setMsg('');
  }

  async function setFulfillment(status: (typeof fulfillmentOptions)[number]) {
    if (!selected) return;
    setMsg('');
    try {
      const order = await api<Order>(`/api/admin/orders/${selected._id}/fulfillment`, {
        method: 'POST',
        body: JSON.stringify({ status, trackingNumber, trackingCarrier }),
      });
      setSelected(order);
      setTrackingNumber(order.trackingNumber || '');
      setTrackingCarrier(order.trackingCarrier || '');
      const waReady = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status);
      setMsg(
        waReady
          ? `Status → ${fulfillmentLabel(status)}. WhatsApp message is ready below.`
          : `Fulfillment → ${status}`,
      );
      await load(data?.page || 1);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  }

  async function saveTracking() {
    if (!selected) return;
    setMsg('');
    try {
      const order = await api<Order>(`/api/admin/orders/${selected._id}/tracking`, {
        method: 'POST',
        body: JSON.stringify({ trackingNumber, trackingCarrier }),
      });
      setSelected(order);
      setMsg(
        order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered'
          ? 'Tracking saved. WhatsApp message below includes the tracking number.'
          : 'Tracking saved. It will be included when you mark the order shipped.',
      );
      await load(data?.page || 1);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save tracking');
    }
  }

  async function collectPayment() {
    if (!selected) return;
    try {
      const order = await api<Order>(`/api/admin/orders/${selected._id}/collect-payment`, {
        method: 'POST',
      });
      setSelected(order);
      setMsg('COD payment marked collected');
      await load(data?.page || 1);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Collect failed');
    }
  }

  async function cancelOrder() {
    if (!selected) return;
    try {
      const order = await api<Order>(`/api/admin/orders/${selected._id}/cancel`, { method: 'POST' });
      setSelected(order);
      setMsg('Order cancelled. WhatsApp message is ready below.');
      await load(data?.page || 1);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Cancel failed');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-primary-ink">Orders</h1>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search order #, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="secondary" onClick={() => void load()}>
          Search
        </Button>
        <Select
          value={fulfillmentStatus}
          onChange={(e) => setFulfillmentStatus(e.target.value)}
          aria-label="Fulfillment filter"
        >
          <option value="">All fulfillment</option>
          <option value="pending">Pending</option>
          {fulfillmentOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          {loading ? (
            <div className="p-6">
              <Spinner />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((o) => (
                  <tr
                    key={o._id}
                    className="cursor-pointer border-b border-border hover:bg-primary-soft/40"
                    onClick={() => void openOrder(o._id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{o.customerName}</p>
                      <p className="text-xs text-muted">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">{formatPkr(o.totalMinor)}</td>
                    <td className="px-4 py-3">
                      <Badge>{o.fulfillmentStatus}</Badge>
                      <p className="mt-1 text-xs capitalize text-muted">{o.paymentStatus}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-white p-4">
          {!selected ? (
            <p className="text-sm text-muted">Select an order to manage fulfillment, tracking, and WhatsApp.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold">{selected.orderNumber}</h2>
                <p className="text-sm text-muted">
                  {selected.customerName} · {selected.customerEmail}
                </p>
                {selected.customerPhone ? (
                  <p className="text-sm text-muted">{selected.customerPhone}</p>
                ) : null}
                <p className="mt-1 text-sm capitalize text-muted">
                  Status: <strong className="text-primary-ink">{fulfillmentLabel(selected.fulfillmentStatus)}</strong>
                </p>
                <p className="text-sm font-semibold">{formatPkr(selected.totalMinor)}</p>
              </div>
              {selected.shippingAddress ? (
                <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Ship to</p>
                  <p className="font-medium text-primary-ink">
                    {selected.shippingAddress.fullName || selected.customerName}
                  </p>
                  {selected.shippingAddress.phone ? (
                    <p className="text-muted">{selected.shippingAddress.phone}</p>
                  ) : null}
                  <p className="mt-1 text-primary-ink">
                    {selected.shippingAddress.street}
                    <br />
                    {selected.shippingAddress.city}
                    {selected.shippingAddress.province ? `, ${selected.shippingAddress.province}` : ''}
                    {selected.shippingAddress.postalCode ? ` ${selected.shippingAddress.postalCode}` : ''}
                    {selected.shippingAddress.country ? (
                      <>
                        <br />
                        {selected.shippingAddress.country}
                      </>
                    ) : null}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-danger">No shipping address on this order.</p>
              )}
              <ul className="space-y-2 text-sm">
                {selected.items?.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      {item.title} × {item.quantity}
                      {item.color || item.deviceModelName ? (
                        <span className="block text-xs text-muted">
                          {[item.deviceModelName, item.color].filter(Boolean).join(' · ')}
                        </span>
                      ) : null}
                    </span>
                    <span>{formatPkr(item.lineTotalMinor)}</span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-2">
                <label className="label" htmlFor="trackingNumber">
                  Tracking number
                </label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TCS123456"
                />
                <label className="label" htmlFor="trackingCarrier">
                  Carrier
                </label>
                <Input
                  id="trackingCarrier"
                  value={trackingCarrier}
                  onChange={(e) => setTrackingCarrier(e.target.value)}
                  placeholder="e.g. TCS, Leopards"
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => void saveTracking()}>
                  Save tracking
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {fulfillmentOptions.map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => void setFulfillment(s)}>
                    {s}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void collectPayment()} disabled={selected.paymentStatus === 'collected'}>
                  Collect COD
                </Button>
                <Button variant="danger" onClick={() => void cancelOrder()}>
                  Cancel
                </Button>
              </div>
              {msg ? <p className="text-sm text-primary-ink">{msg}</p> : null}
              <WhatsAppOrderCard order={{ ...selected, trackingNumber, trackingCarrier }} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
