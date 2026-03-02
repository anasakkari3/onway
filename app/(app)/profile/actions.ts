'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateProfile(
  userId: string,
  updates: { displayName: string; avatarUrl: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('users')
    .update({
      display_name: updates.displayName || null,
      avatar_url: updates.avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}
