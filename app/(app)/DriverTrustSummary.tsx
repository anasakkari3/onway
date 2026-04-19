'use client';

import {
  DriverTrustPassport,
  type DriverTrustPassportProps,
} from '@/components/DriverTrustPassport';

type Props = DriverTrustPassportProps;

export function DriverTrustSummary(props: Props) {
  return <DriverTrustPassport {...props} />;
}
