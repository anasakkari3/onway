'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getCommunityByCode, joinCommunity, createCommunity } from './actions';

export default function CommunityPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'join' | 'create'>('choose');
  const [inviteCode, setInviteCode] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [newInviteCode, setNewInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const community = await getCommunityByCode(inviteCode);
      if (!community) {
        setError('Invalid invite code');
        setLoading(false);
        return;
      }
      await joinCommunity(community.id);
      router.refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createCommunity(communityName, newInviteCode);
      router.refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900 text-center">
          Community
        </h1>

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('join')}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-900 hover:bg-slate-50"
            >
              Join with invite code
            </button>
            <button
              onClick={() => setMode('create')}
              className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700"
            >
              Create a community
            </button>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Invite code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. ABC123"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('choose'); setError(null); }}
              className="w-full text-sm text-slate-500"
            >
              Back
            </button>
          </form>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Community name
            </label>
            <input
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder="e.g. Campus Rides"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              required
            />
            <label className="block text-sm font-medium text-slate-700">
              Invite code (optional)
            </label>
            <input
              type="text"
              value={newInviteCode}
              onChange={(e) => setNewInviteCode(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('choose'); setError(null); }}
              className="w-full text-sm text-slate-500"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
