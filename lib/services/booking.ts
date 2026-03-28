import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { BookingWithPassenger, UserProfile } from '@/lib/types';
import { trackEvent } from './analytics';
import { createNotification } from './notification';

export async function bookSeat(tripId: string, seats: number = 1) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const db = getAdminFirestore();

  await trackEvent('booking_attempted', {
    userId: user.id,
    payload: { trip_id: tripId, seats },
  });

  // Use a transaction to avoid race conditions on seats_available
  const result = await db.runTransaction(async (tx) => {
    const tripRef = db.collection('trips').doc(tripId);
    const tripDoc = await tx.get(tripRef);

    if (!tripDoc.exists) throw new Error('Trip not found');
    const tripData = tripDoc.data()!;

    if (tripData.seats_available < seats) {
      throw new Error('Not enough seats available');
    }

    const bookingRef = db.collection('bookings').doc();
    tx.set(bookingRef, {
      trip_id: tripId,
      passenger_id: user.id,
      seats,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    });

    tx.update(tripRef, {
      seats_available: tripData.seats_available - seats,
    });

    return {
      success: true,
      booking_id: bookingRef.id,
      seats_available: tripData.seats_available - seats,
    };
  });

  await trackEvent('booking_confirmed', {
    userId: user.id,
    payload: { trip_id: tripId, booking_id: result.booking_id },
  });

  try {
    const tripDoc = await getAdminFirestore().collection('trips').doc(tripId).get();
    const driverId = tripDoc.data()?.driver_id;
    if (driverId) {
      await createNotification({
        userId: driverId,
        type: 'booking',
        title: 'New Booking',
        body: `${user.displayName || 'Someone'} booked ${seats} seat(s) on your trip.`,
        linkUrl: `/trips/${tripId}`
      });
    }
  } catch {
    // non-critical
  }

  return result;
}

export async function getBookingsForTrip(tripId: string): Promise<BookingWithPassenger[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('bookings')
    .where('trip_id', '==', tripId)
    .where('status', '==', 'confirmed')
    .get();

  if (snap.empty) return [];

  const passengerIds = [...new Set(snap.docs.map((d) => d.data().passenger_id as string))];
  const userMap = new Map<string, UserProfile>();

  for (const pid of passengerIds) {
    const userDoc = await db.collection('users').doc(pid).get();
    if (userDoc.exists) {
      const u = userDoc.data()!;
      userMap.set(pid, {
        id: userDoc.id,
        display_name: u.display_name ?? null,
        avatar_url: u.avatar_url ?? null,
        rating_avg: u.rating_avg ?? 0,
        rating_count: u.rating_count ?? 0,
      });
    }
  }

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      passenger: userMap.get(data.passenger_id) ?? null,
    } as BookingWithPassenger;
  });
}

export async function cancelBooking(bookingId: string) {
  const db = getAdminFirestore();

  const result = await db.runTransaction(async (tx) => {
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await tx.get(bookingRef);

    if (!bookingDoc.exists) throw new Error('Booking not found');
    const booking = bookingDoc.data()!;

    if (booking.status !== 'confirmed') throw new Error('Booking already cancelled');

    const tripRef = db.collection('trips').doc(booking.trip_id);
    const tripDoc = await tx.get(tripRef);

    tx.update(bookingRef, { status: 'cancelled' });

    if (tripDoc.exists) {
      tx.update(tripRef, {
        seats_available: (tripDoc.data()!.seats_available ?? 0) + booking.seats,
      });
    }
    return { driverId: tripDoc.data()?.driver_id, tripId: booking.trip_id, seats: booking.seats };
  });

  try {
    const user = await getCurrentUser();
    if (result.driverId && user) {
      await createNotification({
        userId: result.driverId,
        type: 'cancellation',
        title: 'Booking Cancelled',
        body: `${user.displayName || 'Someone'} cancelled their booking for ${result.seats} seat(s).`,
        linkUrl: `/trips/${result.tripId}`
      });
    }
  } catch {
    // non-critical
  }
}
