import type { CommunityInfo } from '@/lib/types';

type CommunityIdentityTarget = Pick<CommunityInfo, 'id' | 'name' | 'type'>;

type CommunityPalette = {
  accent: string;
  soft: string;
  ink: string;
};

const VERIFIED_PALETTE: CommunityPalette[] = [
  {
    accent: 'oklch(0.58 0.12 172)',
    soft: 'oklch(0.93 0.045 172)',
    ink: 'oklch(0.27 0.07 172)',
  },
  {
    accent: 'oklch(0.57 0.13 145)',
    soft: 'oklch(0.93 0.05 145)',
    ink: 'oklch(0.26 0.08 145)',
  },
  {
    accent: 'oklch(0.6 0.13 198)',
    soft: 'oklch(0.93 0.04 198)',
    ink: 'oklch(0.27 0.07 198)',
  },
  {
    accent: 'oklch(0.62 0.15 28)',
    soft: 'oklch(0.94 0.045 28)',
    ink: 'oklch(0.31 0.08 28)',
  },
  {
    accent: 'oklch(0.66 0.14 78)',
    soft: 'oklch(0.95 0.055 78)',
    ink: 'oklch(0.32 0.075 78)',
  },
];

const PUBLIC_PALETTE: CommunityPalette = {
  accent: 'oklch(0.62 0.13 58)',
  soft: 'oklch(0.94 0.045 58)',
  ink: 'oklch(0.31 0.075 58)',
};

function hashCommunityId(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getInitials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/[\s-]+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) return 'C';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}

export function getCommunityIdentity(community: CommunityIdentityTarget) {
  const palette =
    community.type === 'public'
      ? PUBLIC_PALETTE
      : VERIFIED_PALETTE[hashCommunityId(community.id) % VERIFIED_PALETTE.length];

  return {
    initials: getInitials(community.name),
    palette,
    motif: hashCommunityId(`${community.id}:motif`) % 3,
  };
}
