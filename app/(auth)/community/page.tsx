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
    if (!inviteCode.trim()) {
      setError('Please enter an invite code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const community = await getCommunityByCode(inviteCode);
      if (!community) {
        setError('Invalid invite code. Please check and try again.');
        setLoading(false);
        return;
      }
      await joinCommunity(community.id);
      router.refresh();
      router.push('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityName.trim()) {
      setError('Please enter a community name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createCommunity(communityName, newInviteCode);
      router.refresh();
      router.push('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-50 to-slate-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 text-2xl mb-3">
            👥
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Community
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Join an existing community or create a new one.
          </p>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('join')}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-medium text-slate-900 hover:bg-slate-50 transition-colors card-hover"
            >
              <span className="text-xl">🔑</span>
              <span>Join with invite code</span>
            </button>
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-center gap-3 rounded-xl bg-sky-600 px-4 py-3.5 font-medium text-white hover:bg-sky-700 transition-colors btn-press"
            >
              <span className="text-xl">✨</span>
              <span>Create a community</span>
            </button>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Invite code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. ABC123"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
                required
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50 transition-colors btn-press"
            >
              {loading ? 'Joining…' : 'Join'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('choose'); setError(null); }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Back
            </button>
          </form>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Community name
              </label>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="e.g. Campus Rides"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Invite code (optional)
              </label>
              <input
                type="text"
                value={newInviteCode}
                onChange={(e) => setNewInviteCode(e.target.value)}
                placeholder="Auto-generated if left blank"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
              />
              <p className="mt-1 text-xs text-slate-500">Share this code with others so they can join.</p>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50 transition-colors btn-press"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('choose'); setError(null); }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
