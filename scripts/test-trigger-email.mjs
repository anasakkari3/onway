#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert(getServerEnv()),
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const recipient = process.argv[2] || process.env.TEST_EMAIL_TO;

if (!recipient) {
  console.error('Usage: npm run email:test -- you@example.com');
  process.exit(1);
}

const db = getFirestore(getAdminApp());
const collectionName = process.env.FIREBASE_TRIGGER_EMAIL_COLLECTION || 'mail';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
const createdAt = new Date().toISOString();

const ref = await db.collection(collectionName).add({
  to: recipient,
  message: {
    subject: 'Batreeqak email test',
    text: `This is a Trigger Email test from Batreeqak.\n\nOpen app: ${appUrl}`,
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #0f172a;">
      <h2>Batreeqak email test</h2>
      <p>This is a Trigger Email test from Batreeqak.</p>
      <p><a href="${escapeHtml(appUrl)}">Open app</a></p>
    </div>`,
  },
  created_at: createdAt,
  test: true,
  source: 'scripts/test-trigger-email.mjs',
});

console.log(`Queued test email in ${collectionName}/${ref.id}`);
console.log(`Recipient: ${recipient}`);
