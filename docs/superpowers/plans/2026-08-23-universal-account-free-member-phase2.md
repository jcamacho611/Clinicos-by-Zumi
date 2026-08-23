# Universal Account + Free Member Phase 2 Plan

**Goal:** Add the canonical Account authentication principal on top of PR #245's lifelong Person substrate, migrate existing staff credentials compatibly, and support a real free person-level account with no fake organization.

**Base:** PR #245 head `96bd205bfbe6543bcf435abe9eb2488d4dadee91`.

**Hard invariants:** no organization is created for free signup; `MemberSession` cannot satisfy Clinic OS authorization; existing patient portal auth is untouched; legacy User/AuthCredential/AuthSession are preserved during migration; exact-head release verification remains required before merge.

## Task 1 — RED contracts

Create tests first:

- `tests/universal-account-schema.test.ts`
- `tests/free-member-auth-boundary.test.ts`
- `tests/free-member-signup-contract.test.ts`

Lock:

- Account/AccountCredential/AccountSession/LegacyUserAccountLink exist in multi-file Prisma;
- Account is one-to-one with Person;
- no organizationId on Account;
- free signup source contains no Organization create/membership create;
- session types distinguish `member` and `clinic`;
- `requireClinicSession` rejects member context;
- patient PortalAccount files are untouched;
- migration copies existing credentials but does not delete legacy auth rows;
- legal acceptance extension supports nullable accountId/personId evidence without changing old rows.

Commit RED tests before production files.

## Task 2 — Additive account schema + migration

Create:

- `prisma/models/universal-account.prisma`
- `prisma/migrations/20260823190000_universal_account_foundation/migration.sql`

Models:

- Account
- AccountCredential
- AccountSession
- LegacyUserAccountLink

Migration:

- additive tables only;
- unique Account primaryEmail;
- unique Account personId;
- unique LegacyUserAccountLink legacyUserId;
- backfill only from deterministic Person ↔ legacy membership ↔ User mappings;
- copy AuthCredential hashes/status to AccountCredential;
- add nullable `accountId` and `personId` columns + indexes to `access_gate_acceptances` if absent;
- never delete/update legacy User/AuthCredential/AuthSession data;
- fail transaction on ambiguous email/person mapping.

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
- if linked, active legacy User + active org + normalized clinic role;
- otherwise member identity.

No credential success alone grants organization context.

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
- optional safe same-origin returnTo;
- entry acceptance id/token seam only when gateway convergence is available/enforced.

Transaction:

- reject existing Account email;
- reject conflicting legacy User email not represented by a deterministic Account link;
- create Person;
- create Account;
- create AccountCredential;
- create AccountSession;
- no Organization/User/OrganizationMembership/LocationAssignment creation;
- write minimum audit/evidence event to an account-scoped audit seam or account event table if available; do not fabricate tenant audit data.

Until Gateway #263 is merged/reconciled, public signup remains feature-flagged off with `KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED`.

## Task 6 — Existing staff compatibility proof

Add compatibility helper/test that compares legacy credential identity to Account credential identity for backfilled users:

- same user id through LegacyUserAccountLink;
- same organization id;
- same normalized role;
- no broader memberships used to switch tenant;
- legacy password hash copied exactly, not rehashed from unknown plaintext;
- locked/reset state retained.

Do not flip the legacy login endpoint to Account auth in this phase. Cutover is a later focused PR after release gates execute.

## Task 7 — Legal evidence account-binding seam

Create:

- `src/lib/legal/account-acceptance-binding.ts`

The helper binds an existing anonymous protected-entry acceptance to accountId/personId by exact acceptance id/key/version/hash only when currently unbound at account level.

It does not set userId/organizationId and cannot grant any product authority.

Gateway convergence later calls this before optional clinic-context binding.

## Task 8 — First authenticated member landing

Create:

- `src/app/member/page.tsx`

This is intentionally minimal and rose-native:

- validates `requireAccountSession()`;
- if clinic kind, offers continue into existing Clinic OS route;
- if member kind, presents Living Home onboarding handoff: `What brings you to Klinikos?`;
- does not yet persist inferred intent;
- routes toward Phase 3 Zumi activation.

Do not duplicate Living Home internals yet.

## Task 9 — Documentation and rollout flags

Update `.env.example` on this stacked branch with:

`KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED=""`

Document that this remains off until:

- PR #245 lands;
- account migration verified;
- staff compatibility proof succeeds;
- Gateway account binding reconciled;
- member → Clinic OS denial proven;
- exact-head release gate executes.

## Task 10 — Verification / PR

Focused source tests, Prisma validation, TypeScript/lint/security/release commands when executable.

Open a draft PR with base `canon/final-form-convergence-2026-08-22` so dependency is explicit.

Do not merge while PR #245 or release-gate infrastructure remains unresolved.
