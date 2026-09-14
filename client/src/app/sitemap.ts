import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';
import { serverApiSoft } from '@/lib/api';
import type { Brand, Category, DeviceModel, CatalogResult } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/shop', '/about', '/contact', '/faq', '/shipping', '/returns', '/privacy', '/terms'].map(
    (path) => ({
      url: `${config.siteUrl}${path || '/'}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.6,
    }),
  );

  const [brands, models, categories, products] = await Promise.all([
    serverApiSoft<Brand[]>('/api/catalog/brands'),
    serverApiSoft<DeviceModel[]>('/api/catalog/device-models'),
    serverApiSoft<Category[]>('/api/catalog/categories'),
    serverApiSoft<CatalogResult>('/api/catalog/products?limit=48'),
  ]);

  return [
    ...staticRoutes,
    ...(brands ?? []).map((b) => ({
      url: `${config.siteUrl}/brand/${b.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(models ?? []).map((m) => ({
      url: `${config.siteUrl}/model/${m.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(categories ?? []).map((c) => ({
      url: `${config.siteUrl}/category/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...(products?.items ?? []).map((p) => ({
      url: `${config.siteUrl}/product/${p.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
  ];
}
