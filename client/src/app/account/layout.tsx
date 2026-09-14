import Link from 'next/link';
import Image from 'next/image';
import { AccountNav } from '@/components/features/account-nav';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'My account',
  noIndex: true,
});

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f8fcff_0%,#ffffff_30%)]">
      <header className="border-b border-border bg-white/90">
        <div className="container-se flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="" width={32} height={32} className="size-8 object-contain" />
            <span className="font-display font-bold text-primary-ink">SMART EDGE</span>
          </Link>
          <Link href="/shop" className="text-sm font-medium text-muted hover:text-primary-ink">
            Continue shopping
          </Link>
        </div>
      </header>
      <div className="container-se grid gap-8 py-8 lg:grid-cols-[14rem_1fr]">
        <AccountNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
