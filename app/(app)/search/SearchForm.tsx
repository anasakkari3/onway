'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TripSearchResult } from '@/lib/types';
import { searchTripsAction } from './actions';

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
  const [results, setResults] = useState<TripSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [geoLoading, setGeoLoading] = useState<'origin' | 'destination' | null>(null);

  const getLocation = (target: 'origin' | 'destination') => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(target);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (target === 'origin') {
          setOriginLat(latitude);
          setOriginLng(longitude);
          if (!originName) setOriginName('My current location');
        } else {
          setDestinationLat(latitude);
          setDestinationLng(longitude);
          if (!destinationName) setDestinationName('My current location');
        }
        setGeoLoading(null);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setGeoLoading(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityId) {
      setError('You need to join a community first.');
      return;
    }
    const t = dateTime ? new Date(dateTime) : new Date();
    const timeStart = new Date(t.getTime() - 60 * 60 * 1000).toISOString();
    const timeEnd = new Date(t.getTime() + 60 * 60 * 1000).toISOString();
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
        radiusM: 50000,
      });
      setResults(data ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
          <input
            type="text"
            value={originName}
            onChange={(e) => setOriginName(e.target.value)}
            placeholder="Origin address"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <input
                type="number"
                step="any"
                placeholder="Lat"
                value={originLat || ''}
                onChange={(e) => setOriginLat(parseFloat(e.target.value) || 0)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                step="any"
                placeholder="Lng"
                value={originLng || ''}
                onChange={(e) => setOriginLng(parseFloat(e.target.value) || 0)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => getLocation('origin')}
              disabled={geoLoading === 'origin'}
              className="flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {geoLoading === 'origin' ? <span className="animate-pulse-dot">📍</span> : '📍'}
              {geoLoading === 'origin' ? 'Getting…' : 'My location'}
            </button>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
          <input
            type="text"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            placeholder="Destination address"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <input
                type="number"
                step="any"
                placeholder="Lat"
                value={destinationLat || ''}
                onChange={(e) => setDestinationLat(parseFloat(e.target.value) || 0)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                step="any"
                placeholder="Lng"
                value={destinationLng || ''}
                onChange={(e) => setDestinationLng(parseFloat(e.target.value) || 0)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => getLocation('destination')}
              disabled={geoLoading === 'destination'}
              className="flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {geoLoading === 'destination' ? <span className="animate-pulse-dot">📍</span> : '📍'}
              {geoLoading === 'destination' ? 'Getting…' : 'My location'}
            </button>
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Departure time (target)</label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
          <p className="mt-1 text-xs text-slate-500">Trips within ±1 hour will be shown. Leave blank to search around now.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50 transition-colors btn-press"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-slate-900">Results ({results.length})</h2>
          <ul className="space-y-2">
            {results.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow card-hover"
                >
                  <div className="font-medium text-slate-900">{trip.origin_name} → {trip.destination_name}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    {new Date(trip.departure_time).toLocaleString()} · {trip.seats_available} seats
                    {trip.price_cents != null && ` · $${(trip.price_cents / 100).toFixed(2)}`}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">⭐ Driver rating: {trip.driver_rating_avg?.toFixed(1) ?? '—'}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {searched && results.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🚗</div>
          <p className="text-sm text-slate-500">No trips found. Try a different time or location.</p>
          <Link href="/trips/new" className="inline-block mt-3 text-sm text-sky-600 hover:text-sky-700 font-medium">
            Create a trip instead →
          </Link>
        </div>
      )}
    </div>
  );
}
