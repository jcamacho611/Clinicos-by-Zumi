# Klinikos Final-Form Convergence Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish one enforceable architecture hierarchy and the first additive lifelong identity/organization-relationship substrate without breaking existing authentication, tenant isolation, Clinic OS, Grid, EDU, Patient Portal, or provider workflows.

**Architecture:** Preserve `User`, `PortalAccount`, `Provider`, `Patient`, existing Grid models and existing auth as compatibility surfaces. Use Prisma's multi-file schema support to leave the large legacy schema untouched while adding `Person`, `OrganizationMembership`, and `LocationAssignment` in a focused model file. Backfill existing staff relationships deterministically. Existing `User.organizationId` remains the current/default organization authority until a later separately tested auth-context migration.

**Tech Stack:** Next.js, TypeScript, Prisma 6.14, PostgreSQL, Vitest, existing repository/audit/auth patterns.

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
- Do not add hidden foreign-key relationships to legacy tables unless the Prisma schema models the same relationship.
- Current implementation/runtime truth remains above prose.

---

### Task 1: Wire Supreme Canon into repository authority

**Files:**
- Modify: `docs/SOURCE_OF_TRUTH.md`
- Modify: `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
- Modify: `AGENTS.md`
- Create: `tests/supreme-architecture-canon.test.ts`

- [x] Supreme Canon committed.
- [x] Canon regression test committed.
- [x] `SOURCE_OF_TRUTH.md` converged to the new hierarchy.
- [x] `KLINIKOS_ARCHITECTURE_INDEX.md` converged to the new hierarchy.
- [x] `AGENTS.md` requires the Supreme Canon for material cross-domain work.
- [x] No capability/external-live status was upgraded by architecture prose.

---

### Task 2: Add lifelong Person and effective-dated relationship schema

**Files:**
- Modify: `prisma.config.ts`
- Preserve: `prisma/schema.prisma`
- Create: `prisma/models/universal-identity.prisma`
- Create: `prisma/migrations/20260823023000_universal_identity_foundation/migration.sql`
- Create: `tests/universal-identity-schema.test.ts`
- Create: `tests/universal-identity-compatibility.test.ts`

**Interfaces:**
- Produces `Person`, `OrganizationMembership`, and `LocationAssignment`.
- Legacy `organizationId`, `locationId`, and `legacyUserId` references remain scalar compatibility references in this tranche.
- Current `User.organizationId` / `User.roleKey` remain unchanged.
- Patient `PortalAccount` remains separate.

- [x] Write the identity schema contract test first.
- [x] Point Prisma config at the `prisma` schema folder.
- [x] Add focused multi-file identity models without editing the legacy schema.
- [x] Add an additive SQL migration with deterministic Person/membership backfill from existing users.
- [x] Keep foreign keys only between new modeled tables; do not create Prisma-invisible FKs to legacy tables.
- [x] Add compatibility invariants proving current auth/patient boundaries remain.
- [x] Apply the exact migration SQL to an isolated branch cloned from the current connected production-shaped Neon database and validate row/constraint/index safety.
- [ ] Execute exact-head Prisma generate/validate on an executable Node runner.

#### Isolated database verification — 2026-08-22 America/New_York

Current connected project resolved to `ClinicOS Production` (`autumn-resonance-23654315`), PostgreSQL 17, default branch `main` (`br-ancient-term-atolp7vw`). Verification used temporary branch `verify-final-form-identity-20260822b` (`br-delicate-hall-atxldeze`) and deleted it after validation. Production was not modified.

Results after applying the exact PR migration SQL:
- legacy users: 5
- people: 5
- organization memberships: 5
- location assignments: 0
- orphan memberships: 0
- inferred legal names: 0
- unexpected membership types: 0
- memberships without legacy user provenance: 0
- only two foreign keys exist on the new identity tables: membership → person and location assignment → membership
- expected primary, lookup, status, effective-date, and assignment uniqueness indexes exist

This validates the additive SQL against the current production-shaped database. It does **not** substitute for Prisma generate/validate, the complete fresh migration chain, type-check, tests, build, or deployment verification.

---

### Task 3: Add server-only relationship repository

**Files:**
- Create: `src/lib/identity/relationship-repository.ts`
- Create: `src/lib/identity/relationship-repository.test.ts`

**Interfaces:**
- `getPersonContextForLegacyUser(userId: string, at?: Date): Promise<PersonContext | null>`
- `listActiveOrganizationMemberships(personId: string, at?: Date): Promise<OrganizationMembershipView[]>`
- `listActiveLocationAssignments(membershipId: string, at?: Date): Promise<LocationAssignmentView[]>`
- `buildEffectiveRelationshipWhere(at: Date)`
- No function changes authorization or session tenant.

- [x] Add failing effective-date semantics test first.
- [x] Implement server-only minimum-necessary relationship reads.
- [x] Exclude expired/future relationships by default query semantics.
- [x] Do not wire any auth/session consumer to the new substrate in this tranche.
- [ ] Execute focused tests/type-check after Prisma client generation.

---

### Task 4: Reconcile status documentation without overstating implementation

**Files:**
- Modify: `docs/FEATURE_STATUS.md`
- Modify roadmap only if an existing identity-convergence section can be updated without disturbing concurrent planning.

- [ ] Add the lifelong identity substrate as `PARTIALLY BUILT` only after executable schema/migration verification.
- [ ] Explicitly state that multi-organization session switching/authorization adoption is not built by this tranche.
- [ ] Preserve patient/staff session-separation truth.

---

### Task 5: Verification and exact-head review

- [x] Refresh current `main` and inspect overlapping work.
- [ ] Prisma generate.
- [ ] Prisma validate.
- [ ] Apply all migrations to a fresh PostgreSQL database.
- [ ] Type-check.
- [ ] Lint.
- [ ] Focused identity/canon tests.
- [ ] Full test suite.
- [ ] DB-backed MVP journeys.
- [ ] Security/negative-authorization tests.
- [ ] Production build/start/health smoke.
- [ ] Review complete diff for accidental authority widening, PHI exposure, duplicate identity systems or customer-fork behavior.
- [x] Record GitHub Actions pre-checkout failure accurately when jobs return `steps:null`; do not call the exact head green.

## Follow-on programs after this foundation

1. Active organization/context selection over memberships with explicit server authorization.
2. Profession/credential/privilege/supervision authority convergence.
3. Encounter-specific Staff Handoff and structured clinical components.
4. Clinical Change Graph and versioned body-map evidence.
5. Universal obligation/completion projections.
6. Grid/Commerce policy-class convergence and seller/catalog projections.
7. Server-owned Pricing Fabric and unit-economics reporting.
8. Integration outbox/inbox/dead-letter/reconciliation foundation.
9. Shared Trust & Safety evidence/holds/appeals infrastructure.
10. Governed Zumi durable memory/action registry over authoritative data.
11. Enterprise hierarchy/SSO/SCIM and multi-entity governance.
12. SEO/distribution/liquidity loops using intentionally public projections only.
