# Klinikos EDU — Product Specification

**Product:** Klinikos EDU
**Flagship:** Klinikos Virtual Clinic Lab
**Tagline:** Learn healthcare operations by running them.

Klinikos EDU is an education layer on top of the Klinikos clinic operating system. Students
do not read about clinic operations; they operate a simulated clinic and are assessed on the
operational decisions they make.

This document is the governing specification. Where it conflicts with an implementation, the
specification wins and the implementation is a defect.

---

## 1. Non-negotiable safety boundaries

These are product constraints, not copy suggestions. They are encoded in
`src/lib/edu/edu-safety.ts` and enforced by tests.

### 1.1 Synthetic data only

Every EDU record is synthetic training data. EDU never requires, requests, stores, or accepts
real protected health information.

Three labels must appear on every scenario surface, in the interface and in any export:

```
SYNTHETIC TRAINING DATA
EDUCATIONAL SIMULATION
NOT FOR REAL PATIENT CARE
```

### 1.2 EDU data is structurally separate from clinical data

EDU synthetic patients are **not** `Patient` records. They live in the scenario payload of
`EducationScenario` and never enter the clinical tables. There is no foreign key from any EDU
model to `Patient`, `Encounter`, `Appointment`, `LabOrder`, or any other clinical record, and
no EDU query may read them.

A student in the EDU app cannot reach production clinic data. This is a schema-level property,
not a filter that could be forgotten.

### 1.3 What AI may and may not do

AI **may**: draft synthetic scenarios, generate scenario variations, provide educational
feedback, explain missed workflow steps, draft instructor materials, and help classify student
evidence.

AI **may not**: diagnose, prescribe, certify clinical competency, grant scope of practice,
grant licensure, submit real claims, authorize real care, or state or imply that a student is
qualified to treat patients.

Every AI-produced artifact in EDU is a **draft for human review**. An AI-suggested grade is a
suggestion; the instructor's recorded decision is the grade. No competency is ever marked
achieved by an automated process.

All AI calls route through the Klinikos AI Gateway. **The gateway is not yet implemented.**
Until it exists and an approved provider is configured, EDU AI features report
`Pending Connection` and produce nothing. They fail closed — an unconfigured provider never
degrades into an ungoverned direct provider call.

### 1.4 Credentials are not licensure

Klinikos EDU may issue private educational credentials, for example
*Klinikos Certified AI-Enabled Healthcare Operations Specialist*.

Every certificate, page, and export must state that the credential is **not**: professional
licensure, board certification, clinical credentialing, authorization to practice medicine or
nursing, or scope-of-practice approval. This disclaimer is not removable by configuration and
is rendered from a single constant so it cannot drift between surfaces.

---

## 2. Roles

### 2.1 Platform roles

| Role | Purpose |
| --- | --- |
| `edu_admin` | Institution administrator. Manages programs, courses, instructors, settings. |
| `edu_instructor` | Creates courses, cohorts, scenarios, rubrics. Grades. Authoritative for competency. |
| `edu_assistant` | Teaching assistant. Grades and reviews evidence; cannot alter course structure or final competency. |
| `edu_student` | Enrolled learner. Works assigned scenarios and submits evidence. |
| `edu_observer` | Read-only accreditation or program reviewer. No grading, no student PII beyond roster. |

Instructor and student capabilities are strictly separated. A student can never read another
student's submission, evidence, grade, or instructor notes.

### 2.2 Simulation roles

Inside the Virtual Clinic Lab a student is assigned one clinic seat per scenario:

Front Desk · Medical Assistant · Nurse · Provider · Biller · Coder · Practice Manager ·
Compliance Officer

The simulation role determines the work queue, the available actions, and the rubric lens. It
grants nothing in the real clinical product — a student assigned the `provider` simulation seat
has no provider authority anywhere in Klinikos.

---

## 3. Scenario engine

Instructors author scenarios from structured forms or a natural-language prompt, for example:

> Create a primary-care scenario involving a 57-year-old patient with diabetes, a missing
> referral, an abnormal A1C result, an insurance eligibility problem and an overdue follow-up.

A generated scenario produces a synthetic patient profile, appointment, intake status, tasks,
referral, lab/result event, billing-readiness issue, insurance issue, and messages — plus the
instructor-only answer key, expected workflow sequence, rubric criteria, and bounded AI
feedback prompts.

The answer key and expected sequence are **instructor-only** and must never be serialized into
a student-facing response.

Scenario lifecycle: `draft → in_review → published → archived`. Only a published scenario may
be assigned. Editing a published scenario creates a new version rather than mutating the
version students were graded against.

---

## 4. Curriculum packages

1. Medical Office Operations
2. Introduction to EHR and Clinical Systems
3. Medical Billing and Claims Workflow
4. Clinical Documentation Lab
5. Referral and Care Coordination
6. Healthcare Privacy, Security and HIPAA Operations
7. AI in Healthcare Operations
8. Healthcare Entrepreneurship and Practice Management

Each package carries learning objectives, lessons, scenarios, assignments, rubrics,
assessments, instructor notes, student completion status, and — where appropriate — a
certificate of completion.

---

## 5. Routes

**Public:** `/edu`

**Authenticated EDU:** `/edu/dashboard`, `/edu/courses`, `/edu/courses/[courseId]`,
`/edu/cohorts`, `/edu/scenarios`, `/edu/scenarios/[scenarioId]`, `/edu/lab/[assignmentId]`,
`/edu/grading`, `/edu/competencies`, `/edu/settings`

**Admin:** `/admin/edu`

---

## 6. Interface doctrine

Each page has **one dominant work surface**. The supporting furniture is a command header, a
context drawer, and an AI intelligence rail — never a grid of cards competing for attention.

Primary surfaces: course table, cohort roster, scenario library table, student work queue,
split-view simulation workspace, evidence timeline, rubric grading inspector, competency
matrix, completion table.

Explicitly avoided: hero sections after login, nested cards, excessive pills, decorative
gradients, meaningless KPI boxes, oversized empty space.

**Accessibility (WCAG 2.2 AA, practical):** semantic landmarks and real `<table>` markup for
tabular data; every control reachable and operable by keyboard with a visible focus indicator;
form controls with programmatic labels; status messages announced via live regions; text
contrast at or above 4.5:1 and UI component contrast at or above 3:1; target sizes at least
24×24 CSS pixels; no meaning conveyed by color alone.

---

## 7. Isolation and audit

Institution isolation, then course and cohort isolation, applied in every query — not only in
the interface. Grade changes and assignment changes are audited with the acting user, the
before and after value, and a human note.

Public enrollment endpoints are rate limited. All input is validated server-side with Zod. No
secrets reach the browser. Student evidence uploads, when enabled, reuse the existing governed
document custody path rather than introducing a second, weaker upload route.

---

## 8. Delivery phases

- **P0** — spec, public landing, role model, safety boundaries, route architecture, synthetic data policy
- **P1** — instructor dashboard, courses, cohorts, enrollment, role assignment, scenario library
- **P2** — student simulation lab, work queue, evidence timeline, submission, rubric grading
- **P3** — AI scenario generation, AI feedback, competency reports, certificate infrastructure
- **P4** — LMS interoperability, SSO, LTI 1.3, SCORM/xAPI, institutional analytics, workforce edition

---

## 9. External dependencies not satisfiable in code

These require contracts, credentials, or review before the corresponding feature can be
truthfully enabled:

| Dependency | Blocks |
| --- | --- |
| Klinikos AI Gateway + approved provider contract | All AI scenario generation and AI feedback |
| Institutional agreements with schools | Real institutions, cohorts, and rosters |
| Legal / academic counsel review | Certificate wording, credential claims, student records handling |
| FERPA review and, where applicable, a student-records agreement | Storing identifiable student records |
| Accessibility audit by a qualified auditor | Any published WCAG 2.2 AA conformance claim |
| LTI 1.3 / SSO credentials from each institution | P4 LMS interoperability |
| Certificate authority / credential registry decision | Verifiable credential issuance |

Nothing in this repository may claim any of the above is complete until it is.
