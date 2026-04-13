import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { Firestore } from 'firebase-admin/firestore';
import type { NotificationsRow } from '@/lib/types';
import { NotFoundError, UnauthorizedError } from '@/lib/utils/errors';
import { createHash } from 'crypto';
import {
  getPreferenceKeyForNotificationType,
  normalizeNotificationPreferences,
} from './notification-preferences';

const MAIL_COLLECTION = process.env.FIREBASE_TRIGGER_EMAIL_COLLECTION || 'mail';
const DEFAULT_EMAIL_NOTIFICATION_TYPES = new Set<NotificationsRow['type']>([
  'booking',
  'cancellation',
  'message',
  'route_alert',
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAppBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, '')}`;
  }

  return null;
}

function toAbsoluteLink(linkUrl?: string | null) {
  if (!linkUrl) return null;
  if (/^https?:\/\//i.test(linkUrl)) return linkUrl;

  const baseUrl = getAppBaseUrl();
  if (!baseUrl) return null;

  return `${baseUrl}${linkUrl.startsWith('/') ? linkUrl : `/${linkUrl}`}`;
}

function buildEmailText(title: string, body: string, linkUrl?: string | null): string {
  return `${title}\n\n${body}${linkUrl ? `\n\n${linkUrl}` : ''}`;
}

function buildEmailHtml(title: string, body: string, linkUrl?: string | null): string {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeLink = linkUrl ? escapeHtml(linkUrl) : null;
  const linkBlock = safeLink
    ? `<a href="${safeLink}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open in Batreeqak</a>`
    : '';
  return `<div dir="auto" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
  <h2 style="color: #0ea5e9; margin-bottom: 16px;">${safeTitle}</h2>
  <p style="line-height: 1.6; margin-bottom: 16px;">${safeBody}</p>
  ${linkBlock}
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
  <p style="font-size: 12px; color: #94a3b8;">This notification was sent by Batreeqak.</p>
</div>`;
}

/** How long to suppress duplicate chat emails for the same trip (ms). */
const CHAT_EMAIL_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

async function shouldQueueEmailForUser(
  db: Firestore,
  userId: string,
  type: NotificationsRow['type'],
  email: boolean | undefined,
  emailThrottleKey?: string | null,
) {
  if (email === false) return false;
  if (email !== true && !DEFAULT_EMAIL_NOTIFICATION_TYPES.has(type)) return false;

  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  if (userData?.email_notifications_enabled === false) return false;

  const preferences = normalizeNotificationPreferences(userData?.notification_preferences);
  const preferenceKey = getPreferenceKeyForNotificationType(type);
  if (preferences[preferenceKey] !== true) return false;

  // Throttle chat emails: at most one email per trip per hour.
  // Prevents inbox spam when a conversation is active.
  if (type === 'message' && emailThrottleKey) {
    const windowStart = new Date(Date.now() - CHAT_EMAIL_THROTTLE_MS).toISOString();
    const recentSnap = await db
      .collection(MAIL_COLLECTION)
      .where('email_throttle_key', '==', emailThrottleKey)
      .where('created_at', '>=', windowStart)
      .limit(1)
      .get();
    if (!recentSnap.empty) return false;
  }

  return true;
}

function getDedupeNotificationId(userId: string, dedupeKey: string) {
  const digest = createHash('sha1')
    .update(`${userId}:${dedupeKey}`)
    .digest('hex')
    .slice(0, 32);
  return `${userId}_${digest}`;
}

export async function createNotification(params: {
  userId: string;
  type: NotificationsRow['type'];
  title: string;
  body: string;
  linkUrl?: string | null;
  /** Set true for important system updates that should also be emailed. */
  email?: boolean;
  /** Deterministic key used to avoid repeated in-app/email notifications. */
  dedupeKey?: string | null;
  /**
   * Throttle key for email delivery. If a mail document with this key was sent
   * within CHAT_EMAIL_THROTTLE_MS, the email is suppressed. Used for chat
   * messages to prevent per-message email spam. Stored on the mail doc.
   */
  emailThrottleKey?: string | null;
}) {
  const db = getAdminFirestore();
  const createdAt = new Date().toISOString();
  const notificationRef = params.dedupeKey
    ? db.collection('notifications').doc(getDedupeNotificationId(params.userId, params.dedupeKey))
    : db.collection('notifications').doc();

  if (params.dedupeKey) {
    const existingNotification = await notificationRef.get();
    if (existingNotification.exists) {
      return notificationRef.id;
    }
  }

  await notificationRef.set({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    is_read: false,
    link_url: params.linkUrl ?? null,
    dedupe_key: params.dedupeKey ?? null,
    created_at: createdAt,
  });

  // Write to `mail` collection for Firebase Trigger Email extension.
  // Failures here are silently swallowed so they never block notification creation.
  try {
    const shouldQueueEmail = await shouldQueueEmailForUser(
      db,
      params.userId,
      params.type,
      params.email,
      params.emailThrottleKey,
    );
    if (!shouldQueueEmail) return notificationRef.id;

    const userRecord = await getAdminAuth().getUser(params.userId);
    const userEmail = userRecord.email;
    if (userEmail) {
      const absoluteLink = toAbsoluteLink(params.linkUrl);
      await db.collection(MAIL_COLLECTION).add({
        to: userEmail,
        message: {
          subject: params.title,
          html: buildEmailHtml(params.title, params.body, absoluteLink),
          text: buildEmailText(params.title, params.body, absoluteLink),
        },
        notification_id: notificationRef.id,
        notification_type: params.type,
        user_id: params.userId,
        // Stored so shouldQueueEmailForUser can throttle future sends with same key.
        email_throttle_key: params.emailThrottleKey ?? null,
        created_at: createdAt,
      });
    }
  } catch {
    // Silently skip — email delivery is best-effort.
  }
  return notificationRef.id;
}

export async function getMyNotifications(): Promise<NotificationsRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  try {
    const snap = await db.collection('notifications')
      .where('user_id', '==', user.id)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NotificationsRow));
  } catch {
    // Fallback for missing Firestore indexes or transient query failures.
    const snap = await db.collection('notifications')
      .where('user_id', '==', user.id)
      .get();

    return snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificationsRow))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  }
}

export async function markNotificationAsRead(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const ref = db.collection('notifications').doc(id);
  const doc = await ref.get();
  
  if (!doc.exists) throw new NotFoundError('Notification not found');
  if (doc.data()?.user_id !== user.id) throw new UnauthorizedError();

  await ref.update({ is_read: true });
}

export async function markAllNotificationsAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const snap = await db.collection('notifications')
    .where('user_id', '==', user.id)
    .where('is_read', '==', false)
    .get();

  if (snap.empty) return;

  const batch = db.batch();
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { is_read: true });
  });

  await batch.commit();
}
