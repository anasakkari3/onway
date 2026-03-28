'use server';

import { searchTrips } from '@/lib/services/matching';

export async function searchTripsAction(params: {
  communityId: string;
  originName: string;
  destinationName: string;
}) {
  return searchTrips(params);
}
