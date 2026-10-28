import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Download, Upload } from 'lucide-react';
import { buildExcel, downloadExcel, readExcel, planExcelImport, sheetNames, ExcelData, ImportKind, ImportPlan } from '../utils/excel';
import { formatDisplayDate, getTodayDateInputValue, toPersianDigits } from '../utils';
export function ExcelPanel({ data, onImport }: { data: ExcelData; onImport: (kind:ImportKind, rows:Record<string,unknown>[])=>Promise<{ added: number; updated: number }> }) {
 const [kind,setKind]=useState<ImportKind>('students');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');const [plan,setPlan]=useState<ImportPlan|null>(null);const [rows,setRows]=useState<Record<string,unknown>[]>([]);const fileRef=useRef<HTMLInputElement>(null);
 const exportFile=async(template=false)=>{setBusy(true);setError('');try{downloadExcel(await buildExcel(data,template),(template?'قالب-ورود-اطلاعات-':'گزارش-ناوند-')+formatDisplayDate(getTodayDateInputValue()).replaceAll('/','-')+'.xlsx');}catch{setError('ساخت فایل اکسل موفق نشد.');}finally{setBusy(false);}};
 const selectFile=async(file?:File)=>{if(!file)return;setBusy(true);setError('');setMessage('');setPlan(null);try{const parsed=await readExcel(file,kind);setRows(parsed);setPlan(planExcelImport(kind,parsed,data));}catch(e){setError(e instanceof Error?e.message:'فایل خوانده نشد.');}finally{setBusy(false);if(fileRef.current)fileRef.current.value='';}};
 const commit=async()=>{setBusy(true);setError('');try{const count=await onImport(kind,rows);setMessage(toPersianDigits(count.added)+' ردیف جدید ثبت و '+toPersianDigits(count.updated)+' ردیف به‌روز شد.');setPlan(null);setRows([]);}catch(e){setError(e instanceof Error?e.message:'ثبت اطلاعات موفق نشد.');}finally{setBusy(false);}};
 return <section className="no-print space-y-4 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="excel-title">
  <h3 id="excel-title" className="flex items-center gap-2 font-extrabold text-slate-800"><FileSpreadsheet className="h-5 w-5 text-emerald-600" />ورود و خروجی اکسل</h3>
  <p className="text-sm text-slate-600">خروجی کامل اطلاعات در ۸ برگه؛ تاریخ‌ها هجری شمسی افغانستان هستند. فایل را بیرون از برنامه ویرایش و دوباره وارد کنید؛ ردیف‌های دارای شناسهٔ قبلی به‌روز و ردیف‌های تازه اضافه می‌شوند. حذف ردیف از اکسل، اطلاعات دیتابیس را حذف نمی‌کند.</p>
  <div className="flex flex-wrap items-center gap-3">
   <button type="button" disabled={busy} onClick={()=>exportFile()} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Download className="h-4 w-4" />خروجی کامل اکسل</button>
   <button type="button" disabled={busy} onClick={()=>exportFile(true)} className="rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-bold text-emerald-700 disabled:opacity-50">دریافت قالب خالی</button>
  </div>
  <div className="flex flex-wrap items-end gap-3">
   <label className="text-sm font-bold text-slate-600">نوع اطلاعات ورودی<select disabled={busy} value={kind} onChange={e=>{setKind(e.target.value as ImportKind);setPlan(null);setRows([]);setError('');setMessage('');}} className="mr-3 rounded-xl border border-slate-200 px-3 py-2.5">{(['students','payments','expenses','incomes'] as ImportKind[]).map(key=><option key={key} value={key}>{sheetNames[key]}</option>)}</select></label>
   <input ref={fileRef} type="file" accept=".xlsx" hidden onChange={event=>selectFile(event.target.files?.[0])} />
   <button type="button" disabled={busy} onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700 disabled:opacity-50"><Upload className="h-4 w-4" />انتخاب اکسل و پیش‌نمایش</button>
  </div>
  <p className="text-xs text-slate-500">ستون «شناسه» ردیف‌های قبلی را تغییر ندهید؛ برای ردیف تازه آن را خالی بگذارید. ستون‌های موجود در فایل جایگزین می‌شوند و سلول خالی، مقدار قبلی همان فیلد را پاک می‌کند. هر بار نوع برگهٔ مورد نظر را انتخاب کنید. در ورود شاگردان، مضمون جدید بدون تعیین استاد ساخته می‌شود؛ استاد را بعداً در بخش دوره‌ها مشخص کنید. برای شماره تماس، نوع سلول اکسل را Text نگه دارید.</p>
  {busy&&<p role="status" className="text-sm text-blue-700">در حال پردازش…</p>}{error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}{message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
  {plan&&<div className="space-y-3 rounded-xl border border-slate-200 p-4">
   <p className="font-bold">{toPersianDigits(plan.additions.length)} ردیف جدید · {toPersianDigits(plan.updates.length)} به‌روزرسانی · {toPersianDigits(plan.skipped)} بدون تغییر / تکراری · {toPersianDigits(plan.errors.length)} خطا · {toPersianDigits(plan.courses.length)} مضمون جدید</p>
   {plan.errors.length>0&&<div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">هیچ ردیفی تا اصلاح خطاها ثبت نمی‌شود.<ul className="mt-2 list-inside list-disc">{plan.errors.slice(0,20).map((error,index)=><li key={index}>{error}</li>)}</ul></div>}
   <div className="max-h-64 overflow-auto"><table className="w-full text-right text-sm"><thead><tr><th className="p-2">عملیات</th><th className="p-2">نام / عنوان</th><th className="p-2">شناسه</th><th className="p-2">مبلغ / فیس</th><th className="p-2">تاریخ / پرداخت بعدی</th></tr></thead><tbody>{[...plan.updates,...plan.additions].slice(0,30).map((row:any)=><tr key={row.id} className="border-t border-slate-100"><td className="p-2">{plan.updates.some(item=>item.id===row.id)?'به‌روزرسانی':'جدید'}</td><td className="p-2">{row.firstName?row.firstName+' '+row.lastName:row.title||data.students.find(s=>s.id===row.studentId)?.firstName}</td><td className="p-2">{row.id}</td><td className="p-2">{toPersianDigits(row.monthlyFee??row.amount??row.paidAmount??0)}</td><td className="p-2">{formatDisplayDate(row.nextPaymentDate||row.date||row.paymentDate||'')}</td></tr>)}</tbody></table></div>
   <p className="text-xs text-slate-500">حداکثر ۳۰ ردیف اول نمایش داده می‌شود. پیش از ثبت، بکاپ خودکار گرفته می‌شود.</p>
   <button type="button" disabled={busy||plan.errors.length>0||plan.additions.length+plan.updates.length===0} onClick={commit} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">تأیید افزودن و به‌روزرسانی</button>
  </div>}
 </section>;
}
