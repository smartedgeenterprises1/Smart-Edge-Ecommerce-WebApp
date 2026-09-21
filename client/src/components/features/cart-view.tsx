'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { EmptyState, Spinner } from '@/components/ui/misc';
import { formatPkr } from '@/lib/format';
import { mediaUrl } from '@/lib/config';

export function CartView() {
  const { quote, loadingQuote, quoteError, setQuantity, removeItem, couponCode, setCouponCode, refreshQuote, count } =
    useCart();

  if (!count) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Find a cover that fits your phone and add it here."
        action={
          <Link href="/shop" className="btn btn-primary">
            Browse shop
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        {loadingQuote && !quote ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : null}
        {quoteError ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{quoteError}</p> : null}
        {quote?.items.map((item) => (
          <div key={item.variantId} className="flex gap-4 rounded-2xl border border-border bg-white p-3 sm:p-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted-bg">
              <Image src={mediaUrl(item.imageUrl)} alt="" fill className="object-cover" sizes="96px" />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.slug}`} className="font-semibold hover:text-primary-ink">
                {item.title}
              </Link>
              <p className="text-sm text-muted">
                {item.color} · {item.deviceBrandName} {item.deviceModelName}
              </p>
              <p className="mt-1 font-medium">{formatPkr(item.unitPriceMinor)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label htmlFor={`qty-${item.variantId}`} className="sr-only">
                  Quantity for {item.title}
                </label>
                <QuantityStepper
                  id={`qty-${item.variantId}`}
                  value={item.quantity}
                  min={1}
                  max={Math.max(1, item.available)}
                  onChange={(n) => setQuantity(item.variantId, n)}
                />
                <button
                  type="button"
                  className="btn btn-ghost p-2 text-danger"
                  aria-label={`Remove ${item.title}`}
                  onClick={() => removeItem(item.variantId)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {item.available < item.quantity ? (
                <p className="mt-1 text-xs text-warning">Only {item.available} left</p>
              ) : null}
            </div>
            <div className="hidden text-right font-semibold sm:block">{formatPkr(item.lineTotalMinor)}</div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-bold">Order summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <Row label="Subtotal" value={formatPkr(quote?.subtotalMinor)} />
          <Row label="Discount" value={formatPkr(quote?.discountMinor)} />
          <Row label="Shipping" value={formatPkr(quote?.shippingMinor)} />
          <Row label="Total" value={formatPkr(quote?.totalMinor)} bold />
        </div>
        <div className="mt-4 space-y-2">
          <label htmlFor="coupon" className="label">
            Coupon code
          </label>
          <div className="flex gap-2">
            <Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
            <Button variant="secondary" onClick={() => void refreshQuote()}>
              Apply
            </Button>
          </div>
        </div>
        <Link href="/checkout" className="btn btn-primary mt-5 w-full">
          Checkout · COD
        </Link>
        <p className="mt-3 text-xs text-muted">Cash on delivery only. You pay when your order arrives.</p>
      </aside>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? 'border-t border-border pt-2 text-base font-bold' : ''}`}>
      <span className={bold ? '' : 'text-muted'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
