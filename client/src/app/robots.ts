import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/account', '/admin', '/login', '/register', '/forgot-password', '/reset-password', '/search'],
      },
    ],
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
