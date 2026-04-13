'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import {
  addSavedPlace,
  deleteSavedPlace,
  type SavedPlaceLabel,
} from '@/lib/services/savedPlaces';

export async function addSavedPlaceAction(
  name: string,
  label: SavedPlaceLabel
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Not authenticated' };
  if (!name?.trim()) return { ok: false, error: 'Name is required' };
  try {
    await addSavedPlace(user.id, { name: name.trim(), label });
    revalidatePath('/app');
    revalidatePath('/trips/new');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Failed to save place' };
  }
}

export async function deleteSavedPlaceAction(
  placeId: string
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  try {
    await deleteSavedPlace(user.id, placeId);
    revalidatePath('/app');
    revalidatePath('/trips/new');
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
