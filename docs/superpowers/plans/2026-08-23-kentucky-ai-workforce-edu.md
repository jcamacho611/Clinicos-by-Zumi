# Kentucky AI Workforce Readiness EDU Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Klinikos EDU foundation into a reusable, demo-ready institutional workforce-training experience aligned to the SCWDB Kentucky AI Workforce Readiness Network RFP.

**Architecture:** Reuse the existing EDU institution/program/course/cohort/scenario/rubric/submission/grade/certificate substrate. Add typed reusable workforce-program and pathway configuration, then expose it through role-authorized EDU surfaces. Do not add a second LMS schema or Kentucky-specific product fork. Proposal-support materials live under one canonical docs path.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Vitest, existing Klinikos EDU role/session/navigation architecture.

**Spec:** `docs/superpowers/specs/2026-08-23-kentucky-ai-workforce-edu-design.md`

## Global Constraints

- Current `main` implementation/runtime/schema/tests remain authoritative.
- Live instructors remain authoritative for grading and completion.
- Ordinary EDU training remains synthetic-data-first; no real PHI is required.
- All five Industry Accelerator pathways plus Career Readiness must be represented.
- Healthcare remains nonclinical/administrative and must not teach regulated clinical decision-making.
- Kentucky content is a proposed/configurable template, never represented as SCWDB-approved.
- No second auth system, tenant system, grading authority, certificate authority, or parallel LMS database.
- Accessibility is a delivery requirement; do not claim formal WCAG certification without evidence.
- Pre-existing Klinikos IP remains distinguishable from Kentucky-specific deliverables.

---

### Task 1: Responsible-AI workforce curriculum primitives

**Files:**
- Create: `src/lib/edu/workforce-ai-literacy.test.ts`
- Create: `src/lib/edu/workforce-ai-literacy.ts`

**Interfaces:**
- Produces: `workforceAiLiteracyModules`, `workforceAiOccupationalPathways`, `getWorkforceAiLiteracyModule(key)`, `getWorkforceAiOccupationalPathway(key)`.
- Consumes: existing `EduSimulationRole`.

- [ ] Write tests asserting five common responsible-AI modules, live-instructor authority, verification/privacy requirements, and truthful pathway maturity.
- [ ] Run the focused test and confirm RED because the production module does not exist.
- [ ] Implement the smallest typed curriculum module/pathway definitions that satisfy the tests.
- [ ] Run the focused test and confirm GREEN.
- [ ] Commit.

### Task 2: Institutional program and completion contracts

**Files:**
- Create: `src/lib/edu/institutional-program.test.ts`
- Create: `src/lib/edu/institutional-program.ts`
- Create: `src/lib/edu/ai-career-readiness.ts`

**Interfaces:**
- Produces: `EduInstitutionalProgramTemplate`, `assertInstitutionalProgramTemplate`, `baselineWorkforceReportingFields`, `aiCareerReadinessModule`.
- Consumes: existing curriculum package keys.

- [ ] Write tests requiring instructor review, valid attendance bounds, non-licensure certificate language, truthful career-readiness content, and reporting fields.
- [ ] Run focused test and confirm RED.
- [ ] Implement typed program/completion/certificate/reporting contracts and Career Readiness content.
- [ ] Run focused test and confirm GREEN.
- [ ] Commit.

### Task 3: Five-pathway Kentucky program catalog

**Files:**
- Create: `src/lib/edu/kentucky-ai-workforce.test.ts`
- Create: `src/lib/edu/kentucky-ai-workforce.ts`

**Interfaces:**
- Produces: `kentuckyAiWorkforceProgram`, `kentuckyIndustryPathways`, `kentuckyCareerReadinessWorkshop`, pathway/session lookup helpers.
- Consumes: Tasks 1–2.

- [ ] Write tests asserting Service A + Service B, five pathways, 6–8 hour accelerator duration, 2–3 hour career workshop duration, remote/in-person delivery, proposed-template status, healthcare nonclinical boundary, and all pathway sample exercises.
- [ ] Run focused test and confirm RED.
- [ ] Implement the complete proposal-ready typed program catalog with common module spine plus pathway-specific outcomes/exercises/human-authority boundaries.
- [ ] Run focused test and confirm GREEN.
- [ ] Commit.

### Task 4: Program and pathway evaluator UI

**Files:**
- Modify: `src/lib/edu/edu-navigation.ts`
- Create: `src/app/edu/(lab)/programs/page.tsx`
- Create: `src/app/edu/(lab)/programs/[pathway]/page.tsx`
- Create: `tests/edu-kentucky-program-ui.test.ts`

**Interfaces:**
- Consumes: Task 3 catalog and existing `EduCommandHeader`.
- Produces: role-gated `/edu/programs` and pathway detail surfaces.

- [ ] Write source/contract tests asserting route authorization, all five pathways, Career Readiness, proposed-template disclosure, live-instructor copy, and real links into cohorts/scenarios/grading.
- [ ] Run test and confirm RED.
- [ ] Add role-authorized navigation and program/pathway pages using existing EDU shell conventions.
- [ ] Run focused test and confirm GREEN.
- [ ] Commit.

### Task 5: Instructor delivery and completion evidence projection

**Files:**
- Create: `src/lib/edu/workforce-program-reporting.test.ts`
- Create: `src/lib/edu/workforce-program-reporting.ts`
- Modify: `src/app/edu/(lab)/dashboard/page.tsx` only if existing structure allows low-risk composition; otherwise expose reporting from Programs without touching dashboard.

**Interfaces:**
- Produces: deterministic aggregate helpers for enrollment, attendance/completion state, pathway, delivery modality, assessment completion, feedback/review counts, and completion evidence labels.
- Consumes: existing EDU database projection types or minimum-necessary plain records.

- [ ] Write tests for zero-safe percentage math, no synthetic/demo outcome mislabeling, instructor-review completion requirement, and no completion from attendance alone.
- [ ] Run focused test and confirm RED.
- [ ] Implement pure reporting/completion projection helpers.
- [ ] Wire only where existing page query shape can supply real values without migrations or fake records.
- [ ] Run focused test and confirm GREEN.
- [ ] Commit.

### Task 6: Canonical SCWDB proposal-support package

**Files:**
- Create: `docs/edu/kentucky-ai-workforce/REPRESENTATIVE_MATERIALS.md`
- Create: `docs/edu/kentucky-ai-workforce/OCCUPATIONAL_PATHWAY_OUTLINES.md`
- Create: `docs/edu/kentucky-ai-workforce/MEASUREMENT_AND_REPORTING_PLAN.md`
- Create: `docs/edu/kentucky-ai-workforce/RFP_COMPLIANCE_MATRIX.md`
- Create: `docs/edu/kentucky-ai-workforce/IP_SCHEDULE.md`

**Interfaces:**
- Canonical proposal content mirrors product truth from Tasks 1–5.

- [ ] Add representative slide outline, participant activities, assessments, rubric, certificate/badge wording, instructor guide, accessibility statement, security/data statement, human-AI authority statement, five pathway outlines/sample lesson segments, reporting model, compliance matrix, and pre-existing/Kentucky-specific IP schedule.
- [ ] Ensure every unverified capability is labeled proposed/configurable.
- [ ] Commit.

### Task 7: Full EDU verification and PR

**Files:**
- No production file required unless verification reveals a defect.

- [ ] Compare branch against `main` and confirm no unrelated overlap.
- [ ] Run/inspect focused tests for Tasks 1–5.
- [ ] Run available repository quality gates: Prisma validate/generate where applicable, type-check, lint, tests, build/start, and EDU-specific checks.
- [ ] If GitHub Actions fails before checkout/jobs execute, record infrastructure unavailable rather than declaring code red or green.
- [ ] Inspect program pages for keyboard semantics, mobile/reflow-safe classes, clear disclosure text, and non-color-only meaning.
- [ ] Open a detailed PR listing implemented product truth, proposal-material truth, unverified/external dependencies, and remaining founder inputs.
