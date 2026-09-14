import { createPolicyPage, policyMetadata } from '@/components/features/policy-page';

export const metadata = policyMetadata('About', '/about');

export default createPolicyPage(
  'About',
  '/about',
  'about',
  'SMART EDGE is a Pakistan-based store for premium mobile phone covers. We focus on precise device fit, durable materials, and cash-on-delivery convenience.',
);
