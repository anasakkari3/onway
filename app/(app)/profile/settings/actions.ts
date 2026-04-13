'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import type { NotificationPreferences } from '@/lib/types';
import {
  updateEmailNotificationsPreference,
  updateNotificationPreferences,
} from '@/lib/services/user';

export async function updateEmailNotifications(enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await updateEmailNotificationsPreference(user.id, enabled);
  revalidatePath('/profile/settings');
}

export async function updateNotificationEmailPreferences(
  preferences: Partial<NotificationPreferences>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await updateNotificationPreferences(user.id, preferences);
  revalidatePath('/profile/settings');
}
