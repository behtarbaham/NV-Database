import express from 'express';
import cors from 'cors';
import { config } from '../config/index.js';
import { initializeDatabase } from '../database/sqlite.js';
import { getHealth, getAppData, putAppData } from '../controllers/appDataController.js';
import { createBackup, getBackups, restoreBackup } from '../controllers/backupController.js';
import { errorHandler } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const createServer = () => {
  initializeDatabase();
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: [config.frontendDevUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'] }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', getHealth);
  app.get('/api/app-data', getAppData);
  app.put('/api/app-data', putAppData);
  app.get('/api/backups', getBackups);
  app.post('/api/backups', createBackup);
  app.post('/api/restore', restoreBackup);

  app.use(errorHandler);
  return app;
};

export const startServer = () => {
  const app = createServer();
  const server = app.listen(config.port, config.host, () => {
    logger.info(`Backend API running at http://${config.host}:${config.port}`);
  });
  return server;
};
