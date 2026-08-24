# BodyMap Persistence V1 Implementation Record

**Status:** Source implementation and disposable-Neon migration proof complete on feature branch. Full repository execution remains blocked by GitHub Actions runner non-allocation.

**Goal:** Persist immutable, tenant-scoped BodyMap clinical evidence with exact provenance and audit history so deterministic Clinical Change can consume real encounter data.

**Architecture:** Dedicated multi-file Prisma BodyMap aggregate + additive migration + pure validation + server-only append-only repository. Comparison roles (`initial / previous / today`) are derived at read time and never persisted. No Current Visit UI or browser write path is part of this tranche.

**Authority:** `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`, `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`, `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`, current Source of Truth.

## Final design decisions

### Immutable aggregate

- `BodyMapVersion` is append-only.
- `BodyMapFinding` belongs to one immutable version.
- Historical rows have no update/delete repository API.
- Finalized encounters require explicit amendment lineage before a new BodyMap version can be recorded.
- `amendsVersionId` is self-referential and restrictive.
- Child findings cascade only when their owning version is deleted at the database level; normal application code exposes no historical deletion path.

### Comparison roles are not persistence fields

`initial`, `previous`, and `today` are contextual roles. A version that is `today` for one encounter becomes `previous` later. No `stage` column or enum is persisted.

### Legacy provenance references are transactionally verified

The initial plan considered adding direct patient/encounter/user foreign keys from the new multi-file Prisma model. That approach was **superseded after inspecting the current Prisma boundary**:

- legacy Organization/User/Patient/Encounter models remain in the monolithic `prisma/schema.prisma`;
- adding reverse relations there would expand this bounded clinical tranche and create additional merge coupling;
- creating raw SQL foreign keys not represented in Prisma would create future schema/migration drift.

Final v1 therefore stores explicit scalar provenance identifiers:

- `organizationId`
- `patientId`
- `encounterId`
- `createdByUserId`

The authoritative server transaction verifies:

1. active patient belongs to organization;
2. encounter belongs to organization;
3. encounter patient equals requested patient;
4. active actor belongs to organization;
5. amendment source, if supplied, belongs to the same organization/patient/encounter.

BodyMap-internal relations remain modeled in Prisma and enforced by PostgreSQL.

### Severity contract

BodyMap severity is nullable integer `0..10`, higher = worse. It is guarded both by deterministic TypeScript validation and PostgreSQL `CHECK` constraint. ROM, strength and other measures require separate typed evidence sources.

### Resolution contract

A finding may explicitly record `active` or `resolved`. **Omission never means resolution.** Resolution only exists when a governed workflow records it as evidence in a new immutable version.

### JSON boundary

`sourceObservation` must be a recursively JSON-safe plain object or null. Non-finite numbers, functions, bigint, dates/class instances, cyclic references and malformed finding entries fail closed before Prisma receives them.

## Implemented files

- `prisma/models/clinical-body-map.prisma`
- `prisma/migrations/20260823200000_body_map_persistence_v1/migration.sql`
- `src/lib/clinical/body-map-persistence.ts`
- `src/lib/repositories/body-map-repository.ts`
- `tests/body-map-persistence-schema.test.ts`
- `tests/body-map-persistence.test.ts`
- `tests/body-map-repository-contract.test.ts`
- updated `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`

## Execution record

### Task 1: Schema contract

- [x] Add test-first persistence-schema contract.
- [x] Require immutable source fields and absence of persisted comparison stage.
- [x] Require laterality, explicit finding state, severity guard and aggregate indexes.
- [x] Make contract structural rather than whitespace/comment-sensitive.

### Task 2: Prisma aggregate + migration

- [x] Add `BodyMapLaterality` enum.
- [x] Add `BodyMapFindingState` enum.
- [x] Add immutable `BodyMapVersion` model.
- [x] Add immutable `BodyMapFinding` model.
- [x] Add deterministic per-version `findingKey` uniqueness.
- [x] Add amendment `RESTRICT` relation.
- [x] Add finding-owner `CASCADE` relation.
- [x] Add SQL severity `0..10 OR NULL` check.
- [x] Add patient timeline / encounter / amendment / finding indexes.
- [ ] Run exact-head `prisma generate` + `prisma validate` in full repository execution lane.

### Task 3: Deterministic input boundary

- [x] Normalize structured finding identity.
- [x] Reject invalid/non-integer severity.
- [x] Reject duplicate normalized finding identity.
- [x] Reject persisted `stage` authority.
- [x] Accept explicit `resolved` state only when actually supplied.
- [x] Fail closed on malformed text/annotation payloads.
- [x] Fail closed on non-object finding entries.
- [x] Recursively validate `sourceObservation` as JSON-safe evidence.
- [ ] Execute exact-head Vitest suite when runner lane is available.

### Task 4: Append-only server repository

- [x] Mark repository server-only.
- [x] Validate deterministic input before database work.
- [x] Verify patient/encounter/actor/amendment provenance inside one transaction.
- [x] Require amendment lineage for finalized encounter states.
- [x] Create version + findings + AuditLog atomically.
- [x] Keep audit metadata bounded and avoid duplicating finding clinical content into audit metadata.
- [x] Provide organization/patient scoped timeline read.
- [x] Provide organization/patient/encounter scoped latest read.
- [x] Use deterministic `capturedAt DESC, createdAt DESC` ordering.
- [x] Return deliberate mapped DTOs rather than raw ORM records.
- [x] Expose no historical BodyMap update/delete repository path.
- [ ] Run exact-head type-check + repository tests in full repository execution lane.

### Task 5: Disposable Neon production-shaped proof

- [x] Clone temporary branch from `ClinicOS Production` production-shaped parent.
- [x] Apply exact BodyMap migration successfully.
- [x] Verify both tables, enums, indexes and foreign-key delete behavior through PostgreSQL catalog queries.
- [x] Verify legacy patient/encounter/user counts unchanged before/after synthetic proof.
- [x] Insert synthetic 8 → 6 → 6 left-shoulder timeline plus new dizziness.
- [x] Insert explicit resolved amendment version.
- [x] Confirm severity `11` is rejected by PostgreSQL check constraint.
- [x] Delete temporary Neon branch without applying changes to production.

Temporary proof branch:
- name: `body-map-persistence-v1-proof-20260823`
- id: `br-holy-night-aticpk05`
- deleted after proof

Observed legacy counts stayed:
- patients: 6
- encounters: 4
- users: 5

The whole-branch Neon schema comparison endpoint returned HTTP 413 because the production-shaped schema is too large for that endpoint; direct catalog validation supplied the structural evidence instead.

### Task 6: Release / merge gate

- [x] Update BodyMap foundation documentation to current feature-branch truth.
- [x] Review browser/server boundary: no BodyMap persistence is exposed directly to browser code in this tranche.
- [x] Keep production PHI approval as a separate unresolved blocker.
- [x] Confirm latest-main concurrent changes do not overlap BodyMap persistence files.
- [ ] Open draft PR against latest main and confirm mergeability.
- [ ] Run full Render-aligned release gate when an executable lane is available.
- [ ] Merge only with explicit authorization.

## Verification truth

GitHub Actions currently fails before checkout with `runner_id: 0` / `steps:null` because the private-repository runner is not being allocated. This is infrastructure non-execution, not a code pass/fail result.

The repository's canonical release command has separately been corrected to reproduce Render's install/build/start contract. That does not create executable evidence for this BodyMap exact head until a runner or equivalent trusted checkout becomes available.

## Production safety / non-claims

This tranche does **not** claim:

- BodyMap migration deployed to production;
- production PHI readiness;
- Current Visit BodyMap authoring/display complete;
- profession/capability authoring authorization complete;
- broader Clinical Change Graph complete;
- No-Fault Golden Case complete end-to-end;
- physician acceptance complete.

Last-known Neon HIPAA mode remains a separate production-PHI blocker and must be resolved before real PHI rollout.

## Next tranche after this lands

1. profession/capability-governed BodyMap authoring command/action;
2. persisted BodyMap → comparison projection using merged previous-finalized encounter selector;
3. Current Visit `INITIAL → PREVIOUS → TODAY` + evidence-backed What Changed presentation;
4. DB-backed synthetic No-Fault Golden Case;
5. broader typed Clinical Change evidence (PT progression, imaging/results, ADL/function, work status) without overloading BodyMap severity.
