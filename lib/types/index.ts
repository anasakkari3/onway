/**
 * Shared domain types for the ride-match app.
 * Re-exports database row types and defines extended types (with relations).
 */

import type { Database, Json } from './database';

// Re-export database types
export type { Database, Json };
export type UsersRow = Database['public']['Tables']['users']['Row'];
export type CommunitiesRow = Database['public']['Tables']['communities']['Row'];
export type CommunityMembersRow = Database['public']['Tables']['community_members']['Row'];
export type TripsRow = Database['public']['Tables']['trips']['Row'];
export type BookingsRow = Database['public']['Tables']['bookings']['Row'];
export type MessagesRow = Database['public']['Tables']['messages']['Row'];
export type RatingsRow = Database['public']['Tables']['ratings']['Row'];
export type AnalyticsEventsRow = Database['public']['Tables']['analytics_events']['Row'];

/** User profile subset used in UI and relations */
export type UserProfile = Pick<UsersRow, 'id' | 'display_name' | 'avatar_url' | 'rating_avg' | 'rating_count'>;

/** Trip with optional driver relation (from getTripById / getTripsByCommunity) */
export type TripWithDriver = TripsRow & {
  driver: UserProfile | null;
};

/** Booking with optional passenger relation (from getBookingsForTrip) */
export type BookingWithPassenger = BookingsRow & {
  passenger?: UserProfile | null;
};

/** Message with optional sender relation (from getMessages) */
export type MessageWithSender = MessagesRow & {
  sender: Pick<UserProfile, 'display_name' | 'avatar_url'> | null;
};

/** Search result row shape (from search_trips RPC) */
export type TripSearchResult = {
  id: string;
  community_id: string;
  driver_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_available: number;
  price_cents: number | null;
  driver_rating_avg: number;
  origin_dist_m: number;
  dest_dist_m: number;
  time_diff_mins: number;
  score: number;
};

/** Community info returned by getCommunityByInviteCode / getFirstCommunity */
export type CommunityInfo = {
  id: string;
  name: string;
};

/** Trip status values used in the app */
export type TripStatus = 'scheduled' | 'cancelled' | 'completed';

/** Booking status values */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
