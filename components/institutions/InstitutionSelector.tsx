'use client';

import { useId, useMemo, useState } from 'react';
import type { Lang } from '@/lib/i18n/dictionaries';
import {
  getInstitutionsByRegion,
  getRegionLabel,
  searchInstitutions,
  type Institution,
} from '@/lib/institutions/institutions';
import InstitutionCard from './InstitutionCard';
import InstitutionRegionSection from './InstitutionRegionSection';

export type InstitutionMembershipState = 'member' | 'pending' | 'rejected' | 'not_joined';

type Props = {
  lang: Lang;
  /** Currently selected institution id (e.g. the user's chosen community). */
  selectedId?: string | null;
  /** Institution id whose action is in-flight, to disable its card. */
  busyId?: string | null;
  /** Resolve the membership state shown as a status chip on each card. */
  membershipFor?: (institution: Institution) => InstitutionMembershipState;
  /** Fired when an institution card is chosen. */
  onSelect?: (institution: Institution) => void;
  /** Fired when the user submits a free-text "Other institution" name. */
  onSubmitOther?: (name: string) => void;
  className?: string;
};

const COPY: Record<Lang, {
  searchPlaceholder: string;
  noResults: string;
  otherArabic: string;
  otherEnglish: string;
  otherHint: string;
  otherPlaceholder: string;
  otherSubmit: string;
  joined: string;
  pending: string;
  declined: string;
  resultsCount: (n: number) => string;
}> = {
  ar: {
    searchPlaceholder: 'ابحث باسم الجامعة أو الكلية أو المنطقة…',
    noResults: 'لا توجد نتائج مطابقة. جرّب اسمًا آخر أو اختر «مؤسسة أخرى».',
    otherArabic: 'مؤسسة أخرى',
    otherEnglish: 'Other Institution',
    otherHint: 'مؤسستك غير مدرجة؟ اكتب اسمها وسنراجعها لإضافتها.',
    otherPlaceholder: 'اكتب اسم مؤسستك',
    otherSubmit: 'إرسال',
    joined: 'منضم',
    pending: 'قيد المراجعة',
    declined: 'مرفوض',
    resultsCount: (n) => `${n} نتيجة`,
  },
  en: {
    searchPlaceholder: 'Search by university, college, or region…',
    noResults: 'No matches. Try another name or pick “Other Institution”.',
    otherArabic: 'مؤسسة أخرى',
    otherEnglish: 'Other Institution',
    otherHint: "Can't find your institution? Type its name and we'll review it.",
    otherPlaceholder: 'Type your institution name',
    otherSubmit: 'Submit',
    joined: 'Joined',
    pending: 'Pending',
    declined: 'Declined',
    resultsCount: (n) => `${n} result${n === 1 ? '' : 's'}`,
  },
  he: {
    searchPlaceholder: 'חיפוש לפי אוניברסיטה, מכללה או אזור…',
    noResults: 'אין תוצאות. נסו שם אחר או בחרו ב"מוסד אחר".',
    otherArabic: 'مؤسسة أخرى',
    otherEnglish: 'Other Institution',
    otherHint: 'המוסד שלכם לא מופיע? כתבו את שמו ונבדוק להוספה.',
    otherPlaceholder: 'הקלידו את שם המוסד',
    otherSubmit: 'שליחה',
    joined: 'חבר',
    pending: 'ממתין',
    declined: 'נדחה',
    resultsCount: (n) => `${n} תוצאות`,
  },
};

function StatusChip({ state, copy }: { state: InstitutionMembershipState; copy: (typeof COPY)['en'] }) {
  if (state === 'member') {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        {copy.joined}
      </span>
    );
  }
  if (state === 'pending') {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        {copy.pending}
      </span>
    );
  }
  if (state === 'rejected') {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300">
        {copy.declined}
      </span>
    );
  }
  return null;
}

export default function InstitutionSelector({
  lang,
  selectedId,
  busyId,
  membershipFor,
  onSelect,
  onSubmitOther,
  className = '',
}: Props) {
  const copy = COPY[lang] ?? COPY.en;
  const [query, setQuery] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const searchInputId = useId();

  const filtered = useMemo(() => searchInstitutions(query, lang), [query, lang]);
  const groups = useMemo(() => getInstitutionsByRegion(filtered), [filtered]);

  const handleSubmitOther = () => {
    const trimmed = otherName.trim();
    if (!trimmed) return;
    onSubmitOther?.(trimmed);
  };

  return (
    <div className={`space-y-5 ${className}`.trim()}>
      <div className="space-y-1.5">
        <label htmlFor={searchInputId} className="sr-only">
          {copy.searchPlaceholder}
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            data-testid="institution-search"
            dir="auto"
            className="w-full rounded-2xl border border-slate-300 ps-9 pe-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        {query.trim() !== '' && (
          <p className="px-1 text-xs text-slate-400">{copy.resultsCount(filtered.length)}</p>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {copy.noResults}
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ region, institutions }) => (
            <InstitutionRegionSection
              key={region}
              regionLabel={getRegionLabel(region, lang)}
              count={institutions.length}
            >
              {institutions.map((institution) => {
                const state = membershipFor?.(institution) ?? 'not_joined';
                return (
                  <InstitutionCard
                    key={institution.id}
                    arabicName={institution.arabicName}
                    englishName={institution.englishName}
                    regionLabel={getRegionLabel(institution.region, lang)}
                    selected={selectedId === institution.id}
                    disabled={busyId === institution.id}
                    onClick={() => onSelect?.(institution)}
                    statusChip={<StatusChip state={state} copy={copy} />}
                    testId={`institution-card-${institution.id}`}
                  />
                );
              })}
            </InstitutionRegionSection>
          ))}
        </div>
      )}

      {/* Other institution */}
      <div className="space-y-3">
        <InstitutionCard
          arabicName={copy.otherArabic}
          englishName={copy.otherEnglish}
          regionLabel="—"
          selected={showOther}
          onClick={() => setShowOther((value) => !value)}
          testId="institution-card-other"
        />
        {showOther && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400" dir="auto">
              {copy.otherHint}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={otherName}
                onChange={(event) => setOtherName(event.target.value)}
                placeholder={copy.otherPlaceholder}
                data-testid="institution-other-input"
                dir="auto"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSubmitOther}
                disabled={!otherName.trim()}
                data-testid="institution-other-submit"
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
              >
                {copy.otherSubmit}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
