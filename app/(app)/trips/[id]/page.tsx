import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getTripById } from '@/lib/services/trip';
import { getBookingsForTrip } from '@/lib/services/booking';
import { trackEvent } from '@/lib/services/analytics';
import TripDetailClient from './TripDetailClient';
import { bookSeat } from './actions';

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let trip;
  let bookings;
  try {
    trip = await getTripById(id);
    bookings = await getBookingsForTrip(id);
  } catch {
    notFound();
  }
  if (!trip || trip.status !== 'scheduled') notFound();
  await trackEvent('trip_opened', { userId: user?.id, payload: { trip_id: id } });

  return (
    <div className="p-4 max-w-lg mx-auto">
      <TripDetailClient
        trip={trip}
        bookings={bookings ?? []}
        currentUserId={user?.id ?? null}
      />
      <div className="mt-4 flex gap-2">
        <Link
          href={`/trips/${id}/chat`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Chat
        </Link>
      </div>
    </div>
  );
}
