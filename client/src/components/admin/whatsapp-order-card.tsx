'use client';

import { buildOrderWhatsAppMessage, fulfillmentLabel, orderWhatsAppLink } from '@/lib/whatsapp';
import type { Order } from '@/types';

export function WhatsAppOrderCard({ order }: { order: Order }) {
  const { message, href, phone } = orderWhatsAppLink(order);
  if (!message) return null;

  const preview = buildOrderWhatsAppMessage(order);

  return (
    <div className="rounded-2xl border border-[#25D366]/35 bg-[#25D366]/10 p-3">
      <p className="text-sm font-semibold text-primary-ink">
        WhatsApp customer — {fulfillmentLabel(order.fulfillmentStatus)}
      </p>
      <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-white p-3 text-sm text-foreground">
        {preview}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
        >
          Send on WhatsApp
        </a>
      ) : (
        <p className="mt-2 text-xs text-danger">This order has no phone number for WhatsApp.</p>
      )}
      {phone ? <p className="mt-2 text-xs text-muted">Opens wa.me/{phone}</p> : null}
    </div>
  );
}
