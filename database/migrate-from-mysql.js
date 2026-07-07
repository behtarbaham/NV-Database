/**
 * One-time migration: import legacy MySQL data into the local SQLite database.
 *
 * The legacy phpMyAdmin dump (database/mysql-legacy-navand_academy.sql) stores a
 * full snapshot of the application state as a JSON blob in the `app_state` table.
 * That JSON already matches the shape expected by saveAppData()/normalizeAppData(),
 * so we extract it and reuse the validated insert path instead of re-parsing every
 * structured INSERT statement.
 *
 * Usage: node database/migrate-from-mysql.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveAppData } from '../models/appDataModel.js';
import { initializeDatabase, getDb } from './sqlite.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dumpPath = path.resolve(__dirname, 'mysql-legacy-navand_academy.sql');

/** Convert a MySQL single-quoted string body back into its raw value. */
const unescapeMysql = (value) =>
  value.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n').replace(/\\r/g, '\r');

const extractAppState = (sql) => {
  // INSERT INTO `app_state` (`id`, `state_json`, `updated_at`) VALUES ('main', '<json>', '<ts>');
  const match = sql.match(
    /INSERT INTO `app_state`[\s\S]*?VALUES\s*\(\s*'main'\s*,\s*'([\s\S]*?)'\s*,\s*'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'\s*\)/,
  );
  if (!match) throw new Error('Could not locate app_state JSON snapshot in the dump file.');
  const json = unescapeMysql(match[1]);
  return JSON.parse(json);
};

const run = () => {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Legacy dump not found at ${dumpPath}`);
  }

  initializeDatabase();

  const sql = fs.readFileSync(dumpPath, 'utf8');
  const snapshot = extractAppState(sql);

  // Map legacy keys onto the AppData shape saveAppData expects.
  const appData = {
    students: snapshot.students || [],
    teachers: snapshot.teachers || [],
    courses: snapshot.courses || [],
    payments: snapshot.payments || [],
    expenses: snapshot.expenses || [],
    incomes: snapshot.incomes || [],
    exams: snapshot.exams || [],
    results: snapshot.results || [],
  };

  saveAppData(appData);

  const db = getDb();
  const counts = {};
  for (const table of ['teachers', 'courses', 'students', 'payments', 'expenses', 'incomes', 'exams', 'exam_results']) {
    counts[table] = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
  }

  logger.info('Legacy MySQL data migrated into SQLite', counts);
  console.log('Migration complete. Row counts:');
  console.table(counts);
};

run();
