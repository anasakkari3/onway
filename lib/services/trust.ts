import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getAdminAuth } from '@/lib/firebase/admin';
import { isAllowedCommunityId } from '@/lib/community/allowed';
import type { TrustBadge, TrustProfile } from '@/lib/types';

export type CompletedRideStats = {
  completedDrives: number;
  completedJoins: number;
};

export type ProfileSetupStatus = {
  completedFields: number;
  totalFields: number;
  missingFields: string[];
  hasDisplayName: boolean;
  hasAvatar: boolean;
  hasPhone: boolean;
};

export function getProfileSetupStatus(input: {
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  cityOrArea?: string | null;
  age?: number | string | null;
  gender?: string | null;
  isDriver?: boolean | null;
}): ProfileSetupStatus {
  const hasDisplayName = Boolean(input.displayName?.trim());
  const hasAvatar = Boolean(input.avatarUrl?.trim());
  const hasPhone = Boolean(input.phone?.trim());

  const fields = [
    { label: 'Display name', complete: hasDisplayName },
    { label: 'Profile photo', complete: hasAvatar },
    { label: 'Phone number', complete: hasPhone },
  ];

  const completedFields = fields.filter((field) => field.complete).length;

  return {
    completedFields,
    totalFields: fields.length,
    missingFields: fields.filter((field) => !field.complete).map((field) => field.label),
    hasDisplayName,
    hasAvatar,
    hasPhone,
  };
}

export async function getCompletedRideStats(
  userId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<CompletedRideStats> {
  const db = passedDb ?? getAdminFirestore();

  const [drivesSnap, joinedBookingsSnap] = await Promise.all([
    db.collection('trips')
      .where('driver_id', '==', userId)
      .where('status', '==', 'completed')
      .get(),
    db.collection('bookings')
      .where('passenger_id', '==', userId)
      .where('status', '==', 'confirmed')
      .get(),
  ]);

  const completedDrives = drivesSnap.docs.filter((doc) =>
    isAllowedCommunityId(doc.data().community_id)
  ).length;

  const joinedTripIds = [
    ...new Set(joinedBookingsSnap.docs.map((d) => d.data().trip_id as string)),
  ];

  if (joinedTripIds.length === 0) {
    return { completedDrives, completedJoins: 0 };
  }

  // Batch read trips in chunks of 30 (Firestore `in` limit) instead of N serial reads.
  const BATCH_SIZE = 30;
  let completedJoins = 0;

  for (let i = 0; i < joinedTripIds.length; i += BATCH_SIZE) {
    const chunk = joinedTripIds.slice(i, i + BATCH_SIZE);
    const tripsSnap = await db
      .collection('trips')
      .where('__name__', 'in', chunk)
      .get();

    for (const tripDoc of tripsSnap.docs) {
      const tripData = tripDoc.data();
      if (
        tripData?.status === 'completed' &&
        isAllowedCommunityId(tripData.community_id)
      ) {
        completedJoins += 1;
      }
    }
  }

  return { completedDrives, completedJoins };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isPositiveAge(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value !== 'string') return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export function calculateProfileCompletion(profile?: FirebaseFirestore.DocumentData | null) {
  if (!profile) return 0;

  const fields = [
    Boolean(typeof profile.display_name === 'string' && profile.display_name.trim()),
    Boolean(typeof profile.phone === 'string' && profile.phone.trim()),
    Boolean(typeof profile.city_or_area === 'string' && profile.city_or_area.trim()),
    isPositiveAge(profile.age),
    Boolean(typeof profile.gender === 'string' && profile.gender.trim()),
    typeof profile.is_driver === 'boolean',
    Boolean(typeof profile.avatar_url === 'string' && profile.avatar_url.trim()),
  ];

  return clampScore((fields.filter(Boolean).length / fields.length) * 100);
}

export async function getCompletedDriveCountForDriver(
  driverId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<number> {
  const db = passedDb ?? getAdminFirestore();
  const snap = await db.collection('trips')
    .where('driver_id', '==', driverId)
    .where('status', '==', 'completed')
    .get();

  return snap.docs.filter((doc) => isAllowedCommunityId(doc.data().community_id)).length;
}

export async function getCommunityCountForUser(
  userId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<number> {
  const db = passedDb ?? getAdminFirestore();
  const snap = await db.collection('community_members')
    .where('user_id', '==', userId)
    .get();

  return snap.docs.filter((doc) => isAllowedCommunityId(doc.data().community_id)).length;
}

export function calculateTrustScore(input: {
  emailVerified: boolean;
  communitiesCount: number;
  driverTripsCount: number;
  riderTripsCount: number;
  profileCompletion: number;
}): number {
  // Behavior-first weighting: real activity and verified identity are the primary
  // signals. Profile cosmetics (photo, age, etc.) and community membership are
  // reduced to a minor supplement — they can be gamed without any real usage.
  //
  // Max breakdown:
  //   verified email  : 25 pts  (hard identity signal)
  //   completed drives: 50 pts  (min(drives, 10) * 5)
  //   completed rides : 15 pts  (min(rides,  5) * 3)
  //   profile fill    : 10 pts  (min(completion, 100) * 0.1)
  //   communities     :  0 pts  (removed — cosmetic, easy to pad)
  //   ─────────────────────────
  //   total possible  : 100 pts

  const emailPoints = input.emailVerified ? 25 : 0;
  const driverPoints = Math.min(input.driverTripsCount, 10) * 5;
  const riderPoints = Math.min(input.riderTripsCount, 5) * 3;
  const profilePoints = Math.min(input.profileCompletion, 100) * 0.1;

  return clampScore(emailPoints + driverPoints + riderPoints + profilePoints);
}

export function getTrustBadges(input: {
  emailVerified: boolean;
  communitiesCount: number;
  driverTripsCount: number;
  riderTripsCount: number;
}): TrustBadge[] {
  const badges: TrustBadge[] = [];

  if (input.emailVerified) {
    badges.push({ key: 'verified_email', label: 'Verified Email' });
  }
  if (input.driverTripsCount >= 1) {
    badges.push({ key: 'active_driver', label: 'Active Driver' });
  }
  if (input.riderTripsCount >= 3) {
    badges.push({ key: 'frequent_rider', label: 'Frequent Rider' });
  }
  if (input.communitiesCount >= 1) {
    badges.push({ key: 'community_member', label: 'Community Member' });
  }

  return badges;
}

export async function getUserTrustProfile(
  userId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<TrustProfile> {
  const db = passedDb ?? getAdminFirestore();
  const [userDoc, stats, communitiesCount] = await Promise.all([
    db.collection('users').doc(userId).get(),
    getCompletedRideStats(userId, db),
    getCommunityCountForUser(userId, db),
  ]);
  const userData = userDoc.data() ?? null;
  let emailVerified = userData?.email_verified === true;
  if (userData && typeof userData.email_verified !== 'boolean') {
    try {
      const authUser = await getAdminAuth().getUser(userId);
      emailVerified = authUser.emailVerified === true;
      await db.collection('users').doc(userId).set(
        {
          email_verified: emailVerified,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      emailVerified = false;
    }
  }
  const profileCompletion = calculateProfileCompletion(userData);
  const trustScore = calculateTrustScore({
    emailVerified,
    communitiesCount,
    driverTripsCount: stats.completedDrives,
    riderTripsCount: stats.completedJoins,
    profileCompletion,
  });

  const trustProfile = {
    user_id: userId,
    email_verified: emailVerified,
    communities_count: communitiesCount,
    driver_trips_count: stats.completedDrives,
    rider_trips_count: stats.completedJoins,
    profile_completion: profileCompletion,
    trust_score: trustScore,
    badges: getTrustBadges({
      emailVerified,
      communitiesCount,
      driverTripsCount: stats.completedDrives,
      riderTripsCount: stats.completedJoins,
    }),
  };

  try {
    await db.collection('users').doc(userId).set(
      {
        email_verified: trustProfile.email_verified,
        communities_count: trustProfile.communities_count,
        driver_trips_count: trustProfile.driver_trips_count,
        rider_trips_count: trustProfile.rider_trips_count,
        profile_completion: trustProfile.profile_completion,
        trust_score: trustProfile.trust_score,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Trust display still uses the computed value; cache writes are best-effort.
  }

  return trustProfile;
}
