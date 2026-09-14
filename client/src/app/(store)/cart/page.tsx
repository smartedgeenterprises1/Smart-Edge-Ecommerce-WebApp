import { CartView } from '@/components/features/cart-view';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Cart',
  path: '/cart',
  noIndex: true,
});

export default function CartPage() {
  return (
    <div className="container-se py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-primary-ink">Your cart</h1>
      <CartView />
    </div>
  );
}
