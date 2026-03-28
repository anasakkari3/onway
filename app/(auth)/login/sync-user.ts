'use server';

import { getAdminAuth } from '@/lib/firebase/admin';
import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { trackEvent } from '@/lib/services/analytics';

export async function ensureUserProfile(idToken: string) {
  let decoded: { uid: string; email?: string; name?: string; picture?: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return;
  }

  const db = getAdminFirestore();
  const userRef = db.collection('users').doc(decoded.uid);
  const existing = await userRef.get();

  if (existing.exists) {
    // Update existing profile
    await userRef.update({
      display_name: decoded.name ?? existing.data()!.display_name ?? null,
      avatar_url: decoded.picture ?? existing.data()!.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    });
  } else {
    // Create new profile
    await userRef.set({
      id: decoded.uid,
      phone: null,
      display_name: decoded.name ?? null,
      avatar_url: decoded.picture ?? null,
      rating_avg: 0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  try {
    await trackEvent('auth_success', { userId: decoded.uid });
  } catch {
    // Analytics non-critical
  }
}
