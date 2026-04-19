'use client';

import { useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

const TOUR_KEY = 'batreeqak_tour_seen_v1';

const subscribeTourState = () => () => {};
const getServerTourSnapshot = () => false;
const getClientTourSnapshot = () => {
  try {
    return localStorage.getItem(TOUR_KEY) !== '1';
  } catch {
    return false;
  }
};

type Step = {
  emoji: string;
  title: string;
  body: string;
};

const STEPS: Record<'ar' | 'en' | 'he', Step[]> = {
  ar: [
    {
      emoji: '👋',
      title: 'أهلاً بك في بطريقك!',
      body: 'بطريقك تربطك بأشخاص من مجتمعك لتنسيق رحلات مشتركة. اقرأ الخطوات لتبدأ بثقة.',
    },
    {
      emoji: '🏘️',
      title: 'انضم لمجتمعك',
      body: 'ابدأ بالانضمام إلى المجتمع المناسب (جامعة، حي، مكان عمل). كل رحلة مرتبطة بمجتمع واحد.',
    },
    {
      emoji: '🚗',
      title: 'ابحث عن رحلة أو أضف رحلة',
      body: 'إذا كنت سائقاً اضغط "رحلة جديدة" وأضف تفاصيل رحلتك. إذا كنت راكباً استخدم البحث للعثور على رحلة مناسبة.',
    },
    {
      emoji: '📩',
      title: 'احجز وتواصل',
      body: 'بعد الحجز يمكنك التواصل مع السائق مباشرةً عبر الدردشة للتنسيق وتحديد موعد الالتقاء.',
    },
    {
      emoji: '⭐',
      title: 'قيّم التجربة',
      body: 'بعد كل رحلة قيّم السائق أو الراكب. التقييمات تبني الثقة في المجتمع.',
    },
  ],
  en: [
    {
      emoji: '👋',
      title: 'Welcome to Batreeqak!',
      body: 'Batreeqak connects you with people from your community to share rides. Follow the steps to get started.',
    },
    {
      emoji: '🏘️',
      title: 'Join your community',
      body: 'Start by joining the right community (university, neighborhood, workplace). Every trip belongs to one community.',
    },
    {
      emoji: '🚗',
      title: 'Find or offer a ride',
      body: 'If you drive, tap "New trip" and add your trip details. If you need a ride, use Search to find one that fits.',
    },
    {
      emoji: '📩',
      title: 'Book and coordinate',
      body: 'After booking, chat with the driver directly to coordinate the pickup time and spot.',
    },
    {
      emoji: '⭐',
      title: 'Rate the experience',
      body: 'After each trip, rate the driver or passenger. Ratings build trust across the community.',
    },
  ],
  he: [
    {
      emoji: '👋',
      title: `ברוכים הבאים לבטריקאק!`,
      body: 'בטריקאק מחבר אתכם לאנשים מהקהילה שלכם לתיאום נסיעות משותפות.',
    },
    {
      emoji: '🏘️',
      title: 'הצטרפו לקהילה שלכם',
      body: 'התחילו בהצטרפות לקהילה המתאימה (אוניברסיטה, שכונה, מקום עבודה).',
    },
    {
      emoji: '🚗',
      title: 'חפשו נסיעה או הציעו אחת',
      body: 'אם אתם נוהגים — לחצו "נסיעה חדשה". אם אתם מחפשים נסיעה — השתמשו בחיפוש.',
    },
    {
      emoji: '📩',
      title: 'הזמינו ותאמו',
      body: 'לאחר ההזמנה, שוחחו עם הנהג ישירות לתיאום נקודת האיסוף והשעה.',
    },
    {
      emoji: '⭐',
      title: 'דרגו את החוויה',
      body: 'לאחר כל נסיעה, דרגו את הנהג או הנוסע. הדירוגים בונים אמון בקהילה.',
    },
  ],
};

export default function OnboardingTour() {
  const { lang } = useTranslation();
  const pathname = usePathname();
  const shouldShowTour = useSyncExternalStore(
    subscribeTourState,
    getClientTourSnapshot,
    getServerTourSnapshot
  );
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);

  const safeKey = (lang === 'ar' || lang === 'he' ? lang : 'en') as 'ar' | 'en' | 'he';
  const steps = STEPS[safeKey];
  const canShowTourHere = pathname === '/app';

  const dismiss = () => {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* noop */ }
    setDismissed(true);
  };

  if (!canShowTourHere || !shouldShowTour || dismissed) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all ${
                i === step
                  ? 'w-5 h-2 bg-sky-500'
                  : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <span className="text-5xl block">{current.emoji}</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{current.title}</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {lang === 'ar' ? 'تخطى' : lang === 'he' ? 'דלג' : 'Skip'}
          </button>
          <button
            type="button"
            onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
            className="flex-1 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
          >
            {isLast
              ? (lang === 'ar' ? 'ابدأ الآن' : lang === 'he' ? 'התחל' : 'Get started')
              : (lang === 'ar' ? 'التالي →' : lang === 'he' ? 'הבא ←' : 'Next →')}
          </button>
        </div>
      </div>
    </div>
  );
}
