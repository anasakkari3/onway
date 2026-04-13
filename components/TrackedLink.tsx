'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackClientEvent } from '@/lib/analytics/client-actions';
import type { AnalyticsEventName } from '@/lib/services/analytics';

type Props = ComponentProps<typeof Link> & {
  trackEvent: AnalyticsEventName;
  trackPayload?: Record<string, unknown>;
};

export default function TrackedLink({ trackEvent: eventName, trackPayload, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        void trackClientEvent(eventName, trackPayload);
        onClick?.(e);
      }}
    />
  );
}
