import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';

const frontendLogSchema = z.object({
  level: z.enum(['info', 'warn', 'error']).default('info'),
  event: z.string().min(2),
  payload: z.record(z.any()).optional()
});

const logsDir = path.resolve(process.cwd(), '..', 'logs');
const frontendLogPath = path.join(logsDir, 'frontend.log');

export async function createFrontendLog(req: Request, res: Response) {
  const parse = frontendLogSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level: parse.data.level,
    event: parse.data.event,
    payload: parse.data.payload ?? {}
  };

  fs.mkdirSync(logsDir, { recursive: true });
  fs.appendFileSync(frontendLogPath, `${JSON.stringify(entry)}\n`);

  logger.info('frontend.log.ingested', { event: parse.data.event, level: parse.data.level });
  return res.status(201).json({ status: 'logged' });
}

export async function readBackendLogs(_req: Request, res: Response) {
  const backendLogPath = path.join(logsDir, 'backend.log');
  if (!fs.existsSync(backendLogPath)) {
    return res.json({ logs: [] });
  }

  const lines = fs.readFileSync(backendLogPath, 'utf8').trim().split('\n').slice(-200);
  return res.json({ logs: lines });
}

export async function readFrontendLogs(_req: Request, res: Response) {
  if (!fs.existsSync(frontendLogPath)) {
    return res.json({ logs: [] });
  }

  const lines = fs.readFileSync(frontendLogPath, 'utf8').trim().split('\n').slice(-200);
  return res.json({ logs: lines });
}
