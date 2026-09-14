import { OrderConfirmation } from '@/components/features/order-confirmation';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Order confirmation',
  path: '/order-confirmation',
  noIndex: true,
});

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="container-se py-10">
      <OrderConfirmation orderNumber={sp.order} token={sp.token} />
    </div>
  );
}
