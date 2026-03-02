'use server';

import { sendMessage as sendMessageService } from '@/lib/services/chat';

export async function sendMessage(tripId: string, content: string) {
  return sendMessageService(tripId, content);
}
