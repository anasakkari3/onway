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
    <div className="flex min-h-11 items-center gap-0.5 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)]/75 p-1 backdrop-blur-sm">
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          disabled={isPending}
          onClick={() => handleChange(l.value)}
          title={l.label}
          className={`min-h-11 min-w-11 rounded-lg px-3 text-xs font-bold transition-all ${
            l.value === current
              ? 'bg-[var(--primary)] text-white shadow-sm dark:text-[var(--route-ink)]'
              : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--muted-strong)]'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
