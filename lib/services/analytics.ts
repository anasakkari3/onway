import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';

export type AnalyticsEventName =
  // --- Supply & demand funnel ---
  | 'auth_success'
  | 'trip_created'
  | 'trip_search'
  | 'trip_results_shown'
  | 'trip_opened'
  | 'booking_attempted'
  | 'booking_confirmed'
  | 'route_requested'
  | 'route_alert_created'
  | 'route_alert_updated'
  | 'route_alert_matched'
  | 'trip_started'
  | 'trip_completed'
  | 'rating_submitted'
  | 'message_sent'
  // --- Conversion & engagement signals ---
  /** User clicked a "Create trip" CTA from a no-results or similar-routes search state. */
  | 'create_trip_cta_clicked'
  /** User opened a notification (tapped on the notification card). */
  | 'notification_opened'
  /** User clicked the action CTA pill inside a notification card (e.g. "View ride"). */
  | 'notification_cta_clicked'
  /** Trip detail page loaded for a driver who has a trust profile — rider was exposed to trust data. */
  | 'driver_profile_viewed'
  /** Full trust summary rendered — user saw trust badges before making a booking decision. */
  | 'trust_badge_seen';

export async function trackEvent(
  eventName: AnalyticsEventName,
  options: { userId?: string; communityId?: string | null; payload?: Record<string, unknown> } = {}
) {
  try {
    const user = await getCurrentUser();
    const db = getAdminFirestore();
    await db.collection('analytics_events').add({
      event_name: eventName,
      user_id: options.userId ?? user?.id ?? null,
      community_id: options.communityId ?? null,
      payload: options.payload ?? {},
      created_at: new Date().toISOString(),
    });
  } catch {
    // Analytics is non-critical — never throw
  }
}
