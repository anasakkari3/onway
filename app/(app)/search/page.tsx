import { getMyCommunities, getFirstCommunity } from '@/lib/services/community';
import SearchForm from './SearchForm';

export default async function SearchPage() {
  const communities = await getMyCommunities();
  const community = getFirstCommunity(communities);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Search trips</h1>
      <SearchForm communityId={community?.id ?? ''} communityName={community?.name ?? ''} />
    </div>
  );
}
