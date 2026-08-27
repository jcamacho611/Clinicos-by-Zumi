# Grid Identity Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve a public Grid request intent across authentication and attach Grid contractor relationships to an existing Klinikos person/account without duplicating identity or changing current tenant/session authority.

**Architecture:** Keep public discovery account-free and use the existing same-origin `returnTo` gate only when a user attempts persistence. Resolve public listing context server-side after login and seed an editable authenticated Grid demand. For contractor enrollment, reuse the existing legacy user when the normalized email already exists, then create/reuse compatible universal identity relationship context without changing that user's existing organization, role, password, status, or active session authority.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma/PostgreSQL, Vitest, bcryptjs, existing Klinikos auth/session and universal-identity compatibility layers.

**Spec:** `docs/superpowers/specs/2026-08-27-grid-identity-persistence-design.md`

## Global Constraints

- Legacy `User.organizationId` and `User.roleKey` remain authoritative for current authentication sessions.
- Universal identity relationships are context only and must not grant tenant access, switch organizations, or elevate permissions.
- Public continuation state contains no PHI and no serialized private/authorization objects.
- Existing `safeReturnTo` remains the same-origin redirect validator.
- Provider, credential, malpractice, eligibility, production-compliance, and human-review gates remain fail-closed.
- Existing-user enrollment must not overwrite the user's organization, role, password credential, status, or current sessions.
- Duplicate or incompatible identity/application states fail closed rather than being silently merged.

---

### Task 1: Preserve provider-request intent across login

**Files:**
- Modify: `src/app/grid/browse/[listingId]/page.tsx`
- Modify: `src/app/(platform)/grid/needs/new/page.tsx`
- Modify: `src/components/grid/grid-need-composer.tsx`
- Test: `tests/grid-auth-continuation.test.ts`
- Test: `src/lib/auth/return-to.test.ts`

**Interfaces:**
- Consumes: `safeReturnTo(value: unknown): string | null`, `getMarketplaceListing(listingId)`.
- Produces: a login `returnTo` shaped as `/grid/needs/new?kind=provider&listingId=<public id>` and an authenticated server-side listing-to-draft seed.

- [ ] **Step 1: Write failing continuation tests**

Add tests that assert the public listing request link carries the direct authenticated persistence route rather than returning to the listing, and that the authenticated need page reads `listingId` and resolves it through `getMarketplaceListing` instead of trusting serialized listing data from the URL.

- [ ] **Step 2: Run focused tests and confirm RED**

Run the relevant Vitest files through CI or the repository test command. Expected failure: the listing currently returns to `/grid/browse/<id>` and the need page does not consume `listingId`.

- [ ] **Step 3: Extend `safeReturnTo` coverage**

Add a test proving `/grid/needs/new?kind=provider&listingId=abc123` is accepted while external-origin, protocol-relative, backslash, CR/LF, and overlong variants remain rejected.

- [ ] **Step 4: Implement the minimal public request return path**

Change the unauthenticated request CTA to point at:

```ts
const requestPath = `/grid/needs/new?kind=provider&listingId=${encodeURIComponent(listing.id)}`;
const loginHref = `/login?returnTo=${encodeURIComponent(requestPath)}`;
```

Do not add user/profile/provider authorization state to the URL.

- [ ] **Step 5: Resolve listing context server-side after login**

Extend the authenticated need page search params with `listingId?: string`. Resolve `getMarketplaceListing(listingId)` on the server. If absent/unavailable, continue with a blank provider need and a non-blocking message. If found, construct a `SavedGridDemand`-compatible seed using only public marketplace fields such as service name/category/description, states/service areas, applicable settings, price ceiling when useful, and `requiresClinicalEligibility: true`.

- [ ] **Step 6: Keep seeded context editable and persistence explicit**

Pass the seed into `GridNeedComposer`. Do not auto-submit. Ensure the existing composer message accurately describes public-listing context rather than claiming every seed came from clinic records.

- [ ] **Step 7: Run focused tests and confirm GREEN**

Run continuation + return-to tests and any Grid composer/page contract tests.

- [ ] **Step 8: Commit**

Commit with a focused message such as `feat: preserve Grid request intent through login`.

---

### Task 2: Add a universal-identity relationship attachment helper

**Files:**
- Modify: `src/lib/identity/relationship-repository.ts`
- Test: `tests/universal-identity-compatibility.test.ts`
- Test: create or extend focused identity repository tests if existing database-backed identity tests are present.

**Interfaces:**
- Consumes: legacy `User.id`, `User.organizationId`, existing universal identity compatibility records, target organization id, relationship type/status.
- Produces: an idempotent helper that ensures a compatible person record and organization relationship for a legacy user without changing legacy session authority.

- [ ] **Step 1: Write failing identity-boundary tests**

Add tests that require a helper with an explicit API similar to:

```ts
ensureOrganizationRelationshipForLegacyUser({
  userId,
  organizationId,
  relationshipType,
  status,
})
```

Assert source/behavior contracts that the helper never updates `User.organizationId`, `User.roleKey`, auth sessions, or default organization/session state.

- [ ] **Step 2: Run focused tests and confirm RED**

Expected failure: the helper does not yet exist.

- [ ] **Step 3: Implement compatible-person resolution**

Resolve the legacy user and its compatibility person using the repository's existing mapping rules. Reuse the existing compatibility person when one is unambiguous. If conflicting/ambiguous mappings are detected, throw a fail-closed conflict rather than relinking identity.

- [ ] **Step 4: Implement idempotent organization relationship creation**

Create or reuse the relationship for the target organization and relationship type. Keep relationship status explicit. Do not write any field that is interpreted as current-session tenant authority.

- [ ] **Step 5: Run identity tests and confirm GREEN**

Run the compatibility tests and any database-backed identity tests.

- [ ] **Step 6: Commit**

Commit with a focused message such as `feat: attach universal organization relationships safely`.

---

### Task 3: Reuse an existing user during Grid contractor enrollment

**Files:**
- Modify: `src/lib/repositories/grid-repository.ts`
- Modify only if necessary: `src/app/api/grid/enroll/route.ts`
- Test: existing Grid enrollment repository/API tests, or add `tests/grid-existing-user-enrollment.test.ts` following repository test conventions.

**Interfaces:**
- Consumes: `ensureOrganizationRelationshipForLegacyUser(...)` from Task 2 and `gridContractorEnrollmentSchema`.
- Produces: enrollment behavior that either creates a new pending contractor user or reuses an existing legacy user while creating the pending Grid provider/application relationship.

- [ ] **Step 1: Write failing existing-user enrollment tests**

Seed an active existing user with a non-contractor role and organization. Submit a Grid contractor enrollment with that exact normalized email. Assert the operation reuses the user id and preserves `organizationId`, `roleKey`, password credential, status, and active auth-session state while creating a separate pending provider/application and universal organization relationship.

- [ ] **Step 2: Write failing duplicate-application test**

Assert a second pending provider application for the same existing user and Grid review organization fails with a clear conflict.

- [ ] **Step 3: Run focused tests and confirm RED**

Expected failure: repository currently rejects every existing email with `An account already exists for this email address.`

- [ ] **Step 4: Refactor enrollment user resolution minimally**

Replace the unconditional existing-email rejection with two explicit branches:

```ts
const existingUser = await tx.user.findUnique({ ... });
const applicantUser = existingUser ?? await tx.user.create({ ...pending contractor fields... });
```

For an existing user, do not update organization, role, status, auth credential, or sessions.

- [ ] **Step 5: Add duplicate provider/application protection**

Before creating the provider, check for an existing provider/application tied to the same user and review organization. Fail closed with HTTP/repository conflict semantics if present.

- [ ] **Step 6: Attach universal relationship context**

Call the Task 2 helper or equivalent transaction-safe implementation to ensure the target Grid relationship exists. The universal relationship must not switch or grant current-session authority.

- [ ] **Step 7: Preserve current new-email behavior plus identity foundation**

For a new email, continue creating the pending contractor account and provider, then ensure the universal identity relationship exists for that newly created legacy user.

- [ ] **Step 8: Audit metadata distinguishes reused vs new identity**

Record whether the legacy account was reused or newly created without exposing password, credential evidence contents, or sensitive identity data in audit metadata.

- [ ] **Step 9: Run focused enrollment tests and confirm GREEN**

Verify existing-user, new-user, duplicate-application, and fail-closed production-review behavior.

- [ ] **Step 10: Commit**

Commit with a focused message such as `feat: reuse identity for Grid contractor enrollment`.

---

### Task 4: Full release verification and PR evidence

**Files:**
- Possibly modify: PR description/comment only if implementation evidence needs recording.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: exact-head CI evidence for PR #361.

- [ ] **Step 1: Run/observe full Quality on the exact head**

Require both `verify` and `deploy-contract` jobs to pass. This includes source confidentiality, Prisma generation/validation/migrations, type-check, lint, full tests, PostgreSQL MVP journeys, production build, post-build confidentiality, production startup, and health.

- [ ] **Step 2: Inspect any failure at the exact failing step**

Do not weaken gates. Pull job logs, identify root cause, add a failing regression test when behavior changed, repair, and rerun exact-head CI.

- [ ] **Step 3: Add concise PR evidence**

Summarize the implemented continuation and identity semantics, explicitly noting that existing tenant/session authority remains unchanged and universal identity relationships do not grant access.

- [ ] **Step 4: Stop before merge unless the PR's broader scope and reviews are fully satisfied**

Keep PR #361 draft if other planned slices remain incomplete.
