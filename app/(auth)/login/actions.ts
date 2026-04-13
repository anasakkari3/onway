'use server';

import { clearSession, setSession } from '@/lib/auth/session';
import { getPostAuthRedirectPath } from '@/lib/auth/onboarding';
import { getAdminAuth } from '@/lib/firebase/admin';
import { ensureUserProfile } from '@/lib/services/user';

export async function setSessionAndSync(
  idToken: string,
  options?: { remember?: boolean; next?: string | null }
) {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  if (decoded.email_verified !== true) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  await setSession(idToken, { remember: options?.remember });
  try {
    await ensureUserProfile(idToken);
  } catch {
    // Profile sync is best-effort; the session is already established.
  }

  return {
    redirectPath: await getPostAuthRedirectPath(decoded.uid, options?.next ?? null),
  };
}

export async function signOut() {
  await clearSession();
}
