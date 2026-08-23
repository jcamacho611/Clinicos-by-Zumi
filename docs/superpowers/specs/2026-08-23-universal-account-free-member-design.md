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
- `AccountEvent` — neutral person/account lifecycle evidence when no organization exists.
- `AccountEntryAcceptanceBinding` — append-only association of exact protected-entry legal evidence to Account + Person.
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

AccountEvent
- id
- accountId
- eventType
- sourceType
- sourceReference?
- metadata?
- createdAt

AccountEntryAcceptanceBinding
- id
- acceptanceId UNIQUE
- accountId
- personId
- documentKey
- documentVersion
- documentSha256
- boundAt
```

The compatibility mapping deliberately avoids modifying the legacy `User` model in this tranche.

`AccountEvent` carries no organization id, clinic role, credential state, entitlement, or patient context. It exists so person-level actions can have durable evidence without fabricating tenant audit data.

`AccountEntryAcceptanceBinding` deliberately leaves the original `AccessGateAcceptance` row immutable. The binding table records the exact acceptance id/key/version/hash associated with Account + Person after the original legal evidence is revalidated. This prevents Prisma drift from hidden legacy-model columns and preserves append-oriented legal evidence.

## Migration/backfill

The forward migration must:

1. create the additive account, credential, session, legacy-link, account-event, and entry-binding tables;
2. create one Account for every backfilled Person that has the deterministic current legacy membership with `legacyUserId`;
3. use the existing legacy User email/name for that Account;
4. create a LegacyUserAccountLink;
5. copy the existing AuthCredential password hash and reset/lock metadata into AccountCredential;
6. never invent credentials for users who do not have a legacy AuthCredential;
7. never delete or mutate legacy User/AuthCredential/AuthSession rows in this tranche;
8. fail if ambiguous normalized email or Person/current-organization mappings would be created;
9. record a neutral `account.backfilled_from_legacy_user` AccountEvent;
10. leave historical `access_gate_acceptances` rows unchanged.

Legacy credentials become compatibility evidence after cutover, not an alternate path that can mint broader authority.

## Session architecture

The new account rail uses a separately persisted account cookie during the proof period. The token represents authenticated account identity first, not clinic authority.

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

`requireAccountClinicSession()` narrows only a session with a real active organization relationship and legacy User compatibility context, revalidates persisted state, and then projects the existing `ClinicSession` shape.

Existing Clinic OS APIs continue using the current `clinicos_session` / `requireClinicSession()` rail in this tranche. Account-session cutover for clinic users is a later focused migration after exact-head verification.

## Authentication compatibility during this phase

Existing clinic login remains first and authoritative:

`email/password → legacy AuthCredential → active User + active Organization → current ClinicSession`

Only when the legacy clinic rail does not authenticate does the login endpoint try Account credentials.

The fallback is deliberately restricted to identities that resolve to **member-only** context:

`email/password → AccountCredential → Account → no clinic context → MemberSession`

If Account authentication resolves a clinic-capable identity, the fallback rejects it rather than creating Clinic OS authority. Existing staff continue through the current clinic rail until the separately verified cutover.

This gives free members durable re-login without turning the migration seam into a second path for clinic authorization.

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
8. verify the original acceptance id/key/version/hash and insert one append-only AccountEntryAcceptanceBinding;
9. append the neutral `account.created` AccountEvent;
10. create AccountSession;
11. route to the authenticated Living Home onboarding state.

All writes above occur in the same serializable transaction. If legal binding or session creation fails, Person/Account/Credential/Event creation rolls back.

The free signup transaction creates **no Organization** and **no OrganizationMembership**.

## Existing gateway compatibility

Gateway v1 PR #263 currently binds entry acceptance to legacy User + Organization after clinic login because that is the highest safe authority available on its original mainline.

On this stacked Phase 2 branch, the protected-entry airlock is composed with Account signup so the same server-owned accepted-entry token/evidence can be consumed by free signup.

Account-level binding is additive and append-only:

- the original acceptance row remains unchanged;
- exact acceptance id/key/version/hash must match current evidence;
- the acceptance may not already be organization/user bound for the free-account path;
- one acceptance id can bind to only one Account/Person identity;
- a legal agreement event records the binding;
- no organization, role, credential, Grid, EDU, clinical, payment, or patient authority is granted by the binding.

Clinic-context Gateway convergence remains a later focused reconciliation after the Account rail is verified.

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

- same-origin mutation controls on free signup;
- strong password policy;
- existing rate-limit concepts extended to Account;
- no browser-created authority;
- account session persisted server-side;
- session invalidation/revocation server-owned;
- entry evidence required before free signup;
- account email uniqueness and migration ambiguity fail closed;
- multi-link account identity does not select a tenant by array/query order;
- clinic context is re-resolved against active persisted authority rather than trusted solely from JWT claims;
- free-member login fallback cannot create Clinic OS sessions;
- original legal acceptance evidence remains immutable during account binding;
- no PHI in signup/onboarding analytics or AccountEvent metadata.

Email ownership is not claimed merely because an Account row contains an email. `emailVerifiedAt` remains null until a separately governed verification ceremony succeeds. Consequential email-dependent features must not treat an unverified address as verified identity assurance.

## Rollout

This phase remains stacked behind PR #245 and cannot merge independently.

Rollout order:

1. reconcile PR #245 onto current main and re-run its identity migration proof;
2. account schema migration passes clean production-shape database rehearsal;
3. existing user backfill count/equality/credential-copy checks pass;
4. auth/session compatibility tests pass;
5. controlled existing staff login continues to reach identical legacy organization context;
6. controlled free signup produces Account+Person with zero organizations;
7. direct member access to Clinic OS fails closed;
8. member logout/re-login returns to member context and never creates clinic authority;
9. member Living Home onboarding succeeds;
10. Gateway account-level binding evidence is proven against the exact agreement hash;
11. exact-head release gates execute on the reconciled branch;
12. only then expose public `Create free account` broadly.

`KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED` remains blank/off by default until those gates are satisfied.

## Non-goals

- no organization-context selector yet;
- no multi-org switching yet;
- no professional credential verification yet;
- no public Grid profile creation yet;
- no EDU enrollment yet;
- no patient identity merge;
- no social login/passkey migration yet;
- no deletion of legacy User/AuthCredential/AuthSession in this tranche;
- no claim that email ownership is verified at account creation;
- no production rollout claim while exact-head release verification is unavailable.
