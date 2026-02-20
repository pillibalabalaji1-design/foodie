import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { signToken } from '../utils/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function buildRequestTag() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    logger.info('auth.login.success', { requestTag, email, ip, userId: user.id, role: user.role });

    return res.json({
      token,
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
