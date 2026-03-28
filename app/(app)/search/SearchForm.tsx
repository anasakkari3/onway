'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { TripSearchResult } from '@/lib/types';
import { searchTripsAction } from './actions';

type Props = { communityId: string; communityName: string };

type SearchResults = {
  exactMatches: TripSearchResult[];
  recommendations: TripSearchResult[];
};

export default function SearchForm({ communityId, communityName }: Props) {
  const { t } = useTranslation();
  const [originName, setOriginName] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityId) {
      setError(t('join_community_first'));
      return;
    }
    if (!originName.trim() && !destinationName.trim()) {
      setError(t('enter_origin_dest'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchTripsAction({
        communityId,
        originName: originName.trim(),
        destinationName: destinationName.trim(),
      });
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search_failed'));
      setResults(null);
    }
    setLoading(false);
  };

  const TripCard = ({ trip }: { trip: TripSearchResult }) => (
    <Link
      href={`/trips/${trip.id}`}
      className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow card-hover"
    >
      <div className="font-medium text-slate-900 dark:text-white">{trip.origin_name} → {trip.destination_name}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        {new Date(trip.departure_time).toLocaleString()} · {trip.seats_available} {trip.seats_available > 1 ? t('seats_left').split(' ')[0] : t('seat_left').split(' ')[0]}
        {trip.price_cents != null && ` · $${(trip.price_cents / 100).toFixed(2)}`}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
        ⭐ {t('driver_rating')}: {trip.driver_rating_count ? `${trip.driver_rating_avg.toFixed(1)} (${trip.driver_rating_count})` : (trip.driver_rating_avg ? trip.driver_rating_avg.toFixed(1) : '—')}
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('from')}</label>
          <input
            type="text"
            value={originName}
            onChange={(e) => setOriginName(e.target.value)}
            placeholder={t('origin_placeholder')}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('to')}</label>
          <input
            type="text"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            placeholder={t('destination_placeholder')}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors btn-press"
        >
          {loading ? t('searching') : t('search')}
        </button>
      </form>

      {/* Exact Results */}
      {results && results.exactMatches.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-slate-900 dark:text-white">{t('matching_trips')} ({results.exactMatches.length})</h2>
          <ul className="space-y-2">
            {results.exactMatches.map((trip) => (
              <li key={trip.id}><TripCard trip={trip} /></li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {results && results.recommendations.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-slate-800 dark:text-slate-200">
            {results.exactMatches.length > 0 ? t('similar_routes_alt') : t('suggested_trips')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('similar_routes_desc')}</p>
          <ul className="space-y-2">
            {results.recommendations.map((trip) => (
              <li key={trip.id}><TripCard trip={trip} /></li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {searched && results && results.exactMatches.length === 0 && results.recommendations.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🚗</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_trips_found_route')}</p>
          <Link href="/trips/new" className="inline-block mt-3 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium">
            {t('create_trip_instead_arrow')}
          </Link>
        </div>
      )}
    </div>
  );
}
