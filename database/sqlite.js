import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let db;

const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT NOT NULL,
  salary REAL NOT NULL DEFAULT 0,
  hire_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  duration TEXT NOT NULL,
  monthly_fee REAL NOT NULL DEFAULT 0,
  level TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  course_id TEXT NOT NULL,
  join_date TEXT NOT NULL,
  fee_paid REAL NOT NULL DEFAULT 0,
  monthly_fee REAL NOT NULL DEFAULT 0,
  last_payment_date TEXT NOT NULL DEFAULT '',
  next_payment_date TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  month TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  remaining_amount REAL NOT NULL DEFAULT 0,
  payment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('completed', 'partial', 'unpaid')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  paid_to TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_id TEXT NOT NULL,
  date TEXT NOT NULL,
  total_score REAL NOT NULL DEFAULT 0,
  student_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_results (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  grade TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS timetable_entries (
  id TEXT PRIMARY KEY NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  room_id TEXT NOT NULL REFERENCES classrooms(id),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);
`;

export const getDb = () => {
  if (!db) {
    fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
    db = new Database(config.databasePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(schema);
    const examColumns = db.prepare('PRAGMA table_info(exams)').all().map((column) => column.name);
    if (!examColumns.includes('student_count')) {
      db.prepare('ALTER TABLE exams ADD COLUMN student_count INTEGER NOT NULL DEFAULT 0').run();
    }
    const studentColumns = new Set(db.pragma('table_info(students)').map((column) => column.name));
    for (const [name, definition] of Object.entries({ monthly_fee: 'REAL NOT NULL DEFAULT 0', last_payment_date: "TEXT NOT NULL DEFAULT ''", next_payment_date: "TEXT NOT NULL DEFAULT ''" })) {
      if (!studentColumns.has(name)) db.exec('ALTER TABLE students ADD COLUMN ' + name + ' ' + definition);
    }
    logger.info(`SQLite database ready at ${config.databasePath}`);
  }
  return db;
};

export const closeDb = () => {
  if (db) {
    db.close();
    db = null;
  }
};

export const seedDefaultAdmin = () => {
  const database = getDb();
  const count = database.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const credentialsChanged = database
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get('default_credentials_changed')?.value === '1';
  const rootUser = database.prepare('SELECT id FROM users WHERE username = ?').get('root');

  if (count > 0 && credentialsChanged) return;
  const passwordHash = bcrypt.hashSync('1234', config.bcryptRounds);

  if (rootUser) {
    database.prepare(
      'UPDATE users SET password_hash = ?, full_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?'
    ).run(passwordHash, 'Navand Administrator', 'admin', 'root');
    logger.warn('Default root user refreshed for login recovery. Change username and password after login.');
  } else {
    database.prepare(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
    ).run('root', passwordHash, 'Navand Administrator', 'admin');
    logger.warn('Default root user created. Change username and password after first login.');
  }

  database.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  ).run('default_credentials_changed', '0');
};

export const initializeDatabase = () => {
  getDb();
  seedDefaultAdmin();
};

export const markDefaultCredentialsChanged = () => {
  const database = getDb();
  database.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  ).run('default_credentials_changed', '1');
};
