import { getMyCommunities, getFirstCommunity } from '@/lib/services/community';
import { cookies } from 'next/headers';
import { dictionaries, Lang } from '@/lib/i18n/dictionaries';
import SearchForm from './SearchForm';

export default async function SearchPage() {
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries['en'];
  const t = (key: keyof typeof dictionaries['en']) => (dict as any)[key] || (dictionaries['en'] as any)[key] || key as string;

  const communities = await getMyCommunities();
  const community = getFirstCommunity(communities);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{t('search_trips_title')}</h1>
      <SearchForm communityId={community?.id ?? ''} communityName={community?.name ?? ''} />
    </div>
  );
}
