import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import { isAllowedCommunityId } from '@/lib/community/allowed';
import type {
  BookingsRow,
  PreDepartureConfirmation,
  PreDepartureConfirmationState,
  TripsRow,
} from '@/lib/types';
import {
  ACTIVE_TRIP_STATUSES,
  getEffectiveTripStatus,
  isActiveTripStatus,
} from '@/lib/trips/lifecycle';
import {
  buildExpiredPreDepartureConfirmation,
  buildPendingPreDepartureConfirmation,
  buildPreDepartureConfirmationResponse,
  getPreDepartureWindow,
  type PreDepartureConfirmationResponse,
} from '@/lib/trips/pre-departure';
import { AppError, NotFoundError, UnauthorizedError } from '@/lib/utils/errors';
import { createNotification } from './notification';
import { trackEvent } from './analytics';

const CRON_SCAN_LIMIT = 100;

type ConfirmationActorRole = 'driver' | 'passenger';

type ConfirmationResult = {
  role: ConfirmationActorRole;
  confirmation: PreDepartureConfirmation;
  tripId: string;
  bookingIds: string[];
};

function isValidConfirmationResponse(
  response: PreDepartureConfirmationState
): response is PreDepartureConfirmationResponse {
  return response === 'confirmed' || response === 'not_confirmed';
}

function isPendingLikeConfirmation(
  confirmation?: PreDepartureConfirmation | null
) {
  return !confirmation || confirmation.state === 'pending';
}

function getTripRouteLabel(trip: Pick<TripsRow, 'origin_name' | 'destination_name'>) {
  return `${trip.origin_name} -> ${trip.destination_name}`;
}

async function notifyNotReadyResponse(
  result: ConfirmationResult,
  trip: TripsRow,
  actorDisplayName: string | null
) {
  if (result.confirmation.state !== 'not_confirmed') return;

  if (result.role === 'passenger') {
    await createNotification({
      userId: trip.driver_id,
      type: 'system',
      title: 'Passenger marked not ready',
      body: `${actorDisplayName ?? 'A passenger'} marked themselves not ready for ${getTripRouteLabel(trip)}.`,
      linkUrl: `/trips/${result.tripId}`,
      dedupeKey: `pre_departure_not_ready:${result.tripId}:${result.bookingIds.join('_')}`,
    });
    return;
  }

  const db = getAdminFirestore();
  const bookingsSnap = await db
    .collection('bookings')
    .where('trip_id', '==', result.tripId)
    .where('status', '==', 'confirmed')
    .get();

  await Promise.all(
    bookingsSnap.docs.map((doc) => {
      const booking = doc.data() as BookingsRow;
      return createNotification({
        userId: booking.passenger_id,
        type: 'system',
        title: 'Driver marked not ready',
        body: `The driver marked ${getTripRouteLabel(trip)} as not ready before departure. Open the trip to coordinate.`,
        linkUrl: `/trips/${result.tripId}`,
        email: true,
        dedupeKey: `pre_departure_driver_not_ready:${result.tripId}:${booking.passenger_id}`,
      });
    })
  );
}

export async function confirmPreDepartureReadiness(
  tripId: string,
  response: PreDepartureConfirmationState
): Promise<ConfirmationResult> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (!isValidConfirmationResponse(response)) {
    throw new AppError('Confirmation response is invalid', 'BAD_REQUEST');
  }

  const db = getAdminFirestore();
  const now = new Date();
  const nowIso = now.toISOString();
  let tripForNotification: TripsRow | null = null;

  const result = await db.runTransaction(async (tx) => {
    const tripRef = db.collection('trips').doc(tripId);
    const tripDoc = await tx.get(tripRef);
    if (!tripDoc.exists) throw new NotFoundError('Trip not found');

    const trip = { id: tripDoc.id, ...tripDoc.data() } as TripsRow;
    tripForNotification = trip;
    if (!isAllowedCommunityId(trip.community_id)) {
      throw new NotFoundError('Trip not found');
    }

    const effectiveStatus = getEffectiveTripStatus(trip);
    if (!isActiveTripStatus(effectiveStatus)) {
      throw new AppError(
        'Pre-departure confirmation is only available for active trips',
        'BAD_REQUEST'
      );
    }

    const window = getPreDepartureWindow(trip, now);
    if (window.isBeforeWindow) {
      throw new AppError(
        'Confirmation opens 30 minutes before departure',
        'BAD_REQUEST'
      );
    }

    if (!window.isOpen) {
      throw new AppError('Confirmation window expired', 'BAD_REQUEST');
    }

    const confirmation = buildPreDepartureConfirmationResponse(
      response,
      nowIso,
      trip.pre_departure_driver_confirmation
    );

    if (trip.driver_id === user.id) {
      tx.set(
        tripRef,
        {
          pre_departure_driver_confirmation: confirmation,
          pre_departure_expires_at: window.expiresAt.toISOString(),
        },
        { merge: true }
      );

      return {
        role: 'driver' as const,
        confirmation,
        tripId,
        bookingIds: [],
      };
    }

    const bookingSnap = await tx.get(
      db
        .collection('bookings')
        .where('trip_id', '==', tripId)
        .where('passenger_id', '==', user.id)
        .where('status', '==', 'confirmed')
    );

    if (bookingSnap.empty) {
      throw new UnauthorizedError('Only confirmed passengers can confirm readiness');
    }

    const bookingIds: string[] = [];
    let firstPassengerConfirmation: PreDepartureConfirmation | null = null;
    bookingSnap.docs.forEach((bookingDoc) => {
      const booking = bookingDoc.data() as BookingsRow;
      const passengerConfirmation = buildPreDepartureConfirmationResponse(
        response,
        nowIso,
        booking.pre_departure_confirmation
      );
      if (!firstPassengerConfirmation) {
        firstPassengerConfirmation = passengerConfirmation;
      }
      tx.set(
        bookingDoc.ref,
        { pre_departure_confirmation: passengerConfirmation },
        { merge: true }
      );
      bookingIds.push(bookingDoc.id);
    });

    return {
      role: 'passenger' as const,
      confirmation: firstPassengerConfirmation ?? confirmation,
      tripId,
      bookingIds,
    };
  });

  try {
    await trackEvent('pre_departure_confirmation_updated', {
      userId: user.id,
      payload: {
        trip_id: tripId,
        role: result.role,
        state: result.confirmation.state,
      },
    });
  } catch {
    // Analytics must never block readiness confirmation.
  }

  try {
    const profileDoc = await db.collection('users').doc(user.id).get();
    const displayName =
      typeof profileDoc.data()?.display_name === 'string'
        ? (profileDoc.data()?.display_name as string)
        : null;
    if (tripForNotification) {
      await notifyNotReadyResponse(result, tripForNotification, displayName);
    }
  } catch {
    // Notifications are best-effort; the confirmation state is already saved.
  }

  return result;
}

export async function sendPreDepartureConfirmationPrompts(params?: {
  now?: Date;
  limit?: number;
}) {
  const db = getAdminFirestore();
  const now = params?.now ?? new Date();
  const nowIso = now.toISOString();
  const limitCount = params?.limit ?? CRON_SCAN_LIMIT;
  const tripSnap = await db
    .collection('trips')
    .where('status', 'in', [...ACTIVE_TRIP_STATUSES])
    .limit(limitCount)
    .get();

  let tripsPrompted = 0;
  let notificationsQueued = 0;

  for (const tripDoc of tripSnap.docs) {
    const trip = { id: tripDoc.id, ...tripDoc.data() } as TripsRow;
    if (!isAllowedCommunityId(trip.community_id)) continue;
    if (trip.pre_departure_prompted_at) continue;

    const effectiveStatus = getEffectiveTripStatus(trip);
    if (!isActiveTripStatus(effectiveStatus)) continue;

    const window = getPreDepartureWindow(trip, now);
    if (!window.isOpen) continue;

    const bookingsSnap = await db
      .collection('bookings')
      .where('trip_id', '==', trip.id)
      .where('status', '==', 'confirmed')
      .get();

    const batch = db.batch();
    const pendingConfirmation = buildPendingPreDepartureConfirmation(nowIso);
    const tripPromptPayload: Partial<TripsRow> = {
      pre_departure_prompted_at: nowIso,
      pre_departure_expires_at: window.expiresAt.toISOString(),
    };
    if (isPendingLikeConfirmation(trip.pre_departure_driver_confirmation)) {
      tripPromptPayload.pre_departure_driver_confirmation = pendingConfirmation;
    }
    batch.set(
      tripDoc.ref,
      tripPromptPayload,
      { merge: true }
    );

    bookingsSnap.docs.forEach((bookingDoc) => {
      const booking = bookingDoc.data() as BookingsRow;
      if (!isPendingLikeConfirmation(booking.pre_departure_confirmation)) return;
      batch.set(
        bookingDoc.ref,
        { pre_departure_confirmation: pendingConfirmation },
        { merge: true }
      );
    });

    await batch.commit();
    tripsPrompted += 1;

    const notifyUserIds = new Set<string>();
    if (isPendingLikeConfirmation(trip.pre_departure_driver_confirmation)) {
      notifyUserIds.add(trip.driver_id);
    }
    bookingsSnap.docs.forEach((bookingDoc) => {
      const booking = bookingDoc.data() as BookingsRow;
      if (isPendingLikeConfirmation(booking.pre_departure_confirmation)) {
        notifyUserIds.add(booking.passenger_id);
      }
    });

    await Promise.all(
      Array.from(notifyUserIds).map(async (userId) => {
        await createNotification({
          userId,
          type: 'system',
          title: 'Confirm your ride',
          body: `${getTripRouteLabel(trip)} leaves in about ${window.minutesUntilDeparture} minutes. Tap once to confirm readiness.`,
          linkUrl: `/trips/${trip.id}`,
          email: true,
          dedupeKey: `pre_departure_prompt:${trip.id}:${userId}`,
        });
        notificationsQueued += 1;
      })
    );
  }

  return { tripsPrompted, notificationsQueued };
}

export async function expirePreDepartureConfirmations(params?: {
  now?: Date;
  limit?: number;
}) {
  const db = getAdminFirestore();
  const now = params?.now ?? new Date();
  const nowIso = now.toISOString();
  const limitCount = params?.limit ?? CRON_SCAN_LIMIT;
  const tripSnap = await db
    .collection('trips')
    .where('status', 'in', [...ACTIVE_TRIP_STATUSES])
    .limit(limitCount)
    .get();

  let tripsUpdated = 0;
  let bookingsUpdated = 0;

  for (const tripDoc of tripSnap.docs) {
    const trip = { id: tripDoc.id, ...tripDoc.data() } as TripsRow;
    if (!isAllowedCommunityId(trip.community_id)) continue;

    const window = getPreDepartureWindow(trip, now);
    if (!window.isExpired) continue;

    const bookingsSnap = await db
      .collection('bookings')
      .where('trip_id', '==', trip.id)
      .where('status', '==', 'confirmed')
      .get();

    const batch = db.batch();
    let hasTripUpdate = false;
    if (isPendingLikeConfirmation(trip.pre_departure_driver_confirmation)) {
      batch.set(
        tripDoc.ref,
        {
          pre_departure_driver_confirmation: buildExpiredPreDepartureConfirmation(
            nowIso,
            trip.pre_departure_driver_confirmation
          ),
          pre_departure_expires_at: window.expiresAt.toISOString(),
        },
        { merge: true }
      );
      hasTripUpdate = true;
    }

    let bookingUpdatesForTrip = 0;
    bookingsSnap.docs.forEach((bookingDoc) => {
      const booking = bookingDoc.data() as BookingsRow;
      if (!isPendingLikeConfirmation(booking.pre_departure_confirmation)) return;
      batch.set(
        bookingDoc.ref,
        {
          pre_departure_confirmation: buildExpiredPreDepartureConfirmation(
            nowIso,
            booking.pre_departure_confirmation
          ),
        },
        { merge: true }
      );
      bookingUpdatesForTrip += 1;
      bookingsUpdated += 1;
    });

    if (hasTripUpdate || bookingUpdatesForTrip > 0) {
      await batch.commit();
      if (hasTripUpdate) tripsUpdated += 1;
    }
  }

  return { tripsUpdated, bookingsUpdated };
}
