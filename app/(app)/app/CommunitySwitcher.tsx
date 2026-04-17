import Link from 'next/link';
import CommunityBadge from '@/components/CommunityBadge';
import type { CommunityInfo } from '@/lib/types';

type CommunitySwitcherItem = CommunityInfo & {
  href: string;
};

type Props = {
  communities: CommunitySwitcherItem[];
  selectedCommunityId?: string | null;
  allHref?: string | null;
  showAllOption?: boolean;
  title?: string;
  description?: string;
  allLabel?: string;
};

export default function CommunitySwitcher({
  communities,
  selectedCommunityId,
  allHref = '/app',
  showAllOption = false,
  title = 'Community scope',
  description,
  allLabel = 'All joined',
}: Props) {
  return (
    <section className="surface-card rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[var(--muted)]">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted-strong)]">
              {description}
            </p>
          )}
        </div>
        {selectedCommunityId && (
          <CommunityBadge
            name={communities.find((community) => community.id === selectedCommunityId)?.name}
            type={communities.find((community) => community.id === selectedCommunityId)?.type}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {showAllOption && (
          <Link
            href={allHref ?? '/app'}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              !selectedCommunityId
                ? 'bg-[var(--route-ink)] text-white dark:bg-[var(--primary)] dark:text-[var(--route-ink)]'
                : 'bg-[var(--surface-muted)] text-[var(--muted-strong)] hover:bg-[var(--primary-light)]'
            }`}
          >
            {allLabel}
          </Link>
        )}

        {communities.map((community) => (
          <Link
            key={community.id}
            href={community.href}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              selectedCommunityId === community.id
                ? 'bg-[var(--primary)] text-white dark:text-[var(--route-ink)]'
                : 'bg-[var(--surface-muted)] text-[var(--muted-strong)] hover:bg-[var(--primary-light)]'
            }`}
          >
            {community.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
