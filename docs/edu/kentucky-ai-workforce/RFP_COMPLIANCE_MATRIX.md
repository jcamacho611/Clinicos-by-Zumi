# SCWDB Kentucky AI Workforce Readiness Network — Compliance Matrix

Status: **capture and implementation working document**. It does not imply SCWDB approval, grant award, eligibility determination, or contract award.

## Procurement

| Requirement | RFP truth | Klinikos response |
| --- | --- | --- |
| Questions due | August 28, 2026, 4:00 PM Central | Track all questions through `contact@southcentralworkforce.com`; no restricted-contact outreach |
| Proposal due | September 18, 2026, 4:00 PM Central | One searchable PDF, organized in RFP order |
| Optional interviews/demos | September 21–October 2, 2026 | Maintain the live EDU evaluator journey from institutional program through curriculum governance |
| Anticipated award | October 2026 | Never imply award before written evidence |
| Launch | Within 30 calendar days after written notice to proceed | Configuration and curriculum-approval plan must fit 30 days |
| Contract term | Through June 30, 2029, subject to funding/performance/approval | Staffing, pricing, reporting, IP, and curriculum maintenance must support multi-year delivery |

## Service scope

| Requirement | Status in this branch | Evidence / action |
| --- | --- | --- |
| Service A: AI Industry Accelerator | **Implemented as reusable program configuration** | `src/lib/edu/workforce-ai-program.ts` and buyer-specific proposal configuration |
| Manufacturing pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | Product pathway screen + canonical typed curriculum; no claim of specialized manufacturing simulator |
| Construction pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | Product pathway screen + canonical typed curriculum; no claim of specialized construction simulator |
| Logistics pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | Product pathway screen + canonical typed curriculum; no claim of specialized logistics simulator |
| Healthcare pathway | **Strongest applied product pathway** | Existing synthetic Virtual Clinic Lab + healthcare workflow exercises + Zumi practice |
| Business Operations pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | Product pathway screen + canonical typed curriculum |
| Service B: Career Readiness | **Implemented as reusable curriculum configuration** | `src/lib/edu/ai-career-readiness.ts` |
| Live remote + in-person | **Product configuration supports both** | Delivery modes explicitly represented in program/session infrastructure |
| 6–8 hour Industry Accelerator | **Implemented as 420-minute instructional spine** | Every pathway carries a timed 7-hour plan |
| 2–3 hour Career Readiness | **Represented** | Workshop declares 2–3 hours |
| Hands-on occupation-relevant practice | **Implemented in pathway architecture** | Each pathway includes lesson scenario, participant tasks, evidence, applied lab, and authority boundary |
| Human review / fact checking / verification | **Implemented** | Common responsible-AI spine + Zumi authority boundary + rubric/instructor workflow |
| Privacy / cybersecurity / confidentiality / IP / employer policy | **Implemented in common curriculum spine** | `workforce-ai-literacy.ts` and product safety boundaries |
| Participant resource + certificate | **Defined and product-backed** | Representative materials + certificate system with non-licensure disclaimer |

## Delivery and operations

| Requirement | Current truth | Remaining delivery action |
| --- | --- | --- |
| Routine weekly/frequent schedule | Persisted workforce sessions support recurring delivery | Final calendar depends on award, demand, approved instructors, and SCWDB scheduling |
| Recommended/min/max class sizes | **Proposal operating standard documented** | `COHORT_SIZE_AND_DELIVERY_CAPACITY.md`: Industry Accelerator remote 8 minimum / 12–15 recommended / 18 one-instructor maximum; in-person 8 / 12–16 / 20. Career Readiness remote 8 / 15 / 20; in-person 8 / 15–18 / 20. Reconcile against September 4 addenda, named instructor bench, accessibility needs, and final contract terms before submission. |
| Evening/alternative scheduling | Operationally supportable as staffing/schedule policy | Identify instructor coverage before final proposal |
| Multi-region in-person capacity | Not proven by software | Staffing/travel plan must identify who can deploy and under what terms |
| Registration integration with SCWDB scheduling | Existing EDU cohort/enrollment architecture can receive approved participant records | Final transfer method/data dictionary requires SCWDB approval; do not claim live integration |
| Instructor absence / technology / weather contingency | Documented in implementation/contingency plan | Confirm named backup instructor and operational reschedule/remote fallback coverage before delivery |

## Participant evidence and reporting

| Requirement | Product status | Truth boundary |
| --- | --- | --- |
| Enrollment | Existing EDU enrollment model | Real institution/participant data only after authorized onboarding |
| Sessions | **Persisted workforce session substrate exists in production; branch repository/API/UI present** | Product branch still requires release verification before deployment claims |
| Attendance | **Persisted attendance evidence exists; instructor/admin verification authority is implemented** | Enrollment/login/invitation are not attendance; verification requires explicit evidence and scoped teaching authority |
| Applied activities | **Existing scenario assignment/submission/rubric/grade path** | Student work counts toward completion only when required work is actually assessed/released |
| Pre/post knowledge | **New scored evidence model, repository, instructor UI, paired-report logic implemented on branch** | Confidence surveys are separate and never converted into knowledge-gain claims. New persistence migration is verified on a temporary Neon branch but is not yet applied to production |
| Completion | **Completion Review command surface + deterministic evidence gate implemented** | Requires verified instructional time, required applied work, required comparable knowledge evidence where configured, and explicit instructor/admin approval |
| Certificates | **Existing issuance/revocation controls + completion-state gate** | Completion certificate cannot independently create completion and does not imply licensure/accreditation/professional certification |
| Participant survey / feedback | **Persisted feedback substrate + participant/instructor forms/API** | Do not present demo feedback as real participant outcomes; final approved survey fields/transfer rules remain subject to SCWDB |
| Monthly performance report | **Reports consume persisted enrollment/session/attendance/submission/certificate/feedback/curriculum evidence and branch knowledge evidence** | Do not display synthetic/demo metrics as real outcomes |
| Quarterly curriculum review | **Persisted curriculum-version substrate + controlled lifecycle UI/API implemented** | Draft → review → approved → active → retired → archived; approval/activation/retirement require education-admin authority; SCWDB approval still applies where contractually required |

## Production schema / migration reconciliation

Read-only verification on 2026-08-23 against the connected production Neon branch confirmed these workforce-delivery tables exist:
- `education_sessions`
- `education_attendance_records`
- `education_feedback_responses`
- `education_curriculum_versions`

Expected primary keys, foreign keys, checks, uniqueness constraints, and lookup indexes are present for that existing delivery substrate.

The new `education_knowledge_assessment_attempts` migration has been created in the repository and successfully tested on the temporary Neon branch `br-rough-brook-at4ld54m`. Column shape and database constraints were verified there. **It has not been applied to production yet.** Production application remains behind the explicit migration-approval gate required by the database workflow.

The earlier workforce-delivery schema was introduced before its repository migration artifact was committed, so the production Prisma migration ledger may be behind the existing schema. The correct reconciliation path is the normal reviewed deployment path; do not manually fabricate or insert Prisma migration records.

This means:
- existing session/attendance/feedback/curriculum-version production tables are present;
- the repository contains their forward migration artifact;
- scored pre/post knowledge persistence is implemented in code and verified on a temporary database branch only;
- no claim should be made that the latest application branch is deployed or release-verified until those gates are actually satisfied.

## Accessibility

The product direction includes keyboard operation, semantic headings/tables, visible focus, zoom/reflow, reduced-motion support, mobile layouts, non-color-only status, and accessible alternate response modes when the interaction method is not itself the learning objective.

**Do not claim formal WCAG 2.2 AA conformance or independent certification unless separately audited and proven.**

## Privacy, data protection, and AI governance

- Ordinary EDU exercises use synthetic or approved non-sensitive training data.
- Real patient PHI is not required for the normal healthcare training experience.
- Participants must not enter PII, PHI, employer secrets, credentials, confidential documents, or restricted data into public/unapproved AI systems.
- Approved participant registration, attendance, surveys, reporting, retention, and transfer methods remain subject to SCWDB requirements.
- Zumi has EDU-specific governed capabilities and a server-enforced education surface; it cannot award attendance, grades, completion, competence, licensure, or professional authority.
- Instructors and authorized humans remain final authority for assessed work and completion.

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
- [x] qualification/reference evidence register
- [x] evidence-based internal pricing recommendation

## Qualification / founder evidence gates

The RFP requires at least three years of relevant organizational experience and at least three relevant references from comparable work within the last five years. These must be satisfied using verifiable evidence. Product code cannot resolve them.

Klinikos' proposal posture should nevertheless remain confident and evidence-led. The response should foreground founder-led technical execution, applied AI/software/security work, direct healthcare-operations exposure, practitioner/medical-professional input, functioning product proof, and verified key-personnel experience rather than apologizing for company age or startup status.

Before submission collect and verify:

- legal respondent identity and authority to bind;
- actual relevant organizational/key-personnel history and dates;
- three real references with contacts, dates, services/population, and approximate contract value where supportable;
- instructor bios/resumes and availability;
- named healthcare/professional contributors only with verified title/scope/permission;
- financial/administrative capacity evidence;
- debarment/exclusion status and required federal registrations/certifications;
- insurance required by final negotiated contract;
- litigation/audit/termination disclosures as applicable.

See `QUALIFICATION_EVIDENCE_PACKAGE.md`. Do not fabricate history, references, contracts, customers, outcomes, awards, partnerships, or grant experience.

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

The ~980 participants are a planning target only, not guaranteed revenue. Final proposed rates must be stress-tested against low utilization, uneven pathway demand, travel, cancellation, working capital, and payment timing.

Current internal working recommendation is documented in `PRICING_RECOMMENDATION_2026-08-23.md`. It intentionally prices the 6–8 hour Accelerator above the earlier $200-per-participant idea because live instruction, applied labs, platform access, assessment, human review, completion evidence, reporting, accessibility, and curriculum maintenance create substantially more value and cost than a short workshop.

## Final proposal gate

Before final submission a skeptical evaluator must be able to answer yes to all:

1. Does the proposal cover both services and all five pathways?
2. Is live remote and in-person delivery credible?
3. Are hands-on activities, instructor review, verification, privacy, and human accountability obvious?
4. Is completion measurable and auditable rather than attendance-only?
5. Are scored knowledge change and confidence/satisfaction clearly separated?
6. Are accessibility, security, reporting, and continuous improvement addressed?
7. Are all five pathway sample segments and representative materials attached?
8. Does pricing follow Appendix B and disclose assumptions?
9. Is the three-year requirement supported by real evidence or a lawful documented procurement structure?
10. Are three real references included?
11. Is pre-existing Klinikos IP protected and separated from Kentucky-specific deliverables?
12. Can the approved service launch within 30 days of notice to proceed?
13. Are all claims about product maturity, customers, integrations, outcomes, and approvals truthful?
14. Has curriculum/version governance been demonstrated?
15. Has the new scored-knowledge migration been safely approved/applied before any production-dependent demo that needs it?
16. Has the production-schema/Prisma-ledger mismatch been reconciled through the normal migration deployment path rather than manual ledger tampering?
17. Has the exact submission branch completed executable typecheck, tests, lint, security checks, Prisma validation, build, and browser/accessibility QA?
