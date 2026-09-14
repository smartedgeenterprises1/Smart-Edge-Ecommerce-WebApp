import { CheckoutForm } from '@/components/features/checkout-form';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Checkout',
  path: '/checkout',
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <div className="container-se py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-primary-ink">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
