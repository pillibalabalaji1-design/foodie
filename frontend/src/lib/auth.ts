export type SessionUser = {
  userId: number;
  role: 'ADMIN' | 'USER';
};

export function getSessionUserFromToken(token: string | null): SessionUser | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1])) as { userId: number; role: 'ADMIN' | 'USER' };
    if (!payload?.userId || !payload?.role) return null;
    return payload;
  } catch {
    return null;
  }
}
