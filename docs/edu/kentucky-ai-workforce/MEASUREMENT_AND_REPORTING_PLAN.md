# SCWDB Kentucky AI Workforce Readiness Network — Measurement and Reporting Plan

Status: **proposed capture/delivery design. Final measures, data fields, cadence, retention, and transfer format remain subject to SCWDB approval and contract requirements.**

## Measurement philosophy

Klinikos EDU should measure whether a participant can use AI more responsibly and effectively in realistic work, not merely whether a participant watched a presentation.

Core rules:

1. Attendance is necessary evidence but not sufficient evidence of learning.
2. Completion requires the configured activity/assessment requirements plus instructor review.
3. AI may assist feedback but does not independently certify competence or completion.
4. Synthetic or approved non-sensitive training data is the normal exercise mode.
5. Participant data collection is minimum necessary for authorized delivery, invoicing, reporting, support, and audit.
6. Demo/synthetic data is never reported as real participant performance.

## Learning domains

| Domain | Observable behavior | Example evidence |
| --- | --- | --- |
| AI limitations | Recognizes uncertainty, stale/missing information, unsupported claims, and unsuitable tasks | Knowledge check + scenario rationale |
| Safe prompting | Gives useful context without unnecessary restricted information | Prompt-revision activity |
| Verification | Checks consequential output against an independent authoritative source | Verification log |
| Privacy/security | Identifies data that should not enter an unapproved AI system | Privacy decision item |
| Error detection | Finds fabricated, unsupported, biased, or irrelevant content | Annotated flawed output |
| Human authority | Correctly identifies when and to whom work must be escalated | Authority decision |
| Documentation | Records the corrected action and evidence truthfully | Final work product |
| Occupational transfer | Applies the responsible-AI method in the relevant industry context | Pathway scenario |
| Career readiness | Produces truthful AI-assisted job-search/resume/interview work | Before/after artifact |

## Proposed pre/post structure

Measure the same constructs before and after training without relying solely on identical memorized items:

- what AI can and cannot reliably do;
- safe prompting and minimum disclosure;
- privacy/security/employer-policy awareness;
- fact-checking and source verification;
- identification of unsupported AI output;
- human accountability/escalation.

Recommended aggregate measures:

- average pre-assessment score;
- average post-assessment score;
- average paired score change where both scores exist;
- percentage completing required practical exercise;
- percentage demonstrating verification behavior;
- percentage correctly identifying human-escalation boundary;
- participant confidence/self-efficacy change, clearly separated from demonstrated skill;
- participant satisfaction;
- instructor effectiveness feedback.

Do not promise a numerical improvement target without baseline evidence and an agreed SCWDB target.

## Delivery records

For each authorized workshop/session, maintain only approved fields needed to evidence delivery, such as:

- program/service/pathway;
- cohort/session identifier;
- delivery mode;
- date/time;
- instructor;
- planned capacity;
- participant enrollment identifiers;
- verified attendance record;
- completion status;
- assessment/practical evidence status;
- certificate/completion record data;
- no-show/cancellation/reschedule state;
- material/curriculum version;
- accessibility/support issue state where appropriate and minimum necessary.

**Current product caution:** do not infer attendance from account login, invitation acceptance, enrollment status, or completed profile data. A dedicated approved attendance evidence mechanism must exist before production delivery.

## Monthly performance report

Subject to SCWDB approval, provide:

- authorized sessions scheduled and delivered;
- enrollments/starts;
- verified attendance;
- completions;
- completion percentage;
- pathway distribution;
- live remote vs in-person delivery;
- assessment completion;
- aggregate pre/post results where available;
- participant survey summary;
- instructor effectiveness feedback;
- accessibility or delivery issues and corrective actions;
- curriculum/material versions used;
- upcoming schedule;
- risks/blockers requiring SCWDB decision.

## Participant-level evidence for invoicing/audit

Where contractually required and legally permitted, maintain:

- approved participant identifier;
- service/pathway;
- session/workshop date;
- attendance evidence;
- required activity/assessment completion;
- instructor review status;
- verified completion date/version;
- certificate/completion record identifier;
- invoicing linkage required by SCWDB.

Final identifiers, data dictionary, retention, deletion, transfer method, and system of record must be agreed with SCWDB.

## Continuous improvement loop

`deliver → collect evidence → review quality/outcomes → identify change → human approval → version curriculum/material → deliver next cohort`

Review cadence:

- after each session: instructor notes, accessibility issues, recurring learner confusion, delivery defects;
- monthly: completion, assessment trends, participant feedback, instructor calibration, operational issues;
- at least quarterly: approved curriculum updates, employer feedback, technology changes, regulatory/privacy expectations, quality findings.

Material changes affecting objectives, tools, course duration, completion standards, assessments, or safety boundaries should be reviewed and versioned before use, and SCWDB approval obtained where required.

## Instructor calibration

Before independent delivery:

- review common scoring anchors;
- score sample submissions;
- compare critical-domain scoring;
- resolve material disagreement;
- document approved guidance;
- version changed examples/rubrics.

No AI system independently resolves grading disputes or certifies competence.

## Reporting implementation truth

### Implemented/supportable in current architecture

- institution/course/cohort scoping;
- scenario assignments and submissions;
- rubrics/grades;
- instructor review concepts;
- competencies;
- certificate-of-completion architecture;
- deterministic program reporting helpers for supplied approved records;
- synthetic role-based healthcare exercises;
- typed service/pathway/completion definitions.

### Still requires final contract configuration or verification

- dedicated production attendance/session evidence if not already present in current schema;
- final SCWDB participant identifiers/data dictionary;
- participant survey persistence and approved survey fields;
- SCWDB-approved completion threshold;
- final report layout/file format;
- approved data transfer mechanism;
- required record retention/destruction periods;
- any workforce-system integration.

### Must not be claimed as live without evidence

- real-time SCWDB dashboard integration;
- SCORM/LTI/xAPI/SSO integration;
- automated AI grading/competency certification;
- historical participant outcomes;
- formal accessibility certification;
- production Kentucky deployment.
