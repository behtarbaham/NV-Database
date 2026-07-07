/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Student, Teacher, Course, Payment, Expense, Income, Exam, ExamResult } from '../types';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  type:
    | 'add_student'
    | 'edit_student'
    | 'add_teacher'
    | 'edit_teacher'
    | 'add_course'
    | 'edit_course'
    | 'add_payment'
    | 'edit_payment'
    | 'add_expense'
    | 'add_income'
    | 'add_exam'
    | 'add_result'
    | null;
  initialData: any;
  onSave: (data: any) => void;
  extraData: {
    courses: Course[];
    teachers: Teacher[];
    students: Student[];
    exams: Exam[];
  };
}

export function EntityModal({
  isOpen,
  onClose,
  type,
  initialData,
  onSave,
  extraData,
}: EntityModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Initialize form state when initialData or type changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        // Feed defaults for addition modal
        const defaults: Record<string, any> = {
          add_student: { firstName: '', lastName: '', fatherName: '', phone: '', courseId: extraData.courses[0]?.id || '', joinDate: '1405/03/18', feePaid: 0, isActive: true },
          add_teacher: { firstName: '', lastName: '', specialty: '', phone: '', salary: 0, hireDate: '1405/03/18', isActive: true },
          add_course: { name: '', teacherId: extraData.teachers[0]?.id || '', duration: '۳ ماه', monthlyFee: 1500000, level: 'متوسط' },
          add_payment: { studentId: extraData.students[0]?.id || '', month: 'خرداد ۱۴۰۵', totalAmount: 0, paidAmount: 0, paymentDate: '1405/03/18', status: 'completed' },
          add_expense: { title: '', category: 'سایر موارد', amount: 0, date: '1405/03/18', paidTo: '', description: '' },
          add_income: { title: '', source: 'سایر موارد', amount: 0, date: '1405/03/18', description: '' },
          add_exam: { title: '', courseId: extraData.courses[0]?.id || '', date: '1405/03/18', totalScore: 100 },
          add_result: { studentId: extraData.students[0]?.id || '', examId: extraData.exams[0]?.id || '', score: 0, grade: 'خوب', description: '' },
        };
        setFormData(defaults[type || ''] || {});
      }
    }
  }, [isOpen, type, initialData, extraData]);

  if (!isOpen || !type) return null;

  // Handle value triggers based on linked drop downs
  const handleStudentChangeInPayment = (studentId: string) => {
    const student = extraData.students.find(s => s.id === studentId);
    if (student) {
      const course = extraData.courses.find(c => c.id === student.courseId);
      if (course) {
        setFormData((prev: any) => ({
          ...prev,
          studentId,
          totalAmount: course.monthlyFee,
          paidAmount: course.monthlyFee,
        }));
      } else {
        setFormData((prev: any) => ({ ...prev, studentId }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: elemType } = e.target;
    let finalVal: any = value;

    if (elemType === 'number') {
      finalVal = value === '' ? 0 : Number(value);
    } else if (name === 'isActive') {
      finalVal = value === 'true';
    }

    setFormData((prev: any) => ({ ...prev, [name]: finalVal }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Dynamic validations
    if (type.includes('student')) {
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.phone?.trim()) {
        setError('لطفاً فیلدهای ستاره‌دار (نام، نام خانوادگی، شماره دور و تماس) را تکمیل کنید!');
        return;
      }
    } else if (type.includes('teacher')) {
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.specialty?.trim()) {
        setError('لطفاً فیلدهای ستاره‌دار (نام، تخلص و تخصص) را پر کنید!');
        return;
      }
    } else if (type.includes('course')) {
      if (!formData.name?.trim() || formData.monthlyFee <= 0) {
        setError('لطفاً نام دوره را تکمیل و شهریه ماهانه را بزرگتر از صفر تعیین کنید!');
        return;
      }
    } else if (type.includes('payment')) {
      if (!formData.studentId || formData.paidAmount < 0) {
        setError('انتخاب دانش‌آموز الزامی است و مبلغ نباید منفی باشد.');
        return;
      }
    } else if (type.includes('expense') || type.includes('income')) {
      if (!formData.title?.trim() || formData.amount <= 0) {
        setError('تکمیل عنوان و مبلغ ضروری است.');
        return;
      }
    } else if (type.includes('exam')) {
      if (!formData.title?.trim() || formData.totalScore <= 0) {
        setError('تکمیل لوح عنوان آزمون و کل نمره الزامی است.');
        return;
      }
    } else if (type.includes('result')) {
      if (formData.score < 0) {
        setError('نمره مکتسبه نباید منفی باشد.');
        return;
      }
    }

    onSave(formData);
  };

  // Determine modal header text
  const getTitle = () => {
    switch (type) {
      case 'add_student': return 'افزودن دانش‌آموز جدید';
      case 'edit_student': return 'ویرایش اطلاعات دانش‌آموز';
      case 'add_teacher': return 'افزودن آموزگار جدید';
      case 'edit_teacher': return 'ویرایش اطلاعات آموزگار';
      case 'add_course': return 'افزودن دوره آموزشی جدید';
      case 'edit_course': return 'ویرایش جزئیات دوره';
      case 'add_payment': return 'ثبت رسید پرداخت جدید';
      case 'edit_payment': return 'ویرایش رسید پرداخت';
      case 'add_expense': return 'ثبت هزینه جدید علمی/اداری';
      case 'add_income': return 'ثبت درآمد جدید متفرقه';
      case 'add_exam': return 'ثبت آزمون و تست جدید';
      case 'add_result': return 'ثبت نمره دانش‌آموز';
      default: return 'فرم اطلاعات';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-scale-up text-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">{getTitle()}</h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs sm:text-sm">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 border border-red-150 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* DYNAMIC FIELD FIELDS */}
          
          {/* STUDENT FORM */}
          {type.includes('student') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">نام *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: علی"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تخلص (نام خانوادگی) *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: رضایی"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">نام پدر</label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: عباس"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">شماره تماس *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right text-left font-mono"
                    placeholder="09120000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">دوره آموزشی</label>
                  <select
                    name="courseId"
                    value={formData.courseId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  >
                    {extraData.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ ثبت‌نام</label>
                  <input
                    type="text"
                    name="joinDate"
                    value={formData.joinDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                    placeholder="1405/03/18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مبلغ شهریه پرداختی (افغانی)</label>
                  <input
                    type="number"
                    name="feePaid"
                    value={formData.feePaid ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">وضعیت دانش‌آموز</label>
                  <select
                    name="isActive"
                    value={formData.isActive === false ? 'false' : 'true'}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  >
                    <option value="true">فعال (در حال تحصیل)</option>
                    <option value="false">غیرفعال (انصراف/پایان‌دوره)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TEACHER FORM */}
          {type.includes('teacher') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">نام خانوادگی (تخلص) *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: علیزاده"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">نام آموزگار *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: امیر"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">حوزه تخصصی و تخصص *</label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="مثال: ریاضیات گسسته و فیزیک کنکور"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">حقوق ماهانه (افغانی)</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">شماره تماس</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right text-left font-mono"
                    placeholder="09120000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ استخدام</label>
                  <input
                    type="text"
                    name="hireDate"
                    value={formData.hireDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                    placeholder="1405/01/01"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">وضعیت همکاری</label>
                  <select
                    name="isActive"
                    value={formData.isActive === false ? 'false' : 'true'}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  >
                    <option value="true">فعال (در حال تدریس)</option>
                    <option value="false">غیرفعال (پایان قرارداد)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* COURSE FORM */}
          {type.includes('course') && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">عنوان دوره آموزشی *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="مثال: برنامه‌نویسی پایتون مقدماتی"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">انتخاب مدرس دوره</label>
                  <select
                    name="teacherId"
                    value={formData.teacherId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  >
                    {extraData.teachers.map(t => (
                      <option key={t.id} value={t.id}>{`${t.firstName} ${t.lastName}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مدت زمان دوره</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: ۳ ماه"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">شهریه ماهانه (افغانی)</label>
                  <input
                    type="number"
                    name="monthlyFee"
                    value={formData.monthlyFee ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">سطح دوره</label>
                  <select
                    name="level"
                    value={formData.level || 'متوسط'}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  >
                    <option value="مقدماتی">مقدماتی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT FORM */}
          {type.includes('payment') && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">انتخاب هنرجو (دانش‌آموز) *</label>
                <select
                  name="studentId"
                  value={formData.studentId || ''}
                  onChange={(e) => handleStudentChangeInPayment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                >
                  <option value="">-- انتخاب کنید --</option>
                  {extraData.students.map(s => (
                    <option key={s.id} value={s.id}>{`${s.firstName} ${s.lastName} (${s.id})`}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مربوط به ماه</label>
                  <input
                    type="text"
                    name="month"
                    value={formData.month || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: خرداد ۱۴۰۵"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ پرداخت</label>
                  <input
                    type="text"
                    name="paymentDate"
                    value={formData.paymentDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                    placeholder="1405/03/18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">کل مبلغ شهریه (افغانی)</label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مبلغ پرداختی هنرجو (افغانی)</label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">وضعیت تسویه حساب</label>
                <select
                  name="status"
                  value={formData.status || 'completed'}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                >
                  <option value="completed">تسویه کامل (رنگ سبز)</option>
                  <option value="partial">ناقص / علی‌الحساب (رنگ زرد)</option>
                  <option value="unpaid">پرداخت نشده (رنگ قرمز)</option>
                </select>
              </div>
            </div>
          )}

          {/* EXPENSE FORM */}
          {type.includes('expense') && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">عنوان مصرف/هزینه *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="مثال: خرید ملزومات اداری و کاغذ A4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">دسته بندی</label>
                  <select
                    name="category"
                    value={formData.category || 'سایر موارد'}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  >
                    <option value="اجاره و آبونمان">اجاره و آبونمان</option>
                    <option value="حقوق پرسنل">حقوق پرسنل / اساتید</option>
                    <option value="خرید لوازم اداری">خرید لوازم اداری</option>
                    <option value="تبلیغات و بازاریابی">تبلیغات و بازاریابی</option>
                    <option value="سایر موارد">سایر موارد</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مبلغ هزینه (افغانی) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ مصرف</label>
                  <input
                    type="text"
                    name="date"
                    value={formData.date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">پرداخت به</label>
                  <input
                    type="text"
                    name="paidTo"
                    value={formData.paidTo || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: فروشگاه افزارکود"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">توضیحات تکمیلی</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="جزئیات بیشتر را اضافه کنید..."
                />
              </div>
            </div>
          )}

          {/* INCOME FORM */}
          {type.includes('income') && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">عنوان درآمد غیرشهریه‌ای *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="مثال: درآمد حق امتیاز سمینار کنکور"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">منبع درآمد</label>
                  <input
                    type="text"
                    name="source"
                    value={formData.source || 'منابع متفرقه'}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                    placeholder="مثال: انتشارات ناوند"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مبلغ دریافتی (افغانی) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ دریافت</label>
                <input
                  type="text"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">توضیحات درآمد</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="توضیحاتی در مورد نحوه و علت پرداخت..."
                />
              </div>
            </div>
          )}

          {/* EXAM FORM */}
          {type.includes('exam') && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">نام آزمون / پروژه جدید *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="مثال: امتحان میان‌ترم علوم کامپیوتر"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">کلاس / دوره مربوطه</label>
                <select
                  name="courseId"
                  value={formData.courseId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                >
                  {extraData.courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">کل نمره (بارم)</label>
                  <input
                    type="number"
                    name="totalScore"
                    value={formData.totalScore ?? 100}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ آزمون</label>
                  <input
                    type="text"
                    name="date"
                    value={formData.date || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* RESULT / GRADE FORM */}
          {type.includes('result') && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">دانش‌آموز (هنرجو)</label>
                <select
                  name="studentId"
                  value={formData.studentId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                >
                  {extraData.students.map(s => (
                    <option key={s.id} value={s.id}>{`${s.firstName} ${s.lastName} (${s.id})`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">انتخاب آزمون برگزار شده</label>
                <select
                  name="examId"
                  value={formData.examId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                >
                  {extraData.exams.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">نمره مکتسبه</label>
                  <input
                    type="number"
                    step="any"
                    name="score"
                    value={formData.score ?? 0}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">درجه ارزشیابی</label>
                  <select
                    name="grade"
                    value={formData.grade || 'خوب'}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  >
                    <option value="عالی">عالی / ممتاز</option>
                    <option value="خوب">خوب / قبولی شایسته</option>
                    <option value="متوسط">متوسط / نیاز به تمرین</option>
                    <option value="نیاز به تلاش">مردود / نیاز به تلاش مجدد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">ملاحظات و بازخورد استاد</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                  placeholder="مثال: عملکرد عالی در حل مسئله ولی کند بودن در کدنویسی"
                />
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex gap-2.5 pt-5 border-t border-slate-100 flex-row-reverse justify-start">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/10 transition-colors duration-150 cursor-pointer"
              id="btn-save-modal"
            >
              ذخیره و ثبت اطلاعات
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors duration-150 cursor-pointer"
              id="btn-cancel-modal"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
