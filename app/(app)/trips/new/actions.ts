'use server';

import type {
  TripMode,
  TripPassengerGenderPreference,
  TripRulePresetKey,
  WeekdayIndex,
} from '@/lib/types';
import { createTrip as createTripService } from '@/lib/services/trip';

export async function createTrip(input: {
  communityId: string;
  /** Omit when geocoding is not available — stored as null in Firestore. */
  originLat?: number | null;
  originLng?: number | null;
  originMeetingPointId?: string | null;
  originName: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationName: string;
  vehicleMakeModel: string;
  vehicleColor?: string | null;
  driverNote?: string | null;
  tripRulePresetKeys?: TripRulePresetKey[];
  tripRulesNote?: string | null;
  passengerGenderPreference?: TripPassengerGenderPreference | null;
  departureTime?: string;
  seatsTotal: number;
  priceCents?: number | null;
  // Recurring fields
  tripMode?: TripMode;
  recurringDays?: WeekdayIndex[];
  recurringDepartureTime?: string;
  routeRequestId?: string | null;
}) {
  return createTripService(input);
}
