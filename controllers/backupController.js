import { asyncHandler } from '../utils/errors.js';
import {
  backupDatabase,
  listBackups,
  listDirectory,
  listDrives,
  restoreDatabase,
} from '../services/backupService.js';

export const createBackup = asyncHandler(async (req, res) => {
  res.json({ ok: true, backup: backupDatabase(req.body?.targetDir) });
});

export const getBackups = asyncHandler(async (_req, res) => {
  res.json({ ok: true, backups: listBackups() });
});

export const restoreBackup = asyncHandler(async (req, res) => {
  res.json({ ok: true, restore: restoreDatabase(req.body?.backupPath) });
});

export const getBackupDrives = asyncHandler(async (_req, res) => {
  res.json({ ok: true, drives: listDrives() });
});

export const browseBackupDirectory = asyncHandler(async (req, res) => {
  res.json({ ok: true, directory: listDirectory(req.body?.path) });
});
