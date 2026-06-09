import { notFound } from 'next/navigation';
import { after } from 'next/server';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getTripById } from '@/lib/services/trip';
import { getBookingsForTrip } from '@/lib/services/booking';
import { trackEvent } from '@/lib/services/analytics';
import { canViewTripRoster, isCommunityMember } from '@/lib/auth/permissions';
import TripDetailClient from './TripDetailClient';
import { getTripCommunicationAccess } from '@/lib/services/message';
import { getServerI18n } from '@/lib/i18n/server';
import { getUserProfile } from '@/lib/services/user';
import { hasTripDeparted } from '@/lib/trips/coordination';

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  // i18n + auth don't depend on each other — resolve them together.
  const [{ t }, user] = await Promise.all([getServerI18n(), getCurrentUser()]);

  // Kick off the (independent) profile fetch concurrently with the trip batch.
  const profilePromise = user
    ? getUserProfile(user.id).catch(() => null)
    : Promise.resolve(null);

  let trip;
  let bookings;
  let communicationAccess = {
    canView: false,
    canSendMessages: false,
    canSendCoordination: false,
    isRestricted: false,
  };
  try {
    // These three only need the trip id — fetch them in parallel, not in a chain.
    [trip, bookings, communicationAccess] = await Promise.all([
      getTripById(id),
      getBookingsForTrip(id),
      getTripCommunicationAccess(id),
    ]);
  } catch {
    notFound();
  }
  if (!trip) notFound();

  const currentUserProfile = await profilePromise;

  const userInCommunity = await isCommunityMember(user?.id, trip.community_id);
  if (!userInCommunity) {
    notFound();
  }

  const isDriver = user?.id === trip.driver_id;
  const isConfirmedPassenger = bookings.some(
    (booking) => booking.passenger_id === user?.id && booking.status === 'confirmed'
  );
  if (hasTripDeparted(trip) && !isDriver && !isConfirmedPassenger) {
    notFound();
  }

  let authorizedBookings: typeof bookings = [];
  if (canViewTripRoster(user?.id, trip, bookings ?? [])) {
    authorizedBookings = bookings;
  }

  // Analytics writes must never block the page render — flush them after the
  // response is sent. trackEvent already swallows its own errors.
  const trustScore = trip.driver_trust_profile?.trust_score;
  const driverId = trip.driver_id;
  const communityId = trip.community_id;
  const showDriverView = Boolean(trip.driver_trust_profile && user?.id && user.id !== driverId);
  after(() => {
    void trackEvent('trip_opened', {
      userId: user?.id,
      communityId,
      tripId: id,
      status: 'success',
      payload: { trip_id: id },
    });
    void trackEvent('trip_details_view', {
      userId: user?.id,
      communityId,
      tripId: id,
      status: 'success',
      metadata: { driver_id: driverId },
    });
    if (showDriverView && user?.id) {
      void trackEvent('driver_profile_viewed', {
        userId: user.id,
        payload: { trip_id: id, driver_id: driverId, trust_score: trustScore },
      });
    }
  });

  return (
    <div className="trip-detail-page py-4">
      <TripDetailClient
        trip={trip}
        bookings={authorizedBookings ?? []}
        currentUserId={user?.id ?? null}
        currentUserGender={currentUserProfile?.gender ?? null}
        communicationAccess={communicationAccess}
        wasJustCreated={resolvedSearchParams?.created === '1'}
      />
      <div className="mt-4">
        <Link
          href={`/app?community_id=${encodeURIComponent(trip.community_id)}`}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6" /></svg>
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
