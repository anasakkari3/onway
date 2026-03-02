import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyCommunities } from '@/lib/services/community';
import AppNav from './AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Skip auth for now – allow unauthenticated access to home; fix auth later
    if (!user) {
      return (
        <div className="min-h-screen flex flex-col bg-slate-50 pb-16 md:pb-0">
          <main className="flex-1">{children}</main>
          <AppNav />
        </div>
      );
    }
    const communities = await getMyCommunities();
    if (!communities?.length) redirect('/community');

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 pb-16 md:pb-0">
        <main className="flex-1">{children}</main>
        <AppNav />
      </div>
    );
  } catch {
    redirect('/login');
  }
}
