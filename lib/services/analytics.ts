import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';

export type AnalyticsEventName =
  | 'page_view'
  | 'login_success'
  | 'login_failed'
  | 'auth_success'
  | 'trip_created'
  | 'trip_search'
  | 'trip_results_shown'
  | 'trip_opened'
  | 'trip_details_view'
  | 'booking_attempted'
  | 'booking_started'
  | 'booking_confirmed'
  | 'booking_completed'
  | 'booking_failed'
  | 'booking_cancelled'
  | 'driver_approval_pending'
  | 'driver_approval_accepted'
  | 'driver_approval_rejected'
  | 'error_occurred'
  | 'route_requested'
  | 'route_alert_created'
  | 'route_alert_updated'
  | 'route_alert_matched'
  | 'trip_started'
  | 'trip_completed'
  | 'pre_departure_confirmation_updated'
  | 'rating_submitted'
  | 'message_sent'
  | 'create_trip_cta_clicked'
  | 'notification_opened'
  | 'notification_cta_clicked'
  | 'driver_profile_viewed'
  | 'trust_badge_seen';

type AnalyticsStatus = 'success' | 'failed' | 'cancelled' | 'pending' | 'info';
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function sanitizeValue(value: unknown, depth = 0): JsonValue {
  if (depth > 3) return '[truncated]';
  if (value == null) return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  if (Array.isArray(value)) return value.slice(0, 20).map((entry) => sanitizeValue(entry, depth + 1));
  if (typeof value === 'object') {
    const output: Record<string, JsonValue> = {};
    Object.entries(value as Record<string, unknown>).slice(0, 40).forEach(([key, entry]) => {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes('password') ||
        normalizedKey.includes('token') ||
        normalizedKey.includes('secret') ||
        normalizedKey.includes('private_key') ||
        normalizedKey.includes('phone') ||
        normalizedKey.includes('message')
      ) {
        output[key] = '[redacted]';
        return;
      }
      output[key] = sanitizeValue(entry, depth + 1);
    });
    return output;
  }
  return String(value);
}

export async function trackEvent(
  eventName: AnalyticsEventName,
  options: {
    userId?: string | null;
    userRole?: string | null;
    communityId?: string | null;
    tripId?: string | null;
    bookingId?: string | null;
    status?: AnalyticsStatus;
    payload?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  } = {}
) {
  try {
    const user = await getCurrentUser();
    const db = getAdminFirestore();
    const metadata = options.metadata ?? options.payload ?? {};
    const userId = options.userId ?? user?.id ?? null;
    const createdAt = new Date().toISOString();

    await db.collection('analytics_events').add({
      eventName,
      event_name: eventName,
      userId,
      user_id: userId,
      userRole: options.userRole ?? null,
      user_role: options.userRole ?? null,
      communityId: options.communityId ?? null,
      community_id: options.communityId ?? null,
      tripId: options.tripId ?? null,
      trip_id: options.tripId ?? null,
      bookingId: options.bookingId ?? null,
      booking_id: options.bookingId ?? null,
      status: options.status ?? 'info',
      metadata: sanitizeValue(metadata),
      payload: sanitizeValue(metadata),
      createdAt,
      created_at: createdAt,
    });
  } catch {
    // Analytics is non-critical. Never let tracking break the user action.
  }
}

export async function logSystemError(
  error: unknown,
  context: {
    userId?: string | null;
    severity?: 'low' | 'medium' | 'high';
    page?: string | null;
    component?: string | null;
    action?: string | null;
    tripId?: string | null;
    bookingId?: string | null;
    metadata?: Record<string, unknown>;
    browserInfo?: Record<string, unknown> | null;
  } = {}
) {
  try {
    const user = await getCurrentUser();
    const err = error instanceof Error ? error : new Error(String(error));
    const userId = context.userId ?? user?.id ?? null;
    const createdAt = new Date().toISOString();

    await getAdminFirestore().collection('system_errors').add({
      message: err.message.slice(0, 800),
      stack: err.stack ? err.stack.slice(0, 2000) : null,
      context: sanitizeValue({
        page: context.page ?? null,
        component: context.component ?? null,
        action: context.action ?? null,
        tripId: context.tripId ?? null,
        bookingId: context.bookingId ?? null,
        metadata: context.metadata ?? {},
      }),
      userId,
      user_id: userId,
      severity: context.severity ?? 'medium',
      createdAt,
      created_at: createdAt,
      browserInfo: sanitizeValue(context.browserInfo ?? null),
      browser_info: sanitizeValue(context.browserInfo ?? null),
    });

    await trackEvent('error_occurred', {
      userId,
      tripId: context.tripId ?? null,
      bookingId: context.bookingId ?? null,
      status: 'failed',
      metadata: {
        severity: context.severity ?? 'medium',
        action: context.action ?? null,
        page: context.page ?? null,
        message: err.message,
      },
    });
  } catch {
    // Error logging must never create a second failure path.
  }
}
