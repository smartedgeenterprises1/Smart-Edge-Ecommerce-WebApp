import { Suspense } from 'react';
import { LoginForm } from '@/components/features/auth-forms';
import { Spinner } from '@/components/ui/misc';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Sign in', path: '/login', noIndex: true });

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner className="size-8" />}>
      <LoginForm />
    </Suspense>
  );
}
