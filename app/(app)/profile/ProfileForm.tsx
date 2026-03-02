'use client';

import { useState } from 'react';
import { updateProfile } from './actions';

type Props = {
  userId: string;
  initialDisplayName: string;
  initialAvatarUrl: string;
};

export default function ProfileForm({ userId, initialDisplayName, initialAvatarUrl }: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile(userId, { displayName, avatarUrl });
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </div>
      {success && <p className="text-sm text-green-600">Profile updated.</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
