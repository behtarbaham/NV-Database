const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const __dirnamePath = __dirname;
let apiServer;
let runtimeModulesPromise;
let mainWindow;

const writeStartupLog = (message, details = {}) => {
  try {
    const dataDir = app.isReady()
      ? app.getPath('userData')
      : path.join(process.env.APPDATA || process.cwd(), 'navand-course-manager');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.appendFileSync(
      path.join(dataDir, 'startup.log'),
      `${JSON.stringify({ time: new Date().toISOString(), message, details })}\n`,
      'utf8'
    );
  } catch {
    // Startup logging must never prevent the app from opening.
  }
};

process.on('uncaughtException', (error) => {
  writeStartupLog('uncaughtException', { message: error.message, stack: error.stack });
});

process.on('unhandledRejection', (error) => {
  writeStartupLog('unhandledRejection', {
    message: error?.message || String(error),
    stack: error?.stack,
  });
});

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
    writeStartupLog('loading runtime modules');
    runtimeModulesPromise = Promise.all([
      import('../services/serverService.js'),
      import('../models/appDataModel.js'),
      import('../models/authModel.js'),
      import('../services/backupService.js'),
      import('../config/index.js'),
      import('../utils/logger.js'),
      import('../models/passwordRecoveryModel.js'),
    ]).then(([serverService, appDataModel, authModel, backupService, configModule, loggerModule, recoveryModel]) => ({
      createServer: serverService.createServer,
      readAppData: appDataModel.readAppData,
      saveAppData: appDataModel.saveAppData,
      loginUser: authModel.loginUser,
      createRecoveryCode: recoveryModel.createRecoveryCode,
      registerAccount: recoveryModel.registerAccount,
      resetPassword: recoveryModel.resetPassword,
      updateUserCredentials: authModel.updateUserCredentials,
      backupDatabase: backupService.backupDatabase,
      listBackups: backupService.listBackups,
      listDrives: backupService.listDrives,
      listDirectory: backupService.listDirectory,
      restoreDatabase: backupService.restoreDatabase,
      config: configModule.config,
      logger: loggerModule.logger,
    }));
  }
  return runtimeModulesPromise;
};

const createWindow = async (config) => {
  const isDev = config.nodeEnv !== 'production';
  writeStartupLog('creating browser window', { isDev, rootDir: config.rootDir });
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    title: config.appName,
    icon: path.join(config.rootDir, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirnamePath, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.on('closed', () => {
    writeStartupLog('browser window closed');
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    writeStartupLog('renderer failed to load', { errorCode, errorDescription, validatedURL });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    writeStartupLog('renderer process gone', details);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    writeStartupLog('renderer console', { level, message, line, sourceId });
  });

  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

  const contentSecurityPolicy = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:3001 http://127.0.0.1:3000 ws://127.0.0.1:3000"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:3001";

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [contentSecurityPolicy],
      },
    });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    await mainWindow.loadURL(config.frontendDevUrl);
  } else {
    await mainWindow.loadFile(path.join(config.rootDir, 'dist', 'index.html'));
  }
  writeStartupLog('window content loaded');
};

const registerIpc = ({ registerAccount, createRecoveryCode, resetPassword, readAppData, saveAppData, loginUser, updateUserCredentials, backupDatabase, listBackups, listDrives, listDirectory, restoreDatabase }) => {
  const recoveryHandler = (handler) => async (_event, input) => {
    try {
      return { ok: true, ...handler(input) };
    } catch (error) {
      return { ok: false, message: error.statusCode ? error.message : 'عملیات انجام نشد؛ برنامه را دوباره باز کنید.' };
    }
  };
  ipcMain.handle('auth:register', recoveryHandler((input) => ({ user: registerAccount(input) })));
  ipcMain.handle('auth:recovery-code', recoveryHandler(createRecoveryCode));
  ipcMain.handle('auth:reset-password', recoveryHandler(resetPassword));
  ipcMain.handle('auth:login', async (_event, credentials) => ({ ok: true, user: loginUser(credentials) }));
  ipcMain.handle('auth:updateCredentials', async (_event, input) => ({ ok: true, user: updateUserCredentials(input) }));
  ipcMain.handle('appData:get', async () => ({ data: readAppData(), updatedAt: new Date().toISOString() }));
  ipcMain.handle('appData:save', async (_event, data) => ({ ok: true, data: saveAppData(data) }));
  ipcMain.handle('backup:create', async (_event, targetDir) => ({ ok: true, backup: backupDatabase(targetDir) }));
  ipcMain.handle('backup:list', async () => ({ ok: true, backups: listBackups() }));
  ipcMain.handle('backup:drives', async () => ({ ok: true, drives: listDrives() }));
  ipcMain.handle('backup:browse', async (_event, targetPath) => ({ ok: true, directory: listDirectory(targetPath) }));
  ipcMain.handle('backup:restore', async (_event, backupPath) => ({ ok: true, restore: restoreDatabase(backupPath) }));
  ipcMain.handle('backup:choose-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'انتخاب محل ذخیره بکاپ',
    });
    return { canceled: result.canceled, path: result.filePaths[0] || null };
  });
  ipcMain.handle('backup:choose-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'انتخاب فایل بکاپ برای بازیابی',
      filters: [{ name: 'SQLite Backup', extensions: ['sqlite'] }],
    });
    return { canceled: result.canceled, path: result.filePaths[0] || null };
  });
};

app.whenReady().then(async () => {
  try {
    writeStartupLog('app ready', { packaged: app.isPackaged });
    configurePackagedRuntime();
    writeStartupLog('runtime configured', {
      databasePath: process.env.DATABASE_PATH,
      backupDir: process.env.BACKUP_DIR,
      logDir: process.env.LOG_DIR,
    });
    const modules = await loadRuntimeModules();
    writeStartupLog('runtime modules loaded');
    registerIpc(modules);
    writeStartupLog('ipc registered');
    if (!app.isPackaged) {
      apiServer = modules.createServer().listen(modules.config.port, modules.config.host, () => {
        modules.logger.info(`Internal API running at http://${modules.config.host}:${modules.config.port}`);
      });
      apiServer.on('error', (error) => {
        modules.logger.warn('Internal API could not start; continuing with Electron IPC', {
          code: error.code,
          message: error.message,
        });
      });
    } else {
      modules.createServer();
      modules.logger.info('Packaged app started with Electron IPC data access');
      writeStartupLog('packaged data services initialized');
    }
    await createWindow(modules.config);
  } catch (error) {
    writeStartupLog('startup failed', { message: error.message, stack: error.stack });
    dialog.showErrorBox('Navand Course Manager', error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (apiServer) apiServer.close();
});
