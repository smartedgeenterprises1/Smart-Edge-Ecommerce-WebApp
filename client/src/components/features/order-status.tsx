'use client';

import { cn } from '@/lib/cn';
import { fulfillmentLabel } from '@/lib/whatsapp';
import type { Order } from '@/types';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

export function OrderStatusPanel({ order }: { order: Order }) {
  const status = order.fulfillmentStatus || 'pending';
  const cancelled = status === 'cancelled';
  const activeIdx = cancelled ? -1 : Math.max(0, STEPS.indexOf(status as (typeof STEPS)[number]));

  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order status</p>
          <p className="mt-1 font-display text-xl font-bold capitalize text-primary-ink">
            {fulfillmentLabel(status)}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold capitalize',
            cancelled
              ? 'bg-red-50 text-danger'
              : status === 'delivered'
                ? 'bg-emerald-50 text-success'
                : 'bg-primary-soft text-primary-ink',
          )}
        >
          {fulfillmentLabel(status)}
        </span>
      </div>

      {!cancelled ? (
        <ol className="mt-5 grid gap-2 sm:grid-cols-5">
          {STEPS.map((step, idx) => {
            const done = idx <= activeIdx;
            const current = idx === activeIdx;
            return (
              <li
                key={step}
                className={cn(
                  'rounded-xl border px-2 py-2 text-center text-xs font-medium capitalize',
                  done ? 'border-primary-deep bg-primary-soft text-primary-ink' : 'border-border text-muted',
                  current && 'ring-2 ring-primary-deep/30',
                )}
              >
                {fulfillmentLabel(step)}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-danger">This order was cancelled.</p>
      )}

      {order.trackingNumber ? (
        <div className="mt-4 rounded-xl border border-primary-deep/25 bg-primary-soft/60 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tracking</p>
          <p className="mt-1 font-semibold text-primary-ink">{order.trackingNumber}</p>
          {order.trackingCarrier ? (
            <p className="text-muted">Carrier: {order.trackingCarrier}</p>
          ) : null}
        </div>
      ) : status === 'shipped' || status === 'delivered' ? (
        <p className="mt-4 text-sm text-muted">Tracking will appear here once the store adds it.</p>
      ) : null}

      <p className="mt-3 text-xs capitalize text-muted">Payment: {order.paymentStatus}</p>
    </div>
  );
}
