# Klinikos EDU Delivery Evidence Chain Design

## Purpose

Create one auditable institutional delivery pipeline that connects a scheduled live training session to verified attendance, learner work, assessment, instructor review, deterministic completion, participant feedback, certificate eligibility, and workforce reporting without granting AI authority over any legal, instructional, attendance, competency, or credential decision.

## Product Outcome

The evaluator and operator should be able to answer, for any participant:

1. What live session were they scheduled to attend?
2. Was attendance explicitly verified, by whom, when, and using what evidence source?
3. What required activities and assessments were completed?
4. What did the instructor review?
5. Why is the participant incomplete, awaiting review, or complete?
6. Was post-session feedback captured?
7. Is a certificate of completion eligible to issue?
8. Which curriculum/material version was used?
9. What evidence is safe to include in institutional reporting?

Enrollment, invitation acceptance, login activity, AI output, or content submission alone must never answer these questions.

## Architecture

The delivery pipeline remains inside the existing Klinikos EDU tenant, role, cohort, assignment, grading, competency, and certificate architecture.

The pipeline is modeled as an evidence projection rather than a second LMS state machine. Existing canonical records remain authoritative for enrollment, submissions, grades, competencies, and certificates. New workforce-delivery records supply session, attendance, feedback, and curriculum-version evidence. A deterministic service combines those sources into one `ParticipantDeliveryEvidence` projection.

The projection is read-only derived state. It does not automatically mutate grades, competencies, enrollment completion, or certificates.

## Evidence States

A participant progresses conceptually through:

`scheduled -> attendance_verified -> activities_evidenced -> assessments_reviewed -> instructor_decision -> feedback_captured -> certificate_eligible`

These are derived evidence milestones, not a parallel persisted workflow status.

### Completion decisions

`evaluateWorkforceCompletion()` remains the deterministic completion gate.

Completion requires:

- verified attendance that satisfies the configured program/session rule;
- required activity evidence;
- required assessment evidence;
- explicit instructor approval.

If the first three are satisfied but instructor approval is missing, the participant is `needs_instructor_review`, not complete.

AI output is excluded from the completion function signature.

## Zumi Intelligence Boundary

Zumi may:

- coach a learner on how to verify an AI-generated answer;
- present or analyze deliberately flawed synthetic outputs;
- identify likely unsupported claims for human review;
- summarize recurring error categories across a cohort using non-PHI evidence;
- draft instructor feedback for review;
- explain why deterministic completion evidence is missing;
- draft aggregate narrative summaries from already-authorized reporting data.

Zumi may not:

- create or verify attendance;
- create a grade;
- make a competency determination;
- mark an enrollment complete;
- authorize a certificate;
- claim licensure, accreditation, professional scope, or employer authority;
- override tenant, role, cohort, or data-access rules.

Every Zumi use that assists assessment/completion must be marked as human-review-required in the existing invocation/audit model.

## Instructor Delivery Command Center

Create an instructor-facing route that combines the existing session record with cohort participant evidence.

For each participant show:

- enrollment status;
- attendance state and verifier provenance;
- required activity evidence status;
- required assessment/review status;
- completion decision and blockers;
- feedback status;
- certificate eligibility/status.

The command center should link to existing grading, submission, competency, attendance, and certificate surfaces rather than duplicating their write logic.

## Participant Progress View

Participants should see a plain-language version of their own evidence state:

- session attended/not yet verified;
- required activities outstanding/completed;
- assessment under review/completed;
- instructor review pending/completed;
- feedback requested/submitted;
- certificate unavailable/eligible/issued.

They must not see hidden instructor notes or institution-only audit metadata.

## Certificate Eligibility

Certificate eligibility is a deterministic derived decision. It is not equivalent to certificate issuance.

Eligibility requires:

- participant is complete under the deterministic completion gate;
- any configured feedback requirement is satisfied;
- existing certificate policy requirements are satisfied.

Issuance continues through the existing instructor/admin-controlled certificate pathway.

Certificates must remain certificates of completion only and must not imply licensure, professional certification, accreditation, scope of practice, or employer endorsement.

## Reporting Projection

Institutional reports may aggregate only persisted evidence scoped to the active institution.

Reports may include:

- enrolled participants;
- sessions delivered;
- verified attendance;
- completions;
- completion percentage;
- assessment/submission counts;
- instructor-review status;
- feedback-response counts and safe aggregate ratings;
- curriculum/material versions;
- certificates issued;
- unresolved evidence blockers.

Demo/synthetic data must remain clearly distinguishable from real program performance.

## Security and Privacy

- All reads and writes require an EDU institution context.
- Non-admin instructors may only operate on cohorts they are assigned to.
- Participant views may only expose the participant's own evidence.
- Attendance verification remains instructor/admin-only.
- No PHI is required for the workflow.
- Audit records capture important instructor/admin mutations.
- Zumi consumes only minimum-necessary, approved evidence projections.
- Cross-tenant access must fail closed.

## UX and Visual Standard

Use the existing Klinikos EDU command interface and global typography. Do not introduce a separate Kentucky theme or generic AI-training dashboard.

The evidence chain should be understandable in plain English. Avoid procurement jargon in operator/student UI. Kentucky/SCWDB-specific wording belongs in proposal/customer configuration, not reusable product components.

## Testing Strategy

Unit tests must prove:

- enrollment/login/submission alone never count as attendance;
- only verified present/partial attendance satisfies attendance evidence;
- AI is absent from completion authority;
- instructor approval is mandatory;
- participant views cannot expose other participant evidence;
- non-teaching roles cannot verify attendance;
- instructors cannot operate outside assigned cohorts;
- certificate eligibility remains false while any required evidence is missing;
- feedback type authority cannot be spoofed by participant input.

Integration/API tests should cover institution scoping and write-authority boundaries.

Exact-head GitHub Actions may only be reported green when jobs execute real test/build steps. A run with `steps: null` is infrastructure unavailable, not pass or fail evidence.

## Non-Goals

This slice does not build a second LMS, a new authentication system, a new organization model, automatic certificate issuance, AI grading authority, clinical decision training, or buyer-specific Kentucky code.
