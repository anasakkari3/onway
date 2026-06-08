import type { ReactNode } from 'react';

type Props = {
  arabicName: string;
  englishName: string;
  regionLabel: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Optional status chip rendered in the corner (e.g. "Joined", "Pending"). */
  statusChip?: ReactNode;
  testId?: string;
};

/**
 * A single institution card: Arabic name as the primary (RTL) title, English
 * name beneath it (LTR), a region badge, and a selected/disabled state.
 * Presentational only — selection behaviour is owned by the parent selector.
 */
export default function InstitutionCard({
  arabicName,
  englishName,
  regionLabel,
  selected = false,
  disabled = false,
  onClick,
  statusChip,
  testId,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-pressed={selected}
      className={`group relative flex w-full flex-col items-start gap-1 rounded-2xl border p-4 text-start transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/30 dark:border-sky-400 dark:bg-sky-900/20'
          : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700 dark:hover:bg-slate-800/60'
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          dir="auto"
        >
          {regionLabel}
        </span>
        {statusChip}
      </div>

      <h3
        className="mt-1 text-base font-bold leading-snug text-slate-900 dark:text-slate-100"
        dir="rtl"
        lang="ar"
      >
        {arabicName}
      </h3>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400" dir="ltr" lang="en">
        {englishName}
      </p>
    </button>
  );
}
