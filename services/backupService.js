import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { closeDb, getDb } from '../database/sqlite.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const assertInsideBackupDir = (targetPath) => {
  if (typeof targetPath !== 'string') {
    throw new AppError('Invalid backup path', 400, 'INVALID_BACKUP_PATH');
  }
  const backupRoot = path.resolve(config.backupDir);
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(backupRoot + path.sep)) {
    throw new AppError('Invalid backup path', 400, 'INVALID_BACKUP_PATH');
  }
  return resolved;
};

export const backupDatabase = () => {
  fs.mkdirSync(config.backupDir, { recursive: true });
  getDb().pragma('wal_checkpoint(TRUNCATE)');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(config.backupDir, `navand-${stamp}.sqlite`);
  fs.copyFileSync(config.databasePath, backupPath);
  logger.info('Database backup created', { backupPath });
  return { backupPath };
};

export const restoreDatabase = (backupPath) => {
  const safeBackupPath = assertInsideBackupDir(backupPath);
  if (!safeBackupPath.endsWith('.sqlite') || !fs.existsSync(safeBackupPath)) {
    throw new AppError('Backup file does not exist', 404, 'BACKUP_NOT_FOUND');
  }
  getDb().pragma('wal_checkpoint(TRUNCATE)');
  closeDb();
  fs.copyFileSync(safeBackupPath, config.databasePath);
  logger.warn('Database restored from backup', { backupPath: safeBackupPath });
  return { restoredFrom: safeBackupPath };
};

export const listBackups = () => {
  fs.mkdirSync(config.backupDir, { recursive: true });
  return fs.readdirSync(config.backupDir)
    .filter((file) => file.endsWith('.sqlite'))
    .map((file) => {
      const backupPath = path.join(config.backupDir, file);
      const stats = fs.statSync(backupPath);
      return { name: file, path: backupPath, size: stats.size, createdAt: stats.birthtime };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
};
