import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

const startedAt = Date.now();

export async function getHealth(_req: Request, res: Response) {
  let database = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'disconnected';
  }

  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

  return res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'OK' : 'DEGRADED',
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
    database
  });
}
