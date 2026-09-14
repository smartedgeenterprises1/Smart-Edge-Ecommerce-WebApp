import Link from 'next/link';
import Image from 'next/image';
import { formatPkr } from '@/lib/format';
import { mediaUrl } from '@/lib/config';
import { Badge } from '@/components/ui/misc';
import type { ProductListItem } from '@/types';
import { cn } from '@/lib/cn';

export function ProductCard({ product, className }: { product: ProductListItem; className?: string }) {
  const img = product.images?.[0];
  const price = product.minPriceMinor ?? product.basePriceMinor;
  const compare = product.compareAtPriceMinor;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted-bg">
        <Image
          src={mediaUrl(img?.url)}
          alt={img?.alt || product.title}
          fill
          sizes="(max-width:768px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {product.isNewArrival ? <Badge>New</Badge> : null}
          {product.isFeatured ? <Badge className="bg-white text-primary-ink">Featured</Badge> : null}
          {product.inStock === false ? <Badge className="bg-danger text-white">Sold out</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary-ink">
          {product.title}
        </h3>
        {product.colors?.length ? (
          <p className="text-xs text-muted">{product.colors.slice(0, 4).join(' · ')}</p>
        ) : null}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-semibold text-primary-ink">{formatPkr(price)}</span>
          {compare && compare > price ? (
            <span className="text-xs text-muted line-through">{formatPkr(compare)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  if (!products.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-12 text-center text-sm text-muted">
        No products match these filters.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
