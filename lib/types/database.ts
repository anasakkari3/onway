export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string | null;
          display_name: string | null;
          avatar_url: string | null;
          rating_avg: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      communities: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['communities']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['communities']['Insert']>;
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['community_members']['Row'], 'joined_at'> & {
          joined_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_members']['Insert']>;
      };
      trips: {
        Row: {
          id: string;
          community_id: string;
          driver_id: string;
          origin_lat: number;
          origin_lng: number;
          origin_name: string;
          destination_lat: number;
          destination_lng: number;
          destination_name: string;
          departure_time: string;
          seats_total: number;
          seats_available: number;
          price_cents: number | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'seats_available'> & {
          id?: string;
          created_at?: string;
          seats_available?: number;
        };
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          trip_id: string;
          passenger_id: string;
          seats: number;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          trip_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      ratings: {
        Row: {
          id: string;
          trip_id: string;
          rater_id: string;
          rated_id: string;
          score: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ratings']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
      };
      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          user_id: string | null;
          community_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['analytics_events']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['analytics_events']['Insert']>;
      };
    };
  };
}
