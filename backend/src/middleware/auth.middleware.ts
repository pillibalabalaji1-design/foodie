import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authorizeAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== Role.ADMIN) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
}
