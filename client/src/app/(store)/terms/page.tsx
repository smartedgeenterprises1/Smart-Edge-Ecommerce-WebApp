import { createPolicyPage, policyMetadata } from '@/components/features/policy-page';

export const metadata = policyMetadata('Terms', '/terms');

export default createPolicyPage(
  'Terms',
  '/terms',
  'terms',
  'By placing an order you agree to pay Cash on Delivery for the confirmed total. Product availability and pricing are subject to stock at checkout.',
);
