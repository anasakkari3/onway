import { getCurrentUser, type AuthUser } from './session';
import { redirect } from 'next/navigation';

/**
 * Platform-level ("super admin") access control.
 *
 * Unlike community-admin (a `community_members` role scoped to one community),
 * a super admin can oversee the entire platform: every user, trip, booking,
 * report and login across all communities.
 *
 * Identity is an allowlist resolved from environment variables so no schema
 * change or custom claim is required to bootstrap. Emails are matched against
 * the verified Firebase session token (case-insensitive); UIDs are matched
 * against the session subject.
 *
 *   SUPER_ADMIN_EMAILS="owner@example.com,ops@example.com"
 *   SUPER_ADMIN_UIDS="uid1,uid2"
 *
 * If neither env var is set, the bootstrap owner below is used so the panel
 * works on first deploy. Set SUPER_ADMIN_EMAILS in production to take control.
 */
const BOOTSTRAP_OWNER_EMAIL = 'anasakkari04@gmail.com';

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function getSuperAdminEmails(): string[] {
  const fromEnv = parseList(process.env.SUPER_ADMIN_EMAILS);
  if (fromEnv.length > 0) return fromEnv;
  return [BOOTSTRAP_OWNER_EMAIL.toLowerCase()];
}

function getSuperAdminUids(): string[] {
  return parseList(process.env.SUPER_ADMIN_UIDS);
}

export function isSuperAdminUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;

  const uids = getSuperAdminUids();
  if (uids.includes(user.id.toLowerCase())) return true;

  const email = user.email?.trim().toLowerCase();
  if (email && getSuperAdminEmails().includes(email)) return true;

  return false;
}

export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return isSuperAdminUser(user);
}

/**
 * Gate a server component / action behind super-admin access.
 * Redirects unauthenticated users to login and non-admins to /app.
 */
export async function requireSuperAdmin(nextPath = '/admin/overview'): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!isSuperAdminUser(user)) {
    redirect('/app');
  }
  return user;
}
