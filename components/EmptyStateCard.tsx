'use client';

import type { ReactNode } from 'react';

type Tone = 'neutral' | 'sky' | 'amber';

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone?: Tone;
  actions?: ReactNode;
  className?: string;
};

const TONE_STYLES: Record<Tone, { shell: string; icon: string; eyebrow: string }> = {
  neutral: {
    shell:
      'border-[var(--border-soft)] bg-[var(--surface-raised)]',
    icon:
      'bg-[var(--surface)] text-[var(--muted-strong)] ring-1 ring-[var(--border-soft)]',
    eyebrow: 'text-[var(--muted)]',
  },
  sky: {
    shell:
      'border-[var(--border-soft)] bg-[var(--primary-light)]',
    icon:
      'bg-[var(--surface)] text-[var(--primary)] ring-1 ring-[var(--border-soft)]',
    eyebrow: 'text-[var(--primary)]',
  },
  amber: {
    shell:
      'border-[var(--border-soft)] bg-[var(--surface-raised)]',
    icon:
      'bg-[var(--surface)] text-[var(--accent-strong)] ring-1 ring-[var(--border-soft)]',
    eyebrow: 'text-[var(--accent-strong)]',
  },
};

export default function EmptyStateCard({
  eyebrow,
  title,
  description,
  icon,
  tone = 'neutral',
  actions,
  className = '',
}: Props) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-lg border p-6 text-center shadow-sm sm:p-7 ${styles.shell} ${className}`.trim()}
    >
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-lg shadow-sm ${styles.icon}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      {eyebrow ? (
        <p className={`mt-4 text-xs font-black ${styles.eyebrow}`}>
          {eyebrow}
        </p>
      ) : null}

      <h3 className="display-title mt-3 text-lg font-black text-[var(--foreground)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[28rem] text-sm leading-relaxed text-[var(--muted-strong)]">
        {description}
      </p>

      {actions ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row [&>*]:min-h-11">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
