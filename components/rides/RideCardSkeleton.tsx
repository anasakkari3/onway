export default function RideCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="ride-skeleton-list" aria-label="Loading rides">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="decision-card decision-card--skeleton" aria-hidden="true">
          <div className="decision-card__topline">
            <div className="decision-card__driver">
              <span className="skeleton-block h-11 w-11 rounded-full" />
              <span className="skeleton-stack">
                <span className="skeleton-block h-4 w-24" />
                <span className="skeleton-block h-3 w-32" />
              </span>
            </div>
            <span className="skeleton-block h-8 w-16" />
          </div>
          <div className="decision-card__route">
            <div className="decision-card__route-line">
              <span />
              <i />
              <span />
            </div>
            <div className="decision-card__route-text">
              <span className="skeleton-block h-5 w-48" />
              <span className="skeleton-block h-5 w-36" />
            </div>
          </div>
          <div className="decision-card__pulse-row">
            <span className="skeleton-block h-6 w-32" />
            <span className="skeleton-block h-5 w-12" />
          </div>
          <div className="decision-card__signal-grid">
            <span className="skeleton-block h-14 w-full" />
            <span className="skeleton-block h-14 w-full" />
          </div>
          <div className="decision-card__footer">
            <span className="skeleton-block h-4 w-36" />
            <span className="skeleton-block h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
