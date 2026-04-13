import allowedCommunitiesJson from '@/config/allowed-communities.json';
import type { CommunityInfo } from '@/lib/types';

type AllowedCommunityConfig = CommunityInfo & {
  aliases?: string[];
};

export const ALLOWED_COMMUNITIES = allowedCommunitiesJson as AllowedCommunityConfig[];

export const ALLOWED_COMMUNITY_IDS = new Set(
  ALLOWED_COMMUNITIES.map((community) => community.id)
);

export function isAllowedCommunityId(communityId: string | null | undefined) {
  return typeof communityId === 'string' && ALLOWED_COMMUNITY_IDS.has(communityId);
}

export function getAllowedCommunityById(communityId: string) {
  return ALLOWED_COMMUNITIES.find((community) => community.id === communityId) ?? null;
}

export function listAllowedCommunities(): CommunityInfo[] {
  return ALLOWED_COMMUNITIES.map((community) => ({
    id: community.id,
    name: community.name,
    description: community.description,
    type: community.type,
    membership_mode: community.membership_mode,
    listed: community.listed,
    is_system: community.is_system,
    invite_code: community.invite_code,
  }));
}
