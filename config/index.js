import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const resolveFromRoot = (value, fallback) => {
  const target = value || fallback;
  return path.isAbsolute(target) ? target : path.resolve(rootDir, target);
};

export const config = {
  rootDir,
  appName: process.env.APP_NAME || 'Navand Course Manager',
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT) || 3001,
  databasePath: resolveFromRoot(process.env.DATABASE_PATH, './database/navand_academy.sqlite'),
  backupDir: resolveFromRoot(process.env.BACKUP_DIR, './database/backups'),
  logDir: resolveFromRoot(process.env.LOG_DIR, './logs'),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  frontendDevUrl: process.env.FRONTEND_DEV_URL || 'http://127.0.0.1:3000',
};
