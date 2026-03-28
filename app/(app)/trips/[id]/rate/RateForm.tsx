'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { submitRating } from './actions';

type Props = { tripId: string; driverId: string };

export default function RateForm({ tripId, driverId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1 || score > 5) return;
    setLoading(true);
    setError(null);
    try {
      await submitRating(tripId, driverId, score);
      router.refresh();
      router.push(`/trips/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_submit_rating'));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            className={`w-10 h-10 rounded-full text-lg font-medium transition-colors ${score >= n ? 'bg-sky-600 dark:bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">{t('poor_great')}</p>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || score < 1}
        className="w-full rounded-lg bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors"
      >
        {loading ? t('submitting') : t('submit_rating')}
      </button>
    </form>
  );
}
