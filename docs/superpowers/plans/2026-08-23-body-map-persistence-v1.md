# BodyMap Persistence V1 Implementation Record

**Status:** Backend source implementation complete on feature branch. Final exact migration proven on a disposable production-shaped Neon branch. GitHub Actions remains unavailable before checkout, so no full-CI pass claim is made.

**Goal:** Persist immutable, tenant-scoped BodyMap clinical evidence with exact provenance and audit history so deterministic Clinical Change can consume real encounter data.

**Architecture:** Dedicated Prisma multi-file BodyMap aggregate + additive migration + deterministic validation + server-only append-only repository. `initial / previous / today` are derived at read time and never persisted. No Current Visit UI/browser write path is included.

## Final design

- History is append-only. Finalized encounters require attributable amendment lineage.
- Legacy organization/patient/encounter/user provenance IDs are transactionally verified in the authoritative server write path rather than introducing unmodeled SQL foreign keys or widening the tranche with legacy reverse relations.
- BodyMap-internal amendment/finding relations are modeled in Prisma and enforced by PostgreSQL.
- Capture source is machine-governed only: `clinical_capture`, `staff_intake`, `provider_review`, `structured_import`.
- Empty versions are rejected because omission never means resolution.
- Finding identity uses Unicode NFKC normalization, collapsed whitespace, trim, case normalization, plus laterality.
- Severity is nullable integer 0..10. `resolved` findings may carry only severity 0 or null.
- Material future timestamps are rejected with a five-minute clock-skew allowance.
- `sourceObservation` accepts recursively JSON-safe plain objects only.
- Audit metadata is bounded and does not duplicate finding clinical content.
- Browser code receives no raw persistence records in this tranche.

## Implemented files

- `prisma/models/clinical-body-map.prisma`
- `prisma/migrations/20260823200000_body_map_persistence_v1/migration.sql`
- `src/lib/clinical/body-map-persistence.ts`
- `src/lib/repositories/body-map-repository.ts`
- `tests/body-map-persistence-schema.test.ts`
- `tests/body-map-persistence.test.ts`
- `tests/body-map-repository-contract.test.ts`
- `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`
- this execution record

## Verification record

### Test-first hardening

Tests were committed before each corresponding production fix for:

- schema/persistence existence and no persisted comparison stage;
- malformed runtime input;
- recursive JSON safety;
- deterministic latest ordering;
- empty BodyMap rejection;
- governed capture-source enforcement;
- Unicode/width/whitespace duplicate identity;
- explicit resolved/severity consistency;
- material future capture rejection;
- PostgreSQL resolved/severity invariant.

### Exact-source local executable checks

Because the environment could not clone GitHub and GitHub Actions was receiving no runner at the time
of this work (2026-08-23), exact GitHub file contents were reconstructed into an offline harness and
hash-checked against their Git blob IDs.

**Correction, 2026-09-05:** that justification no longer holds. Actions allocates runners and executes
jobs (verified 2026-09-05: 401 `main` runs and 2,464 total; the eight most recent `main` runs all succeeded, and PR runs 2394-2433 executed to real conclusions including genuine test failures). The harness and its results below are retained as the evidence actually produced at
the time; this work can now additionally be verified against real CI.

Verified executable behavior includes:

- TypeScript compilation of the exact BodyMap validation helper;
- safe machine source values accepted and free-text source rejected;
- empty BodyMap rejected;
- Unicode/width/whitespace identity normalized deterministically;
- duplicate identity rejected;
- resolved + nonzero severity rejected;
- >5 minute future capture rejected while the five-minute skew boundary is accepted;
- malformed and unsafe JSON evidence fails closed;
- repository source type-checks against realistic Prisma/database transaction stubs;
- repository remains server-only, append-only, explicitly selected and tenant scoped.

This does **not** substitute for full repository Prisma generation, lint, build, or test execution.

### Final disposable Neon proof

Final temporary branch:

- project: `ClinicOS Production`
- parent: `br-ancient-term-atolp7vw`
- temporary branch: `body-map-persistence-v1-final-proof-20260823`
- branch id: `br-icy-wave-athu3nht`
- deleted after verification

The final exact migration applied successfully to the production-shaped clone.

Verified:

- capture-source enum contains exactly the four governed values;
- severity check exists;
- resolved/severity consistency check exists;
- valid `provider_review` version inserted;
- valid active severity 6 finding inserted;
- valid resolved severity 0 finding inserted;
- free-text source rejected by PostgreSQL;
- severity 11 rejected by PostgreSQL;
- resolved severity 6 rejected by PostgreSQL;
- cloned legacy counts remained exactly 6 patients / 4 encounters / 5 users.

No migration or synthetic data was applied to production.

### GitHub Actions limitation

As of 2026-08-23, fresh PR workflow runs were failing before checkout with `steps:null` / no runner
allocation. A run that executes no steps is infrastructure non-execution, not repository pass/fail
evidence — that distinction still stands.

**Correction, 2026-09-05:** the non-execution condition is resolved (verified 2026-09-05: 401 `main` runs and 2,464 total; the eight most recent `main` runs all succeeded, and PR runs 2394-2433 executed to real conclusions including genuine test failures). The gates listed
below as unexecuted should be re-checked against current CI rather than assumed unrunnable.

Unexecuted full-repository gates remain:

- `prisma generate` / `prisma validate` on exact full repo head;
- complete TypeScript typecheck;
- full Vitest suite;
- ESLint;
- Render-aligned build/start gate;
- MVP gate.

### Render deployment safety

Current main includes the release change from PR #290 requiring **explicit production database migration outside the Render build path**. Landing this source therefore does not by itself authorize or automatically apply the BodyMap migration to production during a Render build. Production migration remains a separate controlled action.

## PR / merge record

- superseded stale-base PR #291 closed without merge;
- authoritative PR #295 opened from the latest-main re-anchor branch;
- user granted broad execution authority in this conversation;
- merge remains conditional on final exact-head diff/review/mergeability checks and explicit recording of the unavailable full-CI gate.

## Production safety / non-claims

This tranche does **not** claim:

- BodyMap migration deployed to production;
- production PHI readiness;
- Current Visit BodyMap authoring/display complete;
- profession/capability authoring authorization complete;
- broader Clinical Change Graph complete;
- No-Fault Golden Case complete end-to-end;
- physician acceptance complete;
- GitHub Actions, full build, lint, or full test suite green.

## Next tranche after merge

1. persisted BodyMap → comparison projection using merged prior-finalized encounter selector (#276);
2. explicit resolved-change projection based only on persisted `resolved` evidence;
3. profession/capability-governed authoring action;
4. Current Visit `INITIAL → PREVIOUS → TODAY` + evidence-backed What Changed;
5. DB-backed synthetic No-Fault Golden Case;
6. broader typed Clinical Change evidence for PT progression, imaging/results, ADL/function and work status.
