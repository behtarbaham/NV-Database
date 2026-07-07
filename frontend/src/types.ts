export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  phone: string;
  courseId: string;
  joinDate: string;
  feePaid: number;
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
}

export interface ExamResult {
  id: string;
  studentId: string;
  examId: string;
  score: number;
  grade: string;
  description: string;
}

export type SidebarTab =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'courses'
  | 'payments'
  | 'expenses'
  | 'incomes'
  | 'exams'
  | 'results'
  | 'reports';
