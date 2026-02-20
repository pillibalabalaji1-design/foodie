'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function BackendStatus() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
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
  }, []);

  const text = healthy ? 'Backend Healthy' : healthy === false ? 'Backend Disconnected' : 'Checking Backend';

  return (
    <span className="flex items-center gap-2 text-xs text-stone-700" aria-live="polite">
      <span>{healthy ? '🟢' : healthy === false ? '🔴' : '⚪'}</span>
      <span>{text}</span>
    </span>
  );
}
