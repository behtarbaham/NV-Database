/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Format numbers with thousands separators
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

// Currency unit label for the whole app
export const CURRENCY_LABEL = 'افغانی';

// Format currency (Afghani)
export function formatCurrency(num: number): string {
  return `${formatNumber(num)} ${CURRENCY_LABEL}`;
}

export const DARI_MONTHS = [
  'حمل',
  'ثور',
  'جوزا',
  'سرطان',
  'اسد',
  'سنبله',
  'میزان',
  'عقرب',
  'قوس',
  'جدی',
  'دلو',
  'حوت',
];

const DARI_PERIODS = [
  'بهاری',
  'بهاری',
  'بهاری',
  'تابستانی',
  'تابستانی',
  'تابستانی',
  'خزانی',
  'خزانی',
  'خزانی',
  'زمستانی',
  'زمستانی',
  'زمستانی',
];

const getPersianCalendarParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    year: 'numeric',
    timeZone: 'Asia/Kabul',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const readPart = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: readPart('year'),
    month: readPart('month'),
    day: readPart('day'),
  };
};

const parseDateParts = (value: string) => {
  const normalized = toEnglishDigits(String(value || '').trim()).replace(/-/g, '/');
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

export function getTodayDateInputValue(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kabul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function toJalaliDateKey(value: string): number | null {
  const raw = toEnglishDigits(String(value || '').trim());
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return null;
    const { year, month, day } = getPersianCalendarParts(date);
    return year * 10000 + month * 100 + day;
  }
  const parts = parseDateParts(raw);
  return parts ? parts.year * 10000 + parts.month * 100 + parts.day : null;
}

export function toDateInputValue(value: string): string {
  const raw = toEnglishDigits(String(value || '').trim());
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(raw + 'T12:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === raw ? raw : '';
  }
  const target = toJalaliDateKey(raw);
  const parts = parseDateParts(raw);
  if (!target || !parts) return '';
  let low = Date.UTC(parts.year + 620, 0, 1, 12);
  let high = Date.UTC(parts.year + 623, 0, 1, 12);
  const dayMs = 86_400_000;
  while (low <= high) {
    const middle = low + Math.floor((high - low) / (2 * dayMs)) * dayMs;
    const middleKey = toJalaliDateKey(new Date(middle).toISOString().slice(0, 10));
    if (middleKey === target) return new Date(middle).toISOString().slice(0, 10);
    if (middleKey !== null && middleKey < target) low = middle + dayMs;
    else high = middle - dayMs;
  }
  return '';
}

export function formatDisplayDate(value: string): string {
  const raw = toEnglishDigits(String(value || '').trim());
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T12:00:00Z`);
    if (!Number.isNaN(date.getTime())) {
      const { year, month, day } = getPersianCalendarParts(date);
      return toPersianDigits(`${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`);
    }
  }
  return toPersianDigits(raw || '—');
}

// Today's date in the Dari solar calendar, e.g. «پنجشنبه ۲۶ سرطان ۱۴۰۵»
// Recomputed on every call, so the dashboard reflects the real current day.
export function getTodayJalali(date: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', timeZone: 'Asia/Kabul' }).format(date);
  const { year, month, day } = getPersianCalendarParts(date);
  return `${weekday} ${toPersianDigits(day)} ${DARI_MONTHS[month - 1]} ${toPersianDigits(year)}`;
}

// Current academic period label derived from today's Dari solar month, e.g. «دوره بهاری ۱۴۰۵»
export function getCurrentTerm(date: Date = new Date()): string {
  const { year, month } = getPersianCalendarParts(date);
  return `دوره ${DARI_PERIODS[month - 1]} ${toPersianDigits(year)}`;
}

// Map English digits to Persian digits
export function toPersianDigits(str: string | number): string {
  const charCodeZero = '۰'.charCodeAt(0);
  return String(str).replace(/[0-9]/g, (w) => {
    return String.fromCharCode(charCodeZero + parseInt(w, 10));
  });
}

// Map Persian/Arabic digits to English digits
export function toEnglishDigits(str: string): string {
  return str.replace(/[۰-۹٠-٩]/g, (d) => String(d.charCodeAt(0) - (d >= '٠' && d <= '٩' ? '٠'.charCodeAt(0) : '۰'.charCodeAt(0))));
}

const charMap: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

// Generate a collision-resistant local ID. The old three-digit random suffix
// could collide and make otherwise valid inserts fail intermittently.
export function generateId(prefix: string): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timePart}-${randomPart}`;
}


// One full Afghan solar-calendar month, clamped to the last day of the next month.
export function getStudentMonthNotice(joinDate: string, today: Date = new Date()) {
  const input = toDateInputValue(joinDate);
  if (!input) return null;
  const date = new Date(input + 'T12:00:00Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) return null;
  const start = getPersianCalendarParts(date);
  const raw = toEnglishDigits(joinDate.trim());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) && toJalaliDateKey(raw) !== start.year * 10000 + start.month * 100 + start.day) return null;
  const year = start.month === 12 ? start.year + 1 : start.year;
  const month = start.month === 12 ? 1 : start.month + 1;
  let day = start.day;
  while (day > 0 && !toDateInputValue(year + '/' + month + '/' + day)) day--;
  if (!day) return null;
  const dueKey = year * 10000 + month * 100 + day;
  const current = getPersianCalendarParts(today);
  if (current.year * 10000 + current.month * 100 + current.day < dueKey) return null;
  return { dueKey, dueLabel: toPersianDigits(day) + ' ' + DARI_MONTHS[month - 1] + ' ' + toPersianDigits(year) };
}

export function formatAfghanDate(value: string): string {
  const input = toDateInputValue(value);
  if (!input) return '—';
  const { year, month, day } = getPersianCalendarParts(new Date(input + 'T12:00:00Z'));
  return toPersianDigits(day) + ' ' + DARI_MONTHS[month - 1] + ' ' + toPersianDigits(year);
}

export function getCurrentAfghanMonth(date: Date = new Date()): string {
  const { year, month } = getPersianCalendarParts(date);
  return DARI_MONTHS[month - 1] + ' ' + toPersianDigits(year);
}

export function getAfghanDateMonthsAgo(months: number, date: Date = new Date()): string {
  const current = getPersianCalendarParts(date);
  const serial = current.year * 12 + current.month - 1 - months;
  const year = Math.floor(serial / 12), month = serial % 12 + 1;
  for (let day = current.day; day > 0; day--) {
    const value = toDateInputValue(year + '/' + month + '/' + day);
    if (value) return value;
  }
  return '';
}
