import Image from 'next/image';
import { cn } from '@/lib/cn';
import { mediaUrl } from '@/lib/config';

const FALLBACK_LOGOS: Record<string, string> = {
  apple: '/brands/apple.svg',
  google: '/brands/google.svg',
  samsung: '/brands/samsung.svg',
};

export function brandLogoSrc(slug?: string, logoUrl?: string | null) {
  if (logoUrl) {
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
    // Next.js public assets (e.g. /brands/apple.svg)
    if (logoUrl.startsWith('/') && !logoUrl.includes('/uploads/')) return logoUrl;
    return mediaUrl(logoUrl);
  }
  if (slug && FALLBACK_LOGOS[slug]) return FALLBACK_LOGOS[slug];
  return null;
}

export function BrandLogo({
  slug,
  name,
  logoUrl,
  className,
}: {
  slug?: string;
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const src = brandLogoSrc(slug, logoUrl);
  if (!src) {
    return <span className={cn('font-display text-lg font-bold text-primary-ink', className)}>{name}</span>;
  }

  return (
    <Image
      src={src}
      alt={`${name} logo`}
      width={140}
      height={56}
      className={cn('mx-auto h-12 w-auto object-contain sm:h-14', className)}
      unoptimized
    />
  );
}
