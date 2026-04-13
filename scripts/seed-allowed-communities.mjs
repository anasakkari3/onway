#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ALLOWED_COMMUNITIES_PATH = path.resolve(
  process.cwd(),
  'config',
  'allowed-communities.json'
);

function loadLocalEnvFiles() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) continue;

    const contents = fs.readFileSync(candidatePath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] !== undefined) continue;

      const unquoted =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
          ? value.slice(1, -1)
          : value;

      process.env[key] = unquoted;
    }
  }
}

function getServerEnv() {
  loadLocalEnvFiles();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  return { projectId, clientEmail, privateKey };
}

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(getServerEnv()),
    });
  }

  return getFirestore();
}

function readAllowedCommunities() {
  return JSON.parse(fs.readFileSync(ALLOWED_COMMUNITIES_PATH, 'utf8'));
}

function publicCommunityPayload(community, existing, nowIso) {
  return {
    name: community.name,
    description: community.description ?? null,
    type: community.type,
    membership_mode: community.membership_mode,
    listed: true,
    is_system: false,
    invite_code: community.invite_code ?? null,
    created_by: existing?.created_by ?? null,
    created_at: typeof existing?.created_at === 'string' ? existing.created_at : nowIso,
    updated_at: nowIso,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const db = getDb();
  const allowedCommunities = readAllowedCommunities();
  const nowIso = new Date().toISOString();

  console.log(`Allowed community seed mode: ${dryRun ? 'dry-run' : 'apply'}`);
  console.log(`Allowed communities: ${allowedCommunities.length}`);

  for (const community of allowedCommunities) {
    const ref = db.collection('communities').doc(community.id);
    const doc = await ref.get();
    const existing = doc.exists ? doc.data() : null;
    const payload = publicCommunityPayload(community, existing, nowIso);

    console.log(
      `${dryRun ? '[dry-run] ' : ''}${doc.exists ? 'upsert' : 'create'} communities/${community.id} (${community.name})`
    );

    if (!dryRun) {
      await ref.set(payload, { merge: true });
    }
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
