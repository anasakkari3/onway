'use server';

import { revalidatePath } from 'next/cache';
import {
  getCommunityById,
  getCommunityByInviteCode,
  joinCommunity as joinCommunityService,
} from '@/lib/services/community';
import {
  cancelJoinRequest,
  submitJoinRequest,
} from '@/lib/services/community-requests';
import { getCurrentUser } from '@/lib/auth/session';
import { getAdminFirestore } from '@/lib/firebase/firestore-admin';

type CommunityActionResult =
  | {
      ok: true;
      mode: 'joined' | 'requested' | 'already_member' | 'request_cancelled';
      community: {
        id: string;
        name: string;
        type: 'verified' | 'public';
        membership_mode: 'open' | 'approval_required';
      };
    }
  | { ok: false; error: string };

function toActionError(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function revalidateCommunitySurfaces() {
  revalidatePath('/community');
  revalidatePath('/app');
  revalidatePath('/trips/new');
}

export async function joinCommunity(communityId: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityById(communityId);
    if (!community) {
      return { ok: false, error: 'Community not found.' };
    }

    await joinCommunityService(communityId, { joinedVia: 'open_join' });
    revalidateCommunitySurfaces();

    return {
      ok: true,
      mode: 'joined',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function requestCommunityJoin(communityId: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityById(communityId);
    if (!community) {
      return { ok: false, error: 'Community not found.' };
    }

    await submitJoinRequest(communityId);
    revalidateCommunitySurfaces();

    return {
      ok: true,
      mode: 'requested',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function cancelCommunityRequest(communityId: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityById(communityId);
    if (!community) {
      return { ok: false, error: 'Community not found.' };
    }

    await cancelJoinRequest(communityId);
    revalidateCommunitySurfaces();

    return {
      ok: true,
      mode: 'request_cancelled',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

/**
 * Records a free-text "Other institution" suggestion from a user whose
 * university/college is not yet in the curated list. This is a real write to
 * Firestore `institution_suggestions` (reviewed by admins before a community is
 * added) — not a placeholder. Returns gracefully on any failure.
 */
export async function suggestInstitution(
  name: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: 'Sign in to suggest an institution.' };

    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Institution name is required.' };

    const db = getAdminFirestore();
    await db.collection('institution_suggestions').add({
      user_id: user.id,
      name: trimmed.slice(0, 160),
      status: 'new',
      created_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function submitInviteCode(inviteCode: string): Promise<CommunityActionResult> {
  try {
    const community = await getCommunityByInviteCode(inviteCode.trim());
    if (!community) {
      return { ok: false, error: 'Invite code not found.' };
    }

    if (community.membership_mode === 'open') {
      await joinCommunityService(community.id, { joinedVia: 'invite' });
      revalidateCommunitySurfaces();
      return {
        ok: true,
        mode: 'joined',
        community: {
          id: community.id,
          name: community.name,
          type: community.type,
          membership_mode: community.membership_mode,
        },
      };
    }

    await submitJoinRequest(community.id);
    revalidateCommunitySurfaces();
    return {
      ok: true,
      mode: 'requested',
      community: {
        id: community.id,
        name: community.name,
        type: community.type,
        membership_mode: community.membership_mode,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
