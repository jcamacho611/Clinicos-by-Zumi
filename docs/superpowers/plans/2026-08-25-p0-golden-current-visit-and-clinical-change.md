# P0 Golden Current Visit and Clinical Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Current Visit into a doctor-grade Golden Case that truthfully shows encounter-specific staff handoff plus deterministic `INITIAL → PREVIOUS → TODAY` BodyMap/Clinical Change evidence while preserving all existing encounter, coding, signature, and audit authority.

**Architecture:** Reuse the existing Current Visit route, `EncounterEditor`, immutable BodyMap persistence, deterministic BodyMap comparator, prior-finalized-encounter selector, vitals, medication reconciliation, labs/imaging evidence, and encounter lifecycle. Add one bounded encounter-handoff persistence domain and one server-side longitudinal composition layer. AI may explain structured change later but does not generate the underlying change.

**Tech Stack:** Next.js, React, TypeScript, Prisma multi-file schema, PostgreSQL, Vitest, existing BodyMap repository/comparator and encounter repositories.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`; `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`; `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`.

## Global Constraints

- Preserve `DRAFT → READY_FOR_REVIEW → SIGNED → LOCKED` and separately attributable addenda.
- Never overwrite a prior BodyMap version.
- Omission is never resolution.
- Comparison roles `initial`, `previous`, and `today` are derived, never persisted as permanent clinical facts.
- `selectPreviousFinalizedEncounter(...)` from `src/lib/clinical/previous-finalized-encounter.ts` remains the historical encounter-selection authority.
- `compareBodyMapVersions(...)` from `src/lib/clinical/body-map-change.ts` remains deterministic change authority for BodyMap deltas.
- Current Visit consumes minimum-necessary DTOs only.
- No AI-created diagnoses, exam findings, laterality, order state, coding finalization, or note signature.
- MA/LPN/RN distinctions may be displayed only from verified/authorized professional context. A generic clinic role must not be relabeled as a specific profession.
- A schema-bearing PR must not merge until migration history is reconciled and an approved disposable-database proof passes.

---

### Task 1: Correct the BodyMap documentation status before extending it

**Files:**
- Modify: `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`
- Test: existing feature-status/document-register tests.

**Interfaces:**
- Produces documentation that matches current `main`, where BodyMap persistence from PR #295 is already merged.

- [ ] **Step 1: Update only stale status language**

Replace feature-branch-only claims with evidence-classified current-main truth. Preserve non-claims about UI, production PHI, and full Clinical Change.

- [ ] **Step 2: Run documentation/status guards**

Use the repository’s existing doc-register/feature-status tests. Do not upgrade production deployment status without runtime evidence.

- [ ] **Step 3: Commit**

```bash
git add docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md
git commit -m "docs(clinical): reconcile BodyMap foundation with current main"
```

### Task 2: Persist a bounded encounter-specific staff handoff

**Files:**
- Create: `prisma/models/clinical-encounter-handoff.prisma`
- Create: `prisma/migrations/<timestamp>_encounter_staff_handoff_v1/migration.sql`
- Create: `src/lib/clinical/encounter-staff-handoff.ts`
- Create: `src/lib/repositories/encounter-staff-handoff-repository.ts`
- Create: `tests/encounter-staff-handoff-validation.test.ts`
- Create: `tests/encounter-staff-handoff-repository-contract.test.ts`

**Interfaces:**
- Produces immutable or append-oriented handoff evidence for a single encounter.

Recommended V1 data contract:

```ts
export interface EncounterStaffHandoffInput {
  reasonForVisit: string | null;
  symptomSummary: string | null;
  screeningSummary: string | null;
  formReadinessSummary: string | null;
  delegatedWorkSummary: string | null;
  providerQuestions: string[];
  capturedAt: string;
  source: "staff_intake" | "nursing_intake" | "provider_review";
}
```

Persistence must also carry organization, patient, encounter, actor, creation timestamp, and optional supersession/amendment lineage if the chosen model is append-only versioned.

- [ ] **Step 1: Write failing validation tests**

Prove:

- at least one meaningful field/question is required;
- future timestamps beyond bounded clock skew fail;
- empty/whitespace provider questions are removed or rejected deterministically;
- free-text `source` outside the governed enum fails;
- payload size is bounded.

- [ ] **Step 2: Write failing repository contract tests**

Assert server-only, organization + patient + encounter scope, actor scope, same-transaction audit, explicit select DTOs, and no broad raw ORM return.

- [ ] **Step 3: Implement schema/migration + validator + repository**

Do not store `MA`, `LPN`, or `RN` as an unverified self-selected profession. Store the authenticated actor and current role context; attach verified profession evidence only if a current authoritative source is actually available at implementation time.

- [ ] **Step 4: Disposable database proof**

Run fresh migration chain and then this migration on an approved disposable PostgreSQL/Neon branch. Prove constraints at the DB layer for governed source, required association, and lineage rules.

- [ ] **Step 5: Focused tests and commit**

```bash
npm test -- tests/encounter-staff-handoff-validation.test.ts tests/encounter-staff-handoff-repository-contract.test.ts
npx prisma validate
git add prisma src/lib/clinical/encounter-staff-handoff.ts src/lib/repositories/encounter-staff-handoff-repository.ts tests
git commit -m "feat(clinical): persist encounter staff handoff evidence"
```

### Task 3: Add governed handoff write/read API

**Files:**
- Create: `src/app/api/encounters/[encounterId]/handoff/route.ts`
- Test: `tests/encounter-staff-handoff-route.test.ts`
- Reuse: current clinic session/RBAC helpers.

**Interfaces:**
- `GET` returns latest/current handoff DTO for authorized encounter.
- `POST` appends a new handoff version only when caller has the existing safe clinical-intake/write capability.

- [ ] **Step 1: Write authorization tests first**

Prove:

- unauthenticated caller denied;
- cross-tenant encounter denied/not found;
- owner/admin does not gain clinical write merely from business ownership;
- provider may review/write only according to existing encounter permissions;
- generic staff path does not claim a verified profession.

- [ ] **Step 2: Implement route using repository only**

No client-supplied organization/patient authority. Resolve them from session + encounter.

- [ ] **Step 3: Verify focused tests**

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(clinical): add governed staff handoff route"
```

### Task 4: Compose persisted BodyMap roles for Current Visit

**Files:**
- Create: `src/lib/clinical/current-visit-body-map.ts`
- Create: `tests/current-visit-body-map-composition.test.ts`
- Reuse: `src/lib/clinical/previous-finalized-encounter.ts`
- Reuse: `src/lib/clinical/body-map-change.ts`
- Reuse: `src/lib/repositories/body-map-repository.ts`

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

- [ ] **Step 1: Write the Golden Case failing test**

Use the canonical case:

```text
Initial: left shoulder pain 8
Previous: left shoulder pain 6
Today: left shoulder pain 6 + new dizziness
```

Expected:

```text
initial -> previous = severity_improved 8 -> 6
previous -> today = severity_unchanged 6 -> 6
previous -> today = dizziness finding_added
```

Every delta must retain exact BodyMap version/finding evidence refs.

- [ ] **Step 2: Add failure/partial tests**

Prove:

- no maps = `not_available`;
- today only = `partial`;
- previous + today = comparison without inventing initial;
- different-patient evidence fails closed;
- omission never emits resolution;
- `Addendum Needed` prior encounter remains eligible exactly as selector contract says.

- [ ] **Step 3: Implement composition**

Derive initial from earliest valid patient BodyMap evidence; derive previous through the prior-finalized encounter selector plus the latest BodyMap for that encounter; derive today from current encounter. Never persist role labels.

- [ ] **Step 4: Verify**

```bash
npm test -- tests/current-visit-body-map-composition.test.ts tests/body-map-repository-contract.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/clinical/current-visit-body-map.ts tests/current-visit-body-map-composition.test.ts
git commit -m "feat(clinical): compose longitudinal BodyMap evidence"
```

### Task 5: Extend `CurrentVisitModel` with real Clinical Change and handoff

**Files:**
- Modify: `src/lib/clinical/current-visit-model.ts`
- Modify: `tests/current-visit-model.test.ts`
- Modify: existing current-visit medication/vitals handoff tests.

**Interfaces:**
- Extend `CurrentVisitContext`:

```ts
bodyMapChange?: CurrentVisitBodyMapChange | null;
staffHandoff?: EncounterStaffHandoffDto | null;
```

- `change` becomes a discriminated union:

```ts
{ status: "not_available"; message: string }
| { status: "partial" | "available"; summary: CurrentVisitBodyMapChange; message: string }
```

- [ ] **Step 1: Write failing model tests**

Prove the model uses persisted change/handoff when supplied and preserves truthful unavailable/partial state when absent.

- [ ] **Step 2: Implement minimum composition**

Vitals and medication reconciliation remain part of handoff. Persisted encounter handoff adds actual reason/symptom/screening/questions. Do not infer from patient summary.

- [ ] **Step 3: Verify**

```bash
npm test -- tests/current-visit-model.test.ts tests/current-visit-medication-handoff.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(clinical): connect Current Visit to persisted change and handoff"
```

### Task 6: Load all Golden Current Visit evidence server-side

**Files:**
- Modify: `src/app/(platform)/encounters/[encounterId]/page.tsx`
- Test: `tests/current-visit-server-evidence.test.ts`

**Interfaces:**
- Extend current `Promise.all` to load:
  - encounter handoff;
  - BodyMap change composition;
  - existing patient, vital, medication reconciliation, labs/imaging evidence.

- [ ] **Step 1: Write failing server-evidence contract test**

Assert the page calls `loadCurrentVisitBodyMapChange` and encounter-handoff repository under the already-authorized encounter context.

- [ ] **Step 2: Implement server loading**

Do not send full BodyMap repository rows if the UI only needs a deliberate stage/change DTO.

- [ ] **Step 3: Verify**

```bash
npm test -- tests/current-visit-server-evidence.test.ts
npm run type-check
```

- [ ] **Step 4: Commit**

### Task 7: Build Black Label `INITIAL → PREVIOUS → TODAY` Current Visit UX

**Files:**
- Modify: `src/components/clinic/encounter-editor.tsx`
- Create: `src/components/clinic/current-visit-change.tsx`
- Create: `src/components/clinic/current-visit-body-map.tsx`
- Modify: `src/app/(platform)/encounters/[encounterId]/current-visit-black-label.module.css`
- Modify/Test: `tests/current-visit-experience.test.ts`
- Modify/Test: `tests/current-visit-black-label-stage.test.ts`

**Interfaces:**
- Consumes browser-safe Current Visit change/handoff DTOs only.

- [ ] **Step 1: Lock copy/sequence tests**

Required visible sequence remains:

```text
Patient snapshot
What changed
Staff handoff
Today
Clinical
Assessment & plan
Orders & results
Documentation & coding
Close visit
```

Change presentation must include `Initial`, `Previous`, `Today` only when corresponding evidence exists.

- [ ] **Step 2: Implement dedicated change component**

Show concise change first, evidence detail on demand. For example:

```text
Left shoulder pain: 8 → 6 → 6
Dizziness: new today
```

Do not convert missing findings into “resolved.”

- [ ] **Step 3: Implement BodyMap stage UI**

Use an accessible selectable stage/timeline, not a decorative image-only experience. Each finding must remain readable as text for keyboard/screen-reader users.

- [ ] **Step 4: Upgrade Staff Handoff UI**

Show actual encounter handoff, vitals, medication reconciliation, source/provenance, and unresolved provider questions. Display a specific profession only when it arrives from verified context.

- [ ] **Step 5: Verify responsive/accessibility states**

390/768/1024/1440/1920, 200% zoom, keyboard, reduced motion, empty/partial/full Golden Case.

- [ ] **Step 6: Commit**

```bash
git add src/components/clinic src/app/'(platform)'/encounters tests
git commit -m "feat(clinical): ship longitudinal Golden Current Visit"
```

### Task 8: DB-backed No-Fault/MSK Golden Case

**Files:**
- Create: `tests/journeys/current-visit-golden-case.test.ts` or follow the repository’s existing DB journey location/naming.
- Reuse current fixtures/helpers rather than adding production demo data.

**Interfaces:**
- Produces a synthetic-only integration journey proving the actual DB/repository chain.

- [ ] **Step 1: Seed synthetic patient + three eligible encounters + BodyMap versions + handoff**

Do this only in disposable test DB fixtures.

- [ ] **Step 2: Assert exact Golden Case deltas and provenance**

- [ ] **Step 3: Assert signed-history immutability/amendment behavior**

- [ ] **Step 4: Assert no cross-tenant/cross-patient visibility**

- [ ] **Step 5: Add this journey to the existing clinical/MVP verification command if repository conventions support it**

- [ ] **Step 6: Commit**

### Task 9: Final verification and PR

- [ ] **Step 1: Reconcile latest main and any clinical/identity PRs**

- [ ] **Step 2: Run**

```bash
npx prisma generate
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

Also execute fresh/disposable migration chain and the DB Golden Case.

- [ ] **Step 3: PR non-claims**

Explicitly state what remains outside this tranche: ambient scribe provider connection, full clinical-component system beyond BodyMap/handoff, live lab/radiology transport, terminology licensing/certified EHR claims, autonomous coding, production PHI approval if not separately verified.
