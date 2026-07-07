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

// Today's date in the Persian (Jalali) calendar, e.g. «پنجشنبه ۱۱ تیر ۱۴۰۵»
// Recomputed on every call, so the dashboard reflects the real current day.
export function getTodayJalali(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Current academic term label derived from today's Jalali month, e.g. «ترم بهار-تابستان ۱۴۰۵»
export function getCurrentTerm(date: Date = new Date()): string {
  const month = Number(
    new Intl.DateTimeFormat('en-US-u-ca-persian', { month: 'numeric' }).format(date)
  );
  const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(date);
  const term = month <= 6 ? 'بهار-تابستان' : 'پاییز-زمستان';
  return `ترم ${term} ${year}`;
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
  return str.replace(/[۰-۹]/g, (d) => {
    return String(charMap[d] || d);
  });
}

const charMap: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

// Generates a random Persian ID
export function generateId(prefix: string): string {
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomSuffix}`;
}
