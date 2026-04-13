# Community Restriction and Legacy Cleanup

This project phase is restricted to these four official communities only:

1. Azrieli College of Engineering
2. Hebrew University - Givat Ram
3. Hebrew University - Mount Scopus
4. Hadassah College

The canonical list lives in `config/allowed-communities.json`.

Current access mode:

- For the current trial phase, all four official communities use `membership_mode: "open"`.
- Users can join any of the four communities directly without admin approval.
- To return to approval-based access later, change the four `membership_mode` values in `config/allowed-communities.json` back to `"approval_required"` and run `npm run seed:allowed-communities`.

## Enforcement

- Server community reads are restricted in `lib/community/allowed.ts` and `lib/services/community.ts`.
- Community discovery, onboarding/community join, invite-code joins, admin community moderation, and trip creation all depend on the filtered community service layer.
- Firestore client rules also restrict community/trip/message reads to the four allowed community IDs.
- The old `seed-system-community` command now points to the allowed-community seed and no longer creates a general public/system community.
- The user-facing profile form no longer exposes an avatar URL field. Existing `avatar_url` data may remain and can still be used by display components as a fallback image source.

## Seed Command

Dry-run:

```bash
npm run seed:allowed-communities -- --dry-run
```

Apply:

```bash
npm run seed:allowed-communities
```

The seed command is idempotent. It upserts the four official `communities/{id}` documents and does not delete legacy data.

## Cleanup Command

Dry-run is the default and should always be reviewed first:

```bash
npm run cleanup:legacy-data
```

Apply the safe cleanup plan:

```bash
npm run cleanup:legacy-data -- --apply
```

Optional destructive deletes for clearly disposable smoke/test data:

```bash
npm run cleanup:legacy-data -- --apply --delete-test-data --delete-test-users
```

Optional Auth user deletion for clear test users:

```bash
npm run cleanup:legacy-data -- --apply --delete-test-data --delete-test-users --delete-auth-test-users
```

Optional orphan cleanup:

```bash
npm run cleanup:legacy-data -- --apply --delete-orphans
```

## Cleanup Behavior

The cleanup script always ensures the four allowed communities first.

Unwanted community handling:

- Allowed official communities are kept.
- Alias/duplicate communities that clearly map to an allowed community are migrated, then archived. For example, legacy names such as `azrieli` or `azraeli` map to `azrieli-college-engineering`.
- Clear smoke/test communities are archived by default. They are deleted only when `--delete-test-data` is passed.
- Ambiguous legacy communities are archived with `cleanup_status: archived` and `archive_reason: not_allowed_current_phase_manual_review`.

Reference handling:

- Trips in migrated communities are reassigned to the official target community.
- Community memberships and join requests are moved to the official target when no target record already exists. If a target record already exists, the old duplicate is removed without overwriting the target.
- Analytics events and reports with `community_id` are migrated where possible.
- Community documents that are not deleted are hidden with `listed: false` and archive metadata.

Destructive deletion behavior:

- `--delete-test-data` deletes clear smoke/test community graphs, including related trips and trip-linked bookings, messages, ratings, reports, and trip memberships.
- `--delete-test-users` deletes users whose display name/email is clearly smoke/test data and removes direct user-linked records.
- `--delete-auth-test-users` also deletes matching Firebase Auth users.
- `--delete-orphans` deletes trip-linked records whose `trip_id` no longer points to an existing trip.

## Manual Review

Do not run broad delete flags until the dry-run output has been reviewed.

Ambiguous communities should stay archived until an admin confirms whether they should be deleted or manually migrated.

The legacy E2E smoke script creates disposable `smoke-*` data. It now refuses to write to remote Firestore unless Firebase emulators are used or `SMOKE_ALLOW_REMOTE_FIRESTORE_WRITES=1` is set intentionally.
