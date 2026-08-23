# Klinikos Final-Form Convergence Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish one enforceable architecture hierarchy and the first additive lifelong identity/organization-relationship substrate without breaking existing authentication, tenant isolation, Clinic OS, Grid, EDU, Patient Portal, or provider workflows.

**Architecture:** Preserve `User`, `PortalAccount`, `Provider`, `Patient`, existing Grid models and existing auth as compatibility surfaces. Add a durable `Person` anchor plus effective-dated `OrganizationMembership` and `LocationAssignment` records, backfill existing staff users deterministically, and expose server-only relationship queries. Existing `User.organizationId` remains the legacy/default active organization until a later separately tested auth-context migration.

**Tech Stack:** Next.js, TypeScript, Prisma, PostgreSQL, Vitest, existing repository/audit/auth patterns.

**Spec:** `docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md`

## Global Constraints

- Preserve current working auth and tenant boundaries.
- No destructive production migration.
- No customer-specific fork.
- No automatic patient-to-public-profile linkage.
- UI visibility is never authorization.
- Existing `User.organizationId` remains authoritative for current sessions in this tranche.
- New relationship records do not widen access until authorization consumers explicitly adopt them.
- Use server-only repositories and minimum-necessary DTOs.
- Every relationship is effective-dated and provenance-bearing.
- Current implementation/runtime truth remains above prose.

---

### Task 1: Wire Supreme Canon into repository authority

**Files:**
- Modify: `docs/SOURCE_OF_TRUTH.md`
- Modify: `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
- Modify: `AGENTS.md`
- Create: `tests/supreme-architecture-canon.test.ts`

**Interfaces:**
- Consumes: `docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md`
- Produces: machine-enforced precedence and permanent architecture invariants for future agents.

- [ ] **Step 1: Add a canon regression test** that asserts the Supreme Canon exists and contains the one-substrate, one-identity, authority, Current Visit, Grid, Financial Truth, Zumi, frontend simplicity, external integration truth and no-customer-fork laws.
- [ ] **Step 2: Update `SOURCE_OF_TRUTH.md`** so the Supreme Canon is immediately below Source of Truth and above the cross-domain ledger/specialist canons.
- [ ] **Step 3: Update `KLINIKOS_ARCHITECTURE_INDEX.md`** with the same hierarchy and required read order.
- [ ] **Step 4: Update `AGENTS.md`** so material architecture, identity, Grid, clinical, pricing, integration, enterprise, trust and Zumi work must read the Supreme Canon.
- [ ] **Step 5: Verify diff** contains no capability-status or external-live claims.

---

### Task 2: Add lifelong Person and effective-dated organization relationship schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260823023000_universal_identity_foundation/migration.sql`
- Create: `tests/universal-identity-schema.test.ts`

**Interfaces:**
- Produces Prisma models:
  - `Person`
  - `OrganizationMembership`
  - `LocationAssignment`
- Extends existing:
  - `User.personId String? @unique`
  - `Organization.memberships OrganizationMembership[]`
  - `Location.assignments LocationAssignment[]`
- Existing `User.organizationId` remains unchanged.

`Person` fields:
- `id String @id @default(cuid())`
- `displayName String?`
- `legalName String?`
- `primaryEmail String?`
- `status String @default("active")`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- relation to optional single current `User` compatibility account and many memberships.

`OrganizationMembership` fields:
- `id String @id @default(cuid())`
- `personId String`
- `organizationId String`
- `legacyUserId String?`
- `membershipType String`
- `roleKey String?`
- `status String @default("active")`
- `sourceType String @default("legacy_user")`
- `sourceReference String?`
- `effectiveFrom DateTime @default(now())`
- `effectiveTo DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- indexes on `(personId,status)`, `(organizationId,status)`, `(legacyUserId)` and `(effectiveFrom,effectiveTo)`.

`LocationAssignment` fields:
- `id String @id @default(cuid())`
- `membershipId String`
- `locationId String`
- `roleKey String?`
- `professionKey String?`
- `status String @default("active")`
- `effectiveFrom DateTime @default(now())`
- `effectiveTo DateTime?`
- `sourceType String @default("organization")`
- `sourceReference String?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- unique `(membershipId,locationId,effectiveFrom)` and indexes on `(locationId,status)` and effective dates.

- [ ] **Step 1: Write `tests/universal-identity-schema.test.ts`** reading `prisma/schema.prisma` and asserting the additive models/relations exist while `User.organizationId String` remains present.
- [ ] **Step 2: Add schema models and relations only; do not alter current auth semantics.**
- [ ] **Step 3: Add SQL migration** creating the three tables and nullable `users.personId`, then backfill one Person and one OrganizationMembership for every existing `users` row using deterministic text IDs (`person_` + legacy user id and `orgmem_` + legacy user id).
- [ ] **Step 4: Add FK/indexes after backfill and make no destructive column changes.**
- [ ] **Step 5: Ensure rerunning application migrations is idempotent through Prisma migration history, not ad-hoc runtime DDL.**

---

### Task 3: Add server-only relationship repository

**Files:**
- Create: `src/lib/identity/relationship-repository.ts`
- Create: `src/lib/identity/relationship-repository.test.ts`

**Interfaces:**
- `getPersonContextForLegacyUser(userId: string): Promise<PersonContext | null>`
- `listActiveOrganizationMemberships(personId: string, at?: Date): Promise<OrganizationMembershipView[]>`
- `listActiveLocationAssignments(membershipId: string, at?: Date): Promise<LocationAssignmentView[]>`
- No function changes authorization or session tenant.

`PersonContext` exposes only person id, display name, current legacy user id/default organization id and active membership identifiers/statuses. It does not expose credential documents, patient records, private audit metadata or internal risk state.

- [ ] **Step 1: Write failing tests for effective-date filtering and tenant-safe DTO shape.**
- [ ] **Step 2: Implement server-only repository using Prisma.**
- [ ] **Step 3: Ensure expired/future memberships and assignments are excluded by default.**
- [ ] **Step 4: Verify no auth consumer uses these records to widen access in this tranche.**

---

### Task 4: Add identity compatibility invariant tests

**Files:**
- Create: `tests/universal-identity-compatibility.test.ts`

**Interfaces:**
- Protects existing auth semantics during migration.

- [ ] **Step 1: Assert current `User.organizationId`, `roleKey`, auth credential/session relations and patient `PortalAccount` separation remain present.**
- [ ] **Step 2: Assert the Supreme Canon states patient context is not automatically public/Grid-visible.**
- [ ] **Step 3: Assert new memberships cannot be interpreted as authority without explicit authorization adoption.**

---

### Task 5: Reconcile status documentation without overstating implementation

**Files:**
- Modify: `docs/FEATURE_STATUS.md`
- Modify: `docs/RECOVERY_AND_COMPLETION_ROADMAP.md` only if current structure has an appropriate identity-convergence section.

**Interfaces:**
- Adds `PARTIALLY BUILT` identity-foundation truth only after schema/repository implementation lands.

- [ ] **Step 1: Update audited-baseline text only where the exact branch evidence supports it; do not rewrite unrelated historical verification claims.**
- [ ] **Step 2: Describe Person/membership/assignment foundation as additive and non-authoritative for session switching until later authorization work lands.**
- [ ] **Step 3: Preserve patient/staff session separation truth.**

---

### Task 6: Verification and exact-head review

**Files:** none unless fixes are required.

- [ ] **Step 1:** refresh `main` and inspect overlapping PRs/commits before finalization.
- [ ] **Step 2:** Prisma generate.
- [ ] **Step 3:** Prisma validate.
- [ ] **Step 4:** apply all migrations to a fresh PostgreSQL database.
- [ ] **Step 5:** type-check.
- [ ] **Step 6:** lint.
- [ ] **Step 7:** focused identity/canon tests.
- [ ] **Step 8:** full unit/integration test suite.
- [ ] **Step 9:** DB-backed MVP journeys.
- [ ] **Step 10:** production build and startup/health smoke.
- [ ] **Step 11:** negative authorization regression tests.
- [ ] **Step 12:** inspect full diff for accidental authority widening, PHI exposure, duplicate identity systems or customer-fork behavior.
- [ ] **Step 13:** if GitHub Actions fails before checkout, record infrastructure failure truthfully and do not label the exact head green.

## Follow-on programs after this foundation

Separate reviewable plans should implement, in dependency order:

1. active organization/context selection over memberships while preserving tenant isolation;
2. profession/credential/privilege/supervision authority convergence;
3. encounter-specific Staff Handoff and structured clinical components;
4. Clinical Change Graph and versioned body-map evidence;
5. universal obligation/completion projections;
6. Grid/Commerce policy-class convergence and seller/catalog projections;
7. server-owned Pricing Fabric and unit-economics reporting;
8. integration outbox/inbox/dead-letter/reconciliation foundation;
9. shared Trust & Safety evidence/holds/appeals infrastructure;
10. governed Zumi durable memory/action registry over authoritative data;
11. enterprise hierarchy/SSO/SCIM and multi-entity governance;
12. SEO/distribution/liquidity loops using intentionally public projections only.