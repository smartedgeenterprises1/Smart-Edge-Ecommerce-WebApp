import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp';
import { serverApiSoft } from '@/lib/api';
import type { StoreSettings } from '@/types';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await serverApiSoft<StoreSettings>('/api/settings');
  return (
    <div id="top" className="flex min-h-dvh max-w-[100vw] flex-col overflow-x-hidden">
      <Header
        announcement={
          settings?.announcement ||
          'Welcome to SMART EDGE ENTERPRISE, Buy covers for IPhone, Google Pixel, and Samsung Phones. Free Delivery on Orders Above 2499 Rs'
        }
      />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      <Footer settings={settings} />
      <FloatingWhatsApp phone={settings?.contactPhone || '03079036369'} />
    </div>
  );
}
