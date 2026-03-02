'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { submitRating } from './actions';

type Props = { tripId: string; driverId: string };

export default function RateForm({ tripId, driverId }: Props) {
  const router = useRouter();
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
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
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
            className={`w-10 h-10 rounded-full text-lg font-medium ${
              score >= n ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500">1 = Poor, 5 = Great</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || score < 1}
        className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Submit rating'}
      </button>
    </form>
  );
}
