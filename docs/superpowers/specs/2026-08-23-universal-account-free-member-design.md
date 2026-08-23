# Universal Account + Free Member Architecture

Date: 2026-08-23  
Status: APPROVED DIRECTION / STACKED ON PR #245  
Dependency: `canon/final-form-convergence-2026-08-22` / PR #245

## Purpose

Implement the first real person-level free membership path required by the approved Klinikos gateway/freemium design without creating fake organizations, weakening tenant isolation, or creating a permanent second identity system.

The product requirement is:

`PROTECTED ENTRY → FREE ACCOUNT → LIFELONG PERSON → ZUMI ACTIVATION → CONTEXTUAL EXPERIENCE → REAL ORG RELATIONSHIP WHEN/IF NEEDED`

A person must be able to join Klinikos before they own, work for, or represent an organization.

## Current constraint

Current `User` authentication is organization-bound:

- `User.organizationId` is required;
- `ClinicSession` requires organization id/name/slug + clinic role;
- `AuthCredential` and `AuthSession` are attached to `User`;
- `requireClinicSession()` assumes a real organization tenant.

PR #245 correctly introduced `Person`, `OrganizationMembership`, and `LocationAssignment` as additive lifelong relationship truth while intentionally leaving current authentication unchanged.

Creating a synthetic/fake Organization for every free member is rejected. It would make organization membership meaningless, pollute network/tenant data, create dangerous cross-tenant assumptions, and violate the Supreme Canon's Organization Law.

Making `User.organizationId` nullable immediately is also rejected for this tranche because it would change generated types across the entire legacy application before the account/session authorization seam is established and verified.

## Recommended migration architecture

Introduce a canonical `Account` authentication principal linked one-to-one to `Person`, plus an explicit compatibility mapping to existing legacy `User` records.

Conceptual layers:

- `Person` — lifelong human identity.
- `Account` — canonical authentication/access principal.
- `AccountCredential` — canonical password credential for Account.
- `AccountSession` — canonical authenticated session independent of organization.
- `LegacyUserAccountLink` — transitional adapter from Account to an existing organization-bound legacy User.
- `OrganizationMembership` — actual effective-dated relationship to an organization.
- `ClinicSession` — a narrowed organization-authorized workspace context derived only when a real active legacy User/membership/organization context exists.
- `MemberSession` — authenticated person-level free context with no organization authority.

This is a staged replacement of legacy auth, not a second permanent auth product.

## Data model

Additive multi-file Prisma models:

```text
Account
- id
- personId UNIQUE
- primaryEmail UNIQUE
- displayName
- status
- emailVerifiedAt?
- createdAt / updatedAt

AccountCredential
- id
- accountId UNIQUE
- passwordHash
- passwordChangedAt
- mustReset
- failedAttempts
- lockedUntil
- createdAt / updatedAt

AccountSession
- id
- accountId
- expiresAt
- lastSeenAt
- revokedAt?
- ipAddress?
- userAgent?
- createdAt / updatedAt

LegacyUserAccountLink
- id
- accountId
- legacyUserId UNIQUE
- sourceType
- createdAt
```

The compatibility mapping deliberately avoids modifying the legacy `User` model in this tranche.

## Migration/backfill

The forward migration must:

1. create the four additive account tables;
2. create one Account for every active/backfilled Person that has an effective legacy membership with `legacyUserId`;
3. use the existing legacy User email/name for that Account;
4. create a LegacyUserAccountLink;
5. copy the existing AuthCredential password hash and reset/lock metadata into AccountCredential;
6. never invent credentials for users who do not have a legacy AuthCredential;
7. never delete or mutate legacy AuthCredential/AuthSession rows in this tranche;
8. preserve exact uniqueness and fail if ambiguous duplicate account/email mappings would be created.

Legacy credentials become compatibility evidence after cutover, not an alternate path that can mint broader authority.

## Session architecture

Use one canonical browser cookie after cutover. The token represents authenticated account identity first, not clinic authority.

Base account claims:

```text
sessionId
accountId
personId
email
name
kind = member | clinic
demo
expiresAt
```

Clinic-context claims additionally include:

```text
legacyUserId
organizationId
organizationName
organizationSlug
role
```

The token verifier returns a discriminated union.

`MemberSession` cannot be passed to Clinic OS repositories.

`requireAccountSession()` authorizes authenticated person-level surfaces.

`requireClinicSession()` narrows only a session with a real active organization relationship and legacy User compatibility context.

Existing clinic APIs can continue consuming the existing `ClinicSession` shape through a compatibility projector while the codebase migrates incrementally.

## Authentication cutover

The credential login resolver becomes Account-first.

For existing staff:

`email/password → AccountCredential → Account → LegacyUserAccountLink → active legacy User + org → clinic-capable authenticated session`

For a new free member:

`email/password → AccountCredential → Account → no legacy link → member session`

No free member receives a clinic role, organization id, provider authority, Grid professional verification, EDU completion, seller authority, or patient access merely by signing up.

## Signup

Minimal free signup asks only:

- name;
- email;
- password;
- required protected-entry evidence already established by the Gateway;
- necessary privacy/security disclosures.

Creation transaction:

1. verify current protected-entry accepted evidence;
2. normalize email;
3. reject existing Account email;
4. reject/route legacy User email that has not yet been backfilled consistently;
5. create Person;
6. create Account;
7. create AccountCredential;
8. bind the entry acceptance to Account/Person identity evidence through an account-level legal binding event;
9. create AccountSession;
10. route to the authenticated Living Home onboarding state.

The free signup transaction creates **no Organization** and **no OrganizationMembership**.

## Existing gateway compatibility

Gateway v1 PR #263 currently binds entry acceptance to legacy User + Organization after clinic login because that is the highest safe authority available on main.

After Account lands, Gateway gets a small convergence update:

- bind pre-auth entry evidence to Account/Person first;
- if login resolves a clinic context, also record the applicable organization context without making organization identity part of the baseline contract identity;
- free signup can therefore bind the same exact entry evidence without inventing organization context.

This convergence is a later small PR after both stacks are reviewable.

## Patient boundary

`PortalAccount` remains separately governed. This tranche does not merge patient portal authentication into the professional/member Account login.

A future identity-association program may link the same real-world Person to a protected patient context only through explicit, privacy-preserving identity resolution. It must never make patient records visible to Grid/public/professional projections.

## Authorization invariants

A MemberSession may access only surfaces explicitly authorized for person-level membership, such as:

- Living Home onboarding;
- basic private profile;
- bounded Zumi onboarding;
- public/free Grid discovery and future participant setup;
- EDU discovery / future learner setup;
- invitations and relationship setup as explicitly designed.

A MemberSession may not access:

- Clinic OS tenant data;
- Current Visit;
- patient charts;
- organization settings;
- billing/claims;
- organization network data;
- privileged professional workflows;
- production seller/merchant actions;
- regulated Grid opportunities requiring eligibility;
- PHI-bearing private product data.

## Progressive organization attachment

When the person later joins/claims/creates a real organization:

`Account/Person → OrganizationMembership → applicable role/profession/credential/privilege → explicit active context → ClinicSession`

Organization creation remains a separate governed action. It may require commercial terms, ownership/authority evidence, payment, or implementation workflow depending on the organization/product path.

## Security

- same-origin mutation controls on signup/login;
- strong password policy;
- existing rate-limit concepts extended to Account;
- no browser-created authority;
- account session persisted server-side;
- session invalidation/revocation server-owned;
- entry evidence required before free signup when gateway enforcement is enabled;
- account email uniqueness and migration ambiguity fail closed;
- clinic context is re-resolved against active persisted authority rather than trusted solely from JWT claims;
- no PHI in signup/onboarding analytics.

## Rollout

This phase remains stacked behind PR #245 and cannot merge independently.

Rollout order:

1. PR #245 identity foundation lands and migration is verified;
2. account schema migration passes clean production-shape database rehearsal;
3. existing user backfill count/equality/credential-copy checks pass;
4. auth/session compatibility tests pass;
5. controlled existing staff login succeeds through Account and reaches identical organization context;
6. controlled free signup produces Account+Person with zero organizations;
7. direct member access to Clinic OS fails closed;
8. member Living Home onboarding succeeds;
9. Gateway account-level binding convergence lands;
10. only then expose public `Create free account` broadly.

## Non-goals

- no organization-context selector yet;
- no multi-org switching yet;
- no professional credential verification yet;
- no public Grid profile creation yet;
- no EDU enrollment yet;
- no patient identity merge;
- no social login/passkey migration yet;
- no deletion of legacy User/AuthCredential/AuthSession in this tranche;
- no production rollout claim while CI/release verification is blocked.
