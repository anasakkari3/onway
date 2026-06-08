import type { Lang } from '@/lib/i18n/dictionaries';

type TranslationFn = (key: string) => string;

export const APP_TIME_ZONE = 'Asia/Jerusalem';

export function isRtlLang(lang: Lang): boolean {
  return lang === 'ar' || lang === 'he';
}

export function getLangDir(lang: Lang): 'ltr' | 'rtl' {
  return isRtlLang(lang) ? 'rtl' : 'ltr';
}

export function getLocaleTag(lang: Lang): string {
  switch (lang) {
    case 'ar':
      return 'ar';
    case 'he':
      return 'he';
    case 'en':
    default:
      return 'en-US';
  }
}

export function formatLocalizedDate(
  lang: Lang,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleDateString(getLocaleTag(lang), {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

export function formatLocalizedTime(
  lang: Lang,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleTimeString(getLocaleTag(lang), {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatLocalizedDateTime(
  lang: Lang,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleString(getLocaleTag(lang), {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

function getAppDateParts(value: Date | string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

function getAppDayNumber(value: Date | string): number {
  const { year, month, day } = getAppDateParts(value);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function getAppLocalHour(value: Date | string = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    hour12: false,
  }).format(new Date(value));

  return Number(hour);
}

export function getRelativeDayLabel(
  lang: Lang,
  value: Date | string,
  t: TranslationFn
): string {
  const target = new Date(value);
  const dayDiff = Math.round(getAppDayNumber(target) - getAppDayNumber(new Date()));

  if (dayDiff === 0) {
    return t('today');
  }

  if (dayDiff === 1) {
    return t('tomorrow');
  }

  return formatLocalizedDate(lang, target, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPriceLabel(
  priceCents: number | null | undefined,
  t: TranslationFn
): string | null {
  if (priceCents == null) return null;
  if (priceCents === 0) return t('free');
  return `₪${(priceCents / 100).toFixed(2)}`;
}

export function formatSeatCount(count: number, t: TranslationFn): string {
  return count === 1 ? `1 ${t('seat')}` : `${count} ${t('seats')}`;
}

export function formatSeatAvailability(count: number, t: TranslationFn): string {
  return count === 1 ? `1 ${t('seat_left')}` : `${count} ${t('seats_left')}`;
}

export function formatRouteLabel(origin: string, destination: string): string {
  return `${origin} - ${destination}`;
}
