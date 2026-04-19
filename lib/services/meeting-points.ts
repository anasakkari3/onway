import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { isAllowedCommunityId } from '@/lib/community/allowed';
import type { MeetingPointSource } from '@/lib/types';
import { CUSTOM_MEETING_POINT_ID, type MeetingPointOption } from '@/lib/trips/meeting-points';
import { AppError } from '@/lib/utils/errors';

const MAX_CUSTOM_MEETING_POINT_LENGTH = 120;

type ResolvedMeetingPoint = {
  originName: string;
  originLat: number | null;
  originLng: number | null;
  meetingPointId: string | null;
  meetingPointLabel: string | null;
  meetingPointContext: string | null;
  meetingPointSource: MeetingPointSource;
};

const DEFAULT_MEETING_POINTS_BY_COMMUNITY: Record<string, MeetingPointOption[]> = {
  'azrieli-college-engineering': [
    {
      id: 'azrieli-main-entrance',
      community_id: 'azrieli-college-engineering',
      label: 'Main campus entrance',
      location_context: "Azrieli College entrance area on Ya'akov Shribom Street.",
      lat: 31.7687,
      lng: 35.1937,
      active: true,
      sort_order: 10,
      source: 'default',
    },
    {
      id: 'azrieli-light-rail-pickup',
      community_id: 'azrieli-college-engineering',
      label: 'Light rail pickup side',
      location_context: 'Meet by the nearby public pickup area, away from the campus gate.',
      lat: 31.7689,
      lng: 35.1943,
      active: true,
      sort_order: 20,
      source: 'default',
    },
  ],
  'hebrew-university-givat-ram': [
    {
      id: 'givat-ram-main-gate',
      community_id: 'hebrew-university-givat-ram',
      label: 'Givat Ram main gate',
      location_context: 'Campus main gate pickup area near the security entrance.',
      lat: 31.775,
      lng: 35.1964,
      active: true,
      sort_order: 10,
      source: 'default',
    },
    {
      id: 'givat-ram-library-plaza',
      community_id: 'hebrew-university-givat-ram',
      label: 'National Library plaza',
      location_context: 'Central campus public plaza area for easy passenger meetup.',
      lat: 31.7767,
      lng: 35.1986,
      active: true,
      sort_order: 20,
      source: 'default',
    },
  ],
  'hebrew-university-mount-scopus': [
    {
      id: 'mount-scopus-main-gate',
      community_id: 'hebrew-university-mount-scopus',
      label: 'Mount Scopus main gate',
      location_context: 'Main campus entrance pickup area near the security gate.',
      lat: 31.7946,
      lng: 35.2412,
      active: true,
      sort_order: 10,
      source: 'default',
    },
    {
      id: 'mount-scopus-student-village',
      community_id: 'hebrew-university-mount-scopus',
      label: 'Student village stop',
      location_context: 'Use the public stop area near the student village approach.',
      lat: 31.797,
      lng: 35.2396,
      active: true,
      sort_order: 20,
      source: 'default',
    },
  ],
  'hadassah-college': [
    {
      id: 'hadassah-main-entrance',
      community_id: 'hadassah-college',
      label: 'Hadassah College entrance',
      location_context: "Main entrance pickup area on HaNevi'im Street.",
      lat: 31.7836,
      lng: 35.2214,
      active: true,
      sort_order: 10,
      source: 'default',
    },
    {
      id: 'hadassah-city-center-pickup',
      community_id: 'hadassah-college',
      label: 'City center transit pickup',
      location_context: 'Meet at a nearby public pickup area instead of blocking the narrow entrance.',
      lat: 31.783,
      lng: 35.2223,
      active: true,
      sort_order: 20,
      source: 'default',
    },
  ],
};

function normalizeOptionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sortMeetingPoints(points: MeetingPointOption[]) {
  return [...points].sort((a, b) => {
    const orderA = typeof a.sort_order === 'number' ? a.sort_order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.sort_order === 'number' ? b.sort_order : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.label.localeCompare(b.label);
  });
}

function normalizeFirestoreMeetingPoint(
  id: string,
  data: FirebaseFirestore.DocumentData,
  expectedCommunityId: string
): MeetingPointOption | null {
  const label = typeof data.label === 'string' ? data.label.trim() : '';
  const locationContext =
    typeof data.location_context === 'string' ? data.location_context.trim() : '';
  const communityId = typeof data.community_id === 'string' ? data.community_id : '';

  if (!label || !locationContext || communityId !== expectedCommunityId || data.active === false) {
    return null;
  }

  return {
    id,
    community_id: communityId,
    label,
    location_context: locationContext,
    lat: normalizeOptionalNumber(data.lat),
    lng: normalizeOptionalNumber(data.lng),
    active: data.active !== false,
    sort_order: normalizeOptionalNumber(data.sort_order),
    created_at: typeof data.created_at === 'string' ? data.created_at : null,
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : null,
    source: 'firestore',
  };
}

export function getDefaultMeetingPointsForCommunity(communityId: string): MeetingPointOption[] {
  if (!isAllowedCommunityId(communityId)) return [];
  return sortMeetingPoints(DEFAULT_MEETING_POINTS_BY_COMMUNITY[communityId] ?? []);
}

export async function getMeetingPointsForCommunity(
  communityId: string,
  db: FirebaseFirestore.Firestore = getAdminFirestore()
): Promise<MeetingPointOption[]> {
  const defaults = getDefaultMeetingPointsForCommunity(communityId);
  if (!isAllowedCommunityId(communityId)) return [];

  try {
    const snap = await db
      .collection('meeting_points')
      .where('community_id', '==', communityId)
      .get();
    const firestorePoints = snap.docs
      .map((doc) => normalizeFirestoreMeetingPoint(doc.id, doc.data(), communityId))
      .filter((point): point is MeetingPointOption => point !== null);

    if (firestorePoints.length === 0) {
      return defaults;
    }

    const merged = new Map<string, MeetingPointOption>();
    defaults.forEach((point) => merged.set(point.id, point));
    firestorePoints.forEach((point) => merged.set(point.id, point));
    return sortMeetingPoints([...merged.values()]);
  } catch {
    return defaults;
  }
}

export async function resolveMeetingPointForTripInput(input: {
  communityId: string;
  meetingPointId?: string | null;
  customLabel?: string | null;
  fallbackOriginName?: string | null;
  fallbackOriginLat?: number | null;
  fallbackOriginLng?: number | null;
  db?: FirebaseFirestore.Firestore;
}): Promise<ResolvedMeetingPoint> {
  const meetingPointId = input.meetingPointId?.trim() || null;
  const wantsCustom = !meetingPointId || meetingPointId === CUSTOM_MEETING_POINT_ID;

  if (!wantsCustom) {
    const points = await getMeetingPointsForCommunity(input.communityId, input.db);
    const point = points.find((candidate) => candidate.id === meetingPointId);
    if (!point) {
      throw new AppError('Meeting point is not available for this community', 'BAD_REQUEST');
    }

    return {
      originName: point.label,
      originLat: point.lat ?? null,
      originLng: point.lng ?? null,
      meetingPointId: point.id,
      meetingPointLabel: point.label,
      meetingPointContext: point.location_context,
      meetingPointSource: 'trusted',
    };
  }

  const customLabel = (input.customLabel ?? input.fallbackOriginName ?? '').trim();
  if (!customLabel) {
    throw new AppError('Custom meeting point is required', 'BAD_REQUEST');
  }
  if (customLabel.length > MAX_CUSTOM_MEETING_POINT_LENGTH) {
    throw new AppError('Meeting point is too long', 'BAD_REQUEST');
  }

  return {
    originName: customLabel,
    originLat: input.fallbackOriginLat ?? null,
    originLng: input.fallbackOriginLng ?? null,
    meetingPointId: null,
    meetingPointLabel: customLabel,
    meetingPointContext: null,
    meetingPointSource: 'custom',
  };
}
