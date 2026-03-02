'use server';

import { bookSeat as bookSeatService } from '@/lib/services/booking';

export async function bookSeat(tripId: string, seats: number = 1) {
  return bookSeatService(tripId, seats);
}
