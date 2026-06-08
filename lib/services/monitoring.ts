import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { UnauthorizedError } from '@/lib/utils/errors';

type DocData = FirebaseFirestore.DocumentData;

export type MonitoringPeriod = 'today' | '7d' | '30d';

export type MonitoringFilters = {
  period: MonitoringPeriod;
  eventType?: string | null;
  status?: string | null;
};

export type MonitoringKpi = {
  key: string;
  label: string;
  value: number | string | null;
  empty?: boolean;
};

export type MonitoringActivity = {
  id: string;
  time: string;
  eventType: string;
  userId: string | null;
  tripId: string | null;
  bookingId: string | null;
  status: string | null;
  description: string;
};

export type MonitoringError = {
  id: string;
  message: string;
  page: string | null;
  component: string | null;
  userId: string | null;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  browserInfo: string | null;
};

export type MonitoringChartPoint = {
  label: string;
  value: number;
};

export type MonitoringSnapshot = {
  period: MonitoringPeriod;
  range: { start: string; end: string };
  kpis: MonitoringKpi[];
  funnel: MonitoringChartPoint[];
  recentActivity: MonitoringActivity[];
  errors: MonitoringError[];
  health: MonitoringKpi[];
  charts: {
    bookings: MonitoringChartPoint[];
    trips: MonitoringChartPoint[];
    failedBookings: MonitoringChartPoint[];
    newUsers: MonitoringChartPoint[];
    eventDistribution: MonitoringChartPoint[];
  };
  eventTypes: string[];
  statuses: string[];
};

const FUNNEL_EVENTS = [
  'page_view',
  'trip_search',
  'booking_started',
  'booking_attempted',
  'booking_completed',
  'booking_confirmed',
  'booking_cancelled',
  'booking_failed',
];

function startForPeriod(period: MonitoringPeriod): Date {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const days = period === '30d' ? 30 : 7;
  return new Date(now.getTime() - days * 86_400_000);
}

function asIso(data: DocData, camel: string, snake: string): string {
  const raw = data[camel] ?? data[snake];
  return typeof raw === 'string' ? raw : '';
}

function inRange(iso: string, startIso: string, endIso: string): boolean {
  return !!iso && iso >= startIso && iso <= endIso;
}

function eventName(data: DocData): string {
  return String(data.eventName ?? data.event_name ?? 'unknown');
}

function eventStatus(data: DocData): string {
  return String(data.status ?? 'info');
}

function eventUserId(data: DocData): string | null {
  return typeof data.userId === 'string'
    ? data.userId
    : typeof data.user_id === 'string'
      ? data.user_id
      : null;
}

function eventTripId(data: DocData): string | null {
  return typeof data.tripId === 'string'
    ? data.tripId
    : typeof data.trip_id === 'string'
      ? data.trip_id
      : null;
}

function eventBookingId(data: DocData): string | null {
  return typeof data.bookingId === 'string'
    ? data.bookingId
    : typeof data.booking_id === 'string'
      ? data.booking_id
      : null;
}

function describeEvent(name: string, data: DocData): string {
  const metadata = (data.metadata ?? data.payload ?? {}) as Record<string, unknown>;
  const route =
    typeof metadata.originName === 'string' || typeof metadata.destinationName === 'string'
      ? `${metadata.originName ?? '-'} -> ${metadata.destinationName ?? '-'}`
      : null;

  if (route) return route;
  if (typeof metadata.error === 'string') return metadata.error;
  if (typeof metadata.reason === 'string') return metadata.reason;
  return name.replaceAll('_', ' ');
}

function dayLabel(iso: string): string {
  return iso.slice(0, 10);
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function pointsFromMap(map: Map<string, number>, limit = 30): MonitoringChartPoint[] {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([label, value]) => ({ label, value }));
}

async function requireAccess() {
  if (!(await isSuperAdmin())) {
    throw new UnauthorizedError('Super admin access required');
  }
}

async function countCollection(name: string): Promise<number> {
  try {
    const snap = await getAdminFirestore().collection(name).count().get();
    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function getMonitoringSnapshot(filters: MonitoringFilters): Promise<MonitoringSnapshot | null> {
  try {
    await requireAccess();
    const db = getAdminFirestore();
    const start = startForPeriod(filters.period);
    const end = new Date();
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const todayStartIso = startForPeriod('today').toISOString();
    const weekStartIso = startForPeriod('7d').toISOString();

    const [
      usersTotal,
      tripsTotal,
      bookingsTotal,
      reportsTotal,
      userSnap,
      tripSnap,
      bookingSnap,
      eventSnap,
      errorSnap,
      reportSnap,
      joinRequestSnap,
    ] = await Promise.all([
      countCollection('users'),
      countCollection('trips'),
      countCollection('bookings'),
      countCollection('reports'),
      db.collection('users').limit(5000).get(),
      db.collection('trips').limit(5000).get(),
      db.collection('bookings').limit(5000).get(),
      db.collection('analytics_events').limit(5000).get(),
      db.collection('system_errors').limit(500).get().catch(() => null),
      db.collection('reports').limit(1000).get().catch(() => null),
      db.collection('community_join_requests').where('status', '==', 'pending').limit(1000).get().catch(() => null),
    ]);

    const users = userSnap.docs.map((doc): DocData & { id: string } => ({ id: doc.id, ...doc.data() }));
    const trips = tripSnap.docs.map((doc): DocData & { id: string } => ({ id: doc.id, ...doc.data() }));
    const bookings = bookingSnap.docs.map((doc): DocData & { id: string } => ({ id: doc.id, ...doc.data() }));
    const events = eventSnap.docs
      .map((doc): DocData & { id: string } => ({ id: doc.id, ...doc.data() }))
      .filter((event) => inRange(asIso(event, 'createdAt', 'created_at'), startIso, endIso))
      .filter((event) => !filters.eventType || eventName(event) === filters.eventType)
      .filter((event) => !filters.status || eventStatus(event) === filters.status);
    const allEvents = eventSnap.docs.map((doc): DocData & { id: string } => ({ id: doc.id, ...doc.data() }));
    const errors = (errorSnap?.docs ?? [])
      .map((doc): DocData & { id: string } => ({ id: doc.id, ...doc.data() }))
      .filter((error) => inRange(asIso(error, 'createdAt', 'created_at'), startIso, endIso));

    const activeToday = new Set(
      allEvents
        .filter((event) => inRange(asIso(event, 'createdAt', 'created_at'), todayStartIso, endIso))
        .map(eventUserId)
        .filter(Boolean)
    ).size;
    const newUsersThisWeek = users.filter((user) => inRange(asIso(user, 'createdAt', 'created_at'), weekStartIso, endIso)).length;
    const tripsToday = trips.filter((trip) => inRange(asIso(trip, 'createdAt', 'created_at'), todayStartIso, endIso)).length;
    const bookingsToday = bookings.filter((booking) => inRange(asIso(booking, 'createdAt', 'created_at'), todayStartIso, endIso)).length;
    const cancelledBookings = bookings.filter((booking) => booking.status === 'cancelled').length;
    const failedBookings = allEvents.filter((event) => eventName(event) === 'booking_failed').length;
    const lastError = errors.sort((a, b) => asIso(b, 'createdAt', 'created_at').localeCompare(asIso(a, 'createdAt', 'created_at')))[0] ?? null;
    const pendingReports = (reportSnap?.docs ?? []).filter((doc) => doc.data().status === 'pending').length;

    const eventTypes = [...new Set(allEvents.map(eventName))].sort();
    const statuses = [...new Set(allEvents.map(eventStatus))].sort();

    const bookingDays = new Map<string, number>();
    const tripDays = new Map<string, number>();
    const failedBookingDays = new Map<string, number>();
    const newUserDays = new Map<string, number>();
    const eventDistribution = new Map<string, number>();

    bookings.forEach((booking) => {
      const created = asIso(booking, 'createdAt', 'created_at');
      if (inRange(created, startIso, endIso)) increment(bookingDays, dayLabel(created));
    });
    trips.forEach((trip) => {
      const created = asIso(trip, 'createdAt', 'created_at');
      if (inRange(created, startIso, endIso)) increment(tripDays, dayLabel(created));
    });
    users.forEach((user) => {
      const created = asIso(user, 'createdAt', 'created_at');
      if (inRange(created, startIso, endIso)) increment(newUserDays, dayLabel(created));
    });
    events.forEach((event) => {
      const name = eventName(event);
      increment(eventDistribution, name);
      if (name === 'booking_failed') {
        increment(failedBookingDays, dayLabel(asIso(event, 'createdAt', 'created_at')));
      }
    });

    const recentActivity = events
      .sort((a, b) => asIso(b, 'createdAt', 'created_at').localeCompare(asIso(a, 'createdAt', 'created_at')))
      .slice(0, 60)
      .map((event) => {
        const name = eventName(event);
        return {
          id: event.id,
          time: asIso(event, 'createdAt', 'created_at'),
          eventType: name,
          userId: eventUserId(event),
          tripId: eventTripId(event),
          bookingId: eventBookingId(event),
          status: eventStatus(event),
          description: describeEvent(name, event),
        };
      });

    const recentErrors = errors
      .sort((a, b) => asIso(b, 'createdAt', 'created_at').localeCompare(asIso(a, 'createdAt', 'created_at')))
      .slice(0, 30)
      .map((error) => {
        const context = (error.context ?? {}) as Record<string, unknown>;
        const browserInfo = error.browserInfo ?? error.browser_info;
        return {
          id: error.id,
          message: typeof error.message === 'string' ? error.message : 'Unknown error',
          page: typeof context.page === 'string' ? context.page : null,
          component: typeof context.component === 'string' ? context.component : null,
          userId: typeof error.userId === 'string' ? error.userId : typeof error.user_id === 'string' ? error.user_id : null,
          severity: error.severity === 'high' || error.severity === 'low' ? error.severity : 'medium',
          createdAt: asIso(error, 'createdAt', 'created_at'),
          browserInfo: browserInfo ? JSON.stringify(browserInfo).slice(0, 180) : null,
        };
      });

    return {
      period: filters.period,
      range: { start: startIso, end: endIso },
      kpis: [
        { key: 'total_users', label: 'Total users', value: usersTotal },
        { key: 'active_users_today', label: 'Active users today', value: activeToday, empty: activeToday === 0 },
        { key: 'new_users_week', label: 'New users this week', value: newUsersThisWeek, empty: newUsersThisWeek === 0 },
        { key: 'total_trips', label: 'Total trips created', value: tripsTotal },
        { key: 'trips_today', label: 'Trips created today', value: tripsToday, empty: tripsToday === 0 },
        { key: 'total_bookings', label: 'Total bookings', value: bookingsTotal },
        { key: 'bookings_today', label: 'Bookings today', value: bookingsToday, empty: bookingsToday === 0 },
        { key: 'failed_bookings', label: 'Failed bookings', value: failedBookings, empty: failedBookings === 0 },
        { key: 'cancelled_bookings', label: 'Cancelled bookings', value: cancelledBookings, empty: cancelledBookings === 0 },
        {
          key: 'pending_driver_approvals',
          label: 'Pending driver approvals',
          value: 0,
          empty: true,
        },
        { key: 'reported_issues', label: 'Reported issues / complaints', value: reportsTotal },
        {
          key: 'last_error',
          label: 'Last system error time',
          value: lastError ? asIso(lastError, 'createdAt', 'created_at') : null,
          empty: !lastError,
        },
      ],
      funnel: FUNNEL_EVENTS.map((name) => ({
        label: name,
        value: events.filter((event) => eventName(event) === name).length,
      })),
      recentActivity,
      errors: recentErrors,
      health: [
        { key: 'firebase_connection', label: 'Firebase connection status', value: 'ok' },
        { key: 'last_db_read', label: 'Last successful database read', value: endIso },
        { key: 'last_db_write', label: 'Last successful database write', value: allEvents[0] ? asIso(allEvents[0], 'createdAt', 'created_at') : null, empty: allEvents.length === 0 },
        { key: 'failed_writes_today', label: 'Failed writes today', value: allEvents.filter((event) => eventName(event) === 'error_occurred' && inRange(asIso(event, 'createdAt', 'created_at'), todayStartIso, endIso)).length },
        { key: 'failed_reads_today', label: 'Failed reads today', value: 'No data available yet', empty: true },
        { key: 'slow_actions', label: 'Slow actions', value: 'No data available yet', empty: true },
        { key: 'pending_join_requests', label: 'Pending community join requests', value: joinRequestSnap?.docs.length ?? 0 },
        { key: 'pending_reports', label: 'Pending reports', value: pendingReports },
      ],
      charts: {
        bookings: pointsFromMap(bookingDays),
        trips: pointsFromMap(tripDays),
        failedBookings: pointsFromMap(failedBookingDays),
        newUsers: pointsFromMap(newUserDays),
        eventDistribution: pointsFromMap(eventDistribution, 20).sort((a, b) => b.value - a.value),
      },
      eventTypes,
      statuses,
    };
  } catch (err) {
    console.error('[monitoring] getMonitoringSnapshot failed:', err);
    return null;
  }
}
