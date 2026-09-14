import { serverApiSoft } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import type { StoreSettings } from '@/types';
import { ContactForm } from '@/components/features/contact-form';

export const metadata = buildMetadata({
  title: 'Contact',
  path: '/contact',
});

export default async function ContactPage() {
  const settings = await serverApiSoft<StoreSettings>('/api/settings');
  return (
    <div className="container-se grid gap-10 py-10 lg:grid-cols-2">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-ink">Contact</h1>
        <p className="mt-2 text-muted">Questions about fit, shipping, or an order? Reach out.</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="font-semibold">Email</dt>
            <dd className="text-muted">{settings?.contactEmail || 'hello@smartedge.local'}</dd>
          </div>
          <div>
            <dt className="font-semibold">Phone / WhatsApp</dt>
            <dd className="text-muted">{settings?.contactPhone || '+92 300 0000000'}</dd>
          </div>
          <div>
            <dt className="font-semibold">Address</dt>
            <dd className="text-muted">{settings?.contactAddress || 'Pakistan'}</dd>
          </div>
        </dl>
      </div>
      <ContactForm />
    </div>
  );
}
