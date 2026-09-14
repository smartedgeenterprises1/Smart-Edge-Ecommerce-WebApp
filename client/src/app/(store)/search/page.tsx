import { Suspense } from 'react';
import { ProductGrid } from '@/components/features/product-card';
import { Spinner } from '@/components/ui/misc';
import { serverApiSoft } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { CatalogResult } from '@/types';
import { SearchForm } from '@/components/features/search-form';

export const metadata = buildMetadata({
  title: 'Search',
  path: '/search',
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const catalog = q
    ? await serverApiSoft<CatalogResult>(`/api/catalog/products?q=${encodeURIComponent(q)}&limit=24`)
    : null;

  return (
    <div className="container-se py-10">
      <h1 className="font-display text-3xl font-bold text-primary-ink">Search</h1>
      <div className="mt-4 max-w-xl">
        <Suspense fallback={<Spinner />}>
          <SearchForm initialQuery={q} />
        </Suspense>
      </div>
      {q ? (
        <div className="mt-8">
          <p className="mb-4 text-sm text-muted">
            {catalog?.total ?? 0} results for “{q}”
          </p>
          <ProductGrid products={catalog?.items || []} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">Try searching by product name, brand, or model.</p>
      )}
    </div>
  );
}
