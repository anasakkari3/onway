'use server';

import { logSystemError, trackEvent, type AnalyticsEventName } from '@/lib/services/analytics';

export async function trackClientEvent(
  eventName: AnalyticsEventName,
  payload?: Record<string, unknown>,
  communityId?: string | null,
) {
  await trackEvent(eventName, { payload, communityId });
}

export async function logClientSystemError(input: {
  message: string;
  stack?: string;
  page?: string;
  component?: string;
  severity?: 'low' | 'medium' | 'high';
  browserInfo?: Record<string, unknown>;
}) {
  await logSystemError(new Error(input.message), {
    page: input.page,
    component: input.component,
    severity: input.severity ?? 'medium',
    browserInfo: input.browserInfo,
    metadata: {
      clientStack: input.stack,
    },
  });
}
