import type { MeetingPointsRow } from '@/lib/types';

export const CUSTOM_MEETING_POINT_ID = 'custom';

export type MeetingPointOption = MeetingPointsRow & {
  source: 'default' | 'firestore';
};
