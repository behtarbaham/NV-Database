const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('navandApi', {
  getAppData: () => invoke('appData:get'),
  saveAppData: (data) => invoke('appData:save', data),
  createBackup: () => invoke('backup:create'),
  listBackups: () => invoke('backup:list'),
  restoreBackup: (backupPath) => invoke('backup:restore', backupPath),
});
