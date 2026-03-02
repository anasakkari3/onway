'use server';

import { createTrip as createTripService } from '@/lib/services/trip';

export async function createTrip(input: {
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
}) {
  return createTripService(input);
}
