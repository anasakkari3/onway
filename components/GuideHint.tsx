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
import { useTranslation } from '@/lib/i18n/LanguageProvider';

type Variant = 'tip' | 'info' | 'success' | 'warning';

type Props = {
  text: string;
  icon?: string;
  variant?: Variant;
  dismissible?: boolean;
  className?: string;
};

const DISMISS_LABEL: Record<string, string> = {
  en: 'Dismiss hint',
  ar: 'إغلاق التنويه',
  he: 'סגרו את הרמז',
};

export default function GuideHint({
  text,
  icon = 'i',
  variant = 'tip',
  dismissible = false,
  className = '',
}: Props) {
  const { lang } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const dismissLabel = DISMISS_LABEL[lang] ?? DISMISS_LABEL.en;

  return (
    <div
      className={`guide-hint guide-hint--${variant} ${className}`}
      role="note"
    >
      <span className="guide-hint__icon" aria-hidden="true">{icon}</span>
      <span className="guide-hint__text">{text}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={dismissLabel}
          className="guide-hint__dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}
    </div>
  );
}
