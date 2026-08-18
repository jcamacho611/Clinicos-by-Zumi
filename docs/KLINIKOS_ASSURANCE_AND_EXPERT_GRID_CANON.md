# KLINIKOS — ASSURANCE, RULES & EVIDENCE, QUALITY GUARDIAN, AND EXPERT GRID CANON

Version: `2026-08-18.1`
Status: `CANDIDATE SPECIALIST CANON — IMPLEMENTATION FOUNDATION`

## 1. Purpose

Klinikos must not become a collection of disconnected healthcare checklists, dashboards, AI prompts, or consulting services.

The shared architecture is:

`AUTHORIZED DATA / EVENT → APPLICABLE VERSIONED RULE → EVIDENCE EVALUATION → GAP / SATISFIED / REVIEW REQUIRED → OWNER / NEXT ACTION → WORKFLOW → HUMAN REVIEW WHEN REQUIRED → EVIDENCE → RESOLUTION → AUDIT / OUTCOME → NEXT ROUTE`

Zumi may understand, summarize, prioritize, explain, and coordinate this flow. Zumi does not establish clinical truth, legal compliance, quality-measure satisfaction, credential eligibility, payment truth, or professional authority.

## 2. Rules & Evidence Engine

The Rules & Evidence Engine is reusable infrastructure across:

- quality and care-gap operations;
- compliance readiness;
- credentialing and expirations;
- prior authorization readiness;
- revenue and claim readiness;
- referral closure;
- safety workflows;
- inventory/recall/expiration workflows;
- education competency evidence;
- Grid eligibility and expert engagement requirements;
- general clinic operating policies.

Every governed rule requires explicit identity, key, version, effective window, domain, authority, applicability predicates, evidence requirements, closure mode, risk class, owner roles, and human-review policy.

Program-specific content is separate from the execution engine. Proprietary or licensed measure specifications must not be copied into the repository without appropriate rights. External regulatory/program rules must be sourced, versioned, reviewed, and activated through governance.

## 3. Evidence law

Evidence must remain attributable to a source and subject. Evidence may be current, stale, expired, insufficient, or conflicting.

AI-generated prose is not evidence merely because it sounds plausible.

A rule can close automatically only where deterministic policy explicitly permits it. When policy requires authorized review, complete evidence produces `review_required`, not `satisfied`.

Cross-organization evidence must never silently satisfy another tenant's rule.

## 4. Assurance Monitor

Klinikos may monitor configured rule families on scheduled, event-driven, or hybrid triggers.

The monitor creates bounded workflow jobs and minimum-necessary domain events. It does not send private operational context to a public research provider and does not call a model to decide whether a rule is satisfied.

Representative future monitors include:

- Quality Guardian;
- Revenue Assurance;
- Credential Assurance;
- Authorization Assurance;
- Referral Assurance;
- Compliance Assurance;
- Inventory Assurance;
- Workforce Assurance;
- Education/Competency Assurance;
- Security Assurance.

The current foundation provides deterministic plan/job/event contracts. Durable plan storage, rule-package persistence, organization configuration, and operator UI remain later slices.

## 5. Zumi Quality Guardian

Quality Guardian consumes deterministic Rules & Evidence evaluations and produces:

- counts of applicable rules;
- satisfied work;
- open gaps;
- review-required work;
- overdue work;
- due-soon work;
- prioritized Klinikos next actions;
- human-review queue items where required;
- a Zumi-ready operational brief.

Quality Guardian must not claim that Klinikos supports a specific HEDIS, CMS, NCQA, MIPS, ACO, Stars, or payer program merely because the generic engine exists. Program support requires a separately verified rule package, data contract, licensing posture where applicable, tests, human validation, and production evidence.

## 6. Expert Grid

Grid expands beyond workers, facilities, rooms, shifts, and services into governed expert capability.

Representative expert domains include:

- quality;
- revenue cycle;
- billing/coding;
- credentialing;
- prior authorization;
- compliance/privacy;
- cybersecurity;
- interoperability/FHIR;
- clinical informatics;
- operations;
- population health;
- patient experience;
- education.

An expert match is a potential engagement, not permission to access clinic or patient data.

Hard match dimensions include:

- requested capability;
- domain;
- availability;
- jurisdiction where applicable;
- required verified evidence;
- conflict-of-interest policy;
- compatible delivery mode;
- configured data-access class compatibility;
- configured price boundary where used.

Soft reputation, experience, outcome, or price scores can never override failed hard eligibility.

## 7. Expert engagement and data access

The safe sequence is:

`NEED → MATCH → TERMS → CONFLICT CHECK → PURPOSE → REQUIRED AGREEMENTS / BAA EVIDENCE WHERE APPLICABLE → SCOPED AUTHORIZATION → MINIMUM-NECESSARY DATA ROOM → EXPERT WORK → EVIDENCE / DELIVERABLE → REVIEW → COMPLETION → FINANCIAL / AUDIT STATE`

No matched expert receives PHI merely because Grid selected them.

Future Expert Workbench access should be engagement-scoped, time-bounded, tenant-bound, purpose-bound, and capability-bound.

## 8. Internal-first then Grid escalation

Klinikos should not create paid outside work when an authorized internal team can resolve the issue.

Preferred sequence:

1. deterministic engine identifies governed work;
2. Zumi explains and prepares it;
3. internal authorized staff receive the work first;
4. if required capability/capacity is unavailable, create Grid expert demand;
5. match eligible experts or expert organizations;
6. complete engagement authorization before sensitive access;
7. route expert output back into the same evidence/audit workflow.

The current quality-to-expert adapter creates only a Grid demand object and deliberately excludes patient facts and evidence references.

## 9. Business model direction

This architecture supports:

- Quality Readiness assessments;
- care-gap operations;
- monthly expert oversight;
- fractional quality/compliance/RCM leadership;
- denial and revenue rescue;
- credentialing cleanup;
- authorization backlog services;
- interoperability and migration specialists;
- implementation specialists;
- fixed-price expert packages;
- bounded expert review;
- expert subscriptions;
- organization/network consulting teams;
- expert-created governed templates after review;
- Clinic OS + Grid + Intelligence expansion from the initial engagement.

Professional-services economics, referral arrangements, transaction fees, and compensation structures remain subject to legal/commercial review where healthcare law may apply.

## 10. Knowledge-to-product flywheel

Expert work should reveal repeatable operational structure without turning private client information or expert proprietary materials into ungoverned product data.

The flywheel is:

`EXPERT WORK → REPEATED PATTERN → GOVERNED PRODUCT DISCOVERY → RULE / WORKFLOW TEMPLATE → VALIDATION → SOFTWARE AUTOMATION → SMALLER EXCEPTION QUEUE → HIGHER EXPERT LEVERAGE`

This lets Klinikos make scarce expertise more accessible while keeping humans responsible for judgments that require professional authority.

## 11. Maximum-scope assurance families

The same foundation should eventually support:

### Quality
Population attribution, care gaps, evidence completeness, quality deadlines, patient outreach, provider review, audit readiness, program reporting readiness.

### Revenue
Eligibility/benefits readiness, charge/claim readiness, missing documentation, denial risk, timely filing, unresolved claims, underpayment investigation, collections and recovery workflows.

### Prior authorization
Requirement detection, document checklist, packet readiness, submission state, payer requests, denial/appeal, expiration, appointment linkage.

### Credentialing
License/certification/malpractice/privilege/enrollment evidence, expirations, sanctions screening, recredentialing and Grid eligibility consequences.

### Referral and results
Referral sent, accepted, scheduled, completed, result received, acknowledged, released where permitted, patient notified and loop closed.

### Compliance/privacy
Training, policy evidence, access reviews, vendor/BAA evidence, incidents, retention/legal hold, consent and release requirements.

### Inventory/supply
Lot/serial/expiration, recalls, wastage, storage, required checks, reorder signals and patient/product traceability where appropriate.

### Workforce/capacity
Coverage, credentials, competencies, schedule gaps, room/equipment capacity, Grid demand and fulfillment.

### EDU
Competency requirements, placement evidence, instructor review, certificate eligibility, continuing education and workforce route readiness.

### Security/reliability
Required control evidence, unresolved findings, incidents, recovery tests, access anomalies and operational resilience work.

## 12. Current implementation boundary

This candidate slice implements framework-level deterministic engines and tests for:

- governed rule evaluation;
- evidence freshness and tenant boundary checks;
- human-review-required closure states;
- Quality Guardian operational summaries and next actions;
- scheduled/event-driven assurance job contracts;
- expert capability matching with hard eligibility;
- quality-to-expert Grid demand creation without patient/evidence leakage.

It does **not** yet establish:

- a production CMS/NCQA/HEDIS/MIPS/ACO/Stars rule library;
- a certified EHR;
- legal HIPAA compliance;
- live payer/quality reporting connections;
- external primary-source credential verification;
- expert BAA automation;
- persistent assurance-plan/rule/evidence database models;
- a production Expert Workbench UI;
- external expert payment settlement;
- autonomous clinical or compliance decisions.

Those remain explicit future implementation slices.

## 13. Wiring map

The target cross-engine wiring is:

`Clinic OS / Care / Billing / Grid / EDU EVENT`
→ `Assurance Monitor`
→ `Rules & Evidence Engine`
→ `Quality / Revenue / Credential / Authorization / Other Guardian`
→ `Next Action + Workflow + Human Review`
→ `Zumi explanation/orchestration`
→ `Internal staff when capable`
→ `Expert Grid demand when capability/capacity is missing`
→ `Engagement authorization + scoped access`
→ `Expert Workbench`
→ `Evidence / outcome`
→ `Audit + Financial OS + Insights`
→ `next route`

This is additive convergence over the existing orchestration fabric. It must not replace functioning domain authority with AI or duplicate existing Clinic OS, Grid, Financial OS, identity, authorization, audit, or workflow systems.
