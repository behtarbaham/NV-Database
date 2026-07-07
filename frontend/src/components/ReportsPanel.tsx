/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Printer, Calendar, DollarSign, Award, Users } from 'lucide-react';
import { Student, Teacher, Course, Payment, Expense, Income } from '../types';
import { formatCurrency, toPersianDigits } from '../utils';

interface ReportsPanelProps {
  students: Student[];
  teachers: Teacher[];
  courses: Course[];
  payments: Payment[];
  expenses: Expense[];
  incomes: Income[];
}

export function ReportsPanel({
  students,
  teachers,
  courses,
  payments,
  expenses,
  incomes,
}: ReportsPanelProps) {
  const [fromDate, setFromDate] = useState('1405/01/01');
  const [toDate, setToDate] = useState('1405/03/30');
  const [reportType, setReportType] = useState<'all' | 'financial' | 'academic'>('all');
  const [reportGenerated, setReportGenerated] = useState(false);

  // Generate Report calculations
  const totalIncomesFromPayments = payments
    .filter((p) => p.paymentDate >= fromDate && p.paymentDate <= toDate)
    .reduce((sum, p) => sum + p.paidAmount, 0);

  const totalOtherIncomes = incomes
    .filter((i) => i.date >= fromDate && i.date <= toDate)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalCalculatedRevenue = totalIncomesFromPayments + totalOtherIncomes;

  const totalCalculatedExpenses = expenses
    .filter((e) => e.date >= fromDate && e.date <= toDate)
    .reduce((sum, e) => sum + e.amount, 0);

  const profitNet = totalCalculatedRevenue - totalCalculatedExpenses;

  const newRegisteredStudents = students.filter(
    (s) => s.joinDate >= fromDate && s.joinDate <= toDate
  );

  const handleGenerateReport = () => {
    setReportGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          تنظیمات فیلتر گزارش‌گیری هوشمند
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">از تاریخ</label>
            <div className="relative">
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right font-mono text-xs sm:text-sm"
                placeholder="1405/01/01"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">تا تاریخ</label>
            <div className="relative">
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-right font-mono text-xs sm:text-sm"
                placeholder="1405/03/30"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
            </select>
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
                <span>بازه: {toPersianDigits(fromDate)} الی {toPersianDigits(toDate)}</span>
                <span>نوع: {reportType === 'all' ? 'گزارش فراگیر' : reportType === 'financial' ? 'گزارش مالی' : 'گزارش فعالیت تحصیلی'}</span>
              </div>
            </div>
          </div>

          {/* Core Analytics Cards */}
          {(reportType === 'all' || reportType === 'financial') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-120 p-4 rounded-xl text-right">
                <span className="text-[10px] sm:text-xs font-black text-emerald-800 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  درآمد شناسایی شده
                </span>
                <p className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-1.5">
                  {formatCurrency(totalCalculatedRevenue)}
                </p>
                <p className="text-[10px] text-emerald-500 mt-1">
                  شامل شهریه و درآمد سایر خدمات
                </p>
              </div>

              <div className="bg-rose-50/50 border border-rose-120 p-4 rounded-xl text-right">
                <span className="text-[10px] sm:text-xs font-black text-rose-800 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  مجموع مصارف دوره
                </span>
                <p className="text-base sm:text-lg font-black text-rose-700 font-mono mt-1.5">
                  {formatCurrency(totalCalculatedExpenses)}
                </p>
                <p className="text-[10px] text-rose-500 mt-1">
                  نیازمند بازتخصیص ساختمانی و اداری
                </p>
              </div>

              <div className={`p-4 rounded-xl text-right border ${profitNet >= 0 ? 'bg-blue-50/50 border-blue-120 text-blue-700' : 'bg-red-50/50 border-red-120 text-red-750'}`}>
                <span className="text-[10px] sm:text-xs font-black flex items-center gap-1 text-slate-700">
                  <Award className="w-4 h-4" />
                  تراز سود خالص (خالص عملیاتی)
                </span>
                <p className="text-base sm:text-lg font-black font-mono mt-1.5">
                  {formatCurrency(profitNet)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
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
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">دانش‌آموز جدید ثبت‌نامی</span>
                  <span className="text-sm sm:text-base font-black text-slate-800 font-mono">{toPersianDigits(newRegisteredStudents.length)} نفر</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">کل آموزگاران فعال</span>
                  <span className="text-sm sm:text-base font-black text-slate-800 font-mono">{toPersianDigits(teachers.filter(t => t.isActive).length)} نفر</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">دوره‌های فعال</span>
                  <span className="text-sm sm:text-base font-black text-slate-800 font-mono">{toPersianDigits(courses.length)} دوره</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">نرخ بقای دوره عمومی</span>
                  <span className="text-sm sm:text-base font-black text-slate-800 font-mono">۹۲٪</span>
                </div>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden mt-2">
                <div className="bg-slate-50 p-3 border-b border-slate-150 font-bold text-xs text-slate-600 text-right">
                  لیست هنرجویان جدید ثبت‌نام شده در این بازه تاریخی
                </div>
                {newRegisteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-semibold bg-white">
                    دانش‌آموز جدیدی در این دوره تاریخی به ثبت نرسیده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right text-slate-700 bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
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
                            <td className="p-3 font-mono text-[11px] text-left" dir="ltr">{s.phone}</td>
                            <td className="p-3 font-mono">{toPersianDigits(s.joinDate)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.isActive ? 'bg-emerald-55 text-emerald-600' : 'bg-red-55 text-red-600'}`}>
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
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right text-slate-700 bg-white">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px] uppercase">
                      <th className="p-3">شناسه رسید</th>
                      <th className="p-3">مربوط به ماه</th>
                      <th className="p-3">مبلغ پرداختی</th>
                      <th className="p-3">تاریخ پرداخت</th>
                      <th className="p-3">وضعیت رسید</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments
                      .filter((p) => p.paymentDate !== '--/--/--' && p.paymentDate >= fromDate && p.paymentDate <= toDate)
                      .map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800 font-mono">{p.id}</td>
                          <td className="p-3">{p.month}</td>
                          <td className="p-3 font-mono text-emerald-600 font-semibold">{formatCurrency(p.paidAmount)}</td>
                          <td className="p-3 font-mono">{toPersianDigits(p.paymentDate)}</td>
                          <td className="p-3">
                            <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-xl text-[9px]">وصل شده</span>
                          </td>
                        </tr>
                      ))}
                    {payments.filter((p) => p.paymentDate !== '--/--/--' && p.paymentDate >= fromDate && p.paymentDate <= toDate).length === 0 && (
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
          <div className="print-only mt-12 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-650">
            <div>
              <p className="mb-8">مهر و امضای امور مالی آکادمی</p>
              <div className="h-1 bg-slate-350 w-32 mx-auto"></div>
            </div>
            <div>
              <p className="mb-8 font-extrabold">مهر و امضای سید فیاض ملک‌زی (مدیر آکادمی ناوند)</p>
              <div className="h-1 bg-slate-350 w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-150 text-slate-500 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
          <FileText className="w-10 h-10 text-slate-350" />
          <h4 className="font-bold text-slate-700 text-sm">هیچ گزارشی صادر نشده است</h4>
          <p className="text-xs text-slate-400">بازه زمانی مورد نظر و نوع گزارش کاربری را مشخص کرده و دکمه "ایجاد کارنامه اطلاعاتی" را بزنید</p>
        </div>
      )}
    </div>
  );
}
