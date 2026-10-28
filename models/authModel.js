import bcrypt from 'bcryptjs';
import { getDb, markDefaultCredentialsChanged } from '../database/sqlite.js';
import { config } from '../config/index.js';

const publicUserFields = 'id, username, full_name AS fullName, role, created_at AS createdAt';

const digitMap = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const normalizeDigits = (value) => String(value || '').replace(/[۰-۹٠-٩]/g, (digit) => digitMap[digit] || digit);
const normalizeUsername = (username) => String(username || '').trim().toLowerCase();
const passwordMatches = (input, passwordHash) => {
  const rawPassword = String(input || '');
  const normalizedPassword = normalizeDigits(rawPassword).trim();
  const candidates = [...new Set([rawPassword, rawPassword.trim(), normalizedPassword])];
  return candidates.some((candidate) => bcrypt.compareSync(candidate, passwordHash));
};

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName || user.username,
  role: user.role || 'admin',
  createdAt: user.createdAt,
});

export const registerUser = ({ username, password, fullName }) => {
  const normalizedUsername = normalizeUsername(username);
  const normalizedFullName = String(fullName || '').trim();

  if (normalizedUsername.length < 3) {
    const error = new Error('Username must be at least 3 characters.');
    error.statusCode = 400;
    throw error;
  }

  if (String(password || '').length < 6) {
    const error = new Error('Password must be at least 6 characters.');
    error.statusCode = 400;
    throw error;
  }

  const db = getDb();
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(normalizedUsername);
  if (existingUser) {
    const error = new Error('This username is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = bcrypt.hashSync(password, config.bcryptRounds);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  ).run(normalizedUsername, passwordHash, normalizedFullName || normalizedUsername, 'admin');

  const user = db.prepare(`SELECT ${publicUserFields} FROM users WHERE id = ?`).get(result.lastInsertRowid);
  return toPublicUser(user);
};

export const loginUser = ({ username, password }) => {
  const normalizedUsername = normalizeUsername(username);
  const db = getDb();
  const user = db.prepare(
    `SELECT ${publicUserFields}, password_hash AS passwordHash FROM users WHERE username = ?`
  ).get(normalizedUsername);

  if (!user || !passwordMatches(password, user.passwordHash)) {
    const error = new Error('Invalid username or password.');
    error.statusCode = 401;
    throw error;
  }

  return toPublicUser(user);
};

export const updateUserCredentials = ({ userId, currentPassword, username, password }) => {
  const normalizedUsername = normalizeUsername(username);

  if (!userId) {
    const error = new Error('User id is required.');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedUsername.length < 3) {
    const error = new Error('Username must be at least 3 characters.');
    error.statusCode = 400;
    throw error;
  }

  if (String(password || '').length < 4) {
    const error = new Error('Password must be at least 4 characters.');
    error.statusCode = 400;
    throw error;
  }

  const db = getDb();
  const existingUser = db.prepare(
    `SELECT ${publicUserFields}, password_hash AS passwordHash FROM users WHERE id = ?`
  ).get(userId);

  if (!existingUser || !passwordMatches(currentPassword, existingUser.passwordHash)) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 401;
    throw error;
  }

  const usernameOwner = db.prepare('SELECT id FROM users WHERE username = ? AND id <> ?').get(normalizedUsername, userId);
  if (usernameOwner) {
    const error = new Error('This username is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = bcrypt.hashSync(password, config.bcryptRounds);
  db.prepare(
    'UPDATE users SET username = ?, password_hash = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(normalizedUsername, passwordHash, normalizedUsername, userId);
  markDefaultCredentialsChanged();

  const updatedUser = db.prepare(`SELECT ${publicUserFields} FROM users WHERE id = ?`).get(userId);
  return toPublicUser(updatedUser);
};
