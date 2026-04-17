import type { PreviewRide } from '@/lib/preview/rides';

type Props = {
  rides: PreviewRide[];
  highlightedRideId?: string;
  label: string;
  countLabel: string;
};

const POSITIONS = [
  { x1: 16, y1: 68, x2: 76, y2: 28 },
  { x1: 12, y1: 28, x2: 78, y2: 76 },
  { x1: 24, y1: 82, x2: 88, y2: 54 },
  { x1: 8, y1: 48, x2: 60, y2: 18 },
  { x1: 36, y1: 20, x2: 92, y2: 72 },
];

export default function PreviewRouteMap({ rides, highlightedRideId, label, countLabel }: Props) {
  return (
    <section className="preview-map" aria-label={label}>
      <div className="preview-map__copy">
        <span>{label}</span>
        <strong>{countLabel.replace('{count}', String(rides.length))}</strong>
      </div>
      <svg viewBox="0 0 100 100" className="preview-map__svg" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="preview-route-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="oklch(0.82 0.14 84)" />
            <stop offset="1" stopColor="oklch(0.58 0.13 153)" />
          </linearGradient>
        </defs>
        <path d="M7 87 L26 72 L44 77 L61 58 L86 62" className="preview-map__grid preview-map__grid--thick" />
        <path d="M10 18 L32 34 L54 25 L73 42 L93 30" className="preview-map__grid" />
        <path d="M18 8 L22 30 L18 58 L31 91" className="preview-map__grid" />
        <path d="M58 7 L50 30 L57 56 L50 91" className="preview-map__grid" />
        {rides.slice(0, 5).map((ride, index) => {
          const position = POSITIONS[index % POSITIONS.length];
          const highlighted = ride.id === highlightedRideId;
          const cx = (position.x1 + position.x2) / 2;
          const cy = (position.y1 + position.y2) / 2;

          return (
            <g key={ride.id} className={highlighted ? 'preview-map__route preview-map__route--hot' : 'preview-map__route'}>
              <path
                d={`M${position.x1} ${position.y1} C ${position.x1 + 16} ${position.y1 - 18}, ${position.x2 - 18} ${position.y2 + 18}, ${position.x2} ${position.y2}`}
              />
              <circle cx={position.x1} cy={position.y1} r="2.4" />
              <circle cx={position.x2} cy={position.y2} r="2.4" />
              {highlighted ? <circle cx={cx} cy={cy} r="4.2" className="preview-map__pulse" /> : null}
            </g>
          );
        })}
      </svg>
    </section>
  );
}
