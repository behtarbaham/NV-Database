import { asyncHandler } from '../utils/errors.js';
import { backupDatabase, listBackups, restoreDatabase } from '../services/backupService.js';

export const createBackup = asyncHandler(async (_req, res) => {
  res.json({ ok: true, backup: backupDatabase() });
});

export const getBackups = asyncHandler(async (_req, res) => {
  res.json({ ok: true, backups: listBackups() });
});

export const restoreBackup = asyncHandler(async (req, res) => {
  res.json({ ok: true, restore: restoreDatabase(req.body?.backupPath) });
});
