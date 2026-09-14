import { AdminShell } from '@/components/admin/admin-shell';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Admin',
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
