'use server';

import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/services/notification';

export async function markAsRead(id: string) {
  await markNotificationAsRead(id);
}

export async function markAllAsRead() {
  await markAllNotificationsAsRead();
}
