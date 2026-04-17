'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DecisionRideCard from '@/components/rides/DecisionRideCard';
import MobileStickyCTA from '@/components/public/MobileStickyCTA';
import PreviewRouteMap from '@/components/public/PreviewRouteMap';
import RideCardSkeleton from '@/components/rides/RideCardSkeleton';
import RidePreviewDetail from '@/components/public/RidePreviewDetail';
import type { PreviewCopy, PreviewRide } from '@/lib/preview/rides';

type Props = {
  rides: PreviewRide[];
  copy: PreviewCopy;
};

function rideToCard(ride: PreviewRide, copy: PreviewCopy, actionLabel: string) {
  const seatsLabel =
    ride.seatsAvailable === 1
      ? copy.onlySeatLeft
      : copy.seatsLeft.replace('{count}', String(ride.seatsAvailable));

  return {
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
    actionLabel,
  };
}

export default function PreviewExperience({ rides, copy }: Props) {
  const urgentRide = useMemo(
    () => rides.find((ride) => ride.urgency) ?? rides[0],
    [rides]
  );
  const [visibleCount, setVisibleCount] = useState(Math.min(4, rides.length));
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [highlightedRideId, setHighlightedRideId] = useState<string | undefined>(urgentRide?.id);
  const [showLoadingDemo, setShowLoadingDemo] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setHighlightedRideId(undefined), 1800);
    return () => window.clearTimeout(timeout);
  }, []);

  const visibleRides = rides.slice(0, visibleCount);
  const selectedRide = rides.find((ride) => ride.id === selectedRideId) ?? null;

  const handleRideSelect = (rideId: string) => {
    setSelectedRideId(rideId);
    setHighlightedRideId(rideId);
  };

  return (
    <>
      <section className="preview-hero">
        <div className="preview-hero__content">
          <p className="landing-eyebrow">{copy.heroEyebrow}</p>
          <h1 className="display-title">{copy.heroTitle}</h1>
          <p>{copy.heroBody}</p>
          <div className="preview-hero__hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {copy.hint}
          </div>
        </div>

        <PreviewRouteMap
          rides={visibleRides}
          highlightedRideId={highlightedRideId}
          label={copy.routeMapLabel}
          countLabel={copy.routeCount}
        />
      </section>

      <main className="preview-main">
        <div className="preview-main__header">
          <div>
            <p className="landing-eyebrow">{copy.highlightedLabel}</p>
            <h2 className="display-title">{copy.ridesNearby}</h2>
          </div>
          <Link href="/login?mode=signup&next=%2Fapp" className="preview-main__join">
            {copy.joinNow}
          </Link>
        </div>

        <div className="preview-layout">
          <div className="preview-list">
            {visibleRides.map((ride) => (
              <DecisionRideCard
                key={ride.id}
                ride={rideToCard(ride, copy, copy.viewRide)}
                highlighted={ride.id === highlightedRideId}
                onSelect={handleRideSelect}
              />
            ))}

            {visibleCount < rides.length ? (
              <button
                type="button"
                className="preview-load-more"
                onClick={() => setVisibleCount((count) => Math.min(count + 2, rides.length))}
              >
                {copy.loadMore}
              </button>
            ) : null}
          </div>

          <aside className="preview-side">
            {selectedRide ? (
              <RidePreviewDetail
                key={selectedRide.id}
                ride={selectedRide}
                copy={copy}
                onClose={() => setSelectedRideId(null)}
              />
            ) : (
              <div className="preview-state-card">
                <p className="landing-eyebrow">{copy.previewMode}</p>
                <h3>{copy.hint}</h3>
                <p>{urgentRide?.detailNote}</p>
                <button type="button" onClick={() => urgentRide && handleRideSelect(urgentRide.id)}>
                  {copy.viewRide}
                </button>
              </div>
            )}

            <div className="preview-states-demo">
              <button type="button" onClick={() => setShowLoadingDemo((value) => !value)}>
                {showLoadingDemo ? copy.continueBrowsing : copy.loadingTitle}
              </button>
              {showLoadingDemo ? (
                <RideCardSkeleton count={2} />
              ) : (
                <>
                  <div className="preview-empty-state">
                    <strong>{copy.emptyTitle}</strong>
                    <span>{copy.emptyBody}</span>
                  </div>
                  <div className="preview-error-state">
                    <strong>{copy.errorTitle}</strong>
                    <span>{copy.errorBody}</span>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      <MobileStickyCTA
        href="/login?mode=signup&next=%2Fapp"
        label={copy.joinNow}
        secondaryHref="/"
        secondaryLabel={copy.continueBrowsing}
      />
    </>
  );
}
