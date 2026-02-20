'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionUserFromToken } from '@/lib/auth';

type Props = {
  children: React.ReactNode;
  allowRoles?: Array<'ADMIN' | 'USER'>;
};

export default function AdminGuard({ children, allowRoles = ['ADMIN', 'USER'] }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem('foodie_token');
    const session = getSessionUserFromToken(token);

    if (!session || !allowRoles.includes(session.role)) {
      router.replace('/admin/login');
      return;
    }

    setAllowed(true);
  }, [allowRoles, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
