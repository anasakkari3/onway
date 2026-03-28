'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { createTrip } from './actions';

type Props = { communityId: string };

export default function CreateTripForm({ communityId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originName, setOriginName] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState(3);
  const [priceCents, setPriceCents] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originName || !destinationName || !departureTime) {
      setError(t('fill_all_fields'));
      return;
    }
    const depDate = new Date(departureTime);
    if (depDate <= new Date()) {
      setError(t('time_in_future'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createTrip({
        communityId,
        originLat: 0,
        originLng: 0,
        originName,
        destinationLat: 0,
        destinationLng: 0,
        destinationName,
        departureTime: depDate.toISOString(),
        seatsTotal,
        priceCents: priceCents ? Math.round(parseFloat(priceCents) * 100) : null,
      });
      router.refresh();
      router.push('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Origin */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('origin_label')}</label>
        <input
          type="text"
          value={originName}
          onChange={(e) => setOriginName(e.target.value)}
          placeholder={t('origin_placeholder')}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          required
        />
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('destination_label')}</label>
        <input
          type="text"
          value={destinationName}
          onChange={(e) => setDestinationName(e.target.value)}
          placeholder={t('destination_placeholder')}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          required
        />
      </div>

      {/* Departure time */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('departure_time_label')}</label>
        <input
          type="datetime-local"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
          required
        />
      </div>

      {/* Seats */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('seats_available_label')}</label>
        <input
          type="number"
          min={1}
          max={10}
          value={seatsTotal}
          onChange={(e) => setSeatsTotal(parseInt(e.target.value, 10) || 1)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('price_optional')}</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={priceCents}
          onChange={(e) => setPriceCents(e.target.value)}
          placeholder="0.00"
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
        {loading ? t('creating') : t('create_trip_btn')}
      </button>
    </form>
  );
}
