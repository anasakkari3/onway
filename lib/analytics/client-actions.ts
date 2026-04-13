'use server';

import { trackEvent, type AnalyticsEventName } from '@/lib/services/analytics';

export async function trackClientEvent(
  eventName: AnalyticsEventName,
  payload?: Record<string, unknown>,
  communityId?: string | null,
) {
  await trackEvent(eventName, { payload, communityId });
}
