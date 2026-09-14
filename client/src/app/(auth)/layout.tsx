import Image from 'next/image';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Account',
  noIndex: true,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(180deg,#e8f7ff_0%,#ffffff_40%)]">
      <header className="container-se flex items-center gap-2 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="SMART EDGE"
            width={36}
            height={36}
            className="size-9 object-contain"
          />
          <span className="font-display text-lg font-bold text-primary-ink">SMART EDGE</span>
        </Link>
      </header>
      <main className="container-se flex flex-1 items-start justify-center pb-16 pt-4">{children}</main>
    </div>
  );
}
