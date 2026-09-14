import { createPolicyPage, policyMetadata } from '@/components/features/policy-page';

export const metadata = policyMetadata('Privacy', '/privacy');

export default createPolicyPage(
  'Privacy',
  '/privacy',
  'privacy',
  'We collect contact and shipping details to fulfill orders. We do not sell personal data. Session cookies keep you signed in securely.',
);
