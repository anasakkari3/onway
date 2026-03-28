'use server';

import { sendTripMessage } from '@/lib/services/message';

export async function sendMessage(tripId: string, content: string) {
  return sendTripMessage(tripId, content);
}
