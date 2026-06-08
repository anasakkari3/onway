import type { ReactNode } from 'react';

type Props = {
  regionLabel: string;
  count?: number;
  children: ReactNode;
};

/** A region heading with its institution cards laid out in a responsive grid. */
export default function InstitutionRegionSection({ regionLabel, count, children }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-black text-slate-700 dark:text-slate-200" dir="auto">
          {regionLabel}
        </h2>
        {typeof count === 'number' && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {count}
          </span>
        )}
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}
