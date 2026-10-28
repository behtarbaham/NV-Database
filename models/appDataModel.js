import { getDb } from '../database/sqlite.js';
import { normalizeAppData } from '../utils/validation.js';
import { normalizeScheduling } from '../utils/schedulingValidation.js';

const boolToInt = (value) => (value ? 1 : 0);
const intToBool = (value) => Boolean(value);

export const readAppData = () => {
  const db = getDb();
  return {
    rooms: db.prepare('SELECT id, name FROM classrooms ORDER BY name').all(),
    timetable: db.prepare('SELECT id, teacher_id AS teacherId, course_id AS courseId, room_id AS roomId, start_time AS startTime, end_time AS endTime FROM timetable_entries ORDER BY start_time, id').all(),
    students: db.prepare('SELECT id, first_name AS firstName, last_name AS lastName, father_name AS fatherName, phone, course_id AS courseId, join_date AS joinDate, fee_paid AS feePaid, monthly_fee AS monthlyFee, last_payment_date AS lastPaymentDate, next_payment_date AS nextPaymentDate, is_active AS isActive FROM students ORDER BY id').all().map((row) => ({ ...row, isActive: intToBool(row.isActive) })),
    teachers: db.prepare('SELECT id, first_name AS firstName, last_name AS lastName, specialty, phone, salary, hire_date AS hireDate, is_active AS isActive FROM teachers ORDER BY id').all().map((row) => ({ ...row, isActive: intToBool(row.isActive) })),
    courses: db.prepare('SELECT id, name, teacher_id AS teacherId, duration, monthly_fee AS monthlyFee, level FROM courses ORDER BY id').all(),
    payments: db.prepare('SELECT id, student_id AS studentId, month, total_amount AS totalAmount, paid_amount AS paidAmount, remaining_amount AS remainingAmount, payment_date AS paymentDate, status FROM payments ORDER BY id').all(),
    expenses: db.prepare('SELECT id, title, category, amount, date, paid_to AS paidTo, description FROM expenses ORDER BY id').all(),
    incomes: db.prepare('SELECT id, title, source, amount, date, description FROM incomes ORDER BY id').all(),
    exams: db.prepare('SELECT id, title, course_id AS courseId, date, total_score AS totalScore, student_count AS studentCount FROM exams ORDER BY id').all(),
    results: db.prepare('SELECT id, student_id AS studentId, exam_id AS examId, score, grade, description FROM exam_results ORDER BY id').all(),
  };
};

export const saveAppData = (input) => {
  const db = getDb();
  const extras = new Map(db.prepare('SELECT id, monthly_fee AS monthlyFee, last_payment_date AS lastPaymentDate, next_payment_date AS nextPaymentDate FROM students').all().map((student) => [student.id, student]));
  const normalized = normalizeAppData({ ...input, students: Array.isArray(input.students) ? input.students.map((student) => ({ ...extras.get(student.id), ...student })) : input.students });
  // Preserve scheduling data when an older client omits the new fields.
  const scheduling = normalizeScheduling({ ...normalized,
    rooms: input.rooms === undefined ? db.prepare('SELECT id, name FROM classrooms').all() : input.rooms,
    timetable: input.timetable === undefined ? db.prepare('SELECT id, teacher_id AS teacherId, course_id AS courseId, room_id AS roomId, start_time AS startTime, end_time AS endTime FROM timetable_entries').all() : input.timetable,
  });
  const data = { ...normalized, ...scheduling };
  const transaction = db.transaction(() => {
    ['timetable_entries', 'classrooms', 'exam_results', 'payments', 'students', 'exams', 'courses', 'teachers', 'expenses', 'incomes'].forEach((table) => {
      db.prepare(`DELETE FROM ${table}`).run();
    });

    const insertTeacher = db.prepare('INSERT INTO teachers (id, first_name, last_name, specialty, phone, salary, hire_date, is_active) VALUES (@id, @firstName, @lastName, @specialty, @phone, @salary, @hireDate, @isActive)');
    data.teachers.forEach((item) => insertTeacher.run({ ...item, isActive: boolToInt(item.isActive) }));

    const insertCourse = db.prepare('INSERT INTO courses (id, name, teacher_id, duration, monthly_fee, level) VALUES (@id, @name, @teacherId, @duration, @monthlyFee, @level)');
    data.courses.forEach((item) => insertCourse.run(item));

    const insertStudent = db.prepare('INSERT INTO students (id, first_name, last_name, father_name, phone, course_id, join_date, fee_paid, monthly_fee, last_payment_date, next_payment_date, is_active) VALUES (@id, @firstName, @lastName, @fatherName, @phone, @courseId, @joinDate, @feePaid, @monthlyFee, @lastPaymentDate, @nextPaymentDate, @isActive)');
    data.students.forEach((item) => insertStudent.run({ ...item, isActive: boolToInt(item.isActive) }));

    const insertPayment = db.prepare('INSERT INTO payments (id, student_id, month, total_amount, paid_amount, remaining_amount, payment_date, status) VALUES (@id, @studentId, @month, @totalAmount, @paidAmount, @remainingAmount, @paymentDate, @status)');
    data.payments.forEach((item) => insertPayment.run(item));

    const insertExpense = db.prepare('INSERT INTO expenses (id, title, category, amount, date, paid_to, description) VALUES (@id, @title, @category, @amount, @date, @paidTo, @description)');
    data.expenses.forEach((item) => insertExpense.run(item));

    const insertIncome = db.prepare('INSERT INTO incomes (id, title, source, amount, date, description) VALUES (@id, @title, @source, @amount, @date, @description)');
    data.incomes.forEach((item) => insertIncome.run(item));

    const insertExam = db.prepare('INSERT INTO exams (id, title, course_id, date, total_score, student_count) VALUES (@id, @title, @courseId, @date, @totalScore, @studentCount)');
    data.exams.forEach((item) => insertExam.run(item));

    const insertRoom = db.prepare('INSERT INTO classrooms (id, name) VALUES (@id, @name)');
    data.rooms.forEach((item) => insertRoom.run(item));
    const insertTimetable = db.prepare('INSERT INTO timetable_entries (id, teacher_id, course_id, room_id, start_time, end_time) VALUES (@id, @teacherId, @courseId, @roomId, @startTime, @endTime)');
    data.timetable.forEach((item) => insertTimetable.run(item));

    const insertResult = db.prepare('INSERT INTO exam_results (id, student_id, exam_id, score, grade, description) VALUES (@id, @studentId, @examId, @score, @grade, @description)');
    data.results.forEach((item) => insertResult.run(item));
  });

  transaction();
  return data;
};
