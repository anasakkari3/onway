import { createClient } from '@/lib/supabase/server';

export async function getFunnelMetrics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_name')
    .limit(10000);

  if (error) return [];

  const counts = (data ?? []).reduce(
    (acc, row) => {
      acc[row.event_name] = (acc[row.event_name] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const order = [
    'auth_success',
    'trip_created',
    'trip_search',
    'trip_results_shown',
    'trip_opened',
    'booking_attempted',
    'booking_confirmed',
    'trip_completed',
    'rating_submitted',
  ];
  return order.map((event_name) => ({
    event_name,
    count: counts[event_name] ?? 0,
  }));
}

export async function getDailyTripsAndBookings() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from('trips')
    .select('id, community_id, created_at')
    .limit(5000);

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, created_at, trip_id')
    .limit(5000);

  const tripMap = new Map((trips ?? []).map((t) => [t.id, t]));
  const communityIds = new Set<string>((trips ?? []).map((t) => t.community_id));
  (bookings ?? []).forEach((b) => {
    const t = tripMap.get(b.trip_id);
    if (t) communityIds.add(t.community_id);
  });

  const { data: communities } = await supabase
    .from('communities')
    .select('id, name')
    .in('id', [...communityIds]);
  const nameMap = new Map((communities ?? []).map((c) => [c.id, c.name]));

  const byDateComm: Record<string, { trips: number; bookings: number; community_id: string }> = {};

  (trips ?? []).forEach((t) => {
    const date = t.created_at.slice(0, 10);
    const key = `${date}-${t.community_id}`;
    if (!byDateComm[key]) byDateComm[key] = { trips: 0, bookings: 0, community_id: t.community_id };
    byDateComm[key].trips += 1;
  });

  (bookings ?? []).forEach((b) => {
    const t = tripMap.get(b.trip_id);
    if (!t) return;
    const date = b.created_at.slice(0, 10);
    const key = `${date}-${t.community_id}`;
    if (!byDateComm[key]) byDateComm[key] = { trips: 0, bookings: 0, community_id: t.community_id };
    byDateComm[key].bookings += 1;
  });

  return Object.entries(byDateComm)
    .map(([key, v]) => ({
      date: key.split('-').slice(0, 3).join('-'),
      community_id: v.community_id,
      community_name: nameMap.get(v.community_id) ?? null,
      trips: v.trips,
      bookings: v.bookings,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 100);
}
