# Claim → Verification → Organization Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class claim lifecycle that lets one Klinikos identity assert professional or organization relationships, receive free Grid value, and progress through evidence/verification without silently granting tenant access, regulated eligibility, or session authority.

**Architecture:** Add a focused `RelationshipClaim` model alongside universal identity. Claims are assertions; verification is a separate bounded state; `OrganizationMembership` remains relationship context only; current `User.organizationId`, `User.roleKey`, provider link, credentialing, Grid eligibility, and authenticated session remain authority. Existing organizations can be claimed only by a session-proven identity; new organization presences remain explicitly unverified Grid/network compatibility containers until separately provisioned as protected operational tenants.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Prisma 6 multi-file schema (`prisma.config.ts` points at `prisma/`), PostgreSQL, Zod 4, Vitest, existing Klinikos auth/RBAC/audit/task/credentialing/Grid repositories.

**Spec:** `docs/superpowers/specs/2026-08-27-claim-verification-organization-context-design.md`

## Global Constraints

- `IDENTITY → CLAIM → EVIDENCE → VERIFICATION → ENTITLEMENT → AUTHORITY` remains the governing lifecycle.
- A claim never grants tenant access, role elevation, Grid regulated-work eligibility, credential verification, financial authority, or clinical authority.
- Existing `User.organizationId`, `User.roleKey`, `User.status`, password/auth credential, `Provider.userId`, and active sessions must not change when a claim is submitted or reviewed.
- Existing-account attachment requires a validated server-side session matching the exact legacy user. Email equality alone is never proof of control.
- Universal identity ambiguity fails closed for human review.
- Professional verification reuses existing provider credentialing; regulated activity eligibility remains in deterministic Grid eligibility.
- New organization presence is unverified network/Grid state, not proof of ownership and not a Clinic OS tenant grant.
- No raw evidence contents, secrets, auth/session objects, private organization objects, or verification outcomes are trusted from client URLs or request bodies.
- Claim review requires server-authorized identity-management permission in the target organization; reviewer identity and target are re-resolved server-side.
- No PHI is required or introduced by this slice.
- Public/client-visible surfaces follow the Marble / Obsidian / Living Edge design acceptance canon and accessibility rules.
- PR #361 remains draft and unmerged through this slice.

---

## File Structure

### New domain files

- `prisma/models/relationship-claims.prisma` — Prisma model for claim assertions and review state.
- `prisma/migrations/20260827203000_relationship_claims/migration.sql` — additive table/index/FK migration.
- `src/lib/identity/relationship-claim-rules.ts` — allowlisted claim/target/status schemas and transition rules.
- `src/lib/identity/relationship-claim-repository.ts` — session-proven claim submission, idempotency/conflict detection, review transitions, relationship projection, audit/task writes.
- `src/app/api/identity/claims/route.ts` — authenticated claim submission/list boundary.
- `src/app/api/identity/claims/[claimId]/review/route.ts` — authorized review transition boundary.
- `src/components/grid/organization-claim-form.tsx` — claim-existing-organization UI.
- `src/app/grid/organizations/claim/page.tsx` — server page binding authenticated identity and safe public organization target.

### Modified domain files

- `prisma/models/universal-identity.prisma` — add `Person.relationshipClaims` relation only; do not alter membership authority.
- `src/lib/identity/relationship-repository.ts` — expose deterministic person-resolution helper needed by claim repository without duplicating identity resolution.
- `src/app/grid/join/location/page.tsx` — organization mode copy/linkage distinguishes “create presence” from “claim existing organization.”
- `src/components/grid/capacity-intake-form.tsx` — organization mode is renamed/reframed as unverified presence creation; never says approval/ownership is established.
- `src/lib/grid/external-participant-enrollment.ts` — organization participant output is explicitly a Grid presence compatibility container; audit metadata and returned state must not imply verified tenant authority.
- `docs/superpowers/plans/2026-08-27-supreme-convergence-implementation-plan.md` — mark Slice 2 complete and update Slice 3 execution status after verification.
- `docs/quality/2026-08-27-supreme-convergence-verification-log.md` — append exact-head evidence after GREEN.

### Tests

- `tests/relationship-claim-schema.test.ts`
- `src/lib/identity/relationship-claim-rules.test.ts`
- `src/lib/identity/relationship-claim-repository.test.ts`
- `tests/relationship-claim-api-contract.test.ts`
- `tests/organization-claim-authority-boundary.test.ts`
- `tests/public-grid-surfaces.test.ts`
- existing `tests/universal-identity-compatibility.test.ts`
- existing Grid enrollment tests

---

### Task 1: Add the additive RelationshipClaim schema and migration

**Files:**
- Create: `prisma/models/relationship-claims.prisma`
- Modify: `prisma/models/universal-identity.prisma`
- Create: `prisma/migrations/20260827203000_relationship_claims/migration.sql`
- Create: `tests/relationship-claim-schema.test.ts`

**Interfaces:**
- Produces Prisma model `RelationshipClaim` with relation `person` and scalar target/provenance fields.
- `Person.relationshipClaims` becomes the only new relation on the universal identity model.
- No relation is added to legacy `User` or `Organization` authority models; target IDs stay scalar and are validated/re-resolved in repositories.

- [ ] **Step 1: Write the failing schema test**

Create `tests/relationship-claim-schema.test.ts` that reads the Prisma model files and migration and asserts all of the following exact semantics:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const claims = readFileSync("prisma/models/relationship-claims.prisma", "utf8");
const identity = readFileSync("prisma/models/universal-identity.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20260827203000_relationship_claims/migration.sql", "utf8");

describe("relationship claim schema", () => {
  it("keeps claim lifecycle and verification separate", () => {
    expect(claims).toContain("model RelationshipClaim");
    expect(claims).toContain("lifecycleStatus");
    expect(claims).toContain("verificationStatus");
    expect(claims).toContain("targetOrganizationId");
    expect(claims).toContain("claimedOrganizationName");
    expect(claims).toContain("reviewedBy");
    expect(claims).toContain("sourceReference");
  });

  it("relates claims to Person without making memberships authority", () => {
    expect(identity).toContain("relationshipClaims RelationshipClaim[]");
    expect(migration).toContain('CREATE TABLE "relationship_claims"');
    expect(migration).toContain('REFERENCES "people"("id")');
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npx vitest run tests/relationship-claim-schema.test.ts`

Expected: FAIL because the claim model/migration do not exist.

- [ ] **Step 3: Create the Prisma model**

Create `prisma/models/relationship-claims.prisma` with this semantic shape:

```prisma
model RelationshipClaim {
  id                      String   @id @default(cuid())
  personId                String
  legacyUserId            String?
  claimType               String
  targetType              String
  targetOrganizationId    String?
  targetProviderId        String?
  claimedOrganizationName String?
  claimedRoleKey          String?
  lifecycleStatus         String   @default("active")
  verificationStatus      String   @default("submitted")
  sourceType              String   @default("user_assertion")
  sourceReference         String?
  submittedAt             DateTime @default(now())
  reviewedAt              DateTime?
  reviewedBy              String?
  reviewNote              String?
  rejectionReason         String?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  person                   Person   @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@index([personId, lifecycleStatus, verificationStatus])
  @@index([targetOrganizationId, lifecycleStatus, verificationStatus])
  @@index([targetProviderId, lifecycleStatus, verificationStatus])
  @@index([legacyUserId])
  @@index([claimType, targetType])
  @@map("relationship_claims")
}
```

Add `relationshipClaims RelationshipClaim[]` to `Person` in `prisma/models/universal-identity.prisma`.

- [ ] **Step 4: Create the additive SQL migration**

Create `prisma/migrations/20260827203000_relationship_claims/migration.sql` with:

```sql
CREATE TABLE "relationship_claims" (
  "id" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "legacyUserId" TEXT,
  "claimType" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetOrganizationId" TEXT,
  "targetProviderId" TEXT,
  "claimedOrganizationName" TEXT,
  "claimedRoleKey" TEXT,
  "lifecycleStatus" TEXT NOT NULL DEFAULT 'active',
  "verificationStatus" TEXT NOT NULL DEFAULT 'submitted',
  "sourceType" TEXT NOT NULL DEFAULT 'user_assertion',
  "sourceReference" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "reviewNote" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relationship_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relationship_claims_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relationship_claims_personId_lifecycleStatus_verificationStatus_idx" ON "relationship_claims"("personId", "lifecycleStatus", "verificationStatus");
CREATE INDEX "relationship_claims_targetOrganizationId_lifecycleStatus_verificationStatus_idx" ON "relationship_claims"("targetOrganizationId", "lifecycleStatus", "verificationStatus");
CREATE INDEX "relationship_claims_targetProviderId_lifecycleStatus_verificationStatus_idx" ON "relationship_claims"("targetProviderId", "lifecycleStatus", "verificationStatus");
CREATE INDEX "relationship_claims_legacyUserId_idx" ON "relationship_claims"("legacyUserId");
CREATE INDEX "relationship_claims_claimType_targetType_idx" ON "relationship_claims"("claimType", "targetType");
```

Do not add database foreign keys from claim target IDs to `organizations`, `providers`, or `users` in this slice; target existence and authority are re-resolved server-side so historical claims survive target lifecycle changes and no new authority relation is implied.

- [ ] **Step 5: Run focused schema validation**

Run:
- `npx vitest run tests/relationship-claim-schema.test.ts`
- `npx prisma validate`
- `npx prisma generate`

Expected: all PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add relationship claim schema`

---

### Task 2: Add deterministic claim rules and transition policy

**Files:**
- Create: `src/lib/identity/relationship-claim-rules.ts`
- Create: `src/lib/identity/relationship-claim-rules.test.ts`

**Interfaces:**
- Produces `relationshipClaimSubmissionSchema`.
- Produces `relationshipClaimReviewSchema`.
- Produces allowlists `relationshipClaimTypes`, `relationshipClaimTargetTypes`, `relationshipClaimVerificationStatuses`.
- Produces `assertRelationshipClaimReviewTransition(current, action)`.

- [ ] **Step 1: Write failing rule tests**

Test these cases:

```ts
expect(relationshipClaimSubmissionSchema.parse({
  claimType: "organization_owner",
  targetType: "existing_organization",
  targetOrganizationId: "org_123",
  claimedRoleKey: "clinic_owner",
})).toMatchObject({ claimType: "organization_owner" });

expect(() => relationshipClaimSubmissionSchema.parse({
  claimType: "organization_owner",
  targetType: "existing_organization",
  claimedOrganizationName: "Not enough",
})).toThrow();

expect(() => assertRelationshipClaimReviewTransition("verified", "verify")).toThrow();
expect(assertRelationshipClaimReviewTransition("submitted", "start_review")).toBe("in_review");
expect(assertRelationshipClaimReviewTransition("in_review", "verify")).toBe("verified");
expect(assertRelationshipClaimReviewTransition("in_review", "reject")).toBe("rejected");
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/lib/identity/relationship-claim-rules.test.ts`

Expected: FAIL because the rule module does not exist.

- [ ] **Step 3: Implement exact allowlists and schemas**

Use only:

```ts
export const relationshipClaimTypes = [
  "organization_owner",
  "organization_admin",
  "organization_staff",
  "professional_identity",
  "organization_partner",
] as const;

export const relationshipClaimTargetTypes = [
  "existing_organization",
  "new_organization_presence",
  "professional_profile",
] as const;

export const relationshipClaimVerificationStatuses = [
  "submitted",
  "evidence_required",
  "in_review",
  "verified",
  "rejected",
] as const;
```

Submission validation rules:
- `existing_organization` requires `targetOrganizationId`, forbids `claimedOrganizationName` as authority input.
- `new_organization_presence` requires `claimedOrganizationName`, forbids `targetProviderId`.
- `professional_profile` requires `targetProviderId` and `claimType: professional_identity`.
- `sourceReference` is server-owned and absent from client schema.
- Client cannot submit `personId`, `legacyUserId`, lifecycle, verification status, reviewer, evidence acceptance, entitlement, or authority.

Review actions:

```ts
export const relationshipClaimReviewActions = [
  "request_evidence",
  "start_review",
  "verify",
  "reject",
] as const;
```

Allowed state transitions:
- submitted → evidence_required | in_review
- evidence_required → in_review
- in_review → verified | rejected | evidence_required
- verified/rejected → no further review transition in this slice

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run src/lib/identity/relationship-claim-rules.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: define relationship claim policy`

---

### Task 3: Implement session-proven claim repository and relationship projection

**Files:**
- Modify: `src/lib/identity/relationship-repository.ts`
- Create: `src/lib/identity/relationship-claim-repository.ts`
- Create: `src/lib/identity/relationship-claim-repository.test.ts`

**Interfaces:**
- `resolveUniversalPersonForLegacyUser(userId, client?) -> { personId, legacyUser }` extracted/reused from the existing deterministic compatibility logic without changing session authority.
- `submitRelationshipClaim(session, rawInput, client?) -> RelationshipClaimView`.
- `reviewRelationshipClaim(session, claimId, rawInput, client?) -> RelationshipClaimView`.
- `listRelationshipClaimsForPerson(session) -> RelationshipClaimView[]`.

- [ ] **Step 1: Write RED repository tests using mocked Prisma clients**

Cover all of these:

1. existing user submits existing-organization claim only when session user exists;
2. client-supplied email is irrelevant to attachment;
3. target organization is re-resolved server-side and must exist/not be suspended;
4. equivalent active claim returns deterministically instead of duplicating;
5. same person/target with incompatible active claim type returns a conflict requiring review;
6. submission creates a pending contextual `OrganizationMembership` with non-authoritative type/status;
7. submission creates a review task and audit event;
8. submission does not call `user.update`, `authCredential.update`, `authSession.update`, or `provider.update`;
9. ambiguous universal identity throws `IdentityRelationshipConflictError`;
10. verified review updates the claim, projects `OrganizationMembership` to the verified relationship vocabulary, and does not grant tenant authority;
11. reviewer must belong to the target organization and have `identity:manage` under current RBAC;
12. claimant cannot review their own claim when they are not independently authorized inside the target tenant.

- [ ] **Step 2: Run RED**

Run: `npx vitest run src/lib/identity/relationship-claim-repository.test.ts`

Expected: FAIL because repository functions do not exist.

- [ ] **Step 3: Extract one deterministic person resolver**

Refactor the person-resolution portion of `ensureOrganizationRelationshipForLegacyUser` into an exported helper in `relationship-repository.ts` so claim code and Grid enrollment share the exact same ambiguity/fail-closed logic. Preserve existing function behavior and tests.

Do not change how current-session tenant authority is determined.

- [ ] **Step 4: Implement claim submission**

`submitRelationshipClaim` must:

1. require a non-demo `ClinicSession` already validated by the API/session layer;
2. load the exact session user by `session.userId` and ensure current legacy session identity is consistent;
3. resolve one `Person` through the shared helper;
4. parse the bounded client claim input;
5. re-resolve target organization/provider server-side;
6. detect equivalent or conflicting active claims;
7. create the claim with `lifecycleStatus=active` and `verificationStatus=submitted`;
8. create a contextual membership such as:
   - existing organization owner/admin/staff claim → `organization_claimant` / `pending_verification`;
   - professional claim → preserve existing Grid/provider applicant relationship; do not create verified credential state;
9. create a human-review task with no secret/evidence content;
10. create audit event `identity.relationship_claim_submitted` with claim ID, claim type, target type/ID, and source provenance only;
11. return a safe view.

- [ ] **Step 5: Implement review transition**

`reviewRelationshipClaim` must:

1. load claim and target server-side;
2. require `can(session.role, "identity", "manage")`;
3. require `session.organizationId === claim.targetOrganizationId` for organization claims in this slice;
4. reject self-verification unless the current session independently holds review authority in the target tenant and policy explicitly allows it; for this first slice, reject when `claim.legacyUserId === session.userId`;
5. apply transition rule;
6. on verify, update pending relationship projection to the verified vocabulary without changing `User` or session state;
7. on reject/evidence-required, keep protected authority absent;
8. close/update review tasks where appropriate;
9. audit `identity.relationship_claim_<action>`.

- [ ] **Step 6: Run repository GREEN and compatibility tests**

Run:
- `npx vitest run src/lib/identity/relationship-claim-repository.test.ts`
- `npx vitest run src/lib/identity/relationship-repository.test.ts tests/universal-identity-compatibility.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

Commit message: `feat: add governed relationship claims`

---

### Task 4: Add authenticated claim APIs with no authority shortcut

**Files:**
- Create: `src/app/api/identity/claims/route.ts`
- Create: `src/app/api/identity/claims/[claimId]/review/route.ts`
- Create: `tests/relationship-claim-api-contract.test.ts`
- Create: `tests/organization-claim-authority-boundary.test.ts`

**Interfaces:**
- `POST /api/identity/claims` submits a claim for the exact authenticated legacy user.
- `GET /api/identity/claims` lists the current person’s claims only.
- `POST /api/identity/claims/:claimId/review` performs bounded reviewer transition.

- [ ] **Step 1: Write RED API/security contract tests**

Assert source/contracts include:
- `getAuthenticationSession()` in both routes;
- fail-closed 401 when no validated session;
- no client `userId`, `personId`, reviewer, verification status, target-tenant role, or authority accepted;
- review route calls repository review only after session is resolved;
- API responses never include password hashes, session IDs, provider credential numbers, evidence body, or protected organization payload;
- existence of claim does not alter login/session return logic or protected route RBAC.

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/relationship-claim-api-contract.test.ts tests/organization-claim-authority-boundary.test.ts`

Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement routes following existing API error conventions**

Use `getAuthenticationSession()`, `NextResponse`, and `networkAccessErrorResponse` patterns already used by the repository. Reject demo-only/synthetic sessions for production relationship claims unless an existing explicit demo contract says otherwise.

- [ ] **Step 4: Run GREEN**

Run: `npx vitest run tests/relationship-claim-api-contract.test.ts tests/organization-claim-authority-boundary.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: expose governed claim APIs`

---

### Task 5: Build the claim-existing-organization journey

**Files:**
- Create: `src/app/grid/organizations/claim/page.tsx`
- Create: `src/components/grid/organization-claim-form.tsx`
- Modify: `src/app/grid/join/location/page.tsx`
- Modify: `tests/public-grid-surfaces.test.ts`
- Create: `tests/organization-claim-surface.test.ts`

**Interfaces:**
- `/grid/organizations/claim?organizationId=<public-safe-id>` requires login through the existing same-origin `returnTo` pattern when no session exists.
- Server page re-resolves only public-safe organization identity fields.
- Form submits `claimType`, `targetType=existing_organization`, target ID, and optional bounded role label to `/api/identity/claims`.

- [ ] **Step 1: Write RED surface tests**

Test source/behavior contracts:
- no “you now own/manage this organization” copy after submission;
- states use `Claim submitted`, `Evidence needed`, `Under review`, `Verified relationship`, and `Access granted` only when their real backend states exist;
- anonymous users route through same-origin login return state;
- target organization object is re-resolved server-side by ID;
- 44px minimum touch targets / visible focus / Marble-Obsidian canon classes are retained;
- organization capacity page offers two distinct paths: `Create an organization presence` and `Claim an existing organization`.

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/organization-claim-surface.test.ts tests/public-grid-surfaces.test.ts`

Expected: FAIL because claim surface/path copy is absent.

- [ ] **Step 3: Implement server page and client form**

The page must show only public-safe organization name/location/type/status context. The form must never accept or display target tenant users, patient data, billing state, credentials, or authority controls.

After successful submission, show:

> Claim submitted. This records your relationship assertion for review. It does not grant access to this organization’s protected Klinikos workspace.

- [ ] **Step 4: Update organization capacity entry copy**

In `src/app/grid/join/location/page.tsx`, organization mode must describe **presence creation**. Add a clear secondary link to `/grid/organizations/claim` for users who are claiming an existing organization.

- [ ] **Step 5: Run GREEN**

Run: `npx vitest run tests/organization-claim-surface.test.ts tests/public-grid-surfaces.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add organization claim journey`

---

### Task 6: Reframe new organization Grid enrollment as unverified presence, not tenant authority

**Files:**
- Modify: `src/components/grid/capacity-intake-form.tsx`
- Modify: `src/lib/grid/external-participant-enrollment.ts`
- Modify or add focused tests under existing external Grid enrollment suite.
- Modify: `tests/public-grid-surfaces.test.ts`

**Interfaces:**
- `participantKind=organization` remains a compatibility path for creating a Grid/network presence and resource review state.
- Returned/audited state explicitly names it an unverified organization presence.
- No API or UI text claims ownership verification, Clinic OS activation, or operational tenant authority.

- [ ] **Step 1: Write RED regression tests**

Assert:
- organization mode success copy says `organization presence`, not “organization approved”;
- audit metadata records `authorityProvisioned: false` and `organizationVerificationStatus: "unverified"` for organization participant compatibility enrollment;
- resource remains pending human review;
- no Clinic OS owner/admin role is created;
- existing regulated resource guards remain unchanged.

- [ ] **Step 2: Run RED**

Run the focused Grid enrollment tests and `tests/public-grid-surfaces.test.ts`.

Expected: FAIL on the new presence-truth assertions.

- [ ] **Step 3: Implement minimal truth correction**

Do not perform a broad tenant migration in this task. Preserve the existing compatibility `Organization` row only because Grid resources are organization-scoped, but mark the organization mode/audit/result as an **unverified Grid presence container**. Do not add `clinic_owner` or `administrator` authority.

For new organization-presence accounts that still require a legacy session anchor, keep the compatibility `contractor` user and demo/review boundary. The UI and audit must make clear this is not proof of organizational authority.

- [ ] **Step 4: Run GREEN plus existing Grid safety tests**

Run:
- focused external participant enrollment tests;
- `npx vitest run tests/public-grid-surfaces.test.ts tests/grid-eligibility.test.ts tests/grid-marketplace-rules.test.ts`.

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: separate Grid presence from authority`

---

### Task 7: Project professional claims into existing credentialing without creating a second verifier

**Files:**
- Modify: `src/lib/identity/relationship-claim-repository.ts`
- Add focused tests to `src/lib/identity/relationship-claim-repository.test.ts`
- Reuse: `src/lib/repositories/credentialing-repository.ts`
- Reuse: `src/lib/grid/eligibility.ts`

**Interfaces:**
- `professional_identity` claims may target an existing provider/application profile.
- Claim review must not set credential verification fields or Grid eligibility itself.

- [ ] **Step 1: Add RED tests**

Prove:
- submitting `professional_identity` leaves `Provider.verificationStatus` unchanged;
- verifying the relationship claim still leaves individual credential `verificationStatus` untouched;
- Grid eligibility continues to refuse regulated work when credential/malpractice/facility/jurisdiction gates fail;
- professional claim target must resolve to the claimant’s legitimate provider/application context, not an arbitrary provider ID.

- [ ] **Step 2: Run RED**

Run the claim repository tests plus `tests/grid-eligibility.test.ts`.

Expected: at least the new ownership/target tests FAIL before implementation.

- [ ] **Step 3: Add server-side provider target ownership/context validation**

For a legacy provider already linked to the user, allow that exact provider. For the pending Grid applicant path where `Provider.userId` is intentionally null, resolve claimant relationship provenance through the existing universal `grid_contractor_applicant` membership/source reference. Reject arbitrary provider IDs.

Do not change credentialing or Grid eligibility decision code unless an actual failing compatibility test proves a bug.

- [ ] **Step 4: Run GREEN**

Run:
- `npx vitest run src/lib/identity/relationship-claim-repository.test.ts`
- `npx vitest run tests/grid-eligibility.test.ts tests/grid-rules.test.ts`.

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: bind professional claims to credentialing context`

---

### Task 8: Full exact-head release verification and truth update

**Files:**
- Modify: `docs/superpowers/plans/2026-08-27-supreme-convergence-implementation-plan.md`
- Modify: `docs/quality/2026-08-27-supreme-convergence-verification-log.md`
- Modify: PR #361 description through GitHub API.

**Interfaces:**
- Produces fresh exact-head evidence only.
- Does not merge PR #361.

- [ ] **Step 1: Run focused claim suites**

Run all new Slice 3 test files and affected identity/Grid suites.

Expected: 0 failures.

- [ ] **Step 2: Run repository release gates**

Require GitHub Actions exact-head `verify` and `deploy-contract` jobs GREEN. Required checks include fresh PostgreSQL migrations, Prisma validation/client generation, TypeScript, lint, full tests, MVP journeys, confidentiality/security gates, production build, and startup smoke.

- [ ] **Step 3: Inspect any failure at the exact job step**

Do not weaken or skip gates. Repair only the root cause and rerun on the new head.

- [ ] **Step 4: Review changed claim/public files for authority leakage**

Confirm no code path:
- updates current tenant or role on claim submission;
- trusts email-only account attachment;
- marks claim as verified on submission;
- exposes protected organization data;
- treats professional claim as licensure;
- treats unverified Grid presence as Clinic OS authority.

- [ ] **Step 5: Update truth documents**

Mark Slice 2 complete and Slice 3 implemented only to the exact level proven by tests/runtime. Record exact head SHA, workflow run ID, and any remaining visual/manual acceptance limitations.

- [ ] **Step 6: Update PR #361 evidence**

Add:
- claim lifecycle semantics;
- exact no-authority-mutation guarantees;
- organization-presence truth correction;
- professional credentialing separation;
- exact-head CI evidence;
- remaining broader PR review requirements.

Keep the PR **draft**.

---

## Plan Self-Review

### Spec coverage

- Claim vs verification separation: Tasks 1–4.
- Existing-account proof of control: Tasks 3–4.
- No authority/session mutation: Tasks 3–4 and 8.
- Existing organization claim: Tasks 3–5.
- New organization presence: Tasks 5–6.
- Professional claim reuse of credentialing/eligibility: Task 7.
- Evidence/review/audit separation: Tasks 3–4.
- Duplicate/conflict/fail-closed semantics: Task 3.
- UX vocabulary and value-before-verification: Tasks 5–6.
- Security/privacy boundaries: Global constraints + Tasks 3–8.
- Exact-head verification and draft PR discipline: Task 8.

### Placeholder scan

No `TBD`, generic “handle errors”, or undefined follow-up implementation steps are permitted. Every task names its files, interface, red test, implementation boundary, green test, and commit point.

### Type consistency

The plan uses one claim model (`RelationshipClaim`), one lifecycle field (`lifecycleStatus`), one verification field (`verificationStatus`), one submission schema, one review schema, and one deterministic universal-person resolver shared with existing Grid identity compatibility.
