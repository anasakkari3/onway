import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getOptionalServerEnv } from '@/lib/config/env';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }
  const env = getOptionalServerEnv();

  // Local dev can use service account env vars. Firebase App Hosting provides
  // Google application default credentials, so no private key secret is needed.
  return env ? initializeApp({ credential: cert(env) }) : initializeApp();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
