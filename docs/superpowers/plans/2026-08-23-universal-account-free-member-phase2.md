# Universal Account + Free Member Phase 2 Plan

**Goal:** Add the canonical Account authentication principal on top of PR #245's lifelong Person substrate, migrate existing staff credentials compatibly, and support a real free person-level account with no fake organization.

**Base:** PR #245 head `96bd205bfbe6543bcf435abe9eb2488d4dadee91`. Before merge, reconcile onto current `main` and re-run all migration/release proof.

**Hard invariants:** no organization is created for free signup; `MemberSession` cannot satisfy Clinic OS authorization; existing patient portal auth is untouched; legacy User/AuthCredential/AuthSession are preserved during migration; exact-head release verification remains required before merge; historical protected-entry acceptance rows are not mutated merely to attach Account identity.

## Task 1 — RED contracts

Create tests first:

- `tests/universal-account-schema.test.ts`
- `tests/free-member-auth-boundary.test.ts`
- `tests/free-member-signup-contract.test.ts`
- `tests/account-legacy-compatibility.test.ts`
- `tests/free-member-account-event.test.ts`
- `tests/free-member-relogin.test.ts`

Lock:

- Account/AccountCredential/AccountSession/LegacyUserAccountLink exist in multi-file Prisma;
- Account is one-to-one with Person;
- no organizationId on Account;
- free signup source contains no Organization create/membership create;
- session types distinguish `member` and `clinic`;
- member context cannot become Clinic OS context;
- patient PortalAccount files are untouched;
- migration copies existing credentials but does not delete legacy auth rows;
- neutral account lifecycle evidence exists without tenant audit fabrication;
- protected-entry Account binding is append-only and does not mutate historical acceptance rows;
- free members can re-login after the initial signup session without creating clinic authority.

Commit RED contracts before each corresponding production change.

## Task 2 — Additive account schema + migration

Create:

- `prisma/models/universal-account.prisma`
- `prisma/migrations/20260823190000_universal_account_foundation/migration.sql`

Models:

- Account
- AccountCredential
- AccountSession
- LegacyUserAccountLink
- AccountEvent
- AccountEntryAcceptanceBinding

Migration:

- additive tables only;
- unique Account primaryEmail;
- unique Account personId;
- unique LegacyUserAccountLink legacyUserId;
- unique AccountEntryAcceptanceBinding acceptanceId;
- backfill only from deterministic Person ↔ legacy membership ↔ User mappings;
- copy AuthCredential hashes/status to AccountCredential;
- create neutral account backfill events;
- never delete/update legacy User/AuthCredential/AuthSession data;
- never mutate historical AccessGateAcceptance rows merely to attach Account identity;
- fail transaction on ambiguous normalized email/person mapping.

## Task 3 — Account repository and credentials

Create:

- `src/lib/auth/account-types.ts`
- `src/lib/auth/account-repository.ts`
- `src/lib/auth/account-credentials.ts`

Required interfaces:

```ts
export type MemberIdentity = {
  accountId: string;
  personId: string;
  email: string;
  name: string;
  source: "account";
};

export type ClinicAccountIdentity = MemberIdentity & {
  legacyUserId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: ClinicRole;
};
```

Account credential auth resolves:

- valid AccountCredential;
- active Account/Person;
- optional LegacyUserAccountLink;
- if exactly one linked, active legacy User + active org + normalized clinic role;
- if no links, member identity;
- if multiple legacy links, member identity until an explicit context-selection design exists.

No credential success alone grants organization context. Query ordering must never silently choose a tenant.

## Task 4 — Canonical account session token

Create:

- `src/lib/auth/account-token.ts`
- `src/lib/auth/account-session.ts`

Cookie: `klinikos_account_session`.

Claims are discriminated by `kind: "member" | "clinic"`.

Persist every real account session in AccountSession.

`requireAccountSession()` accepts both.

`requireAccountClinicSession()` accepts only `clinic`, revalidates AccountSession + Account + Person + LegacyUserAccountLink + legacy User + org, and projects the existing `ClinicSession` shape for compatibility.

Do not replace existing `clinicos_session` in this tranche. Existing clinic login remains live while the new account path is proven. This is a controlled migration seam, not final dual-auth architecture.

## Task 5 — Free signup transaction

Create:

- `src/lib/auth/free-member-signup.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/signup/page.tsx`
- `src/app/signup/FreeSignupClient.tsx`

Schema:

- name 2–140 chars;
- normalized email;
- strong password >=12 with lower/upper/number/symbol;
- accepted protected-entry evidence from the server-owned Gateway cookie/proof.

Transaction:

- reject existing Account email;
- reject conflicting legacy User email not represented by a deterministic Account link;
- create Person;
- create Account;
- create AccountCredential;
- revalidate exact protected-entry acceptance id/key/version/hash;
- insert one append-only AccountEntryAcceptanceBinding;
- append neutral `account.created` AccountEvent;
- create AccountSession;
- no Organization/User/OrganizationMembership/LocationAssignment creation;
- no tenant audit fabrication.

Public signup remains feature-flagged off with `KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED` until migration, compatibility, Gateway, and release gates are satisfied.

## Task 6 — Existing staff compatibility proof

Add compatibility helper/test that compares legacy credential identity to Account credential identity for backfilled users:

- same user id through LegacyUserAccountLink;
- same organization id through the deterministic current membership;
- same normalized role;
- no broader memberships used to switch tenant;
- legacy password hash copied exactly, not rehashed from unknown plaintext;
- lock/reset/password-change state retained.

Do not flip the legacy clinic login endpoint to Account auth in this phase. Cutover is a later focused PR after release gates execute.

## Task 7 — Durable free-member re-login

Extend the existing login route conservatively:

1. attempt existing legacy clinic authentication first, unchanged;
2. only if it does not authenticate, attempt Account credentials;
3. if Account resolves clinic context, reject the fallback and keep clinic authorization on the legacy rail;
4. if Account resolves member-only context, create AccountSession and route to `/member`;
5. never create `clinicos_session` from the member fallback.

This prevents a free Account from becoming one-session-only without creating an alternate Clinic OS authorization rail.

## Task 8 — Legal evidence account-binding seam

Create:

- `src/lib/legal/account-acceptance-binding.ts`

The helper:

- verifies exact original acceptance id/key/version/hash and signed/current state;
- requires the free-account acceptance not already be legacy user/organization bound;
- never updates the original AccessGateAcceptance row;
- inserts one unique AccountEntryAcceptanceBinding;
- handles same-binding replay idempotently;
- fails closed on conflicting replay;
- appends a neutral legal agreement event;
- grants no product authority.

## Task 9 — First authenticated member landing

Create:

- `src/app/member/page.tsx`

This is intentionally minimal and rose-native:

- validates `requireAccountSession()`;
- if clinic kind, offers continue into existing Clinic OS route;
- if member kind, presents Living Home onboarding handoff: `What brings you to Klinikos?`;
- does not yet persist inferred intent;
- routes toward Phase 3 Zumi activation.

Do not duplicate Living Home internals yet.

## Task 10 — Documentation and rollout flags

Update `.env.example` with:

`KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED=""`

Document that this remains off until:

- PR #245 is reconciled onto current main and lands;
- account migration is verified on production-shaped disposable infrastructure;
- staff compatibility proof succeeds;
- Gateway account binding is reconciled;
- member → Clinic OS denial is proven;
- free-member logout/re-login works without creating clinic authority;
- exact-head release gate executes.

## Task 11 — Reconcile current main

Current main has advanced beyond the original `4638b33...` baseline and contains gate repairs that were locally verified. Before review/merge:

- re-anchor or reconcile PR #245 onto latest main;
- preserve current-main fixes rather than replaying stale versions;
- refresh this Phase 2 stack from the reconciled identity head;
- audit overlapping auth/legal files from Gateway #263;
- keep only one authoritative implementation of each entry/auth/legal seam.

## Task 12 — Verification / PR

Run, on the exact reconciled head when executable:

- Prisma generate + validate;
- full fresh PostgreSQL migration chain;
- universal identity migration rehearsal;
- account migration rehearsal;
- staff compatibility verifier;
- focused account/auth/legal source and executable tests;
- TypeScript;
- lint;
- security checks;
- production build/start smoke;
- repository release commands.

Open a draft PR with the dependency explicit only after fresh verification evidence is available. Do not merge while PR #245 or release-gate infrastructure remains unresolved.
