import { createHash } from 'crypto';
import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import { isCommunityMember } from '@/lib/auth/permissions';
import { isAllowedCommunityId } from '@/lib/community/allowed';
import type { RouteAlertsRow, RouteRequestsRow, TripsRow } from '@/lib/types';
import { trackEvent } from './analytics';
import { createNotification } from './notification';
import { hasDirectBlockRelationship } from './safety';
import { normalizeLocationName, calculateLocationMatchScore } from '@/lib/utils/locations';
import { AppError, UnauthorizedError, NotFoundError } from '@/lib/utils/errors';
import { logInfo, logWarn } from '@/lib/observability/logger';

type FirestoreDb = FirebaseFirestore.Firestore;

const MAX_ROUTE_TEXT_LENGTH = 120;

/**
 * Threshold for alert matching. Requires BOTH origin AND destination to have a
 * meaningful match (score 75 = both sides nearby; 90/100 = one or both exact).
 * A score of 60 means only ONE side matches — not acceptable for an alert.
 */
const ROUTE_ALERT_MATCH_THRESHOLD = 75;

/**
 * Minimum score for a trip to be considered a valid fulfillment of a route request.
 * Both origin and destination must match at least at the "nearby" level.
 */
const ROUTE_FULFILLMENT_MIN_SCORE = 75;

export type RouteDemandInput = {
  communityId: string;
  originName: string;
  destinationName: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
};

export type RouteRequestOpportunity = RouteRequestsRow & {
  similar_requests_count: number;
  match_score: number;
};

function normalizeRouteText(value: string | null | undefined, label: string) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length > MAX_ROUTE_TEXT_LENGTH) {
    throw new AppError(`${label} is too long`, 'BAD_REQUEST');
  }
  return trimmed;
}

function ensureRouteHasValue(originName: string, destinationName: string) {
  if (!originName && !destinationName) {
    throw new AppError('Origin or destination is required', 'BAD_REQUEST');
  }
}

function routeKey(communityId: string, userId: string, originName: string, destinationName: string) {
  const normalizedOrigin = normalizeLocationName(originName);
  const normalizedDestination = normalizeLocationName(destinationName);
  const digest = createHash('sha1')
    .update(`${communityId}:${userId}:${normalizedOrigin}:${normalizedDestination}`)
    .digest('hex')
    .slice(0, 24);

  return {
    id: `${communityId}_${userId}_${digest}`,
    normalizedOrigin,
    normalizedDestination,
  };
}

function routeGroupKey(originName: string, destinationName: string) {
  return `${normalizeLocationName(originName)}|||${normalizeLocationName(destinationName)}`;
}

function routeMatchScore(input: {
  candidateOrigin: string;
  candidateDestination: string;
  targetOrigin: string;
  targetDestination: string;
}) {
  return calculateLocationMatchScore(
    normalizeLocationName(input.candidateOrigin),
    normalizeLocationName(input.candidateDestination),
    normalizeLocationName(input.targetOrigin),
    normalizeLocationName(input.targetDestination)
  );
}

async function requireDemandAccess(communityId: string, db: FirestoreDb) {
  if (!isAllowedCommunityId(communityId)) {
    throw new NotFoundError('Community not found');
  }

  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const member = await isCommunityMember(user.id, communityId, db);
  if (!member) {
    throw new UnauthorizedError('You must belong to this community');
  }

  return user;
}

export async function createRouteRequest(input: RouteDemandInput) {
  const db = getAdminFirestore();
  const user = await requireDemandAccess(input.communityId, db);
  const originName = normalizeRouteText(input.originName, 'Origin');
  const destinationName = normalizeRouteText(input.destinationName, 'Destination');
  ensureRouteHasValue(originName, destinationName);

  const now = new Date().toISOString();
  const { id, normalizedOrigin, normalizedDestination } = routeKey(
    input.communityId,
    user.id,
    originName,
    destinationName
  );
  const ref = db.collection('route_requests').doc(id);
  const existing = await ref.get();

  // Each document represents exactly ONE user's demand signal for a route.
  // The doc ID already encodes communityId + userId + route, so one user can
  // never produce more than one active document per route. We never increment
  // request_count — the demand count is the number of distinct user documents.
  await ref.set(
    {
      community_id: input.communityId,
      user_id: user.id,
      origin_name: originName,
      destination_name: destinationName,
      origin_lat: input.originLat ?? null,
      origin_lng: input.originLng ?? null,
      destination_lat: input.destinationLat ?? null,
      destination_lng: input.destinationLng ?? null,
      normalized_origin: normalizedOrigin,
      normalized_destination: normalizedDestination,
      request_count: 1,
      active: true,
      created_at: existing.data()?.created_at ?? now,
      updated_at: now,
      fulfilled_by_trip_id: existing.data()?.fulfilled_by_trip_id ?? null,
      fulfilled_at: existing.data()?.fulfilled_at ?? null,
    },
    { merge: true }
  );

  await trackEvent('route_requested', {
    userId: user.id,
    communityId: input.communityId,
    payload: {
      route_request_id: id,
      origin: originName,
      destination: destinationName,
    },
  });

  return { id };
}

export async function upsertRouteAlert(input: RouteDemandInput) {
  const db = getAdminFirestore();
  const user = await requireDemandAccess(input.communityId, db);
  const originName = normalizeRouteText(input.originName, 'Origin');
  const destinationName = normalizeRouteText(input.destinationName, 'Destination');
  ensureRouteHasValue(originName, destinationName);

  const now = new Date().toISOString();
  const { id, normalizedOrigin, normalizedDestination } = routeKey(
    input.communityId,
    user.id,
    originName,
    destinationName
  );
  const ref = db.collection('route_alerts').doc(id);
  const existing = await ref.get();

  await ref.set(
    {
      community_id: input.communityId,
      user_id: user.id,
      origin_name: originName,
      destination_name: destinationName,
      origin_lat: input.originLat ?? null,
      origin_lng: input.originLng ?? null,
      destination_lat: input.destinationLat ?? null,
      destination_lng: input.destinationLng ?? null,
      normalized_origin: normalizedOrigin,
      normalized_destination: normalizedDestination,
      active: true,
      created_at: existing.data()?.created_at ?? now,
      updated_at: now,
      last_notified_at: existing.data()?.last_notified_at ?? null,
      last_matched_trip_id: existing.data()?.last_matched_trip_id ?? null,
    },
    { merge: true }
  );

  await trackEvent(existing.exists ? 'route_alert_updated' : 'route_alert_created', {
    userId: user.id,
    communityId: input.communityId,
    payload: {
      route_alert_id: id,
      origin: originName,
      destination: destinationName,
    },
  });

  return { id };
}

export async function createRouteDemandSignal(input: RouteDemandInput) {
  const [request, alert] = await Promise.all([
    createRouteRequest(input),
    upsertRouteAlert(input),
  ]);

  return { requestId: request.id, alertId: alert.id };
}

export async function markRouteRequestFulfilled(input: {
  routeRequestId?: string | null;
  communityId: string;
  tripId: string;
  /** The trip's origin — must fuzzy-match the route request's origin. */
  tripOriginName: string;
  /** The trip's destination — must fuzzy-match the route request's destination. */
  tripDestinationName: string;
  driverId: string;
  db?: FirestoreDb;
}) {
  if (!input.routeRequestId) return;

  const db = input.db ?? getAdminFirestore();
  const ref = db.collection('route_requests').doc(input.routeRequestId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) return;

    const data = doc.data()!;

    // Guard 1: community must match — prevents cross-community fulfillment.
    if (data.community_id !== input.communityId) return;

    // Guard 2: request must still be active — prevents double-fulfillment.
    if (data.active !== true) return;

    // Guard 3: trip route must actually match the requested route.
    // A driver cannot "fulfill" a Tel Aviv→Haifa request by posting a Jerusalem trip.
    const matchScore = calculateLocationMatchScore(
      normalizeLocationName(input.tripOriginName),
      normalizeLocationName(input.tripDestinationName),
      data.normalized_origin as string,
      data.normalized_destination as string,
    );

    if (matchScore < ROUTE_FULFILLMENT_MIN_SCORE) {
      logWarn('route_request.fulfillment_route_mismatch', {
        requestId: input.routeRequestId,
        tripId: input.tripId,
        matchScore,
        tripOrigin: input.tripOriginName,
        tripDestination: input.tripDestinationName,
        requestOrigin: data.normalized_origin,
        requestDestination: data.normalized_destination,
      });
      return; // Silently skip — trip does not serve this route.
    }

    tx.set(
      ref,
      {
        active: false,
        fulfilled_by_trip_id: input.tripId,
        fulfilled_at: new Date().toISOString(),
        fulfilled_by_user_id: input.driverId,
      },
      { merge: true }
    );
  });
}

export async function getRouteRequestsForDriver(input: {
  communityId: string;
  originName?: string | null;
  destinationName?: string | null;
  preferredRequestId?: string | null;
  limit?: number;
}): Promise<RouteRequestOpportunity[]> {
  const db = getAdminFirestore();
  await requireDemandAccess(input.communityId, db);

  // Filter active=true in the query — avoids pulling fulfilled/cancelled requests
  // into memory and eliminates the need for an arbitrary JS-side limit.
  const snap = await db
    .collection('route_requests')
    .where('community_id', '==', input.communityId)
    .where('active', '==', true)
    .get();

  if (snap.empty) return [];

  const seedOrigin = input.originName?.trim() ?? '';
  const seedDestination = input.destinationName?.trim() ?? '';
  const now = Date.now();
  const grouped = new Map<string, RouteRequestOpportunity>();

  snap.docs.forEach((doc) => {
    const data = doc.data() as Omit<RouteRequestsRow, 'id'>;

    const request: RouteRequestsRow = {
      id: doc.id,
      ...data,
    };
    const key = routeGroupKey(request.origin_name, request.destination_name);
    const ageHours = Math.max(0, (now - new Date(request.created_at).getTime()) / 36e5);
    const recencyScore = Math.max(0, 25 - ageHours / 12);
    const proximityScore =
      seedOrigin || seedDestination
        ? routeMatchScore({
            candidateOrigin: request.origin_name,
            candidateDestination: request.destination_name,
            targetOrigin: seedOrigin,
            targetDestination: seedDestination,
          })
        : 0;
    const preferredBoost = input.preferredRequestId === request.id ? 500 : 0;
    // similar_requests_count counts DISTINCT USERS (1 doc = 1 user), never request_count.
    const matchScore = preferredBoost + proximityScore + recencyScore;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...request,
        similar_requests_count: 1,
        match_score: matchScore,
      });
      return;
    }

    grouped.set(key, {
      ...(new Date(request.created_at).getTime() > new Date(existing.created_at).getTime()
        ? request
        : existing),
      // Each doc = 1 distinct user — increment by 1, not by request_count.
      similar_requests_count: existing.similar_requests_count + 1,
      match_score: Math.max(existing.match_score, matchScore),
    });
  });

  return Array.from(grouped.values())
    .sort((left, right) => {
      if (right.match_score !== left.match_score) return right.match_score - left.match_score;
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    })
    .slice(0, input.limit ?? 5);
}

export async function notifyRouteAlertsForTrip(input: {
  tripId: string;
  trip: Pick<
    TripsRow,
    'community_id' | 'driver_id' | 'origin_name' | 'destination_name' | 'departure_time'
  >;
  db?: FirestoreDb;
}) {
  const db = input.db ?? getAdminFirestore();
  const alertsSnap = await db
    .collection('route_alerts')
    .where('community_id', '==', input.trip.community_id)
    .where('active', '==', true)
    .get();

  if (alertsSnap.empty) return;

  const matchesByUser = new Map<
    string,
    {
      alertIds: string[];
      bestScore: number;
      originName: string;
      destinationName: string;
    }
  >();

  for (const alertDoc of alertsSnap.docs) {
    const alert = {
      id: alertDoc.id,
      ...(alertDoc.data() as Omit<RouteAlertsRow, 'id'>),
    } as RouteAlertsRow;

    if (alert.user_id === input.trip.driver_id) continue;
    if (alert.last_matched_trip_id === input.tripId) continue;

    const score = routeMatchScore({
      candidateOrigin: input.trip.origin_name,
      candidateDestination: input.trip.destination_name,
      targetOrigin: alert.origin_name,
      targetDestination: alert.destination_name,
    });

    if (score < ROUTE_ALERT_MATCH_THRESHOLD) continue;

    if (await hasDirectBlockRelationship(alert.user_id, input.trip.driver_id, db)) {
      continue;
    }

    const existing = matchesByUser.get(alert.user_id);
    if (!existing) {
      matchesByUser.set(alert.user_id, {
        alertIds: [alert.id],
        bestScore: score,
        originName: alert.origin_name,
        destinationName: alert.destination_name,
      });
      continue;
    }

    existing.alertIds.push(alert.id);
    if (score > existing.bestScore) {
      existing.bestScore = score;
      existing.originName = alert.origin_name;
      existing.destinationName = alert.destination_name;
    }
  }

  if (matchesByUser.size === 0) return;

  const notifiedAt = new Date().toISOString();
  await Promise.all(
    Array.from(matchesByUser.entries()).map(async ([userId, match]) => {
      const title = 'New ride for your route';
      const body =
        match.alertIds.length > 1
          ? `A new trip matches ${match.alertIds.length} of your saved route alerts: ${input.trip.origin_name} to ${input.trip.destination_name}.`
          : `A new trip matches your saved route: ${match.originName} to ${match.destinationName}.`;

      const notificationId = await createNotification({
        userId,
        type: 'route_alert',
        title,
        body,
        linkUrl: `/trips/${input.tripId}`,
        email: true,
        dedupeKey: `route_alert:${input.tripId}:${userId}`,
      });

      const batch = db.batch();
      match.alertIds.forEach((alertId) => {
        batch.set(
          db.collection('route_alerts').doc(alertId),
          {
            last_notified_at: notifiedAt,
            last_matched_trip_id: input.tripId,
            updated_at: notifiedAt,
          },
          { merge: true }
        );
      });
      await batch.commit();

      await trackEvent('route_alert_matched', {
        userId,
        communityId: input.trip.community_id,
        payload: {
          trip_id: input.tripId,
          notification_id: notificationId,
          alert_count: match.alertIds.length,
          best_score: match.bestScore,
        },
      });
    })
  );

  logInfo('route_alerts.notified', {
    tripId: input.tripId,
    communityId: input.trip.community_id,
    notifiedUsers: matchesByUser.size,
  });
}
