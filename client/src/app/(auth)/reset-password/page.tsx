import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/features/auth-forms';
import { Spinner } from '@/components/ui/misc';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Reset password',
  path: '/reset-password',
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner className="size-8" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
