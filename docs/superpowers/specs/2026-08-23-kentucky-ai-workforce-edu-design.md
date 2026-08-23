# Kentucky AI Workforce Readiness EDU Design

## Goal

Make the existing Klinikos EDU architecture a credible, reusable institutional workforce-training system that is demonstrably capable of supporting the South Central Workforce Development Board Kentucky AI Workforce Readiness Network RFP without rebuilding EDU or weakening existing authority, tenancy, privacy, or clinical boundaries.

## Source contract

This design is governed by the SCWDB RFP issued August 14, 2026 and the posted procurement Q&A. The product must support both required services: a 6–8 hour live instructor-led AI Industry Accelerator with Manufacturing, Construction, Logistics, Healthcare, and Business Operations pathways, and a 2–3 hour live instructor-led AI-Powered Career Readiness workshop. Delivery must support live remote and in-person instruction, with the ability to maintain a routine schedule, verify attendance/completion, administer surveys, support reporting, and launch approved services within 30 days after written notice to proceed.

The RFP requires hands-on learning, human review, fact-checking, source verification, privacy/confidentiality/cybersecurity, accessibility, participant take-away resources, completion evidence, representative slides/activities/assessments/certificate or badge/instructor guide, monthly reporting, quarterly curriculum review, and participant-level documentation sufficient for invoicing and audit.

## Existing architecture to preserve

Current main already has a structurally isolated EDU foundation with institutions, programs, courses, cohorts, enrollments, scenarios, assignments, rubrics, submissions, evidence, grades, instructor notes, competencies, and certificates. The application already exposes role-aware EDU navigation and surfaces for dashboard, courses, cohorts, scenarios, grading, competencies, certificates, settings, and the Virtual Clinic Lab. Healthcare simulation uses synthetic data and eight simulation roles.

No second auth system, tenant model, grading authority, certificate authority, or parallel LMS database may be introduced.

## Product design

### 1. Institutional program layer

Expose existing `EducationProgram` truth as the organizing level above courses/cohorts. Program-level configuration remains additive and reusable. Kentucky is a seeded proposed template, never a hard-coded institution or claim of SCWDB approval.

Programs describe delivery modes, occupational pathway, learning objectives, required modules, completion criteria, instructor-review requirements, reporting expectations, participant-access period, accessibility notes, safety boundaries, and certificate language.

### 2. Two service families

`AI Industry Accelerator` is a reusable program family containing five occupational pathway configurations. Healthcare uses the existing Virtual Clinic Lab and current healthcare curriculum packages. Manufacturing, Construction, Logistics, and Business Operations use the same responsible-AI teaching method and fully specified proposal-ready lesson/scenario content while remaining honest about the absence of a specialized simulation engine for those industries.

`AI-Powered Career Readiness` is a separate reusable program family covering ethical AI-supported job search, truthful resume tailoring, applications, professional communication, interview practice, employer research, privacy, verification, employer policy, and human accountability.

### 3. Common responsible-AI spine

All pathways share five foundations:

1. Understand AI principles and limits.
2. Explore appropriate workplace uses.
3. Direct AI effectively and safely.
4. Evaluate outputs for accuracy, relevance, and evidence.
5. Use AI responsibly, securely, and accountably.

Every applied scenario requires the learner to identify unsupported or unsafe AI output, verify consequential facts, preserve human authority, minimize sensitive disclosure, and document the final corrected action.

### 4. Instructor-led delivery

The instructor remains authoritative for pacing, activity release, rubric interpretation, final scoring, feedback, and completion. AI may support practice or commentary but cannot independently establish competence, completion, permissions, credentials, certification, or clinical authority.

Instructor surfaces should make program/cohort context, roster state, participant work, grading queues, evidence, completion state, and reporting needs visible without exposing unrelated tenant data.

### 5. Completion and invoicing evidence

Completion is not registration or attendance alone. A proposed configurable completion rule includes required attendance, completion of required activities, required assessments/practical evidence, and instructor approval. Participant-level completion evidence must retain enough provenance for invoicing, grant monitoring, and audit while avoiding unnecessary sensitive data.

### 6. Reporting

A program reporting projection should support enrollment, attendance, completion, pathway, modality, assessment completion, pre/post comparison where available, participant feedback, instructor-reviewed evidence, issues/corrective action, and curriculum version. Demo/synthetic data must never be presented as real outcomes.

### 7. Accessibility

New EDU surfaces must be keyboard operable, semantically structured, reflow/mobile friendly, non-color-dependent, readable at zoom, compatible with reduced motion, and suitable for screen-reader use. Assessment interactions require non-pointer alternatives. Proposal copy may say WCAG 2.2 AA-oriented practices, but must not claim formal conformance or certification without evidence.

### 8. Security and privacy

Normal training remains synthetic-data-first. No real patient data is required. Do not send PHI, participant PII beyond approved program needs, employer secrets, credentials, or confidential client data into public/unapproved AI systems. Server authorization remains authoritative. Instructor-only answer keys and sensitive program data must not be serialized unnecessarily to learner/browser surfaces.

### 9. IP boundary

Pre-existing Klinikos EDU code, Virtual Clinic Lab architecture, reusable curriculum methods, assessment structures, platform components, and security/authorization controls remain pre-existing proprietary Klinikos IP. Kentucky-specific configuration/materials are separate deliverables whose license/reuse rights are subject to contract negotiation.

### 10. Demo journey

The evaluator demo must truthfully show:

1. Klinikos EDU and the synthetic-data boundary.
2. Institutional program selection.
3. Program service/pathway and delivery modes.
4. Cohort/roster context.
5. Instructor-led lesson/session.
6. Participant activity.
7. Virtual Clinic Lab for healthcare.
8. An intentionally flawed AI output.
9. Learner correction and evidence.
10. Instructor rubric/review.
11. Completion/reporting evidence.
12. Certificate of completion with non-licensure disclaimer.

No fake integration, fake Kentucky deployment, fake participant outcome, or fake certification may be shown.

## Implementation boundaries

- Preserve current main as source of implementation truth.
- Reuse existing EDU database models rather than adding a second program/cohort stack.
- Prefer typed configuration and read projections before schema migration unless persisted state is required for a real workflow.
- No Kentucky-only code fork.
- No automated grading authority.
- No clinical decision training.
- No real PHI in normal EDU operation.
- No new paid provider solely for demo polish.
- No claim that non-healthcare specialized simulations already exist.

## Acceptance criteria

The build is acceptable when a reviewer can navigate from a reusable program surface into all five pathway outlines and Career Readiness; see live-instructor ownership, participant activities, assessment/rubric rules, synthetic-data boundaries, reporting/completion definitions, and proposal-support materials; and when existing EDU permissions/tests/build remain intact. The implementation must be mergeable without overlap-driven damage to unrelated active Clinic, Grid, identity, trust, or network work.