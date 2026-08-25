# KLINIKOS — NSF SBIR/STTR PROJECT PITCH WORKING PACKAGE

Status: WORKING PROJECT PITCH — NOT SUBMITTED / NOT INVITED / NOT FUNDED

Date: 2026-08-25

Current company baseline: reconcile against current `main` and the active funding control plane immediately before submission.

Primary NSF sources verified 2026-08-25:

- Project Pitch instructions: https://seedfund.nsf.gov/apply/project-pitch/
- Current SBIR/STTR solicitation NSF 26-510: https://www.nsf.gov/funding/opportunities/small-business-innovation-research-small-business-technology/nsf26-510/solicitation
- Eligibility/registration requirements: https://seedfund.nsf.gov/solicitation-eligibility/

## 1. Submission truth

A Project Pitch is the **required first fit gate** for NSF Phase I. It is not a Phase I proposal, invitation, award, revenue event, or funding commitment.

Current NSF rules verified 2026-08-25:

- Phase I applicants must receive an official Project Pitch invitation before submitting a full proposal.
- A Project Pitch normally receives an NSF response in roughly 1–2 months.
- Each company/individual may have only one Project Pitch under review at a time.
- Current rules allow a maximum of two Project Pitches per company in a 12-month period and no more than three pitches for the same project/technology.
- The next current Phase I full-proposal deadline is **2026-11-04 at 5 PM submitting organization local time**.
- Current Phase I award size is up to **$305,000**.
- A Project Pitch does not require SAM or Research.gov registration, but a full proposal requires current company registrations including SAM/UEI, Research.gov, and the SBA Company Registry.
- The PI's primary employment must be with the small business at award and during the award, under current NSF rules.

Because Project Pitch review can take 1–2 months, the operational objective is to submit a high-quality pitch **as soon as the corporate/team facts below are reconciled**, rather than waiting until the November full-proposal deadline approaches.

---

# 2. Proposed project title

## Evidence-Constrained Workflow Intelligence for High-Stakes Healthcare Operations

Alternative shorter title:

## Governed AI State Transitions for Healthcare Workflow

Recommended current title: **Evidence-Constrained Workflow Intelligence for High-Stakes Healthcare Operations**

---

# 3. Core R&D thesis

Klinikos is not asking NSF to fund generic SaaS completion or an AI chatbot.

The proposed research question is:

> **Can a hybrid architecture preserve the interpretive flexibility of probabilistic AI while sharply reducing unsupported healthcare workflow state changes by requiring deterministic authority, evidence sufficiency, longitudinal provenance, and fail-closed transition rules?**

The technical tension is fundamental:

- pure rules are safe in narrow domains but brittle when evidence is messy, incomplete or expressed in natural language;
- unconstrained generative models interpret context well but can blur suggestion, inference and authoritative state;
- healthcare operations require both flexible interpretation **and** strong guarantees that a model cannot manufacture payment, consent, review, completion, signature, credential truth, clinical resolution, or other consequential state.

Phase I would determine whether these two properties can coexist in one practical inference substrate.

---

# 4. NSF Project Pitch field 1 — Technology Innovation

NSF limit: **3,500 characters**

Working draft: approximately 2,000 characters.

> Klinikos proposes to research an evidence-constrained workflow intelligence layer for high-stakes healthcare operations. Current workflow software is usually deterministic but brittle: it can only react to fields and rules that were explicitly modeled. Newer generative-AI systems can interpret messy text and context, but their outputs are probabilistic and can blur the line between suggestion and authoritative state. In healthcare operations, that is dangerous: a model-generated statement must not become proof that a result was reviewed, a referral was closed, a patient consented, a payment settled, or a clinician signed an encounter.
>
> Our technical innovation is a hybrid inference architecture that separates probabilistic interpretation from deterministic authority. Heterogeneous workflow evidence—structured records, timestamps, documents, messages, results, task history, and prior state—would be normalized into an evidence graph with source, time, actor, confidence, and supersession metadata. A probabilistic model may infer candidate meanings or next actions, but a deterministic policy layer would decide which state transitions are admissible, which require more evidence, which require human authority, and which must fail closed. Every accepted transition would retain machine-readable provenance to the evidence that justified it.
>
> The high-risk R&D question is whether such a system can preserve the flexibility of modern AI while sharply reducing unsupported state changes under missing, stale, conflicting, or ambiguous evidence. Existing rule engines lack flexible interpretation; unconstrained LLM agents lack sufficiently strong state/authority guarantees. Phase I would test whether combining calibrated interpretation, longitudinal evidence comparison, provenance, and policy-constrained transition logic can create an auditable workflow-intelligence substrate that is materially safer and more useful for healthcare operations.

### Why this is technical R&D rather than product description

The pitch must emphasize that the uncertain result is **not whether Klinikos can display a workflow**. The uncertain result is whether the hybrid architecture can achieve a useful operating envelope in which probabilistic interpretation materially improves workflow understanding without unacceptable unsupported transitions.

---

# 5. NSF Project Pitch field 2 — Technical Objectives and Challenges

NSF limit: **3,500 characters**

Working draft: approximately 2,100 characters.

> Phase I would test three technical objectives.
>
> **1. Evidence representation under uncertainty.** We will design a typed evidence model that can ingest structured and semi-structured workflow signals while preserving source, actor, timestamp, confidence, supersession, and relationship to prior evidence. Research challenges include duplicate/contradictory evidence, stale records, temporal ordering, and distinguishing “not observed” from “resolved” or “completed.”
>
> **2. Constrained inference and state transition control.** We will build a prototype inference layer that converts evidence into candidate workflow interpretations and next-state proposals, then subjects those proposals to deterministic authority and evidence rules. The core challenge is defining a machine-executable boundary between what probabilistic reasoning may suggest and what the system may assert or execute. Examples include preventing omission from becoming clinical resolution, preventing a redirect from becoming payment, and preventing a model summary from becoming clinical signature or credential truth.
>
> **3. Adversarial evaluation.** We will create a synthetic healthcare-operations benchmark containing longitudinal workflows with missing, duplicated, contradictory, corrected, delayed, and maliciously phrased evidence. We will compare the hybrid architecture against rule-only and unconstrained model baselines. Primary measures will include unsupported-state-transition rate, provenance completeness, conflict detection, false-completion rate, recovery after corrected evidence, and latency. We will also test whether every accepted transition can be traced to the exact supporting evidence and whether high-risk transitions fail closed when authority or evidence is insufficient.
>
> The principal technical risk is that adding deterministic controls may make the system too rigid to benefit from probabilistic interpretation, while looser controls may fail to prevent unsupported state changes. Phase I is intended to determine the feasible operating envelope and produce measurable design rules for a production-grade system.

---

# 6. NSF Project Pitch field 3 — Market Opportunity

NSF limit: **1,750 characters**

Working draft: approximately 1,400 characters.

> The first commercial market is outpatient healthcare organizations that already use EHRs, practice-management systems, payer portals, lab/imaging systems, email, phone, fax, and spreadsheets but still rely on staff to reconstruct what changed and what remains unfinished. Likely buyers include independent practices, multi-location groups, specialty clinics, and eventually larger provider organizations.
>
> The technology is not intended to replace regulated systems of record. It is intended to become a governed workflow-intelligence layer across them: identifying unresolved work, preparing next actions, and preserving evidence for why a state changed. Initial use cases include visit preparation and handoff, results follow-up, referrals, prior-authorization workflow, documentation/coding completion, and revenue-cycle exceptions.
>
> Competition comes from EHR workflow modules, rules engines, RPA products, AI assistants/scribes, and vertical point solutions. The differentiator is the combination of probabilistic interpretation with deterministic authority, longitudinal evidence provenance, and fail-closed state transitions. If Phase I establishes a materially lower unsupported-transition rate without losing useful interpretation, the same substrate can support multiple healthcare workflow products and integrations rather than a single point solution.

### Before submission

Add a concise primary-source market-size anchor only if it materially improves the pitch. Do not waste scarce characters on generic U.S. healthcare-spending totals.

---

# 7. NSF Project Pitch field 4 — Company and Team

NSF limit: **1,750 characters**

Working draft: approximately 1,350 characters.

> Klinikos, Inc. is an early-stage New York healthcare-technology company. Founder Justin Camacho combines direct healthcare/business operations exposure with backend software development, APIs, workflow automation, AI-assisted engineering, and Computer Security & Forensics study. He has built the current Klinikos product and governance architecture around a repeated operator-builder loop: observe workflow failure, model the state/evidence problem, implement it, and revise the architecture when clinician or healthcare-IT feedback contradicts the original assumption.
>
> Existing work already includes append-only/versioned clinical evidence patterns, deterministic longitudinal comparison, explicit provenance, governed AI directives, tenant/authorization boundaries, and separation of payment/credential/clinical authority from model prose. These are implementation foundations, not proof that the proposed R&D question is solved.
>
> For Phase I, Klinikos plans to add targeted expertise in clinical informatics/workflow evaluation and quantitative experimental design as needed. The company will also ensure that the proposed PI satisfies NSF primary-employment requirements at the time of award. No advisor, collaborator, customer, or clinical partner will be represented as committed without an executed agreement.

---

# 8. Existing Klinikos technical evidence supporting feasibility

These existing capabilities are **feasibility evidence**, not claims that the Phase I research has already been completed.

## Append-only/versioned clinical evidence

Current BodyMap/Clinical Change work defines:

- immutable evidence versions;
- exact creator/time provenance;
- amendment lineage rather than history mutation;
- tenant/patient/encounter scoping;
- governed capture-source values;
- explicit finding state;
- deterministic duplicate/future-time/severity validation;
- `initial / previous / today` comparison roles derived at read time rather than persisted as stale truth;
- omission explicitly prohibited from becoming clinical resolution.

## Deterministic longitudinal comparison

Existing Klinikos architecture already treats certain evidence-supported deltas deterministically and requires source evidence for emitted change.

That provides a concrete research substrate for testing where deterministic comparison should end and probabilistic interpretation should begin.

## Governed Zumi authority boundary

The current Zumi directive already establishes that deterministic Klinikos truth outranks model prose for:

- permissions;
- tenant boundaries;
- eligibility;
- credentials;
- consent;
- payment;
- booking/fulfillment;
- settlement;
- legal access;
- safety holds;
- other governed state.

It also explicitly forbids collapsing:

- booking into fulfillment;
- financial obligation into settlement;
- redirect into payment;
- agreement signature into access authority;
- training completion into licensure;
- provider configuration into production proof.

These rules are useful starting hypotheses for a generalized constrained-transition architecture, but Phase I must test whether they can be represented and evaluated systematically rather than as prompt-only policy.

---

# 9. Proposed Phase I experimental design

## Work Package A — Evidence graph and uncertainty model

Build an experimental schema that preserves:

- source identifier;
- source type;
- actor/authority class;
- event time and observation time;
- confidence where probabilistic interpretation is involved;
- supersession/correction relationship;
- structured object identity;
- prior/next workflow relationship;
- evidence required for candidate state transitions.

### Research question

Can heterogeneous evidence be normalized without erasing uncertainty, chronology, contradiction, or authority?

### Candidate metrics

- provenance completeness;
- duplicate/conflict detection recall;
- temporal-ordering error rate;
- evidence-supersession recovery.

## Work Package B — Probabilistic interpretation + deterministic transition policy

Allow model reasoning to produce **candidate** interpretation/actions but never authoritative state directly.

Candidate flow:

`EVIDENCE → PROBABILISTIC INTERPRETATION → CANDIDATE TRANSITION → POLICY / AUTHORITY / EVIDENCE CHECK → ACCEPT / REQUIRE EVIDENCE / REQUIRE HUMAN / REJECT`

### Research question

Can deterministic controls block unsupported transitions without eliminating the useful interpretive advantage of the model?

### Candidate metrics

- unsupported-transition rate;
- false-completion rate;
- accepted-useful-transition rate;
- human-review escalation rate;
- policy precision/recall where ground truth is available.

## Work Package C — Adversarial synthetic benchmark

Build synthetic longitudinal workflows spanning examples such as:

- result received vs result reviewed;
- referral requested vs referral fulfilled;
- prior authorization submitted vs approved/denied/more-info;
- payment redirect vs payment settled;
- encounter draft vs clinician signature;
- prior finding omitted vs explicitly resolved;
- credential documentation uploaded vs verified credential;
- appointment booked vs service fulfilled;
- corrected/retracted evidence;
- stale messages;
- conflicting role assertions;
- malicious instruction text embedded in evidence.

### Baselines

Compare:

1. deterministic rule-only baseline;
2. unconstrained model interpretation baseline;
3. proposed constrained hybrid architecture.

### Key outcome

The research succeeds only if the hybrid model shows a meaningful reduction in unsupported consequential state changes while retaining materially more useful interpretation than the rule-only system.

---

# 10. Explicit safety and scope boundary

The Phase I research should initially use synthetic/non-PHI workflow evidence unless the final research plan deliberately adds an approved human-subjects/data pathway.

The project does **not** need to evaluate independent AI diagnosis or treatment authority.

The research target is healthcare workflow state and evidence integrity.

Examples include:

- operational completion;
- result-review state;
- referral/authorization state;
- payment/revenue state;
- documentation/signature state;
- credential/eligibility state;
- longitudinal evidence change.

This keeps the project technically consequential without pretending Klinikos is seeking to automate regulated clinical judgment.

---

# 11. Full-proposal registration workback

Project Pitch submission can occur before these registrations are complete, but do not wait for an invitation to begin checking them.

## Verify / complete privately

- SAM.gov registration;
- UEI;
- Research.gov organization/account registration;
- SBA Company Registry;
- exact legal company name/address consistency across systems;
- exact current ownership/cap table;
- PI eligibility and primary employment plan;
- banking/EFT information only in the proper federal systems, never GitHub.

Registration is free through official government systems. Do not pay an intermediary merely to obtain a federal registration unless there is a deliberate service decision.

---

# 12. Workback to the November 4, 2026 full-proposal deadline

## Now — 2026-08-25 to 2026-08-28

- finalize Project Pitch technical scope;
- reconcile exact founder/company/team facts;
- submit Project Pitch through official NSF portal when ready;
- verify federal registration status in parallel;
- preserve Project Pitch submission evidence outside public repository where appropriate.

## While Project Pitch is under review

Do **not** wait passively.

Prepare draft Phase I components that are reusable but do not assume invitation:

- technical objectives;
- experimental benchmark design;
- risk register;
- commercialization hypothesis;
- PI/team gap plan;
- budget assumptions;
- data management/security approach;
- broader impacts;
- customer/problem evidence;
- primary-source competitive research.

## If invited with sufficient time before 2026-11-04

Complete the full proposal under the exact then-current solicitation and PAPPG requirements.

## If invitation timing makes November 4 unrealistic

Do not force a low-quality proposal. Current NSF 26-510 invitations are valid for the next two submission deadlines after the official invitation under current rules. Reconfirm that rule when the invitation arrives and target the next eligible deadline if necessary.

---

# 13. Submission gates

Do not submit until the following are current and truthful:

- exact Klinikos legal entity facts;
- exact founder/PI employment answer;
- current company/team representation;
- current Project Pitch question wording/limits;
- no existing conflicting Project Pitch under review;
- no unsupported advisor/customer/research-partner commitments;
- technical hypothesis remains genuinely uncertain rather than already solved by current product;
- all four fields fit the portal's then-current character limits.

---

# 14. Project Pitch decision criteria

Submit if:

- the technical novelty can be described without relying on marketing language;
- the Phase I experiments could genuinely falsify the approach;
- the project can produce generalizable technical knowledge/design rules beyond one customer implementation;
- the team can credibly execute the core technical work and fill targeted gaps;
- commercialization follows if the technical risk is retired.

Do not submit if the proposal collapses into:

- “build more Klinikos features”;
- “use an LLM to automate healthcare”;
- routine integration work;
- customer-specific configuration;
- ordinary software engineering with no uncertain technical mechanism.

---

# 15. Current recommended next action

**Finalize and submit the NSF Project Pitch before spending substantial effort on the full Phase I proposal.**

The Project Pitch is scarce: only one may be under review at a time and current rules limit annual submissions. Treat it as a high-value technical thesis, not a brainstorming form.

Current recommended thesis:

> **Evidence-constrained workflow intelligence that separates probabilistic interpretation from deterministic authority and requires provenance-supported state transitions in high-stakes healthcare operations.**

That thesis is narrower than Klinikos, testable, commercially reusable, and aligned with technical architecture the company has already begun building without falsely claiming that the research problem is solved.
