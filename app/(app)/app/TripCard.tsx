import DecisionRideCard from '@/components/rides/DecisionRideCard';
import type {
  CommunityType,
  TripPassengerGenderPreference,
  TripStatus,
  TrustProfile,
  WeekdayIndex,
} from '@/lib/types';
import type { Lang } from '@/lib/i18n/dictionaries';
import {
  formatLocalizedTime,
  formatPriceLabel,
  formatSeatAvailability,
  formatSeatCount,
  getRelativeDayLabel,
} from '@/lib/i18n/locale';
import {
  isRecurringTrip,
  formatRecurringSummary,
} from '@/lib/trips/recurrence';

type TripCardTrip = {
  id: string;
  community_name?: string | null;
  community_type?: CommunityType | null;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  status?: TripStatus;
  seats_available: number;
  price_cents?: number | null;
  driver?: {
    avatar_url?: string | null;
    display_name?: string | null;
    gender?: string | null;
    rating_avg?: number;
    rating_count?: number;
  } | null;
  avatar_url?: string | null;
  display_name?: string | null;
  passenger_gender_preference?: TripPassengerGenderPreference | null;
  driver_received_rating_avg?: number;
  driver_received_rating_count?: number;
  driver_completed_drives?: number;
  driver_trust_profile?: TrustProfile | null;
  trip_mode?: string | null;
  recurring_days?: WeekdayIndex[] | null;
  recurring_departure_time?: string | null;
};

const FALLBACK = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  free: 'Free',
  seat: 'seat',
  seats: 'seats',
  seat_left: 'seat left',
  seats_left: 'seats left',
  community_member: 'Community member',
  driver: 'Driver',
  view_ride: 'View ride',
} as const;

const ACTION_COPY: Record<Lang, { viewRide: string }> = {
  en: { viewRide: 'View ride' },
  ar: { viewRide: 'عرض الرحلة' },
  he: { viewRide: 'צפו בנסיעה' },
};

const PUBLIC_COPY: Record<Lang, string> = {
  en: 'Public community',
  ar: 'مجتمع عام',
  he: 'קהילה ציבורית',
};

const RECURRING_COPY: Record<Lang, { label: string }> = {
  en: { label: 'Recurring' },
  ar: { label: 'متكررة' },
  he: { label: 'קבועה' },
};

const TRUST_COPY: Record<Lang, {
  completed: (count: number) => string;
  rating: (rating: number, count: number) => string;
  verified: string;
}> = {
  en: {
    completed: (count) => `${count} completed community rides`,
    rating: (rating, count) => `${rating.toFixed(1)} rating · ${count} reviews`,
    verified: 'Verified community driver',
  },
  ar: {
    completed: (count) => `${count} رحلات مكتملة داخل المجتمع`,
    rating: (rating, count) => `تقييم ${rating.toFixed(1)} · ${count} مراجعات`,
    verified: 'سائق موثوق داخل المجتمع',
  },
  he: {
    completed: (count) => `${count} נסיעות קהילה שהושלמו`,
    rating: (rating, count) => `דירוג ${rating.toFixed(1)} · ${count} ביקורות`,
    verified: 'נהג קהילה מאומת',
  },
};

function normalizeLang(lang?: string): Lang {
  return lang === 'ar' || lang === 'he' ? lang : 'en';
}

export function TripCard(props: { trip: TripCardTrip; t?: (k: string) => string; lang?: string }) {
  const { trip, t, lang = 'en' } = props;
  const activeLang = normalizeLang(lang);
  const translate = (key: string) => {
    const translated = t?.(key);
    return translated && translated !== key
      ? translated
      : FALLBACK[key as keyof typeof FALLBACK] ?? key;
  };
  const driverName = trip.driver?.display_name || trip.display_name || translate('community_member');
  const avatarUrl = (trip.driver?.avatar_url || trip.avatar_url) ?? undefined;
  const receivedRatingAvg = trip.driver?.rating_avg ?? trip.driver_received_rating_avg;
  const receivedRatingCount = trip.driver?.rating_count || trip.driver_received_rating_count;
  const completedDrives = trip.driver_completed_drives ?? 0;

  const isRecurring = isRecurringTrip({
    trip_mode: trip.trip_mode,
    recurring_days: trip.recurring_days,
    recurring_departure_time: trip.recurring_departure_time,
  });
  const tripStatus = trip.status ?? 'scheduled';

  const time = formatLocalizedTime(activeLang, trip.departure_time);
  const date = getRelativeDayLabel(activeLang, trip.departure_time, translate);
  const priceDisplay = formatPriceLabel(trip.price_cents, translate);
  const showSeatUrgency = trip.seats_available <= 2;
  const seatsLabel = formatSeatAvailability(trip.seats_available, translate);
  const seatCountLabel = formatSeatCount(trip.seats_available, translate);
  const isToday = date === translate('today');
  const recurringSummary = isRecurring
    ? formatRecurringSummary(trip.recurring_days, trip.recurring_departure_time, activeLang)
    : null;
  const trustCopy = TRUST_COPY[activeLang];
  const trustLine =
    receivedRatingAvg && receivedRatingCount
      ? trustCopy.rating(receivedRatingAvg, receivedRatingCount)
      : completedDrives > 0
        ? trustCopy.completed(completedDrives)
        : trustCopy.verified;
  const activityHint = isRecurring
    ? `${RECURRING_COPY[activeLang].label}${recurringSummary ? ` · ${recurringSummary}` : ''}`
    : isToday
      ? date
      : trip.community_type === 'public'
        ? PUBLIC_COPY[activeLang]
        : trip.community_name ?? null;

  return (
    <DecisionRideCard
      href={`/trips/${trip.id}`}
      className="animate-fade-in-up"
      locked={trip.seats_available <= 0 && tripStatus !== 'in_progress'}
      ride={{
        id: trip.id,
        origin: trip.origin_name,
        destination: trip.destination_name,
        timeLabel: time,
        dayLabel: isRecurring ? RECURRING_COPY[activeLang].label : date,
        departureTime: trip.departure_time,
        status: tripStatus,
        isRecurring,
        lang: activeLang,
        seatsAvailable: trip.seats_available,
        seatsLabel: showSeatUrgency ? seatsLabel : seatCountLabel,
        priceLabel: priceDisplay,
        driverName,
        driverAvatarUrl: avatarUrl,
        communityName: trip.community_name ?? (trip.community_type === 'public' ? PUBLIC_COPY[activeLang] : null),
        passengerInitials: driverName ? [driverName.charAt(0).toUpperCase()] : [],
        activityHint,
        urgency: showSeatUrgency ? seatsLabel : null,
        trustLine,
        driverRatingAvg: receivedRatingAvg ?? 0,
        driverRatingCount: receivedRatingCount ?? 0,
        driverCompletedDrives: completedDrives,
        driverTrustProfile: trip.driver_trust_profile ?? null,
        actionLabel: ACTION_COPY[activeLang].viewRide,
      }}
    />
  );
}
