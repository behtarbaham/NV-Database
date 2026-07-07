import { getDb } from '../database/sqlite.js';
import { normalizeAppData } from '../utils/validation.js';

const boolToInt = (value) => (value ? 1 : 0);
const intToBool = (value) => Boolean(value);

export const readAppData = () => {
  const db = getDb();
  return {
    students: db.prepare('SELECT id, first_name AS firstName, last_name AS lastName, father_name AS fatherName, phone, course_id AS courseId, join_date AS joinDate, fee_paid AS feePaid, is_active AS isActive FROM students ORDER BY id').all().map((row) => ({ ...row, isActive: intToBool(row.isActive) })),
    teachers: db.prepare('SELECT id, first_name AS firstName, last_name AS lastName, specialty, phone, salary, hire_date AS hireDate, is_active AS isActive FROM teachers ORDER BY id').all().map((row) => ({ ...row, isActive: intToBool(row.isActive) })),
    courses: db.prepare('SELECT id, name, teacher_id AS teacherId, duration, monthly_fee AS monthlyFee, level FROM courses ORDER BY id').all(),
    payments: db.prepare('SELECT id, student_id AS studentId, month, total_amount AS totalAmount, paid_amount AS paidAmount, remaining_amount AS remainingAmount, payment_date AS paymentDate, status FROM payments ORDER BY id').all(),
    expenses: db.prepare('SELECT id, title, category, amount, date, paid_to AS paidTo, description FROM expenses ORDER BY id').all(),
    incomes: db.prepare('SELECT id, title, source, amount, date, description FROM incomes ORDER BY id').all(),
    exams: db.prepare('SELECT id, title, course_id AS courseId, date, total_score AS totalScore FROM exams ORDER BY id').all(),
    results: db.prepare('SELECT id, student_id AS studentId, exam_id AS examId, score, grade, description FROM exam_results ORDER BY id').all(),
  };
};

export const saveAppData = (input) => {
  const data = normalizeAppData(input);
  const db = getDb();
  const transaction = db.transaction(() => {
    ['exam_results', 'payments', 'students', 'exams', 'courses', 'teachers', 'expenses', 'incomes'].forEach((table) => {
      db.prepare(`DELETE FROM ${table}`).run();
    });

    const insertTeacher = db.prepare('INSERT INTO teachers (id, first_name, last_name, specialty, phone, salary, hire_date, is_active) VALUES (@id, @firstName, @lastName, @specialty, @phone, @salary, @hireDate, @isActive)');
    data.teachers.forEach((item) => insertTeacher.run({ ...item, isActive: boolToInt(item.isActive) }));

    const insertCourse = db.prepare('INSERT INTO courses (id, name, teacher_id, duration, monthly_fee, level) VALUES (@id, @name, @teacherId, @duration, @monthlyFee, @level)');
    data.courses.forEach((item) => insertCourse.run(item));

    const insertStudent = db.prepare('INSERT INTO students (id, first_name, last_name, father_name, phone, course_id, join_date, fee_paid, is_active) VALUES (@id, @firstName, @lastName, @fatherName, @phone, @courseId, @joinDate, @feePaid, @isActive)');
    data.students.forEach((item) => insertStudent.run({ ...item, isActive: boolToInt(item.isActive) }));

    const insertPayment = db.prepare('INSERT INTO payments (id, student_id, month, total_amount, paid_amount, remaining_amount, payment_date, status) VALUES (@id, @studentId, @month, @totalAmount, @paidAmount, @remainingAmount, @paymentDate, @status)');
    data.payments.forEach((item) => insertPayment.run(item));

    const insertExpense = db.prepare('INSERT INTO expenses (id, title, category, amount, date, paid_to, description) VALUES (@id, @title, @category, @amount, @date, @paidTo, @description)');
    data.expenses.forEach((item) => insertExpense.run(item));

    const insertIncome = db.prepare('INSERT INTO incomes (id, title, source, amount, date, description) VALUES (@id, @title, @source, @amount, @date, @description)');
    data.incomes.forEach((item) => insertIncome.run(item));

    const insertExam = db.prepare('INSERT INTO exams (id, title, course_id, date, total_score) VALUES (@id, @title, @courseId, @date, @totalScore)');
    data.exams.forEach((item) => insertExam.run(item));

    const insertResult = db.prepare('INSERT INTO exam_results (id, student_id, exam_id, score, grade, description) VALUES (@id, @studentId, @examId, @score, @grade, @description)');
    data.results.forEach((item) => insertResult.run(item));
  });

  transaction();
  return data;
};
