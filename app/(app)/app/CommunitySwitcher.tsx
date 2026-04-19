import {
  CommunityAllIdentityCard,
  CommunityIdentityCard,
} from '@/components/CommunityIdentityCard';
import type { CommunityInfo } from '@/lib/types';

type CommunitySwitcherItem = CommunityInfo & {
  href: string;
  activeRideCount?: number | null;
};

type Props = {
  communities: CommunitySwitcherItem[];
  selectedCommunityId?: string | null;
  allHref?: string | null;
  showAllOption?: boolean;
  title?: string;
  description?: string;
  allLabel?: string;
  allRideCount?: number | null;
  activeRideCountLabel?: (count: number) => string;
  typeLabel?: (community: CommunityInfo) => string;
};

export default function CommunitySwitcher({
  communities,
  selectedCommunityId,
  allHref = '/app',
  showAllOption = false,
  title = 'Community scope',
  description,
  allLabel = 'All joined',
  allRideCount = null,
  activeRideCountLabel,
  typeLabel,
}: Props) {
  const selectedCommunity = communities.find((community) => community.id === selectedCommunityId);

  return (
    <section className="community-switcher surface-card rounded-lg p-4">
      <div className="community-switcher__header">
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
        {selectedCommunity && (
          <span className="community-switcher__active-name" dir="auto">
            {selectedCommunity.name}
          </span>
        )}
      </div>

      <div className="community-switcher__rail">
        {showAllOption && (
          <CommunityAllIdentityCard
            href={allHref ?? '/app'}
            label={allLabel}
            selected={!selectedCommunityId}
            activeRideCountLabel={
              typeof allRideCount === 'number' && activeRideCountLabel
                ? activeRideCountLabel(allRideCount)
                : null
            }
          />
        )}

        {communities.map((community) => (
          <CommunityIdentityCard
            key={community.id}
            community={community}
            href={community.href}
            selected={selectedCommunityId === community.id}
            size="compact"
            typeLabel={typeLabel?.(community)}
            activeRideCount={community.activeRideCount}
            activeRideCountLabel={
              typeof community.activeRideCount === 'number' && activeRideCountLabel
                ? activeRideCountLabel(community.activeRideCount)
                : null
            }
          />
        ))}
      </div>
    </section>
  );
}
