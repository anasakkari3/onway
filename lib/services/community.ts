import { createClient } from '@/lib/supabase/server';
import type { CommunityInfo } from '@/lib/types';

export async function getCommunityByInviteCode(inviteCode: string): Promise<CommunityInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_community_by_invite_code', {
    p_invite_code: inviteCode.trim(),
  });

  if (error) throw error;
  const rows = data as CommunityInfo[];
  return rows[0] ?? null;
}

export async function joinCommunity(communityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase.from('community_members').insert({
    community_id: communityId,
    user_id: user.id,
    role: 'member',
  });

  if (error) throw error;
}

export async function createCommunity(name: string, inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: community, error: err1 } = await supabase
    .from('communities')
    .insert({ name, invite_code: inviteCode })
    .select('id')
    .single();

  if (err1) throw err1;

  const { error: err2 } = await supabase.from('community_members').insert({
    community_id: community.id,
    user_id: user.id,
    role: 'admin',
  });

  if (err2) throw err2;
  return community;
}

export async function getMyCommunities() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('community_members')
    .select(`
      community_id,
      role,
      community:communities(id, name, invite_code)
    `)
    .eq('user_id', user.id);

  if (error) throw error;
  return data ?? [];
}

export function getFirstCommunity(
  data: Awaited<ReturnType<typeof getMyCommunities>>
): CommunityInfo | null {
  const first = data?.[0] as { community?: CommunityInfo | CommunityInfo[] } | undefined;
  if (!first?.community) return null;
  const c = first.community;
  return Array.isArray(c) ? (c[0] ?? null) : c;
}
