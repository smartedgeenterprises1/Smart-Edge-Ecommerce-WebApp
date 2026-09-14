'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/account', label: 'Profile', exact: true },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

export function AccountNav() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/account');
  }, [loading, user, router]);

  return (
    <aside className="h-fit rounded-2xl border border-border bg-white p-3">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Account</p>
      <nav className="flex flex-col gap-1">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium',
                active ? 'bg-primary-soft text-primary-ink' : 'text-muted hover:bg-muted-bg',
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <Button
        variant="ghost"
        className="mt-3 w-full justify-start"
        onClick={async () => {
          await logout();
          router.push('/');
        }}
      >
        Sign out
      </Button>
    </aside>
  );
}
