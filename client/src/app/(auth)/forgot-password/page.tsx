import { ForgotPasswordForm } from '@/components/features/auth-forms';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Forgot password',
  path: '/forgot-password',
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
