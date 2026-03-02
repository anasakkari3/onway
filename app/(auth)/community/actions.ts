'use server';

import { getCommunityByInviteCode, joinCommunity as joinCommunityService, createCommunity as createCommunityService } from '@/lib/services/community';

export async function getCommunityByCode(inviteCode: string) {
  return getCommunityByInviteCode(inviteCode.trim());
}

export async function joinCommunity(communityId: string) {
  await joinCommunityService(communityId);
}

export async function createCommunity(name: string, inviteCode: string) {
  const code = inviteCode.trim() || Math.random().toString(36).slice(2, 10);
  return createCommunityService(name.trim(), code);
}
