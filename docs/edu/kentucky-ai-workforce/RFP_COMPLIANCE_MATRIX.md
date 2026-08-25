# SCWDB Kentucky AI Workforce Readiness Network — Compliance Matrix

Status: **ACTIVE capture and implementation working document.** It does not imply SCWDB approval, grant award, eligibility determination, or contract award.

Last reconciled: 2026-08-25

## Procurement

| Requirement | RFP / buyer truth | Klinikos response |
| --- | --- | --- |
| Questions due | August 28, 2026, 4:00 PM Central | Use `contact@southcentralworkforce.com`; no restricted-contact outreach |
| Buyer clarification received | SCWDB Aug. 24 Q&A, Questions 19-24 | Captured in `SCWDB_QA_CAPTURE_2026-08-24_Q19_Q24.md`; Q19-Q21 resolve qualification structure; Q24 supports blended live instruction + AI practice |
| Proposal due | September 18, 2026, 4:00 PM Central | One searchable PDF, organized in RFP order |
| Official addenda/Q&A checkpoint | September 4, 2026 | Must reconcile all proposal facts/assumptions before signature |
| Optional interviews/demos | September 21-October 2, 2026 | Maintain a controlled EDU evaluator journey; demo is not initial-submission requirement |
| Anticipated award | October 2026 | Never imply award before written evidence |
| Launch | Within 30 calendar days after written notice to proceed | Configuration/curriculum-approval/staffing plan must fit 30 days |
| Contract term | Through June 30, 2029, subject to funding/performance/approval | Staffing, pricing, reporting, IP, curriculum maintenance, and working capital must support multi-year delivery |
| Funding/volume | Funding contingent; ~980 unique participants is planning only | Never treat 980 as guaranteed referrals, completions, classes, revenue, or payment |

## Service scope

| Requirement | Current product/capture truth | Evidence / action |
| --- | --- | --- |
| Service A: AI Industry Accelerator | **Implemented as reusable program configuration** | `src/lib/edu/workforce-ai-program.ts` and buyer-specific proposal configuration |
| Manufacturing pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | No claim of specialized manufacturing simulator |
| Construction pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | No claim of specialized construction simulator |
| Logistics pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | No claim of specialized logistics simulator |
| Healthcare pathway | **Strongest applied product pathway** | Synthetic Virtual Clinic Lab + healthcare workflow exercises + Zumi practice; keep clinical authority human |
| Business Operations pathway | **7-hour live curriculum + representative lesson + applied exercise implemented** | Product pathway screen + typed curriculum |
| Service B: Career Readiness | **Implemented as reusable curriculum configuration** | `src/lib/edu/ai-career-readiness.ts` |
| Live remote + in-person | Product configuration supports both | Staffing/travel evidence must prove delivery capacity |
| 6-8 hour Industry Accelerator | Implemented as 420-minute instructional spine | Every pathway carries a timed 7-hour plan |
| 2-3 hour Career Readiness | Represented | Final schedule subject to approved curriculum |
| Hands-on occupation-relevant practice | Implemented in pathway architecture | Lesson scenario, participant tasks, evidence, applied lab, authority boundary |
| Human review / fact checking / verification | Implemented | Responsible-AI spine + instructor/rubric workflow |
| Privacy / cybersecurity / confidentiality / IP / employer policy | Implemented in common curriculum spine | `workforce-ai-literacy.ts` + product safety boundaries |
| Participant resource + certificate | Defined and product-backed | Certificate carries non-licensure/non-professional-credential boundary |
| Blended AI practice | **Explicitly permitted by SCWDB Q24 as supplemental to live instruction** | Zumi/digital practice may support before/between/after sessions but must not replace required live instruction absent approval |

## Delivery and operations

| Requirement | Current truth | Remaining delivery action |
| --- | --- | --- |
| Routine weekly/frequent schedule | Persisted workforce sessions support recurring delivery | Final calendar depends on award, demand, permissioned instructors, and SCWDB scheduling |
| Recommended/min/max class sizes | Proposal operating standard documented | `COHORT_SIZE_AND_DELIVERY_CAPACITY.md`; reconcile with Sep. 4 addenda, actual instructor bench, accessibility needs, and contract terms |
| Live remote default | Buyer Q23 says live remote anticipated as most common/routine | Preserve remote-first economics and operations |
| Strategic in-person delivery | Buyer Q23 expects use for significant Rapid Response / concentrated groups | Prove named instructor travel/availability and separately controlled travel pricing |
| Evening/alternative scheduling | Operationally supportable as policy | Identify actual instructor coverage before final proposal |
| Multi-region in-person capacity | Not proven by software | Staffing/travel plan must identify who can deploy and on what terms |
| Registration integration | EDU cohort/enrollment architecture can receive approved participant records | Final transfer method/data dictionary requires SCWDB approval; do not claim live integration |
| Instructor absence / technology / weather | Contingency plan exists | Confirm named backup instructor and reschedule/remote fallback coverage |
| Participants buying software/equipment | Q24 says participants may not be required to independently purchase unless approved/funded | Include required platform access in pricing or identify buyer-funded requirement explicitly |

## Participant evidence and reporting

| Requirement | Product status | Truth boundary |
| --- | --- | --- |
| Enrollment | Existing EDU enrollment model | Real institution/participant data only after authorized onboarding |
| Sessions | Persisted workforce-session substrate exists | Latest application/runtime still requires release proof before deployment claims |
| Attendance | Persisted attendance evidence + instructor/admin verification authority | Enrollment/login/invitation are not attendance |
| Applied activities | Existing assignment/submission/rubric/grade path | Student work counts only when required work is actually assessed/released |
| Pre/post knowledge | Scored evidence model/repository/UI/paired-report logic implemented in repository work | Confidence survey is separate; production persistence/release truth remains gated |
| Completion | Deterministic completion-review gate implemented | Requires verified instructional time, required work/evidence, and explicit human approval |
| Certificates | Issuance/revocation controls + completion-state gate | Certificate cannot create completion or imply licensure/accreditation/professional certification |
| Participant feedback | Persisted feedback substrate + forms/API | Do not present demo feedback as outcomes |
| Monthly performance report | Consumes persisted participant/delivery evidence | Synthetic/demo metrics are never real performance |
| Quarterly curriculum review | Persisted curriculum-version lifecycle | Draft -> review -> approved -> active -> retired -> archived; SCWDB authority preserved where required |

## Production schema / release reconciliation

Read-only verification on 2026-08-23 confirmed existing production tables for:

- `education_sessions`
- `education_attendance_records`
- `education_feedback_responses`
- `education_curriculum_versions`

A repository migration for scored pre/post knowledge assessment persistence was tested on a temporary Neon branch but should not be described as production-applied without authoritative migration/runtime evidence.

The earlier workforce-delivery schema and repository migration ledger require normal reviewed reconciliation. Do not manually fabricate Prisma migration records.

Current company release truth also remains separate from proposal/product-code truth. The public production site has recently been under active recovery, so evaluators should receive a controlled truthful demo/supporting evidence if public runtime health is not verified immediately before submission.

## Accessibility

Product direction includes keyboard operation, semantic headings/tables, visible focus, zoom/reflow, reduced-motion support, mobile layouts, non-color-only status, and alternate accessible response modes when the interaction method is not itself the learning objective.

**Do not claim formal WCAG 2.2 AA conformance or independent certification unless audited and proven.**

## Privacy, data protection, and AI governance

- ordinary EDU exercises use synthetic or approved non-sensitive data;
- real patient PHI is not required for normal healthcare training;
- participants must not enter PII, PHI, employer secrets, credentials, confidential documents, or restricted data into public/unapproved AI systems;
- participant registration, attendance, surveys, reporting, retention, and transfer remain subject to SCWDB requirements;
- Zumi is a governed AI practice/intelligence layer, not an instructor or authority source;
- instructors/authorized humans retain final authority for assessment and completion;
- Q24 requires the proposal to explain technology purpose, accessibility, licensing/subscription requirements, privacy/security, participant-access duration, and associated costs.

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
- [x] Aug. 22 Q&A capture
- [x] Aug. 24 Q19-Q24 buyer clarification capture
- [x] per-completion pricing stress model
- [x] qualification/personnel evidence register
- [x] evidence-based internal pricing recommendation

## Qualification / experience / reference gates

The RFP requires at least three years of relevant experience and three comparable-work references within the required period.

### Buyer interpretation — resolved

SCWDB Q19-Q21 now establishes that:

- clearly documented relevant key-personnel, affiliate, or predecessor experience may be considered toward the three-year requirement;
- Appendix C may include relevant comparable engagements performed by key personnel, affiliates, or predecessors when properly attributed;
- a substantive experienced subcontractor/team member may contribute qualifying experience;
- the experienced organization is not automatically required to become prime solely because it provides qualifying technical/instructional experience;
- Klinikos must still prove current organizational, administrative, financial, management, and contract-management capacity.

See:

- `PRIME_QUALIFICATION_DECISION_GATE.md`
- `QUALIFICATION_AND_PERSONNEL_EVIDENCE_REGISTER_2026-08-25.md`
- `SCWDB_QA_CAPTURE_2026-08-24_Q19_Q24.md`

### Current personnel/reference truth

Permission requests were sent to Peter Kravsky, Peggy Sniezek, Nadja Louis-Jacques, and Frederique Louis-Jacques. Latest Outlook harvest on 2026-08-25 found **no affirmative reply from any of the four**.

Therefore none is a committed instructor/subcontractor/advisor or permissioned Appendix C reference merely because outreach was sent.

Before submission still collect/verify:

- legal respondent identity and authority to bind;
- dated source records proving at least three years of qualifying experience through the structure actually relied upon;
- three real comparable-work references, properly attributed and permissioned;
- instructor bios/resumes, role, permission, remote availability, and in-person Kentucky availability where represented;
- named healthcare/professional contributors only with verified title/scope/permission;
- any real subcontractor/teaming scope, pricing, responsibilities, and approval path;
- financial/administrative capacity evidence;
- debarment/exclusion status and required federal registrations/certifications;
- insurance required by final negotiated contract;
- litigation/audit/termination disclosures as applicable.

Do not fabricate history, references, contracts, customers, outcomes, awards, partnerships, personnel, or grant experience.

## Pricing responsiveness

Appendix B requires:

- one-time implementation/curriculum-customization fixed amount;
- per-completed-participant Career Readiness price;
- per-completed-participant price for each of five Industry Accelerator pathways;
- in-person session/day pricing;
- travel basis/limits;
- digital badge/credential price;
- optional service pricing;
- volume tiers for 1-99, 100-249, 250-499, and 500+ completions.

Buyer Q22/Q23 reinforces that no final contract ceiling or guaranteed annual/cohort volume exists and that the ~980 figure is planning only.

Current internal working recommendation remains in `PRICING_RECOMMENDATION_2026-08-23.md`. Final rates must survive low utilization, uneven pathway demand, cancellations, travel, instructor/subcontractor cost, working-capital delay, and payment timing.

## Final proposal gate

Before final submission, a skeptical evaluator must be able to answer **yes** to all:

1. Does the proposal cover both services and all five pathways?
2. Is live remote and in-person delivery credible from actual staffing evidence?
3. Are hands-on activities, instructor review, verification, privacy, and human accountability obvious?
4. Is completion measurable and auditable rather than attendance-only?
5. Are scored knowledge change and confidence/satisfaction clearly separated?
6. Are accessibility, security, reporting, and continuous improvement addressed?
7. Are all five pathway sample segments and representative materials attached?
8. Does pricing follow Appendix B and disclose assumptions?
9. Is at least three years of relevant experience proven through buyer-permitted, properly attributed evidence?
10. Are three real comparable-work references within the required period verified and permissioned?
11. Are named instructors/SMEs actually permissioned and available?
12. Is present prime administrative/financial/contract-management capacity proven?
13. Is pre-existing Klinikos IP separated from Kentucky-specific deliverables?
14. Can approved service launch within 30 days of notice to proceed?
15. Are all claims about product maturity, customers, integrations, outcomes, and approvals truthful?
16. Has curriculum/version governance been demonstrated?
17. Has the submission/demo path been reconciled against current production/migration/runtime truth?
18. Has the exact submission branch completed whatever executable verification is available, with the account-level GitHub Actions blocker disclosed rather than mislabeled green?
19. Have all September 4 addenda and subsequent written buyer clarifications been reconciled?
