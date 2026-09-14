import { createPolicyPage, policyMetadata } from '@/components/features/policy-page';

export const metadata = policyMetadata('FAQ', '/faq');

export default createPolicyPage(
  'FAQ',
  '/faq',
  'faq',
  'Q: Do you offer COD?\nA: Yes, Cash on Delivery is our payment method.\n\nQ: How do I pick the right cover?\nA: Choose your phone brand, then exact model — we only list compatible variants.',
);
