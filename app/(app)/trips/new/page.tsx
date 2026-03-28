import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { dictionaries, Lang } from '@/lib/i18n/dictionaries';
import { getMyCommunities, getFirstCommunity } from '@/lib/services/community';
import CreateTripForm from './CreateTripForm';

export default async function NewTripPage() {
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries['en'];
  const t = (key: keyof typeof dictionaries['en']) => (dict as any)[key] || (dictionaries['en'] as any)[key] || key as string;

  const communities = await getMyCommunities();
  const community = getFirstCommunity(communities);
  if (!community) redirect('/community');

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{t('create_new_trip')}</h1>
      <CreateTripForm communityId={community.id} />
    </div>
  );
}
