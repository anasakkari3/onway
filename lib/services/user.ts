import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getAdminAuth } from '@/lib/firebase/admin';
import { trackEvent } from './analytics';
import type {
  NotificationPreferences,
  RequiredProfileField,
  UserProfile,
} from '@/lib/types';
import * as admin from 'firebase-admin';
import { AppError } from '@/lib/utils/errors';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
} from './notification-preferences';

export type MyUserProfileFull = UserProfile & {
  phone: string | null;
  city_or_area: string | null;
  age: number | null;
  gender: string | null;
  is_driver: boolean | null;
  gender_preference: string | null;
  email_notifications_enabled: boolean;
  email_verified: boolean;
  notification_preferences: NotificationPreferences;
};

export type RequiredProfileCompletionStatus = {
  profile: MyUserProfileFull | null;
  missingFields: RequiredProfileField[];
  isComplete: boolean;
};

export const BASIC_PROFILE_ACTION_FIELDS = [
  'display_name',
  'phone',
  'city_or_area',
  'age',
] as const;

export const TRIP_CREATION_PROFILE_FIELDS = [
  'display_name',
  'phone',
  'city_or_area',
  'age',
  'is_driver',
] as const;

type ProfileActionField = (typeof TRIP_CREATION_PROFILE_FIELDS)[number];
type BasicProfileActionField = (typeof BASIC_PROFILE_ACTION_FIELDS)[number];
type TripCreationProfileField = (typeof TRIP_CREATION_PROFILE_FIELDS)[number];
type ProfileActionReadinessSource = Partial<Record<ProfileActionField, unknown>> | null | undefined;
type ProfileActionReadiness<Field extends ProfileActionField> = {
  missingFields: Field[];
  isReady: boolean;
};

export const REQUIRED_PROFILE_FIELDS: RequiredProfileField[] = [
  'display_name',
  'phone',
  'city_or_area',
  'age',
  'gender',
  'is_driver',
];

const ALLOWED_GENDERS = new Set(['woman', 'man', 'non-binary', 'prefer_not_to_say']);
const ALLOWED_GENDER_PREFERENCES = new Set([
  'women',
  'men',
  'non-binary',
  'same_as_me',
]);
const ACTION_PROFILE_FIELD_LABELS: Record<ProfileActionField, string> = {
  display_name: 'display name',
  phone: 'phone',
  city_or_area: 'city or area',
  age: 'age',
    is_driver: 'driver status',
};

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== 'string') return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredText(value: string | null | undefined, fieldLabel: string) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    throw new AppError(`${fieldLabel} is required.`, 'INVALID_PROFILE');
  }

  return normalized;
}

function normalizeAge(value: number | string | null | undefined) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim().length > 0
        ? Number(value)
        : NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function formatFieldList(values: readonly string[]) {
  if (values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

function getMissingActionProfileFields<Field extends ProfileActionField>(
  profile: ProfileActionReadinessSource,
  requiredFields: readonly Field[]
): Field[] {
  if (!profile) {
    return [...requiredFields];
  }

  const missingFields: Field[] = [];

  for (const field of requiredFields) {
    if (field === 'display_name') {
      if (
        !normalizeOptionalText(
          typeof profile.display_name === 'string' ? profile.display_name : null
        )
      ) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'phone') {
      if (!normalizeOptionalText(typeof profile.phone === 'string' ? profile.phone : null)) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'city_or_area') {
      if (
        !normalizeOptionalText(
          typeof profile.city_or_area === 'string' ? profile.city_or_area : null
        )
      ) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'age') {
      const ageValue =
        typeof profile.age === 'number' || typeof profile.age === 'string'
          ? profile.age
          : null;

      if (normalizeAge(ageValue) === null) {
        missingFields.push(field);
      }
      continue;
    }

    if (field === 'is_driver') {
      if (profile.is_driver !== true) {
        missingFields.push(field);
      }
      continue;
    }
  }

  return missingFields;
}

export function getBasicProfileActionReadiness(
  profile: ProfileActionReadinessSource
): ProfileActionReadiness<BasicProfileActionField> {
  const missingFields = getMissingActionProfileFields(profile, BASIC_PROFILE_ACTION_FIELDS);

  return {
    missingFields,
    isReady: missingFields.length === 0,
  };
}

export function getTripCreationProfileReadiness(
  profile: ProfileActionReadinessSource
): ProfileActionReadiness<TripCreationProfileField> {
  const missingFields = getMissingActionProfileFields(profile, TRIP_CREATION_PROFILE_FIELDS);

  return {
    missingFields,
    isReady: missingFields.length === 0,
  };
}

export function describeProfileActionFields(fields: readonly ProfileActionField[]) {
  const labels = fields.map((field) => ACTION_PROFILE_FIELD_LABELS[field]);
  return labels.length > 0 ? formatFieldList(labels) : 'profile details';
}

function normalizeGender(value: string | null | undefined) {
  const normalized = normalizeRequiredText(value, 'Gender');
  if (!ALLOWED_GENDERS.has(normalized)) {
    throw new AppError('Please choose a valid gender.', 'INVALID_PROFILE');
  }

  return normalized;
}

function normalizeGenderPreference(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  if (!ALLOWED_GENDER_PREFERENCES.has(normalized)) {
    throw new AppError('Please choose a valid gender preference.', 'INVALID_PROFILE');
  }

  return normalized;
}

export function getMissingRequiredProfileFields(
  profile: MyUserProfileFull | null
): RequiredProfileField[] {
  if (!profile) {
    return [...REQUIRED_PROFILE_FIELDS];
  }

  const missingFields: RequiredProfileField[] = [];

  if (!normalizeOptionalText(profile.display_name)) {
    missingFields.push('display_name');
  }

  if (!normalizeOptionalText(profile.phone)) {
    missingFields.push('phone');
  }

  if (!normalizeOptionalText(profile.city_or_area)) {
    missingFields.push('city_or_area');
  }

  if (normalizeAge(profile.age) === null) {
    missingFields.push('age');
  }

  if (!normalizeOptionalText(profile.gender)) {
    missingFields.push('gender');
  }

  if (typeof profile.is_driver !== 'boolean') {
    missingFields.push('is_driver');
  }

  return missingFields;
}

/**
 * Ensures a user document exists in Firestore based on their Auth ID Token.
 */
export async function ensureUserProfile(idToken: string) {
  let decoded: { uid: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return;
  }

  const db = getAdminFirestore();
  const userRef = db.collection('users').doc(decoded.uid);
  const doc = await userRef.get();
  const now = new Date().toISOString();

  if (doc.exists) {
    const existing = doc.data()!;
    const updates: {
      updated_at: string;
      display_name?: string | null;
      avatar_url?: string | null;
      email_notifications_enabled?: boolean;
      email_verified?: boolean;
      notification_preferences?: NotificationPreferences;
    } = { updated_at: now };

    // Only seed from auth if Firestore fields are missing or null.
    if (!existing.display_name && decoded.name) {
      updates.display_name = decoded.name;
    }
    if (!existing.avatar_url && decoded.picture) {
      updates.avatar_url = decoded.picture;
    }
    if (typeof existing.email_notifications_enabled !== 'boolean') {
      updates.email_notifications_enabled = true;
    }
    if (existing.email_verified !== decoded.email_verified) {
      updates.email_verified = decoded.email_verified === true;
    }
    if (!existing.notification_preferences) {
      updates.notification_preferences = DEFAULT_NOTIFICATION_PREFERENCES;
    }

    if (Object.keys(updates).length > 1) {
      await userRef.update(updates);
    }
  } else {
    // Create new profile: seed from auth.
    await userRef.set({
      id: decoded.uid,
      phone: null,
      display_name: decoded.name ?? null,
      city_or_area: null,
      age: null,
      gender: null,
      is_driver: null,
      gender_preference: null,
      email_notifications_enabled: true,
      email_verified: decoded.email_verified === true,
      notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      avatar_url: decoded.picture ?? null,
      rating_avg: 0,
      rating_count: 0,
      created_at: now,
      updated_at: now,
    });
  }

  try {
    await trackEvent('auth_success', { userId: decoded.uid });
  } catch {
    // Analytics non-critical.
  }
}

/**
 * Fetches a public safe UserProfile.
 */
export async function getUserProfile(
  userId: string,
  passedDb?: admin.firestore.Firestore
): Promise<UserProfile | null> {
  const db = passedDb || getAdminFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;

  const d = doc.data()!;
  return {
    id: doc.id,
    display_name: d.display_name ?? null,
    avatar_url: d.avatar_url ?? null,
    gender: d.gender ?? null,
    rating_avg: d.rating_avg ?? 0,
    rating_count: d.rating_count ?? 0,
  };
}

/**
 * Fetches the full profile including private fields.
 * Only call this server-side when the authenticated user is viewing their OWN profile.
 */
export async function getMyProfileFull(userId: string): Promise<MyUserProfileFull | null> {
  const db = getAdminFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;

  const d = doc.data()!;

  return {
    id: doc.id,
    display_name: d.display_name ?? null,
    avatar_url: d.avatar_url ?? null,
    phone: d.phone ?? null,
    city_or_area: d.city_or_area ?? null,
    age: typeof d.age === 'number' && Number.isFinite(d.age) ? d.age : null,
    gender: d.gender ?? null,
    is_driver: typeof d.is_driver === 'boolean' ? d.is_driver : null,
    gender_preference: d.gender_preference ?? null,
    email_notifications_enabled: d.email_notifications_enabled !== false,
    email_verified: d.email_verified === true,
    notification_preferences: normalizeNotificationPreferences(d.notification_preferences),
    rating_avg: d.rating_avg ?? 0,
    rating_count: d.rating_count ?? 0,
  };
}

export async function getRequiredProfileCompletionStatus(
  userId: string
): Promise<RequiredProfileCompletionStatus> {
  const profile = await getMyProfileFull(userId);
  const missingFields = getMissingRequiredProfileFields(profile);

  return {
    profile,
    missingFields,
    isComplete: missingFields.length === 0,
  };
}

/**
 * Updates a user profile.
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    displayName: string;
    phone: string;
    cityOrArea: string;
    age: number | null;
    gender: string;
    isDriver: boolean | null;
    genderPreference?: string | null;
  }
) {
  const displayName = normalizeRequiredText(updates.displayName, 'Display name');
  const phone = normalizeRequiredText(updates.phone, 'Phone');
  const cityOrArea = normalizeRequiredText(updates.cityOrArea, 'City or area');
  const gender = normalizeGender(updates.gender);
  const age = normalizeAge(updates.age);
  const genderPreference = normalizeGenderPreference(updates.genderPreference);

  if (age === null) {
    throw new AppError('Age is required.', 'INVALID_PROFILE');
  }

  if (typeof updates.isDriver !== 'boolean') {
    throw new AppError('Please choose whether you are a driver.', 'INVALID_PROFILE');
  }

  const profileUpdates: Record<string, unknown> = {
    display_name: displayName,
    phone,
    city_or_area: cityOrArea,
    age,
    gender,
    is_driver: updates.isDriver,
    updated_at: new Date().toISOString(),
  };

  if (updates.genderPreference !== undefined) {
    profileUpdates.gender_preference = genderPreference;
  }

  const db = getAdminFirestore();
  await db.collection('users').doc(userId).set(
    profileUpdates,
    { merge: true }
  );
}

export async function updateEmailNotificationsPreference(
  userId: string,
  enabled: boolean
) {
  const db = getAdminFirestore();
  await db.collection('users').doc(userId).set(
    {
      email_notifications_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  const normalizedExisting = normalizeNotificationPreferences(
    (await getAdminFirestore().collection('users').doc(userId).get()).data()
      ?.notification_preferences
  );
  const normalizedUpdates = normalizeNotificationPreferences({
    ...normalizedExisting,
    ...preferences,
  });
  const db = getAdminFirestore();

  await db.collection('users').doc(userId).set(
    {
      email_notifications_enabled: true,
      notification_preferences: normalizedUpdates,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}
