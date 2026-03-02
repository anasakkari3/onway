import { createClient } from '@/lib/supabase/server';
import { trackEvent } from './analytics';

export async function submitRating(tripId: string, ratedUserId: string, score: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  if (score < 1 || score > 5) throw new Error('Score must be 1-5');

  const { error } = await supabase.from('ratings').insert({
    trip_id: tripId,
    rater_id: user.id,
    rated_id: ratedUserId,
    score,
  });

  if (error) throw error;

  await trackEvent('rating_submitted', {
    userId: user.id,
    payload: { trip_id: tripId, rated_id: ratedUserId, score },
  });
}
