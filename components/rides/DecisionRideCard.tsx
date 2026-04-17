'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export type DecisionRideCardRide = {
  id: string;
  origin: string;
  destination: string;
  timeLabel: string;
  dayLabel?: string;
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
}: {
  ride: DecisionRideCardRide;
  highlighted?: boolean;
  locked?: boolean;
}) {
  const passengers = ride.passengerInitials?.slice(0, 4) ?? [];

  return (
    <>
      <div className="decision-card__topline">
        <span className={highlighted ? 'decision-card__hint decision-card__hint--hot' : 'decision-card__hint'}>
          {ride.urgency || ride.activityHint || ride.communityName}
        </span>
        {ride.priceLabel ? (
          <span className="decision-card__price">{ride.priceLabel}</span>
        ) : null}
      </div>

      <div className="decision-card__route">
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

      <div className="decision-card__meta">
        <div>
          <span>{ride.dayLabel}</span>
          <strong>{ride.timeLabel}</strong>
        </div>
        <div className={ride.seatsAvailable <= 2 ? 'decision-card__seats decision-card__seats--urgent' : 'decision-card__seats'}>
          {ride.seatsLabel}
        </div>
      </div>

      <div className="decision-card__people">
        <div className="decision-card__driver">
          <DriverAvatar name={ride.driverName} src={ride.driverAvatarUrl} />
          <div>
            <strong>{ride.driverName}</strong>
            <span>{ride.communityName}</span>
          </div>
        </div>

        <div className="decision-card__passengers" aria-label="Passenger preview">
          {passengers.map((initial) => (
            <span key={initial}>{initial}</span>
          ))}
        </div>
      </div>

      <div className="decision-card__footer">
        <span className="decision-card__trust">{ride.trustLine}</span>
        <span className={locked ? 'decision-card__action decision-card__action--locked' : 'decision-card__action'}>
          {locked ? (
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
  const classes = [
    'decision-card',
    highlighted ? 'decision-card--highlighted' : '',
    locked ? 'decision-card--locked' : '',
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
        <CardInner ride={ride} highlighted={highlighted} locked={locked} />
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
      <CardInner ride={ride} highlighted={highlighted} locked={locked} />
    </button>
  );
}
