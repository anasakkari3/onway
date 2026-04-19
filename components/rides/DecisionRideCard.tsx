'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DriverTrustPassport } from '@/components/DriverTrustPassport';
import type { Lang } from '@/lib/i18n/dictionaries';
import type { TripStatus, TrustProfile } from '@/lib/types';

export type DecisionRideCardRide = {
  id: string;
  origin: string;
  destination: string;
  timeLabel: string;
  dayLabel?: string;
  departureTime?: string | null;
  status?: TripStatus;
  isRecurring?: boolean;
  lang?: Lang;
  seatsAvailable: number;
  seatsLabel: string;
  priceLabel?: string | null;
  driverName: string;
  driverAvatarUrl?: string | null;
  communityName?: string | null;
  passengerInitials?: string[];
  activityHint?: string | null;
  urgency?: string | null;
  trustLine?: string | null;
  driverRatingAvg?: number | null;
  driverRatingCount?: number | null;
  driverCompletedDrives?: number | null;
  driverTrustProfile?: TrustProfile | null;
  actionLabel: string;
};

type Props = {
  ride: DecisionRideCardRide;
  href?: string;
  highlighted?: boolean;
  locked?: boolean;
  onSelect?: (rideId: string) => void;
  className?: string;
};

type TimelineKind =
  | 'normal'
  | 'soon'
  | 'full'
  | 'recurring'
  | 'departed'
  | 'live'
  | 'completed'
  | 'cancelled';

type TimelineState = {
  kind: TimelineKind;
  headline: string;
  caption: string | null;
  status: string;
};

const TIME_COPY: Record<Lang, {
  at: string;
  departingSoon: string;
  full: string;
  recurring: string;
  scheduled: string;
  departed: string;
  live: string;
  liveHeadline: string;
  liveCaption: string;
  completed: string;
  cancelled: string;
  leavingNow: string;
  leavingInMinutes: (count: number) => string;
  leavingInHours: (count: number) => string;
}> = {
  en: {
    at: 'at',
    departingSoon: 'Soon',
    full: 'Full',
    recurring: 'Recurring',
    scheduled: 'Scheduled',
    departed: 'Departed',
    live: 'LIVE',
    liveHeadline: 'Trip in progress',
    liveCaption: 'Active now',
    completed: 'Completed',
    cancelled: 'Cancelled',
    leavingNow: 'leaving now',
    leavingInMinutes: (count) => `leaving in ${count} min`,
    leavingInHours: (count) => `leaving in ${count} hr`,
  },
  ar: {
    live: 'مباشرة',
    liveHeadline: 'الرحلة قيد التنفيذ',
    liveCaption: 'نشطة الآن',
    completed: 'مكتملة',
    cancelled: 'ملغاة',
    at: 'الساعة',
    departingSoon: 'قريبًا',
    full: 'ممتلئة',
    recurring: 'متكررة',
    scheduled: 'مجدولة',
    departed: 'انطلقت',
    leavingNow: 'تنطلق الآن',
    leavingInMinutes: (count) => `تنطلق خلال ${count} د`,
    leavingInHours: (count) => `تنطلق خلال ${count} س`,
  },
  he: {
    live: 'חי',
    liveHeadline: 'הנסיעה פעילה',
    liveCaption: 'פעילה עכשיו',
    completed: 'הושלמה',
    cancelled: 'בוטלה',
    at: 'בשעה',
    departingSoon: 'בקרוב',
    full: 'מלא',
    recurring: 'קבועה',
    scheduled: 'מתוכננת',
    departed: 'יצאה',
    leavingNow: 'יוצאת עכשיו',
    leavingInMinutes: (count) => `יוצאת בעוד ${count} דק׳`,
    leavingInHours: (count) => `יוצאת בעוד ${count} ש׳`,
  },
};

function getSafeLang(lang?: Lang): Lang {
  return lang === 'ar' || lang === 'he' ? lang : 'en';
}

function getTimelineState(ride: DecisionRideCardRide, now: number): TimelineState {
  const lang = getSafeLang(ride.lang);
  const copy = TIME_COPY[lang];
  const exactTime = ride.timeLabel;
  const day = ride.dayLabel ?? null;
  const exactCaption = day ? `${day} ${copy.at} ${exactTime}` : exactTime;
  const status = ride.status;

  if (status === 'cancelled') {
    return {
      kind: 'cancelled',
      headline: copy.cancelled,
      caption: exactCaption,
      status: copy.cancelled,
    };
  }

  if (status === 'completed') {
    return {
      kind: 'completed',
      headline: copy.completed,
      caption: exactCaption,
      status: copy.completed,
    };
  }

  if (status === 'in_progress') {
    return {
      kind: 'live',
      headline: copy.liveHeadline,
      caption: exactCaption || copy.liveCaption,
      status: copy.live,
    };
  }

  if (ride.seatsAvailable <= 0) {
    return {
      kind: 'full',
      headline: copy.full,
      caption: exactCaption,
      status: copy.full,
    };
  }

  if (ride.isRecurring) {
    return {
      kind: 'recurring',
      headline: exactTime,
      caption: day ?? copy.recurring,
      status: copy.recurring,
    };
  }

  if (!ride.departureTime) {
    return {
      kind: 'normal',
      headline: exactTime,
      caption: day,
      status: ride.urgency ? copy.departingSoon : copy.scheduled,
    };
  }

  const departureMs = new Date(ride.departureTime).getTime();
  if (Number.isNaN(departureMs)) {
    return {
      kind: 'normal',
      headline: exactTime,
      caption: day,
      status: ride.urgency ? copy.departingSoon : copy.scheduled,
    };
  }

  const diffMinutes = Math.ceil((departureMs - now) / 60_000);

  if (diffMinutes <= 0) {
    return {
      kind: 'departed',
      headline: exactTime,
      caption: day,
      status: copy.departed,
    };
  }

  if (diffMinutes <= 5) {
    return {
      kind: 'soon',
      headline: copy.leavingNow,
      caption: exactCaption,
      status: copy.departingSoon,
    };
  }

  if (diffMinutes <= 90) {
    return {
      kind: 'soon',
      headline: copy.leavingInMinutes(diffMinutes),
      caption: exactCaption,
      status: copy.departingSoon,
    };
  }

  if (diffMinutes <= 12 * 60) {
    return {
      kind: 'normal',
      headline: copy.leavingInHours(Math.round(diffMinutes / 60)),
      caption: exactCaption,
      status: copy.scheduled,
    };
  }

  return {
    kind: 'normal',
    headline: exactTime,
    caption: day,
    status: copy.scheduled,
  };
}

function SeatDots({ seatsAvailable }: { seatsAvailable: number }) {
  const safeCount = Math.max(0, seatsAvailable);
  const visibleSlots = 4;
  const activeSlots = Math.min(safeCount, visibleSlots);

  return (
    <span className="decision-card__seat-dots" aria-hidden="true">
      {Array.from({ length: visibleSlots }).map((_, index) => (
        <span
          key={index}
          className={index < activeSlots ? 'is-filled' : ''}
        />
      ))}
      {safeCount > visibleSlots ? <strong>+</strong> : null}
    </span>
  );
}

function DriverAvatar({
  name,
  src,
}: {
  name: string;
  src?: string | null;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        className="decision-card__driver-avatar"
      />
    );
  }

  return (
    <span className="decision-card__driver-avatar decision-card__driver-avatar--fallback">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

function CardInner({
  ride,
  highlighted,
  locked,
  now,
}: {
  ride: DecisionRideCardRide;
  highlighted?: boolean;
  locked?: boolean;
  now: number;
}) {
  const timeline = useMemo(() => getTimelineState(ride, now), [ride, now]);
  const isLive = timeline.kind === 'live';
  const isUnavailable = (locked || ride.seatsAvailable <= 0) && !isLive;
  const hintText = ride.urgency || ride.activityHint || ride.communityName || timeline.status;

  return (
    <>
      <div className="decision-card__topline">
        <div className="decision-card__driver">
          <DriverAvatar name={ride.driverName} src={ride.driverAvatarUrl} />
          <div>
            <strong>{ride.driverName}</strong>
            <span>{ride.communityName || ride.trustLine}</span>
          </div>
        </div>
        <span className={`decision-card__state decision-card__state--${timeline.kind}`}>
          {timeline.status}
        </span>
      </div>

      <div className="decision-card__route" aria-label={`${ride.origin} to ${ride.destination}`}>
        <div className="decision-card__route-line" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <div className="decision-card__route-text">
          <p dir="auto">{ride.origin}</p>
          <p dir="auto">{ride.destination}</p>
        </div>
      </div>

      <div className="decision-card__pulse-row">
        <span className={highlighted || timeline.kind === 'soon' || isLive ? 'decision-card__hint decision-card__hint--hot' : 'decision-card__hint'}>
          {hintText}
        </span>
        {ride.priceLabel ? (
          <span className="decision-card__price">{ride.priceLabel}</span>
        ) : null}
      </div>

      <div className="decision-card__signal-grid">
        <div className="decision-card__timeline">
          <span>{timeline.headline}</span>
          {timeline.caption ? <small>{timeline.caption}</small> : null}
        </div>

        <div className={ride.seatsAvailable <= 2 ? 'decision-card__seat-meter decision-card__seat-meter--urgent' : 'decision-card__seat-meter'}>
          <SeatDots seatsAvailable={ride.seatsAvailable} />
          <span>{ride.seatsLabel}</span>
        </div>
      </div>

      <div className="decision-card__footer">
        <span className="decision-card__trust">
          {ride.driverTrustProfile || ride.driverRatingCount || ride.driverCompletedDrives ? (
            <DriverTrustPassport
              ratingAvg={ride.driverRatingAvg}
              ratingCount={ride.driverRatingCount}
              completedDrives={ride.driverCompletedDrives}
              trustProfile={ride.driverTrustProfile}
              variant="compact"
            />
          ) : (
            ride.trustLine
          )}
        </span>
        <span className={isUnavailable ? 'decision-card__action decision-card__action--locked' : 'decision-card__action'}>
          {isUnavailable ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : null}
          {ride.actionLabel}
        </span>
      </div>
    </>
  );
}

export default function DecisionRideCard({
  ride,
  href,
  highlighted = false,
  locked = false,
  onSelect,
  className = '',
}: Props) {
  const [motionActive, setMotionActive] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const timeline = getTimelineState(ride, now);

  useEffect(() => {
    if (!ride.departureTime || ride.isRecurring) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [ride.departureTime, ride.isRecurring]);

  const classes = [
    'decision-card',
    `decision-card--${timeline.kind}`,
    highlighted ? 'decision-card--highlighted' : '',
    locked || ride.seatsAvailable <= 0 ? 'decision-card--locked' : '',
    motionActive ? 'decision-card--motion-active' : '',
    className,
  ].filter(Boolean).join(' ');
  const motionHandlers = {
    onPointerEnter: () => setMotionActive(true),
    onPointerLeave: () => setMotionActive(false),
    onPointerDown: () => setMotionActive(true),
    onPointerUp: () => setMotionActive(false),
    onPointerCancel: () => setMotionActive(false),
    onFocus: () => setMotionActive(true),
    onBlur: () => setMotionActive(false),
  };

  if (href) {
    return (
      <Link href={href} className={classes} {...motionHandlers}>
        <CardInner ride={ride} highlighted={highlighted} locked={locked} now={now} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={() => onSelect?.(ride.id)}
      {...motionHandlers}
    >
      <CardInner ride={ride} highlighted={highlighted} locked={locked} now={now} />
    </button>
  );
}
