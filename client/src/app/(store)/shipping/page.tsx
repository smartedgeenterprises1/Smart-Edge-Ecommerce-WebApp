import { createPolicyPage, policyMetadata } from '@/components/features/policy-page';

export const metadata = policyMetadata('Shipping', '/shipping');

export default createPolicyPage(
  'Shipping',
  '/shipping',
  'shipping',
  'We ship across Pakistan. Standard shipping rates and free-shipping thresholds are shown at checkout. Delivery times vary by city.',
);
