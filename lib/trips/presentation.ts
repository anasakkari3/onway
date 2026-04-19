import type { TripStatus, TripsRow } from '@/lib/types';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';

type TripPresentationTarget = Pick<TripsRow, 'status' | 'seats_available'>;
type TranslateFn = (key: 'scheduled' | 'full' | 'in_progress' | 'completed' | 'cancelled' | 'draft') => string;

type TripStatusPresentation = {
  status: TripStatus;
  label: string;
  chipClassName: string;
  accentClassName: string;
  cardClassName: string;
  isLive: boolean;
};

function liveLabel(inProgressLabel: string) {
  return `LIVE · ${inProgressLabel}`;
}

export function getTripStatusPresentation(trip: TripPresentationTarget): TripStatusPresentation {
  const t = ((key: 'scheduled' | 'full' | 'in_progress' | 'completed' | 'cancelled' | 'draft') =>
    ({
      scheduled: 'Scheduled',
      full: 'Full',
      in_progress: 'In progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      draft: 'Draft',
    })[key]) as TranslateFn;

  return getTripStatusPresentationWithTranslation(trip, t);
}

export function getTripStatusPresentationWithTranslation(
  trip: TripPresentationTarget,
  t: TranslateFn
): TripStatusPresentation {
  const status = getEffectiveTripStatus(trip) as TripStatus;

  switch (status) {
    case 'full':
      return {
        status,
        label: t('full'),
        chipClassName:
          'trip-status-chip trip-status-chip--full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
        accentClassName: 'trip-status-accent trip-status-accent--full bg-amber-500/10 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
        cardClassName: 'trip-status-surface trip-status-surface--full',
        isLive: false,
      };
    case 'in_progress':
      return {
        status,
        label: liveLabel(t('in_progress')),
        chipClassName:
          'trip-status-chip trip-status-chip--live bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700',
        accentClassName: 'trip-status-accent trip-status-accent--live bg-emerald-500/15 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
        cardClassName: 'trip-status-surface trip-status-surface--live',
        isLive: true,
      };
    case 'completed':
      return {
        status,
        label: t('completed'),
        chipClassName:
          'trip-status-chip trip-status-chip--completed bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
        accentClassName: 'trip-status-accent trip-status-accent--completed bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
        cardClassName: 'trip-status-surface trip-status-surface--completed',
        isLive: false,
      };
    case 'cancelled':
      return {
        status,
        label: t('cancelled'),
        chipClassName:
          'trip-status-chip trip-status-chip--cancelled bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
        accentClassName: 'trip-status-accent trip-status-accent--cancelled bg-rose-500/10 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
        cardClassName: 'trip-status-surface trip-status-surface--cancelled',
        isLive: false,
      };
    case 'draft':
      return {
        status,
        label: t('draft'),
        chipClassName:
          'trip-status-chip trip-status-chip--draft bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
        accentClassName: 'trip-status-accent trip-status-accent--draft bg-slate-500/10 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        cardClassName: 'trip-status-surface trip-status-surface--draft',
        isLive: false,
      };
    case 'scheduled':
    default:
      return {
        status,
        label: t('scheduled'),
        chipClassName:
          'trip-status-chip trip-status-chip--scheduled bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
        accentClassName: 'trip-status-accent trip-status-accent--scheduled bg-sky-500/10 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300',
        cardClassName: 'trip-status-surface trip-status-surface--scheduled',
        isLive: false,
      };
  }
}
