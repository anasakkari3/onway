'use server';

import { searchTrips } from '@/lib/services/matching';

export async function searchTripsAction(params: {
  communityId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  timeStart: string;
  timeEnd: string;
  radiusM?: number;
}) {
  return searchTrips(params);
}
