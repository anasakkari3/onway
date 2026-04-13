import { getAdminFirestore } from '@/lib/firebase/firestore-admin';

export type SavedPlaceLabel = 'home' | 'work' | 'university' | 'custom';

export type SavedPlace = {
  id: string;
  name: string;
  label: SavedPlaceLabel;
  emoji: string;
};

const LABEL_EMOJIS: Record<SavedPlaceLabel, string> = {
  home: '🏠',
  work: '💼',
  university: '🎓',
  custom: '📍',
};

export function emojiForLabel(label: SavedPlaceLabel): string {
  return LABEL_EMOJIS[label] ?? '📍';
}

export async function getSavedPlaces(userId: string): Promise<SavedPlace[]> {
  const db = getAdminFirestore();
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return [];
  const data = doc.data();
  if (!Array.isArray(data?.saved_places)) return [];
  return data.saved_places as SavedPlace[];
}

export async function addSavedPlace(
  userId: string,
  place: { name: string; label: SavedPlaceLabel }
): Promise<SavedPlace> {
  const db = getAdminFirestore();
  const newPlace: SavedPlace = {
    id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: place.name.trim(),
    label: place.label,
    emoji: emojiForLabel(place.label),
  };
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  const existing: SavedPlace[] = Array.isArray(snap.data()?.saved_places)
    ? (snap.data()!.saved_places as SavedPlace[])
    : [];
  await ref.set({ saved_places: [...existing, newPlace] }, { merge: true });
  return newPlace;
}

export async function deleteSavedPlace(userId: string, placeId: string): Promise<void> {
  const db = getAdminFirestore();
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  const existing: SavedPlace[] = Array.isArray(snap.data()?.saved_places)
    ? (snap.data()!.saved_places as SavedPlace[])
    : [];
  await ref.set(
    { saved_places: existing.filter((p) => p.id !== placeId) },
    { merge: true }
  );
}
