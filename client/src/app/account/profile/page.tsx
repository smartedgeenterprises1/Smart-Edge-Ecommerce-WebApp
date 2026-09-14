'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Profile lives at /account — keep this path for deep links. */
export default function ProfileRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/account');
  }, [router]);
  return null;
}
