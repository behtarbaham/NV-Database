export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  phone: string;
  courseId: string;
  joinDate: string;
  feePaid: number;
  monthlyFee?: number;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  isActive: boolean;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  name: string;
  teacherId: string;
  duration: string;
  monthlyFee: number;
  level: string;
}

export interface Payment {
  id: string; // شماره رسید
  studentId: string;
  month: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate: string;
  status: 'completed' | 'partial' | 'unpaid';
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  description: string;
}

export interface Income {
  id: string;
  title: string;
  source: string;
  amount: number;
  date: string;
  description: string;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  date: string;
  totalScore: number;
  studentCount: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  grade: string;
  description: string;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  createdAt?: string;
}

export interface BackupEntry {
  name: string;
  path: string;
  type: 'drive' | 'folder' | 'backup';
  size?: number;
  createdAt?: string;
}

export interface BackupDirectory {
  currentPath: string;
  parentPath: string | null;
  entries: BackupEntry[];
}

export type SidebarTab =
  | 'dashboard'
  | 'notifications'
  | 'classes'
  | 'students'
  | 'teachers'
  | 'courses'
  | 'payments'
  | 'expenses'
  | 'incomes'
  | 'exams'
  | 'results'
  | 'backup'
  | 'reports';

export interface Classroom {
  id: string;
  name: string;
}
export interface TimetableEntry {
  id: string;
  teacherId: string;
  courseId: string;
  roomId: string;
  startTime: string;
  endTime: string;
}
