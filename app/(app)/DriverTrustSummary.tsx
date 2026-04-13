'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { TrustBadge, TrustProfile } from '@/lib/types';
import { trackClientEvent } from '@/lib/analytics/client-actions';

type Props = {
  ratingAvg?: number | null;
  ratingCount?: number | null;
  completedDrives?: number | null;
  trustProfile?: TrustProfile | null;
  variant?: 'compact' | 'full';
};

function formatAverage(avg: number): string {
  return avg.toFixed(1).replace(/\.0$/, '');
}

/**
 * Returns a human-readable trust tier based on verified activity, not the raw score.
 * This is what shows in the UI — the number alone carries no meaning for a new user.
 */
function getTrustTier(completedDrives: number, emailVerified: boolean): {
  label: string;
  colorClass: string;
} {
  if (completedDrives === 0) {
    return { label: 'New driver', colorClass: 'text-slate-400 dark:text-slate-500' };
  }
  if (completedDrives < 3) {
    return { label: 'Getting started', colorClass: 'text-amber-600 dark:text-amber-400' };
  }
  if (completedDrives < 8) {
    return {
      label: emailVerified ? 'Active · Verified' : 'Active driver',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  return {
    label: emailVerified ? 'Experienced · Verified' : 'Experienced',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  };
}

function CompactTrustSummary({
  ratingAvg,
  ratingCount,
  completedDrives,
  trustProfile,
}: {
  ratingAvg: number;
  ratingCount: number;
  completedDrives: number;
  trustProfile?: TrustProfile | null;
}) {
  const { t } = useTranslation();
  const hasRatings = ratingCount > 0;
  const tier = getTrustTier(completedDrives, trustProfile?.email_verified ?? false);

  return (
    <span className="flex items-center gap-1.5 text-[10px]">
      {/* Tier label replaces the raw "Trust N" number */}
      <span className={`font-semibold ${tier.colorClass}`}>{tier.label}</span>

      {hasRatings && (
        <>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
          <span className="font-bold text-amber-500">
            {formatAverage(ratingAvg)}
            <span className="font-normal text-slate-400 dark:text-slate-500 ml-0.5">
              ({ratingCount})
            </span>
          </span>
        </>
      )}

      {completedDrives > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {completedDrives} {completedDrives === 1 ? t('completed_drive') : t('completed_drives')}
          </span>
        </>
      )}

      {/* Show first badge only if no other signals — avoid crowding */}
      {completedDrives === 0 && !hasRatings && trustProfile?.badges[0] && (
        <>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
          <span className="rounded-lg bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            {trustProfile.badges[0].label}
          </span>
        </>
      )}
    </span>
  );
}

function TrustBadges({ badges }: { badges: TrustBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300"
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function FullTrustSummary({
  ratingAvg,
  ratingCount,
  completedDrives,
  trustProfile,
}: {
  ratingAvg: number;
  ratingCount: number;
  completedDrives: number;
  trustProfile?: TrustProfile | null;
}) {
  const { t } = useTranslation();
  const tier = getTrustTier(completedDrives, trustProfile?.email_verified ?? false);

  useEffect(() => {
    if (trustProfile) {
      void trackClientEvent('trust_badge_seen', {
        trust_score: trustProfile.trust_score,
        badge_count: trustProfile.badges.length,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-end gap-2">
      {trustProfile && (
        <div className="flex items-center gap-2">
          {/* Trust tier card: label + score together give both meaning and detail */}
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-center min-w-[96px]">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-300 font-bold">
              Trust
            </p>
            <p className={`text-sm font-black mt-1 ${tier.colorClass}`}>
              {tier.label.split(' · ')[0]}
            </p>
            {/* Show score as subtle sub-label — provides detail without dominating */}
            <p className="text-[9px] text-emerald-500 dark:text-emerald-400 mt-0.5">
              Score {trustProfile.trust_score}
            </p>
          </div>
          <TrustBadges badges={trustProfile.badges.slice(0, 2)} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-center min-w-[84px]">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
            {t('driver_rating')}
          </p>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
            {ratingCount > 0 ? formatAverage(ratingAvg) : t('new')}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {ratingCount <= 0
              ? t('no_ratings_received')
              : ratingCount === 1
                ? `1 ${t('rating_received')}`
                : `${ratingCount} ${t('ratings_received')}`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-center min-w-[108px]">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
            {t('completed_drives_label')}
          </p>
          <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
            {completedDrives}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t('as_driver')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DriverTrustSummary({
  ratingAvg = 0,
  ratingCount = 0,
  completedDrives = 0,
  trustProfile = null,
  variant = 'compact',
}: Props) {
  if (variant === 'full') {
    return (
      <FullTrustSummary
        ratingAvg={ratingAvg ?? 0}
        ratingCount={ratingCount ?? 0}
        completedDrives={Math.max(0, completedDrives ?? 0)}
        trustProfile={trustProfile}
      />
    );
  }

  return (
    <CompactTrustSummary
      ratingAvg={ratingAvg ?? 0}
      ratingCount={ratingCount ?? 0}
      completedDrives={Math.max(0, completedDrives ?? 0)}
      trustProfile={trustProfile}
    />
  );
}
