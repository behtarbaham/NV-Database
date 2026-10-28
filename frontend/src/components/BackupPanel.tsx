/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, DatabaseBackup, FileArchive, Folder, HardDrive, RefreshCw, RotateCcw, Save } from 'lucide-react';
import { BackupDirectory, BackupEntry } from '../types';
import { toPersianDigits } from '../utils';
import { trapFocusInActiveDialog } from '../accessibility';

interface BackupPanelProps {
  apiClient: {
    createBackup: (targetDir?: string) => Promise<any>;
    restoreBackup: (backupPath: string) => Promise<any>;
    listBackupDrives: () => Promise<{ ok: boolean; drives: BackupEntry[] }>;
    browseBackupDirectory: (targetPath: string) => Promise<{ ok: boolean; directory: BackupDirectory }>;
    chooseBackupFolder: () => Promise<{ canceled: boolean; path: string | null }>;
    chooseBackupFile: () => Promise<{ canceled: boolean; path: string | null }>;
  };
  onRestoreComplete: () => Promise<void>;
}

export function BackupPanel({ apiClient, onRestoreComplete }: BackupPanelProps) {
  const [drives, setDrives] = useState<BackupEntry[]>([]);
  const [directory, setDirectory] = useState<BackupDirectory | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedBackupFile, setSelectedBackupFile] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRestoreConfirmationOpen, setIsRestoreConfirmationOpen] = useState(false);

  useEffect(() => {
    if (!isRestoreConfirmationOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsRestoreConfirmationOpen(false);
      else trapFocusInActiveDialog(event);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isRestoreConfirmationOpen]);

  const loadDrives = async () => {
    setError(null);
    const response = await apiClient.listBackupDrives();
    setDrives(response.drives || []);
  };

  const browsePath = async (targetPath: string) => {
    setError(null);
    const response = await apiClient.browseBackupDirectory(targetPath);
    setDirectory(response.directory);
    setSelectedFolder(response.directory.currentPath);
  };

  useEffect(() => {
    loadDrives().catch(() => setError('لیست درایوها خوانده نشد.'));
  }, []);

  const handleChooseFolder = async () => {
    const response = await apiClient.chooseBackupFolder();
    if (!response.canceled && response.path) {
      setSelectedFolder(response.path);
      await browsePath(response.path).catch(() => undefined);
    }
  };

  const handleChooseFile = async () => {
    const response = await apiClient.chooseBackupFile();
    if (!response.canceled && response.path) setSelectedBackupFile(response.path);
  };

  const handleCreateBackup = async () => {
    if (!selectedFolder) {
      setError('اول یک فولدر برای ذخیره بکاپ انتخاب کنید.');
      return;
    }
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiClient.createBackup(selectedFolder);
      setMessage(`بکاپ با موفقیت ذخیره شد: ${response.backup?.backupPath || selectedFolder}`);
      await browsePath(selectedFolder).catch(() => undefined);
    } catch {
      setError('بکاپ ساخته نشد. مسیر انتخابی را بررسی کنید.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRestoreBackup = () => {
    if (!selectedBackupFile) {
      setError('\u0627\u0648\u0644 \u0641\u0627\u06cc\u0644 \u0628\u06a9\u0627\u067e \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f.');
      return;
    }
    setIsRestoreConfirmationOpen(true);
  };
  const performRestoreBackup = async () => {
    if (!selectedBackupFile) {
      setError('اول فایل بکاپ را انتخاب کنید.');
      return;
    }
    setIsRestoreConfirmationOpen(false);

    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiClient.restoreBackup(selectedBackupFile);
      await onRestoreComplete();
      setMessage('بازیابی انجام شد و دیتای برنامه دوباره بارگذاری شد.');
    } catch {
      setError('بازیابی انجام نشد. فایل بکاپ را بررسی کنید.');
    } finally {
      setIsBusy(false);
    }
  };

  const backupFiles = directory?.entries.filter((entry) => entry.type === 'backup') || [];
  const folders = directory?.entries.filter((entry) => entry.type === 'folder') || [];

  return (
    <div className="backup-panel space-y-4 text-right">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2 justify-end">
            سیستم بکاپ و بازیابی
            <DatabaseBackup className="w-5 h-5 text-blue-600" />
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">مسیر دلخواه را انتخاب کنید، بکاپ بگیرید یا دیتای پاک‌شده را از فایل بکاپ برگردانید.</p>
        </div>
        <button
          onClick={loadDrives}
          disabled={isBusy}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          تازه‌سازی درایوها
        </button>
      </div>

      {isRestoreConfirmationOpen && (
        <div className="app-dialog-overlay" role="alertdialog" aria-modal="true" aria-labelledby="restore-title">
          <div className="app-dialog-card">
            <div className="app-dialog-icon"><AlertCircle /></div>
            <h3 id="restore-title">{'\u062a\u0627\u06cc\u06cc\u062f \u0628\u0627\u0632\u06cc\u0627\u0628\u06cc \u0628\u06a9\u0627\u067e'}</h3>
            <p>{'\u062f\u06cc\u062a\u0627\u06cc \u0641\u0639\u0644\u06cc \u0628\u0627 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0641\u0627\u06cc\u0644 \u0628\u06a9\u0627\u067e \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0645\u06cc\u200c\u0634\u0648\u062f.'}</p>
            <div className="app-dialog-actions">
              <button type="button" className="app-dialog-confirm" onClick={() => void performRestoreBackup()} autoFocus>{'\u0628\u0627\u0632\u06cc\u0627\u0628\u06cc'}</button>
              <button type="button" className="app-dialog-cancel" onClick={() => setIsRestoreConfirmationOpen(false)}>{'\u0627\u0646\u0635\u0631\u0627\u0641'}</button>
            </div>
          </div>
        </div>
      )}

      {(message || error) && (
        <div className="app-feedback-overlay" role="alertdialog" aria-modal="true" onKeyDown={(event) => { if (event.key === 'Escape') { setError(null); setMessage(null); } else trapFocusInActiveDialog(event.nativeEvent); }}>
          <div className="app-feedback-card">
            <div className={error ? 'app-dialog-icon' : 'app-feedback-icon'}>{error ? <AlertCircle /> : <CheckCircle2 />}</div>
            <h3>{error ? '\u0639\u0645\u0644\u06cc\u0627\u062a \u0627\u0646\u062c\u0627\u0645 \u0646\u0634\u062f' : '\u0639\u0645\u0644\u06cc\u0627\u062a \u0645\u0648\u0641\u0642 \u0628\u0648\u062f'}</h3>
            <p>{error || message}</p>
            <button type="button" className="notice-dismiss" onClick={() => { setError(null); setMessage(null); }} autoFocus>{'\u0645\u062a\u0648\u062c\u0647 \u0634\u062f\u0645'}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-extrabold text-slate-700 text-sm">درایوها</div>
          <div className="p-3 space-y-2">
            {drives.map((drive) => (
              <button
                key={drive.path}
                onClick={() => browsePath(drive.path)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center justify-between gap-2"
              >
                <span dir="ltr" className="font-mono">{drive.path}</span>
                <HardDrive className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">انتخاب محل ذخیره</h3>
              <p dir="ltr" className="text-xs text-slate-500 font-mono mt-1 break-all">{selectedFolder || 'هیچ مسیری انتخاب نشده است'}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={handleChooseFolder} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-2">
                <Folder className="w-4 h-4" />
                انتخاب با پنجره سیستم
              </button>
              <button onClick={handleCreateBackup} disabled={isBusy || !selectedFolder} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2">
                <Save className="w-4 h-4" />
                بکاپ‌گیری
              </button>
            </div>
          </div>

          {directory && (
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2 justify-end">
                {directory.parentPath && (
                  <button onClick={() => browsePath(directory.parentPath!)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    پوشه قبلی
                  </button>
                )}
                <button onClick={() => setSelectedFolder(directory.currentPath)} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700">
                  انتخاب همین فولدر برای بکاپ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2">
                {folders.map((folder) => (
                  <button key={folder.path} onClick={() => browsePath(folder.path)} className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-right flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700 truncate">{folder.name}</span>
                    <Folder className="w-4 h-4 text-blue-600" />
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-extrabold text-slate-700 text-sm mb-3">فایل‌های بکاپ در این مسیر</h4>
                <div className="space-y-2">
                  {backupFiles.map((file) => (
                    <button key={file.path} onClick={() => setSelectedBackupFile(file.path)} className={`w-full p-3 rounded-xl border text-right flex items-center justify-between gap-3 ${selectedBackupFile === file.path ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800">{file.name}</p>
                        {file.size && <p className="text-xs font-bold text-slate-400 mt-1">{toPersianDigits(Math.round(file.size / 1024))} KB</p>}
                      </div>
                      <FileArchive className="w-4 h-4 text-slate-500" />
                    </button>
                  ))}
                  {backupFiles.length === 0 && <p className="text-xs font-bold text-slate-400 p-3 bg-slate-50 rounded-xl">در این فولدر فایل بکاپ پیدا نشد.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">ریکاوری از بکاپ</h3>
          <p dir="ltr" className="text-xs text-slate-500 font-mono mt-1 break-all">{selectedBackupFile || 'فایل بکاپ انتخاب نشده است'}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={handleChooseFile} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-2">
            <FileArchive className="w-4 h-4" />
            انتخاب فایل بکاپ
          </button>
          <button onClick={handleRestoreBackup} disabled={isBusy || !selectedBackupFile} className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            ریکاوری
          </button>
        </div>
      </div>
    </div>
  );
}
