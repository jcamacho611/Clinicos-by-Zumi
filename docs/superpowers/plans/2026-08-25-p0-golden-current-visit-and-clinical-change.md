# P0 Golden Current Visit and Clinical Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Current Visit into a doctor-grade Golden Case that truthfully shows encounter-specific staff handoff plus deterministic `INITIAL → PREVIOUS → TODAY` BodyMap/Clinical Change evidence while preserving encounter, coding, signature, and audit authority.

**Architecture:** Reuse the current encounter route/editor, immutable BodyMap persistence, deterministic BodyMap comparator, prior-finalized-encounter selector, vitals, medication reconciliation, labs/imaging evidence, and encounter lifecycle. Add one append-only encounter-handoff evidence domain and one server-side longitudinal composition layer. AI may later explain structured change but cannot generate the underlying change.

**Tech Stack:** Next.js, React, TypeScript, Prisma multi-file schema, PostgreSQL, Vitest, existing BodyMap repository/comparator and encounter repositories.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`; `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`; `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`.

## Global Constraints

- Preserve `DRAFT → READY_FOR_REVIEW → SIGNED → LOCKED` and separately attributable addenda.
- Never overwrite a prior BodyMap or Staff Handoff version.
- Omission is never resolution.
- `initial`, `previous`, `today` are derived comparison roles, never stored as permanent clinical facts.
- `selectPreviousFinalizedEncounter(...)` from `src/lib/clinical/previous-finalized-encounter.ts` remains historical encounter-selection authority.
- `compareBodyMapVersions(...)` from `src/lib/clinical/body-map-change.ts` remains BodyMap delta authority.
- Current Visit receives minimum-necessary DTOs only.
- No AI-created diagnosis, exam finding, laterality, order state, final code, or signature.
- Current RBAC gives broad encounter privileges to some business roles. This plan MUST NOT treat those generic rights as permission to author clinical handoff evidence. V1 handoff authoring is fail-closed to authenticated `provider` and `clinical_staff` roles only, matching existing clinical workflow authority without claiming a specific MA/LPN/RN profession. A later verified profession/capability layer may narrow this further.
- A schema-bearing PR must not merge until migration history is reconciled and a disposable-database proof passes.

---

### Task 1: Reconcile stale BodyMap documentation status

**Files:**
- Modify: `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`
- Test: `tests/canonical-truth-drift.test.ts`

- [ ] **Step 1: Write/extend the truth-drift assertion if current tests do not already guard BodyMap status**

Require the document to state that the persistence substrate is merged on current main while keeping UI/production-PHI/full-Clinical-Change claims explicitly incomplete.

- [ ] **Step 2: Run RED if the new assertion was required**

```bash
npm test -- tests/canonical-truth-drift.test.ts
```

- [ ] **Step 3: Correct the stale feature-branch language only**

Do not claim production migration/deployment from merge status.

- [ ] **Step 4: Verify GREEN and commit**

```bash
npm test -- tests/canonical-truth-drift.test.ts
git add docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md tests/canonical-truth-drift.test.ts
git commit -m "docs(clinical): reconcile BodyMap foundation with current main"
```

### Task 2: Persist append-only encounter-specific Staff Handoff evidence

**Files:**
- Create: `prisma/models/clinical-encounter-handoff.prisma`
- Create: `prisma/migrations/20260825050000_encounter_staff_handoff_v1/migration.sql`
- Create: `src/lib/clinical/encounter-staff-handoff.ts`
- Create: `src/lib/repositories/encounter-staff-handoff-repository.ts`
- Create: `tests/encounter-staff-handoff-validation.test.ts`
- Create: `tests/encounter-staff-handoff-repository-contract.test.ts`

**Interfaces:**

Use this V1 runtime contract:

```ts
export const ENCOUNTER_HANDOFF_SOURCES = ["staff_intake", "provider_review"] as const;

export interface EncounterStaffHandoffInput {
  reasonForVisit: string | null;
  symptomSummary: string | null;
  screeningSummary: string | null;
  formReadinessSummary: string | null;
  delegatedWorkSummary: string | null;
  providerQuestions: string[];
  capturedAt: string;
  source: typeof ENCOUNTER_HANDOFF_SOURCES[number];
}
```

Use this additive persistence shape:

```prisma
enum EncounterStaffHandoffSource {
  STAFF_INTAKE
  PROVIDER_REVIEW
}

model EncounterStaffHandoffVersion {
  id                  String                      @id @default(cuid())
  organizationId      String
  patientId           String
  encounterId         String
  createdByUserId     String
  source              EncounterStaffHandoffSource
  reasonForVisit      String?                     @db.Text
  symptomSummary      String?                     @db.Text
  screeningSummary    String?                     @db.Text
  formReadinessSummary String?                    @db.Text
  delegatedWorkSummary String?                    @db.Text
  providerQuestions   Json
  capturedAt          DateTime
  supersedesVersionId String?
  createdAt           DateTime                    @default(now())

  supersedes          EncounterStaffHandoffVersion?  @relation("EncounterHandoffSupersession", fields: [supersedesVersionId], references: [id], onDelete: Restrict)
  supersededBy        EncounterStaffHandoffVersion[]  @relation("EncounterHandoffSupersession")

  @@index([organizationId, patientId, encounterId, capturedAt])
  @@index([supersedesVersionId])
  @@map("encounter_staff_handoff_versions")
}
```

Legacy patient/encounter/user ownership remains transactionally verified in the repository, matching the current multi-file BodyMap pattern rather than widening this tranche with reverse relations.

- [ ] **Step 1: Write failing validator tests**

Enforce:

- at least one meaningful summary/question;
- max 4,000 characters for each summary;
- max 10 provider questions, 500 characters each;
- empty questions rejected;
- capture time no more than five minutes in the future;
- only the two governed sources above;
- JSON-safe input.

- [ ] **Step 2: Write failing repository contract tests**

Assert `import "server-only"`, `db.$transaction`, active organization-scoped patient/actor checks, organization/patient encounter match, supersession source belongs to same organization/patient/encounter, append-only create, same-transaction bounded audit, explicit selects, and no update/delete repository path.

- [ ] **Step 3: Implement schema, SQL migration, validator, DTO mapping, repository**

Repository entry point:

```ts
export async function createEncounterStaffHandoffVersion(input: {
  organizationId: string;
  patientId: string;
  encounterId: string;
  supersedesVersionId?: string | null;
  fields: EncounterStaffHandoffInput;
  actor: { userId: string; role: ClinicRole; ipAddress?: string; userAgent?: string };
}): Promise<CreateEncounterStaffHandoffResult>;
```

Fail closed unless `actor.role === "provider" || actor.role === "clinical_staff"`.

Map source automatically at the route/repository boundary:

```ts
provider       -> provider_review
clinical_staff -> staff_intake
```

Never let the client choose `provider_review`.

- [ ] **Step 4: Prove migration on an approved disposable database**

Run the full fresh migration chain, create valid evidence, reject invalid enum/empty evidence/invalid supersession, confirm expected indexes, then delete the disposable branch without applying to production.

- [ ] **Step 5: Verify and commit**

```bash
npx prisma generate
npx prisma validate
npm test -- tests/encounter-staff-handoff-validation.test.ts tests/encounter-staff-handoff-repository-contract.test.ts
git add prisma src/lib/clinical/encounter-staff-handoff.ts src/lib/repositories/encounter-staff-handoff-repository.ts tests
git commit -m "feat(clinical): persist encounter staff handoff evidence"
```

### Task 3: Add governed Staff Handoff read/write API

**Files:**
- Create: `src/app/api/encounters/[encounterId]/handoff/route.ts`
- Create: `tests/encounter-staff-handoff-route.test.ts`
- Reuse: `src/lib/auth/session.ts`
- Reuse: `src/lib/repositories/encounter-repository.ts`

**Interfaces:**
- `GET`: latest handoff DTO for an encounter, only after current encounter-read permission and tenant scope succeed.
- `POST`: append new handoff version for `provider` or `clinical_staff` only.

- [ ] **Step 1: Write failing authorization tests**

Prove unauthenticated denied, cross-tenant indistinguishable from missing, `clinic_owner` and `administrator` denied clinical handoff authoring despite their generic encounter permissions, provider allowed, clinical_staff allowed, front desk/biller/case manager denied.

- [ ] **Step 2: Implement route**

Resolve organization, patient, encounter, actor, and source from server/session truth. Request body contains only handoff fields plus optional `supersedesVersionId`.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/encounter-staff-handoff-route.test.ts tests/encounter-staff-handoff-repository-contract.test.ts
git add src/app/api/encounters/'[encounterId]'/handoff/route.ts tests/encounter-staff-handoff-route.test.ts
git commit -m "feat(clinical): add governed staff handoff route"
```

### Task 4: Compose persisted BodyMap roles for Current Visit

**Files:**
- Create: `src/lib/clinical/current-visit-body-map.ts`
- Create: `tests/current-visit-body-map-composition.test.ts`
- Reuse: `src/lib/clinical/previous-finalized-encounter.ts`
- Reuse: `src/lib/clinical/body-map-change.ts`
- Reuse: `src/lib/repositories/body-map-repository.ts`
- Reuse: `src/lib/repositories/encounter-repository.ts`

**Interfaces:**

```ts
export interface CurrentVisitBodyMapStage {
  role: "initial" | "previous" | "today";
  version: PersistedBodyMapVersion;
}

export interface CurrentVisitBodyMapChange {
  stages: CurrentVisitBodyMapStage[];
  initialToPrevious: BodyMapDelta[];
  previousToToday: BodyMapDelta[];
  status: "available" | "partial" | "not_available";
  message: string;
}

export async function loadCurrentVisitBodyMapChange(input: {
  organizationId: string;
  patientId: string;
  encounter: Encounter;
}): Promise<CurrentVisitBodyMapChange>;
```

- [ ] **Step 1: Write the Golden Case RED test**

```text
Initial: left shoulder pain 8
Previous: left shoulder pain 6
Today: left shoulder pain 6 + dizziness
```

Expect `severity_improved 8→6`, `severity_unchanged 6→6`, and `dizziness finding_added`, each with exact BodyMap version/finding refs.

- [ ] **Step 2: Add fail-closed tests**

No maps => `not_available`; today only => `partial`; previous + today compares without inventing initial; cross-patient fails; omission emits no resolution; `Addendum Needed` remains eligible through the existing selector.

- [ ] **Step 3: Implement composition**

1. load patient BodyMap versions via `listBodyMapVersionsForPatient`;
2. load eligible patient encounters required by `selectPreviousFinalizedEncounter`;
3. `initial` = earliest valid persisted patient BodyMap version;
4. `previous` = latest BodyMap belonging to selector-chosen prior encounter;
5. `today` = latest BodyMap for current encounter;
6. compare only available ordered pairs using `compareBodyMapVersions`;
7. never persist comparison roles.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/current-visit-body-map-composition.test.ts tests/body-map-repository-contract.test.ts
git add src/lib/clinical/current-visit-body-map.ts tests/current-visit-body-map-composition.test.ts
git commit -m "feat(clinical): compose longitudinal BodyMap evidence"
```

### Task 5: Extend `CurrentVisitModel` with persisted change/handoff

**Files:**
- Modify: `src/lib/clinical/current-visit-model.ts`
- Modify: `tests/current-visit-model.test.ts`
- Modify: `tests/current-visit-medication-handoff.test.ts`

**Interfaces:**

```ts
export interface CurrentVisitContext {
  vital?: PatientVital | null;
  medicationReconciliation?: CurrentVisitMedicationReconciliation | null;
  bodyMapChange?: CurrentVisitBodyMapChange | null;
  staffHandoff?: EncounterStaffHandoffDto | null;
  closeEvaluation?: Partial<CurrentVisitCloseEvaluation>;
}
```

Change state becomes:

```ts
CurrentVisitUnavailableState
| { status: "partial" | "available"; message: string; bodyMap: CurrentVisitBodyMapChange };
```

- [ ] **Step 1: Write RED tests**

Persisted BodyMap change replaces the current hard-coded unavailable state. Persisted handoff combines with vitals/medication reconciliation without calling incomplete domains complete.

- [ ] **Step 2: Implement pure composition**

No repository imports in `current-visit-model.ts`.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/current-visit-model.test.ts tests/current-visit-medication-handoff.test.ts
git commit -am "feat(clinical): connect Current Visit to persisted change and handoff"
```

### Task 6: Load Golden Current Visit evidence server-side

**Files:**
- Modify: `src/app/(platform)/encounters/[encounterId]/page.tsx`
- Create: `tests/current-visit-server-evidence.test.ts`

- [ ] **Step 1: Write RED contract**

Assert the page loads `loadCurrentVisitBodyMapChange(...)` and latest Staff Handoff after the encounter is already tenant-authorized.

- [ ] **Step 2: Extend the existing `Promise.all`**

Load patient, vital, medication reconciliation, labs/imaging evidence, latest handoff, and BodyMap change. Pass deliberate DTOs to `EncounterEditor`.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/current-visit-server-evidence.test.ts
npm run type-check
git add src/app/'(platform)'/encounters/'[encounterId]'/page.tsx tests/current-visit-server-evidence.test.ts
git commit -m "feat(clinical): load Golden Current Visit evidence"
```

### Task 7: Build Black Label `INITIAL → PREVIOUS → TODAY` UX and handoff authoring

**Files:**
- Modify: `src/components/clinic/encounter-editor.tsx`
- Create: `src/components/clinic/current-visit-change.tsx`
- Create: `src/components/clinic/current-visit-body-map.tsx`
- Create: `src/components/clinic/current-visit-staff-handoff.tsx`
- Modify: `src/app/(platform)/encounters/[encounterId]/current-visit-black-label.module.css`
- Modify: `tests/current-visit-experience.test.ts`
- Modify: `tests/current-visit-black-label-stage.test.ts`
- Create: `tests/current-visit-staff-handoff-experience.test.ts`

- [ ] **Step 1: Lock sequence/copy with RED tests**

Required sequence remains Patient snapshot, What changed, Staff handoff, Today, Clinical, Assessment & plan, Orders & results, Documentation & coding, Close visit.

- [ ] **Step 2: Render compact change narrative**

Example from governed evidence:

```text
Left shoulder pain: 8 → 6 → 6
Dizziness: new today
```

Missing findings never display “resolved.” Evidence detail is progressively disclosed.

- [ ] **Step 3: Render accessible BodyMap stages**

Each stage has a text list of findings in addition to any visual body diagram. Keyboard and screen-reader operation cannot depend on clicking body regions.

- [ ] **Step 4: Render Staff Handoff and bounded authoring**

Provider/clinical_staff see the governed authoring action. All other roles get read-only or no authoring based on current encounter read access. Show “Provider” or “Clinical staff” from role context only; do not display MA/LPN/RN unless verified profession evidence later supplies it.

- [ ] **Step 5: Verify 390/768/1024/1440/1920, 200% zoom, keyboard, reduced motion, empty/partial/full Golden Case**

- [ ] **Step 6: Commit**

```bash
git add src/components/clinic src/app/'(platform)'/encounters tests
git commit -m "feat(clinical): ship longitudinal Golden Current Visit"
```

### Task 8: Add DB-backed Golden Case to the existing MVP journey runner

**Files:**
- Create: `scripts/mvp/current-visit-golden-case-journey.mts`
- Modify: `scripts/mvp/run-all.mjs`

- [ ] **Step 1: Implement the synthetic journey against the disposable verification DB**

Create two organizations to prove isolation, one synthetic patient, three eligible encounters, handoff evidence, and the three BodyMap versions above.

- [ ] **Step 2: Assert deterministic change/provenance**

Verify exactly the three expected deltas and their evidence refs.

- [ ] **Step 3: Assert signed-history immutability**

Ordinary new handoff/BodyMap mutation against finalized historical evidence must follow their amendment/supersession contracts.

- [ ] **Step 4: Assert cross-tenant/cross-patient negatives**

- [ ] **Step 5: Run the journey directly before registering it**

```bash
npx tsx scripts/mvp/current-visit-golden-case-journey.mts
```

Expected: exit 0 against the disposable verification database.

- [ ] **Step 6: Add it to `scripts/mvp/run-all.mjs`, then run**

```bash
npm run test:mvp
```

- [ ] **Step 7: Commit**

```bash
git add scripts/mvp/current-visit-golden-case-journey.mts scripts/mvp/run-all.mjs
git commit -m "test(clinical): prove Golden Current Visit journey"
```

### Task 9: Final verification and PR

- [ ] **Step 1: Reconcile latest main and clinical/identity branches**

- [ ] **Step 2: Run fresh evidence**

```bash
npx prisma generate
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
npm run test:mvp
```

Also execute the entire migration chain on a verified disposable DB.

- [ ] **Step 3: PR non-claims**

State that this tranche does not establish ambient-scribe provider connection, full typed clinical components beyond handoff/BodyMap, live lab/radiology transport, terminology licensing/certified-EHR status, autonomous coding, or production PHI approval unless separately proven.
