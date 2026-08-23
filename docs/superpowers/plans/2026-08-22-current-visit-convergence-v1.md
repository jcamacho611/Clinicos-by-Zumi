# Current Visit Convergence V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing encounter page into the first truthful slice of the professional-feedback Current Visit experience without replacing the encounter lifecycle or inventing unavailable clinical data.

**Architecture:** Preserve `Encounter`, `Patient`, current encounter APIs, coding, audit, signature, and locking. Add one pure current-visit projection that turns existing authorized patient/encounter DTOs into a minimum-necessary provider-facing snapshot and deterministic close-visit readiness, then render that projection in the existing encounter editor. Structured longitudinal change, encounter-specific staff handoff, ambient scribe, integrated orders/results, and specialty configuration remain future slices until their domain truth exists.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.9, Vitest, existing Klinikos DTOs/components.

**Spec:** `docs/CLINIC_OS_CANON.md` plus the accepted 2026-08-22 professional-feedback direction recorded by this plan.

## Global Constraints

- Preserve current encounter draft/review/sign/lock/addendum behavior.
- AI remains draft-only and cannot diagnose, sign, code-finalize, or create clinical truth.
- Do not add a database migration in this slice.
- Do not expose new PHI beyond data already authorized for the encounter page.
- Do not claim structured change comparison or staff handoff exists when it does not.
- Keep patient chart navigation available.
- Keep `EncounterCodingAddenda` as the human-reviewed coding surface.
- Reconcile against latest `main` before merge because other agents are active.

---

### Task 1: Lock Current Visit projection behavior

**Files:**
- Create: `tests/current-visit-model.test.ts`
- Create: `src/lib/clinical/current-visit-model.ts`

**Interfaces:**
- Consumes: `Patient` and `Encounter` from `@/lib/types`.
- Produces: `buildCurrentVisitModel(patient, encounter)` returning patient snapshot, ordered section metadata, truthful change/handoff availability, and close-visit blockers.

- [ ] **Step 1: Write the failing test**

Create a Vitest suite proving:

```ts
const model = buildCurrentVisitModel(patient, encounter);
expect(model.sectionOrder).toEqual([
  "patient_snapshot",
  "what_changed",
  "staff_handoff",
  "today",
  "clinical",
  "assessment_plan",
  "orders_results",
  "documentation_coding",
  "close_visit",
]);
expect(model.patientSnapshot.allergies).toEqual(patient.allergies);
expect(model.change.status).toBe("not_available");
expect(model.staffHandoff.status).toBe("not_available");
expect(model.closeVisit.missingRequiredSections).toEqual(["History of present illness", "Plan"]);
```

Also prove a complete locked encounter has zero required documentation blockers and reports signed/locked state without allowing the model to infer external completion.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/current-visit-model.test.ts`
Expected: FAIL because `@/lib/clinical/current-visit-model` does not exist.

- [ ] **Step 3: Implement the minimal pure projection**

Implement a browser-safe pure module. It must not import repositories, DB code, provider adapters, or hidden policy. Required fields remain the existing lifecycle minimum: chief complaint, HPI, assessment, plan. Change/handoff must explicitly return `not_available` rather than fabricated content.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- tests/current-visit-model.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(clinical): add Current Visit projection`

### Task 2: Surface Patient Snapshot and Current Visit sequence

**Files:**
- Modify: `src/components/clinic/encounter-editor.tsx`
- Create: `tests/current-visit-experience.test.ts`

**Interfaces:**
- Consumes: `buildCurrentVisitModel(patient, encounter)` from Task 1.
- Produces: provider-facing encounter UI with Current Visit identity, patient snapshot, explicit unavailable states for structured change/staff handoff, and close-visit blockers while preserving existing note/coding/signature behavior.

- [ ] **Step 1: Write the failing experience contract test**

Read `src/components/clinic/encounter-editor.tsx` and assert the rendered source uses `buildCurrentVisitModel`, contains `Current Visit`, `Patient snapshot`, `What changed`, `Staff handoff`, `Today`, `Clinical`, `Assessment & plan`, `Documentation & coding`, and `Close visit`, while retaining `EncounterCodingAddenda`, `Ready for review`, and `Sign & lock note`.

- [ ] **Step 2: Run the focused experience test and verify RED**

Run: `npm test -- tests/current-visit-experience.test.ts`
Expected: FAIL because the new Current Visit contract is not present.

- [ ] **Step 3: Implement the smallest UI convergence**

Use the projection at component render time. Add a patient snapshot card using existing authorized DTO fields. Add compact `What changed` and `Staff handoff` cards that state those structured capabilities are not yet captured for this encounter. Rename/reframe the note experience into the target Current Visit sequence without removing working autosave, coding, audit, review, signature, or locking controls.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- tests/current-visit-model.test.ts tests/current-visit-experience.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(clinical): converge encounter into Current Visit`

### Task 3: Canon and release truth

**Files:**
- Modify: `docs/CLINIC_OS_CANON.md`
- Create: `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`

**Interfaces:**
- Produces: repository law for provider-first Current Visit, deterministic change layer, role-specific handoff, specialty configuration, integrated orders/results, revenue integrity, and human-governed AI.

- [ ] **Step 1: Add clinical convergence canon**

Record the target sequence and explicitly separate `BUILT NOW` from `NEXT DOMAIN SLICES` so documentation cannot upgrade future plans to current capability.

- [ ] **Step 2: Link the specialist canon**

Update `CLINIC_OS_CANON.md` so future clinical agents must preserve the convergence direction.

- [ ] **Step 3: Commit**

Commit message: `docs: codify clinical convergence architecture`

### Task 4: Reconcile and verify candidate head

**Files:** no planned code changes unless verification/reconciliation requires them.

- [ ] **Step 1: Re-fetch current main and open PRs**

Confirm no concurrent encounter/clinical work should supersede or be combined with this slice.

- [ ] **Step 2: Run candidate gates**

Run when executable infrastructure permits:

```bash
npm run type-check
npm run lint
npm test -- tests/current-visit-model.test.ts tests/current-visit-experience.test.ts
npm run security:check
npm run build
```

Do not call an infrastructure-refused workflow a code failure or pass.

- [ ] **Step 3: Open/update PR with exact truth**

State no migration, no ambient scribe, no structured change persistence, no staff-handoff persistence, and no external integration changes.

- [ ] **Step 4: Merge only after reconciliation and review**

Use expected head SHA. Merge completed safe work when authorized, then confirm resulting main SHA separately from deployment state.
