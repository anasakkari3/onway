import { requireCompletedProfile } from '@/lib/auth/onboarding';
import OnboardingTour from '@/components/OnboardingTour';
import AppNav from './AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCompletedProfile('/app');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900/80">
      <AppNav />
      <main className="flex-1 pt-16 animate-fade-in-up">{children}</main>
      {/* First-time user tour — client-side, reads localStorage */}
      <OnboardingTour />
    </div>
  );
}
