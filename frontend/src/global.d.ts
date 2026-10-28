export {};

declare global {
  interface Window {
    navandApi?: {
      getAppData: () => Promise<any>;
      saveAppData: (data: any) => Promise<any>;
      createBackup: (targetDir?: string) => Promise<any>;
      listBackups: () => Promise<any>;
      listBackupDrives: () => Promise<any>;
      browseBackupDirectory: (targetPath: string) => Promise<any>;
      chooseBackupFolder: () => Promise<any>;
      chooseBackupFile: () => Promise<any>;
      restoreBackup: (backupPath: string) => Promise<any>;
    };
  }
}
