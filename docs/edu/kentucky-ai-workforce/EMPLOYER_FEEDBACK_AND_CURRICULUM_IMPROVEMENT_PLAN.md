# SCWDB Kentucky AI Workforce Readiness — Employer Feedback & Curriculum Improvement Plan

Status: **proposal/capture design only.** Final employer-feedback fields, collection channels, cadence, retention, reporting, and approval workflow remain subject to SCWDB approval and contract requirements.

## Why this exists

The currently posted SCWDB Q&A says contractor performance will emphasize continuous curriculum improvement based on **participant and employer feedback**, alongside participant satisfaction/skill gain, instruction quality, instructor effectiveness, accessibility, reporting, and data/privacy/documentation compliance.

Klinikos should therefore show a credible employer-feedback loop without pretending that:

- an employer is a current Klinikos customer;
- employer feedback already exists for this program;
- employer feedback proves participant employment outcomes;
- employers may access participant-level records;
- curriculum changes can bypass instructor, education-admin, or SCWDB review.

## Operating principle

Employer feedback is an **input to curriculum relevance**, not an authority over participant grades, completion, competence, hiring, or employment outcomes.

`approved employer signal → review → proposed change → human approval → versioned curriculum/material → next delivery → measure again`

No AI system may independently convert employer comments into an approved curriculum change.

## Proposed feedback sources

Subject to SCWDB approval, feedback may come from:

1. participating Local Workforce Development Area employer-engagement staff;
2. employers connected to Rapid Response events, layoffs, hiring initiatives, or sector partnerships;
3. SCWDB-designated industry advisors or employer representatives;
4. structured post-session or periodic employer interviews/surveys where an employer has reviewed curriculum relevance or observed workforce needs;
5. aggregated labor-market or employer-demand information supplied or approved by SCWDB.

Klinikos should not cold-collect employer data or represent unsolicited market anecdotes as contract evidence.

## Minimum-necessary feedback fields

Where approved, collect only what is needed to improve training relevance, for example:

- employer/organization identifier;
- industry/pathway;
- respondent role or relationship to workforce/training needs;
- date and collection channel;
- relevance rating for current skills/topics;
- priority tasks or workflow areas where AI literacy is becoming important;
- observed common workforce gaps;
- employer-policy/safety/privacy constraints learners should understand;
- recommended additions/removals/clarifications;
- urgency and rationale;
- whether the feedback is attributable or should remain de-identified/aggregated;
- reviewer disposition and resulting curriculum decision.

Do not collect participant PHI, sensitive employee data, hiring decisions, protected-class data, personnel files, or confidential business information unless SCWDB explicitly authorizes a lawful need and handling method.

## No participant-level leakage

Employer feedback must remain separated from participant assessment authority.

Employers do **not** receive ordinary access to:

- participant submissions;
- grades or rubric details;
- attendance evidence;
- completion evidence;
- private participant feedback;
- accommodations information;
- account data;
- job-search materials;
- any healthcare simulation record tied to a learner.

Any participant-specific disclosure would require a separately authorized purpose, minimum-necessary scope, and applicable consent/data-sharing controls. The normal curriculum-improvement workflow should use aggregated or de-identified signals.

## Review cadence

### After material employer signal

An instructor/program lead records the signal, source, pathway, and proposed curriculum implication. No immediate curriculum change is required merely because feedback exists.

### Monthly internal review

Review:

- recurring employer themes;
- participant confusion/error patterns;
- instructor notes;
- assessment trends;
- accessibility/delivery issues;
- emerging AI-tool changes;
- employer-policy or safety concerns.

### Quarterly curriculum review

For each pathway, document:

- feedback reviewed;
- evidence supporting the proposed change;
- whether the change affects objectives, duration, tools, assessments, safety boundaries, or completion standards;
- approver;
- required SCWDB review/approval status;
- curriculum/material version affected;
- effective cohort/session date;
- whether instructor recalibration is required.

Material changes must not silently overwrite the version against which earlier participants were trained or assessed.

## Proposed curriculum-change states

`SIGNAL_RECEIVED → REVIEWED → CHANGE_PROPOSED → APPROVAL_REQUIRED → APPROVED → VERSIONED → RELEASED`

Possible terminal paths:

- `NO_CHANGE` — signal reviewed but insufficient to justify change;
- `DEFERRED` — valid issue but awaiting more evidence or SCWDB decision;
- `REJECTED` — conflicts with safety, legal, accessibility, instructional, or contract requirements;
- `SUPERSEDED` — later evidence replaced the proposal.

The exact product workflow/state names may differ; the proposal should describe the governance outcome, not claim a specific production workflow unless verified.

## How this should appear in SCWDB reporting

Subject to approval, quarterly curriculum-improvement reporting can include:

- number of employer feedback inputs reviewed;
- pathway distribution;
- recurring relevance themes;
- curriculum changes proposed;
- changes approved/released;
- changes deferred/rejected and rationale category;
- curriculum versions affected;
- instructor recalibration completed where needed;
- upcoming employer-validation questions.

Do not publish employer identities or comments beyond the approved reporting scope.

## Relationship to employment outcomes

SCWDB identifies employment or paid work-based learning within six months as a broader Network goal. Employer feedback can help keep curriculum relevant, but Klinikos should not claim that employer feedback, course completion, or a curriculum change caused an employment outcome unless a separately approved evaluation design supports that conclusion.

The contractor controls training quality, delivery, evidence, and improvement. Hiring outcomes depend on participants, employers, Local Workforce Development Areas, Career Advisors, economic conditions, and other partners.

## Current product truth

### Supportable now / in the current EDU architecture

- institution/program/cohort scoping;
- human instructor/admin authority;
- curriculum version concepts and controlled release lifecycle;
- session/attendance/assessment/completion evidence on the Kentucky EDU branch subject to release verification;
- participant/instructor feedback substrate on the branch;
- deterministic reporting helpers;
- synthetic role-based healthcare training.

### Proposed configuration, not current live capability

- SCWDB-specific employer-feedback form;
- employer portal or employer login;
- automated employer outreach;
- employer-to-curriculum API integration;
- real-time employer analytics dashboard;
- direct employer access to participant records;
- automated AI approval of curriculum changes.

These must not be represented as live unless separately implemented and verified.

## Proposal win theme

Klinikos EDU should present continuous improvement as a governed evidence loop:

> We do not freeze a curriculum for three years, and we do not let an AI model rewrite training unsupervised. Participant evidence, instructor observations, employer relevance signals, accessibility findings, and technology changes are reviewed by authorized humans, translated into versioned curriculum changes, and released only through an approved process.

That framing directly supports SCWDB's stated emphasis on employer feedback, continuous improvement, quality, documentation, and responsible AI.