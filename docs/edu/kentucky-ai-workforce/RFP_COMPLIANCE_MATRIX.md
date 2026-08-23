# SCWDB Kentucky AI Workforce Readiness Network — Compliance Matrix

Status: **capture and implementation working document**. It does not imply SCWDB approval, grant award, eligibility determination, or contract award.

## Procurement

| Requirement | RFP truth | Klinikos response |
| --- | --- | --- |
| Questions due | August 28, 2026, 4:00 PM Central | Track all questions through `contact@southcentralworkforce.com`; no restricted-contact outreach |
| Proposal due | September 18, 2026, 4:00 PM Central | One searchable PDF, organized in RFP order |
| Optional interviews/demos | September 21–October 2, 2026 | Maintain the 12-step live EDU evaluator demo |
| Anticipated award | October 2026 | Never imply award before written evidence |
| Launch | Within 30 calendar days after written notice to proceed | Configuration and curriculum-approval plan must fit 30 days |
| Contract term | Through June 30, 2029, subject to funding/performance/approval | Staffing, pricing, reporting, IP, and curriculum maintenance must support multi-year delivery |

## Service scope

| Requirement | Status in this branch | Evidence / action |
| --- | --- | --- |
| Service A: AI Industry Accelerator | **Implemented as reusable program configuration** | `src/lib/edu/kentucky-ai-workforce.ts` |
| Manufacturing pathway | **Proposal/delivery content configured** | Typed objectives + applied exercise; no claim of specialized manufacturing simulator |
| Construction pathway | **Proposal/delivery content configured** | Typed objectives + applied exercise; no claim of specialized construction simulator |
| Logistics pathway | **Proposal/delivery content configured** | Typed objectives + applied exercise; no claim of specialized logistics simulator |
| Healthcare pathway | **Strongest existing product foundation** | Existing synthetic Virtual Clinic Lab + typed Kentucky pathway |
| Business Operations pathway | **Proposal/delivery content configured** | Typed objectives + applied exercise |
| Service B: Career Readiness | **Implemented as reusable curriculum configuration** | `src/lib/edu/ai-career-readiness.ts` |
| Live remote + in-person | **Product configuration supports both** | Delivery modes explicitly represented |
| 6–8 hour Industry Accelerator | **Represented** | Each pathway declares 6–8 hours |
| 2–3 hour Career Readiness | **Represented** | Workshop declares 2–3 hours |
| Hands-on occupation-relevant practice | **Represented** | Each pathway includes scenario, participant tasks, evidence, and authority boundary |
| Human review / fact checking / verification | **Implemented in common curriculum spine** | `workforce-ai-literacy.ts` |
| Privacy / cybersecurity / confidentiality / IP / employer policy | **Implemented in common curriculum spine** | `workforce-ai-literacy.ts` |
| Participant resource + certificate | **Defined** | Program required elements + representative materials |

## Delivery and operations

| Requirement | Current truth | Remaining delivery action |
| --- | --- | --- |
| Routine weekly/frequent schedule | Program architecture and persisted workforce session substrate support recurring delivery | Final calendar depends on award, demand, approved instructors, and SCWDB scheduling |
| Recommended/min/max class sizes | **Proposal input still required** | Final values must reflect instructor bench, modality, pathway, and hands-on facilitation capacity |
| Evening/alternative scheduling | Operationally supportable as staffing/schedule policy | Identify instructor coverage before final proposal |
| Multi-region in-person capacity | Not proven by software | Staffing/travel plan must identify who can deploy and under what terms |
| Registration integration with SCWDB scheduling | Existing EDU cohort/enrollment architecture can receive approved participant records | Final transfer method/data dictionary requires SCWDB approval; do not claim live integration |
| Instructor absence / technology / weather contingency | Documented in implementation/contingency plan | Confirm named backup instructor and operational reschedule/remote fallback coverage before delivery |

## Participant evidence and reporting

| Requirement | Product status | Truth boundary |
| --- | --- | --- |
| Enrollment | Existing EDU enrollment model | Real institution/participant data only after authorized onboarding |
| Sessions | **Persisted workforce session substrate exists in production; branch repository/API/UI present** | Production table existence is verified, but the repository migration ledger is not yet reconciled to `20260823043800_edu_workforce_delivery_evidence`; do not call the branch deployed/CI-green |
| Attendance | **Persisted attendance evidence exists; instructor/admin verification authority is implemented** | Enrollment/login/invitation are not attendance; verification requires explicit evidence and scoped teaching authority |
| Completion | Existing completion/certificate concepts + deterministic completion rules | Attendance alone is insufficient; required activities/assessments and human instructor approval remain separate |
| Assessments | Existing scenarios/rubrics/submissions/grades + common assessment method | AI cannot independently certify competence |
| Participant survey / feedback | **Persisted feedback-response substrate and branch form/API exist** | Do not present synthetic/demo feedback as real participant outcomes; final approved survey fields/transfer rules remain subject to SCWDB |
| Monthly performance report | Deterministic reporting projection exists for supplied approved records | Do not display synthetic/demo metrics as real outcomes |
| Quarterly curriculum review | **Persisted curriculum-version substrate exists in production** | Material changes still require the governed review/approval process and SCWDB approval where contractually required |

## Production schema / migration reconciliation

Read-only verification on 2026-08-23 against the connected production Neon branch confirmed these tables exist:
- `education_sessions`
- `education_attendance_records`
- `education_feedback_responses`
- `education_curriculum_versions`

Expected primary keys, foreign keys, checks, uniqueness constraints, and lookup indexes are present and validated.

However, `_prisma_migrations` currently has **no entry** for `20260823043800_edu_workforce_delivery_evidence`. The repository migration is intentionally idempotent because the schema was introduced before the migration artifact was committed. The correct reconciliation path is the normal reviewed migration deployment after this branch is mergeable; do not manually fabricate or insert a Prisma migration record.

This means:
- the production schema exists;
- the repository has the forward migration artifact;
- the migration ledger is currently behind the schema;
- this branch must be preserved and prioritized for safe reconciliation;
- table existence is not evidence that the exact application branch is deployed or release-verified.

## Accessibility

The product direction includes keyboard operation, semantic headings/tables, visible focus, zoom/reflow, reduced-motion support, mobile layouts, non-color-only status, and accessible alternate response modes when the interaction method is not itself the learning objective.

**Do not claim formal WCAG 2.2 AA conformance or independent certification unless separately audited and proven.**

## Privacy, data protection, and AI governance

- Ordinary EDU exercises use synthetic or approved non-sensitive training data.
- Real patient PHI is not required for the normal healthcare training experience.
- Participants must not enter PII, PHI, employer secrets, credentials, confidential documents, or restricted data into public/unapproved AI systems.
- Approved participant registration, attendance, surveys, reporting, retention, and transfer methods remain subject to SCWDB requirements.
- Instructors and authorized humans remain final authority for grades and completion.

## Representative materials required with proposal

- [x] sample slide outline
- [x] participant activity
- [x] assessment items
- [x] rubric
- [x] certificate/badge wording
- [x] instructor guide
- [x] accessibility statement
- [x] data/security statement
- [x] human-AI authority statement
- [x] all five pathway outlines/sample segments
- [x] measurement/reporting plan
- [x] pre-existing IP schedule
- [x] current Q&A capture delta
- [x] per-completion pricing stress model

## Qualification / founder evidence gates

The RFP requires at least three years of relevant organizational experience and at least three relevant references from comparable work within the last five years. These must be satisfied using verifiable evidence. Product code cannot resolve them.

Before submission collect and verify:

- legal respondent identity and authority to bind;
- actual relevant organizational/key-personnel history and dates;
- three real references with contacts, dates, services/population, and approximate contract value where supportable;
- instructor bios/resumes and availability;
- financial/administrative capacity evidence;
- debarment/exclusion status and required federal registrations/certifications;
- insurance required by final negotiated contract;
- litigation/audit/termination disclosures as applicable.

Do not fabricate history, references, contracts, customers, outcomes, awards, partnerships, or grant experience.

## Pricing responsiveness

Appendix B requires:

- one-time implementation/curriculum customization fixed amount;
- per-completed-participant Career Readiness price;
- per-completed-participant price for each of five Industry Accelerator pathways;
- in-person session/day pricing;
- travel basis/limits;
- digital badge/credential price;
- optional service pricing;
- volume tiers for 1–99, 100–249, 250–499, and 500+ completions.

The ~980 participants are a planning target only, not guaranteed revenue. Final proposed rates must be stress-tested against low utilization, uneven pathway demand, travel, cancellation, working capital, and payment timing. See `PRICING_MODEL.md`.

## Final proposal gate

Before final submission a skeptical evaluator must be able to answer yes to all:

1. Does the proposal cover both services and all five pathways?
2. Is live remote and in-person delivery credible?
3. Are hands-on activities, instructor review, verification, privacy, and human accountability obvious?
4. Is completion measurable and auditable rather than attendance-only?
5. Are accessibility, security, reporting, and continuous improvement addressed?
6. Are all five pathway sample segments and representative materials attached?
7. Does pricing follow Appendix B and disclose assumptions?
8. Is the three-year requirement supported by real evidence?
9. Are three real references included?
10. Is pre-existing Klinikos IP protected and separated from Kentucky-specific deliverables?
11. Can the approved service launch within 30 days of notice to proceed?
12. Are all claims about product maturity, customers, integrations, outcomes, and approvals truthful?
13. Has the production-schema/Prisma-ledger mismatch been reconciled through the normal migration deployment path rather than manual ledger tampering?
