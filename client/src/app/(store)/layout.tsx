import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { serverApiSoft } from '@/lib/api';
import type { StoreSettings } from '@/types';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await serverApiSoft<StoreSettings>('/api/settings');
  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        announcement={
          settings?.announcement ||
          'Welcome to SMART EDGE ENTERPRISE, Buy covers for IPhone, Google Pixel, and Samsung Phones. Free Delivery on Orders Above 2499 Rs'
        }
      />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
