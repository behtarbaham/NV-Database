import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { closeDb, getDb } from '../database/sqlite.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const assertBackupFile = (targetPath) => {
  if (typeof targetPath !== 'string') {
    throw new AppError('Invalid backup path', 400, 'INVALID_BACKUP_PATH');
  }
  const resolved = path.resolve(targetPath);
  return resolved;
};

const getBackupFileName = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `navand-${stamp}.sqlite`;
};

export const backupDatabase = (targetDir = config.backupDir) => {
  const backupDir = path.resolve(targetDir || config.backupDir);
  fs.mkdirSync(backupDir, { recursive: true });
  const stats = fs.statSync(backupDir);
  if (!stats.isDirectory()) {
    throw new AppError('Backup target must be a folder', 400, 'INVALID_BACKUP_TARGET');
  }
  getDb().pragma('wal_checkpoint(TRUNCATE)');
  const backupPath = path.join(backupDir, getBackupFileName());
  fs.copyFileSync(config.databasePath, backupPath);
  logger.info('Database backup created', { backupPath });
  return { backupPath };
};

export const restoreDatabase = (backupPath) => {
  const safeBackupPath = assertBackupFile(backupPath);
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

export const listDrives = () => {
  if (process.platform === 'win32') {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
      .map((letter) => `${letter}:\\`)
      .filter((drivePath) => fs.existsSync(drivePath))
      .map((drivePath) => ({ name: drivePath, path: drivePath, type: 'drive' }));
  }

  const home = process.env.HOME || process.env.USERPROFILE || '/';
  return [
    { name: '/', path: '/', type: 'drive' },
    { name: 'Home', path: home, type: 'drive' },
  ];
};

export const listDirectory = (targetPath) => {
  const currentPath = path.resolve(targetPath || process.cwd());
  const stats = fs.statSync(currentPath);
  if (!stats.isDirectory()) {
    throw new AppError('Path must be a folder', 400, 'INVALID_DIRECTORY');
  }

  const entries = fs.readdirSync(currentPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.name.toLowerCase().endsWith('.sqlite'))
    .map((entry) => {
      const entryPath = path.join(currentPath, entry.name);
      return {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'folder' : 'backup',
      };
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return {
    currentPath,
    parentPath: path.dirname(currentPath) === currentPath ? null : path.dirname(currentPath),
    entries,
  };
};
