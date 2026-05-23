import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTripById } from '@/lib/services/trip';
import { hasUserRatedTrip } from '@/lib/services/rating';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';
import RateForm from './RateForm';

const RATE_COPY = {
  en: {
    alreadyRated: 'Already Rated',
    alreadyRatedDesc: 'You have already submitted a rating for this trip.',
    ratingHint: 'Keep it simple: choose a score and add a short note only if it helps.',
  },
  ar: {
    alreadyRated: 'سبق لك التقييم',
    alreadyRatedDesc: 'لقد قدّمت تقييمًا لهذه الرحلة من قبل.',
    ratingHint: 'بسيط جداً: اختر تقييمًا وأضف ملاحظة قصيرة فقط إذا أردت.',
  },
  he: {
    alreadyRated: 'כבר דירגתם',
    alreadyRatedDesc: 'כבר הגשתם דירוג לנסיעה הזאת.',
    ratingHint: 'פשוט: בחרו ציון והוסיפו הערה קצרה רק אם זה עוזר.',
  },
} as const;

export default async function RateTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries['en'];
  const rateCopy = RATE_COPY[lang] ?? RATE_COPY.en;
  const t = (key: keyof typeof dictionaries['en']) => translate(dict, key);
  let trip;
  try {
    trip = await getTripById(id);
  } catch {
    notFound();
  }
  if (!trip || trip.status !== 'completed') notFound();

  const alreadyRated = await hasUserRatedTrip(id);
  if (alreadyRated) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center mt-20">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{rateCopy.alreadyRated}</h1>
        <p className="text-slate-600 dark:text-slate-400">{rateCopy.alreadyRatedDesc}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{t('rate_trip')}</h1>
      <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
        {t('how_was_experience')} {trip.driver?.display_name ?? t('the_driver')}?
      </p>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {rateCopy.ratingHint}
        </p>
      </div>
      <RateForm tripId={id} driverId={trip.driver_id} />
    </div>
  );
}
