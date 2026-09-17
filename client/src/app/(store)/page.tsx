import Link from 'next/link';
import Image from 'next/image';
import { ProductGrid } from '@/components/features/product-card';
import { BrandLogo } from '@/components/catalog/BrandLogo';
import { serverApiSoft } from '@/lib/api';
import { mediaUrl } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import type { Brand, CatalogResult, Category, StoreSettings } from '@/types';

export const metadata = buildMetadata({
  title: 'Premium phone covers',
  path: '/',
});

export default async function HomePage() {
  const [settings, brands, categories, featured, newest] = await Promise.all([
    serverApiSoft<StoreSettings>('/api/settings'),
    serverApiSoft<Brand[]>('/api/catalog/brands'),
    serverApiSoft<Category[]>('/api/catalog/categories'),
    serverApiSoft<CatalogResult>('/api/catalog/products?featured=true&limit=8'),
    serverApiSoft<CatalogResult>('/api/catalog/products?newArrival=true&limit=8'),
  ]);

  const heroSrc = settings?.heroImageUrl ? mediaUrl(settings.heroImageUrl) : null;

  return (
    <div>
      <section className="relative w-full overflow-hidden border-b border-border bg-[#071018]">
        {heroSrc ? (
          <div className="relative h-[260px] w-full sm:h-[340px] md:h-[420px] lg:h-[460px]">
            <Image
              src={heroSrc}
              alt="SMART EDGE ENTERPRISE"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
              unoptimized={heroSrc.endsWith('.svg') || heroSrc.endsWith('.webp')}
            />
          </div>
        ) : (
          <div className="flex h-[260px] items-center justify-center bg-[linear-gradient(135deg,#e8f7ff_0%,#ffffff_50%,#f0f9ff_100%)] px-6 text-center sm:h-[340px] md:h-[420px]">
            <div className="max-w-md space-y-3">
              <p className="font-display text-2xl font-bold text-primary-ink">Homepage banner</p>
              <p className="text-sm text-muted">
                Admin → Settings se hero image upload karo — yahan banner dikhegi.
              </p>
              <Link href="/shop" className="btn btn-primary mt-2 inline-flex">
                Shop covers
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="container-se py-14">
        <div className="animate-fade-up mb-8 text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Shop by brand</h2>
          <p className="mx-auto mt-2 max-w-md text-base text-muted sm:text-lg">
            Start with your phone family, then pick the exact model.
          </p>
          <Link
            href="/shop"
            className="mt-3 inline-block text-sm font-semibold text-primary-ink hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              { slug: 'apple', name: 'Apple' },
              { slug: 'google', name: 'Google' },
              { slug: 'samsung', name: 'Samsung' },
            ] as const
          ).map((fallback, i) => {
            const fromApi = (brands || []).find((b) => b.slug === fallback.slug);
            const slug = fromApi?.slug || fallback.slug;
            const name = fromApi?.name || fallback.name;
            return (
              <Link
                key={slug}
                href={`/shop?brand=${slug}`}
                className={`animate-fade-up flex min-h-[7.5rem] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white px-6 py-8 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md animate-delay-${(i % 3) + 1}`}
                aria-label={`Shop all ${name} covers`}
              >
                <BrandLogo slug={slug} name={name} logoUrl={fromApi?.logoUrl} />
                <span className="font-display text-base font-semibold text-primary-ink sm:text-lg">{name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-white/70 py-14">
        <div className="container-se">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold">Featured</h2>
            <Link href="/shop?featured=true" className="text-sm font-semibold text-primary-ink hover:underline">
              See more
            </Link>
          </div>
          <ProductGrid products={featured?.items || []} />
        </div>
      </section>

      <section className="container-se py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">New arrivals</h2>
          <Link href="/shop?sort=newest" className="text-sm font-semibold text-primary-ink hover:underline">
            See more
          </Link>
        </div>
        <ProductGrid products={newest?.items || []} />
      </section>

      {(categories || []).length ? (
        <section className="container-se pb-14">
          <h2 className="mb-6 font-display text-2xl font-bold">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {(categories || []).map((c) => (
              <Link key={c._id} href={`/category/${c.slug}`} className="badge bg-white border border-border px-4 py-2">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {(settings?.serviceClaims || []).length ? (
        <section className="border-t border-border bg-primary-soft/50 py-12">
          <div className="container-se grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(settings?.serviceClaims || []).map((claim) => (
              <div
                key={claim}
                className="rounded-2xl bg-white/80 px-4 py-5 text-center text-sm font-medium text-primary-ink shadow-sm"
              >
                {claim}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
