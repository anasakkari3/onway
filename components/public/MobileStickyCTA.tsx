import Link from 'next/link';

type Props = {
  href: string;
  label: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export default function MobileStickyCTA({
  href,
  label,
  secondaryLabel,
  secondaryHref,
}: Props) {
  return (
    <div className="mobile-sticky-cta md:hidden">
      <Link href={href} className="mobile-sticky-cta__primary">
        {label}
      </Link>
      {secondaryLabel && secondaryHref ? (
        <Link href={secondaryHref} className="mobile-sticky-cta__secondary">
          {secondaryLabel}
        </Link>
      ) : null}
    </div>
  );
}
