import type { Metadata } from 'next';
import { config } from './config';

export function buildMetadata(opts: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
}): Metadata {
  const title = opts.title
    ? `${opts.title} | ${config.storeName}`
    : `${config.storeName} — Premium phone covers in Pakistan`;
  const description =
    opts.description ||
    'Shop premium mobile phone covers for Apple iPhone, Google Pixel, and Samsung Galaxy in Pakistan. Cash on delivery.';
  const url = `${config.siteUrl}${opts.path || ''}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: config.storeName,
      locale: 'en_PK',
      type: 'website',
      images: opts.image ? [{ url: opts.image }] : [{ url: `${config.siteUrl}/logo.jpg` }],
    },
  };
}

export function productJsonLd(product: {
  title: string;
  description?: string;
  slug: string;
  images?: { url: string }[];
  minPriceMinor?: number;
  basePriceMinor: number;
  inStock?: boolean;
}) {
  const price = ((product.minPriceMinor ?? product.basePriceMinor) / 100).toFixed(2);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || product.title,
    image: (product.images || []).map((i) =>
      i.url.startsWith('http') ? i.url : `${config.publicApiUrl}${i.url}`,
    ),
    sku: product.slug,
    brand: { '@type': 'Brand', name: config.storeName },
    offers: {
      '@type': 'Offer',
      url: `${config.siteUrl}/product/${product.slug}`,
      priceCurrency: 'PKR',
      price,
      availability: product.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${config.siteUrl}${item.path}`,
    })),
  };
}
