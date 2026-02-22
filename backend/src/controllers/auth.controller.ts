import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { signRefreshToken, signToken, verifyRefreshToken } from '../utils/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function buildRequestTag() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readCookie(req: Request, cookieName: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${cookieName}=`));

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const baseCookie = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax' as const,
    domain: env.cookieDomain,
    path: '/'
  };

  res.cookie('foodie_access_token', accessToken, { ...baseCookie, maxAge: 1000 * 60 * 15 });
  res.cookie('foodie_refresh_token', refreshToken, { ...baseCookie, maxAge: 1000 * 60 * 60 * 24 * 30 });
}

export async function login(req: Request, res: Response) {
  const requestTag = buildRequestTag();
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';

  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    logger.warn('auth.login.invalid_payload', { requestTag, ip, bodyKeys: Object.keys(req.body ?? {}) });
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const email = parse.data.email.toLowerCase().trim();
  const { password } = parse.data;

  try {
    logger.info('auth.login.attempt', { requestTag, email, ip });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn('auth.login.user_not_found', { requestTag, email, ip });
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn('auth.login.password_mismatch', { requestTag, email, ip, userId: user.id });
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    logger.info('auth.login.success', { requestTag, email, ip, userId: user.id, role: user.role });

    setAuthCookies(res, token, refreshToken);

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.error('auth.login.error', {
      requestTag,
      email,
      ip,
      error: error instanceof Error ? error.message : 'unknown_error'
    });
    return res.status(500).json({ message: 'Login failed, please try again' });
  }
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = readCookie(req, 'foodie_refresh_token');
  if (!refreshToken) {
    return res.status(401).json({ message: 'Missing refresh token' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const nextAccess = signToken(user.id, user.role);
    const nextRefresh = signRefreshToken(user.id, user.role);
    setAuthCookies(res, nextAccess, nextRefresh);

    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logout(_req: Request, res: Response) {
  const baseCookie = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax' as const,
    domain: env.cookieDomain,
    path: '/'
  };

  res.clearCookie('foodie_access_token', baseCookie);
  res.clearCookie('foodie_refresh_token', baseCookie);
  return res.status(204).send();
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json(user);
}
