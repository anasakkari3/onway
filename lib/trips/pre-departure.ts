import type {
  PreDepartureConfirmation,
  PreDepartureConfirmationState,
  TripsRow,
} from '@/lib/types';
import { getEffectiveTripStatus, isActiveTripStatus } from './lifecycle';

export const PRE_DEPARTURE_CONFIRMATION_WINDOW_MINUTES = 30;
const MINUTE_MS = 60 * 1000;

type PreDepartureTripTarget = Pick<
  TripsRow,
  'departure_time' | 'status' | 'seats_available'
>;

export type PreDepartureConfirmationResponse = Extract<
  PreDepartureConfirmationState,
  'confirmed' | 'not_confirmed'
>;

export function getPreDepartureWindow(
  trip: Pick<TripsRow, 'departure_time'>,
  now: Date = new Date()
) {
  const departureTime = new Date(trip.departure_time);
  const departureMs = departureTime.getTime();
  const nowMs = now.getTime();
  const opensAtMs =
    departureMs - PRE_DEPARTURE_CONFIRMATION_WINDOW_MINUTES * MINUTE_MS;

  return {
    opensAt: new Date(opensAtMs),
    expiresAt: departureTime,
    isBeforeWindow: nowMs < opensAtMs,
    isOpen: nowMs >= opensAtMs && nowMs <= departureMs,
    isExpired: nowMs > departureMs,
    minutesUntilOpen: Math.max(0, Math.ceil((opensAtMs - nowMs) / MINUTE_MS)),
    minutesUntilDeparture: Math.max(0, Math.ceil((departureMs - nowMs) / MINUTE_MS)),
  };
}

export function isPreDepartureConfirmationActionOpen(
  trip: PreDepartureTripTarget,
  now: Date = new Date()
) {
  const status = getEffectiveTripStatus(trip);
  return isActiveTripStatus(status) && getPreDepartureWindow(trip, now).isOpen;
}

export function getPreDepartureConfirmationState(
  confirmation: PreDepartureConfirmation | null | undefined,
  trip: PreDepartureTripTarget,
  now: Date = new Date()
): PreDepartureConfirmationState {
  if (confirmation?.state === 'confirmed' || confirmation?.state === 'not_confirmed') {
    return confirmation.state;
  }

  if (confirmation?.state === 'expired') {
    return 'expired';
  }

  return getPreDepartureWindow(trip, now).isExpired ? 'expired' : 'pending';
}

export function buildPendingPreDepartureConfirmation(
  nowIso: string
): PreDepartureConfirmation {
  return {
    state: 'pending',
    prompted_at: nowIso,
    responded_at: null,
    confirmed_at: null,
    not_confirmed_at: null,
    expired_at: null,
    updated_at: nowIso,
  };
}

export function buildPreDepartureConfirmationResponse(
  response: PreDepartureConfirmationResponse,
  nowIso: string,
  previous?: PreDepartureConfirmation | null
): PreDepartureConfirmation {
  return {
    state: response,
    prompted_at: previous?.prompted_at ?? null,
    responded_at: nowIso,
    confirmed_at: response === 'confirmed' ? nowIso : null,
    not_confirmed_at: response === 'not_confirmed' ? nowIso : null,
    expired_at: null,
    updated_at: nowIso,
  };
}

export function buildExpiredPreDepartureConfirmation(
  nowIso: string,
  previous?: PreDepartureConfirmation | null
): PreDepartureConfirmation {
  if (previous?.state === 'confirmed' || previous?.state === 'not_confirmed') {
    return previous;
  }

  return {
    state: 'expired',
    prompted_at: previous?.prompted_at ?? null,
    responded_at: previous?.responded_at ?? null,
    confirmed_at: null,
    not_confirmed_at: null,
    expired_at: previous?.expired_at ?? nowIso,
    updated_at: nowIso,
  };
}
