import { api } from './api';

export async function logFrontend(level: 'info' | 'warn' | 'error', event: string, payload?: Record<string, unknown>) {
  try {
    await api.post('/api/logs', { level, event, payload });
  } catch {
    // avoid breaking user flows for logging failures
  }
}
