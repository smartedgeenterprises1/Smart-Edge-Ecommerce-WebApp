import Link from 'next/link';
import Image from 'next/image';
import type { ProductListItem } from '@/types/store';
import { formatMoney } from '@/lib/format';

export function ProductCard({ product }: { product: ProductListItem }) {
  const img = product.images?.[0];
  const models = product.compatibleDeviceModelIds?.slice(0, 2).map((m) => m.name).join(', ');
  const min = product.minPriceMinor ?? 0;
  const max = product.maxPriceMinor ?? min;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-white transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
      <Link href={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-surface">
        {img?.url ? (
          <Image
            src={img.url}
            alt={img.alt || product.title}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            unoptimized={img.url.endsWith('.svg')}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted">No image</div>
        )}
        {!product.inStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-danger">
            Out of stock
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-semibold leading-snug">
          <Link href={`/product/${product.slug}`}>{product.title}</Link>
        </h3>
        {models ? (
          <p className="text-xs text-muted">
            Fits: {models}
            {product.compatibleDeviceModelIds && product.compatibleDeviceModelIds.length > 2 ? '…' : ''}
          </p>
        ) : null}
        <p className="mt-auto text-sm font-semibold text-primary-ink">
          {min === max ? formatMoney(min) : `From ${formatMoney(min)}`}
        </p>
      </div>
    </article>
  );
}
