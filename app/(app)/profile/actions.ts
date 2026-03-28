'use server';

import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';

export async function updateProfile(
  userId: string,
  updates: { displayName: string; avatarUrl: string }
) {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) throw new Error('Unauthorized');

  const db = getAdminFirestore();
  await db.collection('users').doc(userId).update({
    display_name: updates.displayName || null,
    avatar_url: updates.avatarUrl || null,
    updated_at: new Date().toISOString(),
  });
}
