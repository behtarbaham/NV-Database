/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Student, Teacher, Course, Payment, Expense, Income, Exam, ExamResult } from '../types';
import { JalaliDateInput } from './JalaliDateInput';
import { getCurrentAfghanMonth, formatDisplayDate, getTodayDateInputValue, toDateInputValue } from '../utils';

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
    | 'edit_expense'
    | 'add_income'
    | 'edit_income'
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
  const initializedFormRef = useRef<{ type: EntityModalProps['type']; entityId: unknown } | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);


  const historyScope = String(type || 'record').replace(/^(add|edit)_/, '');
  const getHistoryKey = (fieldName: string) => 'navand_field_history:' + historyScope + ':' + fieldName;

  const readFieldHistory = (fieldName: string): string[] => {
    try {
      const stored = JSON.parse(localStorage.getItem(getHistoryKey(fieldName)) || '[]');
      return Array.isArray(stored) ? stored.slice(0, 5).map(String) : [];
    } catch {
      return [];
    }
  };

  const handleHistoryTap = (event: React.PointerEvent<HTMLFormElement>) => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) || !control.name || control.value || control.disabled || control.readOnly) return;
    const previous = readFieldHistory(control.name)[0];
    if (!previous) return;
    const numeric = control.inputMode === 'decimal' || control.type === 'number';
    setFormData((current: any) => ({ ...current, [control.name]: numeric ? Number(previous) : previous }));
    window.setTimeout(() => { control.focus(); control.select(); }, 0);
  };

  useEffect(() => {
    if (!isOpen) return;
    formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[name], textarea[name]').forEach((control) => {
      const previous = readFieldHistory(control.name)[0];
      control.placeholder = previous ? (['joinDate', 'hireDate', 'paymentDate', 'date'].includes(control.name) ? formatDisplayDate(previous) : previous) : '';
    });
  }, [isOpen, type, formData]);

  const saveFieldHistory = (data: Record<string, unknown>) => {
    Object.entries(data).forEach(([fieldName, value]) => {
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        typeof value === 'boolean' ||
        ['id', 'password', 'currentPassword'].includes(fieldName)
      ) {
        return;
      }

      const nextValue = String(value).trim();
      if (!nextValue) return;
      const history = readFieldHistory(fieldName);
      const nextHistory = [nextValue, ...history.filter((item) => item !== nextValue)].slice(0, 5);
      localStorage.setItem(getHistoryKey(fieldName), JSON.stringify(nextHistory));
    });
  };
  // Initialize once per open form; background refreshes must preserve the draft.
  useEffect(() => {
    if (!isOpen) {
      initializedFormRef.current = null;
      return;
    }
    const entityId = initialData?.id ?? null;
    const initialized = initializedFormRef.current;
    if (initialized?.type === type && initialized.entityId === entityId) return;
    initializedFormRef.current = { type, entityId };
    if (isOpen) {
      setError(null);
      if (initialData) {
        const editableData = { ...initialData };
        ['joinDate', 'hireDate', 'paymentDate', 'date', 'lastPaymentDate', 'nextPaymentDate'].forEach((fieldName) => {
          if (editableData[fieldName]) editableData[fieldName] = toDateInputValue(editableData[fieldName]);
        });
        setFormData(editableData);
      } else {
        // Feed defaults for addition modal
        const defaults: Record<string, any> = {
          add_student: { firstName: '', lastName: '', fatherName: '', phone: '', courseId: extraData.courses[0]?.id || '', joinDate: getTodayDateInputValue(), feePaid: 0, isActive: true },
          add_teacher: { firstName: '', lastName: '', specialty: '', phone: '', salary: 0, hireDate: getTodayDateInputValue(), isActive: true },
          add_course: { name: '', teacherId: extraData.teachers[0]?.id || '', duration: '۳ ماه', monthlyFee: 1500000, level: 'متوسط' },
          add_payment: { studentId: extraData.students[0]?.id || '', month: getCurrentAfghanMonth(), totalAmount: 0, paidAmount: 0, remainingAmount: 0, paymentDate: getTodayDateInputValue(), status: 'completed' },
          add_expense: { title: '', category: 'سایر موارد', amount: 0, date: getTodayDateInputValue(), paidTo: '', description: '' },
          add_income: { title: '', source: 'سایر موارد', amount: 0, date: getTodayDateInputValue(), description: '' },
          add_exam: { title: '', courseId: extraData.courses[0]?.id || '', date: getTodayDateInputValue(), totalScore: 100, studentCount: 0 },
          add_result: { studentId: extraData.students[0]?.id || '', examId: extraData.exams[0]?.id || '', score: 0, grade: 'خوب', description: '' },
        };
        setFormData(defaults[type || ''] || {});
      }
    }
  }, [isOpen, type, initialData, extraData]);


  useEffect(() => {
    if (!isOpen || !type) return;
    const frameId = window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !formRef.current) return;
      const focusable = Array.from(formRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')) as HTMLElement[];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, type]);

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
          remainingAmount: 0,
        }));
      } else {
        setFormData((prev: any) => ({ ...prev, studentId }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: elemType } = e.target;
    let finalVal: any = value;
    const numericFields = new Set([
      'feePaid', 'salary', 'monthlyFee', 'totalAmount', 'paidAmount',
      'remainingAmount', 'amount', 'studentCount', 'totalScore', 'score',
    ]);

    if (elemType === 'number' || numericFields.has(name)) {
      const normalizedNumber = value
        .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - '۰'.charCodeAt(0)))
        .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)))
        .replace(/[,،\s]/g, '');
      finalVal = normalizedNumber === '' ? 0 : Number(normalizedNumber);
      if (!Number.isFinite(finalVal)) return;
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
      if (!formData.firstName?.trim() || Number(formData.feePaid) < 0) {
        setError('نام شاگرد الزامی است و مبلغ پرداختی نباید منفی باشد.');
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
        setError('انتخاب دانشجو الزامی است و مبلغ نباید منفی باشد.');
        return;
      }
    } else if (type.includes('expense') || type.includes('income')) {
      if (!formData.title?.trim() || formData.amount <= 0) {
        setError('تکمیل عنوان و مبلغ ضروری است.');
        return;
      }
    } else if (type.includes('exam')) {
      if (!formData.courseId) {
        setError('لطفاً یک دوره را برای آزمون انتخاب کنید.');
        return;
      }
      if (!formData.date?.trim() || Number(formData.studentCount) < 0) {
        setError('\u062a\u0627\u0631\u06cc\u062e \u0622\u0632\u0645\u0648\u0646 \u0648 \u062a\u0639\u062f\u0627\u062f \u062f\u0627\u0646\u0634\u062c\u0648\u06cc\u0627\u0646 \u0627\u0645\u062a\u062d\u0627\u0646\u200c\u062f\u0647\u0646\u062f\u0647 \u0631\u0627 \u062f\u0631\u0633\u062a \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f.');
        return;
      }
    } else if (type.includes('result')) {
      if (formData.score < 0) {
        setError('نمره مکتسبه نباید منفی باشد.');
        return;
      }
    }

    const submittedData = type.includes('payment')
      ? {
          ...formData,
          remainingAmount: Math.max(Number(formData.totalAmount || 0) - Number(formData.paidAmount || 0), 0),
          status:
            Number(formData.paidAmount || 0) <= 0
              ? 'unpaid'
              : Number(formData.paidAmount || 0) >= Number(formData.totalAmount || 0)
                ? 'completed'
                : 'partial',
        }
      : formData;
    saveFieldHistory(submittedData);
    onSave(submittedData);
  };

  // Determine modal header text
  const getTitle = () => {
    switch (type) {
      case 'add_student': return 'افزودن دانشجو جدید';
      case 'edit_student': return 'ویرایش اطلاعات دانشجو';
      case 'add_teacher': return 'افزودن آموزگار جدید';
      case 'edit_teacher': return 'ویرایش اطلاعات آموزگار';
      case 'add_course': return 'افزودن دوره آموزشی جدید';
      case 'edit_course': return 'ویرایش جزئیات دوره';
      case 'add_payment': return 'ثبت رسید پرداخت جدید';
      case 'edit_payment': return 'ویرایش رسید پرداخت';
      case 'add_expense': return 'ثبت هزینه جدید علمی/اداری';
      case 'edit_expense': return 'ویرایش مصرف/هزینه';
      case 'add_income': return 'ثبت درآمد جدید متفرقه';
      case 'edit_income': return 'ویرایش درآمد';
      case 'add_exam': return 'ثبت آزمون و تست جدید';
      case 'add_result': return 'ثبت نمره دانشجو';
      default: return 'فرم اطلاعات';
    }
  };

  return (
    <div className="entity-modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="entity-modal-card bg-white w-full overflow-hidden max-h-[90vh] flex flex-col animate-scale-up text-right" role="dialog" aria-modal="true" aria-labelledby="entity-modal-title">
        {/* Header */}
        <div className="entity-modal-header p-4 border-b border-slate-100 flex justify-between items-center">
          <button
            onClick={onClose}
            className="icon-button p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition" aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 id="entity-modal-title" className="font-extrabold text-slate-800 text-sm sm:text-base">{getTitle()}</h3>
        </div>

        {/* Form Body */}
        <form ref={formRef} onSubmit={handleSubmit} onPointerDownCapture={handleHistoryTap} className="entity-record-form p-6 overflow-y-auto space-y-4 flex-grow text-xs sm:text-sm">
          {error && (
            <div className="entity-alert-overlay" role="alertdialog" aria-modal="true">
              <div className="entity-alert-card">
                <div className="entity-alert-icon">
                  <AlertCircle />
                </div>
                <h4>لطفاً معلومات را بررسی کنید</h4>
                <p>{error}</p>
                <button type="button" onClick={() => setError(null)}>متوجه شدم</button>
              </div>
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
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تخلص (نام خانوادگی) — اختیاری</label>
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
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">شماره تماس — اختیاری</label>
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
                  <JalaliDateInput
                    name="joinDate"
                    value={formData.joinDate || ''}
                    onChange={(value) => setFormData((previous: any) => ({ ...previous, joinDate: value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                    placeholder="1405/03/18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="text-sm font-bold text-slate-600">فیس ماهانه (افغانی)<input type="text" inputMode="decimal" name="monthlyFee" value={formData.monthlyFee || ''} onChange={handleInputChange} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مبلغ شهریه پرداختی (افغانی) *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="feePaid"
                    value={formData.feePaid || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">وضعیت دانشجو</label>
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
                    type="text"
                    inputMode="decimal"
                    name="salary"
                    value={formData.salary || ''}
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
                  <JalaliDateInput
                    name="hireDate"
                    value={formData.hireDate || ''}
                    onChange={(value) => setFormData((previous: any) => ({ ...previous, hireDate: value }))}
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
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">انتخاب استاد دوره</label>
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
                    type="text"
                    inputMode="decimal"
                    name="monthlyFee"
                    value={formData.monthlyFee || ''}
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
                <label className="block text-slate-600 font-bold mb-1.5 text-right">انتخاب دانشجو *</label>
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
                    placeholder="مثال: جوزا ۱۴۰۵"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ پرداخت</label>
                  <JalaliDateInput
                    name="paymentDate"
                    value={formData.paymentDate || ''}
                    onChange={(value) => setFormData((previous: any) => ({ ...previous, paymentDate: value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                    placeholder="1405/03/18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">کل مبلغ شهریه (افغانی)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="totalAmount"
                    value={formData.totalAmount || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">مبلغ پرداختی دانشجو (افغانی)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="paidAmount"
                    value={formData.paidAmount || ''}
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
                    type="text"
                    inputMode="decimal"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ مصرف</label>
                  <JalaliDateInput
                    name="date"
                    value={formData.date || ''}
                    onChange={(value) => setFormData((previous: any) => ({ ...previous, date: value }))}
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
                    type="text"
                    inputMode="decimal"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-right">تاریخ دریافت</label>
                <JalaliDateInput
                  name="date"
                  value={formData.date || ''}
                  onChange={(value) => setFormData((previous: any) => ({ ...previous, date: value }))}
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
                <label className="block text-slate-600 font-bold mb-1.5 text-right">{'\u0627\u0646\u062a\u062e\u0627\u0628 \u062f\u0648\u0631\u0647 *'}</label>
                <select
                  name="courseId"
                  value={formData.courseId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right"
                >
                  <option value="">{'\u06cc\u06a9 \u062f\u0648\u0631\u0647 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f'}</option>
                  {extraData.courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">{'\u062a\u0627\u0631\u06cc\u062e \u0622\u0632\u0645\u0648\u0646 *'}</label>
                  <JalaliDateInput
                    name="date"
                    value={formData.date || ''}
                    onChange={(value) => setFormData((previous: any) => ({ ...previous, date: value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition text-right font-mono"
                    placeholder="1405/03/18"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1.5 text-right">{'\u062a\u0639\u062f\u0627\u062f \u062f\u0627\u0646\u0634\u062c\u0648\u06cc\u0627\u0646 \u0627\u0645\u062a\u062d\u0627\u0646\u200c\u062f\u0647\u0646\u062f\u0647 *'}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    min="0"
                    name="studentCount"
                    value={formData.studentCount || ''}
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
                <label className="block text-slate-600 font-bold mb-1.5 text-right">دانشجو</label>
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
                    type="text"
                    inputMode="decimal"
                    name="score"
                    value={formData.score || ''}
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
          <div className="entity-modal-actions flex gap-2.5 pt-5 border-t border-slate-100 flex-row-reverse justify-start">
            <button
              type="submit"
              className="entity-modal-save px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-colors duration-150 cursor-pointer"
              id="btn-save-modal"
            >
              ذخیره و ثبت اطلاعات
            </button>
            <button
              type="button"
              onClick={onClose}
              className="entity-modal-cancel px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors duration-150 cursor-pointer"
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
