# BodyMap + Clinical Change Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first immutable, evidence-aware BodyMap and longitudinal Clinical Change domain foundation required by the doctor-defined Current Visit acceptance gate, without introducing fake persistence or colliding with the active Prisma multi-file migration work in PR #245.

**Architecture:** Add a pure clinical domain layer that represents immutable body-map versions and computes evidence-linked `initial -> previous -> today` deltas deterministically. This tranche deliberately does **not** persist body maps yet and does **not** claim the Current Visit is complete; the resulting interfaces become the contract that the follow-on Prisma repository/API/UI tranche must persist and consume after PR #245 lands.

**Tech Stack:** TypeScript 5.x, Vitest, existing Klinikos clinical domain conventions.

**Spec:** `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` and GitHub P0 issue #244 (`Doctor-defined Current Visit acceptance gate — no shortcuts`).

## Global Constraints

- Preserve existing Current Visit, encounter lifecycle, signing, addendum, coding, tenant, and audit authority.
- No database migration in this tranche.
- No browser claim that body-map history exists unless real persisted data is eventually supplied.
- Historical body-map versions are immutable domain facts; comparison never mutates input versions.
- Every generated delta must cite the source body-map version(s) that support it.
- AI is not used to infer body-map deltas in this layer; comparison is deterministic.
- Laterality and body region are first-class structured values.
- A missing prior/current observation means `unknown`/no-comparison, not improvement or resolution.
- Preserve compatibility with the future Prisma multi-file schema foundation from PR #245.

---

## File Structure

- Create `src/lib/clinical/body-map-types.ts` — browser-safe and server-safe immutable domain types for body-map versions, findings, evidence references, and longitudinal deltas.
- Create `src/lib/clinical/body-map-change.ts` — pure normalization/comparison logic; no database or UI dependencies.
- Create `tests/body-map-change.test.ts` — focused behavioral tests including the doctor-defined No-Fault golden case.
- Modify no existing persistence, route, encounter, or UI files in this tranche.

---

### Task 1: Immutable BodyMap domain contract

**Files:**
- Create: `src/lib/clinical/body-map-types.ts`
- Test: `tests/body-map-change.test.ts`

**Interfaces:**
- Produces: `BodyLaterality`, `BodyMapFinding`, `BodyMapVersion`, `BodyMapEvidenceRef`, `BodyMapDeltaKind`, `BodyMapDelta`.
- Consumes: no existing runtime dependency.

- [ ] **Step 1: Write the failing type/behavior test**

Add the initial test fixture to `tests/body-map-change.test.ts` with three immutable versions:

```ts
const initial: BodyMapVersion = {
  id: "bm-initial",
  patientId: "patient-1",
  encounterId: "encounter-initial",
  capturedAt: "2026-06-01T10:00:00.000Z",
  createdByUserId: "provider-1",
  stage: "initial",
  findings: [
    {
      id: "finding-shoulder-left",
      bodyRegion: "shoulder",
      laterality: "left",
      symptom: "pain",
      severity: 8,
      functionalImpact: "Difficulty lifting arm overhead",
      annotations: [],
    },
  ],
};
```

The test should import the intended types and fail because the module does not exist yet.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run tests/body-map-change.test.ts
```

Expected: FAIL because `@/lib/clinical/body-map-types` does not exist.

- [ ] **Step 3: Implement the minimal domain types**

`src/lib/clinical/body-map-types.ts` must define:

```ts
export type BodyLaterality = "left" | "right" | "bilateral" | "midline" | "not_applicable";
export type BodyMapStage = "initial" | "previous" | "today";

export interface BodyMapFinding {
  id: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  severity: number | null;
  functionalImpact: string | null;
  annotations: string[];
}

export interface BodyMapVersion {
  id: string;
  patientId: string;
  encounterId: string;
  capturedAt: string;
  createdByUserId: string;
  stage: BodyMapStage;
  findings: BodyMapFinding[];
}

export interface BodyMapEvidenceRef {
  bodyMapVersionId: string;
  findingId: string;
}

export type BodyMapDeltaKind =
  | "severity_improved"
  | "severity_worsened"
  | "severity_unchanged"
  | "finding_added"
  | "finding_removed"
  | "functional_impact_changed";

export interface BodyMapDelta {
  key: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  kind: BodyMapDeltaKind;
  previousValue: string | number | null;
  currentValue: string | number | null;
  evidence: BodyMapEvidenceRef[];
}
```

Do not add database fields, AI confidence, or rendering concerns yet.

- [ ] **Step 4: Run the test and verify the type contract compiles**

```bash
npx vitest run tests/body-map-change.test.ts
```

Expected: test advances beyond missing-module failure.

- [ ] **Step 5: Commit**

```bash
git add src/lib/clinical/body-map-types.ts tests/body-map-change.test.ts
git commit -m "feat(clinical): define immutable body map domain"
```

---

### Task 2: Deterministic evidence-linked BodyMap comparison

**Files:**
- Create: `src/lib/clinical/body-map-change.ts`
- Modify: `tests/body-map-change.test.ts`

**Interfaces:**
- Consumes: `BodyMapVersion`, `BodyMapFinding`, `BodyMapDelta` from `body-map-types.ts`.
- Produces: `compareBodyMapVersions(previous: BodyMapVersion, current: BodyMapVersion): BodyMapDelta[]` and `bodyMapFindingKey(finding: BodyMapFinding): string`.

- [ ] **Step 1: Write failing delta tests**

Add tests proving:

1. pain `8 -> 6` on the same left shoulder produces `severity_improved` with evidence refs to both versions;
2. pain `6 -> 6` produces `severity_unchanged`;
3. a new dizziness finding produces `finding_added` and cites only the current source;
4. a finding absent from current produces `finding_removed` only when the previous finding truly existed; no inference is made from a missing entire current map;
5. input versions remain byte-for-byte unchanged after comparison.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
npx vitest run tests/body-map-change.test.ts
```

Expected: FAIL because `body-map-change.ts` / comparison functions do not exist.

- [ ] **Step 3: Implement the minimal deterministic comparator**

Create a stable key from normalized structured fields:

```ts
export function bodyMapFindingKey(finding: BodyMapFinding) {
  return [finding.bodyRegion.trim().toLowerCase(), finding.laterality, finding.symptom.trim().toLowerCase()].join("::");
}
```

Comparison rules:

- Same key + both numeric severities: lower => improved; higher => worsened; equal => unchanged.
- Same key + changed non-null functional impact => `functional_impact_changed`.
- Key only in current => `finding_added`.
- Key only in previous => `finding_removed`.
- Never mutate either version or findings arrays.
- Every delta includes the exact version/finding evidence refs used.

- [ ] **Step 4: Run focused tests and verify GREEN**

```bash
npx vitest run tests/body-map-change.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/clinical/body-map-change.ts tests/body-map-change.test.ts
git commit -m "feat(clinical): compare body map versions with evidence"
```

---

### Task 3: Doctor-defined Golden Case longitudinal sequence

**Files:**
- Modify: `tests/body-map-change.test.ts`

**Interfaces:**
- Consumes: `compareBodyMapVersions`.
- Produces: executable acceptance evidence for the first longitudinal body-map slice.

- [ ] **Step 1: Add the failing three-stage Golden Case**

Model the accepted synthetic No-Fault sequence:

- Initial: left-shoulder pain 8; no dizziness.
- Previous: left-shoulder pain 6; no dizziness.
- Today: left-shoulder pain 6; dizziness added.

Assert:

```ts
expect(initialToPrevious).toEqual(expect.arrayContaining([
  expect.objectContaining({ bodyRegion: "shoulder", laterality: "left", symptom: "pain", kind: "severity_improved", previousValue: 8, currentValue: 6 }),
]));

expect(previousToToday).toEqual(expect.arrayContaining([
  expect.objectContaining({ bodyRegion: "shoulder", laterality: "left", symptom: "pain", kind: "severity_unchanged", previousValue: 6, currentValue: 6 }),
  expect.objectContaining({ bodyRegion: "head", symptom: "dizziness", kind: "finding_added" }),
]));
```

Also assert every emitted delta has at least one evidence reference and that the shoulder deltas have two evidence references.

- [ ] **Step 2: Run focused tests and confirm RED if the comparator misses any accepted semantics**

```bash
npx vitest run tests/body-map-change.test.ts
```

- [ ] **Step 3: Make only the minimal comparator correction required by the Golden Case**

Do not add PT, imaging, ADL, work status, or AI inference to this file. Those belong to later Clinical Change sources that will compose with BodyMap evidence.

- [ ] **Step 4: Run focused tests and verify GREEN**

```bash
npx vitest run tests/body-map-change.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/clinical/body-map-change.ts tests/body-map-change.test.ts
git commit -m "test(clinical): lock doctor body map golden case"
```

---

### Task 4: Integration contract for the persistence/UI follow-on

**Files:**
- Create: `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`
- Modify: `tests/body-map-change.test.ts`

**Interfaces:**
- Produces: explicit follow-on persistence contract for the Prisma/API/Current Visit tranche after PR #245.

- [ ] **Step 1: Add source-level contract assertions**

The test should assert the documentation names these mandatory follow-on invariants:

- append-only/versioned persistence;
- tenant + patient + encounter scoped reads;
- historical versions never overwritten;
- exact creator/captured-at provenance;
- `initial -> previous -> today` retrieval semantics;
- Current Visit consumes persisted versions, never demo constants;
- AI may explain deterministic deltas but may not create unsupported findings;
- signed/locked encounter history requires amendment/addendum semantics rather than mutation.

- [ ] **Step 2: Run and verify RED**

Expected: FAIL until the contract document exists.

- [ ] **Step 3: Write `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`**

Document the domain types, deterministic comparison rules, evidence requirements, current limitations, and explicit next tranche:

1. multi-file Prisma models after #245;
2. migration verified against a disposable Neon production-shape branch;
3. server-only tenant/patient/encounter repository;
4. create-new-version command, never update-in-place;
5. Current Visit body-map timeline + compare surface;
6. profession/capability checks for create/review;
7. audit events;
8. Golden Case UI proof.

State clearly: **this foundation is not body-map persistence and does not satisfy P0 #244 by itself.**

- [ ] **Step 4: Run focused tests and verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md tests/body-map-change.test.ts
git commit -m "docs(clinical): lock body map persistence contract"
```

---

## Verification Before PR

Run when executable infrastructure is available:

```bash
npx vitest run tests/body-map-change.test.ts
npm run type-check
npm run lint
```

Then run the repository's full Quality gate before merge. If GitHub Actions returns `steps:null`, record it as infrastructure failure; do not call the PR green and do not merge around the release gate.

## Self-Review

- Spec coverage: establishes immutable body maps, laterality/body region, initial/previous/today comparison, deterministic clinical deltas, source evidence, and no-AI-invention boundary.
- Explicitly deferred: persistence, Current Visit UI, staff authoring, PT/imaging/ADL/work-status change sources, full Clinical Change Graph composition.
- No placeholders/TBDs.
- Type names and comparator signatures are consistent across tasks.
- No production schema conflict with PR #245.
