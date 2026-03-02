import { createClient } from '@/lib/supabase/server';

export async function getMessages(tripId: string) {
  const supabase = await createClient();
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, trip_id, sender_id, content, created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!messages?.length) return [];
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', senderIds);
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));
  return messages.map((m) => ({ ...m, sender: userMap.get(m.sender_id) ?? null }));
}

export async function sendMessage(tripId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      trip_id: tripId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
