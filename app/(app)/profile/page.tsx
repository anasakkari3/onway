import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyPastTrips, getUserStats } from '@/lib/services/trip';
import { getMyProfileFull } from '@/lib/services/user';
import { getUserTrustProfile } from '@/lib/services/trust';
import ProfileForm from './ProfileForm';
import ProfileCompletenessIndicator from './ProfileCompletenessIndicator';
import GuideHint from '@/components/GuideHint';
import { DriverTrustPassport } from '@/components/DriverTrustPassport';
import { formatLocalizedDate } from '@/lib/i18n/locale';
import { getServerI18n } from '@/lib/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getTripStatusPresentationWithTranslation } from '@/lib/trips/presentation';

const COPY = {
  en: {
    trustTitle: 'Trip history and trust',
    completedDrives: 'completed drives',
    completedJoined: 'completed rides joined',
    trustHelper: 'Received rating shows the feedback this person has received from other trip participants across completed trips. Completed drives count finished trips this person has driven. Profile setup is shown separately and does not change either number.',
    profileGuide: 'Keep these details simple and clear. Drivers and riders use them to recognize you and coordinate the ride.',
    tripHistoryEmptyIcon: 'clock',
  },
  ar: {
    trustTitle: 'سجل الرحلات والثقة',
    completedDrives: 'رحلات مكتملة كسائق',
    completedJoined: 'رحلات مكتملة انضممت إليها',
    trustHelper: 'يعرض التقييم المستلم الانطباع العام الذي تلقاه هذا الشخص من بقية المشاركين في الرحلات المكتملة. أما عدد الرحلات المكتملة كسائق فيمثل الرحلات التي قادها بالفعل. إعداد الملف الشخصي معروض بشكل منفصل ولا يغيّر أيًا من الرقمين.',
    profileGuide: 'اجعل بياناتك بسيطة وواضحة. السائقون والركاب يعتمدون عليها للتعرف عليك والتنسيق معك قبل الرحلة.',
    tripHistoryEmptyIcon: 'clock',
  },
  he: {
    trustTitle: 'היסטוריית נסיעות ואמון',
    completedDrives: 'נסיעות שהושלמו כנהג',
    completedJoined: 'נסיעות שהצטרפתם אליהן והושלמו',
    trustHelper: 'הדירוג שהתקבל מציג את המשוב הכללי שהאדם הזה קיבל ממשתתפים אחרים בנסיעות שהושלמו. מספר הנסיעות שהושלמו כנהג מייצג נסיעות שהוא נהג בהן בפועל. הגדרת הפרופיל מוצגת בנפרד ואינה משנה אף אחד מהמספרים.',
    profileGuide: 'שמרו על פרטים פשוטים וברורים. נהגים ונוסעים משתמשים בהם כדי לזהות ולתאם לפני הנסיעה.',
    tripHistoryEmptyIcon: 'clock',
  },
} as const;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { lang, t } = await getServerI18n();
  const copy = COPY[lang];
  const profile = await getMyProfileFull(user.id);

  let pastTrips: Awaited<ReturnType<typeof getMyPastTrips>> = [];
  let stats = { completedDrives: 0, completedJoins: 0 };
  let trustProfile: Awaited<ReturnType<typeof getUserTrustProfile>> | null = null;
  try {
    pastTrips = await getMyPastTrips();
  } catch {
    // non-critical
  }
  try {
    trustProfile = await getUserTrustProfile(user.id);
    stats = {
      completedDrives: trustProfile.driver_trips_count,
      completedJoins: trustProfile.rider_trips_count,
    };
  } catch {
    try {
      stats = await getUserStats(user.id);
    } catch {
      // non-critical
    }
  }

  const displayName = profile?.display_name?.trim() || t('profile');
  const profileInitial = displayName.trim().charAt(0).toUpperCase() || 'P';

  return (
    <div className="profile-page space-y-4 py-4">
      <section className="profile-hero animate-fade-in-up">
        <div className="profile-hero__main flex items-start gap-4">
          <div className="profile-avatar">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                width={68}
                height={68}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{profileInitial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[var(--primary)]">{t('profile')}</p>
            <h1 className="display-title mt-1 truncate text-3xl font-black text-[var(--foreground)]" dir="auto">
              {displayName}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--muted-strong)]" dir="auto">
              {profile?.city_or_area || copy.profileGuide}
            </p>
          </div>
        </div>

        <div className="profile-hero__actions space-y-3">
          <div className="profile-stat-grid">
            <div className="profile-stat-card">
              <strong className="tabular-nums">{stats.completedDrives}</strong>
              <span>{copy.completedDrives}</span>
            </div>
            <div className="profile-stat-card">
              <strong className="tabular-nums">{stats.completedJoins}</strong>
              <span>{copy.completedJoined}</span>
            </div>
          </div>
          <Link
            href="/profile/settings"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-sm font-black text-[var(--muted-strong)] transition-colors hover:bg-[var(--primary-light)] hover:text-[var(--route-ink)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {t('settings')}
          </Link>
        </div>
      </section>

      <GuideHint text={copy.profileGuide} dismissible />

      <section className="animate-fade-in-up stagger-1" aria-label={copy.trustTitle}>
        <DriverTrustPassport
          driverName={displayName}
          avatarUrl={profile?.avatar_url}
          ratingAvg={profile?.rating_avg}
          ratingCount={profile?.rating_count}
          completedDrives={stats.completedDrives}
          trustProfile={trustProfile}
          variant="full"
          className="driver-trust-passport--profile"
        />
        <p className="driver-trust-passport__helper">
          {copy.trustHelper}
        </p>
      </section>

      <div className="animate-fade-in-up stagger-2">
        <ProfileCompletenessIndicator
          hasDisplayName={!!profile?.display_name}
          hasPhone={!!profile?.phone}
          hasCityOrArea={!!profile?.city_or_area}
          hasAge={typeof profile?.age === 'number' && profile.age > 0}
          hasGender={!!profile?.gender}
          hasIsDriver={typeof profile?.is_driver === 'boolean'}
        />
      </div>

      <div className="profile-panel animate-fade-in-up stagger-3">
        <ProfileForm
          userId={user.id}
          initialDisplayName={profile?.display_name ?? ''}
          initialPhone={profile?.phone ?? ''}
          initialCityOrArea={profile?.city_or_area ?? ''}
          initialAge={profile?.age ?? null}
          initialGender={profile?.gender ?? ''}
          initialIsDriver={profile?.is_driver ?? null}
          initialGenderPreference={profile?.gender_preference ?? ''}
        />
      </div>

      <section className="animate-fade-in-up stagger-4">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('trip_history')}</h2>
        {pastTrips.length > 0 ? (
          <div className="profile-panel divide-y divide-slate-100 overflow-hidden p-0 dark:divide-slate-800">
            {pastTrips.map((trip) => (
              (() => {
                const statusUi = getTripStatusPresentationWithTranslation(trip, (key) => t(key));
                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${statusUi.cardClassName}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${statusUi.accentClassName}`}
                    >
                      {trip.status === 'completed' ? 'OK' : 'X'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100" dir="auto">
                        {trip.origin_name} → {trip.destination_name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatLocalizedDate(lang, trip.departure_time)}
                        </span>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-xs font-bold ${statusUi.chipClassName}`}
                        >
                          {statusUi.label}
                        </span>
                        {trip.driver && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">| {trip.driver.display_name ?? t('driver')}</span>
                        )}
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400 rtl:rotate-180">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                );
              })()
            ))}
          </div>
        ) : (
          <div className="profile-panel p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_past_trips')}</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t('past_trips_desc')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
