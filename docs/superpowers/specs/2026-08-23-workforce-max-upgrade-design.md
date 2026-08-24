# Klinikos Workforce Max Upgrade Design

Date: 2026-08-23
Status: APPROVED ADDENDUM TO KLINIKOS OPERATING NETWORK ARCHITECTURE

## Purpose

Turn the already-merged SCWDB/Kentucky workforce delivery stack into a first-class, reusable Klinikos EDU Workforce configuration that is demonstrably ready to customize for a workforce board without creating a Kentucky-specific fork or duplicating authority already present in EDU.

This design is an addendum to `docs/superpowers/specs/2026-08-23-klinikos-operating-network-design.md` and is authoritative where it is more specific about Workforce.

## Current repository truth

PR #260 is merged into `main` and is the current Workforce implementation authority. It already provides:

- 6–8 hour AI Industry Accelerator pathways for Manufacturing, Construction, Logistics, Healthcare, and Business Operations;
- a 2–3 hour AI-Powered Career Readiness workshop;
- common responsible-AI curriculum;
- live instructor-led delivery boundaries;
- real Workforce sessions;
- verified attendance evidence;
- knowledge-assessment evidence;
- feedback/curriculum-version evidence;
- deterministic completion logic;
- reports and evaluator materials;
- representative slides, participant activity, assessment, rubric, certificate, instructor guide, implementation plan, pricing/capture evidence, and pre-existing-IP treatment.

Do not recreate any of those systems.

## Critical taxonomy correction

The SCWDB Workforce configuration must use the exact merged pathway keys already owned by `src/lib/edu/workforce-ai-program.ts`:

- `manufacturing`
- `construction`
- `logistics`
- `healthcare`
- `business_operations`

Career Readiness is a separate service family, not a sixth Industry Accelerator pathway.

Do not introduce `transportation-logistics`, `professional-services`, or any other parallel pathway vocabulary for the SCWDB configuration.

## Product thesis

**Klinikos EDU Workforce is configuration over an existing institutional learning engine, not a buyer-specific product fork.**

For SCWDB the implementation posture is:

**configure → validate → rehearse → launch**

rather than:

**design → invent → build → hope**.

The 30-day post-NTP implementation window should focus on customer configuration, curriculum adaptation, instructor readiness, accessibility/language access, reporting fields, approved tools, rehearsal, acceptance, and launch.

## Workforce configuration contract

Add one typed, server-safe configuration model that describes institutional Workforce delivery without duplicating curriculum definitions.

The configuration consumes the merged `workforceAiReadinessProgram`, `industryAcceleratorPathways`, and `careerReadinessWorkshop` as the source of curriculum truth.

It should contain:

- `product: "edu"`;
- `configuration: "workforce"`;
- customer identity and label;
- service families;
- exact merged pathway keys;
- allowed delivery modes;
- launch SLA;
- implementation-plan SLA;
- attendance/completion-reporting SLA;
- survey-reporting SLA;
- monthly report cadence;
- quarterly curriculum-review cadence;
- class-size planning ranges;
- standard-accessibility inclusion;
- language-access strategy;
- certificate authority boundary;
- Zumi authority boundary;
- approved-tool disclosure requirement;
- pricing/capture metadata only where it is not checkout authority.

This configuration is descriptive/operational metadata. It must not create a second completion state, attendance state, price authority, or authorization rail.

## DOL AI Literacy Framework mapping

The existing merged AI-literacy curriculum already uses the five content areas:

1. Understand AI principles and limits.
2. Explore useful AI applications.
3. Direct AI effectively and safely.
4. Evaluate AI outputs for accuracy and relevance.
5. Use AI responsibly, securely, and accountably.

Expose these as an evaluator-readable mapping over the existing curriculum rather than a second curriculum registry.

The reusable Klinikos applied-learning loop is:

**FRAME → PROTECT → DIRECT → INSPECT → VERIFY → CORRECT/ESCALATE → EXPLAIN/EVIDENCE**

That loop must remain occupation-neutral while each pathway changes the work context, source records, risks, and human authority boundary.

## Evaluator-proof product surface

Create a role-gated or explicitly safe demonstration surface inside existing EDU routing that proves what the product already does.

The surface should show, using real merged data/configuration definitions:

- Workforce program identity;
- both service families;
- exact five Industry Accelerator pathways;
- Career Readiness;
- live instructor-led delivery;
- Zumi as governed practice partner;
- attendance evidence;
- assessments;
- instructor review;
- completion boundary;
- certificate boundary;
- reporting cadence;
- accessibility/language access;
- 30-day configure-and-launch model;
- pre-existing platform advantage.

No evaluator-facing page may claim SCWDB award, customer deployment, participant outcomes, accreditation, professional certification, licensure, production Kentucky branding approval, or an external integration that is not live.

## Healthcare live-demo contract

Use the merged Healthcare `Review before action` scenario as the hero demonstration.

The evaluator path is:

1. Instructor opens the Workforce program/session.
2. Learner enters a synthetic Patient Access / Medical Assistant context.
3. Authoritative synthetic record says a referral was **submitted**, not approved.
4. Zumi returns a deliberately flawed draft that says the referral was **approved**.
5. Learner identifies the unsupported status change.
6. Learner checks the authoritative synthetic source.
7. Learner corrects the patient-facing administrative message.
8. Instructor introduces a privacy/tool-boundary question.
9. Zumi then presents a recommendation that crosses into clinical decision-making.
10. Learner stops and escalates to a licensed clinician instead of trying to improve the prompt.
11. Instructor applies the rubric.
12. Persisted evidence chain shows attendance/activity/assessment/instructor review separately.
13. Completion/certificate eligibility remains deterministic and human-controlled.
14. Program report shows the evidence without turning registration or login into completion.

The demonstration must use synthetic data and existing authoritative helpers. It must not add a fake demo-only completion engine.

## Evidence chain

Expose one read-only projection over existing truth:

`enrollment → scheduled session → verified attendance → applied evidence → knowledge assessment → instructor review → completion approval → credential eligibility → reporting`

The projection is derived only. It creates no duplicate database truth.

Rules:

- enrollment is not attendance;
- login is not attendance;
- assignment activity is not attendance;
- attendance is not completion;
- AI output is not learner competence;
- certificate eligibility requires all deterministic program requirements and human approval;
- Zumi can explain blockers but cannot clear them.

## Workforce service-level commitments

The SCWDB configuration should expose these contractual planning commitments as configuration metadata for reporting/demonstration, without pretending they are generic platform guarantees for every customer:

- implementation plan within 15 business days of written NTP;
- approved-service launch within 30 calendar days of written NTP unless otherwise negotiated;
- attendance/completion records within 2 business days after each workshop;
- participant survey evidence within 5 business days after each workshop;
- monthly performance report;
- at least quarterly curriculum review;
- live remote as routine scalable delivery;
- strategic in-person delivery for concentrated employer/LWA/Rapid Response needs;
- standard accessible materials and ordinary captioning included;
- no participant-paid AI subscription required;
- specialized third-party interpretation/translation or extraordinary services require prior approval when outside agreed base scope.

## Class-size and access configuration

Use planning defaults, not eligibility gates:

### Career Readiness live remote

- dedicated-session planning minimum: 6;
- recommended: 18;
- lead-instructor maximum: 24;
- up to 40 only with a second facilitator and SCWDB approval.

### Industry Accelerator live remote

- dedicated-session planning minimum: 6;
- recommended: 15;
- lead-instructor maximum: 20;
- up to 30 only with a second facilitator and SCWDB approval.

### In person

- recommended: 12–20;
- approved maximum depends on venue, equipment, accessibility, and facilitator ratio.

Low enrollment never creates false completion or forces a participant to wait simply to satisfy a preferred cohort size. Statewide referrals may be pooled, a scheduled session may still run, or a disclosed dedicated-session commercial option may be used when the customer elects it.

## Zumi contract

Zumi is the governed intelligence layer inside Workforce, not the official instructor and not a certification authority.

Zumi may:

- demonstrate prompt construction;
- produce bounded practice responses;
- generate intentionally flawed training output;
- challenge learners;
- explain why output may be unreliable;
- help learners compare source and draft;
- assist instructors with preparation and feedback drafts;
- explain completion blockers from deterministic evidence;
- summarize aggregate non-sensitive program patterns when permitted.

Zumi may not:

- establish official attendance;
- approve completion;
- certify competence;
- grant licensure/scope/credential authority;
- make regulated clinical decisions;
- create employment eligibility;
- automatically apply a learner to a Grid opportunity;
- widen EDU, Grid, clinical, patient, financial, or tenant authorization.

## EDU → Grid bridge

The bridge is future/optional and must be read-only at first.

It requires explicit user opt-in and may expose only released, non-sensitive training evidence such as:

- pathway;
- completion date;
- released competency labels;
- user-selected opportunity intents.

It must never turn a certificate of completion into licensure, verified professional credential, employment eligibility, or automatic application authority.

## Public-site narrative

When a buyer asks what Klinikos can do for a workforce board, Living Home/Zumi should be able to explain truthfully:

> Klinikos EDU already contains the institutional learning and evidence foundation. Workforce boards can configure live instructor-led AI training, occupational pathways, cohorts, sessions, assessments, verified attendance, instructor-controlled completion, reporting, and governed AI practice without funding a greenfield learning platform build.

The public home remains conversation-first. Do not replace it with a permanent module catalog.

## Commercial implication

This upgrade should turn the SCWDB work into reusable revenue infrastructure for:

- workforce boards;
- employers;
- health systems;
- schools/community colleges;
- training organizations;
- professional associations;
- enterprise institutional deployments.

Commercial packaging may include implementation/customization, per-participant/per-completion pricing, institutional license, instructor-day/session fees, reporting/configuration, and employer/pathway-specific content.

No descriptive revenue-engine metadata becomes checkout authority unless it is separately promoted into the server-owned commercial offer registry.

## Release / repository constraints

- `main` currently has known verification regressions being repaired in PR #292.
- Do not merge a large Workforce feature tranche directly into red `main`.
- Stack implementation from the approved architecture branch or latest verified/reconciled base.
- Do not modify production database schema in this tranche.
- Do not create a second EDU theme or shell.
- Do not create Kentucky-specific database tables when existing institutional structures suffice.
- Do not alter completion authority.
- Do not claim CI green while GitHub jobs fail before checkout with `steps:null`.
- Every implementation task follows test-first development and remains reviewable independently.
