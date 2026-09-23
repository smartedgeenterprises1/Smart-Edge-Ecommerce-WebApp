import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductPurchase } from '@/components/features/product-purchase';
import { ProductGrid } from '@/components/features/product-card';
import { serverApi } from '@/lib/api';
import { breadcrumbJsonLd, buildMetadata, productJsonLd } from '@/lib/seo';
import type { ProductDetail, ProductListItem } from '@/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const data = await serverApi<{ product: ProductDetail }>(`/api/catalog/products/${slug}`);
    const p = data.product;
    return buildMetadata({
      title: p.seoTitle || p.title,
      description: p.seoDescription || p.description || undefined,
      path: `/product/${slug}`,
      image: p.images?.[0]?.url,
    });
  } catch {
    return buildMetadata({ title: 'Product', path: `/product/${slug}` });
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let data: { product: ProductDetail; related: ProductListItem[] };
  try {
    data = await serverApi(`/api/catalog/products/${slug}`);
  } catch {
    notFound();
  }
  const { product, related } = data;
  const crumbs = [
    { name: 'Shop', path: '/shop' },
    { name: product.title, path: `/product/${product.slug}` },
  ];

  return (
    <div className="container-se min-w-0 overflow-x-hidden py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <p className="mb-6 break-words text-sm text-muted">
        <Link href="/shop" className="hover:text-primary-ink">
          Shop
        </Link>{' '}
        / {product.title}
      </p>
      <ProductPurchase product={product} />
      {related?.length ? (
        <section className="mt-16 min-w-0">
          <h2 className="mb-6 font-display text-2xl font-bold">Related covers</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
