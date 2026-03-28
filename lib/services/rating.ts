import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import { trackEvent } from './analytics';

export async function hasUserRatedTrip(tripId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const db = getAdminFirestore();
  const existingSnap = await db.collection('ratings')
    .where('trip_id', '==', tripId)
    .where('rater_id', '==', user.id)
    .limit(1)
    .get();
  return !existingSnap.empty;
}

export async function submitRating(tripId: string, ratedUserId: string, score: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  if (score < 1 || score > 5) throw new Error('Score must be 1-5');

  const db = getAdminFirestore();

  await db.runTransaction(async (transaction) => {
    // 1. Check constraints
    const tripRef = db.collection('trips').doc(tripId);
    const tripDoc = await transaction.get(tripRef);
    if (!tripDoc.exists) throw new Error('Trip not found');
    const trip = tripDoc.data();
    if (trip?.status !== 'completed') throw new Error('Trip not completed');

    const bookingSnap = await transaction.get(
      db.collection('bookings')
        .where('trip_id', '==', tripId)
        .where('passenger_id', '==', user.id)
        .where('status', '==', 'confirmed')
    );
    const isPassenger = !bookingSnap.empty;
    if (!isPassenger && trip?.driver_id !== user.id) {
      throw new Error('Not a participant');
    }

    const existingSnap = await transaction.get(
      db.collection('ratings')
        .where('trip_id', '==', tripId)
        .where('rater_id', '==', user.id)
    );
    if (!existingSnap.empty) {
      throw new Error('Already rated this trip');
    }

    // 2. Add rating document
    const ratingRef = db.collection('ratings').doc();
    transaction.set(ratingRef, {
      trip_id: tripId,
      rater_id: user.id,
      rated_id: ratedUserId,
      score,
      created_at: new Date().toISOString(),
    });

    // 3. Update user's average rating safely
    // Since we are adding one rating, we can calculate the new average from the old average and count
    const userRef = db.collection('users').doc(ratedUserId);
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists) {
      const u = userDoc.data();
      const oldCount = u?.rating_count || 0;
      const oldAvg = u?.rating_avg || 0;
      const newCount = oldCount + 1;
      const newAvg = ((oldAvg * oldCount) + score) / newCount;
      transaction.update(userRef, {
        rating_avg: Math.round(newAvg * 100) / 100,
        rating_count: newCount,
      });
    }
  });

  await trackEvent('rating_submitted', {
    userId: user.id,
    payload: { trip_id: tripId, rated_id: ratedUserId, score },
  });
}
