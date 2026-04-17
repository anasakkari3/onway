'use client';

import Link from 'next/link';
import DecisionRideCard from '@/components/rides/DecisionRideCard';
import type { PreviewCopy, PreviewRide } from '@/lib/preview/rides';

type Props = {
  ride: PreviewRide;
  copy: PreviewCopy;
  onClose: () => void;
};

export default function RidePreviewDetail({ ride, copy, onClose }: Props) {
  const joinHref = '/login?mode=signup&next=%2Fapp';
  const seatsLabel =
    ride.seatsAvailable === 1
      ? copy.onlySeatLeft
      : copy.seatsLeft.replace('{count}', String(ride.seatsAvailable));

  return (
    <section className="preview-detail" aria-live="polite">
      <div className="preview-detail__header">
        <span>{copy.previewMode}</span>
        <button type="button" onClick={onClose}>
          {copy.continueBrowsing}
        </button>
      </div>

      <DecisionRideCard
        ride={{
          id: ride.id,
          origin: ride.origin,
          destination: ride.destination,
          timeLabel: ride.timeLabel,
          dayLabel: ride.dayLabel,
          seatsAvailable: ride.seatsAvailable,
          seatsLabel,
          priceLabel: ride.priceLabel,
          driverName: ride.driverName,
          communityName: ride.communityName,
          passengerInitials: ride.passengerInitials,
          activityHint: ride.activityHint,
          urgency: ride.urgency,
          trustLine: ride.trustLine,
          actionLabel: copy.joinNow,
        }}
        highlighted
        locked
        href={joinHref}
      />

      <div className="preview-detail__note">
        <p>{ride.detailNote}</p>
      </div>

      <div className="preview-detail__locks">
        <Link href={joinHref} className="preview-detail__lock preview-detail__lock--primary">
          <span aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          {copy.lockedBooking}
        </Link>
        <Link href={joinHref} className="preview-detail__lock">
          <span aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </span>
          {copy.lockedMessage}
        </Link>
      </div>
    </section>
  );
}
