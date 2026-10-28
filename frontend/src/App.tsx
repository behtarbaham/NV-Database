import { ImportKind, planExcelImport } from './utils/excel';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
  Award,
  Calendar,
  AlertCircle,
  Lock,
  LogIn,
  CheckCircle2,
  KeyRound,
  Bell,
  Menu,
  X
} from 'lucide-react';

import {
  Classroom,
  TimetableEntry,
  Student,
  Teacher,
  Course,
  Payment,
  Expense,
  Income,
  Exam,
  ExamResult,
  AuthUser,
  SidebarTab
} from './types';


import {
  formatCurrency,
  toPersianDigits,
  generateId,
  getTodayJalali,
  getCurrentTerm,
  toJalaliDateKey,
  formatDisplayDate,
  getStudentMonthNotice,
  formatAfghanDate
} from './utils';

import { RoomsPanel, TimetablePanel } from './components/SchedulingPanels';
import { Sidebar } from './components/Sidebar';
import { EntityModal } from './components/Modals';
import { MonthlyFinanceChart, CourseDistributionChart } from './components/Charts';
import { ReportsPanel } from './components/ReportsPanel';
import { PasswordResetScreen, RecoveryCodeSetup, AccountRegistration } from './components/PasswordRecovery';
import { BackupPanel } from './components/BackupPanel';
import { trapFocusInActiveDialog } from './accessibility';

type AppData = {
  rooms: Classroom[];
  timetable: TimetableEntry[];
  students: Student[];
  teachers: Teacher[];
  courses: Course[];
  payments: Payment[];
  expenses: Expense[];
  incomes: Income[];
  exams: Exam[];
  results: ExamResult[];
};

type AuthCredentials = {
  username: string;
  password: string;
};

type CredentialUpdateInput = {
  userId: number;
  currentPassword: string;
  username: string;
  password: string;
};


declare global {
  interface Window {
    navandApi?: {
      registerAccount: (input: { username: string; password: string; recoveryCode: string }) => Promise<{ ok: boolean; message?: string; user?: AuthUser }>;
      createRecoveryCode: (input: { username: string; currentPassword?: string }) => Promise<{ ok: boolean; message?: string; recoveryCode?: string }>;
      resetPassword: (input: { username: string; recoveryCode?: string; password?: string }) => Promise<{ ok: boolean; message?: string; reset?: boolean }>;
      login: (credentials: AuthCredentials) => Promise<{ ok: boolean; user: AuthUser }>;
      updateCredentials: (input: CredentialUpdateInput) => Promise<{ ok: boolean; user: AuthUser }>;
      getAppData: () => Promise<{ data: AppData | null; updatedAt: string | null }>;
      saveAppData: (data: AppData) => Promise<{ ok: boolean; data: AppData }>;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';
const apiClient = {
  async login(credentials: AuthCredentials) {
    if (window.navandApi) return window.navandApi.login(credentials);
    const response = await axios.post<{ ok: boolean; user: AuthUser }>(`${API_BASE_URL}/api/auth/login`, credentials);
    return response.data;
  },
  async updateCredentials(input: CredentialUpdateInput) {
    if (window.navandApi) return window.navandApi.updateCredentials(input);
    const response = await axios.put<{ ok: boolean; user: AuthUser }>(`${API_BASE_URL}/api/auth/credentials`, input);
    return response.data;
  },
  async getAppData() {
    if (window.navandApi) return window.navandApi.getAppData();
    const response = await axios.get<{ data: AppData | null; updatedAt: string | null }>(`${API_BASE_URL}/api/app-data`);
    return response.data;
  },
  async saveAppData(data: AppData) {
    if (window.navandApi) return window.navandApi.saveAppData(data);
    const response = await axios.put<{ ok: boolean; data: AppData }>(`${API_BASE_URL}/api/app-data`, data);
    return response.data;
  },
  async createBackup(targetDir?: string) {
    if (window.navandApi) return window.navandApi.createBackup(targetDir);
    const response = await axios.post(`${API_BASE_URL}/api/backups`, { targetDir });
    return response.data;
  },
  async restoreBackup(backupPath: string) {
    if (window.navandApi) return window.navandApi.restoreBackup(backupPath);
    const response = await axios.post(`${API_BASE_URL}/api/restore`, { backupPath });
    return response.data;
  },
  async listBackupDrives() {
    if (window.navandApi) return window.navandApi.listBackupDrives();
    const response = await axios.get(`${API_BASE_URL}/api/backup-drives`);
    return response.data;
  },
  async browseBackupDirectory(targetPath: string) {
    if (window.navandApi) return window.navandApi.browseBackupDirectory(targetPath);
    const response = await axios.post(`${API_BASE_URL}/api/backup-browse`, { path: targetPath });
    return response.data;
  },
  async chooseBackupFolder() {
    if (window.navandApi?.chooseBackupFolder) return window.navandApi.chooseBackupFolder();
    return { canceled: true, path: null };
  },
  async chooseBackupFile() {
    if (window.navandApi?.chooseBackupFile) return window.navandApi.chooseBackupFile();
    return { canceled: true, path: null };
  },
};


function PasswordInput({
  value,
  onChange,
  autoComplete,
  minLength,
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative mt-1.5">
      <input
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3.5 py-3 pl-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-sm font-semibold"
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
        title={isVisible ? 'پنهان کردن رمز' : 'نمایش رمز'}
        aria-label={isVisible ? 'پنهان کردن رمز' : 'نمایش رمز'}
      >
        <Icon className="w-4 h-4" />
      </button>
    </div>
  );
}


function ErrorDialog({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="app-feedback-overlay" role="alertdialog" aria-modal="true" onKeyDown={(event) => { event.stopPropagation(); if (event.key === 'Escape') onClose(); else trapFocusInActiveDialog(event.nativeEvent); }}>
      <div className="app-feedback-card">
        <div className="app-dialog-icon"><AlertCircle /></div>
        <h3>{'\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u062f\u0631\u0633\u062a \u0646\u06cc\u0633\u062a'}</h3>
        <p>{message}</p>
        <button type="button" className="notice-dismiss" onClick={onClose} autoFocus>{'\u0645\u062a\u0648\u062c\u0647 \u0634\u062f\u0645'}</button>
      </div>
    </div>
  );
}
function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [showReset, setShowReset] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.login({ username, password });
      onAuthenticated(response.user);
    } catch (error) {
      const fallbackMessage = '\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u06cc\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062f\u0631\u0633\u062a \u0646\u06cc\u0633\u062a.';
      const invalidCredentials = axios.isAxiosError(error)
        ? error.response?.status === 401
        : error instanceof Error && error.message.includes('Invalid username or password.');
      const message = invalidCredentials
        ? fallbackMessage
        : 'ورود انجام نشد؛ برنامه را ببندید و دوباره باز کنید. اگر مشکل ادامه داشت، فایل startup.log را برای بررسی نگه دارید.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showRegister) return <AccountRegistration onBack={() => setShowRegister(false)} onCreated={(name) => { setUsername(name); setPassword(''); setShowRegister(false); }} />;
  if (showReset) return <PasswordResetScreen onBack={() => setShowReset(false)} />;

  return (
    <div className="login-screen min-h-screen flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="login-card w-full bg-white overflow-hidden">
        <div className="login-header px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-right">
              <h1 className="text-lg font-extrabold">{'\u0622\u06a9\u0627\u062f\u0645\u06cc \u0646\u0627\u0648\u0646\u062f'}</h1>
              <p className="text-xs text-slate-600 font-bold mt-1">{'\u0648\u0631\u0648\u062f \u0628\u0647 \u0633\u06cc\u0633\u062a\u0645 \u0645\u062f\u06cc\u0631\u06cc\u062a \u062f\u06cc\u062a\u0627\u0628\u06cc\u0633'}</p>
            </div>
            <div className="login-lock flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <form onSubmit={submitAuth} className="login-form space-y-4 p-6">
          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">{'\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc'}</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full mt-1.5 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-sm font-semibold"
              required
              minLength={3}
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">{'\u0631\u0645\u0632 \u0639\u0628\u0648\u0631'}</span>
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={4}
              autoComplete="current-password"
            />
          </label>

          {error && <ErrorDialog message={error} onClose={() => setError(null)} />}

          <button
            type="submit"
            disabled={isSubmitting}
            className="login-submit w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold flex items-center justify-center gap-3 transition"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? '\u062f\u0631 \u062d\u0627\u0644 \u0628\u0631\u0631\u0633\u06cc...' : '\u0648\u0631\u0648\u062f'}
          </button>

          <button type="button" disabled={isSubmitting} onClick={() => setShowReset(true)} className="w-full text-sm font-bold text-blue-700 py-2">
            رمز را فراموش کرده‌اید؟ بازنشانی رمز عبور
          </button>

          <button type="button" disabled={isSubmitting} onClick={() => setShowRegister(true)} className="w-full text-sm font-bold text-blue-700 py-2">ساخت حساب جدید و کد بازیابی</button>
          <p className="login-help text-xs leading-6 text-slate-600">
            ابتدا حساب خود را بسازید و کد بازیابی آن را انتخاب کنید؛ سپس با همان نام کاربری و رمز وارد شوید.
            {' '}برای انتقال حساب و اطلاعات به کامپیوتر دیگر، بکاپ را بازیابی کنید.
          </p>
          <p className="text-xs text-center text-slate-500">نسخهٔ {import.meta.env.VITE_APP_VERSION || 'نامشخص'}</p>
        </form>
      </div>
    </div>
  );
}

function CredentialsModal({
  user,
  onClose,
  onUpdated,
}: {
  user: AuthUser;
  onClose: () => void;
  onUpdated: (user: AuthUser) => void;
}) {
  const [username, setUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else trapFocusInActiveDialog(event);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  const saveCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062c\u062f\u06cc\u062f \u0648 \u062a\u06a9\u0631\u0627\u0631 \u0622\u0646 \u06cc\u06a9\u0633\u0627\u0646 \u0646\u06cc\u0633\u062a.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.updateCredentials({
        userId: user.id,
        currentPassword,
        username,
        password,
      });
      onUpdated(response.user);
      onClose();
    } catch (error) {
      const fallbackMessage = '\u062a\u063a\u06cc\u06cc\u0631 \u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u06cc\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0646\u062c\u0627\u0645 \u0646\u0634\u062f.';
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message || fallbackMessage
        : fallbackMessage;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="entity-modal-card w-full max-w-md bg-white overflow-hidden text-right" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="credentials-title">
        <div className="entity-modal-header bg-white p-5 flex items-center justify-between border-b border-slate-100">
          <button onClick={onClose} className="text-slate-500 hover:text-blue-700 text-sm font-bold">
            {'\u0628\u0633\u062a\u0646'}
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 id="credentials-title" className="font-extrabold text-base text-slate-800">{'\u062a\u063a\u06cc\u06cc\u0631 \u062d\u0633\u0627\u0628 \u06a9\u0627\u0631\u0628\u0631\u06cc'}</h2>
              <p className="text-xs text-slate-600 font-bold mt-1">{'\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062f\u06cc\u062a\u0627\u0628\u06cc\u0633'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
        </div>

        <form onSubmit={saveCredentials} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">{'\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u062c\u062f\u06cc\u062f'}</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full mt-1.5 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 text-sm font-semibold"
              required
              minLength={3}
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">{'\u0631\u0645\u0632 \u0641\u0639\u0644\u06cc'}</span>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">{'\u0631\u0645\u0632 \u062c\u062f\u06cc\u062f'}</span>
            <PasswordInput
              value={password}
              onChange={setPassword}
              minLength={4}
              autoComplete="new-password"
            />
          </label>

          <label className="block">
            <span className="text-xs font-extrabold text-slate-700">{'\u062a\u06a9\u0631\u0627\u0631 \u0631\u0645\u0632 \u062c\u062f\u06cc\u062f'}</span>
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={4}
              autoComplete="new-password"
            />
          </label>

          {error && <ErrorDialog message={error} onClose={() => setError(null)} />}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition"
          >
            {isSubmitting ? '\u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647...' : '\u0630\u062e\u06cc\u0631\u0647 \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a'}
          </button>
          <RecoveryCodeSetup username={user.username} currentPassword={currentPassword} />
        </form>
      </div>
    </div>
  );
}

export default function App() {
  // --- OFFLINE DATA PERSISTENCE STATE ---
  const [students, setStudents] = useState<Student[]>(() => {
    const data = localStorage.getItem('navand_students');
    return data ? JSON.parse(data) : [];
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const data = localStorage.getItem('navand_teachers');
    return data ? JSON.parse(data) : [];
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const data = localStorage.getItem('navand_courses');
    return data ? JSON.parse(data) : [];
  });

  const [rooms, setRooms] = useState<Classroom[]>(() => JSON.parse(localStorage.getItem('navand_rooms') || '[]'));
  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => JSON.parse(localStorage.getItem('navand_timetable') || '[]'));

  const [payments, setPayments] = useState<Payment[]>(() => {
    const data = localStorage.getItem('navand_payments');
    return data ? JSON.parse(data) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const data = localStorage.getItem('navand_expenses');
    return data ? JSON.parse(data) : [];
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    const data = localStorage.getItem('navand_incomes');
    return data ? JSON.parse(data) : [];
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const data = localStorage.getItem('navand_exams');
    return data ? JSON.parse(data) : [];
  });

  const [results, setResults] = useState<ExamResult[]>(() => {
    const data = localStorage.getItem('navand_results');
    return data ? JSON.parse(data) : [];
  });

  const [isDatabaseLoaded, setIsDatabaseLoaded] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<'loading' | 'connected' | 'saving' | 'error'>('loading');
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const isLocalMutationPendingRef = useRef(false);
  const pendingSuccessMessageRef = useRef<string | null>(null);

  const applyAppData = (data: AppData | null) => {
    if (!data) return;
    setStudents(data.students);
    setTeachers(data.teachers);
    setCourses(data.courses);
    setRooms(data.rooms || []);
    setTimetable(data.timetable || []);
    setPayments(data.payments);
    setExpenses(data.expenses);
    setIncomes(data.incomes);
    setExams(data.exams);
    setResults(data.results);
  };

  const reloadAppData = async () => {
    if (isLocalMutationPendingRef.current) return;
    setDatabaseStatus('loading');
    const response = await apiClient.getAppData();
    applyAppData(response.data);
    setDatabaseStatus('connected');
    setDatabaseError(null);
  };

  useEffect(() => {
    let isMounted = true;

    const loadAppData = async () => {
      try {
        const response = await apiClient.getAppData();
        if (!isMounted) return;
        applyAppData(response.data);
        setDatabaseStatus('connected');
        setDatabaseError(null);
      } catch (error) {
        if (isMounted) {
          setDatabaseStatus('error');
          setDatabaseError('Could not load app data from SQLite. The app is using local data for now.');
        }
      } finally {
        if (isMounted) {
          setIsDatabaseLoaded(true);
        }
      }
    };

    loadAppData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDatabaseLoaded) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        setDatabaseStatus('saving');
        await apiClient.saveAppData({
          rooms,
          timetable,
          students,
          teachers,
          courses,
          payments,
          expenses,
          incomes,
          exams,
          results,
        });
        isLocalMutationPendingRef.current = false;
        if (pendingSuccessMessageRef.current) {
          setSuccessMessage(pendingSuccessMessageRef.current);
          pendingSuccessMessageRef.current = null;
        }
        setDatabaseStatus('connected');
        setDatabaseError(null);
      } catch (error) {
        setDatabaseStatus('error');
        setDatabaseError('Could not save app data to SQLite. Check the desktop backend service.');
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [rooms, timetable, courses, exams, expenses, incomes, isDatabaseLoaded, payments, results, students, teachers]);

  useEffect(() => {
    if (!successMessage) return;
    const messageTimeout = window.setTimeout(() => setSuccessMessage(null), 3500);
    return () => window.clearTimeout(messageTimeout);
  }, [successMessage]);

  const importExcelRows = async (kind: ImportKind, rows: Record<string, unknown>[]) => {
    isLocalMutationPendingRef.current = true;
    try {
      const loaded = await apiClient.getAppData();
      const current: AppData = loaded.data || { students, teachers, courses, payments, expenses, incomes, exams, results, rooms, timetable };
      const plan = planExcelImport(kind, rows, current);
      if (plan.errors.length) throw new Error(plan.errors.slice(0, 5).join('؛ '));
      if (!plan.additions.length && !plan.updates.length) { applyAppData(current); return { added: 0, updated: 0 }; }
      await apiClient.createBackup();
      const updates = new Map(plan.updates.map(record => [record.id, record]));
      const updated = { ...current, courses: [...current.courses, ...plan.courses], [kind]: [...current[kind].map(record => updates.get(record.id) || record), ...plan.additions] } as AppData;
      setDatabaseStatus('saving');
      const response = await apiClient.saveAppData(updated);
      applyAppData(response.data);
      setDatabaseStatus('connected');
      setDatabaseError(null);
      return { added: plan.additions.length, updated: plan.updates.length };
    } finally { isLocalMutationPendingRef.current = false; }
  };

  const saveRoom = (room: Classroom) => {
    isLocalMutationPendingRef.current = true;
    pendingSuccessMessageRef.current = 'اتاق درسی ذخیره شد.';
    setRooms((current) => current.some((item) => item.id === room.id) ? current.map((item) => item.id === room.id ? room : item) : [...current, room]);
  };
  const saveTimetable = (entry: TimetableEntry) => {
    isLocalMutationPendingRef.current = true;
    pendingSuccessMessageRef.current = 'تقسیم اوقات ذخیره شد.';
    setTimetable((current) => current.some((item) => item.id === entry.id) ? current.map((item) => item.id === entry.id ? entry : item) : [...current, entry]);
  };
  const deleteSchedulingItem = (id: string, kind: 'room' | 'timetable') => {
    if (kind === 'room' && timetable.some((entry) => entry.roomId === id)) return;
    setConfirmation({ title: kind === 'room' ? 'حذف اتاق درسی' : 'حذف تایم درسی', message: 'آیا از حذف این مورد اطمینان دارید؟', confirmLabel: 'حذف', onConfirm: () => {
      isLocalMutationPendingRef.current = true;
      if (kind === 'room') setRooms((current) => current.filter((item) => item.id !== id));
      else setTimetable((current) => current.filter((item) => item.id !== id));
    } });
  };

  // Sync with LocalStorage
  useEffect(() => { localStorage.setItem('navand_rooms', JSON.stringify(rooms)); }, [rooms]);
  useEffect(() => { localStorage.setItem('navand_timetable', JSON.stringify(timetable)); }, [timetable]);
  useEffect(() => { localStorage.setItem('navand_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('navand_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('navand_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('navand_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('navand_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('navand_incomes', JSON.stringify(incomes)); }, [incomes]);
  useEffect(() => { localStorage.setItem('navand_exams', JSON.stringify(exams)); }, [exams]);
  useEffect(() => { localStorage.setItem('navand_results', JSON.stringify(results)); }, [results]);

  useEffect(() => {
    setResults((currentResults) => {
      const cleanedResults = currentResults.filter((result) =>
        students.some((student) => student.id === result.studentId) &&
        exams.some((exam) => exam.id === result.examId)
      );
      return cleanedResults.length === currentResults.length ? currentResults : cleanedResults;
    });
  }, [students, exams]);

  // --- LIVE CALENDAR (auto-updates so the shown date is always today) ---
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    // Refresh each minute and on focus, including after sleep.
    const intervalId = window.setInterval(() => setToday(new Date()), 60 * 1000);
    const refresh = () => setToday(new Date());
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  const todayLabel = getTodayJalali(today);
  const termLabel = getCurrentTerm(today);
  const monthNotices = students.flatMap((student) => {
    const notice = student.isActive ? getStudentMonthNotice(student.joinDate, today) : null;
    return notice ? [{ student, ...notice }] : [];
  }).sort((a, b) => a.dueKey - b.dueKey || a.student.id.localeCompare(b.student.id));
  const monthCompletedIds = new Set(monthNotices.map(({ student }) => student.id));

  // --- INTERACTION STATE ---
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const collapsed = localStorage.getItem('navand_sidebar_collapsed');
    return collapsed === 'true';
  });

  useEffect(() => {
    localStorage.setItem('navand_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  // Sorting
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals management
  const [modalType, setModalType] = useState<
    | 'add_student'
    | 'edit_student'
    | 'add_teacher'
    | 'edit_teacher'
    | 'add_course'
    | 'edit_course'
    | 'add_payment'
    | 'edit_payment'
    | 'add_expense'
    | 'add_income'
    | 'add_exam'
    | 'add_result'
    | null
  >(null);

  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [studentDetailEntity, setStudentDetailEntity] = useState<Student | null>(null);
  useEffect(() => {
    if (!studentDetailEntity && !confirmation) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (confirmation) setConfirmation(null);
        else setStudentDetailEntity(null);
      } else {
        trapFocusInActiveDialog(event);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [studentDetailEntity, confirmation]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  const currentUser = authUser
    ? {
        name: authUser.fullName,
        role: authUser.role,
        email: authUser.username,
      }
    : {
        name: '',
        role: '',
        email: '',
      };

  const handleLogout = () => {
    setConfirmation({
      title: 'خروج از حساب کاربری',
      message: 'آیا می‌خواهید از حساب کاربری خارج شوید؟',
      confirmLabel: 'خروج',
      onConfirm: () => {
        setIsCredentialsModalOpen(false);
        setAuthUser(null);
      },
    });
  };

  // Authentication stays only in memory: closing or reloading always requires
  // a fresh login. Sessions stay active until the user explicitly logs out.
  useEffect(() => {
    localStorage.removeItem('navand_auth_user');
  }, []);


  // Keep dashboard cards and both charts synchronized with SQLite. Refresh on
  // dashboard entry, every 30 seconds, and whenever the window becomes active.
  useEffect(() => {
    if (!authUser || activeTab !== 'dashboard') return;
    let isRefreshing = false;
    const refreshDashboard = async () => {
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        await reloadAppData();
      } catch {
        setDatabaseStatus('error');
        setDatabaseError('تازه‌سازی داشبورد از دیتابیس انجام نشد.');
      } finally {
        isRefreshing = false;
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshDashboard();
    };
    void refreshDashboard();
    const refreshInterval = window.setInterval(refreshDashboard, 30 * 1000);
    window.addEventListener('focus', refreshDashboard);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshDashboard);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [activeTab, authUser]);

  // Reset pagination on tab change
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
    setSortField('');
    setSortDirection('asc');
    if (activeTab !== 'results') {
      setSelectedExamId(null);
    }
  }, [activeTab]);

  // --- STATS COMPUTATION FOR DASHBOARD ---
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.isActive).length;
  const totalTeachers = teachers.length;

  // Revenue = sum(paidAmount) + sum(otherIncomes)
  const totalTuitionRevenue = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalExtraRevenue = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalRevenueCombined = totalTuitionRevenue + totalExtraRevenue;

  // Expenses = sum(Expense amounts)
  const totalExpensesCombined = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balanceNetProfit = totalRevenueCombined - totalExpensesCombined;

  // Derive every monthly chart value from the latest database data.
  const dariMonths = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
  const readFinanceMonth = (date: string, fallbackLabel = 'بدون تاریخ') => {
    const dateKey = toJalaliDateKey(date);
    if (!dateKey) return { key: `unknown-${fallbackLabel}`, label: fallbackLabel };
    const year = Math.floor(dateKey / 10000);
    const month = Math.floor(dateKey / 100) % 100;
    return {
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: `${dariMonths[month - 1]} ${toPersianDigits(year)}`,
    };
  };
  const financeByMonth = new Map<string, { month: string; income: number; expense: number }>();
  const addFinanceValue = (date: string, type: 'income' | 'expense', amount: number, fallbackLabel?: string) => {
    const { key, label } = readFinanceMonth(date, fallbackLabel);
    const current = financeByMonth.get(key) || { month: label, income: 0, expense: 0 };
    current[type] += Number.isFinite(Number(amount)) ? Number(amount) : 0;
    financeByMonth.set(key, current);
  };
  payments.forEach((payment) => addFinanceValue(payment.paymentDate, 'income', payment.paidAmount, payment.month));
  incomes.forEach((income) => addFinanceValue(income.date, 'income', income.amount));
  expenses.forEach((expense) => addFinanceValue(expense.date, 'expense', expense.amount));
  const monthlyFinanceData = [...financeByMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);

  // Dynamic Chart 2: Student distribution grouped by courses
  const colorsArray = ['#0B6DEB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const courseDistributions = courses.map((course, idx) => {
    const count = students.filter((s) => s.courseId === course.id && s.isActive).length;
    return {
      name: course.name,
      count,
      color: colorsArray[idx % colorsArray.length],
    };
  });

  // --- HELPERS ---
  const getCourseName = (id: string) => courses.find((c) => c.id === id)?.name || 'دوره انتخاب نشده';
  const getTeacherName = (id: string) => {
    const t = teachers.find((t) => t.id === id);
    return t ? `${t.firstName} ${t.lastName}` : 'استاد نامشخص';
  };
  const getStudentName = (id: string) => {
    const s = students.find((s) => s.id === id);
    return s ? `${s.firstName} ${s.lastName}` : 'دانشجوی شماره ' + id;
  };
  const getExamTitle = (id: string) => exams.find((e) => e.id === id)?.title || 'آزمون عمومی';
  const getExamPrintId = (id: string) => {
    const digits = id.replace(/\D/g, '');
    if (digits) return digits.slice(-6).padStart(6, '0');

    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) % 1000000;
    }
    return String(hash).padStart(6, '0');
  };
  const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    return 'D';
  };
  const selectedExam = selectedExamId ? exams.find((exam) => exam.id === selectedExamId) || null : null;
  const selectedExamStudents = selectedExam
    ? students.filter((student) => student.isActive && (!selectedExam.courseId || student.courseId === selectedExam.courseId))
    : [];
  const selectedExamResults = selectedExam
    ? results.filter((result) => result.examId === selectedExam.id && students.some((student) => student.id === result.studentId))
    : [];
  const getStudentExamResult = (examId: string, studentId: string) =>
    results.find((result) => result.examId === examId && result.studentId === studentId);
  const handleSaveStudentExamResult = (
    examId: string,
    studentId: string,
    patch: Partial<Pick<ExamResult, 'score' | 'grade'>>
  ) => {
    isLocalMutationPendingRef.current = true;
    const normalizedPatch = typeof patch.score === 'number'
      ? {
          ...patch,
          score: Math.max(0, Math.min(100, patch.score)),
          grade: getGradeFromScore(Math.max(0, Math.min(100, patch.score))),
        }
      : patch;
    const existing = getStudentExamResult(examId, studentId);
    if (existing) {
      setResults((current) => current.map((result) => (result.id === existing.id ? { ...result, ...normalizedPatch } : result)));
      return;
    }

    setResults((current) => [
      {
        id: `${getExamPrintId(examId)}-${studentId}`,
        studentId,
        examId,
        score: normalizedPatch.score ?? 0,
        grade: normalizedPatch.grade ?? 'D',
        description: '',
      },
      ...current,
    ]);
  };

  // --- CRUD DISPATCH ACTION OPERATORS ---
  const handleSaveModal = (data: any) => {
    if (!modalType) return;
    isLocalMutationPendingRef.current = true;

    if (modalType.startsWith('add_')) {
      const target = modalType.replace('add_', '');
      const entityLabels: Record<string, string> = {
        student: 'دانشجو', teacher: 'استاد', course: 'دوره', payment: 'پرداخت',
        expense: 'مصرف', income: 'درآمد', exam: 'آزمون', result: 'نتیجه',
      };
      pendingSuccessMessageRef.current = `${entityLabels[target] || 'رکورد'} با موفقیت در دیتابیس ثبت شد.`;
      const newId = generateId(
        target === 'student' ? 'S' : target === 'teacher' ? 'T' : target === 'course' ? 'C' : target === 'payment' ? 'PAY' : target === 'expense' ? 'EXP' : target === 'income' ? 'INC' : target === 'exam' ? 'EXM' : 'RES'
      );
      const withIdObj = target === 'exam'
        ? { ...data, id: newId, title: getCourseName(data.courseId) }
        : { ...data, id: newId };

      if (target === 'student') setStudents((current) => [withIdObj, ...current]);
      if (target === 'teacher') setTeachers((current) => [withIdObj, ...current]);
      if (target === 'course') setCourses((current) => [withIdObj, ...current]);
      if (target === 'payment') setPayments((current) => [withIdObj, ...current]);
      if (target === 'expense') setExpenses((current) => [withIdObj, ...current]);
      if (target === 'income') setIncomes((current) => [withIdObj, ...current]);
      if (target === 'exam') setExams((current) => [withIdObj, ...current]);
      if (target === 'result') setResults((current) => [withIdObj, ...current]);
    } else if (modalType.startsWith('edit_')) {
      const target = modalType.replace('edit_', '');

      if (target === 'student') setStudents((current) => current.map((x) => (x.id === data.id ? data : x)));
      if (target === 'teacher') setTeachers((current) => current.map((x) => (x.id === data.id ? data : x)));
      if (target === 'course') setCourses((current) => current.map((x) => (x.id === data.id ? data : x)));
      if (target === 'payment') setPayments((current) => current.map((x) => (x.id === data.id ? data : x)));
      if (target === 'expense') setExpenses((current) => current.map((x) => (x.id === data.id ? data : x)));
      if (target === 'income') setIncomes((current) => current.map((x) => (x.id === data.id ? data : x)));
      if (target === 'exam') setExams((current) => current.map((x) => (x.id === data.id ? data : x)));
      if (target === 'result') setResults((current) => current.map((x) => (x.id === data.id ? data : x)));
    }

    setModalType(null);
    setEditingEntity(null);
  };

  const performDeleteEntity = (id: string, target: 'student' | 'teacher' | 'course' | 'payment' | 'expense' | 'income' | 'exam' | 'result') => {
    isLocalMutationPendingRef.current = true;

    if (target === 'student') {
      setStudents(students.filter((x) => x.id !== id));
      setResults(results.filter((x) => x.studentId !== id));
      if (studentDetailEntity?.id === id) setStudentDetailEntity(null);
    }
    if (target === 'teacher') { setTeachers(teachers.filter((x) => x.id !== id)); setTimetable((current) => current.filter((entry) => entry.teacherId !== id)); }
    if (target === 'course') { setCourses(courses.filter((x) => x.id !== id)); setTimetable((current) => current.filter((entry) => entry.courseId !== id)); }
    if (target === 'payment') setPayments(payments.filter((x) => x.id !== id));
    if (target === 'expense') setExpenses(expenses.filter((x) => x.id !== id));
    if (target === 'income') setIncomes(incomes.filter((x) => x.id !== id));
    if (target === 'exam') {
      setExams(exams.filter((x) => x.id !== id));
      setResults(results.filter((x) => x.examId !== id));
      if (selectedExamId === id) setSelectedExamId(null);
    }
    if (target === 'result') setResults(results.filter((x) => x.id !== id));
  };

  const handleDeleteEntity = (
    id: string,
    target: 'student' | 'teacher' | 'course' | 'payment' | 'expense' | 'income' | 'exam' | 'result'
  ) => {
    setConfirmation({
      title: 'حذف دائمی رکورد',
      message: (target === 'teacher' || target === 'course') && timetable.some((entry) => target === 'teacher' ? entry.teacherId === id : entry.courseId === id) ? 'با حذف این رکورد، تایم‌های درسی مربوط به آن نیز حذف می‌شوند. ادامه می‌دهید؟' : 'آیا از حذف این رکورد اطمینان دارید؟ این عمل قابل بازگشت نیست.',
      confirmLabel: 'حذف رکورد',
      onConfirm: () => performDeleteEntity(id, target),
    });
  };

  const handleOpenEdit = (entity: any, type: typeof modalType) => {
    setEditingEntity(entity);
    setModalType(type);
  };

  // --- QUERY FILTERING & SORTING LOGIC ---
  const applySort = (arr: any[]) => {
    if (!sortField) return arr;
    const sorted = [...arr];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
    });
    return sorted;
  };

  const changeSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 1. Filter Students
  const filteredStudents = applySort(
    students.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const father = (s.fatherName || '').toLowerCase();
      const ph = s.phone.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || father.includes(query) || ph.includes(query);
    })
  );

  // 2. Filter Teachers
  const filteredTeachers = applySort(
    teachers.filter((t) => {
      const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
      const spec = t.specialty.toLowerCase();
      const ph = t.phone.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || spec.includes(query) || ph.includes(query);
    })
  );

  // 3. Filter Courses
  const filteredCourses = applySort(
    courses.filter((c) => {
      const name = c.name.toLowerCase();
      const level = c.level.toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || level.includes(query);
    })
  );

  // 4. Filter Payments
  const filteredPayments = applySort(
    payments.filter((p) => {
      const studentName = getStudentName(p.studentId).toLowerCase();
      const m = p.month.toLowerCase();
      const st = p.status.toLowerCase();
      const query = searchQuery.toLowerCase();
      return studentName.includes(query) || m.includes(query) || st.includes(query);
    })
  );

  // 5. Filter Expenses
  const filteredExpenses = applySort(
    expenses.filter((e) => {
      const title = e.title.toLowerCase();
      const cat = e.category.toLowerCase();
      const dest = e.paidTo.toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || cat.includes(query) || dest.includes(query);
    })
  );

  // 6. Filter Incomes
  const filteredIncomes = applySort(
    incomes.filter((i) => {
      const title = i.title.toLowerCase();
      const src = i.source.toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || src.includes(query);
    })
  );

  // 7. Filter Exams
  const filteredExams = applySort(
    exams.filter((e) => {
      const title = e.title.toLowerCase();
      const course = getCourseName(e.courseId).toLowerCase();
      const printId = getExamPrintId(e.id);
      const query = searchQuery.toLowerCase();
      return title.includes(query) || course.includes(query) || printId.includes(query) || e.date.includes(query) || String(e.studentCount || 0).includes(query);
    })
  );

  // 8. Filter Exam Results
  const filteredResults = applySort(
    results.filter((r) => {
      const stud = getStudentName(r.studentId).toLowerCase();
      const exm = getExamTitle(r.examId).toLowerCase();
      const gd = r.grade.toLowerCase();
      const query = searchQuery.toLowerCase();
      return stud.includes(query) || exm.includes(query) || gd.includes(query);
    })
  );

  // Generic Pagination Calculator
  const getPaginatedList = (list: any[]) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return list.slice(startIndex, startIndex + rowsPerPage);
  };

  const renderPaginationWidget = (list: any[]) => {
    const totalPages = Math.ceil(list.length / rowsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-5 px-1 flex-row-reverse text-xs select-none">
        <span className="font-semibold text-slate-500 font-mono">
          نمایش {toPersianDigits((currentPage - 1) * rowsPerPage + 1)} تا{' '}
          {toPersianDigits(Math.min(currentPage * rowsPerPage, list.length))} از{' '}
          {toPersianDigits(list.length)} ردیف اطلاعاتی
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border font-bold font-mono transition cursor-pointer ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {toPersianDigits(i + 1)}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (!authUser) {
    return <AuthScreen onAuthenticated={setAuthUser} />;
  }

  const isRecordsView = ['students', 'teachers', 'courses', 'payments', 'expenses', 'incomes', 'exams', 'results'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex antialiased select-text cursor-default">
      {successMessage && (
        <div className="app-feedback-overlay" role="status" aria-live="polite">
          <div className="app-feedback-card app-feedback-success">
            <div className="app-feedback-icon">
              <CheckCircle2 />
            </div>
            <h3>عملیات موفق بود</h3>
            <p>{successMessage}</p>
            <button type="button" className="notice-dismiss" onClick={() => setSuccessMessage(null)}>باشه</button>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="app-dialog-overlay" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title">
          <div className="app-dialog-card">
            <div className="app-dialog-icon">
              <AlertCircle />
            </div>
            <h3 id="confirmation-title">{confirmation.title}</h3>
            <p>{confirmation.message}</p>
            <div className="app-dialog-actions">
              <button
                type="button"
                className="app-dialog-confirm"
                autoFocus
                onClick={() => {
                  const action = confirmation.onConfirm;
                  setConfirmation(null);
                  action();
                }}
              >
                {confirmation.confirmLabel}
              </button>
              <button type="button" className="app-dialog-cancel" onClick={() => setConfirmation(null)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar Navigation */}
      <Sidebar
        notificationCount={monthNotices.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentUser={currentUser}
        onManageAccount={() => setIsCredentialsModalOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {isMobileSidebarOpen && (
        <button type="button" className="sidebar-mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)} aria-label={'\u0628\u0633\u062a\u0646 \u0645\u0646\u0648\u06cc \u06a9\u0646\u0627\u0631\u06cc'} />
      )}

      {/* Main Container Area */}
      <main
        className={`app-main flex-grow min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 ${activeTab === 'dashboard' ? 'dashboard-main' : isRecordsView ? 'records-main' : 'workspace-main'} ${
          isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
        }`}
      >
        {/* UPPER HEADER BAR */}
        <header className={`h-16 flex items-center justify-between border-b border-slate-200/60 pb-4 mb-6 ${activeTab === 'dashboard' ? 'dashboard-header' : isRecordsView ? 'records-header' : 'workspace-header'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center font-bold text-sm">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800">{termLabel}</h2>
              <span className="text-xs sm:text-xs text-slate-500 font-bold block mt-0.5">امروز: {todayLabel}</span>
            </div>
          </div>

          <button type="button" className="mobile-menu-button" onClick={() => { setIsSidebarCollapsed(false); setIsMobileSidebarOpen(true); }} aria-label={'\u0628\u0627\u0632\u06a9\u0631\u062f\u0646 \u0645\u0646\u0648\u06cc \u0627\u0635\u0644\u06cc'}><Menu className="w-5 h-5" /></button>

          <button type="button" onClick={() => setActiveTab('notifications')} className="relative flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900" aria-label={`اعلان‌ها: ${toPersianDigits(monthNotices.length)} شاگرد با یک ماه پوره‌شده`}>
            <Bell className="h-5 w-5" />
            <span className="font-bold text-sm">{toPersianDigits(monthNotices.length)}</span>
          </button>
          <div className="header-statuses text-right space-y-1">
            <span
              className={`status-badge text-xs font-bold px-2.5 py-1 rounded-full border inline-block font-sans ${
                databaseStatus === 'connected'
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                  : databaseStatus === 'saving' || databaseStatus === 'loading'
                  ? 'text-amber-600 bg-amber-50 border-amber-100'
                  : 'text-rose-600 bg-rose-50 border-rose-100'
              }`}
              title={databaseError || '\u0648\u0636\u0639\u06cc\u062a \u0647\u0645\u06af\u0627\u0645\u200c\u0633\u0627\u0632\u06cc \u062f\u06cc\u062a\u0627\u0628\u06cc\u0633'}
            >
              {databaseStatus === 'connected' ? '\u062f\u06cc\u062a\u0627\u0628\u06cc\u0633: \u0645\u062a\u0635\u0644' : databaseStatus === 'saving' ? '\u062f\u06cc\u062a\u0627\u0628\u06cc\u0633: \u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647' : databaseStatus === 'loading' ? '\u062f\u06cc\u062a\u0627\u0628\u06cc\u0633: \u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u06cc\u0631\u06cc' : '\u062f\u06cc\u062a\u0627\u0628\u06cc\u0633: \u062e\u0637\u0627'}
            </span>
            <span className="status-badge text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 inline-block font-sans">
              پیشخوان مدیریت دسکتاپ آفلاین
            </span>
            {databaseError && (
              <p className="text-xs text-rose-600 font-bold max-w-[260px]">
                {databaseError}
              </p>
            )}
          </div>
        </header>

        {/* COMPONENT BODY RENDERING BASED ON VIEW-STATE */}

        {activeTab === 'notifications' && (
          <section className="workspace-content space-y-4 text-right" aria-labelledby="notifications-title">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-yellow-700" />
              <h2 id="notifications-title" className="text-xl font-extrabold text-slate-800">اعلان‌های شاگردان</h2>
              <span className="rounded-full bg-yellow-100 px-3 py-1 font-bold text-yellow-900">{toPersianDigits(monthNotices.length)}</span>
            </div>
            <p className="text-sm text-slate-600">شاگردان فعال که یک ماه کامل شمسی از تاریخ ورودشان گذشته است. تاریخ‌ها مطابق تقویم هجری شمسی افغانستان و وقت کابل هستند.</p>
            {monthNotices.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">فعلاً هیچ شاگرد فعال یک ماه پوره‌شده ندارد.</div>
            ) : monthNotices.map(({ student, dueLabel }) => (
              <article key={student.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-yellow-300 bg-yellow-50 p-5 text-yellow-950">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-yellow-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold">{student.firstName} {student.lastName}</h3>
                    <p className="mt-1 text-sm font-bold">یک ماه پوره شده است</p>
                    <p className="mt-2 text-sm">دوره: {getCourseName(student.courseId)} · تاریخ ورود: {formatAfghanDate(student.joinDate)}</p>
                    <p className="mt-1 text-sm">تاریخ پوره‌شدن ماه: {dueLabel}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setStudentDetailEntity(student)} className="rounded-xl border border-yellow-400 bg-white px-4 py-2 text-sm font-bold hover:bg-yellow-100">مشاهدهٔ شاگرد</button>
              </article>
            ))}
          </section>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content space-y-5">
            <TimetablePanel entries={timetable} rooms={rooms} teachers={teachers} courses={courses} onSave={saveTimetable} onDelete={(id) => deleteSchedulingItem(id, 'timetable')} onOpenRooms={() => setActiveTab('classes')} />
            {/* 4 Stat Cards */}
            <div className="dashboard-stats grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="dashboard-stat-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">دانشجویان ثبت‌نام شده</span>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-800 font-mono mt-1">
                    {toPersianDigits(totalStudents)} نفر
                  </p>
                  <span className="text-xs text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    {toPersianDigits(activeStudents)} فعال
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="dashboard-stat-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">اساتید و کادر آموزشی</span>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-800 font-mono mt-1">
                    {toPersianDigits(totalTeachers)} استاد
                  </p>
                  <span className="text-xs text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    {toPersianDigits(teachers.filter(t => t.isActive).length)} همکار فعال
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>

              <div className="dashboard-stat-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">مجموع درآمدهای آکادمی</span>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-800 font-mono mt-1 text-emerald-600">
                    {formatCurrency(totalRevenueCombined)}
                  </p>
                  <span className="text-xs text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    شهریه + مصارف نشری
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="dashboard-stat-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">سود خالص عملیاتی</span>
                  <p className={`text-xl sm:text-2xl font-extrabold font-mono mt-1 ${balanceNetProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {formatCurrency(balanceNetProfit)}
                  </p>
                  <span className="text-xs text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    منهای هزینه‌کردهای دفتری
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* 2 Graphical Charts Grid */}
            <div className="dashboard-charts grid grid-cols-1 lg:grid-cols-2 gap-5">
              <MonthlyFinanceChart data={monthlyFinanceData} />
              <CourseDistributionChart data={courseDistributions} />
            </div>

            {/* Recent Payments Section */}
            <div className="dashboard-recent bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  مشاهده همه صورت‌حساب‌ها ←
                </button>
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">آخرین تراکنش‌های دریافتی اخیر</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-3">شماره رسید</th>
                      <th className="p-3">دانشجو</th>
                      <th className="p-3">مربوط به ماه</th>
                      <th className="p-3">مبلغ کل</th>
                      <th className="p-3">مبلغ پرداختی</th>
                      <th className="p-3">باقیمانده</th>
                      <th className="p-3">تاریخ پرداخت</th>
                      <th className="p-3">وضعیت مالی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 5).map((pay) => (
                      <tr key={pay.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold font-mono text-slate-800">{pay.id}</td>
                        <td className="p-3 font-semibold">{getStudentName(pay.studentId)}</td>
                        <td className="p-3">{pay.month}</td>
                        <td className="p-3 font-mono text-slate-500">{formatCurrency(pay.totalAmount)}</td>
                        <td className="p-3 font-mono text-emerald-600 font-semibold">{formatCurrency(pay.paidAmount)}</td>
                        <td className="p-3 font-mono text-rose-600 font-semibold">{formatCurrency(pay.remainingAmount)}</td>
                        <td className="p-3 font-mono">{formatDisplayDate(pay.paymentDate)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              pay.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600'
                                : pay.status === 'partial'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {pay.status === 'completed' ? 'تصفیه کامل' : pay.status === 'partial' ? 'علی‌الحساب' : 'بدهکار دفتری'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. STUDENTS VIEW */}
        {activeTab === 'students' && (
          <div className="records-view space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، تخلص، شماره..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setModalType('add_student')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                  id="btn-add-student"
                >
                  <Plus className="w-4 h-4" />
                  دانشجو جدید
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase select-none">
                      <th className="p-4"><button type="button" onClick={() => changeSort('id')} className="table-sort-button">شناسه <ArrowUpDown className="w-3 h-3" /></button></th>
                      <th className="p-4"><button type="button" onClick={() => changeSort('firstName')} className="table-sort-button">نام <ArrowUpDown className="w-3 h-3" /></button></th>
                      <th className="p-4"><button type="button" onClick={() => changeSort('lastName')} className="table-sort-button">تخلص <ArrowUpDown className="w-3 h-3" /></button></th>
                      <th className="p-4">نام پدر</th>
                      <th className="p-4">تلفن تماس</th>
                      <th className="p-4">دوره مربوطه</th>
                      <th className="p-4 font-mono">تاریخ ورود</th>
                      <th className="p-4"><button type="button" onClick={() => changeSort('feePaid')} className="table-sort-button">شهریه پرداختی <ArrowUpDown className="w-3 h-3" /></button></th>
                      <th className="p-4">وضعیت</th>
                      <th className="p-4 text-center">عملیات دفتری</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredStudents).map((stud) => (
                      <tr key={stud.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{stud.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{stud.firstName}
                          {monthCompletedIds.has(stud.id) && <span className="mt-1 flex items-center gap-1 whitespace-nowrap rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-900"><CheckCircle2 className="h-3.5 w-3.5" />یک ماه پوره شده</span>}
                        </td>
                        <td className="p-4 font-semibold">{stud.lastName}</td>
                        <td className="p-4 text-slate-500">{stud.fatherName || '--'}</td>
                        <td className="p-4 font-mono text-left" dir="ltr">{stud.phone}</td>
                        <td className="p-4"><span className="inline-flex max-w-[160px] truncate rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{getCourseName(stud.courseId)}</span></td>
                        <td className="p-4 font-mono">{formatDisplayDate(stud.joinDate)}
                          {stud.nextPaymentDate && <span className="mt-1 block whitespace-nowrap text-xs font-bold text-amber-700">پرداخت بعدی: {formatDisplayDate(stud.nextPaymentDate)}</span>}
                        </td>
                        <td className="p-4 font-mono text-emerald-600 font-semibold">{formatCurrency(stud.feePaid)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stud.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {stud.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-1.5 h-max">
                          <button
                            onClick={() => setStudentDetailEntity(stud)}
                            className="p-1.5 rounded-lg text-slate-500 bg-slate-50 hover:bg-slate-100 transition"
                            title="مشاهده پرونده کامل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(stud, 'edit_student')}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                            title="ویرایش مشخصات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(stud.id, 'student')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                            title="حذف پرونده"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-slate-400 font-semibold">هیچ پرونده خروجی با این عبارات یافت نشد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredStudents)}
            </div>
          </div>
        )}

        {/* 3. TEACHERS VIEW */}
        {activeTab === 'teachers' && (
          <div className="records-view space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام، تخصص و شماره..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => setModalType('add_teacher')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                id="btn-add-teacher"
              >
                <Plus className="w-4 h-4" />
                آموزگار جدید
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">شناسه</th>
                      <th className="p-4">نام آموزگار</th>
                      <th className="p-4">تخصص و مهارت اصلی</th>
                      <th className="p-4">تلفن تماس</th>
                      <th className="p-4">حقوق ثابت ماهانه</th>
                      <th className="p-4 font-mono">تاریخ استخدام</th>
                      <th className="p-4">وضعیت</th>
                      <th className="p-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredTeachers).map((teach) => (
                      <tr key={teach.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{teach.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{teach.firstName} {teach.lastName}</td>
                        <td className="p-4 text-slate-600 font-bold">{teach.specialty}</td>
                        <td className="p-4 font-mono text-left" dir="ltr">{teach.phone}</td>
                        <td className="p-4 font-mono text-blue-600 font-semibold">{formatCurrency(teach.salary)}</td>
                        <td className="p-4 font-mono">{formatDisplayDate(teach.hireDate)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${teach.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {teach.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-1.5 my-auto">
                          <button
                            onClick={() => handleOpenEdit(teach, 'edit_teacher')}
                            aria-label="Edit teacher"
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(teach.id, 'teacher')}
                            aria-label="Delete teacher"
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTeachers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-semibold">هیچ آموزگاری منطبق بر فیلتر جستجو یافت نشد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredTeachers)}
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <RoomsPanel rooms={rooms} timetable={timetable} onSave={saveRoom} onDelete={(id) => deleteSchedulingItem(id, 'room')} />
        )}

        {/* 4. COURSES VIEW */}
        {activeTab === 'courses' && (
          <div className="records-view space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو در دوره‌ها و سطوح..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => setModalType('add_course')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                id="btn-add-course"
              >
                <Plus className="w-4 h-4" />
                دوره آموزشی جدید
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">شناسه</th>
                      <th className="p-4">نام کلاسی دوره</th>
                      <th className="p-4">استاد پیش‌فرض</th>
                      <th className="p-4">مدت زمان حدودی</th>
                      <th className="p-4">شهریه ماهانه</th>
                      <th className="p-4">سطح علمی</th>
                      <th className="p-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredCourses).map((course) => (
                      <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{course.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{course.name}</td>
                        <td className="p-4 font-semibold text-slate-600">{getTeacherName(course.teacherId)}</td>
                        <td className="p-4 font-mono font-bold text-slate-500">{course.duration}</td>
                        <td className="p-4 font-mono text-emerald-600 font-semibold">{formatCurrency(course.monthlyFee)}</td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-bold font-sans">
                            {course.level}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(course, 'edit_course')}
                            aria-label="Edit course"
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(course.id, 'course')}
                            aria-label="Delete course"
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCourses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">دوره آموزشی ثبت شده یافت نشد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredCourses)}
            </div>
          </div>
        )}

        {/* 5. PAYMENTS VIEW */}
        {activeTab === 'payments' && (
          <div className="records-view space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو در قبوض با نام دانشجو..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => setModalType('add_payment')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                id="btn-add-payment"
              >
                <Plus className="w-4 h-4" />
                ثبت پرداخت جدید
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">شماره رسید</th>
                      <th className="p-4">نام دانشجو</th>
                      <th className="p-4">ماه مالی مربوطه</th>
                      <th className="p-4">مبلغ کل شهریه</th>
                      <th className="p-4">پرداختی دانشجو</th>
                      <th className="p-4">باقیمانده حساب</th>
                      <th className="p-4 font-mono">تاریخ پرداخت</th>
                      <th className="p-4">وضعیت رسید</th>
                      <th className="p-4 text-center">عملیات مالی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredPayments).map((pay) => (
                      <tr key={pay.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-600">{pay.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{getStudentName(pay.studentId)}</td>
                        <td className="p-4 font-semibold text-slate-600">{pay.month}</td>
                        <td className="p-4 font-mono text-slate-500">{formatCurrency(pay.totalAmount)}</td>
                        <td className="p-4 font-mono text-emerald-600 font-bold">{formatCurrency(pay.paidAmount)}</td>
                        <td className="p-4 font-mono text-rose-600 font-bold">{formatCurrency(pay.remainingAmount)}</td>
                        <td className="p-4 font-mono">{formatDisplayDate(pay.paymentDate)}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              pay.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600'
                                : pay.status === 'partial'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {pay.status === 'completed' ? 'تصفیه کامل' : pay.status === 'partial' ? 'علی‌الحساب' : 'بدهکار'}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(pay, 'edit_payment')}
                            aria-label="Edit payment"
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(pay.id, 'payment')}
                            aria-label="Delete payment"
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400 font-semibold">هیچ رسید پرداختی یافت نشد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredPayments)}
            </div>
          </div>
        )}

        {/* 6. EXPENSES VIEW */}
        {activeTab === 'expenses' && (
          <div className="records-view space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو در مصارف و هزینه‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => setModalType('add_expense')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                id="btn-add-expense"
              >
                <Plus className="w-4 h-4" />
                ثبت مصرف جدید
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">شناسه</th>
                      <th className="p-4">عنوان هزینه کلاسی/دفتری</th>
                      <th className="p-4">دسته‌بندی مربوطه</th>
                      <th className="p-4">مبلغ هزینه‌کرد</th>
                      <th className="p-4 font-mono">تاریخ وقوع</th>
                      <th className="p-4">پرداختی به شخص</th>
                      <th className="p-4">توضیحات تکمیلی</th>
                      <th className="p-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredExpenses).map((exp) => (
                      <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{exp.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{exp.title}</td>
                        <td className="p-4"><span className="inline-flex rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">{exp.category}</span></td>
                        <td className="p-4 font-mono text-rose-600 font-bold">{formatCurrency(exp.amount)}</td>
                        <td className="p-4 font-mono">{formatDisplayDate(exp.date)}</td>
                        <td className="p-4 font-semibold text-slate-600">{exp.paidTo}</td>
                        <td className="p-4 text-slate-400 text-xs italic">{exp.description || 'بدون توضیح دفتری'}</td>
                        <td className="p-4 flex items-center justify-center gap-1.5">
                          <button onClick={() => handleOpenEdit(exp, 'edit_expense')} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition" title="ویرایش مصرف">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(exp.id, 'expense')}
                            aria-label="Delete expense"
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-semibold">تراکنش مصرف مخارج ثبت شده موجود نیست.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredExpenses)}
            </div>
          </div>
        )}

        {/* 7. INCOMES VIEW */}
        {activeTab === 'incomes' && (
          <div className="records-view space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو در درآمدهای متفرقه..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => setModalType('add_income')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                id="btn-add-income"
              >
                <Plus className="w-4 h-4" />
                ثبت درآمد جدید
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">شناسه</th>
                      <th className="p-4">عنوان و موضوع درآمد</th>
                      <th className="p-4">منبع تأمین وجه</th>
                      <th className="p-4">مبلغ کل دریافتی</th>
                      <th className="p-4 font-mono">تاریخ دریافت</th>
                      <th className="p-4">توضیحات دفتری</th>
                      <th className="p-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredIncomes).map((inc) => (
                      <tr key={inc.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{inc.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{inc.title}</td>
                        <td className="p-4"><span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">{inc.source}</span></td>
                        <td className="p-4 font-mono text-emerald-600 font-bold">{formatCurrency(inc.amount)}</td>
                        <td className="p-4 font-mono">{formatDisplayDate(inc.date)}</td>
                        <td className="p-4 text-slate-400 text-xs italic">{inc.description || 'بدون توضیح دفتری'}</td>
                        <td className="p-4 flex items-center justify-center gap-1.5">
                          <button onClick={() => handleOpenEdit(inc, 'edit_income')} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition" title="ویرایش درآمد">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(inc.id, 'income')}
                            aria-label="Delete income"
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredIncomes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">هیچ درآمد غیرشهریه‌ای ثبت نشده است.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredIncomes)}
            </div>
          </div>
        )}

        {/* 8. EXAMS VIEW */}
        {activeTab === 'exams' && (
          <div className="records-view space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder={'\u062c\u0633\u062a\u062c\u0648 \u062f\u0631 \u0646\u0627\u0645 \u0622\u0632\u0645\u0648\u0646 \u06cc\u0627 ID \u0634\u0634\u200c\u0631\u0642\u0645\u06cc...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => setModalType('add_exam')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                id="btn-add-exam"
              >
                <Plus className="w-4 h-4" />
                {'\u062f\u0631\u062c \u0622\u0632\u0645\u0648\u0646'}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">ID</th>
                      <th className="p-4">{'\u0646\u0627\u0645 \u0622\u0632\u0645\u0648\u0646'}</th>
                      <th className="p-4">{'\u062a\u0627\u0631\u06cc\u062e'}</th>
                      <th className="p-4 text-center">{'\u062a\u0639\u062f\u0627\u062f \u0627\u0645\u062a\u062d\u0627\u0646\u200c\u062f\u0647\u0646\u062f\u06af\u0627\u0646'}</th>
                      <th className="p-4 text-center">{'\u0648\u0636\u0639\u06cc\u062a \u062f\u0627\u0646\u0634\u062c\u0648\u06cc\u0627\u0646'}</th>
                      <th className="p-4 text-center">{'\u0639\u0645\u0644\u06cc\u0627\u062a'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredExams).map((ex) => {
                      const completedCount = results.filter((result) => result.examId === ex.id && students.some((student) => student.id === result.studentId)).length;
                      const plannedCount = ex.studentCount || 0;
                      return (
                        <tr key={ex.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-extrabold font-mono text-blue-700">{getExamPrintId(ex.id)}</td>
                          <td className="p-4 font-extrabold text-slate-800">{ex.title}</td>
                          <td className="p-4 font-bold font-mono text-slate-600">{formatDisplayDate(ex.date)}</td>
                          <td className="p-4 text-center font-bold text-slate-600">{toPersianDigits(plannedCount)}</td>
                          <td className="p-4 text-center font-bold text-slate-600">
                            {toPersianDigits(completedCount)} / {toPersianDigits(plannedCount)}
                          </td>
                          <td className="p-4 flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedExamId(ex.id);
                                setActiveTab('results');
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg cursor-pointer"
                            >
                              {'\u0646\u0645\u0627\u06cc\u0634 \u0648\u0636\u0639\u06cc\u062a \u062f\u0627\u0646\u0634\u062c\u0648\u06cc\u0627\u0646 \u0627\u06cc\u0646 \u0622\u0632\u0645\u0648\u0646'}
                            </button>
                            <button
                              onClick={() => handleDeleteEntity(ex.id, 'exam')}
                            aria-label="Delete exam"
                              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredExams.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold">{'\u0647\u06cc\u0686 \u0622\u0632\u0645\u0648\u0646\u06cc \u062f\u0631\u062c \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredExams)}
            </div>
          </div>
        )}

        {/* 9. EXAM RESULTS VIEW */}
        {activeTab === 'results' && !selectedExam && (
          <div className="records-view space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder={'\u062c\u0633\u062a\u062c\u0648 \u062f\u0631 \u0646\u0627\u0645 \u0622\u0632\u0645\u0648\u0646 \u06cc\u0627 ID...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800">{'\u0622\u0632\u0645\u0648\u0646\u200c\u0647\u0627\u06cc \u0622\u0645\u0627\u062f\u0647 \u0628\u0631\u0627\u06cc \u062b\u0628\u062a \u0646\u0645\u0631\u0627\u062a'}</h2>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">ID</th>
                      <th className="p-4">{'\u0646\u0627\u0645 \u0622\u0632\u0645\u0648\u0646'}</th>
                      <th className="p-4">{'\u062a\u0627\u0631\u06cc\u062e'}</th>
                      <th className="p-4 text-center">{'\u062a\u0639\u062f\u0627\u062f \u0627\u0645\u062a\u062d\u0627\u0646\u200c\u062f\u0647\u0646\u062f\u06af\u0627\u0646'}</th>
                      <th className="p-4 text-center">{'\u062a\u0639\u062f\u0627\u062f \u0646\u0645\u0631\u0627\u062a \u062b\u0628\u062a\u200c\u0634\u062f\u0647'}</th>
                      <th className="p-4 text-center">{'\u0639\u0645\u0644\u06cc\u0627\u062a'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredExams).map((exam) => (
                      <tr key={exam.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-extrabold font-mono text-blue-700">{getExamPrintId(exam.id)}</td>
                        <td className="p-4 font-extrabold text-slate-800">{exam.title}</td>
                        <td className="p-4 font-bold font-mono text-slate-600">{formatDisplayDate(exam.date)}</td>
                        <td className="p-4 text-center font-bold text-slate-600">{toPersianDigits(exam.studentCount || 0)}</td>
                        <td className="p-4 text-center font-bold text-slate-600">{toPersianDigits(results.filter((result) => result.examId === exam.id && students.some((student) => student.id === result.studentId)).length)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedExamId(exam.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg cursor-pointer"
                          >
                            {'\u062b\u0628\u062a \u0646\u0645\u0631\u0627\u062a \u062f\u0627\u0646\u0634\u062c\u0648\u06cc\u0627\u0646'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredExams.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-semibold">{'\u0622\u0632\u0645\u0648\u0646\u06cc \u0628\u0631\u0627\u06cc \u062b\u0628\u062a \u0646\u0645\u0631\u0627\u062a \u06cc\u0627\u0641\u062a \u0646\u0634\u062f.'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredExams)}
            </div>
          </div>
        )}

        {activeTab === 'results' && selectedExam && (
          <div className="records-view space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
              <button
                onClick={() => setSelectedExamId(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition"
              >
                {'\u0628\u0627\u0632\u06af\u0634\u062a \u0628\u0647 \u0644\u06cc\u0633\u062a \u0622\u0632\u0645\u0648\u0646\u200c\u0647\u0627'}
              </button>
              <div className="text-right">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-800">{selectedExam.title}</h2>
                <p className="text-xs font-bold text-blue-700 font-mono mt-1">ID: {getExamPrintId(selectedExam.id)}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  {'\u062a\u0627\u0631\u06cc\u062e'}: {formatDisplayDate(selectedExam.date)} {' - '} {'\u062a\u0639\u062f\u0627\u062f \u0627\u0645\u062a\u062d\u0627\u0646\u200c\u062f\u0647\u0646\u062f\u06af\u0627\u0646'}: {toPersianDigits(selectedExam.studentCount || 0)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-4">{'\u0646\u0627\u0645 \u062f\u0627\u0646\u0634\u062c\u0648'}</th>
                      <th className="p-4">{'\u0646\u0645\u0631\u0647'}</th>
                      <th className="p-4">{'\u062f\u0631\u062c\u0647'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedExamStudents.map((student) => {
                      const result = getStudentExamResult(selectedExam.id, student.id);
                      return (
                        <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-extrabold text-slate-800">{student.firstName} {student.lastName}</td>
                          <td className="p-4">
                            <input
                              type="text"
                              inputMode="decimal"
                              min="0"
                              max="100"
                              value={result?.score ?? ''}
                              onChange={(event) => {
                                const normalized = event.target.value
                                  .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - '۰'.charCodeAt(0)))
                                  .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)));
                                const score = Number(normalized || 0);
                                if (Number.isFinite(score)) handleSaveStudentExamResult(selectedExam.id, student.id, { score });
                              }}
                              className="w-28 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-right font-mono"
                            />
                          </td>
                          <td className="p-4">
                            <span className="inline-flex w-14 h-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-extrabold border border-blue-100">
                              {result ? getGradeFromScore(result.score) : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {selectedExamStudents.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-400 font-semibold">{'\u062f\u0627\u0646\u0634\u062c\u0648\u06cc\u06cc \u0628\u0631\u0627\u06cc \u0627\u06cc\u0646 \u0622\u0632\u0645\u0648\u0646 \u06cc\u0627\u0641\u062a \u0646\u0634\u062f.'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 text-xs font-bold text-slate-500 text-right">
                {'\u062a\u0639\u062f\u0627\u062f \u0646\u0645\u0631\u0627\u062a \u062b\u0628\u062a\u200c\u0634\u062f\u0647'}: {toPersianDigits(selectedExamResults.length)}
              </div>
            </div>
          </div>
        )}

        {/* 10. BACKUP VIEW */}
        {activeTab === 'backup' && (
          <div className="workspace-content">
          <BackupPanel
            apiClient={apiClient}
            onRestoreComplete={reloadAppData}
          />
        </div>
        )}

        {/* 10. REPORTS VIEW */}
        {activeTab === 'reports' && (
          <div className="workspace-content">
          <ReportsPanel
            onExcelImport={importExcelRows}
            students={students}
            teachers={teachers}
            courses={courses}
            payments={payments}
            expenses={expenses}
            incomes={incomes}
            exams={exams}
            results={results}
          />
        </div>
        )}

        {/* --- FOOTER COPYRIGHT INFO --- */}
        <footer className={`mt-12 text-center text-slate-600 text-xs font-bold py-4 border-t border-slate-200/50 no-print ${activeTab === 'dashboard' ? 'dashboard-footer' : isRecordsView ? 'records-footer' : 'workspace-footer'}`}>
          <p>{'\u00a9 \u06f1\u06f4\u06f0\u06f5 \u0622\u06a9\u0627\u062f\u0645\u06cc \u0646\u0627\u0648\u0646\u062f. \u067e\u06cc\u0627\u062f\u0647\u200c\u0633\u0627\u0632\u06cc \u0628\u0631\u0627\u06cc \u0645\u062f\u06cc\u0631\u06cc\u062a \u062f\u0633\u06a9\u062a\u0627\u067e \u0622\u0641\u0644\u0627\u06cc\u0646.'}</p>
        </footer>
      </main>

      {/* --- REUSABLE ENTITY FORM INPUT MODAL --- */}
      <EntityModal
        isOpen={modalType !== null}
        onClose={() => {
          setModalType(null);
          setEditingEntity(null);
        }}
        type={modalType}
        initialData={editingEntity}
        onSave={handleSaveModal}
        extraData={{
          courses,
          teachers,
          students,
          exams,
        }}
      />

      {authUser && isCredentialsModalOpen && (
        <CredentialsModal
          user={authUser}
          onClose={() => setIsCredentialsModalOpen(false)}
          onUpdated={setAuthUser}
        />
      )}

      {/* --- ACADEMIC DETAILED PROFILE OVERVIEW MODAL --- */}
      {studentDetailEntity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="entity-modal-card bg-white w-full max-w-md overflow-hidden animate-scale-up text-right" role="dialog" aria-modal="true" aria-labelledby="student-detail-title">
            <div className="entity-modal-header p-4 bg-white text-slate-800 flex justify-between items-center border-b border-slate-100">
              <button
                onClick={() => setStudentDetailEntity(null)}
                className="icon-button p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition" aria-label="Close student details"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 id="student-detail-title" className="font-extrabold text-sm sm:text-base">کارنامه تحصیلی دانشجوی آکادمی ناوند</h3>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="flex justify-center border-b border-slate-100 pb-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 font-extrabold text-xl flex items-center justify-center border-2 border-white shadow-md">
                  {studentDetailEntity.firstName[0]}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 text-slate-700">
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-0.5">نام کامل</span>
                  <span className="font-extrabold">{studentDetailEntity.firstName} {studentDetailEntity.lastName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-0.5">نام پدر</span>
                  <span className="font-semibold">{studentDetailEntity.fatherName || '--'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 text-slate-700">
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-0.5">تلفن همراه</span>
                  <span className="font-mono text-left font-semibold" dir="ltr">{studentDetailEntity.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-0.5">تاریخ ثبت نام</span>
                  <span className="font-mono">{formatDisplayDate(studentDetailEntity.joinDate)}</span>
                  <p className="mt-2 text-xs text-slate-500">فیس ماهانه: {formatCurrency(studentDetailEntity.monthlyFee || 0)}</p>
                  <p className="mt-1 text-xs text-slate-500">آخرین پرداخت: {formatDisplayDate(studentDetailEntity.lastPaymentDate || '')}</p>
                  <p className="mt-1 text-xs font-bold text-amber-700">پرداخت بعدی: {formatDisplayDate(studentDetailEntity.nextPaymentDate || '')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 text-slate-700">
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-0.5">کلاس ثبت نامی</span>
                  <span className="font-bold text-blue-700">{getCourseName(studentDetailEntity.courseId)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-0.5">حق شهریه مصوب</span>
                  <span className="font-mono text-emerald-600 font-bold">{formatCurrency(studentDetailEntity.feePaid)}</span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setStudentDetailEntity(null)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition cursor-pointer"
                >
                  بستن پرونده
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
