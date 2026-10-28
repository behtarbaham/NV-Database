import { ExcelPanel } from './ExcelPanel';
import { ImportKind } from '../utils/excel';
import { JalaliDateInput } from './JalaliDateInput';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, FileText, Printer, DollarSign, Award, Users } from 'lucide-react';
import { Student, Teacher, Course, Payment, Expense, Income, Exam, ExamResult } from '../types';
import { formatCurrency, toPersianDigits, formatDisplayDate, getTodayDateInputValue, getAfghanDateMonthsAgo, toJalaliDateKey } from '../utils';
import { trapFocusInActiveDialog } from '../accessibility';

interface ReportsPanelProps {
  onExcelImport: (kind: ImportKind, rows: Record<string,unknown>[]) => Promise<{ added: number; updated: number }>;
  students: Student[];
  teachers: Teacher[];
  courses: Course[];
  payments: Payment[];
  expenses: Expense[];
  incomes: Income[];
  exams: Exam[];
  results: ExamResult[];
}

export function ReportsPanel({
  onExcelImport,
  students,
  teachers,
  courses,
  payments,
  expenses,
  incomes,
  exams,
  results,
}: ReportsPanelProps) {
  const [fromDate, setFromDate] = useState(() => getAfghanDateMonthsAgo(3));
  const [toDate, setToDate] = useState(() => getTodayDateInputValue());
  const [reportType, setReportType] = useState<'all' | 'financial' | 'academic' | 'exam'>('all');
  const [examReportId, setExamReportId] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const fromDateKey = toJalaliDateKey(fromDate);
  const toDateKey = toJalaliDateKey(toDate);
  const isDateWithinRange = (value: string) => {
    const key = toJalaliDateKey(value);
    return key !== null && fromDateKey !== null && toDateKey !== null && key >= fromDateKey && key <= toDateKey;
  };
  const retentionRate = students.length
    ? Math.round((students.filter((student) => student.isActive).length / students.length) * 100)
    : 0;

  const getExamPrintId = (id: string) => {
    const digits = id.replace(/\D/g, '');
    if (digits) return digits.slice(-6).padStart(6, '0');

    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) % 1000000;
    }
    return String(hash).padStart(6, '0');
  };

  const selectedExam = exams.find((exam) => getExamPrintId(exam.id) === examReportId.trim());
  const selectedExamResults = selectedExam
    ? results.filter((result) => result.examId === selectedExam.id && students.some((student) => student.id === result.studentId))
    : [];
  const getStudentName = (studentId: string) => {
    const student = students.find((item) => item.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : studentId;
  };
  const getGradeFromScore = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    return 'D';
  };

  // Generate Report calculations
  const totalIncomesFromPayments = payments
    .filter((p) => isDateWithinRange(p.paymentDate))
    .reduce((sum, p) => sum + p.paidAmount, 0);

  const totalOtherIncomes = incomes
    .filter((i) => isDateWithinRange(i.date))
    .reduce((sum, i) => sum + i.amount, 0);

  const totalCalculatedRevenue = totalIncomesFromPayments + totalOtherIncomes;

  const totalCalculatedExpenses = expenses
    .filter((e) => isDateWithinRange(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  const profitNet = totalCalculatedRevenue - totalCalculatedExpenses;

  const newRegisteredStudents = students.filter(
    (s) => isDateWithinRange(s.joinDate)
  );

  const handleGenerateReport = () => {
    if (fromDateKey === null || toDateKey === null || fromDateKey > toDateKey) {
      setReportError('\u0628\u0627\u0632\u0647 \u062a\u0627\u0631\u06cc\u062e \u062f\u0631\u0633\u062a \u0646\u06cc\u0633\u062a.');
      return;
    }
    if (reportType === 'exam' && !examReportId.trim()) {
      setReportError('\u0634\u0646\u0627\u0633\u0647 \u0622\u0632\u0645\u0648\u0646 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.');
      return;
    }
    setReportError(null);
    setReportGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-panel space-y-6">
      <ExcelPanel data={{students, teachers, courses, payments, expenses, incomes, exams, results}} onImport={onExcelImport} />
      {reportError && (
        <div className="app-feedback-overlay" role="alertdialog" aria-modal="true" onKeyDown={(event) => { if (event.key === 'Escape') setReportError(null); else trapFocusInActiveDialog(event.nativeEvent); }}>
          <div className="app-feedback-card">
            <div className="app-dialog-icon"><AlertCircle /></div>
            <h3>{'\u0641\u06cc\u0644\u062a\u0631 \u06af\u0632\u0627\u0631\u0634 \u0646\u0627\u0645\u06a9\u0645\u0644 \u0627\u0633\u062a'}</h3>
            <p>{reportError}</p>
            <button type="button" className="notice-dismiss" onClick={() => setReportError(null)} autoFocus>{'\u0645\u062a\u0648\u062c\u0647 \u0634\u062f\u0645'}</button>
          </div>
        </div>
      )}
      {/* Configuration Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          تنظیمات فیلتر گزارش‌گیری هوشمند
        </h3>

        <div className={`grid grid-cols-1 gap-4 ${reportType === 'exam' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">از تاریخ</label>
            <div className="relative">
              <JalaliDateInput
                value={fromDate}
                onChange={setFromDate}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right font-mono text-xs sm:text-sm"
                placeholder="1405/01/01"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">تا تاریخ</label>
            <div className="relative">
              <JalaliDateInput
                value={toDate}
                onChange={setToDate}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right font-mono text-xs sm:text-sm"
                placeholder="1405/03/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">دسته‌بندی گزارش</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right text-xs sm:text-sm font-semibold"
            >
              <option value="all">کلیه سرفصل‌ها (مجموعه فعالیت)</option>
              <option value="financial">گزارش مالی و تراز سود/زیان</option>
              <option value="academic">وضعیت پذیرش و آموزشی</option>
                          <option value="exam">{'\u0686\u0627\u067e \u0646\u0645\u0631\u0627\u062a \u0622\u0632\u0645\u0648\u0646'}</option>
            </select>
          </div>

          <div className={reportType === 'exam' ? 'block' : 'hidden'}>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{'\u0634\u0646\u0627\u0633\u0647 ID \u0622\u0632\u0645\u0648\u0646'}</label>
            <input
              type="text"
              value={examReportId}
              onChange={(e) => setExamReportId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right font-mono text-xs sm:text-sm"
              placeholder="000601"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 transition-colors duration-150 cursor-pointer text-xs sm:text-sm"
              id="btn-generate-report"
            >
              ایجاد کارنامه اطلاعاتی
            </button>
          </div>
        </div>
      </div>

      {/* Render Generated Report */}
      {reportGenerated ? (
        <div id="print-area" className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6 relative animate-scale-up">
          {/* Print Watermark logo & Meta */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-5">
            <div>
              <button
                onClick={handlePrint}
                className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                id="btn-print-report"
              >
                <Printer className="w-3.5 h-3.5" />
                چاپ فاکتور / ذخیره PDF
              </button>
            </div>
            <div className="text-right">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">گزارش تراز و ارزیابی آکادمی ناوند</h2>
              <div className="flex gap-4 text-xs text-slate-400 font-bold mt-1">
                <span>بازه: {formatDisplayDate(fromDate)} الی {formatDisplayDate(toDate)}</span>
                <span>
                  نوع:{' '}
                  {reportType === 'all'
                    ? 'گزارش فراگیر'
                    : reportType === 'financial'
                    ? 'گزارش مالی'
                    : reportType === 'exam'
                    ? 'چاپ نمرات آزمون'
                    : 'گزارش فعالیت تحصیلی'}
                </span>
              </div>
            </div>
          </div>

          {reportType === 'exam' && (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              {selectedExam ? (
                <>
                  <div className="bg-slate-50 p-4 border-b border-slate-200 text-right">
                    <h3 className="font-extrabold text-slate-800 text-sm">{selectedExam.title}</h3>
                    <p className="text-xs font-bold text-blue-700 font-mono mt-1">ID: {getExamPrintId(selectedExam.id)}</p>
                  </div>
                  <table className="w-full text-xs text-right text-slate-700 bg-white">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                        <th className="p-3">{'\u0646\u0627\u0645 \u062f\u0627\u0646\u0634\u062c\u0648'}</th>
                        <th className="p-3">{'\u0646\u0645\u0631\u0647'}</th>
                        <th className="p-3">{'\u062f\u0631\u062c\u0647'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExamResults.map((result) => (
                        <tr key={result.id} className="border-b border-slate-100">
                          <td className="p-3 font-bold">{getStudentName(result.studentId)}</td>
                          <td className="p-3 font-mono text-blue-700 font-extrabold">{toPersianDigits(result.score)}</td>
                          <td className="p-3 font-bold">{getGradeFromScore(result.score)}</td>
                        </tr>
                      ))}
                      {selectedExamResults.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400 font-bold">
                            {'\u0628\u0631\u0627\u06cc \u0627\u06cc\u0646 \u0622\u0632\u0645\u0648\u0646 \u0647\u0646\u0648\u0632 \u0646\u0645\u0631\u0647\u200c\u0627\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="p-6 text-center text-rose-600 font-bold bg-rose-50">
                  {'\u0622\u0632\u0645\u0648\u0646\u06cc \u0628\u0627 \u0627\u06cc\u0646 ID \u067e\u06cc\u062f\u0627 \u0646\u0634\u062f.'}
                </div>
              )}
            </div>
          )}

          {/* Core Analytics Cards */}
          {(reportType === 'all' || reportType === 'financial') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-right">
                <span className="text-xs sm:text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  درآمد شناسایی شده
                </span>
                <p className="text-base sm:text-lg font-extrabold text-emerald-700 font-mono mt-1.5">
                  {formatCurrency(totalCalculatedRevenue)}
                </p>
                <p className="text-xs text-emerald-500 mt-1">
                  شامل شهریه و درآمد سایر خدمات
                </p>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl text-right">
                <span className="text-xs sm:text-xs font-extrabold text-rose-800 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  مجموع مصارف دوره
                </span>
                <p className="text-base sm:text-lg font-extrabold text-rose-700 font-mono mt-1.5">
                  {formatCurrency(totalCalculatedExpenses)}
                </p>
                <p className="text-xs text-rose-500 mt-1">
                  نیازمند بازتخصیص ساختمانی و اداری
                </p>
              </div>

              <div className={`p-4 rounded-xl text-right border ${profitNet >= 0 ? 'bg-blue-50/50 border-blue-100 text-blue-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
                <span className="text-xs sm:text-xs font-extrabold flex items-center gap-1 text-slate-700">
                  <Award className="w-4 h-4" />
                  تراز سود خالص (خالص عملیاتی)
                </span>
                <p className="text-base sm:text-lg font-extrabold font-mono mt-1.5">
                  {formatCurrency(profitNet)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {profitNet >= 0 ? 'تراز مالی مثبت و سودده' : 'تراز منفی عیب‌یابی شود'}
                </p>
              </div>
            </div>
          )}

          {/* Academic Report section */}
          {(reportType === 'all' || reportType === 'academic') && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-800 mb-3 text-xs sm:text-sm">خلاصه ارزیابی دپارتمان آموزشی</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-bold block mb-1">دانشجو جدید ثبت‌نامی</span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 font-mono">{toPersianDigits(newRegisteredStudents.length)} نفر</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-bold block mb-1">کل آموزگاران فعال</span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 font-mono">{toPersianDigits(teachers.filter(t => t.isActive).length)} نفر</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-bold block mb-1">دوره‌های فعال</span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 font-mono">{toPersianDigits(courses.length)} دوره</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 font-bold block mb-1">نرخ بقای دوره عمومی</span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 font-mono">{toPersianDigits(retentionRate)}٪</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto mt-2">
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-xs text-slate-600 text-right">
                  لیست دانشجویان جدید ثبت‌نام شده در این بازه تاریخی
                </div>
                {newRegisteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-semibold bg-white">
                    دانشجو جدیدی در این دوره تاریخی به ثبت نرسیده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right text-slate-700 bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                          <th className="p-3">نام</th>
                          <th className="p-3">تخلص</th>
                          <th className="p-3">نام پدر</th>
                          <th className="p-3">شماره تماس</th>
                          <th className="p-3">تاریخ الحاق</th>
                          <th className="p-3">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newRegisteredStudents.map((s, idx) => (
                          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 font-semibold">{s.firstName}</td>
                            <td className="p-3">{s.lastName}</td>
                            <td className="p-3">{s.fatherName || '--'}</td>
                            <td className="p-3 font-mono text-xs text-left" dir="ltr">{s.phone}</td>
                            <td className="p-3 font-mono">{formatDisplayDate(s.joinDate)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {s.isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial details section */}
          {(reportType === 'all' || reportType === 'financial') && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-800 mb-3 text-xs sm:text-sm">صورت ریز دریافتی‌های شهریه</h4>
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-right text-slate-700 bg-white">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-xs uppercase">
                      <th className="p-3">شناسه رسید</th>
                      <th className="p-3">مربوط به ماه</th>
                      <th className="p-3">مبلغ پرداختی</th>
                      <th className="p-3">تاریخ پرداخت</th>
                      <th className="p-3">وضعیت رسید</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments
                      .filter((p) => p.paymentDate !== '--/--/--' && isDateWithinRange(p.paymentDate))
                      .map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800 font-mono">{p.id}</td>
                          <td className="p-3">{p.month}</td>
                          <td className="p-3 font-mono text-emerald-600 font-semibold">{formatCurrency(p.paidAmount)}</td>
                          <td className="p-3 font-mono">{formatDisplayDate(p.paymentDate)}</td>
                          <td className="p-3">
                            <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-xl text-xs">وصل شده</span>
                          </td>
                        </tr>
                      ))}
                    {payments.filter((p) => p.paymentDate !== '--/--/--' && isDateWithinRange(p.paymentDate)).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 font-bold font-semibold bg-white">تراکنش واصولی وجه یافت نشد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signatures for Print format */}
          <div className="print-only mt-12 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-600">
            <div>
              <p className="mb-8">مهر و امضای امور مالی آکادمی</p>
              <div className="h-1 bg-slate-300 w-32 mx-auto"></div>
            </div>
            <div>
              <p className="mb-8 font-extrabold">مهر و امضای سید فیاض ملک‌زی (مدیر آکادمی ناوند)</p>
              <div className="h-1 bg-slate-300 w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 text-slate-500 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
          <FileText className="w-10 h-10 text-slate-400" />
          <h4 className="font-bold text-slate-700 text-sm">هیچ گزارشی صادر نشده است</h4>
          <p className="text-xs text-slate-400">بازه زمانی مورد نظر و نوع گزارش کاربری را مشخص کرده و دکمه "ایجاد کارنامه اطلاعاتی" را بزنید</p>
        </div>
      )}
    </div>
  );
}
