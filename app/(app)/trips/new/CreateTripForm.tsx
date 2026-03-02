'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createTrip } from './actions';

type Props = { communityId: string };

export default function CreateTripForm({ communityId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originName, setOriginName] = useState('');
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [departureTime, setDepartureTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState(3);
  const [priceCents, setPriceCents] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originName || !destinationName || !departureTime) {
      setError('Please fill origin, destination, and departure time.');
      return;
    }
    const latO = originLat ?? 0;
    const lngO = originLng ?? 0;
    const latD = destinationLat ?? 0;
    const lngD = destinationLng ?? 0;
    setLoading(true);
    setError(null);
    try {
      await createTrip({
        communityId,
        originLat: latO,
        originLng: lngO,
        originName,
        destinationLat: latD,
        destinationLng: lngD,
        destinationName,
        departureTime: new Date(departureTime).toISOString(),
        seatsTotal,
        priceCents: priceCents ? Math.round(parseFloat(priceCents) * 100) : null,
      });
      router.refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Origin</label>
        <input
          type="text"
          value={originName}
          onChange={(e) => setOriginName(e.target.value)}
          placeholder="Address or place name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          required
        />
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder="Lat"
            value={originLat ?? ''}
            onChange={(e) => setOriginLat(e.target.value ? parseFloat(e.target.value) : null)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            step="any"
            placeholder="Lng"
            value={originLng ?? ''}
            onChange={(e) => setOriginLng(e.target.value ? parseFloat(e.target.value) : null)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
        <input
          type="text"
          value={destinationName}
          onChange={(e) => setDestinationName(e.target.value)}
          placeholder="Address or place name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          required
        />
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder="Lat"
            value={destinationLat ?? ''}
            onChange={(e) => setDestinationLat(e.target.value ? parseFloat(e.target.value) : null)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            step="any"
            placeholder="Lng"
            value={destinationLng ?? ''}
            onChange={(e) => setDestinationLng(e.target.value ? parseFloat(e.target.value) : null)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Departure time</label>
        <input
          type="datetime-local"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Seats available</label>
        <input
          type="number"
          min={1}
          max={10}
          value={seatsTotal}
          onChange={(e) => setSeatsTotal(parseInt(e.target.value, 10) || 1)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Price (optional, $)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={priceCents}
          onChange={(e) => setPriceCents(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create trip'}
      </button>
    </form>
  );
}
