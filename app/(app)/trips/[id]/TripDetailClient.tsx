'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { TripWithDriver, BookingWithPassenger } from '@/lib/types';
import { bookSeat, cancelBookingAction, updateTripStatusAction } from './actions';

type Props = {
  trip: TripWithDriver;
  bookings: BookingWithPassenger[];
  currentUserId: string | null;
};

export default function TripDetailClient({ trip: initialTrip, bookings: initialBookings, currentUserId }: Props) {
  const [trip, setTrip] = useState(initialTrip);
  const [bookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-${trip.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${trip.id}` },
        (payload) => {
          const newRow = payload.new as TripWithDriver;
          setTrip((prev) => ({ ...prev, ...newRow }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip.id]);

  const isDriver = currentUserId === trip.driver_id;
  const myBooking = bookings.find((b) => b.passenger_id === currentUserId);
  const hasBooked = !!myBooking;

  const handleBook = async () => {
    setLoading(true);
    setError(null);
    try {
      await bookSeat(trip.id, 1);
      setTrip((prev) => ({ ...prev, seats_available: prev.seats_available - 1 }));
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    }
    setLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!myBooking) return;
    setLoading(true);
    setError(null);
    try {
      await cancelBookingAction(myBooking.id);
      setTrip((prev) => ({ ...prev, seats_available: prev.seats_available + (myBooking.seats ?? 1) }));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
    setLoading(false);
  };

  const handleTripStatus = async (status: 'completed' | 'cancelled') => {
    setStatusLoading(true);
    setError(null);
    try {
      await updateTripStatusAction(trip.id, status);
      setTrip((prev) => ({ ...prev, status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
    }
    setStatusLoading(false);
  };

  const departureDate = new Date(trip.departure_time);
  const isPast = departureDate < new Date();

  return (
    <div className="space-y-4">
      {/* Trip Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            {trip.origin_name} → {trip.destination_name}
          </h1>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${trip.status === 'scheduled' ? 'bg-sky-100 text-sky-700' :
              trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
            }`}>
            {trip.status}
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          <p className="text-slate-600 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {departureDate.toLocaleString()}
          </p>
          <p className="text-slate-600 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            {trip.driver?.display_name ?? 'Unknown'} · ⭐ {trip.driver?.rating_avg?.toFixed(1) ?? '—'}
          </p>
          <p className="text-slate-600 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
            {trip.seats_available} / {trip.seats_total} seats available
            {trip.price_cents != null && ` · $${(trip.price_cents / 100).toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Passengers List */}
      {bookings.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700 mb-2">Passengers ({bookings.length})</h2>
          <ul className="space-y-1">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm text-slate-600">
                <span>{b.passenger?.display_name ?? 'Passenger'}</span>
                <span className="text-slate-400">{b.seats} seat{b.seats > 1 ? 's' : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Book Seat (for passengers) */}
      {!isDriver && trip.status === 'scheduled' && trip.seats_available > 0 && !hasBooked && (
        <>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 transition-colors btn-press"
            >
              Book a seat
            </button>
          ) : (
            <div className="rounded-xl border-2 border-sky-200 bg-sky-50 p-4 space-y-3">
              <p className="text-sm text-sky-900 font-medium">Confirm booking?</p>
              <p className="text-xs text-sky-700">
                You are booking 1 seat on this trip
                {trip.price_cents != null && ` for $${(trip.price_cents / 100).toFixed(2)}`}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleBook}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-sky-600 px-4 py-2.5 font-medium text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Booking…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Already booked */}
      {hasBooked && !isDriver && trip.status === 'scheduled' && (
        <div className="space-y-2">
          <div className="rounded-lg bg-green-50 border border-green-200 p-3">
            <p className="text-sm text-green-700 font-medium">✓ You have a seat on this trip.</p>
          </div>
          <button
            onClick={handleCancelBooking}
            disabled={loading}
            className="w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Cancelling…' : 'Cancel my booking'}
          </button>
        </div>
      )}

      {/* No seats available */}
      {!isDriver && trip.status === 'scheduled' && trip.seats_available === 0 && !hasBooked && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-700">No seats available. Check back later!</p>
        </div>
      )}

      {/* Driver Controls */}
      {isDriver && trip.status === 'scheduled' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Driver controls</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleTripStatus('completed')}
              disabled={statusLoading}
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? '…' : '✓ Complete trip'}
            </button>
            <button
              onClick={() => handleTripStatus('cancelled')}
              disabled={statusLoading}
              className="flex-1 rounded-xl border border-red-300 bg-white px-4 py-3 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? '…' : '✕ Cancel trip'}
            </button>
          </div>
        </div>
      )}

      {/* Trip completed — show rate link */}
      {trip.status === 'completed' && !isDriver && hasBooked && (
        <Link
          href={`/trips/${trip.id}/rate`}
          className="block w-full rounded-xl bg-amber-500 px-4 py-3 text-center font-medium text-white hover:bg-amber-600 transition-colors btn-press"
        >
          ⭐ Rate this trip
        </Link>
      )}
    </div>
  );
}
