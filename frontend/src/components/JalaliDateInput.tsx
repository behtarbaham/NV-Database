import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatDisplayDate, getTodayDateInputValue, toDateInputValue, toEnglishDigits, toPersianDigits } from '../utils';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
};
const months = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
const parts = (value: string) => toEnglishDigits(formatDisplayDate(value || getTodayDateInputValue())).split('/').map(Number);

export function JalaliDateInput({ value, onChange, placeholder, ...props }: Props) {
  const [draft, setDraft] = useState(() => value ? formatDisplayDate(value) : '');
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => parts(value));
  const lastEmitted = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setDraft(value ? formatDisplayDate(value) : '');
    setInvalid(false);
    inputRef.current?.setCustomValidity('');
  }, [value]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  const emit = (text: string) => {
    setDraft(text);
    const raw = toEnglishDigits(text.trim());
    const iso = /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(raw) ? toDateInputValue(raw) : '';
    const bad = raw !== '' && !iso;
    setInvalid(bad);
    inputRef.current?.setCustomValidity(bad ? 'تاریخ شمسی معتبر انتخاب یا وارد کنید.' : '');
    lastEmitted.current = iso;
    onChange(iso);
  };
  const [year, month, day] = selected;
  const currentYear = parts(getTodayDateInputValue())[0];
  const years = Array.from({ length: Math.max(currentYear + 10, year) - Math.min(1300, year) + 1 }, (_, i) => Math.min(1300, year) + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1).filter(d => toDateInputValue(`${year}/${month}/${d}`));
  const selectPart = (index: number, next: number) => {
    const updated = [...selected]; updated[index] = next;
    while (updated[2] > 1 && !toDateInputValue(updated.join('/'))) updated[2]--;
    setSelected(updated);
  };
  return <div ref={rootRef} className="relative">
    <div className="relative">
      <input {...props} ref={inputRef} type="text" inputMode="numeric" dir="ltr" autoComplete="off" placeholder={placeholder || ''} value={draft} aria-invalid={invalid || undefined} style={{ ...props.style, paddingLeft: '2.75rem' }} onChange={event => emit(event.target.value)} />
      <button type="button" disabled={props.disabled || props.readOnly} aria-label="انتخاب تاریخ شمسی" aria-expanded={open} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => { setSelected(parts(value)); setOpen(!open); }}><CalendarDays size={19} /></button>
    </div>
    {invalid && <p className="mt-1 text-xs text-rose-600">تاریخ شمسی معتبر انتخاب یا وارد کنید.</p>}
    {open && <div className="relative z-20 mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg" dir="rtl" role="group" aria-label="انتخاب تاریخ هجری شمسی افغانستان" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); inputRef.current?.focus(); } }}>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-slate-600">روز<select aria-label="روز" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={day} onChange={e => selectPart(2, Number(e.target.value))}>{days.map(d => <option key={d} value={d}>{toPersianDigits(d)}</option>)}</select></label>
        <label className="text-xs text-slate-600">ماه<select aria-label="ماه" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={month} onChange={e => selectPart(1, Number(e.target.value))}>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
        <label className="text-xs text-slate-600">سال<select aria-label="سال" className="mt-1 w-full rounded-lg border border-slate-200 p-2" value={year} onChange={e => selectPart(0, Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{toPersianDigits(y)}</option>)}</select></label>
      </div>
      <div className="mt-3 flex gap-2"><button type="button" className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white" onClick={() => { emit(toPersianDigits(selected.join('/'))); setOpen(false); inputRef.current?.focus(); }}>انتخاب تاریخ</button><button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-xs" onClick={() => { emit(formatDisplayDate(getTodayDateInputValue())); setOpen(false); }}>امروز</button><button type="button" className="rounded-lg px-3 py-2 text-xs" onClick={() => { emit(''); setOpen(false); }}>پاک کردن</button></div>
    </div>}
  </div>;
}
