import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { CommunityInfo } from '@/lib/types';
import { getCommunityIdentity } from '@/lib/community/identity';

type CommunityIdentityTarget = Pick<
  CommunityInfo,
  'id' | 'name' | 'description' | 'type' | 'membership_mode'
>;

type CommunityIdentityCardProps = {
  community: CommunityIdentityTarget;
  href?: string;
  selected?: boolean;
  roleLabel?: string | null;
  accessLabel?: string | null;
  typeLabel?: string | null;
  trustLabel?: string | null;
  activeRideCount?: number | null;
  activeRideCountLabel?: string | null;
  description?: string | null;
  action?: ReactNode;
  className?: string;
  size?: 'regular' | 'compact';
  testId?: string;
};

type CommunityAllIdentityCardProps = {
  href: string;
  label: string;
  selected?: boolean;
  activeRideCountLabel?: string | null;
  className?: string;
};

function getIdentityStyle(community: CommunityIdentityTarget): CSSProperties {
  const identity = getCommunityIdentity(community);

  return {
    '--community-accent': identity.palette.accent,
    '--community-accent-soft': identity.palette.soft,
    '--community-accent-ink': identity.palette.ink,
  } as CSSProperties;
}

function CommunityCardContent({
  community,
  roleLabel,
  accessLabel,
  typeLabel,
  trustLabel,
  activeRideCountLabel,
  description,
  action,
}: Omit<CommunityIdentityCardProps, 'href' | 'selected' | 'className' | 'size' | 'testId'>) {
  const identity = getCommunityIdentity(community);
  const visibleDescription = description ?? community.description ?? null;

  return (
    <>
      <div className="community-identity-card__main">
        <span
          className="community-identity-card__emblem"
          data-motif={identity.motif}
          aria-hidden="true"
        >
          {identity.initials}
        </span>
        <div className="community-identity-card__body">
          <div className="community-identity-card__title-row">
            <strong dir="auto">{community.name}</strong>
            {activeRideCountLabel ? (
              <span className="community-identity-card__ride-count">
                {activeRideCountLabel}
              </span>
            ) : null}
          </div>
          <div className="community-identity-card__meta">
            {roleLabel ? <span>{roleLabel}</span> : null}
            {accessLabel ? <span>{accessLabel}</span> : null}
            {typeLabel ? <span>{typeLabel}</span> : null}
          </div>
        </div>
      </div>

      {visibleDescription ? (
        <p className="community-identity-card__description" dir="auto">
          {visibleDescription}
        </p>
      ) : null}

      {trustLabel ? (
        <p className="community-identity-card__trust" dir="auto">
          {trustLabel}
        </p>
      ) : null}

      {action ? <div className="community-identity-card__action">{action}</div> : null}
    </>
  );
}

export function CommunityIdentityCard({
  community,
  href,
  selected = false,
  className = '',
  size = 'regular',
  testId,
  ...contentProps
}: CommunityIdentityCardProps) {
  const classes = [
    'community-identity-card',
    `community-identity-card--${size}`,
    selected ? 'community-identity-card--selected' : '',
    href ? 'community-identity-card--interactive' : '',
    className,
  ].filter(Boolean).join(' ');
  const style = getIdentityStyle(community);

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        style={style}
        aria-current={selected ? 'page' : undefined}
        data-testid={testId}
      >
        <CommunityCardContent community={community} {...contentProps} />
      </Link>
    );
  }

  return (
    <div className={classes} style={style} data-testid={testId}>
      <CommunityCardContent community={community} {...contentProps} />
    </div>
  );
}

export function CommunityAllIdentityCard({
  href,
  label,
  selected = false,
  activeRideCountLabel,
  className = '',
}: CommunityAllIdentityCardProps) {
  const classes = [
    'community-identity-card',
    'community-identity-card--compact',
    'community-identity-card--all',
    'community-identity-card--interactive',
    selected ? 'community-identity-card--selected' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Link
      href={href}
      className={classes}
      aria-current={selected ? 'page' : undefined}
      style={{
        '--community-accent': 'oklch(0.54 0.1 172)',
        '--community-accent-soft': 'oklch(0.93 0.045 172)',
        '--community-accent-ink': 'oklch(0.27 0.07 172)',
      } as CSSProperties}
    >
      <div className="community-identity-card__main">
        <span className="community-identity-card__emblem community-identity-card__emblem--all" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <div className="community-identity-card__body">
          <div className="community-identity-card__title-row">
            <strong>{label}</strong>
            {activeRideCountLabel ? (
              <span className="community-identity-card__ride-count">
                {activeRideCountLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
