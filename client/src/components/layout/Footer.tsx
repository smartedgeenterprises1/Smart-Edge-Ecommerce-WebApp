import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Facebook, Headphones, Instagram } from 'lucide-react';
import type { StoreSettings } from '@/types';
import { whatsappDigits, whatsappHref } from '@/lib/whatsapp';

const SUPPORT_PHONE = '03079036369';
const SUPPORT_PHONE_DISPLAY = '0307 9036369';

const quickLinks = [
  { href: '/search', label: 'Search' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/faq', label: 'Frequently Asked Questions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/returns', label: 'Return & Refund Policy' },
  { href: '/shipping', label: 'Shipping Policy' },
  { href: '/shop', label: 'Shop Covers' },
];

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function Footer({ settings }: { settings?: StoreSettings | null }) {
  const year = new Date().getFullYear();
  const phone = settings?.contactPhone?.trim() || SUPPORT_PHONE;
  const phoneDisplay = phone === SUPPORT_PHONE ? SUPPORT_PHONE_DISPLAY : phone;
  const email = settings?.contactEmail || 'smartedgeenterprises1@gmail.com';
  const waDigits = whatsappDigits(phone);
  const waHref = waDigits
    ? whatsappHref(waDigits, 'Hi SMART EDGE, I have a question about covers.')
    : '';
  const social = settings?.socialLinks;
  const facebook = social?.facebook || '';
  const instagram = social?.instagram || '';
  const whatsapp = social?.whatsapp || waHref;

  return (
    <footer className="mt-10 px-3 pb-3 sm:mt-14 sm:px-4 sm:pb-4">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-[#041820] text-white shadow-md sm:rounded-[2rem]">
        <div className="grid gap-10 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-3 lg:gap-12 lg:px-10">
          {/* Brand + support */}
          <div className="space-y-5">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="SMART EDGE"
                  width={44}
                  height={44}
                  className="size-11 rounded-xl object-contain"
                />
                <span className="font-display text-xl font-bold tracking-tight text-primary">
                  SMART EDGE
                </span>
              </Link>
              <p className="mt-2 text-sm font-medium text-white/70">
                {settings?.tagline || '#1 Premium Phone Cover Shop in Pakistan'}
              </p>
            </div>

            <div className="space-y-1 text-sm text-white/80">
              <p className="font-semibold text-white">Customer Support Helpline:</p>
              <a href={`mailto:${email}`} className="block transition hover:text-primary">
                {email}
              </a>
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="block transition hover:text-primary">
                {phoneDisplay}
              </a>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {facebook ? (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-primary hover:text-primary-ink"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
              ) : null}
              {instagram ? (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-primary hover:text-primary-ink"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              ) : null}
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#25D366] hover:text-white"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              ) : null}
            </div>
          </div>

          {/* About + CTA */}
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold text-white">About The Store</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                SMART EDGE ENTERPRISE is Pakistan&apos;s dedicated phone-cover store for Apple iPhone, Google
                Pixel, and Samsung Galaxy. Every case is listed by exact model so you get a precise fit —
                premium materials, cash on delivery, and delivery all across Pakistan.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary-ink/40 p-4">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/50 text-primary">
                <Headphones size={22} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-medium text-white/90">Got Question? Call us 24/7</p>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="mt-1 block font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl"
                >
                  {phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-lg font-bold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/75 transition hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p className="text-xs text-white/55">
            © {year} SMART EDGE ENTERPRISE. All rights reserved. Prices in PKR.
          </p>
          <a
            href="#top"
            className="inline-flex size-10 items-center justify-center self-end rounded-full bg-primary text-primary-ink transition hover:bg-primary-hover sm:self-auto"
            aria-label="Back to top"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}
