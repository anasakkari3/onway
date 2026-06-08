import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/super-admin';
import { getServerLang } from '@/lib/i18n/server';
import { getLangDir, formatLocalizedDateTime } from '@/lib/i18n/locale';
import {
  getPlatformOverview,
  getPlatformUsers,
  getLiveTrips,
  getPlatformProblems,
  type PlatformProblem,
} from '@/lib/services/platform-admin';

export const dynamic = 'force-dynamic';

type Tab = 'overview' | 'users' | 'problems';

const COPY = {
  en: {
    eyebrow: 'Platform control',
    title: 'Oversight dashboard',
    description: 'Whole-platform monitoring: users, logins, live trips and problems across every community.',
    tabs: { overview: 'Overview', users: 'Users & logins', problems: 'Problems' },
    kpis: {
      users: 'Total users',
      liveTrips: 'Live trips',
      completedTrips: 'Completed trips',
      cancelledTrips: 'Cancelled trips',
      bookings: 'Bookings',
      cancelledBookings: 'Cancelled bookings',
      pendingReports: 'Pending reports',
      communities: 'Communities',
    },
    liveTripsTitle: 'Live trips',
    liveTripsEmpty: 'No scheduled or in-progress trips right now.',
    problemsTitle: 'Problems feed',
    problemsEmpty: 'No open problems. Nothing needs attention.',
    usersTitle: 'Users & logins',
    usersEmpty: 'No users found.',
    loadError: 'Could not load this data — check server logs.',
    cols: {
      driver: 'Driver',
      route: 'Route',
      community: 'Community',
      departure: 'Departure',
      seats: 'Seats',
      status: 'Status',
      user: 'User',
      email: 'Email',
      created: 'Joined',
      lastSignIn: 'Last sign-in',
      trust: 'Trust',
      drives: 'Drives',
      rides: 'Rides',
      reports: 'Reports',
      when: 'When',
      detail: 'Detail',
    },
    status: {
      scheduled: 'Scheduled',
      in_progress: 'In progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      draft: 'Draft',
      full: 'Full',
    } as Record<string, string>,
    problemKind: {
      report: 'Report',
      cancelled_trip: 'Cancelled trip',
      failed_autobook: 'Failed auto-booking',
    } as Record<string, string>,
    verified: 'Verified',
    unverified: 'Unverified',
    disabled: 'Disabled',
    never: 'Never',
    openTrip: 'Open',
  },
  ar: {
    eyebrow: 'رقابة المنصة',
    title: 'لوحة الرقابة الشاملة',
    description: 'مراقبة المنصة بالكامل: المستخدمون، تسجيلات الدخول، الرحلات الشغّالة، والمشاكل عبر كل المجتمعات.',
    tabs: { overview: 'نظرة عامة', users: 'المستخدمون والدخول', problems: 'المشاكل' },
    kpis: {
      users: 'إجمالي المستخدمين',
      liveTrips: 'رحلات شغّالة',
      completedTrips: 'رحلات مكتملة',
      cancelledTrips: 'رحلات ملغاة',
      bookings: 'الحجوزات',
      cancelledBookings: 'حجوزات ملغاة',
      pendingReports: 'بلاغات معلقة',
      communities: 'المجتمعات',
    },
    liveTripsTitle: 'الرحلات الشغّالة',
    liveTripsEmpty: 'لا توجد رحلات مجدولة أو قيد التنفيذ حالياً.',
    problemsTitle: 'سجل المشاكل',
    problemsEmpty: 'لا توجد مشاكل مفتوحة. كل شيء على ما يرام.',
    usersTitle: 'المستخدمون وتسجيلات الدخول',
    usersEmpty: 'لا يوجد مستخدمون.',
    loadError: 'تعذّر تحميل البيانات — راجع سجلات الخادم.',
    cols: {
      driver: 'السائق',
      route: 'المسار',
      community: 'المجتمع',
      departure: 'الانطلاق',
      seats: 'المقاعد',
      status: 'الحالة',
      user: 'المستخدم',
      email: 'البريد',
      created: 'انضم',
      lastSignIn: 'آخر دخول',
      trust: 'الثقة',
      drives: 'قيادات',
      rides: 'ركوبات',
      reports: 'بلاغات',
      when: 'الوقت',
      detail: 'التفاصيل',
    },
    status: {
      scheduled: 'مجدولة',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتملة',
      cancelled: 'ملغاة',
      draft: 'مسودة',
      full: 'ممتلئة',
    } as Record<string, string>,
    problemKind: {
      report: 'بلاغ',
      cancelled_trip: 'رحلة ملغاة',
      failed_autobook: 'فشل حجز آلي',
    } as Record<string, string>,
    verified: 'موثّق',
    unverified: 'غير موثّق',
    disabled: 'معطّل',
    never: 'أبداً',
    openTrip: 'فتح',
  },
  he: {
    eyebrow: 'בקרת פלטפורמה',
    title: 'לוח בקרה כולל',
    description: 'ניטור כל הפלטפורמה: משתמשים, כניסות, נסיעות פעילות ובעיות בכל הקהילות.',
    tabs: { overview: 'סקירה', users: 'משתמשים וכניסות', problems: 'בעיות' },
    kpis: {
      users: 'סך המשתמשים',
      liveTrips: 'נסיעות פעילות',
      completedTrips: 'נסיעות שהושלמו',
      cancelledTrips: 'נסיעות שבוטלו',
      bookings: 'הזמנות',
      cancelledBookings: 'הזמנות שבוטלו',
      pendingReports: 'דיווחים ממתינים',
      communities: 'קהילות',
    },
    liveTripsTitle: 'נסיעות פעילות',
    liveTripsEmpty: 'אין נסיעות מתוזמנות או פעילות כרגע.',
    problemsTitle: 'פיד בעיות',
    problemsEmpty: 'אין בעיות פתוחות.',
    usersTitle: 'משתמשים וכניסות',
    usersEmpty: 'לא נמצאו משתמשים.',
    loadError: 'טעינת הנתונים נכשלה — בדקו את יומני השרת.',
    cols: {
      driver: 'נהג',
      route: 'מסלול',
      community: 'קהילה',
      departure: 'יציאה',
      seats: 'מושבים',
      status: 'סטטוס',
      user: 'משתמש',
      email: 'אימייל',
      created: 'הצטרף',
      lastSignIn: 'כניסה אחרונה',
      trust: 'אמון',
      drives: 'נהיגות',
      rides: 'נסיעות',
      reports: 'דיווחים',
      when: 'מתי',
      detail: 'פרטים',
    },
    status: {
      scheduled: 'מתוזמן',
      in_progress: 'בתהליך',
      completed: 'הושלם',
      cancelled: 'בוטל',
      draft: 'טיוטה',
      full: 'מלא',
    } as Record<string, string>,
    problemKind: {
      report: 'דיווח',
      cancelled_trip: 'נסיעה שבוטלה',
      failed_autobook: 'הזמנה אוטומטית נכשלה',
    } as Record<string, string>,
    verified: 'מאומת',
    unverified: 'לא מאומת',
    disabled: 'מושבת',
    never: 'מעולם לא',
    openTrip: 'פתח',
  },
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'in_progress':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'scheduled':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
    case 'cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'completed':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

function problemKindClass(kind: PlatformProblem['kind']): string {
  switch (kind) {
    case 'report':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'cancelled_trip':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'failed_autobook':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accent ?? 'text-slate-900 dark:text-slate-100'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default async function AdminOverviewPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await requireSuperAdmin();

  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const tab: Tab =
    searchParams?.tab === 'users' || searchParams?.tab === 'problems'
      ? (searchParams.tab as Tab)
      : 'overview';

  const lang = await getServerLang();
  const dir = getLangDir(lang);
  const copy = COPY[lang] ?? COPY.en;

  const overview = await getPlatformOverview();

  const [liveTrips, problems, users] = await Promise.all([
    tab === 'overview' ? getLiveTrips() : Promise.resolve([]),
    tab === 'overview' || tab === 'problems' ? getPlatformProblems() : Promise.resolve([]),
    tab === 'users' ? getPlatformUsers() : Promise.resolve([]),
  ]);

  const tabLink = (t: Tab) => (t === 'overview' ? '/admin/overview' : `/admin/overview?tab=${t}`);

  return (
    <div dir={dir} className="p-4 max-w-6xl mx-auto space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
          {copy.eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{copy.description}</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {(['overview', 'users', 'problems'] as Tab[]).map((t) => (
          <Link
            key={t}
            href={tabLink(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t
                ? 'bg-sky-600 text-white dark:bg-sky-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {copy.tabs[t]}
          </Link>
        ))}
      </nav>

      {/* KPI grid — always visible */}
      {overview === null ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {copy.loadError}
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label={copy.kpis.users} value={overview.users.total} />
          <KpiCard
            label={copy.kpis.liveTrips}
            value={overview.trips.scheduled + overview.trips.inProgress}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <KpiCard label={copy.kpis.completedTrips} value={overview.trips.completed} />
          <KpiCard
            label={copy.kpis.cancelledTrips}
            value={overview.trips.cancelled}
            accent="text-red-600 dark:text-red-400"
          />
          <KpiCard label={copy.kpis.bookings} value={overview.bookings.total} />
          <KpiCard label={copy.kpis.cancelledBookings} value={overview.bookings.cancelled} />
          <KpiCard
            label={copy.kpis.pendingReports}
            value={overview.reports.pending}
            accent={overview.reports.pending > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
          />
          <KpiCard label={copy.kpis.communities} value={overview.communities} />
        </section>
      )}

      {tab === 'overview' && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{copy.liveTripsTitle}</h2>
            {liveTrips === null ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{copy.loadError}</p>
            ) : liveTrips.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{copy.liveTripsEmpty}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-start text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2 text-start font-semibold">{copy.cols.status}</th>
                      <th className="px-3 py-2 text-start font-semibold">{copy.cols.route}</th>
                      <th className="px-3 py-2 text-start font-semibold">{copy.cols.driver}</th>
                      <th className="px-3 py-2 text-start font-semibold">{copy.cols.community}</th>
                      <th className="px-3 py-2 text-start font-semibold">{copy.cols.departure}</th>
                      <th className="px-3 py-2 text-start font-semibold">{copy.cols.seats}</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveTrips.map((trip) => (
                      <tr key={trip.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(trip.status)}`}>
                            {copy.status[trip.status] ?? trip.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100" dir="auto">
                          {trip.originName} → {trip.destinationName}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300" dir="auto">
                          {trip.driverName ?? trip.driverId}
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400" dir="auto">
                          {trip.communityName ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                          {formatLocalizedDateTime(lang, trip.departureTime)}
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300 tabular-nums">
                          {trip.seatsTotal - trip.seatsAvailable}/{trip.seatsTotal}
                        </td>
                        <td className="px-3 py-2">
                          <Link href={`/trips/${trip.id}`} className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
                            {copy.openTrip}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <ProblemsSection problems={problems} copy={copy} lang={lang} />
        </>
      )}

      {tab === 'problems' && <ProblemsSection problems={problems} copy={copy} lang={lang} />}

      {tab === 'users' && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{copy.usersTitle}</h2>
          {users === null ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{copy.loadError}</p>
          ) : users.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{copy.usersEmpty}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 text-start font-semibold">{copy.cols.user}</th>
                    <th className="px-3 py-2 text-start font-semibold">{copy.cols.email}</th>
                    <th className="px-3 py-2 text-start font-semibold">{copy.cols.lastSignIn}</th>
                    <th className="px-3 py-2 text-start font-semibold">{copy.cols.created}</th>
                    <th className="px-3 py-2 text-end font-semibold">{copy.cols.trust}</th>
                    <th className="px-3 py-2 text-end font-semibold">{copy.cols.drives}</th>
                    <th className="px-3 py-2 text-end font-semibold">{copy.cols.rides}</th>
                    <th className="px-3 py-2 text-end font-semibold">{copy.cols.reports}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-slate-100" dir="auto">
                            {u.displayName ?? u.id.slice(0, 8)}
                          </span>
                          {u.disabled && (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              {copy.disabled}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-600 dark:text-slate-300" dir="ltr">
                            {u.email ?? '—'}
                          </span>
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              u.emailVerified ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            title={u.emailVerified ? copy.verified : copy.unverified}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                        {u.lastSignInAt ? formatLocalizedDateTime(lang, u.lastSignInAt) : copy.never}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                        {u.createdAt ? formatLocalizedDateTime(lang, u.createdAt) : '—'}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums text-slate-700 dark:text-slate-300">
                        {u.trustScore ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums text-slate-700 dark:text-slate-300">
                        {u.driverTrips ?? 0}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums text-slate-700 dark:text-slate-300">
                        {u.riderTrips ?? 0}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        <span className={u.reportsReceived > 0 ? 'font-bold text-red-600 dark:text-red-400' : 'text-slate-400'}>
                          {u.reportsReceived}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ProblemsSection({
  problems,
  copy,
  lang,
}: {
  problems: PlatformProblem[] | null;
  copy: (typeof COPY)['en'];
  lang: Awaited<ReturnType<typeof getServerLang>>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{copy.problemsTitle}</h2>
      {problems === null ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{copy.loadError}</p>
      ) : problems.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{copy.problemsEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {problems.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-1 rounded-2xl border border-slate-200 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${problemKindClass(p.kind)}`}>
                    {copy.problemKind[p.kind] ?? p.kind}
                  </span>
                  <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" dir="auto">
                    {p.title}
                  </span>
                </div>
                {p.detail && (
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400" dir="auto">
                    {p.detail}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-slate-400">
                  {p.userName ?? p.userId ?? ''}
                  {p.communityName ? ` · ${p.communityName}` : ''}
                  {p.createdAt ? ` · ${formatLocalizedDateTime(lang, p.createdAt)}` : ''}
                </p>
              </div>
              {p.tripId && (
                <Link
                  href={`/trips/${p.tripId}`}
                  className="shrink-0 text-sm font-semibold text-sky-600 hover:underline dark:text-sky-400"
                >
                  {copy.openTrip}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
