'use server';

import { createClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/services/analytics';

export async function ensureUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('users').upsert(
    {
      id: user.id,
      phone: null,
      display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: false }
  );
  await trackEvent('auth_success', { userId: user.id });
}
