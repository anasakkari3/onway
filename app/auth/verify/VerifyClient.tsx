'use client';

import { useEffect, useState } from 'react';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { setSessionAndSync } from '@/app/(auth)/login/actions';

const EMAIL_KEY = 'emailForSignIn';

export default function VerifyClient() {
  const [status, setStatus] = useState<'verifying' | 'prompt' | 'done' | 'error'>('verifying');
  const [promptEmail, setPromptEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const completeSignIn = async (email: string) => {
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithEmailLink(auth, email, window.location.href);
      const token = await result.user.getIdToken();
      await setSessionAndSync(token);
      window.localStorage.removeItem(EMAIL_KEY);
      setStatus('done');
      // Small delay so user sees success state before redirect
      setTimeout(() => { window.location.replace('/app'); }, 800);
    } catch {
      setErrorMsg(
        'انتهت صلاحية الرابط أو تم استخدامه بالفعل. عد للصفحة السابقة وطلب رابطاً جديداً.'
      );
      setStatus('error');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const verifyEmailLink = async () => {
      await Promise.resolve();
      if (cancelled) return;

      const auth = getFirebaseAuth();
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setErrorMsg('هذا الرابط غير صالح أو انتهت صلاحيته.');
        setStatus('error');
        return;
      }

      const savedEmail = window.localStorage.getItem(EMAIL_KEY);
      if (savedEmail) {
        await completeSignIn(savedEmail);
      } else {
        // User opened the link on a different device — ask for email.
        setStatus('prompt');
      }
    };

    void verifyEmailLink();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-sky-400/40 border-t-sky-500 animate-spin" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">جارٍ التحقق من الرابط...</p>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-4xl">✅</div>
        <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">تم الدخول بنجاح!</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">جارٍ التحويل...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="text-4xl">❌</div>
        <p className="text-base font-semibold text-red-700 dark:text-red-400">تعذّر الدخول</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{errorMsg}</p>
        <a
          href="/login"
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
        >
          العودة لصفحة الدخول
        </a>
      </div>
    );
  }

  // prompt — user opened on different device
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">أكّد بريدك الإلكتروني</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          فتحت الرابط من جهاز مختلف. أدخل بريدك للتحقق.
        </p>
      </div>
      <input
        type="email"
        dir="ltr"
        autoComplete="email"
        value={promptEmail}
        onChange={(e) => setPromptEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
      />
      {errorMsg && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}
      <button
        type="button"
        onClick={() => promptEmail.trim() && completeSignIn(promptEmail.trim())}
        className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
      >
        تأكيد وتسجيل الدخول
      </button>
    </div>
  );
}
