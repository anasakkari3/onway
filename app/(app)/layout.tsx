import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getMyCommunities } from '@/lib/services/community';
import AppNav from './AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Check auth — if this fails, redirect to login
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect('/login');
  }

  if (!user) {
    redirect('/login');
  }

  // 2. Check communities — if this fails, still render the page
  try {
    const communities = await getMyCommunities();
    if (!communities?.length) redirect('/community');
  } catch (err) {
    // Re-throw redirects so they work
    if (err && typeof err === 'object' && 'digest' in err && String((err as { digest?: string }).digest).includes('NEXT_REDIRECT')) {
      throw err;
    }
    // Community query failed — don't block the page, just continue
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <AppNav />
      <main className="flex-1 pt-16 animate-fade-in-up">{children}</main>
    </div>
  );
}
