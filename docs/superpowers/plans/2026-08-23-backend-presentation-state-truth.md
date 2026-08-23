# Backend Presentation-State Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve authoritative backend truth while giving Klinikos presentation layers enough structured state to render genuinely distinct empty, partial, unavailable, blocked, and ready experiences without inventing data or turning authorization/not-found control flow into ordinary data states.

**Architecture:** Keep existing domain repositories authoritative and avoid a repository-wide return-type rewrite. Add state only at server-owned presentation/projection boundaries where the UI genuinely needs it. Permission denial remains authorization control flow, not an `empty`/`blocked` data result; patient/resource absence remains not-found control flow; bounded/truncated or dependency-limited views must carry explicit provenance and reason instead of silently appearing complete.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Vitest, existing Klinikos repositories and server-only DTO/projector modules.

**Spec:** The governing frontend/Black Label requirement is that meaningful surfaces distinguish loading, empty, partial, unavailable, blocked/permission, error, and ready states while remaining truthful. This plan translates that requirement into backend contracts without creating a second domain authority stack.

## Global Constraints

- Frontend = experience; backend = authority + proprietary implementation; DTO = disclosure boundary.
- Do not create a second patient, lab, imaging, integration, authorization, audit, or workflow truth store.
- Do not bulk-refactor all repositories to return envelopes.
- `403`/authorization denial is not `empty` data.
- `404`/not-found is not `empty` data.
- `empty` means an authorized authoritative read completed successfully and returned zero records.
- `partial` means the returned view is intentionally bounded, truncated, source-limited, or otherwise non-exhaustive and MUST expose why.
- `unavailable` means the governing source/dependency cannot currently establish the view; it MUST NOT be rendered as “no records.”
- `blocked` is a governed next-action state only when the user may legitimately know the work exists but cannot proceed until a named requirement is satisfied.
- `ready` means the projection has enough authoritative evidence to render its intended content; it does not imply clinical review, payment, credential verification, fulfillment, or other downstream completion.
- Never expose raw ORM objects, secrets, hidden Zumi orchestration, internal pricing logic, trust/ranking internals, or unnecessary PHI through state DTOs.
- Preserve existing `NetworkAccessError`, `notFound()`, RBAC, tenant scope, and source-domain lifecycle authority.
- Do not claim CI-green while GitHub Actions jobs fail before execution.

---

### Task 1: Inventory presentation-boundary state loss

**Files:**
- Inspect: `src/app/(platform)/patients/[patientId]/page.tsx`
- Inspect: `src/lib/repositories/lab-repository.ts`
- Inspect: `src/lib/repositories/imaging-repository.ts`
- Inspect: `src/lib/repositories/vital-repository.ts`
- Inspect: `src/lib/repositories/encounter-repository.ts`
- Inspect: `src/lib/repositories/document-repository.ts`
- Inspect: `src/components/clinic/patient-chart.tsx`
- Inspect: Current Visit projection modules from active PRs before modifying overlapping files
- Create/Update test inventory only after selecting a concrete boundary

**Interfaces:**
- Consumes: existing domain repository return contracts and page-level authorization/not-found control flow.
- Produces: a short table in the implementation PR body identifying each audited call as one of `authority_error`, `not_found`, `complete_empty`, `complete_data`, `bounded_partial`, `dependency_unavailable`, or `already_truthful`.

- [ ] **Step 1: Confirm actual callers before changing any repository signature**

Search exact function names and record every caller. Do not generalize from function names alone.

- [ ] **Step 2: Separate control-flow states from data states**

For each caller, explicitly record whether authorization and primary-object existence are already established earlier in the request. Example: the patient chart currently checks patient read authority and separately loads the patient record, so `listLabResultsForPatient(...) === []` does not by itself make the chart unable to distinguish patient-not-found from no lab results.

- [ ] **Step 3: Choose the first boundary only where a real ambiguity reaches the UI**

Do not implement a generic envelope if the page can already truthfully derive the state from existing authoritative reads.

- [ ] **Step 4: Commit the audit decision in the PR description before implementation**

The PR must say which ambiguity is real, which apparent ambiguity is already resolved by control flow, and why the selected boundary is worth changing.

---

### Task 2: Define the minimum server-owned presentation-state vocabulary

**Files:**
- Create only if Task 1 proves reuse is needed: `src/lib/presentation/domain-read-state.ts`
- Test: `tests/domain-read-state.test.ts`

**Interfaces:**
- Produces only presentation semantics, never domain authority.
- Proposed reusable type only if multiple independent projections need it:

```ts
export type DomainReadState =
  | { state: "empty" }
  | { state: "partial"; reason: string; visibleCount: number; totalCount?: number | null }
  | { state: "unavailable"; reason: string; retryable: boolean }
  | { state: "blocked"; reason: string; nextAction?: { label: string; href: string } }
  | { state: "ready" };
```

Do not add `denied` or `not_found` here; those remain request/control-flow outcomes.

- [ ] **Step 1: Write failing tests first if a shared type/helper is actually required**

Tests must prove any helper never converts denied/not-found into ordinary data state and preserves explicit partial/unavailable reasons.

- [ ] **Step 2: Run the focused test and observe RED**

If no executable environment is available, stop before production implementation; source-only confidence is not TDD evidence.

- [ ] **Step 3: Implement only the minimal type/helper required by the selected projection**

No generic registry, class hierarchy, or repository wrapper.

- [ ] **Step 4: Run focused tests to GREEN**

- [ ] **Step 5: Commit**

---

### Task 3: Use Current Visit clinical evidence as the first exemplar, not a parallel rewrite

**Files:**
- Review active PR `#261` before editing any Current Visit evidence files.
- Prefer extending/reconciling its existing minimum-necessary DTO rather than creating a second labs/imaging presentation model.

**Interfaces:**
- Consumes: authoritative lab/imaging repositories.
- Produces: browser-safe Current Visit evidence with explicit absence/partialness and provenance.

- [ ] **Step 1: Reconcile against PR #261**

PR #261 already establishes valuable rules: empty evidence is never a “normal result” assertion; lab analytes are bounded; truncation carries `totalItemCount` + `itemsTruncated`; source/review/version/correction state is preserved. Treat that as the preferred first implementation of this plan.

- [ ] **Step 2: Add only missing state semantics that survive latest-main review**

Examples that may be justified after executable TDD:
- source window incomplete;
- external dependency unavailable while persisted local evidence remains readable;
- record projection partial because a bounded item cap was reached.

Do not infer order completion merely because a result exists.

- [ ] **Step 3: Preserve authority boundaries**

The presentation state may explain evidence availability; it may not mark a result reviewed, notify a patient, close an order, diagnose, or widen chart access.

---

### Task 4: Add truthful patient-chart state derivation only where needed

**Files:**
- Modify only after executable tests: `src/app/(platform)/patients/[patientId]/page.tsx`
- Modify only after executable tests: `src/components/clinic/patient-chart.tsx`
- Test: targeted patient-chart state contract

**Interfaces:**
- Consumes: separately authorized patient existence plus existing domain reads.
- Produces: explicit per-section presentation state when that state cannot already be derived safely in the component.

- [ ] **Step 1: Write a failing contract for one real ambiguity**

Example acceptable behavior:
- authorized active patient + zero lab rows => Labs section `empty`;
- bounded clinical evidence => `partial` with disclosure;
- known unavailable integration/dependency where the page needs to communicate it => `unavailable`;
- unauthorized chart => request never reaches ordinary chart data-state rendering.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement minimal server-side derivation**

Keep raw repository objects server-side and pass only approved minimum-necessary state/content.

- [ ] **Step 4: Verify GREEN and regression coverage**

- [ ] **Step 5: Commit**

---

### Task 5: Establish state-copy mapping without leaking backend jargon

**Files:**
- Prefer a shared presentation helper/component only after at least two real consumers exist.

**Interfaces:**
- Maps governed server state to customer language, for example:
  - `empty` → “No results are recorded.”
  - `partial` → “Showing part of the available record.”
  - `unavailable` → “This source is not available right now.”
  - `blocked` → name the missing requirement and legitimate next action.

- [ ] **Step 1: Test copy/state mapping for meaning, not exact cosmetic prose**

- [ ] **Step 2: Ensure no raw `tenant`, `adapter`, `connector`, ORM, policy-class, or internal-event language leaks into normal clinical UI**

- [ ] **Step 3: Ensure no “all clear,” “normal,” “reviewed,” “paid,” “verified,” or “completed” copy is emitted from mere absence or source unavailability**

- [ ] **Step 4: Commit**

---

### Task 6: Full release verification before merge

**Files:**
- No production-code changes in this task.

**Interfaces:**
- Consumes: exact final branch head.
- Produces: release evidence only.

- [ ] **Step 1: Reconcile branch against latest `main`**

- [ ] **Step 2: Run Prisma generate/validate and clean migration-chain verification where required by repository gate**

- [ ] **Step 3: Run type-check**

- [ ] **Step 4: Run lint**

- [ ] **Step 5: Run focused and full test suites**

- [ ] **Step 6: Run MVP/security journeys relevant to changed surfaces**

- [ ] **Step 7: Run production build and startup/health smoke**

- [ ] **Step 8: Inspect changed files for browser-boundary leakage**

- [ ] **Step 9: Verify no unresolved PR review threads**

- [ ] **Step 10: Merge only the exact verified head**

## Self-Review Notes

- This plan intentionally rejects a blanket “69 repositories return envelopes” refactor.
- It preserves Claude’s valuable observation that frontend state quality depends on backend truth while correcting the scope: add explicit state at presentation boundaries only when an ambiguity actually reaches the UI.
- Current Visit PR #261 is the preferred first exemplar and must be reconciled rather than duplicated.
- Permission denial and primary-object absence remain control flow, not ordinary empty-state DTOs.
- No production implementation should be committed from this plan until a real executable RED/GREEN path is available.