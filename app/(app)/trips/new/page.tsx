import { redirect } from 'next/navigation';
import { getMyCommunities, getFirstCommunity } from '@/lib/services/community';
import CreateTripForm from './CreateTripForm';

export default async function NewTripPage() {
  const communities = await getMyCommunities();
  const community = getFirstCommunity(communities);
  if (!community) redirect('/community');

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Create a trip</h1>
      <CreateTripForm communityId={community.id} />
    </div>
  );
}
