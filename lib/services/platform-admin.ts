import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getAdminAuth } from '@/lib/firebase/admin';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { UnauthorizedError } from '@/lib/utils/errors';
import type { TripStatus } from '@/lib/types';

/**
 * Platform-wide oversight queries for the super-admin dashboard.
 *
 * Every exported function re-checks super-admin access server-side, so these
 * are safe to call from a single gated page without trusting the caller.
 *
 * Read-volume note: KPI counts use Firestore aggregation (`.count()`) so they
 * do not download documents. List queries are capped with `limit()`.
 */

type Db = FirebaseFirestore.Firestore;

async function requireAccess(): Promise<void> {
  if (!(await isSuperAdmin())) {
    throw new UnauthorizedError('Super admin access required');
  }
}

async function safeCount(query: FirebaseFirestore.Query): Promise<number> {
  try {
    const snap = await query.count().get();
    return snap.data().count;
  } catch (err) {
    console.error('[platform-admin] count failed:', err);
    return 0;
  }
}

export type PlatformOverview = {
  users: { total: number };
  trips: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  bookings: { total: number; confirmed: number; cancelled: number };
  reports: { pending: number; total: number };
  communities: number;
};

export async function getPlatformOverview(): Promise<PlatformOverview | null> {
  try {
    await requireAccess();
    const db = getAdminFirestore();

    const trips = db.collection('trips');
    const bookings = db.collection('bookings');
    const reports = db.collection('reports');

    const [
      usersTotal,
      tripsTotal,
      tripsScheduled,
      tripsInProgress,
      tripsCompleted,
      tripsCancelled,
      bookingsTotal,
      bookingsConfirmed,
      bookingsCancelled,
      reportsPending,
      reportsTotal,
      communitiesTotal,
    ] = await Promise.all([
      safeCount(db.collection('users')),
      safeCount(trips),
      safeCount(trips.where('status', '==', 'scheduled')),
      safeCount(trips.where('status', '==', 'in_progress')),
      safeCount(trips.where('status', '==', 'completed')),
      safeCount(trips.where('status', '==', 'cancelled')),
      safeCount(bookings),
      safeCount(bookings.where('status', '==', 'confirmed')),
      safeCount(bookings.where('status', '==', 'cancelled')),
      safeCount(reports.where('status', '==', 'pending')),
      safeCount(reports),
      safeCount(db.collection('communities')),
    ]);

    return {
      users: { total: usersTotal },
      trips: {
        total: tripsTotal,
        scheduled: tripsScheduled,
        inProgress: tripsInProgress,
        completed: tripsCompleted,
        cancelled: tripsCancelled,
      },
      bookings: {
        total: bookingsTotal,
        confirmed: bookingsConfirmed,
        cancelled: bookingsCancelled,
      },
      reports: { pending: reportsPending, total: reportsTotal },
      communities: communitiesTotal,
    };
  } catch (err) {
    console.error('[platform-admin] getPlatformOverview failed:', err);
    return null;
  }
}

export type PlatformUserRow = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  disabled: boolean;
  displayName: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  trustScore: number | null;
  driverTrips: number | null;
  riderTrips: number | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  reportsReceived: number;
};

/**
 * Merge Firebase Auth records (the source of truth for email + login times)
 * with the Firestore `users` profile (trust + trip counts), and overlay a
 * per-user "reports received" tally from the reports collection.
 */
export async function getPlatformUsers(limit = 200): Promise<PlatformUserRow[] | null> {
  try {
    await requireAccess();
    const db = getAdminFirestore();
    const auth = getAdminAuth();

    // Auth list — capped; pilot scale fits a single page.
    const authList = await auth.listUsers(Math.min(limit, 1000));

    // Reports-received tally (scan a bounded window).
    const reportsByUser = new Map<string, number>();
    try {
      const reportSnap = await db.collection('reports').limit(1000).get();
      reportSnap.docs.forEach((doc) => {
        const reportedId = doc.data().reported_id as string | undefined;
        if (reportedId) {
          reportsByUser.set(reportedId, (reportsByUser.get(reportedId) ?? 0) + 1);
        }
      });
    } catch (err) {
      console.error('[platform-admin] reports tally failed:', err);
    }

    // Profile docs for the listed auth users, chunked by 30 (Firestore `in`).
    const profileById = new Map<string, FirebaseFirestore.DocumentData>();
    const uids = authList.users.map((u) => u.uid);
    for (let i = 0; i < uids.length; i += 30) {
      const chunk = uids.slice(i, i + 30);
      if (chunk.length === 0) continue;
      const snap = await db.collection('users').where('__name__', 'in', chunk).get();
      snap.docs.forEach((doc) => profileById.set(doc.id, doc.data()));
    }

    const rows: PlatformUserRow[] = authList.users.map((u) => {
      const profile = profileById.get(u.uid);
      const toIso = (t?: string) => (t ? new Date(t).toISOString() : null);
      return {
        id: u.uid,
        email: u.email ?? null,
        emailVerified: u.emailVerified,
        disabled: u.disabled,
        displayName: (profile?.display_name as string | undefined) ?? u.displayName ?? null,
        createdAt: toIso(u.metadata.creationTime),
        lastSignInAt: toIso(u.metadata.lastSignInTime),
        trustScore: (profile?.trust_score as number | undefined) ?? null,
        driverTrips: (profile?.driver_trips_count as number | undefined) ?? null,
        riderTrips: (profile?.rider_trips_count as number | undefined) ?? null,
        ratingAvg: (profile?.rating_avg as number | undefined) ?? null,
        ratingCount: (profile?.rating_count as number | undefined) ?? null,
        reportsReceived: reportsByUser.get(u.uid) ?? 0,
      };
    });

    // Most recent sign-in first; never-signed-in fall to the bottom.
    rows.sort((a, b) => (b.lastSignInAt ?? '').localeCompare(a.lastSignInAt ?? ''));
    return rows;
  } catch (err) {
    console.error('[platform-admin] getPlatformUsers failed:', err);
    return null;
  }
}

export type LiveTripRow = {
  id: string;
  communityName: string | null;
  driverId: string;
  driverName: string | null;
  originName: string;
  destinationName: string;
  departureTime: string;
  status: TripStatus;
  seatsAvailable: number;
  seatsTotal: number;
};

/** Trips that are currently live: scheduled (upcoming) or in progress. */
export async function getLiveTrips(limit = 100): Promise<LiveTripRow[] | null> {
  try {
    await requireAccess();
    const db = getAdminFirestore();

    const [scheduledSnap, inProgressSnap] = await Promise.all([
      db.collection('trips').where('status', '==', 'scheduled').limit(limit).get(),
      db.collection('trips').where('status', '==', 'in_progress').limit(limit).get(),
    ]);

    const docs = [...inProgressSnap.docs, ...scheduledSnap.docs];
    if (docs.length === 0) return [];

    const driverIds = [...new Set(docs.map((d) => d.data().driver_id as string).filter(Boolean))];
    const driverNames = await resolveDisplayNames(db, driverIds);

    const rows: LiveTripRow[] = docs.map((doc) => {
      const t = doc.data();
      return {
        id: doc.id,
        communityName: (t.community_name as string | undefined) ?? null,
        driverId: t.driver_id as string,
        driverName: driverNames.get(t.driver_id as string) ?? null,
        originName: (t.origin_name as string) ?? '—',
        destinationName: (t.destination_name as string) ?? '—',
        departureTime: t.departure_time as string,
        status: t.status as TripStatus,
        seatsAvailable: (t.seats_available as number) ?? 0,
        seatsTotal: (t.seats_total as number) ?? 0,
      };
    });

    // In-progress first, then soonest departures.
    rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in_progress' ? -1 : 1;
      return (a.departureTime ?? '').localeCompare(b.departureTime ?? '');
    });
    return rows.slice(0, limit);
  } catch (err) {
    console.error('[platform-admin] getLiveTrips failed:', err);
    return null;
  }
}

export type PlatformProblem = {
  id: string;
  kind: 'report' | 'cancelled_trip' | 'failed_autobook';
  title: string;
  detail: string | null;
  userId: string | null;
  userName: string | null;
  tripId: string | null;
  communityName: string | null;
  createdAt: string;
};

/**
 * Cross-platform "problems" feed: pending reports, recently cancelled trips,
 * and failed recurring auto-bookings. Ordered newest first.
 */
export async function getPlatformProblems(limit = 60): Promise<PlatformProblem[] | null> {
  try {
    await requireAccess();
    const db = getAdminFirestore();

    const [reportSnap, cancelledSnap, failedSnap] = await Promise.all([
      db.collection('reports').where('status', '==', 'pending').limit(limit).get(),
      db.collection('trips').where('status', '==', 'cancelled').limit(limit).get(),
      db
        .collection('trip_subscriptions')
        .where('status', '==', 'active')
        .limit(limit)
        .get()
        .catch(() => null),
    ]);

    const problems: PlatformProblem[] = [];

    reportSnap.docs.forEach((doc) => {
      const r = doc.data();
      problems.push({
        id: `report_${doc.id}`,
        kind: 'report',
        title: (r.reason as string) ?? 'Report',
        detail: (r.context as string | undefined) ?? null,
        userId: (r.reported_id as string | undefined) ?? null,
        userName: (r.reported_display_name as string | undefined) ?? null,
        tripId: (r.trip_id as string | undefined) ?? null,
        communityName: (r.community_name as string | undefined) ?? null,
        createdAt: (r.created_at as string) ?? '',
      });
    });

    cancelledSnap.docs.forEach((doc) => {
      const t = doc.data();
      problems.push({
        id: `cancel_${doc.id}`,
        kind: 'cancelled_trip',
        title: `${t.origin_name ?? '—'} → ${t.destination_name ?? '—'}`,
        detail: t.cancelled_by ? `cancelled_by: ${t.cancelled_by}` : null,
        userId: (t.cancelled_by as string | undefined) ?? (t.driver_id as string | undefined) ?? null,
        userName: null,
        tripId: doc.id,
        communityName: (t.community_name as string | undefined) ?? null,
        createdAt: (t.cancelled_at as string | undefined) ?? (t.created_at as string) ?? '',
      });
    });

    if (failedSnap) {
      failedSnap.docs.forEach((doc) => {
        const s = doc.data();
        if (!s.last_failed_reason) return;
        problems.push({
          id: `autobook_${doc.id}`,
          kind: 'failed_autobook',
          title: `${s.origin_name ?? '—'} → ${s.destination_name ?? '—'}`,
          detail: (s.last_failed_reason as string | undefined) ?? null,
          userId: (s.passenger_id as string | undefined) ?? null,
          userName: null,
          tripId: (s.last_failed_trip_id as string | undefined) ?? null,
          communityName: null,
          createdAt: (s.last_booked_at as string | undefined) ?? (s.created_at as string) ?? '',
        });
      });
    }

    // Fill in user names for entries that only have an id.
    const missingNameIds = [
      ...new Set(
        problems
          .filter((p) => p.userId && !p.userName)
          .map((p) => p.userId as string)
      ),
    ];
    if (missingNameIds.length > 0) {
      const names = await resolveDisplayNames(db, missingNameIds);
      problems.forEach((p) => {
        if (p.userId && !p.userName) p.userName = names.get(p.userId) ?? null;
      });
    }

    problems.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return problems.slice(0, limit);
  } catch (err) {
    console.error('[platform-admin] getPlatformProblems failed:', err);
    return null;
  }
}

/** Resolve a set of user ids to display names, chunked for Firestore `in`. */
async function resolveDisplayNames(db: Db, userIds: string[]): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  for (let i = 0; i < userIds.length; i += 30) {
    const chunk = userIds.slice(i, i + 30);
    if (chunk.length === 0) continue;
    const snap = await db.collection('users').where('__name__', 'in', chunk).get();
    snap.docs.forEach((doc) => result.set(doc.id, (doc.data().display_name as string | undefined) ?? null));
  }
  return result;
}
