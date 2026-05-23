/**
 * Client-Side Environment
 * Prefix: NEXT_PUBLIC_
 * Safe to expose to the browser bundle.
 */
const rawClientEnv = {
  apiKey: {
    name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  },
  authDomain: {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  },
  projectId: {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },
  storageBucket: {
    name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  },
  messagingSenderId: {
    name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  },
  appId: {
    name: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
} as const;

function isPlaceholderEnvValue(value: string) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.startsWith('your-') ||
    normalized.startsWith('replace-') ||
    normalized.includes('placeholder') ||
    normalized.includes('xxxxx') ||
    normalized.includes('...')
  );
}

const invalidClientEnv = Object.values(rawClientEnv)
  .filter(({ value }) => !value || isPlaceholderEnvValue(value))
  .map(({ name }) => name);

if (invalidClientEnv.length > 0) {
  throw new Error(
    `Firebase client env is missing or still uses placeholder values: ${invalidClientEnv.join(', ')}`
  );
}

export const clientEnv = {
  apiKey: rawClientEnv.apiKey.value as string,
  authDomain: rawClientEnv.authDomain.value as string,
  projectId: rawClientEnv.projectId.value as string,
  storageBucket: rawClientEnv.storageBucket.value as string,
  messagingSenderId: rawClientEnv.messagingSenderId.value as string,
  appId: rawClientEnv.appId.value as string,
};

/**
 * Server-Side Environment
 * Only available in Node.js context (API routes, Server Actions, Server Components).
 */
export function getOptionalServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('Attempted to access server environment variables on the client.');
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function getServerEnv() {
  const env = getOptionalServerEnv();

  if (!env) {
    throw new Error(
      'Missing Firebase Admin env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  return env;
}
