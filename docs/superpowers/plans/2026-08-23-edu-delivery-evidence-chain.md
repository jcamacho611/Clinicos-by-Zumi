# Klinikos EDU Delivery Evidence Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one auditable EDU evidence pipeline from live session through attendance, learner work, instructor review, completion, feedback, certificate eligibility, and reporting while preserving human authority.

**Architecture:** Existing EDU records stay canonical for enrollments, submissions, grades, competencies, and certificates. New workforce session, attendance, feedback, and curriculum-version records are combined by a read-only evidence projection service. UI surfaces consume that projection; write authority continues through existing attendance/grading/certificate pathways.

**Tech Stack:** Next.js App Router, TypeScript, React, Prisma client/raw SQL, Zod, Vitest, existing Klinikos RBAC/session/audit infrastructure.

**Spec:** `docs/superpowers/specs/2026-08-23-edu-delivery-evidence-chain-design.md`

## Global Constraints

- Do not introduce a second auth, organization, tenant, grading, competency, or certificate system.
- AI/Zumi never verifies attendance, grades, competence, completion, certification, licensure, or professional authority.
- Every participant/session projection is institution-scoped and cohort-scoped.
- Enrollment, login, invitation acceptance, and submission activity never count as attendance.
- Final completion requires explicit instructor approval.
- Existing Klinikos typography/design language remains authoritative.
- Kentucky/SCWDB names remain proposal/customer configuration, not reusable product code.
- Synthetic/demo evidence must never be reported as real performance.

---

### Task 1: Participant Delivery Evidence Projection

**Files:**
- Create: `src/lib/edu/delivery-evidence-chain.ts`
- Create: `src/lib/edu/delivery-evidence-chain.test.ts`
- Modify: `src/lib/edu/workforce-delivery-repository.ts`

**Interfaces:**
- Produces `ParticipantDeliveryEvidence`, `deriveParticipantDeliveryEvidence()`, and `listCohortDeliveryEvidence(identity, sessionId)`.
- Consumes existing `evaluateWorkforceCompletion()` and persisted EDU evidence.

- [ ] **Step 1: Write failing unit tests** for missing attendance, missing activities, missing assessment review, missing instructor approval, and complete evidence.
- [ ] **Step 2: Run** `npx vitest run src/lib/edu/delivery-evidence-chain.test.ts` and confirm RED.
- [ ] **Step 3: Implement** a pure projection with fields: `attendance`, `activities`, `assessments`, `instructorReview`, `feedback`, `completion`, `certificateEligibility`, and explicit blockers.
- [ ] **Step 4: Add repository projection** that institution-scopes session, cohort enrollment, attendance, submissions/grades, enrollment completion evidence, feedback, and certificates without mutating them.
- [ ] **Step 5: Run** the focused tests and existing workforce evidence tests.
- [ ] **Step 6: Commit** `feat(edu): add delivery evidence projection`.

### Task 2: Instructor Delivery Command Center

**Files:**
- Create: `src/app/edu/(lab)/sessions/[sessionId]/command/page.tsx`
- Create: `src/components/edu/delivery-evidence-table.tsx`
- Modify: `src/app/edu/(lab)/sessions/[sessionId]/page.tsx`

**Interfaces:**
- Consumes `listCohortDeliveryEvidence(identity, sessionId)`.
- Links to existing attendance and grading workflows; does not duplicate writes.

- [ ] **Step 1: Add a failing route/access test** proving observer/student roles cannot open the instructor command route.
- [ ] **Step 2: Run the test and confirm RED.**
- [ ] **Step 3: Implement** role-gated command view showing participant name, verified attendance, activity evidence, assessment/review state, deterministic completion status, feedback, certificate state, and blockers.
- [ ] **Step 4: Add plain-English empty/error states** for no roster, no attendance, and incomplete evidence.
- [ ] **Step 5: Link** the existing session detail page to `Open delivery command center` for instructors/admins.
- [ ] **Step 6: Run focused tests and commit** `feat(edu): add instructor delivery command center`.

### Task 3: Participant Progress View

**Files:**
- Create: `src/app/edu/(lab)/progress/page.tsx`
- Create: `src/lib/edu/participant-delivery-evidence.ts`
- Modify: `src/lib/edu/edu-navigation.ts`

**Interfaces:**
- Produces a self-only evidence projection from `identity.enrollmentId`.
- Never returns instructor notes, verifier IDs, other learners, or hidden audit metadata.

- [ ] **Step 1: Write failing tests** proving self-only filtering and sensitive-field omission.
- [ ] **Step 2: Run and confirm RED.**
- [ ] **Step 3: Implement** participant-safe evidence mapper and progress route.
- [ ] **Step 4: Add navigation** for learner progress.
- [ ] **Step 5: Run focused tests and commit** `feat(edu): add participant progress evidence`.

### Task 4: Deterministic Certificate Eligibility Gate

**Files:**
- Create: `src/lib/edu/certificate-eligibility.ts`
- Create: `src/lib/edu/certificate-eligibility.test.ts`
- Modify: existing certificate issuance API/service discovered in `src/app/api/edu/certificates/`.

**Interfaces:**
- Produces `evaluateCertificateEligibility(evidence, policy)`.
- Certificate issuance remains an instructor/admin action and calls the gate before issuing.

- [ ] **Step 1: Write failing tests** for missing attendance, missing assessment, missing instructor approval, required feedback missing, and valid completion.
- [ ] **Step 2: Run and confirm RED.**
- [ ] **Step 3: Implement** pure eligibility logic.
- [ ] **Step 4: Integrate** the gate into existing certificate issuance without automatic issuance.
- [ ] **Step 5: Verify** certificate wording remains completion-only/non-licensure.
- [ ] **Step 6: Run tests and commit** `feat(edu): gate certificates on delivery evidence`.

### Task 5: Zumi Evidence Coaching Boundary

**Files:**
- Create: `src/lib/edu/zumi-delivery-assist.ts`
- Create: `src/lib/edu/zumi-delivery-assist.test.ts`
- Modify: existing Zumi gateway/invocation path only where necessary.

**Interfaces:**
- Produces minimum-necessary prompt context for learner coaching, cohort error summaries, and draft instructor feedback.
- Every assessment/completion-adjacent invocation sets `humanReviewRequired=true` and excludes authority fields.

- [ ] **Step 1: Write failing tests** proving prompts cannot contain hidden instructor notes, PHI, certificate authority, attendance mutation instructions, or another tenant's evidence.
- [ ] **Step 2: Run and confirm RED.**
- [ ] **Step 3: Implement** approved assistance modes: `learner_verification_coach`, `cohort_error_summary`, `instructor_feedback_draft`, `completion_blocker_explainer`.
- [ ] **Step 4: Ensure** all outputs are advisory and carry human-review language.
- [ ] **Step 5: Run tests and commit** `feat(edu): add governed Zumi delivery assist`.

### Task 6: Reporting Projection and Feedback Loop

**Files:**
- Modify: `src/app/edu/(lab)/reports/page.tsx`
- Modify: `src/lib/edu/workforce-delivery-repository.ts`
- Create: `src/lib/edu/workforce-reporting.test.ts`

**Interfaces:**
- Adds aggregate counts for evidence blockers, review queue, feedback response rate, curriculum versions, and certificate eligibility/issuance without inventing outcomes.

- [ ] **Step 1: Write failing aggregation tests** for zero-data, partial evidence, and complete evidence cases.
- [ ] **Step 2: Run and confirm RED.**
- [ ] **Step 3: Implement safe aggregates** using persisted institution-scoped records.
- [ ] **Step 4: Update reports UI** to show operational queues and evidence quality, not just vanity metrics.
- [ ] **Step 5: Run focused tests and commit** `feat(edu): extend workforce evidence reporting`.

### Task 7: Evaluator Demo Journey

**Files:**
- Modify: `src/app/edu/(lab)/demo-kit/page.tsx`
- Modify: `docs/edu/kentucky-ai-workforce/` representative materials as needed.

**Interfaces:**
- Demonstrates Programs -> Sessions -> attendance evidence -> learner activity -> flawed AI -> instructor review -> evidence chain -> reporting -> certificate example.

- [ ] **Step 1: Map every demo step to an actual route or clearly labeled representative artifact.**
- [ ] **Step 2: Remove any step that implies a live feature not implemented.**
- [ ] **Step 3: Add direct evaluator links** and concise talking points.
- [ ] **Step 4: Confirm all Kentucky references are scoped as proposal/demo configuration.**
- [ ] **Step 5: Commit** `docs(edu): align evaluator demo to evidence chain`.

### Task 8: Security, Accessibility, and Release Verification

**Files:**
- Modify tests only where defects require fixes.
- Update PR #260 description with exact evidence.

**Interfaces:**
- Final gate; no new product architecture.

- [ ] **Step 1: Run focused Vitest suites** for delivery evidence, roles, completion, attendance, certificate eligibility, and Zumi boundaries.
- [ ] **Step 2: Run project typecheck, lint, relevant security checks, and production build commands defined by `package.json`/repo scripts.**
- [ ] **Step 3: Inspect desktop, half-window, and ~390px layouts for Programs, Sessions, Command Center, Progress, Reports, and Demo Kit using available browser/runtime tooling.**
- [ ] **Step 4: Check keyboard focus, headings, labels, form errors, table semantics, zoom/reflow, and reduced-motion behavior.**
- [ ] **Step 5: Fetch exact-head GitHub workflow runs. Only call CI green if real steps execute and pass.**
- [ ] **Step 6: Update PR #260 with verification truth, remaining blockers, and explicit non-claims. Keep draft if any release gate is unavailable or failing.**
