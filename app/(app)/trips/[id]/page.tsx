import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getTripById } from '@/lib/services/trip';
import { getBookingsForTrip } from '@/lib/services/booking';
import { trackEvent } from '@/lib/services/analytics';
import { dictionaries, Lang } from '@/lib/i18n/dictionaries';
import TripDetailClient from './TripDetailClient';

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries['en'];
  const t = (key: keyof typeof dictionaries['en']) => (dict as any)[key] || (dictionaries['en'] as any)[key] || key as string;

  const user = await getCurrentUser();
  let trip;
  let bookings;
  try {
    trip = await getTripById(id);
    bookings = await getBookingsForTrip(id);
  } catch {
    notFound();
  }
  if (!trip) notFound();

  try {
    await trackEvent('trip_opened', { userId: user?.id, payload: { trip_id: id } });
  } catch {
    // Analytics event - non-critical, ignore errors
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <TripDetailClient
        trip={trip}
        bookings={bookings ?? []}
        currentUserId={user?.id ?? null}
      />
      <div className="mt-4 flex gap-2">
        <Link
          href={`/trips/${id}/chat`}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors card-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          {t('chat')}
        </Link>
        <Link
          href="/app"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
