import fs from 'fs';
import path from 'path';

type Level = 'info' | 'warn' | 'error';

const logsDir = path.resolve(process.cwd(), '..', 'logs');
const backendLogPath = path.join(logsDir, 'backend.log');
fs.mkdirSync(logsDir, { recursive: true });

function write(level: Level, event: string, payload: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    payload
  };

  fs.appendFileSync(backendLogPath, `${JSON.stringify(entry)}\n`);

  if (level === 'error') {
    console.error(event, payload);
  } else if (level === 'warn') {
    console.warn(event, payload);
  } else {
    console.info(event, payload);
  }
}

export const logger = {
  info: (event: string, payload?: Record<string, unknown>) => write('info', event, payload),
  warn: (event: string, payload?: Record<string, unknown>) => write('warn', event, payload),
  error: (event: string, payload?: Record<string, unknown>) => write('error', event, payload)
};
