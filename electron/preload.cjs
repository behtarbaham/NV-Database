const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('navandApi', {
  registerAccount: (input) => invoke('auth:register', input),
  createRecoveryCode: (input) => invoke('auth:recovery-code', input),
  resetPassword: (input) => invoke('auth:reset-password', input),
  login: (credentials) => invoke('auth:login', credentials),
  updateCredentials: (input) => invoke('auth:updateCredentials', input),
  getAppData: () => invoke('appData:get'),
  saveAppData: (data) => invoke('appData:save', data),
  createBackup: (targetDir) => invoke('backup:create', targetDir),
  listBackups: () => invoke('backup:list'),
  listBackupDrives: () => invoke('backup:drives'),
  browseBackupDirectory: (targetPath) => invoke('backup:browse', targetPath),
  chooseBackupFolder: () => invoke('backup:choose-folder'),
  chooseBackupFile: () => invoke('backup:choose-file'),
  restoreBackup: (backupPath) => invoke('backup:restore', backupPath),
});
