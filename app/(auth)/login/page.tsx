'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { setSessionAndSync } from './actions';

type Mode = 'signin' | 'signup';

function LoginContent() {
  const [mode, setMode] = useState<Mode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) {
          await updateProfile(user, { displayName: displayName.trim() });
        }
        const token = await user.getIdToken();
        await setSessionAndSync(token);
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
        const token = await user.getIdToken();
        await setSessionAndSync(token);
      }
      // Hard redirect so the server re-reads the fresh session cookie
      window.location.href = '/app';
    } catch (err: unknown) {
      let message = 'Sign in failed';
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        const msg = (err as { message?: string }).message;
        if (code === 'auth/email-already-in-use') message = 'This email is already registered. Sign in instead.';
        else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') message = 'Invalid email or password.';
        else if (code === 'auth/user-not-found') message = 'No account with this email. Sign up first.';
        else if (msg) message = msg;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-600 text-white text-3xl mb-4 shadow-lg">
          🚗
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Ride Match</h1>
        <p className="text-slate-500 text-sm mt-2">Community-based ride matching</p>
      </div>

      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(null); }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
              Full name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' && (
            <p className="mt-1 text-xs text-slate-500">At least 6 characters</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3.5 font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition-all btn-press"
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="text-xs text-slate-400 text-center">
        {mode === 'signin' ? 'Sign in to join communities and match rides.' : 'Create an account with your email and password.'}
      </p>

      <div className="pt-4 border-t border-slate-200">
        <Link
          href="/"
          className="block w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Continue without signing in →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-50 to-slate-50">
      <Suspense fallback={
        <div className="w-full max-w-sm text-center">
          <div className="animate-pulse text-slate-400">Loading…</div>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
