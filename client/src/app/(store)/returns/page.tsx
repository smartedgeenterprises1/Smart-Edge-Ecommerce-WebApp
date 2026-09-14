import { createPolicyPage, policyMetadata } from '@/components/features/policy-page';

export const metadata = policyMetadata('Returns', '/returns');

export default createPolicyPage(
  'Returns',
  '/returns',
  'returns',
  'If your cover arrives damaged or incorrect, contact us promptly with your order number. Return eligibility depends on product condition and reason.',
);
