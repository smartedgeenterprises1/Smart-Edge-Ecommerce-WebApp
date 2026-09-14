import Link from 'next/link';
import Image from 'next/image';
import type { StoreSettings } from '@/types';

const links = [
  {
    title: 'Shop',
    items: [
      { href: '/shop', label: 'All covers' },
      { href: '/shop?sort=newest', label: 'New arrivals' },
      { href: '/shop?featured=true', label: 'Featured' },
      { href: '/search', label: 'Search' },
    ],
  },
  {
    title: 'Help',
    items: [
      { href: '/shipping', label: 'Shipping' },
      { href: '/returns', label: 'Returns' },
      { href: '/faq', label: 'FAQ' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Company',
    items: [
      { href: '/about', label: 'About' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/account', label: 'My account' },
    ],
  },
];

export function Footer({ settings }: { settings?: StoreSettings | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="container-se grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="" width={36} height={36} className="size-9 object-contain" />
            <span className="font-display text-lg font-bold text-primary-ink">SMART EDGE ENTERPRISE</span>
          </div>
          <p className="text-sm text-muted">
            {settings?.tagline || 'Premium covers for the phones you use — made for Pakistan.'}
          </p>
          <div className="space-y-1 text-sm text-muted">
            {settings?.contactEmail ? <p>{settings.contactEmail}</p> : null}
            {settings?.contactPhone ? <p>{settings.contactPhone}</p> : null}
            {settings?.contactAddress ? <p>{settings.contactAddress}</p> : null}
          </div>
        </div>
        {links.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">{col.title}</h3>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted hover:text-primary-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-se flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} SMART EDGE ENTERPRISE. All rights reserved. Prices in PKR.</p>
          <p>Cash on delivery available across Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
