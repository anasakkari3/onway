import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getMyProfileFull } from '@/lib/services/user';
import SettingsClient from './SettingsClient';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/services/notification-preferences';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getMyProfileFull(user.id);

  return (
    <SettingsClient
      initialEmailNotificationsEnabled={profile?.email_notifications_enabled !== false}
      initialNotificationPreferences={
        profile?.notification_preferences ?? DEFAULT_NOTIFICATION_PREFERENCES
      }
    />
  );
}
