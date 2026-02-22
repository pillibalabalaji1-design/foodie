'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  children: React.ReactNode;
  allowRoles?: Array<'ADMIN' | 'USER'>;
};

export default function AdminGuard({ children, allowRoles = ['ADMIN', 'USER'] }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      const res = await api.get('/api/auth/me');
      const session = res.data as { role?: 'ADMIN' | 'USER' };

      if (!active) return;

      if (!session?.role || !allowRoles.includes(session.role)) {
        router.replace('/admin/login');
        return;
      }

      setAllowed(true);
    };

    validateSession().catch(() => router.replace('/admin/login'));

    return () => {
      active = false;
    };
  }, [allowRoles, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
