# BodyMap Persistence V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist immutable, tenant-scoped BodyMap clinical evidence with exact provenance and audit history so deterministic Clinical Change can later consume real encounter data.

**Architecture:** Add a dedicated multi-file Prisma clinical model and additive migration. Persist immutable BodyMap versions and their findings, but never persist contextual `initial / previous / today` comparison roles. Writes occur only through a server-only repository that validates organization + patient + encounter consistency, records a new version in one transaction, and emits an AuditLog event. Reads are organization + patient + encounter scoped and return deliberate clinical DTOs rather than raw ORM records. No Current Visit UI is added in this tranche.

**Tech Stack:** Next.js / TypeScript, Prisma 6 multi-file schema, PostgreSQL / Neon, Vitest, existing `db` Prisma client and `AuditLog` infrastructure.

**Spec:** `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`, constrained by `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md` and `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

## Global Constraints

- BodyMap history is append-only/versioned; prior versions are never updated in place.
- `initial`, `previous`, and `today` are derived comparison roles and MUST NOT be stored in BodyMap persistence.
- Every BodyMap version is scoped by `organizationId + patientId + encounterId` and preserves creator + capture timestamp provenance.
- BodyMap symptom severity is nullable or an integer 0 through 10 inclusive, higher = worse.
- Finding identity preserves body region, laterality, and symptom. Laterality is first-class.
- A finding may explicitly record `ACTIVE` or `RESOLVED`; omission alone never becomes resolution.
- A resolved finding is explicit clinical evidence, not an AI inference.
- Historical clinical rows use restrictive foreign-key deletion semantics where relations are introduced.
- AI does not create, finalize, resolve, or mutate BodyMap clinical truth.
- The browser is not part of this tranche. No raw Prisma BodyMap records are serialized to client code.
- The migration must be additive and must be proven against a disposable Neon branch cloned from production shape before any production migration claim.
- Production Neon PHI approval is NOT established by this work; last-known HIPAA mode remains a separate blocker.

---

### Task 1: Lock persistence schema invariants

**Files:**
- Create: `tests/body-map-persistence-schema.test.ts`
- Create later in Task 2: `prisma/models/clinical-body-map.prisma`
- Create later in Task 2: `prisma/migrations/20260823200000_body_map_persistence_v1/migration.sql`

**Interfaces:**
- Consumes: current multi-file Prisma config (`schema: "prisma"`), existing `patients`, `encounters`, `users`, and `audit_logs` tables.
- Produces: static contract proving no persisted comparison stage, restrictive clinical FKs, severity bounds, explicit finding state, and required indexes.

- [ ] **Step 1: Write the failing schema contract test**

The test reads the future Prisma model and migration and requires:
- `BodyMapVersion` and `BodyMapFinding` models;
- no `stage` field;
- `organizationId`, `patientId`, `encounterId`, `createdByUserId`, `capturedAt`;
- `BodyMapFindingState` with `ACTIVE` and `RESOLVED`;
- laterality as an enum with left/right/bilateral/midline/not-applicable values;
- database `CHECK` constraint enforcing severity `0..10` or null;
- restrictive patient/encounter/user FKs;
- indexes supporting patient timeline and encounter lookup.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx vitest run tests/body-map-persistence-schema.test.ts`
Expected: FAIL because the model and migration do not yet exist.

- [ ] **Step 3: Commit the failing test**

Commit only the test.

---

### Task 2: Add immutable BodyMap schema and additive migration

**Files:**
- Create: `prisma/models/clinical-body-map.prisma`
- Create: `prisma/migrations/20260823200000_body_map_persistence_v1/migration.sql`
- Test: `tests/body-map-persistence-schema.test.ts`

**Interfaces:**
- Produces Prisma models:
  - `BodyMapVersion`
  - `BodyMapFinding`
  - `BodyMapFindingState`
  - `BodyMapLaterality`
- Persistent comparison roles are deliberately absent.

- [ ] **Step 1: Define Prisma enums and models**

`BodyMapVersion` stores immutable source facts:
- `id`
- `organizationId`
- `patientId`
- `encounterId`
- `createdByUserId`
- `capturedAt`
- `source` default `clinical_capture`
- `amendsVersionId` nullable self-reference for attributable correction lineage, never in-place mutation
- `createdAt`
- findings relation

`BodyMapFinding` stores:
- `id`
- `bodyMapVersionId`
- `bodyRegion`
- `laterality`
- `symptom`
- `severity`
- `clinicalState` default `ACTIVE`
- `functionalImpact`
- `radiation`
- `annotations` JSON or string-array representation consistent with Prisma/Postgres
- `sourceObservation` JSON nullable for governed structured-source provenance
- `createdAt`

- [ ] **Step 2: Add SQL migration**

Create enum/table/index/FK SQL matching Prisma. Add a PostgreSQL check constraint:
`severity IS NULL OR (severity >= 0 AND severity <= 10)`.
Use `ON DELETE RESTRICT` for patient/encounter/creator/version lineage and `ON DELETE CASCADE` only from a BodyMap version to its own child findings.

- [ ] **Step 3: Run Prisma schema validation and focused test**

Run:
- `npx prisma validate`
- `npx vitest run tests/body-map-persistence-schema.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit schema + migration**

---

### Task 3: Add server-only persisted BodyMap DTO and validation helpers

**Files:**
- Create: `src/lib/clinical/body-map-persistence.ts`
- Create: `tests/body-map-persistence.test.ts`

**Interfaces:**
- Produces:
  - `PersistedBodyMapVersion`
  - `PersistedBodyMapFinding`
  - `CreateBodyMapVersionInput`
  - `validateBodyMapVersionInput(input)`
  - `bodyMapFindingPersistenceKey(finding)`
- Does not import Prisma or the database.

- [ ] **Step 1: Write failing tests**

Cover:
- severity -1 / 11 / NaN rejected;
- blank region or symptom rejected;
- duplicate normalized `region + laterality + symptom` rejected within one version;
- explicit `RESOLVED` accepted only because it is recorded, not inferred;
- valid active finding accepted;
- caller cannot provide `stage` as persistence authority.

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/body-map-persistence.test.ts`
Expected: FAIL because helper module does not exist.

- [ ] **Step 3: Implement minimal deterministic validation**

No AI, NLP, diagnosis inference, or historical comparison.

- [ ] **Step 4: Run focused test and confirm GREEN**

- [ ] **Step 5: Commit helpers**

---

### Task 4: Add tenant-scoped append-only repository

**Files:**
- Create: `src/lib/repositories/body-map-repository.ts`
- Create: `tests/body-map-repository-contract.test.ts`

**Interfaces:**
- Consumes: `db`, `validateBodyMapVersionInput`, Prisma BodyMap models, existing `AuditLog`.
- Produces:
  - `createBodyMapVersionForOrganization(...)`
  - `listBodyMapVersionsForPatient(...)`
  - `findBodyMapVersionForEncounter(...)`

`createBodyMapVersionForOrganization` input includes:
- `organizationId`
- `patientId`
- `encounterId`
- `capturedAt`
- findings
- actor `{ userId, name, ipAddress?, userAgent? }`
- optional `amendsVersionId`

Result kinds are explicit, such as:
- `created`
- `patient_not_found`
- `encounter_not_found`
- `encounter_patient_mismatch`
- `actor_not_found`
- `amended_version_not_found`
- `invalid_input`

- [ ] **Step 1: Write failing repository contract test**

Static + pure contract must verify:
- `import "server-only"`;
- every patient/encounter/version lookup includes `organizationId`;
- patient and encounter are checked inside the same transaction used for creation;
- encounter patient must equal requested patient;
- actor must belong to the same organization and be active;
- `amendsVersionId`, when present, must belong to same organization/patient;
- repository creates a new BodyMapVersion and child findings, never updates/deletes historical versions;
- an `auditLog.create` occurs in the same transaction;
- audit action is `body_map.version_created` or `body_map.version_amended`;
- read methods use explicit `select`, not broad raw record pass-through.

- [ ] **Step 2: Run and confirm RED**

- [ ] **Step 3: Implement repository**

Creation transaction sequence:
1. validate deterministic input;
2. verify active patient under organization;
3. verify encounter under organization and matching patient;
4. verify active actor under organization;
5. if amendment requested, verify source version under same organization/patient;
6. create BodyMapVersion with nested findings;
7. create AuditLog with patient/resource references and bounded metadata;
8. return deliberately mapped DTO.

Reads:
- patient timeline ordered `capturedAt desc`;
- encounter lookup scoped `organizationId + patientId + encounterId`;
- explicit field selection only.

- [ ] **Step 4: Run focused contract tests**

- [ ] **Step 5: Commit repository**

---

### Task 5: Prove migration against disposable Neon production-shaped branch

**Files:**
- No production source file required unless proof reveals a migration defect.
- Update PR evidence only after successful proof.

**Interfaces:**
- Consumes exact migration SQL from this branch and current production-shaped Neon schema clone.
- Produces migration compatibility evidence only; does not modify production.

- [ ] **Step 1: Create a disposable Neon branch cloned from `ClinicOS Production`**

Never apply changes back to production.

- [ ] **Step 2: Apply exact BodyMap migration to disposable branch**

- [ ] **Step 3: Verify database structure**

Confirm:
- both tables exist;
- severity check exists;
- expected indexes exist;
- FKs use expected restrictive/cascade behavior;
- no existing patient/encounter/user rows were changed;
- no BodyMap rows were fabricated.

- [ ] **Step 4: Exercise synthetic append-only data**

Using only synthetic identifiers/data in the disposable branch:
- create one version with left-shoulder severity 8;
- create later version severity 6;
- create a third version with explicit dizziness finding;
- confirm older rows remain unchanged;
- confirm invalid severity fails at database constraint;
- confirm cross-tenant/cross-patient FK/source assumptions cannot be silently presented as valid repository results.

- [ ] **Step 5: Delete disposable Neon branch with no production apply**

- [ ] **Step 6: Record evidence in PR**

---

### Task 6: Reconcile domain foundation and prepare merge-ready PR

**Files:**
- Modify if needed: `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`
- Test existing: `tests/body-map-change.test.ts`
- Test existing: `tests/body-map-domain-invariants.test.ts`
- Test new persistence tests.

**Interfaces:**
- Ensures persisted objects can later be projected into existing in-memory `BodyMapVersion` comparison types without moving clinical authority to the browser.

- [ ] **Step 1: Update foundation status truth**

Only after persistence is actually implemented, change wording from foundation-only/no-persistence to accurately describe the persisted backend capability while still stating Current Visit UI is not wired yet.

- [ ] **Step 2: Run available focused gates**

At minimum:
- Prisma validate/generate if executable;
- BodyMap pure tests;
- BodyMap persistence schema tests;
- persistence helper tests;
- repository contract tests;
- Render-aligned release gate if an executable lane is available.

Do not call GitHub `steps:null` a pass or code failure.

- [ ] **Step 3: Review client/server and PHI boundary**

Confirm:
- repository remains server-only;
- no broad ORM record is passed to client code;
- no secrets or real PHI entered into tests, docs, PR metadata, or Neon proof;
- this capability does not claim production PHI approval.

- [ ] **Step 4: Open PR from exact current-main-derived branch**

PR body must state:
- what is persisted;
- what remains unbuilt (Current Visit BodyMap authoring/display and broader Clinical Change composition);
- Neon proof details;
- Actions infrastructure status;
- production PHI posture remains separate.

- [ ] **Step 5: Merge only when explicitly authorized or leave merge-ready**
