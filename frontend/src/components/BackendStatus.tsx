'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSessionUserFromToken } from '@/lib/auth';
import { api } from '@/lib/api';

export default function BackendStatus() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = window.localStorage.getItem('foodie_token');
    const session = getSessionUserFromToken(token);

    if (session?.role !== 'ADMIN') {
      setShowStatus(false);
      return;
    }

    setShowStatus(true);

    let mounted = true;

    async function checkHealth() {
      try {
        const res = await api.get('/api/health');
        if (mounted) {
          setHealthy(res.data?.status === 'OK' && res.data?.database === 'connected');
        }
      } catch {
        if (mounted) setHealthy(false);
      }
    }

    checkHealth();
    const timer = setInterval(checkHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

  if (!showStatus) return null;

  const text = healthy ? 'Backend Healthy' : healthy === false ? 'Backend Disconnected' : 'Checking Backend';

  return (
    <span className="flex items-center gap-2 text-xs text-stone-700" aria-live="polite">
      <span>{healthy ? '🟢' : healthy === false ? '🔴' : '⚪'}</span>
      <span>{text}</span>
    </span>
  );
}
