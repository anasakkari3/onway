import Link from 'next/link';
import type { RouteRequestOpportunity } from '@/lib/services/activation';
import type { Lang } from '@/lib/i18n/dictionaries';
import { translate, dictionaries } from '@/lib/i18n/dictionaries';
import { formatLocalizedDateTime } from '@/lib/i18n/locale';

type Props = {
  communityId: string;
  requests: RouteRequestOpportunity[];
  lang: Lang;
};

/**
 * Returns a localized "N riders waiting" label.
 * Count is distinct-user count — never inflated.
 */
function ridersWaitingLabel(count: number, lang: Lang): string {
  const dict = dictionaries[lang];
  if (count === 1) return translate(dict, 'demand_panel_riders_waiting_one');
  return translate(dict, 'demand_panel_riders_waiting_other').replace('{count}', String(count));
}

function buildCreateHref(communityId: string, request: RouteRequestOpportunity) {
  const params = new URLSearchParams({
    community_id: communityId,
    originName: request.origin_name,
    destinationName: request.destination_name,
    request_id: request.id,
  });
  return `/trips/new?${params.toString()}`;
}

/** Ranking signals computed from the request object. */
type DemandBadge = { label: string; className: string };

const BADGE_COPY: Record<Lang, { highDemand: string; isNew: string }> = {
  en: { highDemand: 'High demand', isNew: 'New' },
  ar: { highDemand: 'طلب مرتفع', isNew: 'جديد' },
  he: { highDemand: 'ביקוש גבוה', isNew: 'חדש' },
};

function getDemandBadges(request: RouteRequestOpportunity, lang: Lang): DemandBadge[] {
  const badges: DemandBadge[] = [];
  const copy = BADGE_COPY[lang];
  const ageHours = (Date.now() - new Date(request.created_at).getTime()) / 3_600_000;

  if (request.similar_requests_count >= 3) {
    badges.push({
      label: copy.highDemand,
      className:
        'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    });
  }

  if (ageHours < 24) {
    badges.push({
      label: copy.isNew,
      className:
        'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300',
    });
  }

  return badges;
}

export default function RouteDemandPanel({ communityId, requests, lang }: Props) {
  if (requests.length === 0) return null;

  const dict = dictionaries[lang];
  const title = translate(dict, 'demand_panel_title');
  const description = translate(dict, 'demand_panel_desc');
  const requestedLabel = translate(dict, 'demand_panel_requested');
  const createLabel = translate(dict, 'demand_panel_create');

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 mb-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20">
      <div className="mb-3 flex items-start gap-2">
        {/* flame icon — signals live demand */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
        </svg>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-100">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {requests.map((request) => {
          const badges = getDemandBadges(request, lang);
          return (
            <div
              key={request.id}
              className="rounded-2xl border border-amber-200 bg-white px-3 py-3 dark:border-amber-900/50 dark:bg-slate-900"
            >
              {/* Ranking badges row */}
              {badges.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {badges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Route */}
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100" dir="auto">
                    {request.origin_name || '—'}
                    <span className="mx-1.5 font-normal text-slate-400 dark:text-slate-500">→</span>
                    {request.destination_name || '—'}
                  </p>

                  {/* Demand context */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {/* person icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="shrink-0 text-amber-500"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {ridersWaitingLabel(request.similar_requests_count, lang)}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>
                      {requestedLabel}{' '}
                      {formatLocalizedDateTime(lang, request.created_at, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* CTA — framed as an opportunity, not a task */}
                <Link
                  href={buildCreateHref(communityId, request)}
                  className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  {createLabel} →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
