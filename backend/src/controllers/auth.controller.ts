import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
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
    console.warn(`[auth.login][${requestTag}] invalid payload`, {
      ip,
      bodyKeys: Object.keys(req.body ?? {})
    });
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const { email, password } = parse.data;

  try {
    console.info(`[auth.login][${requestTag}] login attempt`, { email, ip });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`[auth.login][${requestTag}] user not found`, { email, ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.warn(`[auth.login][${requestTag}] password mismatch`, { email, ip, userId: user.id });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user.id, user.role);
    console.info(`[auth.login][${requestTag}] login success`, { email, ip, userId: user.id, role: user.role });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(`[auth.login][${requestTag}] unexpected error`, {
      email,
      ip,
      error: error instanceof Error ? error.message : 'unknown_error'
    });
    return res.status(500).json({ message: 'Login failed, please try again' });
  }
}
