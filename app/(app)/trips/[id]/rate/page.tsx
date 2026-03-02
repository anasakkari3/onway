import { notFound } from 'next/navigation';
import { getTripById } from '@/lib/services/trip';
import RateForm from './RateForm';
import { submitRating } from './actions';

export default async function RateTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let trip;
  try {
    trip = await getTripById(id);
  } catch {
    notFound();
  }
  if (!trip || trip.status !== 'completed') notFound();

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Rate this trip</h1>
      <p className="text-slate-600 text-sm mb-4">
        How was your experience with {trip.driver?.display_name ?? 'the driver'}?
      </p>
      <RateForm tripId={id} driverId={trip.driver_id} />
    </div>
  );
}
