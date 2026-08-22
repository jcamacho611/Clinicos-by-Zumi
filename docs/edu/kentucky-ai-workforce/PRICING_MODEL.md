# SCWDB Kentucky AI Workforce Readiness Network — Pricing Scenario Model

Status: **capture working document**. This is an internal pricing framework, not a submitted quote, SCWDB-approved price, or representation of guaranteed volume.

## Pricing rules

1. Do not price as `980 × seat price` as though 980 participants are guaranteed. SCWDB has stated that approximately 980 unique participants is a planning target only and does not guarantee participants, classes, completions, referrals, or payments.
2. Do not use a startup-style deposit assumption unless SCWDB expressly permits it. Government/workforce delivery should be modeled around authorized deliverables, accepted services, invoicing, and documented completion.
3. Separate fixed implementation costs from variable delivery costs so the program remains viable at low utilization.
4. Keep in-person travel separately controlled unless SCWDB directs bidders to embed it.
5. Never make pricing dependent on product capabilities that are not currently supportable. Do not price automated AI teaching, automated competency certification, institutional SSO/LTI/SCORM/xAPI, or completed non-healthcare curricula as existing features.
6. Use integer-dollar contract schedules and maintain an internal cost model beneath every proposed customer price.

## External benchmark signals

These examples are market context only; none is a direct comparator or recommended SCWDB price.

| Benchmark | Public amount | What it proves | What it does **not** prove |
| --- | ---: | --- | --- |
| NASA / ANSYS, 2025: five days onsite instructor-led training for up to 10 employees | $24,136.50 | Specialized live instructor delivery can be priced as a bounded engagement rather than a commodity seat fee | SCWDB should pay the same rate or that this curriculum has comparable technical depth |
| OPM / Emeritus-Wharton workforce transformation training | $52,000 | Government buyers fund premium AI/leadership training where value and audience justify it | Per-participant economics for SCWDB |
| Office of Naval Research / CNA AI & ML training | $850,000 obligated | Multi-year or enterprise AI training contracts can reach substantial total values | SCWDB budget or likely ceiling |
| NIH GROW workforce program award to Pacific Lutheran University | $95,000 current / $250,000 potential | Workforce-development training contracts can scale through base + option/potential value | SCWDB award value |
| DOL Industry-Driven Skills Training Fund guidance | Example uses $2,000 participant training cost; reimbursement tied to completion/retention | Federal workforce programs can use milestone- and outcome-linked reimbursement and require explicit per-participant ceilings | That SCWDB wants a $2,000 price or reimbursement structure |

Primary public references used in capture research:

- U.S. Department of Labor AI Literacy Framework / TEN 07-25.
- U.S. Department of Labor Industry-Driven Skills Training Fund guidance.
- USAspending award records for the NASA/ANSYS, OPM/Emeritus, ONR/CNA, and NIH/PLU examples above.

## Internal cost architecture

Build the bid from cost drivers first.

### Fixed implementation / configuration

Potential cost components:

- SCWDB kickoff and discovery;
- final learning-objective mapping;
- occupational pathway configuration;
- healthcare simulation customization;
- career-readiness configuration;
- instructor guide finalization;
- representative material production;
- accessibility review/remediation before first delivery;
- reporting-field and completion-rule configuration;
- instructor calibration and train-the-trainer work;
- launch QA;
- program management setup.

This should be modeled as a fixed implementation deliverable unless SCWDB directs otherwise.

### Live delivery

Model separately by service type:

- AI Industry Accelerator live remote cohort;
- AI Industry Accelerator in-person cohort;
- AI-Powered Career Readiness live remote workshop;
- AI-Powered Career Readiness in-person workshop;
- optional instructor day / half-day where a cohort unit is impractical.

Each delivery rate must cover:

- instructor preparation;
- live instruction;
- attendance/completion administration;
- participant support;
- assessment/review time;
- post-session reporting;
- quality assurance;
- reasonable rescheduling overhead.

### Participant/material component

Use only for truly participant-dependent cost, such as:

- participant materials;
- certificate/completion evidence generation;
- bounded platform access where actually supported;
- participant-level reporting/assessment handling;
- approved variable-cost tools if later enabled and funded.

Do not bury fixed program overhead inside a pure per-participant fee when SCWDB guarantees no minimum volume.

### Travel

Maintain a separate internal ledger for:

- instructor travel time;
- airfare/mileage;
- lodging;
- meals/per diem if allowed;
- local transportation;
- additional instructor coverage caused by travel.

Do not promise unlimited statewide in-person delivery inside one flat rate before SCWDB clarifies travel treatment.

## Three utilization scenarios

No customer-facing rates should be locked until SCWDB answers the pending pricing/invoicing questions. Use this structure for sensitivity modeling.

### Scenario A — Low utilization

Purpose: prove the contract does not become loss-making if referrals are far below the 980-person planning figure.

Model:

- full implementation/configuration cost still occurs;
- fewer cohorts carry more fixed overhead per participant;
- minimum viable cohort/session economics matter most;
- travel can become disproportionately expensive;
- platform/content cost should remain bounded.

Decision test: would Klinikos still earn an acceptable gross margin if participant volume is approximately 25% of planning volume?

### Scenario B — Expected utilization

Purpose: model around SCWDB's approximate 980-participant planning case without treating it as guaranteed.

Model both overlap possibilities because a participant may take one service or both:

- unique participants;
- Career Readiness completions;
- Industry Accelerator completions;
- participants taking both;
- cohort count by pathway;
- live-remote versus in-person mix;
- average class size.

Decision test: does the proposed schedule give SCWDB predictable economics while maintaining delivery quality and margin?

### Scenario C — High utilization

Purpose: ensure capacity can scale if actual referrals exceed planning assumptions.

Model:

- instructor bench requirements;
- concurrent cohort capacity;
- quality-review capacity;
- reporting/admin load;
- travel conflicts;
- volume discounts only where marginal cost truly falls.

Decision test: can Klinikos scale without degrading facilitation quality or relying on automated teaching that is not built?

## Pricing forms to compare

### Option 1 — Blended fixed + cohort + participant

**Best current default for modeling.**

- fixed implementation/configuration deliverable;
- live cohort/session rate;
- modest participant/material component;
- separately controlled travel.

Advantages:

- protects fixed-cost recovery when utilization is low;
- transparent for SCWDB;
- scales reasonably with demand;
- maps cleanly to actual delivery work.

Risks:

- requires clear definitions of an authorized cohort, cancellation, and participant count.

### Option 2 — Cohort/session dominant

- fixed program-management layer;
- per-session or per-cohort delivery rate;
- no or minimal per-participant fee.

Advantages:

- simple invoicing;
- protects instructor economics where class size varies.

Risks:

- SCWDB may prefer participant-level cost visibility;
- very small classes can look expensive per participant.

### Option 3 — Participant dominant with volume bands

- fixed setup fee;
- per-participant rate that declines at defined utilization bands;
- minimum authorized cohort economics.

Advantages:

- easy unit-cost comparison for workforce evaluators.

Risks:

- dangerous without minimums because SCWDB guarantees no volume;
- can reward packing classes too densely unless quality limits are explicit.

### Option 4 — Instructor-day / facilitation-day

Useful as a supplemental schedule for requested in-person delivery or bespoke sessions, not necessarily as the main pricing model.

Advantages:

- transparent for travel-heavy or custom delivery.

Risks:

- does not directly communicate participant value;
- may encourage fragmented scheduling.

### Option 5 — Fixed program price

Use only if SCWDB later provides a defined minimum scope, schedule, and budget sufficient to control volume risk.

Advantages:

- maximum budget certainty for SCWDB.

Risks:

- unacceptable risk while participant and class volume remain unguaranteed.

## Margin model

For every pricing option calculate:

`Gross margin = contract revenue - direct delivery cost - participant variable cost - travel not reimbursed - delivery-specific subcontractor cost`

Keep corporate overhead and founder compensation visible in a separate contribution-margin view rather than hiding them inside direct delivery cost.

Minimum internal checks before final price approval:

- low-utilization gross margin;
- expected-utilization gross margin;
- high-utilization instructor capacity;
- travel sensitivity;
- cancellation/no-show sensitivity;
- payment-timing cash requirement;
- subcontractor economics if needed for the three-year qualification requirement;
- 30-day launch staffing cost;
- curriculum configuration cost for four non-healthcare pathways.

## Commercial clarification dependencies

Do not lock the final schedule until SCWDB answers or formally addresses:

1. preferred pricing unit(s): fixed, cohort/session, participant, instructor day, blended, or other;
2. whether implementation/curriculum configuration, accessibility review, reporting configuration, and setup may be separately priced;
3. expected class-size range and typical session duration;
4. travel reimbursement/allowability and whether travel should be embedded or separately stated;
5. invoicing cadence, acceptance milestones, and payment timing;
6. whether minimum cohort sizes, late-cancellation rules, or rescheduling protections are permissible.

## Proposal posture

The pricing narrative should communicate:

> Klinikos will price the program around actual authorized delivery, not around an assumed guaranteed 980 participants. Our structure separates one-time program configuration from live instructional delivery and participant-dependent cost so SCWDB can scale utilization without paying for volume it does not use, while preserving the instructor quality and reporting capacity required for responsible AI training.

This is a capture position, not a final quote.