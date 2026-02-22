import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = req.headers.cookie
    ?.split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('foodie_access_token='))
    ?.split('=')
    .slice(1)
    .join('=');

  const token = bearerToken ?? cookieToken;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    req.user = verifyToken(decodeURIComponent(token));
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorizeRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

export const authenticate = authenticateToken;
export const authorizeAdmin = authorizeRole(Role.ADMIN);
