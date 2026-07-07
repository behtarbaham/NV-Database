const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const __dirnamePath = __dirname;
let apiServer;
let runtimeModulesPromise;

const configurePackagedRuntime = () => {
  if (!app.isPackaged) return;

  const dataDir = app.getPath('userData');
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_PATH = path.join(dataDir, 'database', 'navand_academy.sqlite');
  process.env.BACKUP_DIR = path.join(dataDir, 'database', 'backups');
  process.env.LOG_DIR = path.join(dataDir, 'logs');
};

const loadRuntimeModules = () => {
  if (!runtimeModulesPromise) {
    runtimeModulesPromise = Promise.all([
      import('../services/serverService.js'),
      import('../models/appDataModel.js'),
      import('../services/backupService.js'),
      import('../config/index.js'),
      import('../utils/logger.js'),
    ]).then(([serverService, appDataModel, backupService, configModule, loggerModule]) => ({
      createServer: serverService.createServer,
      readAppData: appDataModel.readAppData,
      saveAppData: appDataModel.saveAppData,
      backupDatabase: backupService.backupDatabase,
      listBackups: backupService.listBackups,
      restoreDatabase: backupService.restoreDatabase,
      config: configModule.config,
      logger: loggerModule.logger,
    }));
  }
  return runtimeModulesPromise;
};

const createWindow = async (config) => {
  const isDev = config.nodeEnv !== 'production';
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    title: config.appName,
    webPreferences: {
      preload: path.join(__dirnamePath, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

  const contentSecurityPolicy = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:3001 http://127.0.0.1:3000 ws://127.0.0.1:3000"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:3001";

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [contentSecurityPolicy],
      },
    });
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    await win.loadURL(config.frontendDevUrl);
  } else {
    await win.loadFile(path.join(config.rootDir, 'dist', 'index.html'));
  }
};

const registerIpc = ({ readAppData, saveAppData, backupDatabase, listBackups, restoreDatabase }) => {
  ipcMain.handle('appData:get', async () => ({ data: readAppData(), updatedAt: new Date().toISOString() }));
  ipcMain.handle('appData:save', async (_event, data) => ({ ok: true, data: saveAppData(data) }));
  ipcMain.handle('backup:create', async () => ({ ok: true, backup: backupDatabase() }));
  ipcMain.handle('backup:list', async () => ({ ok: true, backups: listBackups() }));
  ipcMain.handle('backup:restore', async (_event, backupPath) => ({ ok: true, restore: restoreDatabase(backupPath) }));
};

app.whenReady().then(async () => {
  configurePackagedRuntime();
  const modules = await loadRuntimeModules();
  registerIpc(modules);
  apiServer = modules.createServer().listen(modules.config.port, modules.config.host, () => {
    modules.logger.info(`Internal API running at http://${modules.config.host}:${modules.config.port}`);
  });
  await createWindow(modules.config);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (apiServer) apiServer.close();
});
