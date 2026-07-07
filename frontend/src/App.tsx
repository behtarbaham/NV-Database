/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
  Award,
  Calendar,
  AlertCircle
} from 'lucide-react';

import {
  Student,
  Teacher,
  Course,
  Payment,
  Expense,
  Income,
  Exam,
  ExamResult,
  SidebarTab
} from './types';

import {
  INITIAL_TEACHERS,
  INITIAL_COURSES,
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_INCOMES,
  INITIAL_EXAMS,
  INITIAL_RESULTS
} from './data';

import {
  formatCurrency,
  toPersianDigits,
  generateId,
  getTodayJalali,
  getCurrentTerm
} from './utils';

import { Sidebar } from './components/Sidebar';
import { EntityModal } from './components/Modals';
import { MonthlyFinanceChart, CourseDistributionChart } from './components/Charts';
import { ReportsPanel } from './components/ReportsPanel';

type AppData = {
  students: Student[];
  teachers: Teacher[];
  courses: Course[];
  payments: Payment[];
  expenses: Expense[];
  incomes: Income[];
  exams: Exam[];
  results: ExamResult[];
};

declare global {
  interface Window {
    navandApi?: {
      getAppData: () => Promise<{ data: AppData | null; updatedAt: string | null }>;
      saveAppData: (data: AppData) => Promise<{ ok: boolean; data: AppData }>;
      createBackup: () => Promise<any>;
      listBackups: () => Promise<any>;
      restoreBackup: (backupPath: string) => Promise<any>;
    };
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';
const apiClient = {
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
};

const hasAppDataRecords = (data: AppData | null) => {
  if (!data) return false;

  return Object.values(data).some((items) => items.length > 0);
};

export default function App() {
  // --- OFFLINE DATA PERSISTENCE STATE ---
  const [students, setStudents] = useState<Student[]>(() => {
    const data = localStorage.getItem('navand_students');
    return data ? JSON.parse(data) : INITIAL_STUDENTS;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const data = localStorage.getItem('navand_teachers');
    return data ? JSON.parse(data) : INITIAL_TEACHERS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    const data = localStorage.getItem('navand_courses');
    return data ? JSON.parse(data) : INITIAL_COURSES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const data = localStorage.getItem('navand_payments');
    return data ? JSON.parse(data) : INITIAL_PAYMENTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const data = localStorage.getItem('navand_expenses');
    return data ? JSON.parse(data) : INITIAL_EXPENSES;
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    const data = localStorage.getItem('navand_incomes');
    return data ? JSON.parse(data) : INITIAL_INCOMES;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const data = localStorage.getItem('navand_exams');
    return data ? JSON.parse(data) : INITIAL_EXAMS;
  });

  const [results, setResults] = useState<ExamResult[]>(() => {
    const data = localStorage.getItem('navand_results');
    return data ? JSON.parse(data) : INITIAL_RESULTS;
  });

  const [isDatabaseLoaded, setIsDatabaseLoaded] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<'loading' | 'connected' | 'saving' | 'error'>('loading');
  const [databaseError, setDatabaseError] = useState<string | null>(null);


  useEffect(() => {
    let isMounted = true;

    const loadAppData = async () => {
      try {
        setDatabaseStatus('loading');
        const response = await apiClient.getAppData();
        const data = response.data;

        if (!isMounted) return;

        if (hasAppDataRecords(data)) {
          setStudents(data.students);
          setTeachers(data.teachers);
          setCourses(data.courses);
          setPayments(data.payments);
          setExpenses(data.expenses);
          setIncomes(data.incomes);
          setExams(data.exams);
          setResults(data.results);
        }

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
          students,
          teachers,
          courses,
          payments,
          expenses,
          incomes,
          exams,
          results,
        });
        setDatabaseStatus('connected');
        setDatabaseError(null);
      } catch (error) {
        setDatabaseStatus('error');
        setDatabaseError('Could not save app data to SQLite. Check the desktop backend service.');
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [courses, exams, expenses, incomes, isDatabaseLoaded, payments, results, students, teachers]);

  // Sync with LocalStorage
  useEffect(() => { localStorage.setItem('navand_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('navand_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('navand_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('navand_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('navand_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('navand_incomes', JSON.stringify(incomes)); }, [incomes]);
  useEffect(() => { localStorage.setItem('navand_exams', JSON.stringify(exams)); }, [exams]);
  useEffect(() => { localStorage.setItem('navand_results', JSON.stringify(results)); }, [results]);

  // --- LIVE CALENDAR (auto-updates so the shown date is always today) ---
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    // Refresh hourly; the header always reflects the real current day/term.
    const intervalId = window.setInterval(() => setToday(new Date()), 60 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);
  const todayLabel = getTodayJalali(today);
  const termLabel = getCurrentTerm(today);

  // --- INTERACTION STATE ---
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
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

  // Default User State
  const [currentUser, setCurrentUser] = useState({
    name: 'سید فیاض ملک‌زی',
    role: 'مدیر ارشد آکادمی',
    email: 'fayazmalikzai055@gmail.com',
  });

  // Handle resets
  const handleLogout = () => {
    if (confirm('آیا مایل به ریست کردن مجدد پایگاه‌داده آکادمی ناوند به حالت آزمایشی اولیه هستید؟')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Reset pagination on tab change
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
    setSortField('');
    setSortDirection('asc');
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

  // Dynamic Chart 1: Group Month totals
  const monthlyFinanceData = [
    {
      month: 'فروردین ۱۴۰۵',
      income: 1800000 + 6800000,
      expense: 5500000,
    },
    {
      month: 'اردیبهشت ۱۴۰۵',
      income: 4200000 + 4000000,
      expense: 3000000 + 1800000,
    },
    {
      month: 'خرداد ۱۴۰۵',
      income: totalTuitionRevenue,
      expense: totalExpensesCombined,
    },
  ];

  // Dynamic Chart 2: Student distribution grouped by courses
  const colorsArray = ['#1A73E8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
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
    return s ? `${s.firstName} ${s.lastName}` : 'هنرجوی شماره ' + id;
  };
  const getExamTitle = (id: string) => exams.find((e) => e.id === id)?.title || 'آزمون عمومی';

  // --- CRUD DISPATCH ACTION OPERATORS ---
  const handleSaveModal = (data: any) => {
    if (!modalType) return;

    if (modalType.startsWith('add_')) {
      const target = modalType.replace('add_', '');
      const newId = generateId(
        target === 'student' ? 'S' : target === 'teacher' ? 'T' : target === 'course' ? 'C' : target === 'payment' ? 'PAY' : target === 'expense' ? 'EXP' : target === 'income' ? 'INC' : target === 'exam' ? 'EXM' : 'RES'
      );
      const withIdObj = { ...data, id: newId };

      if (target === 'student') setStudents([withIdObj, ...students]);
      if (target === 'teacher') setTeachers([withIdObj, ...teachers]);
      if (target === 'course') setCourses([withIdObj, ...courses]);
      if (target === 'payment') setPayments([withIdObj, ...payments]);
      if (target === 'expense') setExpenses([withIdObj, ...expenses]);
      if (target === 'income') setIncomes([withIdObj, ...incomes]);
      if (target === 'exam') setExams([withIdObj, ...exams]);
      if (target === 'result') setResults([withIdObj, ...results]);
    } else if (modalType.startsWith('edit_')) {
      const target = modalType.replace('edit_', '');

      if (target === 'student') setStudents(students.map((x) => (x.id === data.id ? data : x)));
      if (target === 'teacher') setTeachers(teachers.map((x) => (x.id === data.id ? data : x)));
      if (target === 'course') setCourses(courses.map((x) => (x.id === data.id ? data : x)));
      if (target === 'payment') setPayments(payments.map((x) => (x.id === data.id ? data : x)));
    }

    setModalType(null);
    setEditingEntity(null);
  };

  const handleDeleteEntity = (id: string, target: 'student' | 'teacher' | 'course' | 'payment' | 'expense' | 'income' | 'exam' | 'result') => {
    if (!confirm('آیا از حذف دائم این آیتم اطمینان کامل دارید؟ این عمل غیرقابل بازگشت است.')) return;

    if (target === 'student') setStudents(students.filter((x) => x.id !== id));
    if (target === 'teacher') setTeachers(teachers.filter((x) => x.id !== id));
    if (target === 'course') setCourses(courses.filter((x) => x.id !== id));
    if (target === 'payment') setPayments(payments.filter((x) => x.id !== id));
    if (target === 'expense') setExpenses(expenses.filter((x) => x.id !== id));
    if (target === 'income') setIncomes(incomes.filter((x) => x.id !== id));
    if (target === 'exam') setExams(exams.filter((x) => x.id !== id));
    if (target === 'result') setResults(results.filter((x) => x.id !== id));
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
      const query = searchQuery.toLowerCase();
      return title.includes(query) || course.includes(query);
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

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex antialiased select-text cursor-default">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container Area */}
      <main
        className={`flex-grow min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 ${
          isSidebarCollapsed ? 'mr-[70px]' : 'mr-[240px]'
        }`}
      >
        {/* UPPER HEADER BAR */}
        <header className="h-16 flex items-center justify-between border-b border-slate-200/60 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center font-bold text-sm">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right">
              <h2 className="text-sm sm:text-base font-black text-slate-800">{termLabel}</h2>
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold block mt-0.5">امروز: {todayLabel}</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span
              className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border inline-block font-sans ${
                databaseStatus === 'connected'
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                  : databaseStatus === 'saving' || databaseStatus === 'loading'
                  ? 'text-amber-600 bg-amber-50 border-amber-100'
                  : 'text-rose-600 bg-rose-50 border-rose-100'
              }`}
              title={databaseError || 'SQLite database sync status'}
            >
              SQLite {databaseStatus}
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A73E8] bg-blue-55 px-2.5 py-1 rounded-full border border-blue-500/10 inline-block font-sans animate-pulse">
              پیشخوان مدیریت دسکتاپ آفلاین
            </span>
            {databaseError && (
              <p className="text-[10px] text-rose-600 font-bold max-w-[260px]">
                {databaseError}
              </p>
            )}
          </div>
        </header>

        {/* COMPONENT BODY RENDERING BASED ON VIEW-STATE */}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">هنرجویان ثبت‌نام شده</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-1">
                    {toPersianDigits(totalStudents)} نفر
                  </p>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    {toPersianDigits(activeStudents)} فعال
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-55 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">اساتید و کادر آموزشی</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-1">
                    {toPersianDigits(totalTeachers)} مدرس
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    {toPersianDigits(teachers.filter(t => t.isActive).length)} همکار فعال
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">مجموع درآمدهای آکادمی</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono mt-1 text-emerald-600">
                    {formatCurrency(totalRevenueCombined)}
                  </p>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    شهریه + مصارف نشری
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400">سود خالص عملیاتی</span>
                  <p className={`text-xl sm:text-2xl font-black font-mono mt-1 ${balanceNetProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {formatCurrency(balanceNetProfit)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                    منهای هزینه‌کردهای دفتری
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-55 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* 2 Graphical Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyFinanceChart data={monthlyFinanceData} />
              <CourseDistributionChart data={courseDistributions} />
            </div>

            {/* Recent Payments Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
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
                <table className="w-full text-xs sm:text-sm text-right text-slate-755">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-3">شماره رسید</th>
                      <th className="p-3">هنرجو</th>
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
                        <td className="p-3 font-bold font-mono text-slate-855">{pay.id}</td>
                        <td className="p-3 font-semibold">{getStudentName(pay.studentId)}</td>
                        <td className="p-3">{pay.month}</td>
                        <td className="p-3 font-mono text-slate-500">{formatCurrency(pay.totalAmount)}</td>
                        <td className="p-3 font-mono text-emerald-600 font-semibold">{formatCurrency(pay.paidAmount)}</td>
                        <td className="p-3 font-mono text-rose-600 font-semibold">{formatCurrency(pay.remainingAmount)}</td>
                        <td className="p-3 font-mono">{toPersianDigits(pay.paymentDate)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              pay.status === 'completed'
                                ? 'bg-emerald-55 text-emerald-600'
                                : pay.status === 'partial'
                                ? 'bg-amber-55 text-amber-600'
                                : 'bg-rose-55 text-rose-600'
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
          <div className="space-y-4">
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
                  دانش‌آموز جدید
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase select-none">
                      <th className="p-4 cursor-pointer" onClick={() => changeSort('id')}>شناسه ردیف <ArrowUpDown className="w-3 h-3 inline-block" /></th>
                      <th className="p-4 cursor-pointer" onClick={() => changeSort('firstName')}>نام <ArrowUpDown className="w-3 h-3 inline-block" /></th>
                      <th className="p-4 cursor-pointer" onClick={() => changeSort('lastName')}>تخلص <ArrowUpDown className="w-3 h-3 inline-block" /></th>
                      <th className="p-4">نام پدر</th>
                      <th className="p-4">تلفن تماس</th>
                      <th className="p-4">دوره مربوطه</th>
                      <th className="p-4 font-mono">تاریخ ورود</th>
                      <th className="p-4 cursor-pointer" onClick={() => changeSort('feePaid')}>شهریه پرداختی <ArrowUpDown className="w-3 h-3 inline-block" /></th>
                      <th className="p-4">وضعیت</th>
                      <th className="p-4 text-center">عملیات دفتری</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredStudents).map((stud) => (
                      <tr key={stud.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{stud.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{stud.firstName}</td>
                        <td className="p-4 font-semibold">{stud.lastName}</td>
                        <td className="p-4 text-slate-500">{stud.fatherName || '--'}</td>
                        <td className="p-4 font-mono text-left" dir="ltr">{stud.phone}</td>
                        <td className="p-4 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg w-max max-w-[120px] truncate">{getCourseName(stud.courseId)}</td>
                        <td className="p-4 font-mono">{toPersianDigits(stud.joinDate)}</td>
                        <td className="p-4 font-mono text-emerald-600 font-semibold">{formatCurrency(stud.feePaid)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${stud.isActive ? 'bg-emerald-55 text-emerald-600' : 'bg-red-55 text-red-600'}`}>
                            {stud.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-1.5 h-max">
                          <button
                            onClick={() => setStudentDetailEntity(stud)}
                            className="p-1.5 rounded-lg text-slate-500 bg-slate-50 hover:bg-slate-100 transition"
                            title="مشاهده پرونده کامل"
                          >
                            <Eye className="w-3.8 h-3.8" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(stud, 'edit_student')}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                            title="ویرایش مشخصات"
                          >
                            <Edit className="w-3.8 h-3.8" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(stud.id, 'student')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                            title="حذف پرونده"
                          >
                            <Trash2 className="w-3.8 h-3.8" />
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
          <div className="space-y-4">
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
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-4">شناسه ردیف</th>
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
                        <td className="p-4 font-mono text-[#1A73E8] font-semibold">{formatCurrency(teach.salary)}</td>
                        <td className="p-4 font-mono">{toPersianDigits(teach.hireDate)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${teach.isActive ? 'bg-emerald-55 text-emerald-600' : 'bg-red-55 text-red-600'}`}>
                            {teach.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-1.5 my-auto">
                          <button
                            onClick={() => handleOpenEdit(teach, 'edit_teacher')}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            <Edit className="w-3.8 h-3.8" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(teach.id, 'teacher')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-3.8 h-3.8" />
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

        {/* 4. COURSES VIEW */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
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
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-4">شناسه ردیف</th>
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
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            <Edit className="w-3.8 h-3.8" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(course.id, 'course')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-3.8 h-3.8" />
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
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو در قبوض با نام هنرجو..."
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
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-4">شماره رسید</th>
                      <th className="p-4">نام دانش‌آموز</th>
                      <th className="p-4">ماه مالی مربوطه</th>
                      <th className="p-4">مبلغ کل شهریه</th>
                      <th className="p-4">پرداختی هنرجو</th>
                      <th className="p-4">باقیمانده حساب</th>
                      <th className="p-4 font-mono">تاریخ پرداخت</th>
                      <th className="p-4">وضعیت رسید</th>
                      <th className="p-4 text-center">عملیات مالی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredPayments).map((pay) => (
                      <tr key={pay.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-550">{pay.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{getStudentName(pay.studentId)}</td>
                        <td className="p-4 font-semibold text-slate-600">{pay.month}</td>
                        <td className="p-4 font-mono text-slate-500">{formatCurrency(pay.totalAmount)}</td>
                        <td className="p-4 font-mono text-emerald-600 font-bold">{formatCurrency(pay.paidAmount)}</td>
                        <td className="p-4 font-mono text-rose-600 font-bold">{formatCurrency(pay.remainingAmount)}</td>
                        <td className="p-4 font-mono">{toPersianDigits(pay.paymentDate)}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              pay.status === 'completed'
                                ? 'bg-emerald-55 text-emerald-600'
                                : pay.status === 'partial'
                                ? 'bg-amber-55 text-amber-600'
                                : 'bg-rose-55 text-rose-600'
                            }`}
                          >
                            {pay.status === 'completed' ? 'تصفیه کامل' : pay.status === 'partial' ? 'علی‌الحساب' : 'بدهکار'}
                          </span>
                        </td>
                        <td className="p-4 flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(pay, 'edit_payment')}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          >
                            <Edit className="w-3.8 h-3.8" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntity(pay.id, 'payment')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-3.8 h-3.8" />
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
          <div className="space-y-4">
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
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
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
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-4">شناسه ردیف</th>
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
                        <td className="p-4 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-max">{exp.category}</td>
                        <td className="p-4 font-mono text-rose-600 font-bold">{formatCurrency(exp.amount)}</td>
                        <td className="p-4 font-mono">{toPersianDigits(exp.date)}</td>
                        <td className="p-4 font-semibold text-slate-650">{exp.paidTo}</td>
                        <td className="p-4 text-slate-400 text-xs italic">{exp.description || 'بدون توضیح دفتری'}</td>
                        <td className="p-4 flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteEntity(exp.id, 'expense')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-3.8 h-3.8" />
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
          <div className="space-y-4">
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
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
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
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-4">شناسه ردیف</th>
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
                        <td className="p-4 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg w-max">{inc.source}</td>
                        <td className="p-4 font-mono text-emerald-600 font-bold">{formatCurrency(inc.amount)}</td>
                        <td className="p-4 font-mono">{toPersianDigits(inc.date)}</td>
                        <td className="p-4 text-slate-400 text-xs italic">{inc.description || 'بدون توضیح دفتری'}</td>
                        <td className="p-4 flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteEntity(inc.id, 'income')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                          >
                            <Trash2 className="w-3.8 h-3.8" />
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
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو در آزمون‌های ترم تابستان..."
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
                ثبت آزمون رکوردی جدید
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-4">شناسه ردیف</th>
                      <th className="p-4">عنوان کلی آزمون</th>
                      <th className="p-4">مربوط به کلاس</th>
                      <th className="p-4">مدرس برگزارکننده</th>
                      <th className="p-4 font-mono">تاریخ برگزاری</th>
                      <th className="p-4">نمره کل (بارم)</th>
                      <th className="p-4 text-center">ثبت و رصد نمرات</th>
                      <th className="p-4 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredExams).map((ex) => {
                      const crs = courses.find(c => c.id === ex.courseId);
                      return (
                        <tr key={ex.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="p-4 font-bold font-mono text-slate-500">{ex.id}</td>
                          <td className="p-4 font-extrabold text-slate-800">{ex.title}</td>
                          <td className="p-4 font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg w-max">{getCourseName(ex.courseId)}</td>
                          <td className="p-4 text-slate-600 font-bold">{crs ? getTeacherName(crs.teacherId) : '--'}</td>
                          <td className="p-4 font-mono">{toPersianDigits(ex.date)}</td>
                          <td className="p-4 font-mono font-bold text-slate-800">{toPersianDigits(ex.totalScore)} نمره</td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setActiveTab('results');
                                setModalType('add_result');
                              }}
                              className="mx-auto block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold rounded-lg cursor-pointer"
                            >
                              ثبت کارنامه هنرجو
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteEntity(ex.id, 'exam')}
                              className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                            >
                              <Trash2 className="w-3.8 h-3.8" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredExams.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-semibold">هیچ آزمونی برنامه‌ریزی نشده است.</td>
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
        {activeTab === 'results' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام دانش‌آموز یا نمره..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => setModalType('add_result')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 flex items-center gap-1.5 transition text-xs sm:text-sm cursor-pointer"
                id="btn-add-result"
              >
                <Plus className="w-4 h-4" />
                ثبت نمره کلاسی
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right animate-scale-up">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-right text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-4">ردیف</th>
                      <th className="p-4">نام دانش‌آموز</th>
                      <th className="p-4">آزمون برگزار شده</th>
                      <th className="p-4">نمره مکتسبه (کسب شده)</th>
                      <th className="p-4">درجه ارزشیابی</th>
                      <th className="p-4">ملاحظات استاد هماهنگ</th>
                      <th className="p-4 text-center">عملیات دفتری</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedList(filteredResults).map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 font-bold font-mono text-slate-500">{r.id}</td>
                        <td className="p-4 font-extrabold text-slate-800">{getStudentName(r.studentId)}</td>
                        <td className="p-4 font-bold text-slate-600">{getExamTitle(r.examId)}</td>
                        <td className="p-4 font-mono font-black text-blue-700 text-sm">{toPersianDigits(r.score)} نمره</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold font-sans ${
                              r.grade === 'عالی'
                                ? 'bg-emerald-50 text-emerald-600'
                                : r.grade === 'خوب'
                                ? 'bg-blue-50 text-blue-600'
                                : r.grade === 'متوسط'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium italic text-xs">{r.description || 'ثبتی بر فیش ضمیمه نیست'}</td>
                        <td className="p-4 flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDeleteEntity(r.id, 'result')}
                            className="p-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredResults.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">هیچ کارنامه یا نمره‌ای ثبت نشده است.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWidget(filteredResults)}
            </div>
          </div>
        )}

        {/* 10. REPORTS VIEW */}
        {activeTab === 'reports' && (
          <ReportsPanel
            students={students}
            teachers={teachers}
            courses={courses}
            payments={payments}
            expenses={expenses}
            incomes={incomes}
          />
        )}

        {/* --- FOOTER COPYRIGHT INFO --- */}
        <footer className="mt-12 text-center text-slate-400 text-[10px] font-bold py-4 border-t border-slate-200/50 no-print">
          <p>© ۱۴۰۵ آکادمی آموزشی ناوند. پیاده‌سازی شده جهت کاربری دسکتاپ آفلاین به مدیریت فیاض ملک‌زی.</p>
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

      {/* --- ACADEMIC DETAILED PROFILE OVERVIEW MODAL --- */}
      {studentDetailEntity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up text-right">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <button
                onClick={() => setStudentDetailEntity(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-extrabold text-sm sm:text-base">کارنامه تحصیلی هنرجوی آکادمی ناوند</h3>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="flex justify-center border-b border-slate-100 pb-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 font-black text-xl flex items-center justify-center border-2 border-white shadow-md">
                  {studentDetailEntity.firstName[0]}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">نام کامل</span>
                  <span className="font-extrabold">{studentDetailEntity.firstName} {studentDetailEntity.lastName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">نام پدر</span>
                  <span className="font-semibold">{studentDetailEntity.fatherName || '--'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 text-slate-750">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">تلفن همراه</span>
                  <span className="font-mono text-left font-semibold" dir="ltr">{studentDetailEntity.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">تاریخ ثبت نام</span>
                  <span className="font-mono">{toPersianDigits(studentDetailEntity.joinDate)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 text-slate-750">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">کلاس ثبت نامی</span>
                  <span className="font-bold text-blue-700">{getCourseName(studentDetailEntity.courseId)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">حق شهریه مصوب</span>
                  <span className="font-mono text-emerald-600 font-bold">{formatCurrency(studentDetailEntity.feePaid)}</span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setStudentDetailEntity(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition cursor-pointer"
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

// Minimal placeholder component to satisfy compilation if X doesn't exist
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}



