import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '',
  accessTokenTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshTokenTtl: process.env.JWT_REFRESH_TTL || '30d',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

if (!env.databaseUrl || !env.jwtSecret || !env.jwtRefreshSecret) {
  throw new Error('Missing required environment variables.');
}
