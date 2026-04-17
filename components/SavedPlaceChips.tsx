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
        <span className={`self-start px-1 text-xs font-black ${
          activeField === 'destination'
            ? 'text-[var(--success)]'
            : 'text-[var(--primary)]'
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
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] py-1.5 pl-3 pr-7 text-sm font-semibold text-[var(--muted-strong)] shadow-sm transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <span className="text-base leading-none">{place.emoji}</span>
              <span dir="auto">{place.name}</span>
            </button>
            {/* Delete — sibling button, never nested inside another button */}
            <button
              type="button"
              aria-label={copy.deleteAriaLabel(place.name)}
              onClick={() => handleDelete(place.id)}
              className="absolute right-1.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[10px] font-bold text-[var(--muted)] transition-colors hover:bg-red-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 group-hover:flex"
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
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-[var(--accent-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:bg-[var(--surface-raised)]"
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
            className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-[var(--border-soft)] px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <span className="text-base leading-none font-light">+</span>
            <span>{copy.addPlace}</span>
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showAdd && (
        <div className="soft-panel flex flex-col gap-2 rounded-lg p-3">
          {/* Label picker */}
          <div className="flex gap-1.5 flex-wrap">
            {labelOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNewLabel(opt.value)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  newLabel === opt.value
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary-dark)]'
                    : 'border-[var(--border-soft)] text-[var(--muted)] hover:border-[var(--primary)]'
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
              className="flex-1 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewName(''); }}
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)]"
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || isPending}
              className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-40 dark:text-[var(--route-ink)]"
            >
              {copy.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
