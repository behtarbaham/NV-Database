import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

const ensureLogDir = () => {
  fs.mkdirSync(config.logDir, { recursive: true });
};

const writeLog = (level, message, meta) => {
  ensureLogDir();
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    meta: meta || null,
  };
  const line = `${JSON.stringify(entry)}\n`;
  fs.appendFileSync(path.join(config.logDir, 'app.log'), line, 'utf8');
  const output = meta ? [message, meta] : [message];
  if (level === 'error') console.error(...output);
  else if (level === 'warn') console.warn(...output);
  else console.log(...output);
};

export const logger = {
  info: (message, meta) => writeLog('info', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
};
