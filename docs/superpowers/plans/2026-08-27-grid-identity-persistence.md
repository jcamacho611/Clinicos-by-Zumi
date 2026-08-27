# Grid Identity Persistence Implementation Plan

> **For agentic workers:** Use the repository's TDD and verification workflow task-by-task.

**Goal:** Preserve public Grid intent across authentication and let an existing Klinikos account add a Grid professional relationship without duplicate identity or implicit tenant/role switching.

**Architecture:** Public discovery stays account-free. Persistence uses the existing same-origin `returnTo` gate. Public listing state is re-read server-side after login. Universal identity remains relationship context only. Existing-account enrollment requires a validated session matching that exact legacy user and email; email equality alone never authorizes attachment. Existing legacy organization, role, password, status, provider link, and sessions remain untouched.

**Spec:** `docs/superpowers/specs/2026-08-27-grid-identity-persistence-design.md`

## Global constraints

- Legacy `User.organizationId` and `User.roleKey` remain current-session authority.
- Universal identity relationships never grant access, switch organizations, or elevate permissions.
- No PHI or serialized private/authorization objects in continuation URLs.
- Credential, malpractice, eligibility, production-compliance, and human-review gates remain fail-closed.
- Existing-account relationship attachment requires proof of control from a validated matching session.
- `Provider.userId` is one-to-one; an added cross-context Grid application must not overwrite an existing provider link.
- Duplicate or ambiguous identity/application states fail closed.

---

## Task 1: Preserve provider-request intent across login

**Files:**
- `src/app/grid/browse/[listingId]/page.tsx`
- `src/app/(platform)/grid/needs/new/page.tsx`
- `src/components/grid/grid-need-composer.tsx`
- `tests/grid-auth-continuation.test.ts`
- `src/lib/auth/return-to.intent.test.ts`

- [x] Write failing continuation tests.
- [x] Confirm RED in Quality.
- [x] Cover the same-origin Grid persistence `returnTo` route.
- [x] Send listing requests directly to `/grid/needs/new?kind=provider&listingId=...` through login when necessary.
- [x] Re-resolve the current public listing server-side after authentication.
- [x] Seed an editable demand without auto-submitting or trusting serialized listing state.
- [x] Handle stale/unpublished listing ids with a blank safe provider need.
- [x] Run full Quality and deploy-contract GREEN on exact head `55952d37226d6f1e9b2c5278f91c7a497daee0f6`.

---

## Task 2: Add a transaction-safe universal relationship attachment helper

**Files:**
- Modify: `src/lib/identity/relationship-repository.ts`
- Test: `src/lib/identity/relationship-repository.test.ts`
- Test: `tests/universal-identity-compatibility.test.ts`

**Interface:**

```ts
ensureOrganizationRelationshipForLegacyUser({
  userId,
  organizationId,
  membershipType,
  roleKey,
  status,
  sourceType,
  sourceReference,
}, client?)
```

- [ ] Write failing tests proving the helper does not yet exist and that ambiguous person mappings must fail closed.
- [ ] Confirm RED.
- [ ] Resolve the legacy user and compatible `Person` using deterministic legacy id, `legacy_user` source reference, and existing memberships.
- [ ] Fail if those compatibility signals resolve to more than one person.
- [ ] Ensure the legacy baseline organization membership exists without changing the legacy user.
- [ ] Create/reuse an idempotent target organization relationship using a deterministic relationship id.
- [ ] Never update `User.organizationId`, `User.roleKey`, `User.status`, credentials, provider link, or auth sessions.
- [ ] Run focused identity tests GREEN.

---

## Task 3: Make Grid contractor enrollment identity-safe

**Files:**
- Modify: `src/lib/grid-rules.ts`
- Modify: `src/lib/repositories/grid-repository.ts`
- Modify: `src/app/api/grid/enroll/route.ts`
- Modify: `src/app/grid/join/page.tsx`
- Modify: `src/components/clinic/grid/contractor-enrollment-form.tsx`
- Test: add focused enrollment tests following existing Vitest mock conventions.

### Public new-account path

- [ ] Keep public enrollment available for a genuinely new normalized email.
- [ ] Require a strong password for a new account at repository boundary even though the schema permits omission for authenticated-existing-account mode.
- [ ] Create the pending contractor legacy user and linked pending provider as today.
- [ ] Ensure universal person, baseline membership, and pending Grid applicant relationship are created in the same transaction.

### Existing-account path

- [ ] Pass `getAuthenticationSession()` identity into enrollment repository as proof of control.
- [ ] If the submitted email already exists and no matching session controls that exact user, fail closed. Do not attach identity by email alone.
- [ ] If authenticated, bind the enrollment email to the session and omit password collection/replacement.
- [ ] Reject authenticated attempts to submit a different email.
- [ ] Reject a prior Grid applicant relationship for the same legacy user and review organization.
- [ ] Create the new pending provider with `userId: null` so the existing one-to-one legacy provider link is not seized or replaced.
- [ ] Attach the pending provider through the universal `grid_contractor_applicant` organization relationship with provider provenance.
- [ ] Do not mutate the existing user's organization, role, password credential, status, provider link, or active sessions.
- [ ] Audit whether the legacy account was new or reused without recording secrets/evidence contents.

### UX

- [ ] Show a sign-in-first path for people who already have Klinikos accounts.
- [ ] After sign-in, prefill/bind the account email and hide the password field.
- [ ] Preserve the existing human-review message and regulated-work safety boundaries.

### Tests

- [ ] Existing email without matching authenticated session cannot attach.
- [ ] Matching authenticated user is reused with all legacy authority fields untouched.
- [ ] Authenticated user/email mismatch fails closed.
- [ ] Existing legacy provider link is not changed.
- [ ] Duplicate Grid applicant relationship is rejected.
- [ ] New email still requires password and creates compatibility identity records.
- [ ] Production/non-demo public-enrollment guard remains fail-closed.

---

## Task 4: Full release verification and PR evidence

- [ ] Require exact-head `verify` and `deploy-contract` Quality jobs GREEN.
- [ ] On any failure, inspect the exact failing step and repair root cause without weakening gates.
- [ ] Review PR #361 changed files and latest review notes for remaining scope or regressions.
- [ ] Add concise PR evidence describing continuation, proof-of-control, one-identity relationship semantics, and unchanged tenant/session authority.
- [ ] Keep PR #361 draft unless its broader planned scope and reviews are complete.
