# BodyMap Longitudinal Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derive trustworthy comparison-only `initial / previous / today` BodyMap evidence and explicit resolution deltas from persisted clinical data.

**Architecture:** Keep database retrieval separate from clinical composition. Reuse the merged prior-finalized encounter selector as the sole previous-encounter authority, centralize normalized finding identity, project persisted BodyMap DTOs into comparison-only domain objects, and emit deterministic evidence-backed deltas. Missing evidence produces explicit availability reasons; AI is not in the source-of-truth path.

**Tech Stack:** TypeScript, Vitest, existing BodyMap domain/persistence modules, existing prior-finalized encounter selector.

**Spec:** `docs/superpowers/specs/2026-08-23-body-map-longitudinal-composition-design.md`

## Global Constraints

- `initial / previous / today` remain derived roles and are never persisted.
- `previous` must come only from `selectPreviousFinalizedEncounter(...)`.
- Omission never means resolution.
- `finding_resolved` requires prior active evidence plus current explicit resolved evidence.
- Resolved state dominates severity comparison so one transition does not produce duplicate resolution + severity messaging.
- Finding identity uses Unicode NFKC + whitespace collapse + trim + lowercase + laterality.
- Cross-patient/organization or structurally invalid persisted evidence fails closed.
- No Prisma/db imports in the pure composer.
- No Current Visit UI, Zumi inference, mutation route, or production migration in this tranche.

---

### Task 1: Centralize finding identity and explicit resolution semantics

**Files:**
- Create: `src/lib/clinical/body-map-identity.ts`
- Modify: `src/lib/clinical/body-map-persistence.ts`
- Modify: `src/lib/clinical/body-map-types.ts`
- Modify: `src/lib/clinical/body-map-change.ts`
- Modify: `tests/body-map-change.test.ts`
- Modify: `tests/body-map-persistence.test.ts`

**Interfaces:**
- Produces `bodyMapFindingIdentityKey({ bodyRegion, laterality, symptom }): string`.
- `BodyMapFinding` gains required `clinicalState: "active" | "resolved"`.
- `BodyMapDeltaKind` gains `finding_resolved`.
- Persistence continues exporting `bodyMapFindingPersistenceKey(...)` as a compatibility wrapper around the shared identity helper.

- [ ] **Step 1: Write failing comparator tests**

Add fixtures with `clinicalState: "active"` and tests asserting:

```ts
expect(compareBodyMapVersions(previous, {
  ...today,
  findings: [{ ...today.findings[0], clinicalState: "resolved", severity: 0 }],
})).toEqual([
  expect.objectContaining({
    kind: "finding_resolved",
    previousValue: "active",
    currentValue: "resolved",
    evidence: [
      { bodyMapVersionId: "bm-previous", findingId: "finding-shoulder-left-prev" },
      { bodyMapVersionId: "bm-today", findingId: "finding-shoulder-left-today" },
    ],
  }),
]);
```

Also assert:
- omission still emits no resolution;
- resolved without prior matching active evidence does not emit `finding_resolved`;
- Unicode/fullwidth/whitespace-equivalent identities match the same finding.

- [ ] **Step 2: Run focused comparator tests and confirm RED**

Run: `npx vitest run tests/body-map-change.test.ts`
Expected failure: missing required state / unsupported `finding_resolved` / identity mismatch before implementation.

- [ ] **Step 3: Add shared identity helper and update persistence wrapper**

Implement:

```ts
export function normalizeBodyMapIdentitySegment(value: string) {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLowerCase();
}

export function bodyMapFindingIdentityKey(finding: {
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
}) {
  return [
    normalizeBodyMapIdentitySegment(finding.bodyRegion),
    finding.laterality,
    normalizeBodyMapIdentitySegment(finding.symptom),
  ].join("::");
}
```

Make `bodyMapFindingPersistenceKey` delegate to it so persistence and comparison cannot drift.

- [ ] **Step 4: Implement explicit resolution comparator semantics**

Rules:

```ts
if (previousFinding?.clinicalState === "active" && currentFinding.clinicalState === "resolved") {
  emit finding_resolved using both evidence refs;
  continue;
}

if (!previousFinding && currentFinding.clinicalState === "active") {
  emit finding_added;
}

if (!previousFinding && currentFinding.clinicalState === "resolved") {
  emit nothing;
}
```

Then perform severity/functional-impact comparison only for non-resolution transitions.

- [ ] **Step 5: Run BodyMap comparator + persistence focused tests**

Run:
`npx vitest run tests/body-map-change.test.ts tests/body-map-persistence.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Commit message:
`feat(clinical): add explicit BodyMap resolution deltas`

---

### Task 2: Centralize finalized encounter eligibility

**Files:**
- Modify: `src/lib/clinical/previous-finalized-encounter.ts`
- Modify: `tests/previous-finalized-encounter.test.ts`

**Interfaces:**
- Produces:

```ts
export function isFinalizedLongitudinalEncounter(
  status: Encounter["status"],
): boolean;
```

- `selectPreviousFinalizedEncounter(...)` must call that predicate instead of maintaining a second internal eligibility expression.

- [ ] **Step 1: Write failing predicate tests**

Assert:

```ts
expect(isFinalizedLongitudinalEncounter("Signed")).toBe(true);
expect(isFinalizedLongitudinalEncounter("Locked")).toBe(true);
expect(isFinalizedLongitudinalEncounter("Addendum Needed")).toBe(true);
expect(isFinalizedLongitudinalEncounter("Draft")).toBe(false);
expect(isFinalizedLongitudinalEncounter("Ready for Review")).toBe(false);
```

- [ ] **Step 2: Run focused selector test and confirm RED**

Run: `npx vitest run tests/previous-finalized-encounter.test.ts`
Expected failure: predicate export missing.

- [ ] **Step 3: Implement predicate and delegate selector eligibility**

Keep existing selection order/tenant/patient/date rules unchanged.

- [ ] **Step 4: Run selector test and confirm GREEN**

- [ ] **Step 5: Commit Task 2**

Commit message:
`refactor(clinical): centralize finalized encounter eligibility`

---

### Task 3: Compose persisted longitudinal BodyMap evidence

**Files:**
- Create: `src/lib/clinical/body-map-longitudinal-composition.ts`
- Create: `tests/body-map-longitudinal-composition.test.ts`

**Interfaces:**

Input:

```ts
export interface ComposeBodyMapLongitudinalInput {
  organizationId: string;
  currentEncounter: LongitudinalEncounterReference;
  encounterCandidates: readonly LongitudinalEncounterReference[];
  persistedVersions: readonly PersistedBodyMapVersion[];
}
```

Output:

```ts
export type BodyMapAvailabilityReason =
  | "today_not_captured"
  | "no_prior_finalized_encounter"
  | "previous_body_map_not_captured"
  | "no_initial_historical_body_map"
  | "invalid_evidence";

export interface BodyMapLongitudinalComposition {
  status: "available" | "partial" | "unavailable";
  initial: BodyMapVersion | null;
  previous: BodyMapVersion | null;
  today: BodyMapVersion | null;
  initialToPrevious: BodyMapDelta[];
  previousToToday: BodyMapDelta[];
  availability: {
    initial: BodyMapAvailabilityReason | null;
    previous: BodyMapAvailabilityReason | null;
    today: BodyMapAvailabilityReason | null;
  };
}

export function composeBodyMapLongitudinalEvidence(
  input: ComposeBodyMapLongitudinalInput,
): BodyMapLongitudinalComposition;
```

- [ ] **Step 1: Write failing Golden Case composition test**

Use synthetic persisted versions:
- initial encounter, Signed, shoulder 8 active;
- previous encounter, Locked, shoulder 6 active;
- current encounter, Draft, shoulder 6 active + dizziness active.

Assert stages and deltas:

```ts
expect(result.status).toBe("available");
expect(result.initial?.stage).toBe("initial");
expect(result.previous?.stage).toBe("previous");
expect(result.today?.stage).toBe("today");
expect(result.initialToPrevious).toEqual(expect.arrayContaining([
  expect.objectContaining({ kind: "severity_improved", previousValue: 8, currentValue: 6 }),
]));
expect(result.previousToToday).toEqual(expect.arrayContaining([
  expect.objectContaining({ kind: "severity_unchanged", previousValue: 6, currentValue: 6 }),
  expect.objectContaining({ kind: "finding_added", symptom: "dizziness" }),
]));
```

- [ ] **Step 2: Add failing edge-case tests**

Cover:
- selected previous encounter has no BodyMap: reason `previous_body_map_not_captured`, no fallback;
- no prior finalized encounter: reason `no_prior_finalized_encounter`;
- no today: `status = unavailable`, reason `today_not_captured`;
- no initial historical map: partial availability;
- initial and previous are same persisted version: `initialToPrevious = []`;
- multiple versions in current encounter select latest capturedAt then createdAt;
- explicit active→resolved creates one `finding_resolved` delta;
- cross-organization/patient persisted evidence returns `invalid_evidence` with no deltas;
- persisted encounter id inconsistent with selected role returns `invalid_evidence`;
- inputs are not mutated.

- [ ] **Step 3: Run focused composition test and confirm RED**

Run: `npx vitest run tests/body-map-longitudinal-composition.test.ts`
Expected failure: composer module missing.

- [ ] **Step 4: Implement persisted-to-domain projection**

Map only governed comparator fields:

```ts
function projectPersistedVersion(
  persisted: PersistedBodyMapVersion,
  stage: BodyMapStage,
): BodyMapVersion {
  return {
    id: persisted.id,
    patientId: persisted.patientId,
    encounterId: persisted.encounterId,
    capturedAt: persisted.capturedAt,
    createdByUserId: persisted.createdByUserId,
    stage,
    findings: persisted.findings.map((finding) => ({
      id: finding.id,
      bodyRegion: finding.bodyRegion,
      laterality: finding.laterality,
      symptom: finding.symptom,
      severity: finding.severity,
      clinicalState: finding.clinicalState,
      functionalImpact: finding.functionalImpact,
      annotations: [...finding.annotations],
    })),
  };
}
```

Do not pass `sourceObservation`, source narrative, or raw ORM state into comparison.

- [ ] **Step 5: Implement deterministic stage selection**

- validate all persisted versions match `organizationId` and current patient;
- `today`: latest version for current encounter by capturedAt/createdAt descending;
- `previous`: call `selectPreviousFinalizedEncounter` and then latest version for only that encounter;
- `initial`: among finalized encounters earlier than current with BodyMap evidence, choose earliest serviceDate then earliest BodyMap capturedAt/createdAt;
- do not fallback for previous;
- do not self-compare identical initial/previous version ids.

- [ ] **Step 6: Implement status and reason codes**

Rules:

```ts
status = !today ? "unavailable"
  : initial && previous ? "available"
  : "partial";
```

For invalid evidence, return `status: "unavailable"`, all stages null, all deltas empty, and `invalid_evidence` on each availability field.

- [ ] **Step 7: Run composition + comparator + selector tests**

Run:
`npx vitest run tests/body-map-longitudinal-composition.test.ts tests/body-map-change.test.ts tests/previous-finalized-encounter.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit Task 3**

Commit message:
`feat(clinical): compose persisted BodyMap longitudinal evidence`

---

### Task 4: Reconcile clinical canon and verify exact head

**Files:**
- Modify: `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`
- Modify: `docs/superpowers/specs/2026-08-23-body-map-longitudinal-composition-design.md` only if implementation reveals a necessary clarified invariant.

**Interfaces:**
- Documentation must accurately distinguish merged persistence from feature-branch composition.

- [ ] **Step 1: Update foundation truth**

Record:
- persistence is merged to main;
- production DB migration remains unapplied unless separately verified;
- composition exists only after implementation/merge;
- explicit `finding_resolved` requires two evidence refs and no omission inference.

- [ ] **Step 2: Run available exact-source verification**

If GitHub Actions remains unallocated, reconstruct exact changed pure TypeScript files in an offline harness, hash-check them to GitHub blobs, run TypeScript compilation and executable assertions for the Golden Case + adversarial cases.

- [ ] **Step 3: Verify PR scope and current-main reconciliation**

Require:
- only intended clinical/domain/docs/tests files;
- no UI, route, migration or Render changes;
- no unresolved review threads;
- branch 0 commits behind main before merge;
- exact-head Actions state recorded truthfully.

- [ ] **Step 4: Open PR and merge only with verification truth preserved**

Founder has granted execution authority. Use expected-head SHA for merge. Never claim unavailable full CI passed.
