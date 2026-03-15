import { createClient } from '@/lib/supabase/server';
import type { TripWithDriver } from '@/lib/types';
import { trackEvent } from './analytics';

export type CreateTripInput = {
  communityId: string;
  originLat: number;
  originLng: number;
  originName: string;
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  departureTime: string;
  seatsTotal: number;
  priceCents?: number | null;
};

export async function createTrip(input: CreateTripInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('trips')
    .insert({
      community_id: input.communityId,
      driver_id: user.id,
      origin_lat: input.originLat,
      origin_lng: input.originLng,
      origin_name: input.originName,
      destination_lat: input.destinationLat,
      destination_lng: input.destinationLng,
      destination_name: input.destinationName,
      departure_time: input.departureTime,
      seats_total: input.seatsTotal,
      seats_available: input.seatsTotal,
      price_cents: input.priceCents ?? null,
      status: 'scheduled',
    })
    .select('id')
    .single();

  if (error) throw error;
  await trackEvent('trip_created', {
    userId: user.id,
    communityId: input.communityId,
    payload: { trip_id: data.id },
  });
  return data;
}

export async function getTripById(tripId: string): Promise<TripWithDriver> {
  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error || !trip) throw error ?? new Error('Trip not found');
  const { data: driver } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, rating_avg, rating_count')
    .eq('id', trip.driver_id)
    .single();
  return { ...trip, driver: driver ?? null };
}

export async function getTripsByCommunity(communityId: string): Promise<TripWithDriver[]> {
  const supabase = await createClient();
  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .eq('community_id', communityId)
    .eq('status', 'scheduled')
    .order('departure_time', { ascending: true });

  if (error) throw error;
  if (!trips?.length) return [];
  const driverIds = [...new Set(trips.map((t) => t.driver_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, rating_avg')
    .in('id', driverIds);
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));
  return trips.map((t) => ({ ...t, driver: userMap.get(t.driver_id) ?? null }));
}

export async function updateTripStatus(tripId: string, status: 'scheduled' | 'cancelled' | 'completed') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('trips')
    .update({ status })
    .eq('id', tripId)
    .eq('driver_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (status === 'completed') {
    await trackEvent('trip_completed', { userId: user.id, payload: { trip_id: tripId } });
  }
  return data;
}
