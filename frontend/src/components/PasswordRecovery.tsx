import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import type { AuthUser } from '../types';

type RecoveryResponse = { ok: boolean; message?: string; recoveryCode?: string; reset?: boolean; user?: AuthUser };
type RecoveryInput = { username: string; currentPassword?: string; recoveryCode?: string; password?: string };

async function recoveryRequest(action: 'createRecoveryCode' | 'resetPassword' | 'registerAccount', input: RecoveryInput) {
  let result: RecoveryResponse;
  if (window.navandApi) {
    result = action === 'registerAccount'
      ? await window.navandApi.registerAccount({ username: input.username, password: input.password || '', recoveryCode: input.recoveryCode || '' })
      : await window.navandApi[action](input);
  } else {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';
    const route = action === 'registerAccount' ? 'register' : action === 'createRecoveryCode' ? 'recovery-code' : 'reset-password';
    try {
      result = (await axios.post<RecoveryResponse>(`${base}/api/auth/${route}`, input)).data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('ارتباط با برنامه برقرار نشد؛ برنامه را دوباره باز کنید.');
    }
  }
  if (!result.ok) throw new Error(result.message || 'عملیات انجام نشد.');
  return result;
}

const inputClass = 'w-full mt-1.5 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm';
const buttonClass = 'w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl';

export function RecoveryCodeSetup({ username, currentPassword }: { username: string; currentPassword: string }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const generate = async () => {
    setError('');
    if (!currentPassword) { setError('ابتدا رمز فعلی را در کادر بالا وارد کنید.'); return; }
    setBusy(true);
    try {
      const result = await recoveryRequest('createRecoveryCode', { username, currentPassword });
      if (mounted.current) setCode(result.recoveryCode || '');
    } catch (error) {
      if (mounted.current) setError(error instanceof Error ? error.message : 'ساخت کد انجام نشد.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <section className="border-t border-slate-200 pt-4 space-y-3">
      <h3 className="font-bold text-sm">کد بازیابی رمز عبور</h3>
      <p className="text-xs text-slate-600 leading-6">با رمز فعلی کد بازیابی بسازید و آن را در جای امن نگه دارید. ساخت کد شخصی جدید، کد قبلی و کد موقت را برای این حساب باطل می‌کند.</p>
      <button type="button" className={buttonClass} disabled={busy} onClick={generate}>
        {busy ? 'در حال ساخت...' : 'ساخت کد بازیابی جدید'}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {code && (
        <div className="rounded-xl bg-blue-50 p-3 space-y-2" role="status">
          <p className="text-xs leading-6">این کد فقط اکنون نمایش داده می‌شود؛ آن را یادداشت کنید. کد برای یک بار بازنشانی رمز قابل استفاده است.</p>
          <input aria-label="کد بازیابی ساخته‌شده" className={inputClass + ' font-mono'} dir="ltr" readOnly value={code} onFocus={(event) => event.currentTarget.select()} />
        </div>
      )}
    </section>
  );
}

export function PasswordResetScreen({ onBack }: { onBack: () => void }) {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) { setError('رمز جدید و تکرار آن یکسان نیست.'); return; }
    setBusy(true);
    try {
      await recoveryRequest('resetPassword', { username, recoveryCode: code, password });
      setPassword(''); setConfirmation(''); setCode(''); setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'بازنشانی رمز انجام نشد.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-screen min-h-screen flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="login-card w-full bg-white overflow-hidden">
        <div className="login-header px-6 py-5"><h1 className="font-extrabold">بازنشانی رمز عبور</h1></div>
        {success ? (
          <div className="p-6 space-y-4">
            <p role="status" className="text-green-700 leading-7">رمز عبور تغییر کرد. با رمز جدید وارد شوید و سپس کد بازیابی تازه بسازید.</p>
            <button type="button" className={buttonClass} onClick={onBack}>بازگشت به ورود</button>
          </div>
        ) : (
          <form className="login-form p-6 space-y-4" onSubmit={submit}>
            <p className="text-xs text-slate-600 leading-6">کدی را که هنگام ساخت حساب انتخاب کرده‌اید یا از بخش تغییر حساب گرفته‌اید وارد کنید. حساب کامپیوتر قبلی پس از بازیابی بکاپ قابل استفاده است.</p>
            <label className="block text-sm font-bold">نام کاربری
              <input className={inputClass} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required autoFocus disabled={busy} />
            </label>
            <label className="block text-sm font-bold">کد بازیابی
              <input className={inputClass + ' font-mono'} dir="ltr" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" spellCheck={false} required disabled={busy} />
            </label>
            <label className="block text-sm font-bold">رمز جدید
              <input className={inputClass} type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={4} required disabled={busy} />
            </label>
            <label className="block text-sm font-bold">تکرار رمز جدید
              <input className={inputClass} type={visible ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={4} required disabled={busy} />
            </label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} />نمایش رمز</label>
            {error && <p role="alert" className="text-sm text-red-700 leading-6">{error}</p>}
            <button type="submit" className={buttonClass} disabled={busy}>{busy ? 'در حال بازنشانی...' : 'ذخیره رمز جدید'}</button>
            <button type="button" className="w-full text-sm text-blue-700 py-2" disabled={busy} onClick={onBack}>بازگشت به ورود</button>
            <p className="text-xs text-slate-600 leading-6">کد بازیابی مخصوص همان حساب است. اگر هنوز وارد می‌شوید، از بخش تغییر حساب کد تازه بسازید. برای حساب کامپیوتر قبلی، بکاپ را بازیابی کنید.</p>
          </form>
        )}
        <p className="text-xs text-center text-slate-500 pb-4">نسخهٔ {import.meta.env.VITE_APP_VERSION || 'نامشخص'}</p>
      </div>
    </div>
  );
}

export function AccountRegistration({ onBack, onCreated }: { onBack: () => void; onCreated: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [codeConfirmation, setCodeConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdUsername, setCreatedUsername] = useState('');
  const [savedCode, setSavedCode] = useState(false);
  const canonicalCode = (value: string) => value.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06F0)).replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660)).trim();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) { setError('رمز عبور و تکرار آن یکسان نیست.'); return; }
    if (canonicalCode(code) !== canonicalCode(codeConfirmation)) { setError('کد بازیابی و تکرار آن یکسان نیست.'); return; }
    if (!/^[0-9]{8}$/.test(canonicalCode(code))) { setError('برای بازیابی یک کد ۸رقمی انتخاب کنید.'); return; }
    setBusy(true);
    try {
      const response = await recoveryRequest('registerAccount', { username, password, recoveryCode: canonicalCode(code) });
      setCreatedUsername(response.user?.username || username.trim().toLowerCase());
      setPassword(''); setConfirmation('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ساخت حساب انجام نشد.';
      const translations: Record<string, string> = {
        'Username must be at least 3 characters.': 'نام کاربری حداقل ۳ نویسه باشد.',
        'Password must be at least 6 characters.': 'رمز عبور حداقل ۶ نویسه باشد.',
        'This username is already registered.': 'این نام کاربری قبلاً ثبت شده؛ نام دیگری انتخاب کنید یا به بخش ورود برگردید.',
      };
      setError(translations[message] || message);
    } finally { setBusy(false); }
  };
  return (
    <div className="login-screen min-h-screen flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="login-card w-full bg-white overflow-hidden">
        <div className="login-header px-6 py-5"><h1 className="font-extrabold">ساخت حساب جدید</h1></div>
        {createdUsername ? (
          <div className="p-6 space-y-4">
            <p role="status" className="text-green-700 leading-7">حساب شما ساخته شد. اکنون با نام کاربری و رمز انتخاب‌شده وارد شوید.</p>
            <p className="text-sm">نام کاربری: <bdi className="font-bold">{createdUsername}</bdi></p>
            <label className="block text-sm font-bold">کد بازیابی انتخاب‌شده
              <input className={inputClass + ' font-mono'} dir="ltr" value={canonicalCode(code)} readOnly onFocus={event => event.currentTarget.select()} />
            </label>
            <p className="text-xs leading-6 text-slate-600">این کد مخصوص همین حساب است؛ آن را یادداشت کنید. پس از یک بار بازنشانی رمز، از بخش تغییر حساب کد تازه بسازید.</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={savedCode} onChange={event => setSavedCode(event.target.checked)} />کد بازیابی را یادداشت کرده‌ام</label>
            <button type="button" className={buttonClass} disabled={!savedCode} onClick={() => onCreated(createdUsername)}>رفتن به صفحهٔ ورود</button>
          </div>
        ) : (
          <form onSubmit={submit} className="login-form p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <p className="text-xs leading-6 text-slate-600">نام کاربری، رمز و کد بازیابی دلخواه خود را انتخاب کنید. این حساب روی همین کامپیوتر ذخیره می‌شود.</p>
            <label className="block text-sm font-bold">نام کاربری
              <input className={inputClass} value={username} onChange={event => setUsername(event.target.value)} minLength={3} required autoComplete="username" autoFocus disabled={busy} />
            </label>
            <label className="block text-sm font-bold">رمز عبور
              <input className={inputClass} type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} minLength={6} required autoComplete="new-password" disabled={busy} />
            </label>
            <label className="block text-sm font-bold">تکرار رمز عبور
              <input className={inputClass} type={visible ? 'text' : 'password'} value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={6} required autoComplete="new-password" disabled={busy} />
            </label>
            <label className="block text-sm font-bold">کد بازیابی دلخواه (۸ رقم)
              <input className={inputClass} dir="ltr" type={visible ? 'text' : 'password'} inputMode="numeric" value={code} onChange={event => setCode(event.target.value)} minLength={8} maxLength={8} required autoComplete="off" disabled={busy} />
            </label>
            <label className="block text-sm font-bold">تکرار کد بازیابی
              <input className={inputClass} dir="ltr" type={visible ? 'text' : 'password'} inputMode="numeric" value={codeConfirmation} onChange={event => setCodeConfirmation(event.target.value)} minLength={8} maxLength={8} required autoComplete="off" disabled={busy} />
            </label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />نمایش رمز و کد</label>
            {error && <p role="alert" className="text-sm text-red-700 leading-6">{error}</p>}
            <button type="submit" className={buttonClass} disabled={busy}>{busy ? 'در حال ساخت حساب...' : 'ساخت حساب و ذخیرهٔ کد بازیابی'}</button>
            <button type="button" className="w-full py-2 text-sm text-blue-700" disabled={busy} onClick={onBack}>بازگشت به ورود</button>
          </form>
        )}
        <p className="text-xs text-center text-slate-500 pb-4">نسخهٔ {import.meta.env.VITE_APP_VERSION || 'نامشخص'}</p>
      </div>
    </div>
  );
}
