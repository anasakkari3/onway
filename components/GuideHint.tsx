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
  tip:     'bg-[var(--primary-light)] border-[var(--border-soft)] text-[var(--primary-dark)] dark:text-[var(--primary-dark)]',
  info:    'bg-[var(--surface-raised)] border-[var(--border-soft)] text-[var(--muted-strong)]',
  success: 'bg-[var(--primary-light)] border-[var(--border-soft)] text-[var(--success)]',
  warning: 'bg-[var(--surface-raised)] border-[var(--border-soft)] text-[var(--accent-strong)]',
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
  icon = 'i',
  variant = 'tip',
  dismissible = false,
  className = '',
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-semibold leading-relaxed shadow-sm ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-white/50 text-xs font-black leading-5 dark:bg-black/10" aria-hidden="true">{icon}</span>
      <span className="flex-1">{text}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق"
          className="shrink-0 text-xs font-bold text-current opacity-50 transition-opacity hover:opacity-100"
        >
          x
        </button>
      )}
    </div>
  );
}
