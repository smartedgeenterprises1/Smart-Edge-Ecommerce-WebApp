import { RegisterForm } from '@/components/features/auth-forms';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({ title: 'Register', path: '/register', noIndex: true });

export default function RegisterPage() {
  return <RegisterForm />;
}
