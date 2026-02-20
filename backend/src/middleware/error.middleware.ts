import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

export function notFound(req: Request, res: Response) {
  logger.warn('http.not_found', { method: req.method, path: req.originalUrl });
  return res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error('http.error', {
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    stack: err.stack
  });
  return res.status(500).json({ message: 'Internal server error' });
}
