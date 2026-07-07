import { readAppData, saveAppData } from '../models/appDataModel.js';
import { asyncHandler } from '../utils/errors.js';

export const getHealth = asyncHandler(async (_req, res) => {
  res.json({ ok: true, database: 'sqlite-connected' });
});

export const getAppData = asyncHandler(async (_req, res) => {
  const data = readAppData();
  const hasData = Object.values(data).some((items) => items.length > 0);
  res.json({ data: hasData ? data : null, updatedAt: new Date().toISOString() });
});

export const putAppData = asyncHandler(async (req, res) => {
  const data = saveAppData(req.body);
  res.json({ ok: true, data });
});
