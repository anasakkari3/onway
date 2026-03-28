import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { NotificationsRow } from '@/lib/types';

export async function createNotification(params: {
  userId: string;
  type: NotificationsRow['type'];
  title: string;
  body: string;
  linkUrl?: string;
}) {
  const db = getAdminFirestore();
  await db.collection('notifications').add({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    is_read: false,
    link_url: params.linkUrl ?? null,
    created_at: new Date().toISOString(),
  });
}

export async function getMyNotifications(): Promise<NotificationsRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  const snap = await db.collection('notifications')
    .where('user_id', '==', user.id)
    .orderBy('created_at', 'desc')
    .limit(50)
    .get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as NotificationsRow));
}

export async function markNotificationAsRead(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const db = getAdminFirestore();
  const ref = db.collection('notifications').doc(id);
  const doc = await ref.get();
  
  if (!doc.exists) throw new Error('Not found');
  if (doc.data()?.user_id !== user.id) throw new Error('Unauthorized');

  await ref.update({ is_read: true });
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const db = getAdminFirestore();
  const snap = await db.collection('notifications')
    .where('user_id', '==', user.id)
    .where('is_read', '==', false)
    .get();

  if (snap.empty) return;

  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { is_read: true });
  });

  await batch.commit();
}
