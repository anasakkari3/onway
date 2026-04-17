'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import BrandLogo from '@/components/BrandLogo';
import HeroRouteScene from '@/components/public/HeroRouteScene';
import { BRAND_NAME, brandCopy } from '@/lib/brand/config';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { setSessionAndSync } from './actions';

type SupportedLang = 'en' | 'ar' | 'he';
type AuthMode = 'login' | 'signup' | 'reset' | 'verify';

type ScreenCopy = {
  title: string;
  subtitle: string;
  login: string;
  signup: string;
  forgot: string;
  email: string;
  password: string;
  confirmPassword: string;
  remember: string;
  loginButton: string;
  signupButton: string;
  resetButton: string;
  working: string;
  resetComplete: string;
  noAccount: string;
  hasAccount: string;
  forgotPrompt: string;
  backToLogin: string;
  resetSent: string;
  verificationTitle: string;
  verificationBody: (email: string) => string;
  verificationSent: string;
  verifiedContinue: string;
  resendVerification: string;
  verifiedReturning: string;
  decisionTitle: string;
  decisionBody: string;
  googleButton: string;
  googleCancelled: string;
  emailDivider: string;
  trustBadge: string;
  timeBadge: string;
  continueBrowsing: string;
  reassurance: string[];
  passwordHelp: string;
  passwordRules: string[];
  passwordsDontMatch: string;
  weakPassword: string;
  emailRequired: string;
  passwordRequired: string;
  trustTitle: string;
  trustBullets: string[];
  privacyNote: string;
  terms: string;
  privacy: string;
  errors: Record<string, string>;
};

const COPY: Record<SupportedLang, ScreenCopy> = {
  en: {
    title: `Welcome to ${BRAND_NAME}`,
    subtitle: 'Sign in with email and password. New accounts verify their email once.',
    login: 'Log in',
    signup: 'Create account',
    forgot: 'Forgot password?',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    remember: 'Remember this device',
    loginButton: 'Log in',
    signupButton: 'Join now',
    resetButton: 'Send reset email',
    working: 'Please wait...',
    resetComplete: 'Password updated. Log in with your new password.',
    noAccount: 'New here?',
    hasAccount: 'Already have an account?',
    forgotPrompt: 'Enter your email and we will send a password reset link.',
    backToLogin: 'Back to login',
    resetSent: 'Password reset email sent. Check your inbox.',
    verificationTitle: 'Verify your email',
    verificationBody: (email) =>
      `We sent a verification email to ${email}. Open it, then come back here and continue.`,
    verificationSent: 'Verification email sent.',
    verifiedContinue: 'I verified my email',
    resendVerification: 'Resend verification email',
    verifiedReturning: 'Email verified. Redirecting...',
    decisionTitle: 'You are one step away from joining your campus rides',
    decisionBody: 'Book seats, message drivers, and keep your routes inside a verified student community.',
    googleButton: 'Continue with Google',
    googleCancelled: 'No problem. You can keep browsing and join when you are ready.',
    emailDivider: 'or use email',
    trustBadge: 'Students only / verified community',
    timeBadge: 'Takes less than 10 seconds',
    continueBrowsing: 'Continue browsing',
    reassurance: ['No spam', 'No commitments', 'You can leave anytime'],
    passwordHelp: 'Use a strong password:',
    passwordRules: [
      'At least 8 characters',
      'One uppercase and one lowercase letter',
      'One number',
      'One symbol',
    ],
    passwordsDontMatch: 'Passwords do not match.',
    weakPassword: 'Choose a stronger password.',
    emailRequired: 'Enter your email.',
    passwordRequired: 'Enter your password.',
    trustTitle: 'Before launch checklist',
    trustBullets: [
      'Returning users log in directly with email and password.',
      'New users verify their email once before filling profile details.',
      'Forgot password is handled by Firebase securely.',
    ],
    privacyNote: 'By continuing you agree to our ',
    terms: 'Terms',
    privacy: 'Privacy Policy',
    errors: {
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/user-not-found': 'No account found for this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/email-already-in-use': 'This email already has an account. Log in instead.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      EMAIL_NOT_VERIFIED: 'Please verify your email before entering the app.',
    },
  },
  ar: {
    title: `أهلًا في ${BRAND_NAME}`,
    subtitle: 'ادخل بالبريد وكلمة المرور. الحساب الجديد يحتاج تحقق بريد مرة واحدة فقط.',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    forgot: 'نسيت كلمة المرور؟',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    remember: 'تذكر هذا الجهاز',
    loginButton: 'دخول',
    signupButton: 'انضم الآن',
    resetButton: 'إرسال رابط إعادة التعيين',
    working: 'ثواني...',
    resetComplete: 'تم تحديث كلمة المرور. سجّل الدخول بكلمتك الجديدة.',
    noAccount: 'مستخدم جديد؟',
    hasAccount: 'عندك حساب؟',
    forgotPrompt: 'أدخل بريدك وسنرسل لك رابطًا لتغيير كلمة المرور.',
    backToLogin: 'العودة لتسجيل الدخول',
    resetSent: 'تم إرسال رابط تغيير كلمة المرور. تحقق من بريدك.',
    verificationTitle: 'تحقق من بريدك',
    verificationBody: (email) =>
      `أرسلنا رسالة تحقق إلى ${email}. افتحها، ثم ارجع لهذه الصفحة واضغط متابعة.`,
    verificationSent: 'تم إرسال رسالة التحقق.',
    verifiedContinue: 'تحققت من بريدي',
    resendVerification: 'إرسال رسالة تحقق جديدة',
    verifiedReturning: 'تم التحقق. جاري التحويل...',
    decisionTitle: 'أنت على بعد خطوة من رحلات مجتمعك الجامعي',
    decisionBody: 'احجز مقعدك، راسل السائق، وابقَ داخل مجتمع طلابي موثوق.',
    googleButton: 'المتابعة باستخدام Google',
    googleCancelled: 'لا مشكلة. يمكنك متابعة التصفح والانضمام عندما تكون جاهزاً.',
    emailDivider: 'أو استخدم البريد',
    trustBadge: 'طلاب فقط / مجتمع موثوق',
    timeBadge: 'أقل من 10 ثوان',
    continueBrowsing: 'متابعة التصفح',
    reassurance: ['لا رسائل مزعجة', 'لا التزام', 'يمكنك المغادرة في أي وقت'],
    passwordHelp: 'استخدم كلمة مرور قوية:',
    passwordRules: [
      '8 أحرف على الأقل',
      'حرف كبير وحرف صغير',
      'رقم واحد',
      'رمز واحد',
    ],
    passwordsDontMatch: 'كلمتا المرور غير متطابقتين.',
    weakPassword: 'اختر كلمة مرور أقوى.',
    emailRequired: 'أدخل بريدك الإلكتروني.',
    passwordRequired: 'أدخل كلمة المرور.',
    trustTitle: 'جاهز للتجربة الأولى',
    trustBullets: [
      'المستخدم المسجل يدخل مباشرة بالبريد وكلمة المرور.',
      'المستخدم الجديد يتحقق من بريده مرة واحدة قبل تعبئة بياناته.',
      'نسيت كلمة المرور مرتبطة مباشرة بـ Firebase.',
    ],
    privacyNote: 'بالمتابعة أنت توافق على ',
    terms: 'الشروط',
    privacy: 'سياسة الخصوصية',
    errors: {
      'auth/invalid-email': 'أدخل بريدًا إلكترونيًا صحيحًا.',
      'auth/user-not-found': 'لا يوجد حساب بهذا البريد.',
      'auth/wrong-password': 'كلمة المرور غير صحيحة.',
      'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحين.',
      'auth/email-already-in-use': 'يوجد حساب بهذا البريد. سجّل دخول بدلًا من إنشاء حساب جديد.',
      'auth/too-many-requests': 'محاولات كثيرة. جرّب لاحقًا.',
      'auth/network-request-failed': 'مشكلة اتصال. تحقق من الإنترنت.',
      EMAIL_NOT_VERIFIED: 'تحقق من بريدك قبل دخول التطبيق.',
    },
  },
  he: {
    title: `ברוכים הבאים ל-${BRAND_NAME}`,
    subtitle: 'התחברו עם אימייל וסיסמה. חשבון חדש מאמת אימייל פעם אחת.',
    login: 'התחברות',
    signup: 'יצירת חשבון',
    forgot: 'שכחת סיסמה?',
    email: 'אימייל',
    password: 'סיסמה',
    confirmPassword: 'אימות סיסמה',
    remember: 'זכור את המכשיר הזה',
    loginButton: 'כניסה',
    signupButton: 'להצטרף עכשיו',
    resetButton: 'שליחת איפוס סיסמה',
    working: 'רגע...',
    resetComplete: 'הסיסמה עודכנה. התחברו עם הסיסמה החדשה.',
    noAccount: 'חדש כאן?',
    hasAccount: 'כבר יש חשבון?',
    forgotPrompt: 'הכניסו אימייל ונשלח קישור לאיפוס הסיסמה.',
    backToLogin: 'חזרה להתחברות',
    resetSent: 'נשלח אימייל לאיפוס סיסמה. בדקו את תיבת הדואר.',
    verificationTitle: 'אימות אימייל',
    verificationBody: (email) =>
      `שלחנו אימייל אימות אל ${email}. פתחו אותו ואז חזרו לכאן כדי להמשיך.`,
    verificationSent: 'אימייל אימות נשלח.',
    verifiedContinue: 'אימתתי את האימייל',
    resendVerification: 'שליחת אימות מחדש',
    verifiedReturning: 'האימייל אומת. מעבירים...',
    decisionTitle: 'אתם במרחק צעד אחד מנסיעות הקמפוס שלכם',
    decisionBody: 'הזמינו מקום, שלחו הודעה לנהג ושמרו מסלולים בתוך קהילה סטודנטיאלית מאומתת.',
    googleButton: 'להמשיך עם Google',
    googleCancelled: 'אין בעיה. אפשר להמשיך לעיין ולהצטרף כשתהיו מוכנים.',
    emailDivider: 'או להשתמש באימייל',
    trustBadge: 'סטודנטים בלבד / קהילה מאומתת',
    timeBadge: 'פחות מ-10 שניות',
    continueBrowsing: 'להמשיך לעיין',
    reassurance: ['בלי ספאם', 'בלי התחייבות', 'אפשר לעזוב בכל זמן'],
    passwordHelp: 'השתמשו בסיסמה חזקה:',
    passwordRules: [
      'לפחות 8 תווים',
      'אות גדולה ואות קטנה',
      'מספר אחד',
      'סימן אחד',
    ],
    passwordsDontMatch: 'הסיסמאות אינן תואמות.',
    weakPassword: 'בחרו סיסמה חזקה יותר.',
    emailRequired: 'הכניסו אימייל.',
    passwordRequired: 'הכניסו סיסמה.',
    trustTitle: 'מוכן לניסוי הראשון',
    trustBullets: [
      'משתמשים חוזרים נכנסים ישירות עם אימייל וסיסמה.',
      'משתמש חדש מאמת אימייל פעם אחת לפני מילוי פרופיל.',
      'איפוס סיסמה מנוהל בצורה מאובטחת דרך Firebase.',
    ],
    privacyNote: 'בהמשך אתם מסכימים ל',
    terms: 'תנאים',
    privacy: 'מדיניות פרטיות',
    errors: {
      'auth/invalid-email': 'הכניסו כתובת אימייל תקינה.',
      'auth/user-not-found': 'לא נמצא חשבון לאימייל הזה.',
      'auth/wrong-password': 'סיסמה שגויה.',
      'auth/invalid-credential': 'האימייל או הסיסמה שגויים.',
      'auth/email-already-in-use': 'כבר קיים חשבון לאימייל הזה. התחברו במקום.',
      'auth/too-many-requests': 'יותר מדי ניסיונות. נסו מאוחר יותר.',
      'auth/network-request-failed': 'שגיאת רשת. בדקו חיבור.',
      EMAIL_NOT_VERIFIED: 'יש לאמת את האימייל לפני הכניסה לאפליקציה.',
    },
  },
};

const PASSWORD_TESTS = [
  (value: string) => value.length >= 8,
  (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  (value: string) => /\d/.test(value),
  (value: string) => /[^A-Za-z0-9]/.test(value),
];

function getCopy(lang: string): ScreenCopy {
  const supportedLang = lang === 'ar' || lang === 'he' ? lang : 'en';
  return brandCopy(COPY[supportedLang as SupportedLang]);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isStrongPassword(value: string) {
  return PASSWORD_TESTS.every((test) => test(value));
}

function getFirebaseAuthError(error: unknown, copy: ScreenCopy) {
  if (error instanceof FirebaseError) {
    return copy.errors[error.code] ?? error.message;
  }

  if (error instanceof Error) {
    return copy.errors[error.message] ?? error.message;
  }

  return copy.errors['auth/network-request-failed'];
}

function getActionCodeSettings(path = '/login?verified=1') {
  return {
    url: `${window.location.origin}${path}`,
    handleCodeInApp: false,
  };
}

function LoginContent() {
  const searchParams = useSearchParams();
  const { lang } = useTranslation();
  const copy = useMemo(() => getCopy(lang), [lang]);
  const nextPath = searchParams.get('next');
  const requestedMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [mode, setMode] = useState<AuthMode>(requestedMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordRuleStatus = PASSWORD_TESTS.map((test) => test(password));
  const canSubmitSignup = passwordRuleStatus.every(Boolean) && password === confirmPassword;

  const finishAuth = async (user: User) => {
    await user.reload();
    if (!user.emailVerified) {
      setPendingUser(user);
      setPendingEmail(user.email ?? email);
      setMode('verify');
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    const token = await user.getIdToken(true);
    const result = await setSessionAndSync(token, {
      remember,
      next: nextPath,
    });
    window.location.replace(result.redirectPath);
  };

  useEffect(() => {
    let cancelled = false;

    const resumeVerifiedFirebaseUser = async (currentUser: User | null) => {
      if (!currentUser) return;

      try {
        await currentUser.reload();
        if (cancelled || !currentUser.emailVerified) return;
        setLoading(true);
        setNotice(copy.verifiedReturning);
        await finishAuth(currentUser);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    if (searchParams.get('verified') === '1') {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        void resumeVerifiedFirebaseUser(currentUser);
      });

      return () => {
        cancelled = true;
        unsubscribe();
      };
    }

    return () => {
      cancelled = true;
    };
  // `finishAuth` intentionally stays outside dependencies because it performs navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy.verifiedReturning, searchParams]);

  const resetMessages = () => {
    setError(null);
    setNotice(null);
  };

  useEffect(() => {
    setMode(requestedMode);
  }, [requestedMode]);

  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      setNotice(copy.resetComplete);
      setMode('login');
    }
  }, [copy.resetComplete, searchParams]);

  const switchMode = (nextMode: AuthMode) => {
    resetMessages();
    setMode(nextMode);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError(copy.emailRequired);
      return;
    }
    if (!password) {
      setError(copy.passwordRequired);
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await finishAuth(credential.user);
    } catch (authError) {
      setError(getFirebaseAuthError(authError, copy));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    resetMessages();
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      await finishAuth(credential.user);
    } catch (authError) {
      if (authError instanceof FirebaseError && authError.code === 'auth/popup-closed-by-user') {
        setNotice(copy.googleCancelled);
      } else {
        setError(getFirebaseAuthError(authError, copy));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError(copy.emailRequired);
      return;
    }
    if (!isStrongPassword(password)) {
      setError(copy.weakPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(copy.passwordsDontMatch);
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await sendEmailVerification(credential.user, getActionCodeSettings());
      setPendingUser(credential.user);
      setPendingEmail(normalizedEmail);
      setMode('verify');
      setNotice(copy.verificationSent);
    } catch (authError) {
      setError(getFirebaseAuthError(authError, copy));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError(copy.emailRequired);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(
        getFirebaseAuth(),
        normalizedEmail,
        getActionCodeSettings('/login?reset=1')
      );
      setNotice(copy.resetSent);
    } catch (authError) {
      setError(getFirebaseAuthError(authError, copy));
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationContinue = async () => {
    resetMessages();
    const user = pendingUser ?? getFirebaseAuth().currentUser;
    if (!user) {
      setMode('login');
      setError(copy.errors.EMAIL_NOT_VERIFIED);
      return;
    }

    setLoading(true);
    try {
      await finishAuth(user);
    } catch (authError) {
      setError(getFirebaseAuthError(authError, copy));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    resetMessages();
    const user = pendingUser ?? getFirebaseAuth().currentUser;
    if (!user) {
      setMode('login');
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(user, getActionCodeSettings());
      setNotice(copy.verificationSent);
    } catch (authError) {
      setError(getFirebaseAuthError(authError, copy));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <HeroRouteScene />
      <div className="auth-shell__scrim" aria-hidden="true" />
      <div className="auth-shell__content">
        <section className="auth-panel">
          <div className="auth-panel__intro">
            <div className="mb-2 flex justify-center">
              <BrandLogo lang={lang as SupportedLang} size="nav" priority className="drop-shadow-sm" />
            </div>
            <div className="auth-panel__badges">
              <span>{copy.trustBadge}</span>
              <span>{copy.timeBadge}</span>
            </div>
            <h1 className="display-title">
              {copy.decisionTitle}
            </h1>
            <p>
              {copy.decisionBody}
            </p>
            <div className="auth-panel__reassurance" aria-label="Signup reassurance">
              {copy.reassurance.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="auth-google"
          >
            <span aria-hidden="true">G</span>
            {copy.googleButton}
          </button>

          <div className="auth-divider">
            <span>{copy.emailDivider}</span>
          </div>

          {mode !== 'verify' && (
            <div className="auth-mode-tabs mt-4 grid grid-cols-2 gap-2 rounded-lg bg-[var(--surface-muted)] p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${
                  mode === 'login'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--muted-strong)]'
                }`}
              >
                {copy.login}
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${
                  mode === 'signup'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--muted-strong)]'
                }`}
              >
                {copy.signup}
              </button>
            </div>
          )}

          {notice && (
            <div className="auth-message auth-message--success">
              {notice}
            </div>
          )}

          {error && (
            <div className="auth-message auth-message--error">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
              <AuthFields
                copy={copy}
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                resetMessages={resetMessages}
                passwordAutoComplete="current-password"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted-strong)]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="rounded border-[var(--border-soft)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  {copy.remember}
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="min-h-11 text-sm font-bold text-[var(--primary)] hover:underline"
                >
                  {copy.forgot}
                </button>
              </div>
              <SubmitButton label={copy.loginButton} loadingLabel={copy.working} loading={loading} />
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="mt-4 space-y-3" noValidate>
              <AuthFields
                copy={copy}
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                resetMessages={resetMessages}
                passwordAutoComplete="new-password"
              />
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-bold text-[var(--muted-strong)]">
                  {copy.confirmPassword}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    resetMessages();
                  }}
                  className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
              {password ? (
                <div className="auth-password-rules rounded-lg border border-[var(--border-soft)] bg-[var(--surface-raised)] px-4 py-3">
                  <p className="text-xs font-black text-[var(--muted)]">
                    {copy.passwordHelp}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {copy.passwordRules.map((rule, index) => (
                      <li
                        key={rule}
                        className={`text-sm ${
                          passwordRuleStatus[index]
                            ? 'text-[var(--success)]'
                            : 'text-[var(--muted)]'
                        }`}
                      >
                        {passwordRuleStatus[index] ? 'OK' : '·'} {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <SubmitButton
                label={copy.signupButton}
                loadingLabel={copy.working}
                loading={loading}
                disabled={!canSubmitSignup}
              />
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="mt-6 space-y-4" noValidate>
              <p className="text-sm leading-relaxed text-[var(--muted-strong)]">
                {copy.forgotPrompt}
              </p>
              <div>
                <label htmlFor="resetEmail" className="mb-1.5 block text-sm font-bold text-[var(--muted-strong)]">
                  {copy.email}
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    resetMessages();
                  }}
                  className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
              <SubmitButton label={copy.resetButton} loadingLabel={copy.working} loading={loading} />
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="min-h-11 w-full text-center text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)]"
              >
                {copy.backToLogin}
              </button>
            </form>
          )}

          {mode === 'verify' && (
            <div className="mt-6 space-y-4 text-center">
              <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-raised)] px-4 py-5">
                <p className="text-lg font-black text-[var(--foreground)]">
                  {copy.verificationTitle}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  {copy.verificationBody(pendingEmail || email)}
                </p>
              </div>
              <SubmitButton
                label={copy.verifiedContinue}
                loadingLabel={copy.working}
                loading={loading}
                onClick={handleVerificationContinue}
              />
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] px-4 py-3 text-sm font-bold text-[var(--muted-strong)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
              >
                {copy.resendVerification}
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="min-h-11 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)]"
              >
                {copy.backToLogin}
              </button>
            </div>
          )}

          <div className="auth-trust-checklist mt-6 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-raised)] px-4 py-4">
            <p className="text-xs font-black text-[var(--primary)]">
              {copy.trustTitle}
            </p>
            <ul className="mt-2 space-y-1.5">
              {copy.trustBullets.map((bullet) => (
                <li key={bullet} className="text-sm text-[var(--muted-strong)]">
                  - {bullet}
                </li>
              ))}
            </ul>
          </div>

          <Link href="/preview" className="auth-continue">
            {copy.continueBrowsing}
          </Link>

          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1 text-center text-xs text-[var(--muted)]">
            {copy.privacyNote}
            <Link href="/terms" className="inline-flex min-h-11 min-w-11 items-center justify-center underline hover:text-[var(--muted-strong)]">{copy.terms}</Link>
            {' & '}
            <Link href="/privacy" className="inline-flex min-h-11 min-w-11 items-center justify-center underline hover:text-[var(--muted-strong)]">{copy.privacy}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function AuthFields(props: {
  copy: ScreenCopy;
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  resetMessages: () => void;
  passwordAutoComplete: string;
}) {
  const { copy, email, password, setEmail, setPassword, resetMessages, passwordAutoComplete } = props;

  return (
    <>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-[var(--muted-strong)]">
          {copy.email}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            resetMessages();
          }}
          className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-[var(--muted-strong)]">
          {copy.password}
        </label>
        <input
          id="password"
          type="password"
          autoComplete={passwordAutoComplete}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            resetMessages();
          }}
          className="min-h-11 w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
        />
      </div>
    </>
  );
}

function SubmitButton(props: {
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const { label, loadingLabel, loading, disabled, onClick } = props;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading || disabled}
        className="min-h-11 w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-black text-[var(--route-ink)] transition-colors hover:brightness-105 disabled:opacity-50"
      >
        {loading ? loadingLabel : label}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="min-h-11 w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-black text-[var(--route-ink)] transition-colors hover:brightness-105 disabled:opacity-50"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

export default function LoginClient() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
