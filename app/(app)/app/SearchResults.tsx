import Link from 'next/link';
import { searchTrips } from '@/lib/services/matching';
import EmptyStateCard from '@/components/EmptyStateCard';
import TrackedLink from '@/components/TrackedLink';
import { TripCard } from './TripCard';
import {
  createRouteAlertAction,
  createRouteDemandSignalAction,
} from './actions';

type SearchResultsProps = {
  communityId: string;
  originQuery: string;
  destQuery: string;
  driverGenderFilter: string;
  routeDemandStatus?: string | null;
  lang: string;
  t: (key: string) => string;
};

const COPY = {
  en: {
    noTripsFound: 'No trips found for this route',
    noTripsDesc: 'Try another route or create one.',
    browseAll: 'Browse all rides',
    createExactRoute: 'Create your exact route',
    createInstead: 'Create this trip instead',
    noExactTrip: 'No exact trip for your route',
    showingSimilar: (count: number) => `Showing ${count} ${count === 1 ? 'trip' : 'trips'} with a similar origin or destination.`,
    similarRoutes: 'Similar routes',
    routeTrips: 'Trips on this route',
    routeCount: (count: number) => `${count} ${count === 1 ? 'trip' : 'trips'}`,
    exactRouteInstead: 'Create a trip for your exact route instead',
    wrongTime: 'Do not see the right time?',
    backToBrowse: 'Back to browse',
  },
  ar: {
    noTripsFound: 'لم نعثر على رحلات لهذا المسار',
    noTripsDesc: 'جرب مساراً آخر أو أنشئ رحلة.',
    browseAll: 'تصفح كل الرحلات',
    createExactRoute: 'أنشئ مسارك الدقيق',
    createInstead: 'أنشئ هذه الرحلة بدلًا من ذلك',
    noExactTrip: 'لا توجد رحلة مطابقة تمامًا لمسارك',
    showingSimilar: (count: number) => `نعرض ${count} ${count === 1 ? 'رحلة' : 'رحلات'} لها نقطة انطلاق أو وجهة مشابهة.`,
    similarRoutes: 'مسارات مشابهة',
    routeTrips: 'رحلات على هذا المسار',
    routeCount: (count: number) => `${count} ${count === 1 ? 'رحلة' : 'رحلات'}`,
    exactRouteInstead: 'أنشئ رحلة لمسارك الدقيق بدلًا من ذلك',
    wrongTime: 'لم تجد التوقيت المناسب؟',
    backToBrowse: 'العودة إلى التصفح',
  },
  he: {
    noTripsFound: 'לא נמצאו נסיעות למסלול הזה',
    noTripsDesc: 'נסו מסלול אחר או צרו אחד.',
    browseAll: 'עיינו בכל הנסיעות',
    createExactRoute: 'צרו את המסלול המדויק',
    createInstead: 'צרו את הנסיעה הזו במקום',
    noExactTrip: 'אין נסיעה מדויקת למסלול שלכם',
    showingSimilar: (count: number) => `מציגים ${count} ${count === 1 ? 'נסיעה' : 'נסיעות'} עם מוצא או יעד דומים.`,
    similarRoutes: 'מסלולים דומים',
    routeTrips: 'נסיעות במסלול הזה',
    routeCount: (count: number) => `${count} ${count === 1 ? 'נסיעה' : 'נסיעות'}`,
    exactRouteInstead: 'צרו נסיעה למסלול המדויק שלכם במקום',
    wrongTime: 'לא רואים את השעה הנכונה?',
    backToBrowse: 'חזרה לעיון',
  },
} as const;

// All activation copy is now in lib/i18n/dictionaries.ts (demand_* keys).
// Use the t() prop to render them so Arabic and Hebrew users see their language.

export default async function SearchResults({
  communityId,
  originQuery,
  destQuery,
  driverGenderFilter,
  routeDemandStatus,
  lang,
  t,
}: SearchResultsProps) {
  const result = await searchTrips({
    communityId,
    originName: originQuery,
    destinationName: destQuery,
    driverGenderFilter,
  });
  const copy = COPY[lang === 'ar' || lang === 'he' ? lang : 'en'];

  const exactMatches = result.exactMatches;
  const recommendations = result.recommendations;
  const totalResults = exactMatches.length + recommendations.length;
  const encodedOrigin = encodeURIComponent(originQuery);
  const encodedDestination = encodeURIComponent(destQuery);
  const createHref = `/trips/new?community_id=${encodeURIComponent(communityId)}&originName=${encodedOrigin}&destinationName=${encodedDestination}`;
  const browseParams = new URLSearchParams({ community_id: communityId });
  if (driverGenderFilter && driverGenderFilter !== 'any') {
    browseParams.set('driverGender', driverGenderFilter);
  }
  const browseHref = `/app?${browseParams.toString()}`;
  const demandSaved =
    routeDemandStatus === 'requested' || routeDemandStatus === 'alerted'
      ? {
          title:
            routeDemandStatus === 'requested'
              ? t('demand_saved_title')
              : t('demand_alert_saved_title'),
          description:
            routeDemandStatus === 'requested'
              ? t('demand_saved_desc')
              : t('demand_alert_saved_desc'),
        }
      : null;
  const routeDemandFields = (
    <>
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="originName" value={originQuery} />
      <input type="hidden" name="destinationName" value={destQuery} />
      <input type="hidden" name="driverGender" value={driverGenderFilter} />
    </>
  );
  const requestRouteAction = (
    <form action={createRouteDemandSignalAction}>
      {routeDemandFields}
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-strong)] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:opacity-90"
      >
        {t('demand_request_and_alert')}
      </button>
    </form>
  );
  const alertRouteAction = (
    <form action={createRouteAlertAction}>
      {routeDemandFields}
      <button
        type="submit"
        className="text-sm font-bold text-[var(--muted-strong)] hover:underline"
      >
        {t('demand_alert_only')}
      </button>
    </form>
  );

  if (totalResults === 0) {
    return (
      <div className="space-y-3 mt-2 animate-fade-in-up">
        {demandSaved && (
          <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--primary-light)] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--success)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{demandSaved.title}</p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{demandSaved.description}</p>
                {routeDemandStatus === 'requested' && (
                  <Link
                    href={createHref}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:opacity-90"
                  >
                    {copy.createInstead}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        <EmptyStateCard
          eyebrow={copy.routeTrips}
          title={copy.noTripsFound}
          description={`${copy.noTripsDesc} ${t('demand_note')}`}
          tone="amber"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
              <path d="M8.5 8.5 15 15" />
              <path d="M9 17.5h4" />
            </svg>
          }
          actions={
            <>
              {requestRouteAction}
              <TrackedLink
                href={createHref}
                trackEvent="create_trip_cta_clicked"
                trackPayload={{ context: 'no_results' }}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--muted-strong)] transition-colors hover:bg-[var(--primary-light)]"
              >
                {copy.createInstead}
              </TrackedLink>
              <Link
                href={browseHref}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--muted-strong)] transition-colors hover:bg-[var(--primary-light)]"
              >
                {copy.browseAll}
              </Link>
            </>
          }
        />
      </div>
    );
  }

  if (exactMatches.length === 0 && recommendations.length > 0) {
    return (
      <div className="space-y-5 animate-fade-in-up mt-2">
        <div className="soft-panel rounded-lg px-5 py-4 shadow-sm">
          {demandSaved && (
            <div className="mb-4 rounded-lg border border-[var(--border-soft)] bg-[var(--primary-light)] px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--success)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{demandSaved.title}</p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{demandSaved.description}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--muted-strong)] shadow-sm ring-1 ring-[var(--border-soft)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[var(--foreground)]">
                {copy.noExactTrip}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-strong)]">
                {copy.showingSimilar(recommendations.length)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <TrackedLink
              href={createHref}
              trackEvent="create_trip_cta_clicked"
              trackPayload={{ context: 'similar_results' }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--route-ink)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--primary-dark)] dark:bg-[var(--primary)] dark:text-[var(--route-ink)]"
            >
              {copy.createExactRoute}
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </TrackedLink>
            {alertRouteAction}
            <Link href={browseHref} className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--muted-strong)]">
              {copy.browseAll}
            </Link>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-black text-[var(--muted)]">
              {copy.similarRoutes}
            </span>
            <span className="section-rule h-px flex-1" />
            <span className="text-xs font-semibold text-[var(--muted)]">
              {copy.routeCount(recommendations.length)}
            </span>
          </div>
          <div className="space-y-3">
            {recommendations.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>

        <TrackedLink
          href={createHref}
          trackEvent="create_trip_cta_clicked"
          trackPayload={{ context: 'similar_results_bottom' }}
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--muted-strong)] transition-colors hover:bg-[var(--primary-light)]"
        >
          <span>+</span>
          <span>{copy.exactRouteInstead}</span>
        </TrackedLink>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up mt-2">
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-black text-[var(--muted)]">
              {copy.routeTrips}
            </span>
          <span className="section-rule h-px flex-1" />
            <span className="text-xs font-semibold text-[var(--muted)]">
              {copy.routeCount(exactMatches.length)}
            </span>
        </div>
        <div className="space-y-3">
          {exactMatches.map((trip) => (
            <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
          ))}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="space-y-3 border-t border-[var(--border-soft)] pt-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-black text-[var(--muted)]">
              {copy.similarRoutes}
            </span>
            <span className="section-rule h-px flex-1" />
            <span className="text-xs font-semibold text-[var(--muted)]">{copy.routeCount(recommendations.length)}</span>
          </div>
          <div className="space-y-3">
            {recommendations.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <div className="soft-panel rounded-lg px-4 py-4 shadow-sm">
        {demandSaved && (
          <div className="mb-3 rounded-lg border border-[var(--border-soft)] bg-[var(--primary-light)] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--success)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{demandSaved.title}</p>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{demandSaved.description}</p>
              </div>
            </div>
          </div>
        )}
        <p className="text-sm font-black text-[var(--foreground)]">
          {copy.wrongTime}
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <TrackedLink
            href={createHref}
            trackEvent="create_trip_cta_clicked"
            trackPayload={{ context: 'has_results_wrong_time' }}
            className="text-sm font-bold text-[var(--primary)] hover:underline"
          >
            {copy.createInstead}
          </TrackedLink>
          <Link href={browseHref} className="text-sm font-bold text-[var(--muted-strong)] hover:underline">
            {copy.backToBrowse}
          </Link>
          {alertRouteAction}
        </div>
      </div>
    </div>
  );
}
