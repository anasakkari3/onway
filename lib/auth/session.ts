import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';

const AUTH_COOKIE_NAME = 'firebase-session';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export async function setSession(idToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      id: decoded.uid,
      email: decoded.email ?? null,
      displayName: (decoded.name as string) ?? null,
      photoURL: (decoded.picture as string) ?? null,
    };
  } catch {
    return null;
  }
}
