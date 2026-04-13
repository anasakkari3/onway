import type {
  NotificationPreferenceKey,
  NotificationPreferences,
  NotificationsRow,
} from '@/lib/types';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  booking_emails: true,
  cancellation_emails: true,
  chat_emails: true,
  route_alert_emails: true,
  system_emails: true,
  marketing_emails: false,
};

export const NOTIFICATION_PREFERENCE_KEYS = Object.keys(
  DEFAULT_NOTIFICATION_PREFERENCES
) as NotificationPreferenceKey[];

export function normalizeNotificationPreferences(
  value?: Partial<NotificationPreferences> | null
): NotificationPreferences {
  return NOTIFICATION_PREFERENCE_KEYS.reduce<NotificationPreferences>(
    (preferences, key) => {
      preferences[key] =
        typeof value?.[key] === 'boolean'
          ? Boolean(value[key])
          : DEFAULT_NOTIFICATION_PREFERENCES[key];
      return preferences;
    },
    { ...DEFAULT_NOTIFICATION_PREFERENCES }
  );
}

export function getPreferenceKeyForNotificationType(
  type: NotificationsRow['type']
): NotificationPreferenceKey {
  if (type === 'booking') return 'booking_emails';
  if (type === 'cancellation') return 'cancellation_emails';
  if (type === 'message') return 'chat_emails';
  if (type === 'route_alert') return 'route_alert_emails';
  if (type === 'marketing') return 'marketing_emails';
  return 'system_emails';
}
