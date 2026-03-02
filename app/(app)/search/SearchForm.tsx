'use client';

import { useState } from 'react';
import Link from 'next/link';
import { searchTripsAction } from './actions';

type TripResult = {
  id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_available: number;
  price_cents: number | null;
  driver_rating_avg: number;
  origin_dist_m: number;
  dest_dist_m: number;
  score: number;
};

type Props = { communityId: string; communityName: string };

export default function SearchForm({ communityId, communityName }: Props) {
  const [originName, setOriginName] = useState('');
  const [originLat, setOriginLat] = useState<number>(0);
  const [originLng, setOriginLng] = useState<number>(0);
  const [destinationName, setDestinationName] = useState('');
  const [destinationLat, setDestinationLat] = useState<number>(0);
  const [destinationLng, setDestinationLng] = useState<number>(0);
  const [dateTime, setDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TripResult[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityId) return;
    const t = dateTime ? new Date(dateTime) : new Date();
    const timeStart = new Date(t.getTime() - 20 * 60 * 1000).toISOString();
    const timeEnd = new Date(t.getTime() + 20 * 60 * 1000).toISOString();
    setLoading(true);
    setError(null);
    try {
      const data = await searchTripsAction({
        communityId,
        originLat: originLat || 0,
        originLng: originLng || 0,
        destinationLat: destinationLat || 0,
        destinationLng: destinationLng || 0,
        timeStart,
        timeEnd,
        radiusM: 10000,
      });
      setResults(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
          <input
            type="text"
            value={originName}
            onChange={(e) => setOriginName(e.target.value)}
            placeholder="Origin address"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Lat"
              value={originLat || ''}
              onChange={(e) => setOriginLat(parseFloat(e.target.value) || 0)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="any"
              placeholder="Lng"
              value={originLng || ''}
              onChange={(e) => setOriginLng(parseFloat(e.target.value) || 0)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
          <input
            type="text"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            placeholder="Destination address"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Lat"
              value={destinationLat || ''}
              onChange={(e) => setDestinationLat(parseFloat(e.target.value) || 0)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="any"
              placeholder="Lng"
              value={destinationLng || ''}
              onChange={(e) => setDestinationLng(parseFloat(e.target.value) || 0)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Departure time (target)</label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
          <p className="mt-1 text-xs text-slate-500">Trips within ±20 minutes will be shown.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-slate-900">Results ({results.length})</h2>
          <ul className="space-y-2">
            {results.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50"
                >
                  <div className="font-medium text-slate-900">{trip.origin_name} → {trip.destination_name}</div>
                  <div className="text-sm text-slate-600">
                    {new Date(trip.departure_time).toLocaleString()} · {trip.seats_available} seats
                    {trip.price_cents != null && ` · $${(trip.price_cents / 100).toFixed(2)}`}
                  </div>
                  <div className="text-xs text-slate-500">Driver rating: {trip.driver_rating_avg?.toFixed(1) ?? '—'}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {results.length === 0 && !loading && (originName || destinationName || dateTime) && (
        <p className="text-sm text-slate-500">No trips found. Try a different time or location.</p>
      )}
    </div>
  );
}
