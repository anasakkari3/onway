/**
 * GuideHint — A lightweight contextual guidance bubble.
 *
 * Usage:
 *   <GuideHint icon="💡" text="اضغط هنا لإنشاء رحلة جديدة" />
 *   <GuideHint icon="ℹ️" text="..." variant="info" />
 *   <GuideHint icon="✅" text="..." variant="success" dismissible />
 */

'use client';

import { useState } from 'react';

type Variant = 'tip' | 'info' | 'success' | 'warning';

const VARIANT_CLASSES: Record<Variant, string> = {
  tip:     'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300',
  info:    'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
};

type Props = {
  text: string;
  icon?: string;
  variant?: Variant;
  dismissible?: boolean;
  className?: string;
};

export default function GuideHint({
  text,
  icon = '💡',
  variant = 'tip',
  dismissible = false,
  className = '',
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <span className="shrink-0 text-base leading-5" aria-hidden="true">{icon}</span>
      <span className="flex-1">{text}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق"
          className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity text-xs font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
}
