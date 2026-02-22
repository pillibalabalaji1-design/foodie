import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';

export function signToken(userId: number, role: Role): string {
  return jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.accessTokenTtl as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(userId: number, role: Role): string {
  return jwt.sign({ userId, role }, env.jwtRefreshSecret, { expiresIn: env.refreshTokenTtl as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): { userId: number; role: Role } {
  return jwt.verify(token, env.jwtSecret) as { userId: number; role: Role };
}

export function verifyRefreshToken(token: string): { userId: number; role: Role } {
  return jwt.verify(token, env.jwtRefreshSecret) as { userId: number; role: Role };
}
