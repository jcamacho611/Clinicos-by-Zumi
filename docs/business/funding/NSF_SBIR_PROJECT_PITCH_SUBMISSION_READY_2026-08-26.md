# KLINIKOS — NSF SBIR PROJECT PITCH SUBMISSION-READY EXECUTION

Status: `APPLICATION READY / ACCOUNT-AUTH GATED — NOT SUBMITTED / NOT INVITED / NOT FUNDED`

Verified: 2026-08-26

## Purpose

Convert the existing Klinikos NSF SBIR working package into the exact current America’s Seed Fund Project Pitch shape so no essay-writing or character-limit work remains at portal entry.

Current public authorities:

- Project Pitch instructions: https://seedfund.nsf.gov/apply/project-pitch/
- MyWork Project Pitch guide: https://seedfund.nsf.gov/how-to-submit/project-pitch-guide/
- Current solicitation: NSF 26-510
- Portal: https://nsfgov.my.site.com/mywork/s/

## Current NSF execution facts

- A Project Pitch is required before an NSF SBIR Phase I full proposal.
- The four current narrative limits are:
  - Technology Innovation: 3,500 characters
  - Technical Objectives and Challenges: 3,500 characters
  - Market Opportunity: 1,750 characters
  - Company and Team: 1,750 characters
- NSF currently allows a maximum of two Project Pitches per company in a 12-month period and no more than three for the same project/technology.
- Only one Project Pitch may be under review at a time.
- The next current full-proposal deadline after this verification is 2026-11-04 at 5:00 PM submitting-organization local time.
- A Phase I proposer must first receive an official Project Pitch invitation.
- Current solicitation NSF 26-510 governs full-proposal eligibility and award requirements.

## Recommended project title

**Evidence-Constrained Workflow Intelligence for High-Stakes Healthcare Operations**

## Field 1 — Technology Innovation

Character count: approximately 1,950 / 3,500.

Klinikos proposes to research an evidence-constrained workflow intelligence layer for high-stakes healthcare operations. Existing workflow software is deterministic but brittle: it reacts only to fields and rules that were explicitly modeled. Generative AI can interpret messy text and context, but its outputs are probabilistic and can blur suggestion, inference, and authoritative state. In healthcare operations, that creates a technical safety problem: model-generated language must not become proof that a result was reviewed, a referral was closed, a patient consented, a payment settled, a clinician signed an encounter, or a credential was verified.

The proposed innovation is a hybrid inference architecture that separates probabilistic interpretation from deterministic authority. Heterogeneous workflow evidence—structured records, timestamps, documents, messages, results, task history, and prior state—would be normalized into an evidence graph preserving source, actor, time, confidence, correction/supersession, and relationship to prior evidence. A probabilistic model may infer candidate meanings or next actions, but a deterministic policy layer determines which transitions are admissible, which require additional evidence, which require human authority, and which must fail closed. Every accepted transition retains machine-readable provenance to the evidence that justified it.

The high-risk R&D question is whether this architecture can preserve useful contextual interpretation while materially reducing unsupported consequential state changes under missing, stale, conflicting, corrected, or adversarial evidence. Rule engines lack flexible interpretation; unconstrained AI agents lack strong state and authority guarantees. Phase I would determine whether calibrated interpretation, longitudinal provenance, and policy-constrained transitions can form a practical, auditable substrate for healthcare workflow intelligence.

## Field 2 — Technical Objectives and Challenges

Character count: approximately 1,922 / 3,500.

Phase I would test three technical objectives.

1. Evidence representation under uncertainty. Develop a typed evidence model for structured and semi-structured workflow signals that preserves source, actor/authority class, event and observation time, confidence, correction/supersession, and prior-state relationships. Challenges include duplicate and contradictory evidence, stale records, temporal ordering, and distinguishing “not observed” from “resolved” or “completed.”

2. Constrained inference and transition control. Build a prototype that converts evidence into candidate interpretations and next-state proposals, then applies deterministic authority and evidence rules before any state can be asserted. The research challenge is to define a machine-executable boundary between what probabilistic reasoning may suggest and what the system may claim or execute. Test cases include result received vs. reviewed, referral requested vs. fulfilled, authorization submitted vs. approved, payment redirect vs. settled, encounter draft vs. signed, and credential uploaded vs. verified.

3. Adversarial evaluation. Create a synthetic healthcare-operations benchmark with missing, duplicated, contradictory, corrected, delayed, and adversarially phrased evidence. Compare three baselines: rule-only logic, unconstrained model interpretation, and the proposed constrained hybrid. Measure unsupported-transition rate, false-completion rate, provenance completeness, conflict detection, recovery after corrected evidence, useful accepted-transition rate, human-review escalation rate, and latency.

The core technical risk is a tradeoff: strong deterministic controls may eliminate the useful flexibility of probabilistic interpretation, while looser controls may fail to block unsupported state changes. Phase I will identify the feasible operating envelope and produce measurable design rules for a production-grade system.

## Field 3 — Market Opportunity

Character count: approximately 1,279 / 1,750.

The near-term market is U.S. outpatient healthcare organizations that already rely on EHRs, practice-management systems, payer portals, lab/imaging systems, email, phone, fax, and spreadsheets but still require staff to reconstruct what changed and what remains unfinished. Initial buyers include independent practices, specialty clinics, and multi-location groups.

The technology is not intended to replace regulated systems of record. It would operate as a governed workflow-intelligence layer across them: identifying unresolved work, preparing next actions, and preserving evidence for why state changed. Early use cases include visit preparation and handoff, results follow-up, referrals, prior authorization, documentation/coding completion, and revenue-cycle exceptions.

Competition includes EHR workflow modules, rules engines, RPA, AI assistants/scribes, and vertical point solutions. Klinikos differentiates through probabilistic interpretation combined with deterministic authority, longitudinal provenance, and fail-closed state transitions. If Phase I shows materially fewer unsupported transitions without sacrificing useful interpretation, the same substrate can support multiple healthcare workflow products and integrations rather than a single point solution.

## Field 4 — Company and Team

Character count: approximately 1,395 / 1,750.

Klinikos, Inc. is an early-stage New York healthcare-technology company building software for governed healthcare operations. Founder Justin Camacho combines direct healthcare/business operations exposure with backend software development, APIs, workflow automation, AI-assisted engineering, and Computer Security & Forensics study. He built the current Klinikos product and governance architecture using an operator-builder loop: observe workflow failure, model the state/evidence problem, implement it, and revise the architecture when clinician or healthcare-IT feedback contradicts the original assumption.

Existing technical work includes append-only/versioned clinical evidence patterns, deterministic longitudinal comparison, explicit provenance, governed AI directives, tenant/authorization boundaries, and separation of payment, credential, and clinical authority from model prose. These are implementation foundations, not proof that the proposed research question is solved.

For Phase I, Klinikos plans to add targeted clinical-informatics/workflow-evaluation and quantitative experimental-design expertise where needed. No advisor, collaborator, customer, or clinical partner will be represented as committed without an executed agreement. Before a full proposal or award, the company will verify all NSF small-business ownership, U.S.-work, and PI primary-employment requirements.

## Canonical company fields

Use only verified facts:

- Company: Klinikos, Inc.
- Entity: New York Business Corporation
- Filed: 2026-08-20
- NY DOS ID: 8001871
- Address: 1210 Nostrand Ave, Brooklyn, NY 11225
- Website: https://klinikos.io
- Technology category framing: Digital Health / Artificial Intelligence / trustworthy governed healthcare workflow intelligence

## Account creation / portal execution

NSF’s current MyWork guide requires a user account before Project Pitch submission. A new account requires:

- First name
- Last name
- Valid email
- Password creation

Do not invent, expose, or store a founder password. Do not bypass email verification, MFA, or device confirmation if presented.

Once authenticated:

1. Open `SBIR/STTR Project Pitches`.
2. Select `Submit New Project Pitch`.
3. Populate company/contact fields from the canonical profile.
4. Use the four narratives above exactly unless the live form changes.
5. Record the Project Pitch case number shown after submission.
6. Update company records to `SUBMITTED — AWAITING NSF RESPONSE` only after portal confirmation exists.

## User-only / attestation gate

Before final Project Pitch submission, verify any live portal questions that require personal or legal attestation, especially:

- ownership/eligibility facts required by the current portal;
- whether any other Klinikos Project Pitch is currently under review;
- whether the same technology has prior Project Pitch submissions that count against NSF limits;
- the submitting official’s personal account/email verification.

Do not infer citizenship, permanent-resident status, equity ownership, or other protected/sensitive eligibility facts from memory or context.

## Full-proposal readiness immediately after invitation

If invited, immediately start—not wait for the deadline—on:

- SAM.gov / UEI verification;
- Research.gov organization registration;
- SBA Company Registry;
- PI primary-employment compliance;
- Phase I budget up to the current solicitation ceiling;
- technical work plan and measurable milestones;
- data-management / security / research-security requirements;
- commercialization plan and letters/evidence as required by NSF 26-510.

## Truth boundary

Project Pitch ready != submitted.
Project Pitch submitted != invited.
Invitation != award.
Working software != proof that the proposed high-risk R&D has been solved.
No customer, partner, PI-eligibility, ownership, scientific-result, or award claim may be invented for fit.