import { Suspense } from 'react';
import { CatalogFilters, Pagination } from '@/components/features/catalog-filters';
import { ProductGrid } from '@/components/features/product-card';
import { Spinner } from '@/components/ui/misc';
import { serverApiSoft } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { Brand, CatalogResult, Category, DeviceModel, Facets } from '@/types';

export const metadata = buildMetadata({
  title: 'Shop',
  description: 'Browse premium phone covers by brand, model, color, and material.',
  path: '/shop',
});

type Search = Record<string, string | string[] | undefined>;

function qp(sp: Search, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

async function CatalogBody({ searchParams }: { searchParams: Search }) {
  const query = new URLSearchParams();
  const keys = [
    'page',
    'limit',
    'q',
    'brand',
    'model',
    'category',
    'color',
    'material',
    'caseType',
    'minPrice',
    'maxPrice',
    'inStock',
    'sort',
    'featured',
    'newArrival',
  ];
  for (const k of keys) {
    const v = qp(searchParams, k);
    if (v) query.set(k, v);
  }
  if (!query.get('limit')) query.set('limit', '24');

  const brand = qp(searchParams, 'brand');
  const model = qp(searchParams, 'model');

  const [catalog, brands, categories, models, facets] = await Promise.all([
    serverApiSoft<CatalogResult>(`/api/catalog/products?${query.toString()}`),
    serverApiSoft<Brand[]>('/api/catalog/brands'),
    serverApiSoft<Category[]>('/api/catalog/categories'),
    serverApiSoft<DeviceModel[]>(
      brand ? `/api/catalog/device-models?brand=${encodeURIComponent(brand)}` : '/api/catalog/device-models',
    ),
    serverApiSoft<Facets>(
      model ? `/api/catalog/facets?model=${encodeURIComponent(model)}` : '/api/catalog/facets',
    ),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <CatalogFilters
        brands={brands || []}
        categories={categories || []}
        models={models || []}
        facets={
          facets || {
            colors: [],
            materials: [],
            caseTypes: [],
            priceRange: { minMinor: 0, maxMinor: 0 },
          }
        }
      />
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary-ink">Shop</h1>
            <p className="text-sm text-muted">{catalog?.total ?? 0} products</p>
          </div>
        </div>
        <ProductGrid products={catalog?.items || []} />
        <Pagination page={catalog?.page || 1} totalPages={catalog?.totalPages || 1} />
      </div>
    </div>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  return (
    <div className="container-se py-10">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Spinner className="size-8" />
          </div>
        }
      >
        <CatalogBody searchParams={sp} />
      </Suspense>
    </div>
  );
}
