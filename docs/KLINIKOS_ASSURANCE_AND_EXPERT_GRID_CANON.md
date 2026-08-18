# KLINIKOS — ASSURANCE, RULES & EVIDENCE, QUALITY GUARDIAN, AND EXPERT GRID CANON

Version: `2026-08-18.3`
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

Cross-organization or unscoped evidence must never silently satisfy another tenant's rule. Alternative evidence rules may use explicit `any` closure semantics; mandatory bundles use `all`.

## 4. Existing persisted quality truth

Klinikos already contains persistent `QualityMeasure`, `QualityGap`, and `PatientQualityStatus` models. The current candidate reuses those existing tables instead of inventing a parallel quality store.

The first production-shaped loader intentionally has narrow semantics:

- it reads only unresolved `QualityGap` rows for the active organization;
- it checks canonical `quality:read` RBAC before querying;
- it maps matching organization-scoped `QualityMeasure` metadata where available;
- it never converts a legacy `QualityGap` row into `satisfied` evidence;
- it treats missing measure mappings as visible unresolved work rather than dropping them;
- it is bounded to 2,000 active gap rows and fails closed instead of reporting a partial aggregate when that bound is exceeded;
- it states explicitly that the resulting view is the persisted active gap backlog, not population-wide program calculation.

The existing tables do not by themselves establish CMS, NCQA, HEDIS, MIPS, ACO, Stars, payer-contract, or legal-compliance truth. Versioned rule packages, source/licensing governance, attributable evidence, denominator/numerator logic, exclusions, and program-specific validation remain separate work.

## 5. Assurance Monitor

Klinikos may monitor configured rule families on scheduled, event-driven, or hybrid triggers.

The monitor creates bounded workflow jobs and minimum-necessary domain events. It does not send private operational context to a public research provider and does not call a model to decide whether a rule is satisfied.

Representative assurance families include:

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

The current foundation provides deterministic plan/job/event contracts. Durable assurance-plan configuration and generalized cross-domain rule-package persistence remain later slices.

## 6. Zumi Quality Guardian

Quality Guardian consumes deterministic Rules & Evidence evaluations and the bounded adapter over the existing persisted active quality-gap backlog. It can produce:

- counts of applicable/open quality work;
- open gaps;
- review-required work where deterministic policies require it;
- overdue work;
- due-soon work;
- prioritized Klinikos next actions;
- human-review queue adapters;
- a Zumi-ready operational brief.

Quality work reuses canonical RBAC permissions through `quality:read`, `quality:update`, and `quality:manage`. Regulated closure remains review-required even when the caller has management permission.

The authenticated `/api/zumi` route now conditionally loads Quality Guardian context server-side for deterministic quality-related questions. The load is separate from client-supplied `context`. Client JSON is never accepted as quality/compliance truth.

The trusted Zumi bridge rechecks tenant/permission boundaries and exposes only aggregate state plus safe action metadata. Subject identifiers and evidence references are not included in model-visible Quality Guardian context. When trusted operational quality context is present, public-web research is disabled for that turn so private operational state is not combined with the public-research path.

`quality_guardian` is therefore an active internal Zumi capability for the bounded persisted unresolved backlog. That active status must not be misrepresented as a complete population-health or external quality-program engine.

Quality Guardian must not claim that Klinikos supports a specific HEDIS, CMS, NCQA, MIPS, ACO, Stars, or payer program merely because the generic engine exists. Program support requires a separately verified rule package, data contract, source/licensing posture where applicable, tests, human validation, and production evidence.

## 7. Internal capability state

Internal quality capability is tri-state:

- `true`: an authorized internal capability is available and work stays internal;
- `false`: a governed determination says required internal capability/capacity is unavailable and Expert Grid escalation may be prepared;
- `unknown`: Klinikos has not established whether the organization has the required capability, so outside paid work is not created.

Unknown state must never be interpreted as a commercial trigger.

## 8. Expert Grid

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

Hard match dimensions include requested capability/domain, availability, jurisdiction where applicable, required verified evidence, conflict-of-interest policy, compatible delivery mode, configured data-access compatibility, and configured price boundaries where used. Soft reputation, experience, outcome, or price scores can never override failed hard eligibility.

## 9. Quality-to-Expert Grid escalation

Klinikos should not create paid outside work when an authorized internal team can resolve the issue.

Preferred sequence:

1. deterministic engine identifies governed work;
2. Zumi explains and prepares it;
3. internal authorized staff receive the work first;
4. only an explicit governed `false` for internal capability may produce Expert Grid demand;
5. Grid matches eligible experts or expert organizations;
6. engagement terms, conflicts, required agreement evidence, and scoped authorization are completed before sensitive access;
7. expert output returns to the same evidence/audit workflow.

The current quality-to-expert adapter creates organization/rule/version-scoped Grid demand, excludes patient identifiers, facts, and evidence references, and routes the user through the existing `grid.request.create` capability. Duplicate patient-level exceptions for the same organization/rule/version collapse into one expert demand opportunity for orchestration purposes rather than leaking subject identity into marketplace state.

## 10. Expert engagement and data access

The safe sequence is:

`NEED → MATCH → TERMS → CONFLICT CHECK → PURPOSE → GOVERNED AGREEMENT EVIDENCE → SCOPED AUTHORIZATION → MINIMUM-NECESSARY DATA ROOM → EXPERT WORK → EVIDENCE / DELIVERABLE → REVIEW → COMPLETION → FINANCIAL / AUDIT STATE`

No matched expert receives PHI merely because Grid selected them.

An engagement may activate only when the selected expert passed matching eligibility, both parties accepted terms, conflict review is clear, purpose is specific, the authorization window is valid, required capability is included, the configured data-access class exactly matches the governed need, minimum-necessary scope is defined, explicit scoped authorization exists when data access is required, and every agreement-evidence key required by the governed need is satisfied.

Agreement requirements come from the governed Expert Grid need/policy. An engagement cannot bypass them by self-declaring that an agreement is unnecessary.

An active-state flag alone is not sufficient authority for data access. The scoped-access grant path revalidates current match, need, agreement, time-window, and data-scope policy before producing an authorization envelope. The envelope contains permission scope, not patient data. Canonical repositories must still enforce tenant, resource, consent/release, and minimum-necessary rules on every read.

A production Expert Workbench should consume these same engagement-scoped, time-bounded, tenant-bound, purpose-bound, and capability-bound rules.

## 11. Business model direction

This architecture supports Quality Readiness assessments, care-gap operations, monthly expert oversight, fractional quality/compliance/RCM leadership, denial and revenue rescue, credentialing cleanup, authorization backlog services, interoperability and migration specialists, implementation specialists, fixed-price expert packages, bounded expert review, expert subscriptions, organization/network consulting teams, governed expert-created templates, and expansion from an initial expert engagement into Clinic OS + Grid + Intelligence.

Professional-services economics, referral arrangements, transaction fees, and compensation structures remain subject to legal/commercial review where healthcare law may apply.

## 12. Knowledge-to-product flywheel

Expert work should reveal repeatable operational structure without turning private client information or expert proprietary materials into ungoverned product data.

`EXPERT WORK → REPEATED PATTERN → GOVERNED PRODUCT DISCOVERY → RULE / WORKFLOW TEMPLATE → VALIDATION → SOFTWARE AUTOMATION → SMALLER EXCEPTION QUEUE → HIGHER EXPERT LEVERAGE`

This lets Klinikos make scarce expertise more accessible while keeping humans responsible for judgments that require professional authority.

## 13. Maximum-scope assurance families

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
Training, policy evidence, access reviews, vendor/agreement evidence, incidents, retention/legal hold, consent and release requirements.

### Inventory/supply
Lot/serial/expiration, recalls, wastage, storage, required checks, reorder signals and patient/product traceability where appropriate.

### Workforce/capacity
Coverage, credentials, competencies, schedule gaps, room/equipment capacity, Grid demand and fulfillment.

### EDU
Competency requirements, placement evidence, instructor review, certificate eligibility, continuing education and workforce route readiness.

### Security/reliability
Required control evidence, unresolved findings, incidents, recovery tests, access anomalies and operational resilience work.

## 14. Current implementation boundary

This candidate slice implements framework-level deterministic engines and focused tests for:

- governed rule evaluation, version/effective windows, and applicability predicates;
- evidence freshness, exact tenant scope, and `all`/`any` closure semantics;
- human-review-required closure states;
- Quality Guardian summaries, priority/due-state handling, and permission-gated next actions;
- scheduled/event-driven assurance job and minimum-necessary event contracts;
- reuse of existing `QualityMeasure`/`QualityGap` persistence for a bounded active-gap loader;
- tenant/RBAC-scoped server-side quality loading on relevant Zumi turns;
- trusted Zumi quality orchestration and safe model-visible aggregate/action projection;
- public-research separation when private Quality Guardian operational context is present;
- Expert Grid capability matching with hard eligibility;
- internal-capability tri-state that prevents unknown state from producing paid outside work;
- quality-to-expert Grid demand creation without patient/evidence leakage;
- governed agreement requirements carried from the Expert Grid need into engagement activation;
- expert engagement readiness, scoped authorization envelopes, access-time policy revalidation, and attributable deliverable completion/review states.

It does **not** yet establish:

- a production CMS/NCQA/HEDIS/MIPS/ACO/Stars rule library;
- population-wide numerator/denominator/exclusion calculation from authoritative program specifications;
- complete first-class evidence provenance storage for new rule evaluations;
- a certified EHR;
- legal HIPAA compliance;
- live payer/quality reporting connections;
- external primary-source credential verification;
- automatic generation/execution of BAAs or other legal agreements;
- generalized persistent AssuranceMonitorPlan or ExpertEngagement storage;
- a production Quality Command Center or Expert Workbench/data room UI;
- automatic outside expert selection, contracting, or payment;
- external expert payment settlement;
- autonomous clinical or compliance decisions.

Those remain explicit future implementation slices.

## 15. Wiring map

The target cross-engine wiring is:

`Clinic OS / Care / Billing / Grid / EDU EVENT`
→ `Assurance Monitor`
→ `Rules & Evidence Engine`
→ `Quality / Revenue / Credential / Authorization / Other Guardian`
→ `Next Action + Workflow + Human Review`
→ `Trusted Zumi orchestration`
→ `Internal staff when capable`
→ `Expert Grid demand only when missing capability/capacity is established`
→ `Expert match`
→ `Terms + conflict + governed agreement evidence`
→ `Scoped authorization + minimum-necessary repository projection`
→ `Expert Workbench / governed expert work`
→ `Evidence / deliverable / organization review`
→ `Audit + Financial OS + Insights`
→ `next route`

This is additive convergence over the existing orchestration fabric. It must not replace functioning domain authority with AI or duplicate existing Clinic OS, Grid, Financial OS, identity, authorization, audit, or workflow systems.
