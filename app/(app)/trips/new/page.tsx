import Link from 'next/link';
import { redirect } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { getMyCommunities } from '@/lib/services/community';
import CommunityBadge from '@/components/CommunityBadge';
import { CommunityIdentityCard } from '@/components/CommunityIdentityCard';
import CreateTripForm from './CreateTripForm';
import { getServerI18n } from '@/lib/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getSavedPlaces } from '@/lib/services/savedPlaces';
import { getActiveTripCountsForCommunities, getMyTripsAsDriver } from '@/lib/services/trip';
import { getMeetingPointsForCommunity } from '@/lib/services/meeting-points';
import { getRouteRequestsForDriver } from '@/lib/services/activation';
import RouteDemandPanel from './RouteDemandPanel';

function buildNewTripHref(input: {
  communityId: string;
  originName?: string;
  destinationName?: string;
}) {
  const params = new URLSearchParams();
  params.set('community_id', input.communityId);
  if (input.originName) params.set('originName', input.originName);
  if (input.destinationName) params.set('destinationName', input.destinationName);
  return `/trips/new?${params.toString()}`;
}

const COPY = {
  en: {
    eyebrow: 'Offer a ride',
    chooseCommunity: 'Choose a community',
    chooseCommunityDesc: 'New trips belong to exactly one community. Pick where this ride should live before you publish it.',
    backToRides: 'Back to rides',
    title: 'Offer a ride',
    heroDesc: (name: string) => `Keep it simple: route, time, seats, and optional price. This trip will only appear inside ${name}.`,
    ridersSee: 'What riders will see',
    route: 'Route',
    departure: 'Departure time',
    seatsPrice: 'Seats and price',
  },
  ar: {
    eyebrow: 'اعرض رحلة',
    chooseCommunity: 'اختر مجتمعًا',
    chooseCommunityDesc: 'كل رحلة جديدة تنتمي إلى مجتمع واحد فقط. اختر أين ستظهر هذه الرحلة قبل نشرها.',
    backToRides: 'العودة إلى الرحلات',
    title: 'اعرض رحلة',
    heroDesc: (name: string) => `الأمر بسيط: المسار والوقت والمقاعد والسعر الاختياري. ستظهر هذه الرحلة داخل ${name} فقط.`,
    ridersSee: 'ما الذي سيراه الركاب',
    route: 'المسار',
    departure: 'وقت الانطلاق',
    seatsPrice: 'المقاعد والسعر',
  },
  he: {
    eyebrow: 'הציעו נסיעה',
    chooseCommunity: 'בחרו קהילה',
    chooseCommunityDesc: 'כל נסיעה חדשה שייכת לקהילה אחת בלבד. בחרו איפה הנסיעה הזו צריכה להופיע לפני הפרסום.',
    backToRides: 'חזרה לנסיעות',
    title: 'הציעו נסיעה',
    heroDesc: (name: string) => `שמרו על זה פשוט: מסלול, שעה, מושבים ומחיר אופציונלי. הנסיעה הזו תופיע רק בתוך ${name}.`,
    ridersSee: 'מה הנוסעים יראו',
    route: 'מסלול',
    departure: 'שעת יציאה',
    seatsPrice: 'מושבים ומחיר',
  },
} as const;

function formatActiveRideCount(lang: keyof typeof COPY, count: number) {
  if (lang === 'ar') return `${count} رحلات نشطة`;
  if (lang === 'he') return `${count} נסיעות פעילות`;
  return `${count} active ${count === 1 ? 'ride' : 'rides'}`;
}

export default async function NewTripPage({
  searchParams,
}: {
  searchParams?: Promise<{
    community_id?: string;
    originName?: string;
    destinationName?: string;
    request_id?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { lang, t } = await getServerI18n();
  const copy = COPY[lang];

  const user = await getCurrentUser();
  const [memberships, savedPlaces, myDriverTrips] = await Promise.all([
    getMyCommunities(),
    user ? getSavedPlaces(user.id) : Promise.resolve([]),
    user ? getMyTripsAsDriver() : Promise.resolve([]),
  ]);

  // Build deduplicated recent routes from driver trip history (last 5 unique routes)
  const seenRoutes = new Set<string>();
  const recentRoutes: { origin: string; destination: string }[] = [];
  for (const trip of myDriverTrips) {
    const key = `${trip.origin_name}|||${trip.destination_name}`;
    if (!seenRoutes.has(key)) {
      seenRoutes.add(key);
      recentRoutes.push({ origin: trip.origin_name, destination: trip.destination_name });
    }
    if (recentRoutes.length >= 5) break;
  }
  const joinedCommunities = memberships.map((membership) => ({
    ...membership.community,
    role: membership.role === 'admin' ? 'admin' : 'member',
  }));

  if (joinedCommunities.length === 0) {
    redirect('/community');
  }

  const activeTripCounts = await getActiveTripCountsForCommunities(
    joinedCommunities.map((community) => community.id)
  );

  const requestedCommunityId = resolvedSearchParams?.community_id;
  const selectedCommunity =
    joinedCommunities.find((community) => community.id === requestedCommunityId) ??
    (joinedCommunities.length === 1 ? joinedCommunities[0] : null);

  if (!selectedCommunity) {
    return (
      <div className="journey-workspace space-y-5 py-4">
        <section className="journey-hero animate-fade-in-up">
          <div className="journey-hero__content">
            <div className="space-y-3">
              <div className="journey-hero__brand">
                <BrandLogo lang={lang} size="footer" priority />
              </div>
              <p className="journey-hero__eyebrow">{copy.eyebrow}</p>
              <h1 className="journey-hero__title">{copy.chooseCommunity}</h1>
              <p className="journey-hero__text">{copy.chooseCommunityDesc}</p>
            </div>
            <div className="journey-hero__rail">
              <span>{copy.route}</span>
              <span>{copy.departure}</span>
              <span>{copy.seatsPrice}</span>
            </div>
          </div>
        </section>

        <div className="journey-grid">
          <section className="space-y-3 animate-fade-in-up stagger-1">
            {joinedCommunities.map((community) => (
              <CommunityIdentityCard
                key={community.id}
                community={community}
                href={buildNewTripHref({
                  communityId: community.id,
                  originName: resolvedSearchParams?.originName,
                  destinationName: resolvedSearchParams?.destinationName,
                })}
                className="community-identity-card--choice"
                roleLabel={community.role}
                typeLabel={community.type === 'public' ? t('public_label') : t('verified_label')}
                activeRideCount={activeTripCounts.get(community.id) ?? 0}
                activeRideCountLabel={formatActiveRideCount(
                  lang,
                  activeTripCounts.get(community.id) ?? 0
                )}
              />
            ))}
          </section>

          <aside className="journey-panel animate-fade-in-up stagger-2">
            <p className="mb-2 text-xs font-black text-[var(--primary)]">{copy.ridersSee}</p>
            <div className="journey-pill-grid">
              <div className="flex items-center px-3">{copy.route}</div>
              <div className="flex items-center px-3">{copy.departure}</div>
              <div className="flex items-center px-3">{copy.seatsPrice}</div>
            </div>
            <Link
              href="/app"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-[var(--muted-strong)] hover:text-[var(--primary)]"
            >
              {copy.backToRides}
            </Link>
          </aside>
        </div>
      </div>
    );
  }

  const backHref = `/app?community_id=${encodeURIComponent(selectedCommunity.id)}`;
  const [routeRequests, meetingPoints] = await Promise.all([
    getRouteRequestsForDriver({
      communityId: selectedCommunity.id,
      originName: resolvedSearchParams?.originName,
      destinationName: resolvedSearchParams?.destinationName,
      preferredRequestId: resolvedSearchParams?.request_id,
      limit: 4,
    }),
    getMeetingPointsForCommunity(selectedCommunity.id),
  ]);

  return (
    <div className="journey-workspace space-y-5 py-4">
      <section className="journey-hero animate-fade-in-up">
        <div className="journey-hero__content">
          <div className="space-y-3">
            <div className="journey-hero__brand">
              <BrandLogo lang={lang} size="footer" priority />
            </div>
            <p className="journey-hero__eyebrow">{copy.eyebrow}</p>
            <CommunityBadge name={selectedCommunity.name} type={selectedCommunity.type} />
            <h1 className="journey-hero__title">{copy.title}</h1>
            <p className="journey-hero__text">{copy.heroDesc(selectedCommunity.name)}</p>
          </div>
          <div className="journey-hero__rail">
            <span>{copy.route}</span>
            <span>{copy.departure}</span>
            <span>{copy.seatsPrice}</span>
          </div>
        </div>
      </section>

      <div className="journey-grid">
        <main className="space-y-5">
          <RouteDemandPanel
            communityId={selectedCommunity.id}
            requests={routeRequests}
            lang={lang}
          />
          <CreateTripForm
            communityId={selectedCommunity.id}
            communityName={selectedCommunity.name}
            communityType={selectedCommunity.type}
            initialOriginName={resolvedSearchParams?.originName ?? ''}
            initialDestinationName={resolvedSearchParams?.destinationName ?? ''}
            backHref={backHref}
            savedPlaces={savedPlaces}
            recentRoutes={recentRoutes}
            meetingPoints={meetingPoints}
            routeRequestId={resolvedSearchParams?.request_id ?? null}
          />
        </main>

        <aside className="journey-panel order-first space-y-3 md:sticky md:top-20 md:order-none">
          <p className="text-xs font-black text-[var(--primary)]">{copy.ridersSee}</p>
          <div className="journey-pill-grid">
            <div className="flex items-center px-3">{copy.route}</div>
            <div className="flex items-center px-3">{copy.departure}</div>
            <div className="flex items-center px-3">{copy.seatsPrice}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
