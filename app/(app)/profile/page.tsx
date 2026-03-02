import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, rating_avg, rating_count')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Profile</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-4">
        <p className="text-slate-600 text-sm">
          Rating: {profile?.rating_avg?.toFixed(1) ?? '—'} ({profile?.rating_count ?? 0} ratings)
        </p>
      </div>
      <ProfileForm
        userId={user.id}
        initialDisplayName={profile?.display_name ?? ''}
        initialAvatarUrl={profile?.avatar_url ?? ''}
      />
    </div>
  );
}
