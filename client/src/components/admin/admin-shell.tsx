'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Users,
  Ticket,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/misc';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?next=/admin');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/account');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium',
              active ? 'bg-primary-soft text-primary-ink' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <Icon size={18} />
            {l.label}
          </Link>
        );
      })}
      <button
        type="button"
        className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50"
        onClick={async () => {
          await logout();
          router.push('/');
        }}
      >
        <LogOut size={18} />
        Sign out
      </button>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-white px-4 lg:hidden">
        <button type="button" className="btn btn-ghost p-2" aria-label="Menu" onClick={() => setOpen(true)}>
          <Menu size={20} />
        </button>
        <Link href="/admin" className="flex items-center gap-2 font-display font-bold text-primary-ink">
          <Image src="/logo.jpg" alt="" width={28} height={28} className="size-7 object-contain" />
          Admin
        </Link>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-md">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-display font-bold">Menu</span>
              <button type="button" className="btn btn-ghost p-2" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-border bg-white lg:block">
          <div className="flex items-center gap-2 border-b border-border px-4 py-4">
            <Image src="/logo.jpg" alt="" width={32} height={32} className="size-8 object-contain" />
            <div>
              <p className="font-display text-sm font-bold text-primary-ink">SMART EDGE</p>
              <p className="text-xs text-muted">Admin</p>
            </div>
          </div>
          {nav}
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
