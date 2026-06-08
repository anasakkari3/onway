'use server';

import { clearSession, setSession } from '@/lib/auth/session';
import { getPostAuthRedirectPath } from '@/lib/auth/onboarding';
import { getAdminAuth } from '@/lib/firebase/admin';
import { ensureUserProfile } from '@/lib/services/user';
import { logSystemError, trackEvent } from '@/lib/services/analytics';

export async function setSessionAndSync(
  idToken: string,
  options?: { remember?: boolean; next?: string | null }
) {
  try {
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

    await trackEvent('login_success', {
      userId: decoded.uid,
      status: 'success',
      metadata: { emailVerified: decoded.email_verified === true },
    });
    await trackEvent('auth_success', {
      userId: decoded.uid,
      status: 'success',
      metadata: { emailVerified: decoded.email_verified === true },
    });

    return {
      redirectPath: await getPostAuthRedirectPath(decoded.uid, options?.next ?? null),
    };
  } catch (error) {
    await trackEvent('login_failed', {
      status: 'failed',
      metadata: { reason: error instanceof Error ? error.message : String(error) },
    });
    await logSystemError(error, {
      severity: 'medium',
      action: 'setSessionAndSync',
      metadata: { authFlow: 'login' },
    });
    throw error;
  }
}

export async function signOut() {
  await clearSession();
}
