import Link from 'next/link';
import { ProductGrid } from '@/components/features/product-card';
import { serverApiSoft } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { CatalogResult, DeviceModel } from '@/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const models = await serverApiSoft<DeviceModel[]>('/api/catalog/device-models');
  const model = models?.find((m) => m.slug === slug);
  return buildMetadata({
    title: model ? `Covers for ${model.name}` : 'Model',
    path: `/model/${slug}`,
  });
}

export default async function ModelPage({ params }: Props) {
  const { slug } = await params;
  const [models, catalog] = await Promise.all([
    serverApiSoft<DeviceModel[]>('/api/catalog/device-models'),
    serverApiSoft<CatalogResult>(`/api/catalog/products?model=${encodeURIComponent(slug)}&limit=24`),
  ]);
  const model = models?.find((m) => m.slug === slug);
  const brand = model && typeof model.brandId === 'object' ? model.brandId : null;

  return (
    <div className="container-se py-10">
      <p className="text-sm text-muted">
        <Link href="/shop" className="hover:text-primary-ink">Shop</Link>
        {brand && 'slug' in brand ? (
          <>
            {' / '}
            <Link href={`/brand/${brand.slug}`} className="hover:text-primary-ink">{brand.name}</Link>
          </>
        ) : null}
        {' / '}
        {model?.name || slug}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-primary-ink">
        Covers for {model?.name || slug}
      </h1>
      <div className="mt-8">
        <ProductGrid products={catalog?.items || []} />
      </div>
    </div>
  );
}
