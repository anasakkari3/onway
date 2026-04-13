'use client';

import { useTransition } from 'react';
import { setLanguageCookie } from '@/lib/i18n/actions';
import type { Lang } from '@/lib/i18n/dictionaries';

const LANGS: Array<{ value: Lang; label: string; short: string }> = [
  { value: 'ar', label: 'العربية', short: 'ع' },
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'he', label: 'עברית', short: 'ע' },
];

type Props = {
  current: Lang;
};

export default function LangSwitcher({ current }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (lang: Lang) => {
    if (lang === current) return;
    startTransition(async () => {
      await setLanguageCookie(lang);
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-0.5">
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          disabled={isPending}
          onClick={() => handleChange(l.value)}
          title={l.label}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
            l.value === current
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
