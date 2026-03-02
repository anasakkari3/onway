import { createClient } from '@/lib/supabase/server';

export type AnalyticsEventName =
  | 'auth_success'
  | 'trip_created'
  | 'trip_search'
  | 'trip_results_shown'
  | 'trip_opened'
  | 'booking_attempted'
  | 'booking_confirmed'
  | 'trip_completed'
  | 'rating_submitted';

export async function trackEvent(
  eventName: AnalyticsEventName,
  options: { userId?: string; communityId?: string | null; payload?: Record<string, unknown> } = {}
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('analytics_events').insert({
    event_name: eventName,
    user_id: options.userId ?? user?.id ?? null,
    community_id: options.communityId ?? null,
    payload: options.payload ?? {},
  });
}
