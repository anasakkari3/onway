'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import SavedPlaceChips from '@/components/SavedPlaceChips';
import type { SavedPlace } from '@/lib/services/savedPlaces';

type Props = {
  communityId?: string;
  initialOrigin?: string;
  initialDestination?: string;
  initialDriverGenderFilter?: string;
  clearHref?: string;
  communitySelectionRequired?: boolean;
  savedPlaces?: SavedPlace[];
  /** User's city_or_area — shown as home nudge if no home place saved */
  cityOrArea?: string;
};

const COPY = {
  en: {
    originAria: 'Search origin',
    destinationAria: 'Search destination',
    driverGenderLabel: 'Driver gender',
    driverGenderAria: 'Filter by driver gender',
    driverGenderOptions: {
      any: 'Any',
      man: 'Man',
      woman: 'Woman',
    },
    communityRequired: 'Choose a community first. Search results stay inside one community at a time.',
  },
  ar: {
    originAria: 'ابحث عن نقطة الانطلاق',
    destinationAria: 'ابحث عن الوجهة',
    driverGenderLabel: 'جنس السائق',
    driverGenderAria: 'فلترة حسب جنس السائق',
    driverGenderOptions: {
      any: 'أي',
      man: 'ذكر',
      woman: 'أنثى',
    },
    communityRequired: 'اختر مجتمعًا أولًا. نتائج البحث تبقى داخل مجتمع واحد في كل مرة.',
  },
  he: {
    originAria: 'חיפוש מוצא',
    destinationAria: 'חיפוש יעד',
    driverGenderLabel: 'מגדר הנהג',
    driverGenderAria: 'סינון לפי מגדר הנהג',
    driverGenderOptions: {
      any: 'הכול',
      man: 'גבר',
      woman: 'אישה',
    },
    communityRequired: 'בחרו קודם קהילה. תוצאות החיפוש נשארות בתוך קהילה אחת בכל פעם.',
  },
} as const;

export default function InlineSearch({
  communityId,
  initialOrigin = '',
  initialDestination = '',
  initialDriverGenderFilter = 'any',
  clearHref = '/app',
  communitySelectionRequired = false,
  savedPlaces = [],
  cityOrArea,
}: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const copy = COPY[lang];
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [driverGender, setDriverGender] = useState(initialDriverGenderFilter);
  // Track which field the user last focused — chips fill that field
  const activeFieldRef = useRef<'origin' | 'destination'>('origin');
  const [activeField, setActiveField] = useState<'origin' | 'destination'>('origin');

  const hasActiveSearch = Boolean(origin.trim() || destination.trim() || driverGender !== 'any');
  const needsCommunitySelection = communitySelectionRequired && !communityId;
  const canSubmit = (!needsCommunitySelection) && Boolean(origin.trim() || destination.trim());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedOrigin = origin.trim();
    const normalizedDestination = destination.trim();
    if (needsCommunitySelection || (!normalizedOrigin && !normalizedDestination)) return;

    const params = new URLSearchParams();
    if (communityId) params.append('community_id', communityId);
    if (normalizedOrigin) params.append('originName', normalizedOrigin);
    if (normalizedDestination) params.append('destinationName', normalizedDestination);
    if (driverGender !== 'any') params.append('driverGender', driverGender);
    router.push(`/app?${params.toString()}`);
  };

  const handleClear = () => {
    setOrigin('');
    setDestination('');
    setDriverGender('any');
    router.push(clearHref);
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="surface-card relative flex w-full translate-y-1 flex-col gap-3 rounded-lg p-2 sm:flex-row sm:p-3">
        <div className="flex-1 flex flex-col relative">
          <label htmlFor="origin" className="px-3 pt-1 text-xs font-black text-[var(--primary)]">{t('from')}</label>
          <input
            id="origin"
            aria-label={copy.originAria}
            type="text"
            value={origin}
            onFocus={() => { activeFieldRef.current = 'origin'; setActiveField('origin'); }}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder={t('anywhere')}
            className="w-full bg-transparent px-3 pb-2 pt-0 text-[15px] font-semibold text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-60 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="my-2 hidden w-px bg-[var(--border-soft)] sm:block"></div>
        <div className="mx-3 h-px bg-[var(--border-soft)] sm:hidden"></div>

        <div className="flex-1 flex flex-col relative">
          <label htmlFor="destination" className="px-3 pt-1 text-xs font-black text-[var(--success)]">{t('to')}</label>
          <input
            id="destination"
            aria-label={copy.destinationAria}
            type="text"
            value={destination}
            onFocus={() => { activeFieldRef.current = 'destination'; setActiveField('destination'); }}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={t('anywhere')}
            className="w-full bg-transparent px-3 pb-2 pt-0 text-[15px] font-semibold text-[var(--foreground)] placeholder:text-[var(--muted)] placeholder:opacity-60 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="my-2 hidden w-px bg-[var(--border-soft)] sm:block"></div>
        <div className="mx-3 h-px bg-[var(--border-soft)] sm:hidden"></div>

        <div className="sm:w-[160px] flex flex-col relative">
          <label
            htmlFor="driver-gender-filter"
            className="px-3 pt-1 text-xs font-black text-[var(--accent-strong)]"
          >
            {copy.driverGenderLabel}
          </label>
          <select
            id="driver-gender-filter"
            aria-label={copy.driverGenderAria}
            value={driverGender}
            onChange={(event) => setDriverGender(event.target.value)}
            className="w-full bg-transparent px-3 pb-2 pt-0 text-[15px] font-semibold text-[var(--foreground)] focus:outline-none focus:ring-0"
          >
            <option value="any">{copy.driverGenderOptions.any}</option>
            <option value="man">{copy.driverGenderOptions.man}</option>
            <option value="woman">{copy.driverGenderOptions.woman}</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pl-2 pt-2 sm:pl-0 sm:pr-1 sm:pt-0">
          {hasActiveSearch && (
            <button
              type="button"
              onClick={handleClear}
              title={t('clear_search')}
              className="btn-press flex h-[42px] shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] px-3 text-[var(--muted-strong)] transition-colors hover:bg-[var(--primary-light)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              <span className="sr-only">{t('clear_search')}</span>
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-press flex h-[42px] flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--route-ink)] px-6 font-black text-white shadow-md transition-colors hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--primary)] dark:text-[var(--route-ink)] sm:flex-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <span className="sm:hidden lg:inline">{t('search')}</span>
          </button>
        </div>
      </form>

      {needsCommunitySelection && (
        <p className="px-2 text-xs font-bold text-[var(--accent-strong)]">
          {copy.communityRequired}
        </p>
      )}

      {/* Saved place chips — fills whichever field was last focused */}
      {(savedPlaces.length > 0 || cityOrArea) && (
        <SavedPlaceChips
          initialPlaces={savedPlaces}
          lang={lang}
          onSelect={(name) => {
            if (activeFieldRef.current === 'destination') {
              setDestination(name);
            } else {
              setOrigin(name);
            }
          }}
          homeNudgeName={cityOrArea}
          activeField={activeField}
          compact
        />
      )}
    </div>
  );
}
