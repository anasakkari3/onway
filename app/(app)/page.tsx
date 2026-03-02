import Link from 'next/link';
import { getMyCommunities, getFirstCommunity } from '@/lib/services/community';
import PwaInstallPrompt from './PwaInstallPrompt';

export default async function HomePage() {
  const communities = await getMyCommunities();
  const community = getFirstCommunity(communities);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <PwaInstallPrompt />
      <h1 className="text-xl font-semibold text-slate-900 mb-2">
        {community?.name ?? 'Ride Match'}
      </h1>
      <p className="text-slate-600 text-sm mb-6">
        Create a trip or search for rides in your community.
      </p>
      <div className="grid gap-4">
        <Link
          href="/trips/new"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
        >
          <span className="font-medium text-slate-900">Create a trip</span>
          <span className="text-slate-400">→</span>
        </Link>
        <Link
          href="/search"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
        >
          <span className="font-medium text-slate-900">Search trips</span>
          <span className="text-slate-400">→</span>
        </Link>
      </div>
    </div>
  );
}
