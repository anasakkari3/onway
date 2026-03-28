import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { TripWithDriver, UserProfile } from '@/lib/types';
import { trackEvent } from './analytics';
import { createNotification } from './notification';

export type CreateTripInput = {
  communityId: string;
  originLat: number;
  originLng: number;
  originName: string;
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  departureTime: string;
  seatsTotal: number;
  priceCents?: number | null;
};

export async function createTrip(input: CreateTripInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const db = getAdminFirestore();
  const ref = await db.collection('trips').add({
    community_id: input.communityId,
    driver_id: user.id,
    origin_lat: input.originLat,
    origin_lng: input.originLng,
    origin_name: input.originName,
    destination_lat: input.destinationLat,
    destination_lng: input.destinationLng,
    destination_name: input.destinationName,
    departure_time: input.departureTime,
    seats_total: input.seatsTotal,
    seats_available: input.seatsTotal,
    price_cents: input.priceCents ?? null,
    status: 'scheduled',
    created_at: new Date().toISOString(),
  });

  await trackEvent('trip_created', {
    userId: user.id,
    communityId: input.communityId,
    payload: { trip_id: ref.id },
  });

  return { id: ref.id };
}

async function getUserProfile(db: FirebaseFirestore.Firestore, userId: string): Promise<UserProfile | null> {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  return {
    id: doc.id,
    display_name: d.display_name ?? null,
    avatar_url: d.avatar_url ?? null,
    rating_avg: d.rating_avg ?? 0,
    rating_count: d.rating_count ?? 0,
  };
}

export async function getTripById(tripId: string): Promise<TripWithDriver> {
  const db = getAdminFirestore();
  const doc = await db.collection('trips').doc(tripId).get();
  if (!doc.exists) throw new Error('Trip not found');

  const trip = { id: doc.id, ...doc.data() } as TripWithDriver;
  const driver = await getUserProfile(db, trip.driver_id);

  return { ...trip, driver };
}

export async function getTripsByCommunity(communityId: string): Promise<TripWithDriver[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('trips')
    .where('community_id', '==', communityId)
    .where('status', '==', 'scheduled')
    .orderBy('departure_time', 'asc')
    .get();

  if (snap.empty) return [];

  const driverIds = [...new Set(snap.docs.map((d) => d.data().driver_id as string))];
  const userMap = new Map<string, UserProfile>();

  for (const driverId of driverIds) {
    const profile = await getUserProfile(db, driverId);
    if (profile) userMap.set(driverId, profile);
  }

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      driver: userMap.get(data.driver_id) ?? null,
    } as TripWithDriver;
  });
}

export async function updateTripStatus(tripId: string, status: 'scheduled' | 'cancelled' | 'completed') {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const db = getAdminFirestore();
  const ref = db.collection('trips').doc(tripId);
  const doc = await ref.get();

  if (!doc.exists) throw new Error('Trip not found');
  if (doc.data()!.driver_id !== user.id) throw new Error('Unauthorized');

  await ref.update({ status });

  if (status === 'completed') {
    await trackEvent('trip_completed', { userId: user.id, payload: { trip_id: tripId } });
  } else if (status === 'cancelled') {
    try {
      const bookingsSnap = await db.collection('bookings').where('trip_id', '==', tripId).where('status', '==', 'confirmed').get();
      const notifyPromises = bookingsSnap.docs.map(b => 
         createNotification({
           userId: b.data().passenger_id as string,
           type: 'cancellation',
           title: 'Trip Cancelled',
           body: 'A trip you booked has been cancelled by the driver.',
           linkUrl: `/trips/${tripId}`
         })
      );
      await Promise.all(notifyPromises);
    } catch {
      // non-critical
    }
  }

  return { id: tripId, ...doc.data(), status };
}

/** Get upcoming trips where the current user is the driver */
export async function getMyTripsAsDriver(): Promise<TripWithDriver[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  const snap = await db
    .collection('trips')
    .where('driver_id', '==', user.id)
    .where('status', '==', 'scheduled')
    .get();

  if (snap.empty) return [];

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data(), driver: null } as TripWithDriver))
    .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
}

/** Get upcoming trips in a community for the home page preview */
export async function getUpcomingCommunityTrips(communityId: string, limitCount = 3): Promise<TripWithDriver[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('trips')
    .where('community_id', '==', communityId)
    .where('status', '==', 'scheduled')
    .get();

  if (snap.empty) return [];

  const validTrips = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as TripWithDriver))
    .filter((t) => t.seats_available > 0 && new Date(t.departure_time) > new Date())
    .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime())
    .slice(0, limitCount);

  // Fetch driver profiles
  const results: TripWithDriver[] = [];
  for (const trip of validTrips) {
    const driver = await getUserProfile(db, trip.driver_id);
    results.push({ ...trip, driver });
  }

  return results;
}

/** Get upcoming reservations where the current user is a passenger */
export async function getMyReservations(): Promise<TripWithDriver[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  const bookingsSnap = await db
    .collection('bookings')
    .where('passenger_id', '==', user.id)
    .where('status', '==', 'confirmed')
    .get();

  if (bookingsSnap.empty) return [];

  const tripIds = [...new Set(bookingsSnap.docs.map((d) => d.data().trip_id as string))];
  const results: TripWithDriver[] = [];

  for (const tripId of tripIds) {
    const tripDoc = await db.collection('trips').doc(tripId).get();
    if (!tripDoc.exists) continue;
    const data = tripDoc.data()!;
    if (data.status !== 'scheduled') continue;

    const driver = await getUserProfile(db, data.driver_id);
    results.push({ id: tripDoc.id, ...data, driver } as TripWithDriver);
  }

  return results.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
}

/** Get past trips (completed/cancelled) where user was driver or passenger */
export async function getMyPastTrips(): Promise<TripWithDriver[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();

  // Trips as driver
  const driverSnap = await db
    .collection('trips')
    .where('driver_id', '==', user.id)
    .where('status', 'in', ['completed', 'cancelled'])
    .get();

  // Bookings as passenger
  const bookingsSnap = await db
    .collection('bookings')
    .where('passenger_id', '==', user.id)
    .get();

  const tripIds = new Set<string>();
  const results: TripWithDriver[] = [];

  for (const d of driverSnap.docs) {
    tripIds.add(d.id);
    const data = d.data();
    const driver = await getUserProfile(db, data.driver_id);
    results.push({ id: d.id, ...data, driver } as TripWithDriver);
  }

  for (const b of bookingsSnap.docs) {
    const tid = b.data().trip_id as string;
    if (tripIds.has(tid)) continue;
    const tripDoc = await db.collection('trips').doc(tid).get();
    if (!tripDoc.exists) continue;
    const data = tripDoc.data()!;
    if (data.status !== 'completed' && data.status !== 'cancelled') continue;
    tripIds.add(tid);
    const driver = await getUserProfile(db, data.driver_id);
    results.push({ id: tripDoc.id, ...data, driver } as TripWithDriver);
  }

  return results.sort((a, b) => new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime()).slice(0, 10);
}

/** Get high-level stats for trust display */
export async function getUserStats(userId: string): Promise<{ tripsDriven: number; ridesJoined: number }> {
  const db = getAdminFirestore();

  // Trips driven
  const driverSnap = await db
    .collection('trips')
    .where('driver_id', '==', userId)
    .where('status', '==', 'completed')
    .get();

  // Rides joined
  const bookingsSnap = await db
    .collection('bookings')
    .where('passenger_id', '==', userId)
    .where('status', '==', 'confirmed')
    .get();

  return {
    tripsDriven: driverSnap.size,
    ridesJoined: bookingsSnap.size,
  };
}
