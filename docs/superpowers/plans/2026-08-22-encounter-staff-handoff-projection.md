# Encounter Staff Handoff Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface encounter-specific staff work in Current Visit from existing governed vitals, medication reconciliation, forms, and task records without creating duplicate clinical persistence.

**Architecture:** Add one server-only minimum-necessary encounter handoff repository that projects existing authoritative domain state. Extend the pure Current Visit model to classify handoff state deterministically from that projection. Update the encounter page/editor to render only persisted evidence and truthful missing states. No schema migration and no write authority changes.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Vitest.

**Spec:** `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`

## Global Constraints

- Current Visit is the provider-facing convergence surface; domain repositories remain authoritative.
- Staff handoff is encounter-specific and role-governed.
- General patient summary data must not be mislabeled as completed intake.
- AI does not determine or manufacture handoff completion.
- Browser receives a deliberate minimum-necessary DTO only.
- No schema migration in this tranche.
- No new clinical write endpoint in this tranche.
- Missing evidence remains explicitly missing.

---

### Task 1: Define the encounter handoff DTO and deterministic handoff model

**Files:**
- Create: `src/lib/clinical/encounter-handoff-types.ts`
- Modify: `src/lib/clinical/current-visit-model.ts`
- Test: `tests/current-visit-staff-handoff-projection.test.ts`

**Interfaces:**
- Produces: `EncounterStaffHandoffProjection`
- Produces: `CurrentVisitContext.handoff?: EncounterStaffHandoffProjection | null`

- [ ] **Step 1: Write the failing test** asserting vitals-only, reconciliation/forms/tasks, and no-evidence states.
- [ ] **Step 2: Verify the current source does not satisfy the new contract.**
- [ ] **Step 3: Add the DTO and minimal deterministic model logic.**
- [ ] **Step 4: Verify the focused model contract.**
- [ ] **Step 5: Commit.**

### Task 2: Build the server-only encounter handoff projection

**Files:**
- Create: `src/lib/repositories/encounter-handoff-repository.ts`
- Test: `tests/encounter-handoff-repository-boundary.test.ts`

**Interfaces:**
- Consumes: organizationId, patientId, encounterId
- Produces: `getEncounterStaffHandoffProjection(encounterId, patientId, organizationId): Promise<EncounterStaffHandoffProjection>`

- [ ] **Step 1: Write the failing boundary test** for organization + patient + encounter scoping and minimum select fields.
- [ ] **Step 2: Verify RED against the branch.**
- [ ] **Step 3: Query existing `Vital`, `MedicationReconciliation`, `FormSubmission`/`FormTemplate`, and `Task` records only.**
- [ ] **Step 4: Normalize JSON discrepancy counts and ISO timestamps server-side.**
- [ ] **Step 5: Verify no raw ORM rows or organization identifiers enter the DTO.**
- [ ] **Step 6: Commit.**

### Task 3: Wire Current Visit and render the handoff

**Files:**
- Modify: `src/app/(platform)/encounters/[encounterId]/page.tsx`
- Modify: `src/components/clinic/encounter-editor.tsx`
- Test: `tests/current-visit-staff-handoff-experience.test.ts`

**Interfaces:**
- Consumes: `EncounterStaffHandoffProjection`
- Preserves: encounter autosave, review, signature, lock, coding, audit behavior.

- [ ] **Step 1: Write the failing experience contract.**
- [ ] **Step 2: Replace the standalone vital prop with the encounter handoff projection.**
- [ ] **Step 3: Render medication reconciliation status/discrepancies, form state, and encounter work alongside vitals.**
- [ ] **Step 4: Keep missing sources explicitly unavailable and never label the handoff complete unless future governed criteria exist.**
- [ ] **Step 5: Review the diff for PHI/DTO scope and unrelated changes.**
- [ ] **Step 6: Observe exact-head CI; if Actions fails before checkout, record that truth and use focused source/type evidence without claiming the full gate passed.**
- [ ] **Step 7: Reconcile latest `main`, create/merge PR only on the exact reviewed head.**
