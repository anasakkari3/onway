import { requireCompletedProfile } from '@/lib/auth/onboarding';
import AppNav from './AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCompletedProfile('/app');

  return (
    <div className="min-h-screen flex flex-col app-shell">
      <AppNav />
      <main className="app-main flex-1 animate-fade-in-up">{children}</main>
    </div>
  );
}
