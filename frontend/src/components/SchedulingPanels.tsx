import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, School } from 'lucide-react';
import { Classroom, TimetableEntry, Teacher, Course } from '../types';
import { generateId, toPersianDigits } from '../utils';

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500';
const buttonClass = 'rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50';

export function RoomsPanel({ rooms, timetable, onSave, onDelete }: {
  rooms: Classroom[]; timetable: TimetableEntry[];
  onSave: (room: Classroom) => void; onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Classroom | null>(null);
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const name = draft.name.trim();
    if (!name || rooms.some((room) => room.id !== draft.id && room.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError('نام اتاق را وارد کنید؛ نام اتاق نباید تکراری باشد.'); return;
    }
    onSave({ ...draft, id: draft.id || generateId('ROOM'), name });
    setDraft(null); setError('');
  };
  return <section className="workspace-content space-y-5 text-right" aria-labelledby="rooms-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="rooms-title" className="flex items-center gap-2 text-xl font-extrabold text-slate-800"><School className="h-6 w-6" />اتاق‌های درسی</h2><p className="mt-1 text-sm text-slate-500">صنف‌ها و اتاق‌های محل برگزاری درس</p></div>
      <button type="button" className={buttonClass} onClick={() => { setDraft({ id: '', name: '' }); setError(''); }}>افزودن اتاق درسی</button>
    </div>
    {draft && <form onSubmit={submit} className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <h3 className="font-bold">{draft.id ? 'ویرایش اتاق درسی' : 'اتاق درسی جدید'}</h3>
      <label className="block text-sm font-bold">نام یا شمارهٔ اتاق<input autoFocus required maxLength={100} className={inputClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="مثلاً اتاق ۱" /></label>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2"><button type="submit" className={buttonClass}>ذخیرهٔ اتاق</button><button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm" onClick={() => { setDraft(null); setError(''); }}>انصراف</button></div>
    </form>}
    {!rooms.length ? <p className="rounded-2xl border border-slate-200 p-6 text-center text-slate-500">هنوز اتاق درسی ثبت نشده است.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rooms.map((room) => {
      const count = timetable.filter((entry) => entry.roomId === room.id).length;
      return <article key={room.id} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-extrabold text-slate-800">{room.name}</h3><p className="mt-2 text-sm text-slate-500">{toPersianDigits(count)} تایم درسی ثبت‌شده</p>
        <div className="mt-4 flex gap-2"><button type="button" className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700" aria-label={'ویرایش ' + room.name} onClick={() => { setDraft(room); setError(''); }}><Edit className="h-4 w-4" />ویرایش</button>
        <button type="button" disabled={count > 0} title={count ? 'ابتدا تایم‌های این اتاق را از تقسیم اوقات حذف کنید.' : 'حذف اتاق'} className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:opacity-40" aria-label={'حذف ' + room.name} onClick={() => onDelete(room.id)}><Trash2 className="h-4 w-4" />حذف</button></div>
      </article>;
    })}</div>}
  </section>;
}

export function TimetablePanel({ entries, rooms, teachers, courses, onSave, onDelete, onOpenRooms }: {
  entries: TimetableEntry[]; rooms: Classroom[]; teachers: Teacher[]; courses: Course[];
  onSave: (entry: TimetableEntry) => void; onDelete: (id: string) => void; onOpenRooms: () => void;
}) {
  const [draft, setDraft] = useState<TimetableEntry | null>(null);
  const [error, setError] = useState('');
  const missing = !rooms.length || !teachers.length || !courses.length;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!teachers.some((item) => item.id === draft.teacherId) || !courses.some((item) => item.id === draft.courseId) || !rooms.some((item) => item.id === draft.roomId)) { setError('استاد، مضمون و اتاق درسی را انتخاب کنید.'); return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.endTime) || draft.startTime >= draft.endTime) { setError('تایم ختم باید بعد از تایم شروع باشد.'); return; }
    if (entries.some((item) => item.id !== draft.id && item.startTime < draft.endTime && draft.startTime < item.endTime && (item.roomId === draft.roomId || item.teacherId === draft.teacherId))) { setError('این تایم با برنامهٔ دیگر استاد یا اتاق درسی تداخل دارد.'); return; }
    onSave({ ...draft, id: draft.id || generateId('TIME') }); setDraft(null); setError('');
  };
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-right" aria-labelledby="timetable-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
      <div><h2 id="timetable-title" className="flex items-center gap-2 font-extrabold text-slate-800"><Clock className="h-5 w-5 text-blue-600" />تقسیم اوقات درسی کورس</h2><p className="mt-1 text-xs text-slate-500">برنامهٔ روزانه · تایم‌ها به وقت کابل</p></div>
      <button type="button" disabled={missing} className={buttonClass + ' flex items-center gap-1'} onClick={() => { setDraft({ id: '', teacherId: courses[0]?.teacherId || teachers[0]?.id || '', courseId: courses[0]?.id || '', roomId: rooms[0]?.id || '', startTime: '08:00', endTime: '09:00' }); setError(''); }}><Plus className="h-4 w-4" />افزودن تایم درسی</button>
    </div>
    {missing && <div className="m-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">برای ثبت تقسیم اوقات، استاد، مضمون در بخش دوره‌ها و اتاق درسی را ثبت کنید. <button type="button" onClick={onOpenRooms} className="font-bold underline">مدیریت اتاق‌های درسی</button></div>}
    {draft && <form onSubmit={submit} className="m-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <h3 className="font-bold">{draft.id ? 'ویرایش تایم درسی' : 'تایم درسی جدید'}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-bold">مضمون<select required className={inputClass} value={draft.courseId} onChange={(event) => { const course = courses.find((item) => item.id === event.target.value); setDraft({ ...draft, courseId: event.target.value, teacherId: course?.teacherId || draft.teacherId }); }}>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
        <label className="text-sm font-bold">استاد<select required className={inputClass} value={draft.teacherId} onChange={(event) => setDraft({ ...draft, teacherId: event.target.value })}>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</option>)}</select></label>
        <label className="text-sm font-bold">اتاق درسی<select required className={inputClass} value={draft.roomId} onChange={(event) => setDraft({ ...draft, roomId: event.target.value })}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label>
        <label className="text-sm font-bold">تایم شروع<input type="time" required dir="ltr" className={inputClass} value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} /></label>
        <label className="text-sm font-bold">تایم ختم<input type="time" required dir="ltr" className={inputClass} value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} /></label>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2"><button type="submit" className={buttonClass}>ذخیرهٔ تایم</button><button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm" onClick={() => { setDraft(null); setError(''); }}>انصراف</button></div>
    </form>}
    <div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">نام استاد</th><th className="p-4">مضمون</th><th className="p-4">تایم</th><th className="p-4">اتاق درسی</th><th className="p-4">عملیات</th></tr></thead>
      <tbody>{[...entries].sort((a,b) => a.startTime.localeCompare(b.startTime)).map((entry) => {
        const teacher = teachers.find((item) => item.id === entry.teacherId);
        return <tr key={entry.id} className="border-t border-slate-100"><td className="p-4 font-bold">{teacher ? teacher.firstName + ' ' + teacher.lastName : 'استاد موجود نیست'}</td><td className="p-4">{courses.find((item) => item.id === entry.courseId)?.name || 'مضمون موجود نیست'}</td><td className="whitespace-nowrap p-4 font-mono" dir="ltr">{toPersianDigits(entry.startTime)} – {toPersianDigits(entry.endTime)}</td><td className="p-4">{rooms.find((item) => item.id === entry.roomId)?.name || 'اتاق موجود نیست'}</td><td className="p-4"><div className="flex gap-2"><button type="button" className="rounded-lg bg-blue-50 p-2 text-blue-700" aria-label="ویرایش تایم درسی" onClick={() => { setDraft(entry); setError(''); }}><Edit className="h-4 w-4" /></button><button type="button" className="rounded-lg bg-rose-50 p-2 text-rose-700" aria-label="حذف تایم درسی" onClick={() => onDelete(entry.id)}><Trash2 className="h-4 w-4" /></button></div></td></tr>;
      })}{!entries.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">هنوز تقسیم اوقات درسی ثبت نشده است.</td></tr>}</tbody>
    </table></div>
  </section>;
}
