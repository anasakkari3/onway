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
      className={`guide-hint guide-hint--${variant} ${className}`}
      role="note"
    >
      <span className="guide-hint__icon" aria-hidden="true">{icon}</span>
      <span className="guide-hint__text">{text}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="إغلاق التنويه"
          className="guide-hint__dismiss"
        >
          x
        </button>
      )}
    </div>
  );
}
