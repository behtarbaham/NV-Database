import { AppError } from './errors.js';

const asArray = (value) => (Array.isArray(value) ? value : []);
const asString = (value, field, max = 255) => {
  if (typeof value !== 'string') throw new AppError(`${field} must be text`, 400, 'VALIDATION_ERROR');
  const trimmed = value.trim();
  if (trimmed.length > max) throw new AppError(`${field} is too long`, 400, 'VALIDATION_ERROR');
  return trimmed;
};
const asNumber = (value, field, min = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) throw new AppError(`${field} must be a valid number`, 400, 'VALIDATION_ERROR');
  return number;
};
const asBoolean = (value) => Boolean(value);
const validateId = (value, field = 'id') => asString(value, field, 50);

export const normalizeAppData = (data = {}) => ({
  students: asArray(data.students).map((item) => ({
    id: validateId(item.id),
    firstName: asString(item.firstName, 'firstName', 100),
    lastName: asString(item.lastName, 'lastName', 100),
    fatherName: asString(item.fatherName || '', 'fatherName', 100),
    phone: asString(item.phone, 'phone', 50),
    courseId: validateId(item.courseId, 'courseId'),
    joinDate: asString(item.joinDate || '', 'joinDate', 50),
    feePaid: asNumber(item.feePaid, 'feePaid'),
    isActive: asBoolean(item.isActive),
  })),
  teachers: asArray(data.teachers).map((item) => ({
    id: validateId(item.id),
    firstName: asString(item.firstName, 'firstName', 100),
    lastName: asString(item.lastName, 'lastName', 100),
    specialty: asString(item.specialty, 'specialty', 255),
    phone: asString(item.phone || '', 'phone', 50),
    salary: asNumber(item.salary, 'salary'),
    hireDate: asString(item.hireDate || '', 'hireDate', 50),
    isActive: asBoolean(item.isActive),
  })),
  courses: asArray(data.courses).map((item) => ({
    id: validateId(item.id),
    name: asString(item.name, 'name', 255),
    teacherId: validateId(item.teacherId, 'teacherId'),
    duration: asString(item.duration || '', 'duration', 100),
    monthlyFee: asNumber(item.monthlyFee, 'monthlyFee'),
    level: asString(item.level || '', 'level', 100),
  })),
  payments: asArray(data.payments).map((item) => ({
    id: validateId(item.id),
    studentId: validateId(item.studentId, 'studentId'),
    month: asString(item.month || '', 'month', 100),
    totalAmount: asNumber(item.totalAmount, 'totalAmount'),
    paidAmount: asNumber(item.paidAmount, 'paidAmount'),
    remainingAmount: asNumber(item.remainingAmount, 'remainingAmount'),
    paymentDate: asString(item.paymentDate || '', 'paymentDate', 50),
    status: ['completed', 'partial', 'unpaid'].includes(item.status) ? item.status : 'unpaid',
  })),
  expenses: asArray(data.expenses).map((item) => ({
    id: validateId(item.id),
    title: asString(item.title, 'title', 255),
    category: asString(item.category || '', 'category', 150),
    amount: asNumber(item.amount, 'amount'),
    date: asString(item.date || '', 'date', 50),
    paidTo: asString(item.paidTo || '', 'paidTo', 150),
    description: asString(item.description || '', 'description', 5000),
  })),
  incomes: asArray(data.incomes).map((item) => ({
    id: validateId(item.id),
    title: asString(item.title, 'title', 255),
    source: asString(item.source || '', 'source', 150),
    amount: asNumber(item.amount, 'amount'),
    date: asString(item.date || '', 'date', 50),
    description: asString(item.description || '', 'description', 5000),
  })),
  exams: asArray(data.exams).map((item) => ({
    id: validateId(item.id),
    title: asString(item.title, 'title', 255),
    courseId: validateId(item.courseId, 'courseId'),
    date: asString(item.date || '', 'date', 50),
    totalScore: asNumber(item.totalScore, 'totalScore'),
  })),
  results: asArray(data.results).map((item) => ({
    id: validateId(item.id),
    studentId: validateId(item.studentId, 'studentId'),
    examId: validateId(item.examId, 'examId'),
    score: asNumber(item.score, 'score'),
    grade: asString(item.grade || '', 'grade', 100),
    description: asString(item.description || '', 'description', 5000),
  })),
});
