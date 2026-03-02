'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { bookSeat } from './actions';

type Trip = {
  id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_available: number;
  seats_total: number;
  price_cents: number | null;
  status: string;
  driver_id: string;
  driver: { id: string; display_name: string | null; rating_avg: number } | null;
};

type Props = {
  trip: Trip;
  bookings: Array<{ id: string; seats: number; passenger?: { display_name: string | null } }>;
  currentUserId: string | null;
};

export default function TripDetailClient({ trip: initialTrip, bookings, currentUserId }: Props) {
  const [trip, setTrip] = useState(initialTrip);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-${trip.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${trip.id}` },
        (payload) => {
          const newRow = payload.new as Trip;
          setTrip((prev) => ({ ...prev, ...newRow }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip.id]);

  const isDriver = currentUserId === trip.driver_id;
  const hasBooked = bookings.some((b) => (b as { passenger_id?: string }).passenger_id === currentUserId);

  const handleBook = async () => {
    setLoading(true);
    setError(null);
    try {
      await bookSeat(trip.id, 1);
      setTrip((prev) => ({ ...prev, seats_available: prev.seats_available - 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          {trip.origin_name} → {trip.destination_name}
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          {new Date(trip.departure_time).toLocaleString()}
        </p>
        <p className="text-slate-600 text-sm">
          Driver: {trip.driver?.display_name ?? 'Unknown'} · Rating: {trip.driver?.rating_avg?.toFixed(1) ?? '—'}
        </p>
        <p className="text-slate-600 text-sm">
          Seats: {trip.seats_available} / {trip.seats_total}
          {trip.price_cents != null && ` · $${(trip.price_cents / 100).toFixed(2)}`}
        </p>
      </div>
      {!isDriver && trip.seats_available > 0 && !hasBooked && (
        <>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? 'Booking…' : 'Book a seat'}
          </button>
        </>
      )}
      {hasBooked && !isDriver && (
        <p className="text-sm text-green-600">You have a seat on this trip.</p>
      )}
    </div>
  );
}
