import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { publicApiGet } from '@/lib/api';
import { ProductCard } from '@/components/catalog/ProductCard';
import type { Brand, DeviceModel, ProductListItem } from '@/types/store';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const brands = await publicApiGet<Brand[]>('/api/catalog/brands');
  const brand = brands.find((b: Brand) => b.slug === slug);
  if (!brand) return { title: 'Brand' };
  return {
    title: `${brand.name} ${brand.deviceFamilyLabel} covers`,
    description: brand.description || `Shop ${brand.name} ${brand.deviceFamilyLabel} phone covers in PKR.`,
    alternates: { canonical: `/brand/${slug}` },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [brands, models, products] = await Promise.all([
    publicApiGet<Brand[]>('/api/catalog/brands'),
    publicApiGet<DeviceModel[]>(`/api/catalog/device-models?brand=${slug}`),
    publicApiGet<{ items: ProductListItem[] }>(`/api/catalog/products?brand=${slug}&limit=12`),
  ]);
  const brand = brands.find((b: Brand) => b.slug === slug);
  if (!brand) notFound();

  return (
    <div className="container-se py-10">
      <h1 className="font-display text-4xl font-bold">
        {brand.name} <span className="text-primary-deep">{brand.deviceFamilyLabel}</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">{brand.description}</p>

      <h2 className="mt-10 font-display text-2xl font-bold">Choose your model</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m: DeviceModel) => (
          <Link key={m._id} href={`/model/${m.slug}`} className="card-quiet p-4 hover:shadow-[var(--shadow)]">
            {m.name}
          </Link>
        ))}
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold">Popular covers</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.items.map((p: ProductListItem) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
