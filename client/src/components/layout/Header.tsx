'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { cn } from '@/lib/cn';

const categoryBrands = [
  { href: '/brand/apple', label: 'Apple', slug: 'apple' },
  { href: '/brand/google', label: 'Google', slug: 'google' },
  { href: '/brand/samsung', label: 'Samsung', slug: 'samsung' },
];

const ANNOUNCEMENT_LINES = [
  'Welcome to SMART EDGE ENTERPRISE, Buy covers for IPhone, Google Pixel, and Samsung Phones.',
  'Free Delivery on Orders Above 2499 Rs',
] as const;

const TYPE_MS = 38;
const ERASE_MS = 22;
const HOLD_MS = 4500;

function AnnouncementBar() {
  const [lineIndex, setLineIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'erasing'>('typing');

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setDisplay(ANNOUNCEMENT_LINES[lineIndex]);
      const id = setInterval(() => {
        setLineIndex((i) => (i + 1) % ANNOUNCEMENT_LINES.length);
      }, HOLD_MS);
      return () => clearInterval(id);
    }

    const full = ANNOUNCEMENT_LINES[lineIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (display.length < full.length) {
        timer = setTimeout(() => setDisplay(full.slice(0, display.length + 1)), TYPE_MS);
      } else {
        setPhase('holding');
      }
    } else if (phase === 'holding') {
      timer = setTimeout(() => setPhase('erasing'), HOLD_MS);
    } else if (phase === 'erasing') {
      if (display.length > 0) {
        timer = setTimeout(() => setDisplay(display.slice(0, -1)), ERASE_MS);
      } else {
        setLineIndex((i) => (i + 1) % ANNOUNCEMENT_LINES.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [display, phase, lineIndex]);

  // When reduced-motion lineIndex changes, sync display
  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) setDisplay(ANNOUNCEMENT_LINES[lineIndex]);
  }, [lineIndex]);

  return (
    <div className="announcement-bar bg-primary-ink" role="status" aria-live="polite">
      <p className="announcement-glow">
        <span>{display}</span>
        <span className="announcement-caret" aria-hidden="true" />
      </p>
    </div>
  );
}

export function Header({ announcement: _announcement }: { announcement?: string; brands?: unknown[] }) {
  const { count } = useCart();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [q, setQ] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const catsRef = useRef<HTMLDivElement>(null);
  const catsMenuId = useId();

  useEffect(() => {
    setMobileOpen(false);
    setCatsOpen(false);
    setMobileCatsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!catsRef.current?.contains(e.target as Node)) setCatsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setCatsOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  }

  const navLinkClass =
    'inline-flex items-center gap-1 px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-foreground transition hover:text-primary-deep';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <AnnouncementBar />

      {/* Row 1: logo · search · icons */}
      <div className="border-b border-border/70">
        <div className="flex w-full items-center gap-1 py-3 pl-0 pr-2 md:gap-3 md:py-4 md:pr-4">
          <button
            type="button"
            className="hidden size-10 shrink-0 items-center justify-center rounded-full text-foreground max-md:inline-flex max-md:pl-2"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 pl-2 sm:gap-2 sm:pl-3 md:pl-4"
            aria-label="SMART EDGE ENTERPRISE home"
          >
            <Image
              src="/logo.jpg"
              alt="SMART EDGE ENTERPRISE"
              width={44}
              height={44}
              className="size-10 object-contain sm:size-11"
              priority
            />
            <span className="font-display text-lg font-bold tracking-tight text-primary-ink sm:text-xl">
              SMART EDGE ENTERPRISE
            </span>
          </Link>

          <form
            onSubmit={onSearch}
            className="mx-auto hidden min-w-0 max-w-2xl flex-1 md:flex"
            role="search"
          >
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <div className="flex w-full overflow-hidden rounded-full border border-border bg-white shadow-sm focus-within:border-primary-deep focus-within:ring-2 focus-within:ring-primary/40">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  id="header-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search Model i.e 14 Pro Max, Pixel, Galaxy…"
                  className="h-11 w-full border-0 bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-muted"
                />
              </div>
              <button
                type="submit"
                className="h-11 shrink-0 bg-primary px-5 text-sm font-semibold text-primary-ink transition hover:bg-primary-hover"
              >
                Search
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1 md:ml-0">
            <Link
              href={user ? '/account' : '/login'}
              className="btn btn-ghost p-2.5"
              aria-label={user ? 'Account' : 'Sign in'}
            >
              <User size={22} strokeWidth={1.75} />
            </Link>
            <Link href="/account/wishlist" className="btn btn-ghost relative p-2.5" aria-label="Wishlist">
              <Heart size={22} strokeWidth={1.75} />
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-ink">
                0
              </span>
            </Link>
            <Link href="/cart" className="btn btn-ghost relative p-2.5" aria-label={`Cart, ${count} items`}>
              <ShoppingBag size={22} strokeWidth={1.75} />
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-ink">
                {count > 9 ? '9+' : count}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: primary nav */}
      <nav className="hidden border-b border-border/50 bg-white md:block" aria-label="Primary">
        <div className="container-se flex flex-wrap items-center justify-center gap-1 py-1 xl:gap-2">
          <Link href="/" className={cn(navLinkClass, pathname === '/' && 'text-primary-deep')}>
            Home
          </Link>
          <Link
            href="/shop"
            className={cn(navLinkClass, pathname.startsWith('/shop') && 'text-primary-deep')}
          >
            Shop all
          </Link>

          <div className="relative" ref={catsRef}>
            <button
              type="button"
              className={cn(
                navLinkClass,
                (catsOpen || pathname.startsWith('/brand') || pathname.startsWith('/category')) &&
                  'text-primary-deep',
              )}
              aria-expanded={catsOpen}
              aria-haspopup="menu"
              aria-controls={catsMenuId}
              onClick={() => setCatsOpen((v) => !v)}
            >
              Categories
              <ChevronDown
                size={14}
                className={cn('transition-transform', catsOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
            {catsOpen ? (
              <div
                id={catsMenuId}
                role="menu"
                className="absolute left-1/2 top-full z-50 mt-1 min-w-[11rem] -translate-x-1/2 rounded-xl border border-border bg-white py-2 shadow-md"
              >
                {categoryBrands.map((b) => (
                  <Link
                    key={b.href}
                    href={b.href}
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary-soft hover:text-primary-ink"
                    onClick={() => setCatsOpen(false)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/brands/${b.slug}.svg`}
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                    {b.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href="/about"
            className={cn(navLinkClass, pathname.startsWith('/about') && 'text-primary-deep')}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={cn(navLinkClass, pathname.startsWith('/contact') && 'text-primary-deep')}
          >
            Contact
          </Link>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 top-[57px] z-40 bg-white md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="container-se flex h-full flex-col gap-5 overflow-y-auto py-5 pb-24">
            <form onSubmit={onSearch} className="flex gap-2" role="search">
              <label htmlFor="mobile-search" className="sr-only">
                Search products
              </label>
              <input
                id="mobile-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search Model i.e 14 Pro Max…"
                className="input"
              />
              <button type="submit" className="btn btn-primary shrink-0 px-4">
                Search
              </button>
            </form>

            <nav className="flex flex-col" aria-label="Mobile">
              <Link
                href="/"
                className="border-b border-border px-1 py-3.5 text-sm font-semibold uppercase tracking-wide"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="border-b border-border px-1 py-3.5 text-sm font-semibold uppercase tracking-wide"
                onClick={() => setMobileOpen(false)}
              >
                Shop all
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between border-b border-border px-1 py-3.5 text-left text-sm font-semibold uppercase tracking-wide"
                aria-expanded={mobileCatsOpen}
                onClick={() => setMobileCatsOpen((v) => !v)}
              >
                Categories
                <ChevronDown
                  size={16}
                  className={cn('transition-transform', mobileCatsOpen && 'rotate-180')}
                />
              </button>
              {mobileCatsOpen ? (
                <div className="border-b border-border bg-primary-soft/40 py-1">
                  {categoryBrands.map((b) => (
                    <Link
                      key={b.href}
                      href={b.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/brands/${b.slug}.svg`}
                        alt=""
                        className="h-6 w-6 object-contain"
                      />
                      {b.label}
                    </Link>
                  ))}
                </div>
              ) : null}
              <Link
                href="/about"
                className="border-b border-border px-1 py-3.5 text-sm font-semibold uppercase tracking-wide"
                onClick={() => setMobileOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="border-b border-border px-1 py-3.5 text-sm font-semibold uppercase tracking-wide"
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
