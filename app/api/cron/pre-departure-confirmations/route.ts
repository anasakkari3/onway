import { NextResponse } from 'next/server';
import {
  expirePreDepartureConfirmations,
  sendPreDepartureConfirmationPrompts,
} from '@/lib/services/pre-departure-confirmation';

export const dynamic = 'force-dynamic';

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const prompted = await sendPreDepartureConfirmationPrompts({ now });
  const expired = await expirePreDepartureConfirmations({ now });

  return NextResponse.json({
    ok: true,
    ranAt: now.toISOString(),
    prompted,
    expired,
  });
}
