'use client';

import { useRef, useState, useTransition } from 'react';
import { addSavedPlaceAction, deleteSavedPlaceAction } from '@/app/(app)/saved-places/actions';
import type { SavedPlace, SavedPlaceLabel } from '@/lib/services/savedPlaces';

// ─── copy ────────────────────────────────────────────────────────────────────

const COPY = {
  en: {
    savedPlaces: 'Saved places',
    addPlace: 'Save a place',
    saveName: 'Place name',
    cancel: 'Cancel',
    save: 'Save',
    saveHomeNudge: (name: string) => `Save "${name}" as home?`,
    labelHome: 'Home',
    labelWork: 'Work',
    labelUniversity: 'University',
    labelCustom: 'Other',
    deleteAriaLabel: (name: string) => `Remove ${name}`,
    fillOrigin: '→ From',
    fillDestination: '→ To',
  },
  ar: {
    savedPlaces: 'أماكن محفوظة',
    addPlace: 'أضف مكانًا',
    saveName: 'اسم المكان',
    cancel: 'إلغاء',
    save: 'حفظ',
    saveHomeNudge: (name: string) => `حفظ "${name}" كمنزل؟`,
    labelHome: 'المنزل',
    labelWork: 'العمل',
    labelUniversity: 'الجامعة',
    labelCustom: 'أخرى',
    deleteAriaLabel: (name: string) => `إزالة ${name}`,
    fillOrigin: '← من',
    fillDestination: '← إلى',
  },
  he: {
    savedPlaces: 'מקומות שמורים',
    addPlace: 'הוסף מקום',
    saveName: 'שם המקום',
    cancel: 'ביטול',
    save: 'שמירה',
    saveHomeNudge: (name: string) => `לשמור "${name}" כבית?`,
    labelHome: 'בית',
    labelWork: 'עבודה',
    labelUniversity: 'אוניברסיטה',
    labelCustom: 'אחר',
    deleteAriaLabel: (name: string) => `הסר ${name}`,
    fillOrigin: '→ מוצא',
    fillDestination: '→ יעד',
  },
} as const;

type Lang = keyof typeof COPY;

function getLabelOptions(copy: typeof COPY[Lang]) {
  return [
    { value: 'home' as SavedPlaceLabel, emoji: '🏠', label: copy.labelHome },
    { value: 'work' as SavedPlaceLabel, emoji: '💼', label: copy.labelWork },
    { value: 'university' as SavedPlaceLabel, emoji: '🎓', label: copy.labelUniversity },
    { value: 'custom' as SavedPlaceLabel, emoji: '📍', label: copy.labelCustom },
  ];
}

// ─── props ───────────────────────────────────────────────────────────────────

type Props = {
  initialPlaces: SavedPlace[];
  lang?: Lang;
  /** Called when user clicks a chip — fill parent input with this name */
  onSelect: (name: string) => void;
  /** If set and user has no home place, show a nudge chip to save it as home */
  homeNudgeName?: string;
  /** If true, shows a compact single-row style (no section label) */
  compact?: boolean;
  /** When provided, shows a small badge telling user which field will be filled */
  activeField?: 'origin' | 'destination';
};

// ─── component ───────────────────────────────────────────────────────────────

export default function SavedPlaceChips({
  initialPlaces,
  lang = 'ar',
  onSelect,
  homeNudgeName,
  activeField,
}: Props) {
  const copy = COPY[lang] ?? COPY.ar;
  const labelOptions = getLabelOptions(copy);
  const [places, setPlaces] = useState<SavedPlace[]>(initialPlaces);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState<SavedPlaceLabel>('home');
  const [isPending, startTransition] = useTransition();
  const tmpIdRef = useRef(0);

  const hasHome = places.some((p) => p.label === 'home');
  const showNudge =
    !hasHome &&
    homeNudgeName?.trim() &&
    !places.some((p) => p.name.toLowerCase() === homeNudgeName.toLowerCase());

  // ─── handlers ──────────────────────────────────────────────────────────────

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const emoji = labelOptions.find((o) => o.value === newLabel)?.emoji ?? '📍';
    const optimistic: SavedPlace = {
      id: `tmp_${++tmpIdRef.current}`,
      name: trimmed,
      label: newLabel,
      emoji,
    };
    setPlaces((prev) => [...prev, optimistic]);
    setShowAdd(false);
    setNewName('');
    setNewLabel('home');
    startTransition(async () => {
      const res = await addSavedPlaceAction(trimmed, newLabel);
      if (!res.ok) {
        setPlaces((prev) => prev.filter((p) => p.id !== optimistic.id));
      }
    });
  };

  const handleNudge = () => {
    if (!homeNudgeName?.trim()) return;
    const optimistic: SavedPlace = {
      id: `tmp_${++tmpIdRef.current}`,
      name: homeNudgeName.trim(),
      label: 'home',
      emoji: '🏠',
    };
    setPlaces((prev) => [...prev, optimistic]);
    startTransition(async () => {
      await addSavedPlaceAction(homeNudgeName.trim(), 'home');
    });
  };

  const handleDelete = (placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    startTransition(async () => {
      await deleteSavedPlaceAction(placeId);
    });
  };

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-1.5">
      {/* Context badge — tells user which field chips will fill */}
      {activeField && (places.length > 0 || showNudge) && (
        <span className={`self-start text-[10px] font-bold uppercase tracking-widest px-1 ${
          activeField === 'destination'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-sky-600 dark:text-sky-400'
        }`}>
          {activeField === 'destination' ? copy.fillDestination : copy.fillOrigin}
        </span>
      )}
      {/* Chips row */}
      <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-0.5 scrollbar-hide">
        {/* Existing saved places */}
        {places.map((place) => (
          // group wraps the chip + delete so hover works on both
          <div key={place.id} role="group" className="group relative shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => onSelect(place.name)}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-7 py-1.5 rounded-full text-slate-700 dark:text-slate-200 text-sm font-medium hover:border-sky-400 hover:text-sky-600 dark:hover:border-sky-500 dark:hover:text-sky-300 transition-colors shadow-sm"
            >
              <span className="text-base leading-none">{place.emoji}</span>
              <span dir="auto">{place.name}</span>
            </button>
            {/* Delete — sibling button, never nested inside another button */}
            <button
              type="button"
              aria-label={copy.deleteAriaLabel(place.name)}
              onClick={() => handleDelete(place.id)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 transition-colors text-[10px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Home nudge chip */}
        {showNudge && (
          <button
            type="button"
            onClick={handleNudge}
            disabled={isPending}
            className="shrink-0 flex items-center gap-1.5 border border-dashed border-amber-400 dark:border-amber-600 px-3 py-1.5 rounded-full text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <span>🏠</span>
            <span dir="auto">{copy.saveHomeNudge(homeNudgeName!)}</span>
          </button>
        )}

        {/* Add new place button */}
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="shrink-0 flex items-center gap-1 border border-dashed border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-400 dark:text-slate-500 text-sm hover:border-sky-400 hover:text-sky-500 dark:hover:border-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <span className="text-base leading-none font-light">+</span>
            <span>{copy.addPlace}</span>
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showAdd && (
        <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700">
          {/* Label picker */}
          <div className="flex gap-1.5 flex-wrap">
            {labelOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNewLabel(opt.value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  newLabel === opt.value
                    ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-900/30 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>

          {/* Name input + actions */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={copy.saveName}
              autoFocus
              dir="auto"
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-400 dark:focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewName(''); }}
              className="px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || isPending}
              className="px-3 py-2 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 disabled:opacity-40 transition-colors"
            >
              {copy.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
