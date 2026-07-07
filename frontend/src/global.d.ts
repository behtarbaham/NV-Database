export {};

declare global {
  interface Window {
    navandApi?: {
      getAppData: () => Promise<any>;
      saveAppData: (data: any) => Promise<any>;
      createBackup: () => Promise<any>;
      listBackups: () => Promise<any>;
      restoreBackup: (backupPath: string) => Promise<any>;
    };
  }
}
