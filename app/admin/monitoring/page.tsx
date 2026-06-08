import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/super-admin';
import { formatLocalizedDateTime } from '@/lib/i18n/locale';
import { getServerLang } from '@/lib/i18n/server';
import {
  getMonitoringSnapshot,
  type MonitoringChartPoint,
  type MonitoringPeriod,
} from '@/lib/services/monitoring';

export const dynamic = 'force-dynamic';

type SearchParams = {
  period?: string;
  eventType?: string;
  status?: string;
};

function normalizePeriod(value?: string): MonitoringPeriod {
  return value === 'today' || value === '30d' ? value : '7d';
}

function EmptyNote() {
  return <span className="text-xs font-medium text-slate-400">No data available yet</span>;
}

function MetricCard({ label, value, empty }: { label: string; value: string | number | null; empty?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-2 min-h-9">
        {empty || value == null ? (
          <EmptyNote />
        ) : (
          <p className="text-2xl font-semibold tabular-nums text-slate-950 dark:text-slate-50">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        )}
      </div>
    </div>
  );
}

function BarChart({ points }: { points: MonitoringChartPoint[] }) {
  const max = Math.max(...points.map((point) => point.value), 0);
  if (points.length === 0 || max === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No data available yet</p>;
  }

  return (
    <div className="space-y-2">
      {points.map((point) => (
        <div key={point.label} className="grid grid-cols-[minmax(84px,150px)_1fr_48px] items-center gap-3 text-sm">
          <span className="truncate text-slate-500 dark:text-slate-400" title={point.label}>
            {point.label}
          </span>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-sky-500"
              style={{ width: `${Math.max(6, (point.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-end font-semibold tabular-nums text-slate-700 dark:text-slate-200">
            {point.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function statusClass(status: string | null) {
  switch (status) {
    case 'success':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'cancelled':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'pending':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  }
}

export default async function MonitoringPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireSuperAdmin('/admin/monitoring');
  const params = props.searchParams ? await props.searchParams : {};
  const lang = await getServerLang();
  const period = normalizePeriod(params.period);
  const snapshot = await getMonitoringSnapshot({
    period,
    eventType: params.eventType || null,
    status: params.status || null,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            System Insights
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
            Production monitoring
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Activity, conversion, failures, error reporting, and operational health for the deployed platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/overview"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Overview
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Community analytics
          </Link>
        </div>
      </header>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">Range</span>
          <select name="period" defaultValue={period} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">Event type</span>
          <select name="eventType" defaultValue={params.eventType ?? ''} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
            <option value="">All events</option>
            {snapshot?.eventTypes.map((eventType) => (
              <option key={eventType} value={eventType}>
                {eventType}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">Status</span>
          <div className="flex gap-2">
            <select name="status" defaultValue={params.status ?? ''} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
              <option value="">All statuses</option>
              {snapshot?.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
              Apply
            </button>
          </div>
        </label>
      </form>

      {!snapshot ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          Monitoring data could not be loaded. Check server logs and Firebase permissions.
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {snapshot.kpis.map((kpi) => (
              <MetricCard key={kpi.key} label={kpi.label} value={kpi.value} empty={kpi.empty} />
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">User journey funnel</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Meaningful product steps only.</p>
              <div className="mt-4">
                <BarChart points={snapshot.funnel} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:col-span-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Operational health</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {snapshot.health.map((item) => (
                  <MetricCard key={item.key} label={item.label} value={item.value} empty={item.empty} />
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Bookings over time</h2>
              <div className="mt-4"><BarChart points={snapshot.charts.bookings} /></div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Trips created over time</h2>
              <div className="mt-4"><BarChart points={snapshot.charts.trips} /></div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Failed bookings over time</h2>
              <div className="mt-4"><BarChart points={snapshot.charts.failedBookings} /></div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">New users over time</h2>
              <div className="mt-4"><BarChart points={snapshot.charts.newUsers} /></div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
              <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Event distribution</h2>
              <div className="mt-4"><BarChart points={snapshot.charts.eventDistribution} /></div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Recent activity</h2>
            {snapshot.recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No data available yet</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2 text-start">Time</th>
                      <th className="px-3 py-2 text-start">Event</th>
                      <th className="px-3 py-2 text-start">User</th>
                      <th className="px-3 py-2 text-start">Trip</th>
                      <th className="px-3 py-2 text-start">Status</th>
                      <th className="px-3 py-2 text-start">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.recentActivity.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatLocalizedDateTime(lang, row.time)}</td>
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{row.eventType}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{row.userId ?? '-'}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{row.tripId ?? row.bookingId ?? '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(row.status)}`}>
                            {row.status ?? 'info'}
                          </span>
                        </td>
                        <td className="max-w-md truncate px-3 py-2 text-slate-600 dark:text-slate-300">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Error monitoring</h2>
            {snapshot.errors.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No data available yet</p>
            ) : (
              <div className="mt-4 space-y-2">
                {snapshot.errors.map((error) => (
                  <div key={error.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(error.severity === 'high' ? 'failed' : 'info')}`}>
                        {error.severity}
                      </span>
                      <p className="font-medium text-slate-950 dark:text-slate-50">{error.message}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatLocalizedDateTime(lang, error.createdAt)}
                      {error.userId ? ` · user ${error.userId}` : ''}
                      {error.page ? ` · ${error.page}` : ''}
                      {error.component ? ` · ${error.component}` : ''}
                    </p>
                    {error.browserInfo && <p className="mt-1 text-xs text-slate-400">{error.browserInfo}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
