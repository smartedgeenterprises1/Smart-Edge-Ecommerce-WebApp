import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/features/product-card';
import { serverApiSoft } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { CatalogResult, Category } from '@/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cats = await serverApiSoft<Category[]>('/api/catalog/categories');
  const cat = cats?.find((c) => c.slug === slug);
  return buildMetadata({ title: cat?.name || 'Category', path: `/category/${slug}` });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [cats, catalog] = await Promise.all([
    serverApiSoft<Category[]>('/api/catalog/categories'),
    serverApiSoft<CatalogResult>(`/api/catalog/products?category=${encodeURIComponent(slug)}&limit=24`),
  ]);
  const cat = cats?.find((c) => c.slug === slug);
  if (!cat) notFound();
  return (
    <div className="container-se py-10">
      <p className="text-sm text-muted">
        <Link href="/shop" className="hover:text-primary-ink">
          Shop
        </Link>{' '}
        / {cat.name}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-primary-ink">{cat.name}</h1>
      {cat.description ? <p className="mt-2 text-muted">{cat.description}</p> : null}
      <div className="mt-8">
        <ProductGrid products={catalog?.items || []} />
      </div>
    </div>
  );
}
