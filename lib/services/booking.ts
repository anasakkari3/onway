import { createClient } from '@/lib/supabase/server';
import type { BookingWithPassenger } from '@/lib/types';
import { trackEvent } from './analytics';

export async function bookSeat(tripId: string, seats: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await trackEvent('booking_attempted', {
    userId: user.id,
    payload: { trip_id: tripId, seats },
  });

  const { data, error } = await supabase.rpc('book_seat', {
    p_trip_id: tripId,
    p_passenger_id: user.id,
    p_seats: seats,
  });

  if (error) throw error;

  const result = data as { success: boolean; error?: string; booking_id?: string; seats_available?: number };
  if (!result.success) {
    throw new Error(result.error ?? 'Booking failed');
  }

  await trackEvent('booking_confirmed', {
    userId: user.id,
    payload: { trip_id: tripId, booking_id: result.booking_id },
  });

  return result;
}

export async function getBookingsForTrip(tripId: string): Promise<BookingWithPassenger[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      passenger:users!bookings_passenger_id_fkey(id, display_name, avatar_url)
    `)
    .eq('trip_id', tripId)
    .eq('status', 'confirmed');

  if (error) throw error;
  return data;
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId });

  if (error) throw error;
  const result = data as { success: boolean; error?: string };
  if (!result.success) throw new Error(result.error ?? 'Cancel failed');
}
