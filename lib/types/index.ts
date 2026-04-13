/**
 * Shared domain types for the ride-match app.
 * Plain TypeScript interfaces - no Supabase dependency.
 */

/** User profile stored in Firestore `users` collection */
export type UsersRow = {
  id: string;
  phone: string | null;
  display_name: string | null;
  city_or_area: string | null;
  age: number | null;
  gender: string | null;
  is_driver: boolean | null;
  gender_preference: string | null;
  /** User-level opt-in/out for best-effort email copies of important notifications. Defaults to true. */
  email_notifications_enabled?: boolean | null;
  /** Auth-backed email verification state, copied server-side for trust display. */
  email_verified?: boolean | null;
  /** Cached trust metrics; services compute current values when rendering trust surfaces. */
  communities_count?: number | null;
  driver_trips_count?: number | null;
  rider_trips_count?: number | null;
  profile_completion?: number | null;
  trust_score?: number | null;
  /** Per-channel email controls. Missing values fall back to safe transactional defaults. */
  notification_preferences?: Partial<NotificationPreferences> | null;
  avatar_url: string | null;
  /** Aggregate of ratings this user has received across all completed-trip roles. */
  rating_avg: number;
  /** Count of ratings this user has received across all completed-trip roles. */
  rating_count: number;
  created_at: string;
  updated_at: string;
};

export type CommunityType = 'verified' | 'public';
export type CommunityMembershipMode = 'open' | 'approval_required';
export type CommunityJoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type CommunityJoinSource = 'auto_public' | 'open_join' | 'approval' | 'invite';

/** Community stored in Firestore `communities` collection */
export type CommunitiesRow = {
  id: string;
  name: string;
  description: string | null;
  type: CommunityType;
  membership_mode: CommunityMembershipMode;
  listed: boolean;
  is_system: boolean;
  invite_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Community membership stored in Firestore `community_members` collection */
export type CommunityMembersRow = {
  community_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
  joined_via?: CommunityJoinSource | null;
};

/** Pending/approved/rejected join request stored in Firestore `community_join_requests` collection */
export type CommunityJoinRequestsRow = {
  community_id: string;
  user_id: string;
  status: CommunityJoinRequestStatus;
  request_note?: string | null;
  decision_note?: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
};

/** Trip status values */
export type TripStatus =
  | 'draft'
  | 'scheduled'
  | 'full'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Whether the trip is a one-time event or a recurring route.
 *
 * - 'one_time': departure_time is the exact departure datetime (ISO string).
 * - 'recurring': departure_time is the next computed ISO occurrence, derived
 *   from recurring_days + recurring_departure_time at trip creation time.
 *   No automatic future instances are created; drivers re-publish manually
 *   for each new period. This is an explicit MVP constraint.
 *
 * Old trips without this field are treated as 'one_time' everywhere.
 */
export type TripMode = 'one_time' | 'recurring';

/**
 * Weekday index matching JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat.
 */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TripRulePresetKey =
  | 'no_delay'
  | 'wait_5_minutes'
  | 'no_smoking'
  | 'prefer_quiet'
  | 'fixed_meeting_point'
  | 'confirm_attendance';

export type DriverGenderFilter = 'any' | 'man' | 'woman';

export type TripPassengerGenderPreference = 'any' | 'men_only' | 'women_only';

export type BookingAcknowledgementsRow = {
  trip_rules: boolean;
  platform_role: boolean;
  support_path: boolean;
  acknowledged_at: string;
};

/** Trip stored in Firestore `trips` collection */
export type TripsRow = {
  id: string;
  community_id: string;
  driver_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_name: string;
  destination_lat: number;
  destination_lng: number;
  destination_name: string;
  vehicle_make_model?: string | null;
  vehicle_color?: string | null;
  driver_note?: string | null;
  trip_rule_preset_keys?: TripRulePresetKey[];
  trip_rules_note?: string | null;
  passenger_gender_preference?: TripPassengerGenderPreference | null;
  /**
   * departure_time semantics:
   * - one_time trips: the exact departure datetime (ISO string).
   * - recurring trips: the next upcoming occurrence datetime (ISO string),
   *   computed at creation from recurring_days + recurring_departure_time.
   *   All existing lifecycle guards (30-min window, past-check) work unchanged.
   */
  departure_time: string;
  community_name?: string | null;
  community_type?: CommunityType | null;
  seats_total: number;
  seats_available: number;
  price_cents: number | null;
  status: TripStatus;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  // --- Recurring-trip metadata (absent / undefined on one-time trips) --------
  /** Absent or 'one_time' for legacy and one-time trips. Safe to default to 'one_time'. */
  trip_mode?: TripMode;
  /** Weekday indices on which this route recurs. 0=Sun ... 6=Sat. */
  recurring_days?: WeekdayIndex[];
  /** Fixed departure time string in "HH:MM" 24h format. */
  recurring_departure_time?: string;
};

/** Booking stored in Firestore `bookings` collection */
export type BookingsRow = {
  id: string;
  trip_id: string;
  passenger_id: string;
  passenger_display_name?: string | null;
  passenger_avatar_url?: string | null;
  booking_acknowledgements?: BookingAcknowledgementsRow | null;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
};

/** Canonical identifiers for structured coordination signals */
export type TripCoordinationAction =
  | 'PASSENGER_HERE'
  | 'PASSENGER_LATE'
  | 'DRIVER_CONFIRMED'
  | 'DRIVER_CANCELED_TRIP'
  | 'PASSENGER_CANCELED_SEAT';

/** Message stored in Firestore `messages` collection */
export type MessagesRow = {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_display_name?: string | null;
  sender_avatar_url?: string | null;
  /** Present only for structured coordination signals - not user-typed chat */
  coordination_action?: TripCoordinationAction | null;
};

/** Rating stored in Firestore `ratings` collection */
export type RatingsRow = {
  id: string;
  trip_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  feedback?: string | null;
  created_at: string;
};

/** Report stored in Firestore `reports` collection */
export type ReportsRow = {
  id: string;
  trip_id: string;
  community_id?: string | null;
  community_name?: string | null;
  reporter_id: string;
  reporter_display_name?: string | null;
  reported_id: string;
  reported_display_name?: string | null;
  reason: string;
  context?: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  review_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

/** User block stored in Firestore `user_blocks` collection */
export type UserBlocksRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type NotificationPreferenceKey =
  | 'booking_emails'
  | 'cancellation_emails'
  | 'chat_emails'
  | 'route_alert_emails'
  | 'system_emails'
  | 'marketing_emails';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

/** Notification stored in Firestore `notifications` collection */
export type NotificationsRow = {
  id: string;
  user_id: string;
  type: 'booking' | 'cancellation' | 'message' | 'route_alert' | 'system' | 'marketing';
  title: string;
  body: string;
  is_read: boolean;
  link_url?: string | null;
  dedupe_key?: string | null;
  created_at: string;
};

/** Rider demand signal stored in Firestore `route_requests` collection */
export type RouteRequestsRow = {
  id: string;
  community_id: string;
  user_id: string;
  origin_name: string;
  destination_name: string;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  normalized_origin: string;
  normalized_destination: string;
  request_count?: number;
  active: boolean;
  created_at: string;
  updated_at?: string | null;
  fulfilled_by_trip_id?: string | null;
  fulfilled_at?: string | null;
};

/** Route alert stored in Firestore `route_alerts` collection */
export type RouteAlertsRow = {
  id: string;
  community_id: string;
  user_id: string;
  origin_name: string;
  destination_name: string;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  normalized_origin: string;
  normalized_destination: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  last_notified_at?: string | null;
  last_matched_trip_id?: string | null;
};

export type TrustBadgeKey =
  | 'verified_email'
  | 'active_driver'
  | 'frequent_rider'
  | 'community_member';

export type TrustBadge = {
  key: TrustBadgeKey;
  label: string;
};

export type TrustProfile = {
  user_id: string;
  email_verified: boolean;
  communities_count: number;
  driver_trips_count: number;
  rider_trips_count: number;
  profile_completion: number;
  trust_score: number;
  badges: TrustBadge[];
};

/** Analytics event stored in Firestore `analytics_events` collection */
export type AnalyticsEventsRow = {
  id: string;
  event_name: string;
  user_id: string | null;
  community_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

/** User profile subset used in UI and relations */
export type UserProfile = Pick<
  UsersRow,
  'id' | 'display_name' | 'avatar_url' | 'gender' | 'rating_avg' | 'rating_count'
>;

export type RequiredProfileField =
  | 'display_name'
  | 'phone'
  | 'city_or_area'
  | 'age'
  | 'gender'
  | 'is_driver';

/** Trip with optional driver relation */
export type TripWithDriver = TripsRow & {
  driver: UserProfile | null;
  driver_completed_drives?: number;
  driver_trust_profile?: TrustProfile | null;
};

/** Booking with optional passenger relation */
export type BookingWithPassenger = BookingsRow & {
  passenger?: UserProfile | null;
};

/** Message with optional sender relation */
export type MessageWithSender = MessagesRow & {
  sender: Pick<UserProfile, 'display_name' | 'avatar_url'> | null;
};

/** Search result row shape */
export type TripSearchResult = {
  id: string;
  community_id: string;
  community_name?: string | null;
  community_type?: CommunityType | null;
  driver_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_available: number;
  price_cents: number | null;
  passenger_gender_preference?: TripPassengerGenderPreference | null;
  driver: UserProfile | null;
  driver_received_rating_avg: number;
  driver_received_rating_count: number;
  driver_completed_drives: number;
  driver_trust_profile?: TrustProfile | null;
  origin_dist_m: number;
  dest_dist_m: number;
  time_diff_mins: number;
  score: number;
  // --- Recurring-trip metadata (may be absent on older or one-time trips) ---
  trip_mode?: TripMode;
  recurring_days?: WeekdayIndex[];
  recurring_departure_time?: string;
};

/** Community info */
export type CommunityInfo = {
  id: string;
  name: string;
  description: string | null;
  type: CommunityType;
  membership_mode: CommunityMembershipMode;
  listed: boolean;
  is_system: boolean;
  invite_code: string | null;
};

/** Booking status values */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

/** Trip membership role stored in Firestore `trip_memberships` collection */
export type TripMembershipRole = 'driver' | 'passenger';

/** Trip membership status stored in Firestore `trip_memberships` collection */
export type TripMembershipStatus = 'driver' | 'confirmed' | 'cancelled';

/** Trip membership stored in Firestore `trip_memberships` collection */
export type TripMembershipsRow = {
  trip_id: string;
  user_id: string;
  role: TripMembershipRole;
  status: TripMembershipStatus;
  updated_at: string;
};
