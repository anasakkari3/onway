'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import type { TripWithDriver, BookingWithPassenger } from '@/lib/types';
import { bookSeat, cancelBookingAction, updateTripStatusAction } from './actions';

type Props = {
  trip: TripWithDriver;
  bookings: BookingWithPassenger[];
  currentUserId: string | null;
};

export default function TripDetailClient({ trip: initialTrip, bookings: initialBookings, currentUserId }: Props) {
  const { t } = useTranslation();
  const [trip, setTrip] = useState(initialTrip);
  const [bookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const tripRef = doc(db, 'trips', trip.id);
    const unsubscribe = onSnapshot(
      tripRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setTrip((prev) => ({ ...prev, ...data, id: snapshot.id }));
        }
      },
      (err) => {
        // Handle permission errors gracefully instead of crashing
        console.warn('Trip subscription error (likely security rules):', err.message);
      }
    );
    return () => unsubscribe();
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
      {/* Enhanced Trip Info Header */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-6">
        {/* Route Map Placeholder Header */}
        <div className="h-32 bg-slate-100 dark:bg-slate-800 relative w-full overflow-hidden flex flex-col justify-end p-4">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] mix-blend-overlay"></div>
          <div className="absolute top-4 right-4 z-10">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm ${trip.status === 'scheduled' ? 'bg-sky-500 text-white' :
              trip.status === 'completed' ? 'bg-green-500 text-white' :
                'bg-red-500 text-white'
              }`}>
              {trip.status === 'scheduled' ? t('scheduled') : trip.status === 'completed' ? t('completed') : t('cancelled')}
            </span>
          </div>

          <div className="relative z-10">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white drop-shadow-sm flex items-center gap-2">
              {trip.origin_name}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 rtl:rotate-180"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              {trip.destination_name}
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
              {new Date(trip.departure_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Driver Profile Section */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {trip.driver?.avatar_url ? (
              <img src={trip.driver?.avatar_url} alt="Driver" className="w-14 h-14 rounded-full border-2 border-slate-100 dark:border-slate-700 object-cover shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-900/30 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl text-sky-600 shadow-sm">
                🚗
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest leading-tight mb-0.5">{t('driver')}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">
                {trip.driver?.display_name ?? t('unknown')}
              </p>
            </div>
          </div>
          <div className="flex bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl gap-3 text-center self-start sm:self-auto w-full sm:w-auto">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-0.5">Rating</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1">
                ⭐ {trip.driver?.rating_count ? `${Number(trip.driver.rating_avg).toFixed(1)} (${trip.driver.rating_count})` : 'No ratings yet'}
              </p>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-0.5">Trips</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {(trip.driver?.rating_count ?? 0) > 0 ? 'Veteran' : 'New'}
              </p>
            </div>
          </div>
        </div>

        {/* Ride Details / Seat Availability */}
        <div className="bg-slate-50/50 dark:bg-slate-900/50 p-5 flex flex-col sm:flex-row gap-6 justify-between items-center text-center sm:text-left">
          <div>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mb-1">{trip.seats_available}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('seats_available')}</p>
          </div>
          {trip.price_cents != null && (
            <div className="w-full sm:w-px h-px sm:h-10 bg-slate-200 dark:bg-slate-700"></div>
          )}
          {trip.price_cents != null && (
            <div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">${(trip.price_cents / 100).toFixed(2)}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pricing</p>
            </div>
          )}
        </div>
      </div>

      {/* Passengers List */}
      {bookings.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span className="text-lg">👥</span> {t('passengers')} ({bookings.length})
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs">👤</div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{b.passenger?.display_name ?? t('passenger')}</span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{b.seats} {b.seats > 1 ? t('seats_left').split(' ')[0] : t('seat_left').split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-4 mb-6">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Book Seat (for passengers) */}
      {!isDriver && trip.status === 'scheduled' && trip.seats_available > 0 && !hasBooked && (
        <>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press"
            >
              {t('book_seat')}
            </button>
          ) : (
            <div className="rounded-xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 p-4 space-y-3">
              <p className="text-sm text-sky-900 dark:text-sky-100 font-medium">{t('confirm_booking_title')}</p>
              <p className="text-xs text-sky-700 dark:text-sky-300">
                {t('confirm_booking_desc1')}
                {trip.price_cents != null && ` ${t('confirm_booking_desc2')} $${(trip.price_cents / 100).toFixed(2)}`}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleBook}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-sky-600 dark:bg-sky-500 px-4 py-2.5 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? t('booking') : t('confirm')}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Already booked */}
      {hasBooked && !isDriver && trip.status === 'scheduled' && (
        <div className="space-y-2">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 p-3">
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t('you_have_seat')}</p>
          </div>
          <button
            onClick={handleCancelBooking}
            disabled={loading}
            className="w-full rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
          >
            {loading ? t('cancelling') : t('cancel_my_booking')}
          </button>
        </div>
      )}

      {/* No seats available */}
      {!isDriver && trip.status === 'scheduled' && trip.seats_available === 0 && !hasBooked && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50 p-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">{t('no_seats')}</p>
        </div>
      )}

      {/* Driver Controls */}
      {isDriver && trip.status === 'scheduled' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{t('driver_controls')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleTripStatus('completed')}
              disabled={statusLoading}
              className="flex-1 rounded-xl bg-green-600 dark:bg-green-500 px-4 py-3 font-medium text-white hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? '…' : t('complete_trip')}
            </button>
            <button
              onClick={() => handleTripStatus('cancelled')}
              disabled={statusLoading}
              className="flex-1 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 px-4 py-3 font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? '…' : t('cancel_trip')}
            </button>
          </div>
        </div>
      )}

      {/* Trip completed — show rate link */}
      {trip.status === 'completed' && !isDriver && hasBooked && (
        <Link
          href={`/trips/${trip.id}/rate`}
          className="block w-full rounded-xl bg-amber-500 dark:bg-amber-600 px-4 py-3 text-center font-medium text-white hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors btn-press"
        >
          {t('rate_trip')}
        </Link>
      )}
    </div>
  );
}
