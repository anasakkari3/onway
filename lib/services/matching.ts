import { createClient } from '@/lib/supabase/server';
import type { TripSearchResult } from '@/lib/types';
import { trackEvent } from './analytics';

export type SearchTripsParams = {
  communityId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  timeStart: string; // ISO
  timeEnd: string;   // ISO
  radiusM?: number;
};

export async function searchTrips(params: SearchTripsParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await trackEvent('trip_search', {
    userId: user.id,
    communityId: params.communityId,
    payload: {
      origin: [params.originLat, params.originLng],
      destination: [params.destinationLat, params.destinationLng],
      time_start: params.timeStart,
      time_end: params.timeEnd,
    },
  });

  const { data, error } = await supabase.rpc('search_trips', {
    p_community_id: params.communityId,
    p_origin_lat: params.originLat,
    p_origin_lng: params.originLng,
    p_dest_lat: params.destinationLat,
    p_dest_lng: params.destinationLng,
    p_time_start: params.timeStart,
    p_time_end: params.timeEnd,
    p_radius_m: params.radiusM ?? 10000,
  });

  if (error) throw error;

  await trackEvent('trip_results_shown', {
    userId: user.id,
    communityId: params.communityId,
    payload: { count: (data as unknown[]).length },
  });

  return data as TripSearchResult[];
}
