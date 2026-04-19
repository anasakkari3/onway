'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { Lang } from '@/lib/i18n/dictionaries';
import type { TrustBadge, TrustBadgeKey, TrustProfile } from '@/lib/types';
import { trackClientEvent } from '@/lib/analytics/client-actions';

type TrustTone = 'new' | 'active' | 'strong' | 'watch';

export type DriverTrustPassportProps = {
  driverName?: string | null;
  avatarUrl?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  completedDrives?: number | null;
  trustProfile?: TrustProfile | null;
  responseSpeedLabel?: string | null;
  variant?: 'compact' | 'full';
  className?: string;
};

const COPY: Record<Lang, {
  passport: string;
  compactLabel: string;
  newDriver: string;
  verifiedNew: string;
  gettingStarted: string;
  activeDriver: string;
  activeVerified: string;
  experienced: string;
  experiencedVerified: string;
  rebuilding: string;
  score: string;
  rating: string;
  new: string;
  noRatings: string;
  ratings: (count: number) => string;
  completed: string;
  asDriver: string;
  reliability: string;
  cleanRecord: string;
  noHistory: string;
  followThrough: (rate: number) => string;
  cancellations: (count: number) => string;
  response: string;
  badges: string;
  noBadges: string;
  fallbackDriver: string;
  badgeCopy: Record<TrustBadgeKey, string>;
}> = {
  en: {
    passport: 'Driver trust passport',
    compactLabel: 'Trust',
    newDriver: 'New driver',
    verifiedNew: 'New but verified',
    gettingStarted: 'Getting started',
    activeDriver: 'Active driver',
    activeVerified: 'Active · verified',
    experienced: 'Experienced',
    experiencedVerified: 'Experienced · verified',
    rebuilding: 'Rebuilding reliability',
    score: 'Score',
    rating: 'Rating',
    new: 'New',
    noRatings: 'No ratings yet',
    ratings: (count) => `${count} ${count === 1 ? 'rating' : 'ratings'}`,
    completed: 'Completed',
    asDriver: 'as driver',
    reliability: 'Cancellation reliability',
    cleanRecord: 'No driver cancellations',
    noHistory: 'No cancellation history yet',
    followThrough: (rate) => `${rate}% follow-through`,
    cancellations: (count) => `${count} ${count === 1 ? 'driver cancellation' : 'driver cancellations'}`,
    response: 'Response',
    badges: 'Signals',
    noBadges: 'More signals appear after community activity.',
    fallbackDriver: 'Driver',
    badgeCopy: {
      verified_email: 'Verified email',
      active_driver: 'Active driver',
      frequent_rider: 'Frequent rider',
      community_member: 'Community member',
      steady_driver: 'Steady driver',
      complete_profile: 'Profile ready',
    },
  },
  ar: {
    passport: 'بطاقة ثقة السائق',
    compactLabel: 'الثقة',
    newDriver: 'سائق جديد',
    verifiedNew: 'جديد وموثق',
    gettingStarted: 'بدأ النشاط',
    activeDriver: 'سائق نشط',
    activeVerified: 'نشط · موثق',
    experienced: 'سائق متمرس',
    experiencedVerified: 'متمرس · موثق',
    rebuilding: 'يبني الاعتمادية',
    score: 'النقاط',
    rating: 'التقييم',
    new: 'جديد',
    noRatings: 'لا توجد تقييمات بعد',
    ratings: (count) => `${count} ${count === 1 ? 'تقييم' : 'تقييمات'}`,
    completed: 'مكتملة',
    asDriver: 'كسائق',
    reliability: 'اعتمادية الإلغاء',
    cleanRecord: 'لا توجد إلغاءات من السائق',
    noHistory: 'لا يوجد سجل إلغاء بعد',
    followThrough: (rate) => `${rate}% التزام بالرحلات`,
    cancellations: (count) => `${count} ${count === 1 ? 'إلغاء من السائق' : 'إلغاءات من السائق'}`,
    response: 'الاستجابة',
    badges: 'الإشارات',
    noBadges: 'تظهر إشارات إضافية بعد نشاط المجتمع.',
    fallbackDriver: 'السائق',
    badgeCopy: {
      verified_email: 'البريد موثق',
      active_driver: 'سائق نشط',
      frequent_rider: 'راكب متكرر',
      community_member: 'عضو مجتمع',
      steady_driver: 'سائق ملتزم',
      complete_profile: 'ملف جاهز',
    },
  },
  he: {
    passport: 'דרכון אמון לנהג',
    compactLabel: 'אמון',
    newDriver: 'נהג חדש',
    verifiedNew: 'חדש ומאומת',
    gettingStarted: 'מתחיל לצבור נסיעות',
    activeDriver: 'נהג פעיל',
    activeVerified: 'פעיל · מאומת',
    experienced: 'מנוסה',
    experiencedVerified: 'מנוסה · מאומת',
    rebuilding: 'בונה אמינות',
    score: 'ציון',
    rating: 'דירוג',
    new: 'חדש',
    noRatings: 'עדיין אין דירוגים',
    ratings: (count) => `${count} ${count === 1 ? 'דירוג' : 'דירוגים'}`,
    completed: 'הושלמו',
    asDriver: 'כנהג',
    reliability: 'אמינות ביטולים',
    cleanRecord: 'אין ביטולי נהג',
    noHistory: 'עדיין אין היסטוריית ביטולים',
    followThrough: (rate) => `${rate}% עמידה בנסיעות`,
    cancellations: (count) => `${count} ${count === 1 ? 'ביטול נהג' : 'ביטולי נהג'}`,
    response: 'תגובה',
    badges: 'סימני אמון',
    noBadges: 'סימנים נוספים יופיעו אחרי פעילות בקהילה.',
    fallbackDriver: 'נהג',
    badgeCopy: {
      verified_email: 'אימייל מאומת',
      active_driver: 'נהג פעיל',
      frequent_rider: 'נוסע תדיר',
      community_member: 'חבר קהילה',
      steady_driver: 'נהג יציב',
      complete_profile: 'פרופיל מוכן',
    },
  },
};

function getSafeLang(lang: Lang): Lang {
  return lang === 'ar' || lang === 'he' ? lang : 'en';
}

function formatAverage(avg: number): string {
  return avg.toFixed(1).replace(/\.0$/, '');
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'D';
}

function getReliabilityRate(trustProfile?: TrustProfile | null): number | null {
  if (!trustProfile || typeof trustProfile.driver_reliability_rate !== 'number') {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(trustProfile.driver_reliability_rate)));
}

function getCancellationCount(trustProfile?: TrustProfile | null) {
  return Math.max(0, trustProfile?.driver_cancelled_trips_count ?? 0);
}

function getTier(input: {
  completedDrives: number;
  emailVerified: boolean;
  reliabilityRate: number | null;
  copy: (typeof COPY)[Lang];
}): { label: string; tone: TrustTone } {
  if (input.reliabilityRate !== null && input.reliabilityRate < 70) {
    return { label: input.copy.rebuilding, tone: 'watch' };
  }

  if (input.completedDrives === 0) {
    return {
      label: input.emailVerified ? input.copy.verifiedNew : input.copy.newDriver,
      tone: input.emailVerified ? 'active' : 'new',
    };
  }

  if (input.completedDrives < 3) {
    return { label: input.copy.gettingStarted, tone: 'active' };
  }

  if (input.completedDrives < 8) {
    return {
      label: input.emailVerified ? input.copy.activeVerified : input.copy.activeDriver,
      tone: 'strong',
    };
  }

  return {
    label: input.emailVerified ? input.copy.experiencedVerified : input.copy.experienced,
    tone: 'strong',
  };
}

function getReliabilityText(input: {
  reliabilityRate: number | null;
  cancellations: number;
  completedDrives: number;
  copy: (typeof COPY)[Lang];
}) {
  if (input.reliabilityRate === null) {
    return input.copy.noHistory;
  }

  if (input.cancellations === 0 && input.completedDrives > 0) {
    return input.copy.cleanRecord;
  }

  return input.copy.followThrough(input.reliabilityRate);
}

function TrustAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name} className="driver-trust-passport__avatar" />
    );
  }

  return (
    <span className="driver-trust-passport__avatar driver-trust-passport__avatar--fallback">
      {getInitial(name)}
    </span>
  );
}

function TrustBadgeList({
  badges,
  copy,
  compact = false,
}: {
  badges: TrustBadge[];
  copy: (typeof COPY)[Lang];
  compact?: boolean;
}) {
  if (badges.length === 0) {
    if (compact) return null;
    return <p className="driver-trust-passport__empty">{copy.noBadges}</p>;
  }

  return (
    <div className="driver-trust-passport__badges" aria-label={copy.badges}>
      {badges.map((badge) => (
        <span key={badge.key}>
          {copy.badgeCopy[badge.key] ?? badge.label}
        </span>
      ))}
    </div>
  );
}

export function DriverTrustPassport({
  driverName,
  avatarUrl,
  ratingAvg,
  ratingCount,
  completedDrives,
  trustProfile = null,
  responseSpeedLabel = null,
  variant = 'compact',
  className = '',
}: DriverTrustPassportProps) {
  const { lang } = useTranslation();
  const activeLang = getSafeLang(lang);
  const copy = COPY[activeLang];
  const safeName = driverName?.trim() || copy.fallbackDriver;
  const safeCompletedDrives = Math.max(0, completedDrives ?? trustProfile?.driver_trips_count ?? 0);
  const safeRatingAvg = ratingAvg ?? 0;
  const safeRatingCount = Math.max(0, ratingCount ?? 0);
  const hasRatings = safeRatingCount > 0;
  const reliabilityRate = getReliabilityRate(trustProfile);
  const cancellations = getCancellationCount(trustProfile);
  const reliabilityText = getReliabilityText({
    reliabilityRate,
    cancellations,
    completedDrives: safeCompletedDrives,
    copy,
  });
  const tier = getTier({
    completedDrives: safeCompletedDrives,
    emailVerified: trustProfile?.email_verified === true,
    reliabilityRate,
    copy,
  });
  const badges = trustProfile?.badges ?? [];
  const classes = [
    'driver-trust-passport',
    `driver-trust-passport--${variant}`,
    `driver-trust-passport--tone-${tier.tone}`,
    className,
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (variant !== 'full' || !trustProfile) return;
    void trackClientEvent('trust_badge_seen', {
      trust_score: trustProfile.trust_score,
      badge_count: trustProfile.badges.length,
      driver_reliability_rate: trustProfile.driver_reliability_rate ?? null,
      driver_cancelled_trips_count: trustProfile.driver_cancelled_trips_count ?? 0,
    });
  }, [variant, trustProfile]);

  if (variant === 'compact') {
    return (
      <span className={classes} aria-label={`${copy.compactLabel}: ${tier.label}`}>
        <span className="driver-trust-passport__compact-tier">{tier.label}</span>
        {hasRatings ? (
          <span className="driver-trust-passport__compact-stat">
            {formatAverage(safeRatingAvg)} ({safeRatingCount})
          </span>
        ) : null}
        {safeCompletedDrives > 0 ? (
          <span className="driver-trust-passport__compact-stat">
            {safeCompletedDrives} {copy.asDriver}
          </span>
        ) : null}
        {reliabilityRate !== null ? (
          <span className="driver-trust-passport__compact-stat">
            {reliabilityRate}%
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <section className={classes} aria-label={copy.passport}>
      <div className="driver-trust-passport__identity">
        <TrustAvatar name={safeName} avatarUrl={avatarUrl} />
        <div className="driver-trust-passport__identity-text">
          <p>{copy.passport}</p>
          <h2 dir="auto">{safeName}</h2>
          <span className="driver-trust-passport__tier">{tier.label}</span>
        </div>
        {trustProfile ? (
          <div className="driver-trust-passport__score" aria-label={`${copy.score} ${trustProfile.trust_score}`}>
            <span>{copy.score}</span>
            <strong>{trustProfile.trust_score}</strong>
          </div>
        ) : null}
      </div>

      <div className="driver-trust-passport__metrics">
        <div className="driver-trust-passport__metric">
          <span>{copy.rating}</span>
          <strong>{hasRatings ? formatAverage(safeRatingAvg) : copy.new}</strong>
          <small>{hasRatings ? copy.ratings(safeRatingCount) : copy.noRatings}</small>
        </div>
        <div className="driver-trust-passport__metric">
          <span>{copy.completed}</span>
          <strong>{safeCompletedDrives}</strong>
          <small>{copy.asDriver}</small>
        </div>
        <div className="driver-trust-passport__metric driver-trust-passport__metric--wide">
          <span>{copy.reliability}</span>
          <strong>{reliabilityText}</strong>
          <small>{reliabilityRate !== null ? copy.cancellations(cancellations) : copy.noHistory}</small>
        </div>
        {responseSpeedLabel ? (
          <div className="driver-trust-passport__metric">
            <span>{copy.response}</span>
            <strong>{responseSpeedLabel}</strong>
          </div>
        ) : null}
      </div>

      <TrustBadgeList badges={badges} copy={copy} />
    </section>
  );
}
