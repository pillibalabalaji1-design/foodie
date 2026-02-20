'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem('foodie_token');
    if (!token) {
      router.replace('/admin/login');
    }
  }, [router]);

  return <>{children}</>;
}
