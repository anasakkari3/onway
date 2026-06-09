'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommunityIdentityCard } from '@/components/CommunityIdentityCard';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { formatLocalizedDateTime } from '@/lib/i18n/locale';
import type { CommunityInfo, CommunityMembersRow } from '@/lib/types';
import {
  cancelCommunityRequest,
  joinCommunity,
  requestCommunityJoin,
  submitInviteCode,
  suggestInstitution,
} from './actions';
import {
  COMMUNITY_EXPLORER_COPY,
  localizeCommunityExplorerError,
} from './communityExplorerCopy';
import InstitutionSelector, {
  type InstitutionMembershipState,
} from '@/components/institutions/InstitutionSelector';
import type { Institution } from '@/lib/institutions/institutions';

const INSTITUTION_PICKER_COPY = {
  en: {
    eyebrow: 'Your institution',
    title: 'Choose your university or college',
    description:
      'Pick your institution by region, or search by name. Selecting it joins (or requests to join) that institution’s ride community.',
    otherThanks: 'Thanks! Your institution was recorded for review.',
  },
  ar: {
    eyebrow: 'مؤسستك',
    title: 'اختر جامعتك أو كليتك',
    description:
      'اختر مؤسستك حسب المنطقة، أو ابحث بالاسم. اختيارك ينضمّك (أو يرسل طلب انضمام) إلى مجتمع الرحلات الخاص بالمؤسسة.',
    otherThanks: 'شكرًا! تم تسجيل اسم مؤسستك لمراجعتها وإضافتها.',
  },
  he: {
    eyebrow: 'המוסד שלך',
    title: 'בחרו את האוניברסיטה או המכללה',
    description:
      'בחרו את המוסד לפי אזור, או חפשו לפי שם. הבחירה מצרפת (או שולחת בקשה) לקהילת הנסיעות של המוסד.',
    otherThanks: 'תודה! שם המוסד שלכם נרשם לבדיקה.',
  },
} as const;

type JoinedCommunity = CommunityInfo & {
  role: CommunityMembersRow['role'];
};

type ExploreCommunity = CommunityInfo & {
  membershipState: 'member' | 'pending' | 'rejected' | 'not_joined';
  role?: CommunityMembersRow['role'];
  decisionNote?: string | null;
  resolvedAt?: string | null;
};

type Props = {
  joinedCommunities: JoinedCommunity[];
  exploreCommunities: ExploreCommunity[];
  activeRideCounts?: Record<string, number>;
};

function describeAccessMode(
  community: CommunityInfo,
  copy: (typeof COMMUNITY_EXPLORER_COPY)['en']
) {
  if (community.membership_mode === 'approval_required') {
    return copy.approvalRequired;
  }

  return community.type === 'public' ? copy.openToEveryone : copy.openJoin;
}

function describeTrust(community: CommunityInfo, copy: (typeof COMMUNITY_EXPLORER_COPY)['en']) {
  if (community.type === 'public') {
    return copy.lowerTrust;
  }

  return copy.verifiedTrust;
}

export default function CommunityExplorer({
  joinedCommunities: initialJoinedCommunities,
  exploreCommunities: initialExploreCommunities,
  activeRideCounts = {},
}: Props) {
  const { lang } = useTranslation();
  const copy = COMMUNITY_EXPLORER_COPY[lang] ?? COMMUNITY_EXPLORER_COPY.en;
  const router = useRouter();
  const [joinedCommunities, setJoinedCommunities] = useState(initialJoinedCommunities);
  const [exploreCommunities, setExploreCommunities] = useState(initialExploreCommunities);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const getActiveRideCount = (communityId: string) => activeRideCounts[communityId] ?? 0;

  const getActiveRideCountLabel = (communityId: string) => {
    const count = getActiveRideCount(communityId);
    if (lang === 'ar') return `${count} رحلات نشطة`;
    if (lang === 'he') return `${count} נסיעות פעילות`;
    return `${count} active ${count === 1 ? 'ride' : 'rides'}`;
  };

  const joinedCommunityIds = useMemo(
    () => new Set(joinedCommunities.map((community) => community.id)),
    [joinedCommunities]
  );

  const institutionCopy = INSTITUTION_PICKER_COPY[lang] ?? INSTITUTION_PICKER_COPY.en;

  // Map an institution onto the live membership state of its backing community.
  const membershipForInstitution = (institution: Institution): InstitutionMembershipState => {
    if (joinedCommunityIds.has(institution.communityId)) return 'member';
    const explore = exploreCommunities.find((community) => community.id === institution.communityId);
    if (!explore) return 'not_joined';
    if (explore.membershipState === 'member') return 'member';
    if (explore.membershipState === 'pending') return 'pending';
    if (explore.membershipState === 'rejected') return 'rejected';
    return 'not_joined';
  };

  // Selecting an institution reuses the existing community join/request flow.
  const handleSelectInstitution = (institution: Institution) => {
    const communityId = institution.communityId;
    if (joinedCommunityIds.has(communityId)) {
      router.push(`/app?community_id=${communityId}`);
      return;
    }
    const explore = exploreCommunities.find((community) => community.id === communityId);
    if (explore?.membershipState === 'pending') return;
    if ((explore?.membership_mode ?? 'open') === 'open') {
      void handleJoin(communityId);
    } else {
      void handleRequest(communityId);
    }
  };

  const handleSuggestInstitution = async (name: string) => {
    setError(null);
    setNotice(null);
    const result = await suggestInstitution(name);
    if (!result.ok) {
      setError(localizeCommunityExplorerError(result.error, lang));
      return;
    }
    setNotice(institutionCopy.otherThanks);
  };

  // Institution cards share the community busy-key namespace (id === communityId).
  const institutionBusyId =
    busyKey && (busyKey.startsWith('join:') || busyKey.startsWith('request:'))
      ? busyKey.slice(busyKey.indexOf(':') + 1)
      : null;

  const handleJoin = async (communityId: string) => {
    setBusyKey(`join:${communityId}`);
    setError(null);
    setNotice(null);

    const result = await joinCommunity(communityId);
    if (!result.ok) {
      setError(localizeCommunityExplorerError(result.error, lang));
      setBusyKey(null);
      return;
    }

    const joinedCommunity = {
      ...result.community,
      description:
        exploreCommunities.find((community) => community.id === result.community.id)?.description ?? null,
      listed:
        exploreCommunities.find((community) => community.id === result.community.id)?.listed ?? false,
      is_system:
        exploreCommunities.find((community) => community.id === result.community.id)?.is_system ?? false,
      invite_code:
        exploreCommunities.find((community) => community.id === result.community.id)?.invite_code ?? null,
      role: 'member' as const,
    };

    if (!joinedCommunityIds.has(joinedCommunity.id)) {
      setJoinedCommunities((current) => [...current, joinedCommunity]);
    }
    setExploreCommunities((current) =>
      current.map((community) =>
        community.id === result.community.id
          ? { ...community, membershipState: 'member', role: 'member' }
          : community
      )
    );
    setNotice(copy.joinedNotice(result.community.name));
    setBusyKey(null);
    router.refresh();
    router.push(`/app?community_id=${result.community.id}`);
  };

  const handleRequest = async (communityId: string) => {
    setBusyKey(`request:${communityId}`);
    setError(null);
    setNotice(null);

    const result = await requestCommunityJoin(communityId);
    if (!result.ok) {
      setError(localizeCommunityExplorerError(result.error, lang));
      setBusyKey(null);
      return;
    }

    setExploreCommunities((current) =>
      current.map((community) =>
        community.id === result.community.id
          ? { ...community, membershipState: 'pending' }
          : community
      )
    );
    setNotice(copy.requestSentNotice(result.community.name));
    setBusyKey(null);
    router.refresh();
  };

  const handleCancelRequest = async (communityId: string) => {
    setBusyKey(`cancel:${communityId}`);
    setError(null);
    setNotice(null);

    const result = await cancelCommunityRequest(communityId);
    if (!result.ok) {
      setError(localizeCommunityExplorerError(result.error, lang));
      setBusyKey(null);
      return;
    }

    setExploreCommunities((current) =>
      current.map((community) =>
        community.id === result.community.id
          ? { ...community, membershipState: 'not_joined' }
          : community
      )
    );
    setNotice(copy.requestRemovedNotice(result.community.name));
    setBusyKey(null);
    router.refresh();
  };

  const handleInviteCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteCode.trim()) {
      setError(copy.errors.emptyInvite);
      return;
    }

    setBusyKey('invite');
    setError(null);
    setNotice(null);

    const result = await submitInviteCode(inviteCode);
    if (!result.ok) {
      setError(localizeCommunityExplorerError(result.error, lang));
      setBusyKey(null);
      return;
    }

    const existingCommunity = exploreCommunities.find((community) => community.id === result.community.id);

    if (result.mode === 'joined') {
      if (!joinedCommunityIds.has(result.community.id)) {
        setJoinedCommunities((current) => [
          ...current,
          {
            ...result.community,
            description: existingCommunity?.description ?? null,
            listed: existingCommunity?.listed ?? false,
            is_system: existingCommunity?.is_system ?? false,
            invite_code: existingCommunity?.invite_code ?? null,
            role: 'member',
          },
        ]);
      }

      setExploreCommunities((current) => {
        if (current.some((community) => community.id === result.community.id)) {
          return current.map((community) =>
            community.id === result.community.id
              ? { ...community, membershipState: 'member', role: 'member' }
              : community
          );
        }

        return [
          ...current,
          {
            ...result.community,
            description: null,
            listed: false,
            is_system: false,
            invite_code: null,
            membershipState: 'member',
            role: 'member',
          },
        ];
      });

      setNotice(copy.joinedNotice(result.community.name));
      setBusyKey(null);
      router.refresh();
      router.push(`/app?community_id=${result.community.id}`);
      return;
    }

    setExploreCommunities((current) => {
      if (current.some((community) => community.id === result.community.id)) {
        return current.map((community) =>
          community.id === result.community.id
            ? { ...community, membershipState: 'pending' }
            : community
        );
      }

      return [
        ...current,
        {
          ...result.community,
          description: null,
          listed: false,
          is_system: false,
          invite_code: null,
          membershipState: 'pending',
        },
      ];
    });
    setNotice(copy.requestSentNotice(result.community.name));
    setInviteCode('');
    setBusyKey(null);
    router.refresh();
  };

  const renderCommunityAction = (community: ExploreCommunity) => {
    if (community.membershipState === 'member') {
      return (
        <span className="inline-flex min-h-11 items-center rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          {copy.joined}
        </span>
      );
    }

    if (community.membershipState === 'pending') {
      return (
        <div className="community-identity-card__actions">
          <span className="inline-flex min-h-11 items-center rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            {copy.requestPending}
          </span>
          <button
            type="button"
            onClick={() => handleCancelRequest(community.id)}
            disabled={busyKey === `cancel:${community.id}`}
            data-testid={`cancel-request-${community.id}`}
            className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {busyKey === `cancel:${community.id}` ? copy.removing : copy.cancelRequest}
          </button>
        </div>
      );
    }

    if (community.membershipState === 'rejected') {
      return (
        <div className="community-identity-card__actions">
          <span className="inline-flex min-h-11 items-center rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {copy.requestDeclined}
          </span>
          {community.decisionNote && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {copy.adminNote}: {community.decisionNote}
            </p>
          )}
          {community.resolvedAt && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {copy.updatedOn} {formatLocalizedDateTime(lang, community.resolvedAt)}
            </p>
          )}
          <button
            type="button"
            onClick={() => handleRequest(community.id)}
            disabled={busyKey === `request:${community.id}`}
            data-testid={`request-community-${community.id}`}
            className="min-h-11 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {busyKey === `request:${community.id}` ? copy.sending : copy.requestAgain}
          </button>
        </div>
      );
    }

    if (community.membership_mode === 'open') {
      return (
        <button
          type="button"
          onClick={() => handleJoin(community.id)}
          disabled={busyKey === `join:${community.id}`}
          data-testid={`join-community-${community.id}`}
          className="min-h-11 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
        >
          {busyKey === `join:${community.id}` ? copy.joining : copy.joinCommunity}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleRequest(community.id)}
        disabled={busyKey === `request:${community.id}`}
        data-testid={`request-community-${community.id}`}
        className="min-h-11 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        {busyKey === `request:${community.id}` ? copy.sending : copy.requestAccess}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            {copy.eyebrow}
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {copy.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            {copy.description}
          </p>
        </div>

        {notice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}


        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {copy.yourCommunities}
              </p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {joinedCommunities.length === 0
                  ? copy.noMembershipsYet
                  : copy.joinedCount(joinedCommunities.length)}
              </h2>
            </div>
          </div>

          {joinedCommunities.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              {copy.joinPrompt}
            </p>
          ) : (
            <div className="grid gap-3 mt-4 sm:grid-cols-2">
              {joinedCommunities.map((community) => (
                <CommunityIdentityCard
                  key={community.id}
                  community={community}
                  roleLabel={community.role === 'admin' ? copy.roleAdmin : copy.roleMember}
                  accessLabel={describeAccessMode(community, copy)}
                  trustLabel={describeTrust(community, copy)}
                  activeRideCount={getActiveRideCount(community.id)}
                  activeRideCountLabel={getActiveRideCountLabel(community.id)}
                  testId={`joined-community-${community.id}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
              {institutionCopy.eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100" dir="auto">
              {institutionCopy.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400" dir="auto">
              {institutionCopy.description}
            </p>
          </div>
          <InstitutionSelector
            lang={lang}
            busyId={institutionBusyId}
            membershipFor={membershipForInstitution}
            onSelect={handleSelectInstitution}
            onSubmitOther={handleSuggestInstitution}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {copy.explore}
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {copy.availableCommunities}
            </h2>
          </div>

          <div className="grid gap-4 mt-4">
            {exploreCommunities.map((community) => (
              <CommunityIdentityCard
                key={community.id}
                community={community}
                accessLabel={describeAccessMode(community, copy)}
                trustLabel={describeTrust(community, copy)}
                activeRideCount={getActiveRideCount(community.id)}
                activeRideCountLabel={getActiveRideCountLabel(community.id)}
                action={renderCommunityAction(community)}
                testId={`community-card-${community.id}`}
              />
            ))}

            {exploreCommunities.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {copy.noCommunitiesYet}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {copy.inviteCode}
          </p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            {copy.useDirectCode}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {copy.inviteDescription}
          </p>

          <form onSubmit={handleInviteCode} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder={copy.invitePlaceholder}
              data-testid="invite-code-input"
              className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={busyKey === 'invite'}
              data-testid="invite-code-submit"
              className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              {busyKey === 'invite' ? copy.checking : copy.continue}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
