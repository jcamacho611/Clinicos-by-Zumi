# EDU + Workforce OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P2/P3

## Purpose

Turn healthcare education into evidence-backed workforce supply and institutional outcomes rather than isolated course consumption.

## Core loop

`LEARN → PRACTICE → EVIDENCE → HUMAN REVIEW → COMPETENCY → OPT-IN GRID → OPPORTUNITY → WORK → EXPERIENCE → ADVANCEMENT`

## Personas

- learner
- instructor
- program administrator
- school/institution
- employer
- workforce board/government program
- preceptor/site
- Grid professional

## Frontend surfaces

- institution dashboard
- program/cohort setup
- instructor dashboard
- learner dashboard
- virtual clinic/simulation
- assessment/rubric
- attendance/completion
- certificate
- workforce outcome reporting
- Grid readiness/opportunity bridge

## Domain authority

EDU owns program/curriculum/assessment/instructor-review/completion evidence. It does not create licensure, professional credential truth or employment eligibility by itself.

## Backend services

- InstitutionProgramService
- CohortService
- EnrollmentService
- CurriculumService
- SessionService
- SimulationService
- AssessmentEngine
- RubricService
- InstructorReviewService
- AttendanceService
- CompletionEngine
- CertificateService
- WorkforceEvidenceService
- GridReadinessProjection

## Canonical data

Institution, Program, Cohort, Session, InstructorAssignment, Enrollment, Curriculum, Module, LearningObjective, Scenario, Assessment, AssessmentAttempt, Rubric, InstructorReview, Attendance, CompletionEvidence, Certificate, WorkforceOutcome, AccommodationMetadata.

## Virtual Clinic

Use synthetic/de-identified training data by default. Support role-based simulation for front desk, MA, nurse, provider, biller, coder, practice manager and compliance roles.

AI commentary is not deterministic truth; assessment scoring should distinguish structured answer keys/rubrics from model feedback.

## Instructor-led requirements

- roster/status
- session agenda
- instructor guide
- scenario launch controls
- participant activity
- assessment queue
- rubric scoring
- feedback
- attendance/completion evidence
- controlled release
- session notes
- exportable non-PHI reporting

## Assessment types

- knowledge check
- scenario decision
- workflow sequencing
- error identification
- AI-output critique
- short response
- instructor rubric

## Career readiness

Support responsible AI in job search, truthful resume/application assistance, professional communication, interview preparation, privacy, employer policy and fact checking. Never fabricate experience or credentials.

## Commands

- create/configure program
- enroll participant
- assign instructor
- start/complete module
- submit assessment
- score/review
- record attendance
- record completion
- issue certificate
- opt into Grid

## Events produced

EduEnrollmentCreated, EduSessionStarted, EduAssessmentSubmitted, EduAssessmentReviewed, EduCompletionRecorded, CertificateIssued, WorkforceEvidenceRecorded, EduGridOptInRecorded.

## Events consumed

Grid shortage signals, Identity/Profile changes, Organization/Institution configuration, external institutional reporting requirements.

## Zumi

May explain curriculum, coach within configured boundaries, critique AI outputs, prepare instructor summaries and recommend next learning/workforce steps. It may not self-award competency, completion or licensure.

Autonomy: L0-L2 for learning assistance, L3 for explicitly configured administrative actions, completion remains deterministic/human where required.

## Accessibility/privacy

- WCAG 2.2 AA target
- accommodation metadata minimized
- tenant/institution separation
- no PHI in ordinary analytics
- synthetic-data-first simulations
- safe exports

## Customer value

Institutions gain repeatable delivery, evidence and workforce reporting. Learners gain practical skill evidence and opportunity pathways. Employers gain better-qualified supply.

## Monetization

Institutional contracts, employer-sponsored programs, workforce/government programs, cohort pricing, simulation access, enterprise learning. Prefer institutional payer when institution/employer receives the economic benefit.

## Network effect

Grid shortage data can inform programs; EDU evidence can improve Grid supply; employment creates experience that strengthens identity and future opportunity.

## Tests

- tenant/institution isolation
- completion authority
- rubric/instructor review
- synthetic-data boundaries
- accessibility
- no completion==license inference
- Grid opt-in consent
- workforce-report export safety

## Definition of done

A real institution can create a cohort, deliver training, collect assessment evidence, complete human review, issue truthful completion evidence and optionally route an eligible/consenting learner into Grid without confusing education with licensure.