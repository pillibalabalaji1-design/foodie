import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';

export function signToken(userId: number, role: Role): string {
  return jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: '12h' });
}

export function verifyToken(token: string): { userId: number; role: Role } {
  return jwt.verify(token, env.jwtSecret) as { userId: number; role: Role };
}
