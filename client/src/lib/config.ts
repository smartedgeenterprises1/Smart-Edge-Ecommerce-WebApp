export const config = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || 'SMART EDGE',
  apiUrl:
    (typeof window === 'undefined'
      ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
      : process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000',
  publicApiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'PKR',
  country: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'PK',
} as const;

export function mediaUrl(path?: string | null): string {
  if (!path) return '/logo.jpg';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = config.publicApiUrl.replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
