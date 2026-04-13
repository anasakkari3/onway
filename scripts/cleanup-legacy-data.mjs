#!/usr/bin/env node

/**
 * Safe legacy cleanup for the current 4-community product phase.
 *
 * Defaults to dry-run. Nothing is changed unless --apply is passed.
 *
 * Common runs:
 *   npm run cleanup:legacy-data
 *   npm run cleanup:legacy-data -- --apply
 *   npm run cleanup:legacy-data -- --apply --delete-test-data --delete-test-users
 */

import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ALLOWED_COMMUNITIES_PATH = path.resolve(
  process.cwd(),
  'config',
  'allowed-communities.json'
);

// Explicit cleanup controls. Keep destructive deletes opt-in.
const SHOULD_APPLY = process.argv.includes('--apply');
const DELETE_CLEAR_TEST_DATA = process.argv.includes('--delete-test-data');
const DELETE_CLEAR_TEST_USERS = process.argv.includes('--delete-test-users');
const DELETE_AUTH_TEST_USERS = process.argv.includes('--delete-auth-test-users');
const DELETE_ORPHANS = process.argv.includes('--delete-orphans') || DELETE_CLEAR_TEST_DATA;
const DRY_RUN = !SHOULD_APPLY;

const COLLECTIONS_BY_COMMUNITY_ID = [
  'community_members',
  'community_join_requests',
  'analytics_events',
  'reports',
];

const TRIP_CHILD_COLLECTIONS = [
  'bookings',
  'messages',
  'ratings',
  'reports',
  'trip_memberships',
];

const USER_DIRECT_COLLECTIONS = [
  'users',
  'trips',
  'bookings',
  'messages',
  'ratings',
  'reports',
  'community_members',
  'community_join_requests',
  'notifications',
  'analytics_events',
  'trip_memberships',
  'mail',
  'user_blocks',
];

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

function getDb() {
  return getFirestore(getAdminApp());
}

function readAllowedCommunities() {
  return JSON.parse(fs.readFileSync(ALLOWED_COMMUNITIES_PATH, 'utf8'));
}

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    : '';
}

function isClearTestCommunity(id, data) {
  const text = `${id} ${data?.name ?? ''}`.toLowerCase();
  return (
    /^smoke-(open|approval)-/.test(id) ||
    text.includes('smoke open') ||
    text.includes('smoke approval') ||
    normalizeText(data?.name) === 'test community'
  );
}

function isClearTestUser(id, data) {
  const text = `${id} ${data?.display_name ?? ''} ${data?.email ?? ''}`.toLowerCase();
  return (
    text.includes('smoke driver') ||
    text.includes('smoke rider') ||
    text.includes('smoke admin') ||
    text.includes('smoke outsider') ||
    text.includes('test user')
  );
}

function getAliasMigrationTarget(community, allowedCommunities) {
  const source = normalizeText(`${community.id} ${community.name ?? ''}`);
  for (const allowed of allowedCommunities) {
    const aliases = [allowed.name, ...(allowed.aliases ?? [])].map(normalizeText);
    if (aliases.some((alias) => alias && source.includes(alias))) {
      return allowed;
    }
  }

  return null;
}

function buildAllowedPayload(community, existing, nowIso) {
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

async function commitBatch(db, operations, label) {
  if (operations.length === 0) return 0;

  let count = 0;
  for (let i = 0; i < operations.length; i += 450) {
    const chunk = operations.slice(i, i + 450);
    const batch = db.batch();
    chunk.forEach((operation) => operation(batch));
    count += chunk.length;

    if (!DRY_RUN) {
      await batch.commit();
    }
  }

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}${label}: ${count}`);
  return count;
}

async function queryDocs(db, collectionName, field, op, value) {
  return db.collection(collectionName).where(field, op, value).get();
}

async function queryDocsInChunks(db, collectionName, field, values) {
  const docs = [];
  for (let i = 0; i < values.length; i += 30) {
    const chunk = values.slice(i, i + 30);
    if (chunk.length === 0) continue;
    const snap = await db.collection(collectionName).where(field, 'in', chunk).get();
    docs.push(...snap.docs);
  }
  return docs;
}

async function ensureAllowedCommunities(db, allowedCommunities) {
  const nowIso = new Date().toISOString();
  const operations = [];

  for (const community of allowedCommunities) {
    const ref = db.collection('communities').doc(community.id);
    const doc = await ref.get();
    const payload = buildAllowedPayload(community, doc.exists ? doc.data() : null, nowIso);
    operations.push((batch) => batch.set(ref, payload, { merge: true }));
  }

  return commitBatch(db, operations, 'ensure allowed communities');
}

async function archiveCommunity(db, doc, reason) {
  const nowIso = new Date().toISOString();
  await commitBatch(
    db,
    [
      (batch) =>
        batch.set(
          doc.ref,
          {
            listed: false,
            archived_at: nowIso,
            archive_reason: reason,
            cleanup_status: 'archived',
            updated_at: nowIso,
          },
          { merge: true }
        ),
    ],
    `archive communities/${doc.id}`
  );
}

async function migrateCommunityReferences(db, fromDoc, targetCommunity) {
  const fromId = fromDoc.id;
  const toId = targetCommunity.id;
  const nowIso = new Date().toISOString();

  console.log(`\nMigration candidate: ${fromId} -> ${toId}`);

  const operations = [];

  const tripsSnap = await queryDocs(db, 'trips', 'community_id', '==', fromId);
  tripsSnap.docs.forEach((doc) => {
    operations.push((batch) =>
      batch.set(
        doc.ref,
        {
          community_id: toId,
          community_name: targetCommunity.name,
          community_type: targetCommunity.type,
          cleanup_migrated_from_community_id: fromId,
          updated_at: nowIso,
        },
        { merge: true }
      )
    );
  });

  const memberSnap = await queryDocs(db, 'community_members', 'community_id', '==', fromId);
  for (const doc of memberSnap.docs) {
    const data = doc.data();
    if (typeof data.user_id !== 'string') continue;
    const nextRef = db.collection('community_members').doc(`${toId}_${data.user_id}`);
    const nextDoc = await nextRef.get();
    operations.push((batch) => {
      if (!nextDoc.exists) {
        batch.set(
          nextRef,
          {
            ...data,
            community_id: toId,
            cleanup_migrated_from_community_id: fromId,
          },
          { merge: true }
        );
      }
      batch.delete(doc.ref);
    });
  }

  const requestSnap = await queryDocs(db, 'community_join_requests', 'community_id', '==', fromId);
  for (const doc of requestSnap.docs) {
    const data = doc.data();
    if (typeof data.user_id !== 'string') continue;
    const nextRef = db.collection('community_join_requests').doc(`${toId}_${data.user_id}`);
    const nextDoc = await nextRef.get();
    operations.push((batch) => {
      if (!nextDoc.exists) {
        batch.set(
          nextRef,
          {
            ...data,
            community_id: toId,
            cleanup_migrated_from_community_id: fromId,
          },
          { merge: true }
        );
      }
      batch.delete(doc.ref);
    });
  }

  for (const collectionName of ['analytics_events', 'reports']) {
    const snap = await queryDocs(db, collectionName, 'community_id', '==', fromId);
    snap.docs.forEach((doc) => {
      const patch = {
        community_id: toId,
        cleanup_migrated_from_community_id: fromId,
      };
      if (collectionName === 'reports') {
        patch.community_name = targetCommunity.name;
      }
      operations.push((batch) => batch.set(doc.ref, patch, { merge: true }));
    });
  }

  await commitBatch(db, operations, `migrate references ${fromId} -> ${toId}`);
  await archiveCommunity(db, fromDoc, `migrated_to:${toId}`);
}

async function deleteTripGraph(db, tripDocs, label) {
  const tripIds = tripDocs.map((doc) => doc.id);
  const operations = [];

  for (const collectionName of TRIP_CHILD_COLLECTIONS) {
    const docs = await queryDocsInChunks(db, collectionName, 'trip_id', tripIds);
    docs.forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
  }

  tripDocs.forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
  await commitBatch(db, operations, label);
}

async function deleteCommunityGraph(db, doc) {
  const communityId = doc.id;
  console.log(`\nClear test community delete candidate: ${communityId}`);

  const tripSnap = await queryDocs(db, 'trips', 'community_id', '==', communityId);
  await deleteTripGraph(db, tripSnap.docs, `delete trip graph for ${communityId}`);

  const operations = [];
  for (const collectionName of COLLECTIONS_BY_COMMUNITY_ID) {
    const snap = await queryDocs(db, collectionName, 'community_id', '==', communityId);
    snap.docs.forEach((childDoc) => operations.push((batch) => batch.delete(childDoc.ref)));
  }
  operations.push((batch) => batch.delete(doc.ref));

  await commitBatch(db, operations, `delete community graph for ${communityId}`);
}

async function deleteTestUsers(db) {
  const usersSnap = await db.collection('users').get();
  const userDocs = usersSnap.docs.filter((doc) => isClearTestUser(doc.id, doc.data()));
  const userIds = userDocs.map((doc) => doc.id);

  console.log(`\nClear test users detected: ${userIds.length}`);
  if (userIds.length === 0) return;

  const operations = [];
  for (const collectionName of USER_DIRECT_COLLECTIONS) {
    for (const field of ['user_id', 'sender_id', 'driver_id', 'passenger_id', 'reported_id', 'reporter_id']) {
      const docs = await queryDocsInChunks(db, collectionName, field, userIds).catch(() => []);
      docs.forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
    }
  }

  const tripsByDriver = await queryDocsInChunks(db, 'trips', 'driver_id', userIds);
  await deleteTripGraph(db, tripsByDriver, 'delete trip graph for clear test users');

  userDocs.forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
  await commitBatch(db, operations, 'delete clear test user direct records');

  if (DELETE_AUTH_TEST_USERS) {
    for (const userId of userIds) {
      console.log(`${DRY_RUN ? '[dry-run] ' : ''}delete auth user ${userId}`);
      if (!DRY_RUN) {
        await getAuth(getAdminApp()).deleteUser(userId).catch((error) => {
          console.warn(`Auth user delete skipped for ${userId}: ${error.code ?? error.message}`);
        });
      }
    }
  }
}

async function deleteOrphans(db) {
  const allTripIds = new Set((await db.collection('trips').select().get()).docs.map((doc) => doc.id));
  const operations = [];

  for (const collectionName of TRIP_CHILD_COLLECTIONS) {
    const snap = await db.collection(collectionName).get();
    snap.docs.forEach((doc) => {
      const tripId = doc.data().trip_id;
      if (typeof tripId === 'string' && !allTripIds.has(tripId)) {
        operations.push((batch) => batch.delete(doc.ref));
      }
    });
  }

  await commitBatch(db, operations, 'delete orphan trip-linked records');
}

async function main() {
  const db = getDb();
  const allowedCommunities = readAllowedCommunities();
  const allowedIds = new Set(allowedCommunities.map((community) => community.id));

  console.log(`Legacy cleanup mode: ${DRY_RUN ? 'dry-run' : 'apply'}`);
  console.log(`Delete clear test data: ${DELETE_CLEAR_TEST_DATA ? 'yes' : 'no'}`);
  console.log(`Delete clear test users: ${DELETE_CLEAR_TEST_USERS ? 'yes' : 'no'}`);
  console.log(`Delete orphan trip-linked records: ${DELETE_ORPHANS ? 'yes' : 'no'}`);

  await ensureAllowedCommunities(db, allowedCommunities);

  const communitiesSnap = await db.collection('communities').get();
  const docs = communitiesSnap.docs.sort((a, b) => a.id.localeCompare(b.id));

  for (const doc of docs) {
    if (allowedIds.has(doc.id)) continue;

    const data = doc.data();
    const migrationTarget = getAliasMigrationTarget({ id: doc.id, ...data }, allowedCommunities);
    if (migrationTarget) {
      await migrateCommunityReferences(db, doc, migrationTarget);
      continue;
    }

    if (isClearTestCommunity(doc.id, data)) {
      if (DELETE_CLEAR_TEST_DATA) {
        await deleteCommunityGraph(db, doc);
      } else {
        await archiveCommunity(db, doc, 'clear_test_or_smoke_community');
      }
      continue;
    }

    await archiveCommunity(db, doc, 'not_allowed_current_phase_manual_review');
  }

  if (DELETE_CLEAR_TEST_USERS) {
    await deleteTestUsers(db);
  }

  if (DELETE_ORPHANS) {
    await deleteOrphans(db);
  }

  console.log('\nCleanup run complete.');
  console.log('Review logs above before running with broader delete flags.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
