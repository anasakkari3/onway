'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createRouteDemandSignal,
  createRouteRequest,
  upsertRouteAlert,
} from '@/lib/services/activation';

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function buildSearchRedirect(formData: FormData, status: 'requested' | 'alerted') {
  const params = new URLSearchParams();
  const communityId = getString(formData, 'communityId');
  const originName = getString(formData, 'originName');
  const destinationName = getString(formData, 'destinationName');
  const driverGender = getString(formData, 'driverGender');

  if (communityId) params.set('community_id', communityId);
  if (originName) params.set('originName', originName);
  if (destinationName) params.set('destinationName', destinationName);
  if (driverGender && driverGender !== 'any') params.set('driverGender', driverGender);
  params.set('routeDemand', status);

  return `/app?${params.toString()}`;
}

export async function createRouteDemandSignalAction(formData: FormData) {
  await createRouteDemandSignal({
    communityId: getString(formData, 'communityId'),
    originName: getString(formData, 'originName'),
    destinationName: getString(formData, 'destinationName'),
  });
  revalidatePath('/app');
  redirect(buildSearchRedirect(formData, 'requested'));
}

export async function createRouteRequestAction(formData: FormData) {
  await createRouteRequest({
    communityId: getString(formData, 'communityId'),
    originName: getString(formData, 'originName'),
    destinationName: getString(formData, 'destinationName'),
  });
  revalidatePath('/app');
  redirect(buildSearchRedirect(formData, 'requested'));
}

export async function createRouteAlertAction(formData: FormData) {
  await upsertRouteAlert({
    communityId: getString(formData, 'communityId'),
    originName: getString(formData, 'originName'),
    destinationName: getString(formData, 'destinationName'),
  });
  revalidatePath('/app');
  redirect(buildSearchRedirect(formData, 'alerted'));
}
