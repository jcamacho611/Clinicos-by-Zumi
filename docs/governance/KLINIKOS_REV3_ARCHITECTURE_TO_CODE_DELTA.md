# KLINIKOS REV3 ARCHITECTURE-TO-CODE DELTA

**Date:** 2026-08-29  
**Authority class:** `EVIDENCE_REGISTER / IMPLEMENTATION_DELTA`  
**May override Master Canon:** No  
**May override canonical engineering blueprint:** No  
**Supreme product/company authority:** `docs/KLINIKOS_MASTER_CANON.md`  
**Canonical engineering contract to update in place:** `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md`

## 0. Purpose

This file records the verified architecture-to-code delta needed to turn the approved five-plane Klinikos architecture into implementation without rebuilding kernels that already exist or misrepresenting partial work as live.

It is deliberately subordinate. The required end state is **not** a second blueprint. The existing master engineering blueprint must absorb these corrections and become rev3; this register then remains evidence/provenance for why those changes were made.

Permanent hierarchy:

`MASTER CANON → MASTER ENGINEERING BLUEPRINT → CURRENT VERIFIED IMPLEMENTATION → ROUTES / SCREEN CONTRACTS / DOMAIN CONTRACTS / TESTS → GENERATED VIEWS`.

The five planes remain the top-level ecosystem model:

1. Healthcare Universe Plane
2. Economic & Resource Plane
3. Lifecycle Plane
4. Operating Infrastructure Plane
5. Compounding Business Plane

The canonical ecosystem graph is connective tissue across the five planes; it is not a sixth plane.

---

# 1. Required rev3 corrections to the existing blueprint

## R3-001 — Dual status everywhere

Every material capability, resource class, route, integration, partner, revenue stream, and sector must distinguish:

- `strategy_state`: `NOW | NEXT | LATER | PARTNER | CONNECT | INTERNALIZE | NEVER_BUILD`
- `implementation_state`: `LIVE_VERIFIED | BUILT_NEEDS_VERIFICATION | PARTIAL | DESIGNED | PLANNED | EXTERNAL_CONNECTION_REQUIRED | LEGAL_REVIEW_REQUIRED | NOT_BUILT | HISTORICAL_ONLY`
- `evidence_paths`
- `external_dependencies`
- `legal_security_gates`

`NOW` means strategic priority, not production-live.

## R3-002 — One Person is target architecture, not current implementation truth

Target law remains one Person with many simultaneous relationships, projections, contexts and authority states.

Current implementation still contains domain-oriented identity structures such as User, Patient and Provider. Therefore one-Person identity is `PARTIAL`, not `LIVE_VERIFIED`.

Migration law:

`ADD CANONICAL PERSON / MEMBERSHIP / RELATIONSHIP LAYER → LINK EXISTING USER/PATIENT/PROVIDER RECORDS → BACKFILL → DUAL-READ/WRITE WHERE NEEDED → MIGRATE PROJECTIONS → REMOVE DUPLICATE AUTHORITY ONLY AFTER VERIFIED`.

Do not big-bang replace working clinical/provider/account data.

## R3-003 — Profile projections

A Person may project into:

- private identity/account;
- learner profile;
- professional profile;
- organization membership/role;
- patient/care relationship;
- Grid public/network projection;
- instructor/preceptor projection;
- expert projection;
- owner/operator projection.

A projection is not a new identity and cannot widen authority.

## R3-004 — Resume / career evidence

Résumé content is an evidence-bearing career artifact and claim source.

Flow:

`UPLOAD RESUME → EXTRACT STRUCTURE → CREATE CLAIMED EDUCATION / EXPERIENCE / SKILL DRAFT → HUMAN CONFIRMATION → PROFILE PROJECTION → INDEPENDENT VERIFICATION WHERE REQUIRED`.

Resume parsing must never manufacture employment, license, credential, result, title, experience, metric or authority.

Reuse the existing EDU career-readiness truth rules rather than inventing a second résumé policy.

## R3-005 — Screen Contract status correction

Screen Experience Contracts are no longer “not authored.” The repository contains material contracts for protected/auth entry, public discovery, Grid, EDU learner/instructor, patient, provider, Current Visit, clinical handoff, billing, owner operations, enterprise, organization verification and telemedicine, with source-path release bindings.

Rev3 should classify Screen Contracts as `BUILT_NEEDS_VERIFICATION / PARTIAL` and focus remaining work on:

- complete route coverage;
- server/runtime enforcement;
- route→contract uniqueness;
- context-switch recomputation;
- browser/minimum-necessary tests;
- exact-head release verification.

## R3-006 — Grid production status correction

Universal Grid is materially built, not a staffing-only prototype. Existing contracts include generic demand, resource, composition, contextual eligibility, offer/transaction states, external participant enrollment, Clinic→Grid bridge and EDU→Grid bridge.

However generic demand/resource repositories explicitly retain demo/production-review gates. Therefore universal Grid is not automatically `LIVE_VERIFIED` for real regulated use.

Use `PARTIAL / BUILT_NEEDS_VERIFICATION` until production gates, migrations, real-data boundaries, policy and runtime evidence pass.

## R3-007 — No second marketplace

Do not create separate marketplace engines for:

- staffing;
- med-spa commerce;
- clinical placements;
- preceptors;
- rooms/chairs;
- equipment;
- products/supplies;
- expert services;
- organization capacity;
- projects/contracts.

Extend Grid demand/resource/composition/eligibility/offer/fulfillment primitives with class-specific policy and experience projections.

## R3-008 — Grid persistence convergence

The repository contains older domain-specific Grid persistence and newer universal Grid record/repository machinery. Before adding new tables, Codex must inventory both representations and choose a migration/adapter path.

Permanent rule: **NO THIRD GRID PERSISTENCE MODEL.**

## R3-009 — Eligibility before ranking/reputation

Eligibility is deterministic and contextual:

`PERSON + ACTIVITY + JURISDICTION + CREDENTIAL + MALPRACTICE + FACILITY + TIME + POLICY → ELIGIBLE / INELIGIBLE`.

Only eligible candidates/resources enter ranking.

Reputation can influence ranking, never eligibility.

## R3-010 — Transaction state separation

Replace any simplified `MATCH → MONEY` language with:

`NEED / RESOURCE → REQUIREMENTS → ELIGIBILITY → MATCH → OFFER / QUOTE → AGREEMENT → RESERVATION / ASSIGNMENT / ORDER / APPOINTMENT → FULFILLMENT → EVIDENCE → FINANCIAL OBLIGATION WHERE APPLICABLE → PAYMENT / PAYABLE / PAYOUT / SETTLEMENT → RECONCILIATION → OUTCOME → REPUTATION`.

Not every resource class has a money event.

## R3-011 — Regulated commerce separation

`PERMITTED RETAIL / GENERAL SUPPLY` may use ordinary governed Grid Commerce after seller/resource review.

`REGULATED PRODUCT / CLINICAL INVENTORY` remains private Clinic/inventory truth unless a dedicated lawful custody, storage, participant-eligibility, procurement and transfer pathway is explicitly approved.

Injectables and medications must not become ordinary public marketplace products by default.

## R3-012 — Patient privacy / private demand

Patients may consume care capacity and use matching/discovery primitives without becoming publicly discoverable Grid supply/demand profiles.

Patient-care demand is private/governed. Public Grid publication must never expose PHI or infer patient identity from narrow clinical demand.

## R3-013 — EDU / placement status correction

EDU core is substantial: program/cohort/course/enrollment/simulation/assessment/competency/human-review concepts exist, and EDU→Grid placement-readiness bridging exists.

Missing/partial pieces include:

- canonical persisted CareerArtifact/resume structure;
- complete learner profile projection;
- complete multi-party Placement relationship lifecycle;
- school/site/preceptor approval state;
- placement hours/evidence/completion graph;
- post-graduation transition into verified professional projection.

Build these on existing EDU + Grid composition, not beside them.

## R3-014 — RN → injector path correction

The current Grid eligibility engine already distinguishes activities such as performing aesthetic injection, supervising injection, RN service, NP service, medical direction, precepting and facility hosting.

Therefore the injector path is primarily **EXTEND / CONNECT**, not greenfield.

Preserve:

`EDU EVIDENCE → PROFESSIONAL PROFILE → REAL LICENSE/CREDENTIAL/MALPRACTICE → ACTIVITY-SPECIFIC ELIGIBILITY → JURISDICTION/SUPERVISION/FACILITY CHECK → OPPORTUNITY → FULFILLMENT → EVIDENCE / REPUTATION`.

Training never creates authority.

## R3-015 — Med-spa is a cross-plane proof case

Med spa is not a parallel product universe. It composes:

- Clinic OS operations;
- patient/client CRM;
- leads/consult/booking/follow-up/rebooking;
- services/packages/memberships;
- provider professional eligibility;
- rooms/chairs/locations;
- equipment;
- permitted products;
- restricted inventory;
- Grid staffing/resource demand/supply;
- EDU/preceptor/site capacity;
- Financial OS;
- Quality/Expert escalation.

Never create a separate med-spa marketplace kernel.

## R3-016 — Quality Guardian + Expert Grid

Reuse persisted quality measure/gap/status structures where present.

Extend with one governed escalation path:

`RULE / EVIDENCE SIGNAL → ZUMI EXPLANATION / PRIORITIZATION → INTERNAL RESOLUTION → EXPERT NEEDED → GRID EXPERT DEMAND → VERIFIED ELIGIBLE EXPERT → SCOPED ENGAGEMENT → MINIMUM-NECESSARY ACCESS → HUMAN FINDING → AUTHORIZED REMEDIATION → EVIDENCE / OUTCOME / ASSURANCE`.

Expert demand without expert supply/engagement is `PARTIAL`.

## R3-017 — Current Visit / clinical convergence

Preserve Current Visit as the provider-facing clinical convergence surface:

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → CLOSE VISIT`.

Preserve longitudinal truth `INITIAL → PREVIOUS → TODAY` with explicit change state.

AI can draft/explain but cannot invent findings, sign, independently order/prescribe, finalize coding or close regulated work without authority.

## R3-018 — Telemedicine correction

Telemedicine remains an encounter modality inside Current Visit.

Klinikos should own readiness, consent, same-encounter context, documentation, tasks, post-visit workflow and audit.

Video/media transport is `CONNECT / PARTNER` unless current verified runtime proves otherwise. Do not build a video conferencing infrastructure company.

## R3-019 — External clinical rails

Klinikos owns workflow continuity and internal state but should connect authoritative external rails for:

- lab transport/results;
- imaging/RIS/PACS;
- pharmacy/eRx;
- payer eligibility/status/prior authorization where applicable;
- clearinghouse claim transport/ERA;
- license/credential verification;
- malpractice verification;
- enterprise identity;
- communications.

Integration state must remain evidence-based.

## R3-020 — RCM correction

Internal RCM substrate is substantial and should be reused where current schema/code confirms it.

Preserve distinct truth states:

`PERFORMED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → CLAIM SENT → ACCEPTED → ADJUDICATED → REMITTANCE → PATIENT RESPONSIBILITY → PAID → RECONCILED`.

External payer/clearinghouse completion remains `CONNECT / EXTERNAL_CONNECTION_REQUIRED` until verified.

## R3-021 — OpenAI / Zumi truth

OpenAI remains the primary intelligence direction for Zumi under the governing Canon, with provider abstraction retained.

Do not claim partner tier, co-sell, credits, special access, PHI eligibility or other benefits unless evidence proves them.

PHI processing requires exact approved AI rail, organization/user authority, minimum-necessary scope, screen contract, applicable BAA/contract and runtime configuration.

Current AI processing policy is counsel-gated; do not convert a partnership relationship into compliance authority.

## R3-022 — Pricing correction

Do not call the $500 Clinic Operating Analysis free.

Commercial progression currently intended by executable commercial contracts:

`FREE DISCOVERY / DIAGNOSTIC PREVIEW → $500 CLINIC OPERATING ANALYSIS → $1,500 IMPLEMENTATION BLUEPRINT → $3,500 WORKFLOW SPRINT WHERE CURRENT APPROVED REGISTRY SUPPORTS IT → $8K+ IMPLEMENTATION → RECURRING PLATFORM`.

Exact active prices remain delegated to current approved commercial registries, not duplicated as immutable Canon prose.

## R3-023 — Grid economics truth

Free entry and liquidity remain load-bearing.

Resource-class economics are asymmetric and legal-policy gated. Regulated clinical services and referrals do not inherit a generic platform percentage. Proposed fees do not become production charges without counsel evidence and server-owned active policy.

## R3-024 — Moat wording

Do not define defensibility as trapping customers.

Target moat:

`VERIFIED IDENTITY / RELATIONSHIP GRAPH + WORKFLOW EMBEDDING + CAPACITY GRAPH + TRANSACTION/EVIDENCE HISTORY + TRUST + INTEGRATIONS + DISTRIBUTION + INSTITUTIONAL RELATIONSHIPS + LONGITUDINAL OPERATIONAL MEMORY + OUTCOME EVIDENCE + NETWORK LIQUIDITY`.

Customers stay because Klinikos accumulates useful context and coordinated value while preserving lawful portability/offboarding.

## R3-025 — Evidence/retention wording

`APPEND-ONLY AUDIT HISTORY != STORE ALL SOURCE CONTENT FOREVER`.

Model separately:

- immutable event/audit evidence where required;
- source-data retention period;
- legal hold;
- deletion obligation;
- de-identification;
- correction/supersession;
- tombstone/proof of deletion where appropriate.

## R3-026 — Conditional compliance language

HIPAA, FERPA, BAA, NPI, supervision, prescribing, scope, credential, payer and other rules apply **where legally/contractually applicable**. Do not write one universal rule that falsely applies to every actor/resource/jurisdiction.

## R3-027 — Identity assurance

Do not build proprietary biometric infrastructure by default. If stronger identity proofing becomes necessary, prefer `PARTNER / CONNECT` unless measured economics/strategic control justify internalization.

---

# 2. Architecture-to-code decision map

| Five-plane capability | Current implementation evidence | Decision | Engineering consequence |
|---|---|---|---|
| Master Canon / Authority Map | `docs/KLINIKOS_MASTER_CANON.md`, `docs/KLINIKOS_AUTHORITY_MAP.yaml` | `REUSE` | Keep sole authority; never create peer doctrine |
| Master engineering blueprint | `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md` | `UPDATE_IN_PLACE` | Absorb this rev3 delta; do not create v3 sibling |
| One Person identity | Current auth/session and domain identities remain organization/domain oriented | `BUILD_INCREMENTALLY / GENERALIZE` | Add Person/membership/relationship substrate without destructive rewrite |
| Organization / Location | Existing organization/location domain is substantial | `REUSE / EXTEND` | Add multi-membership/active-context relationships as needed |
| Professional credential truth | Existing provider credential/malpractice/privilege data | `REUSE / EXTEND` | Move toward professional projection over Person; preserve evidence/history |
| Activity-specific eligibility | `src/lib/grid/eligibility.ts` | `REUSE / EXTEND` | Add activities/policy classes rather than a second eligibility engine |
| Grid demand | `src/lib/grid/demand-repository.ts`, demand contract | `EXTEND / HARDEN` | Remove demo-only limitation only after production/legal/security gates pass |
| Grid resources | `src/lib/grid/resource-rules.ts`, `resource-repository.ts` | `EXTEND / HARDEN` | Reuse universal class/policy/visibility machinery |
| Grid composition | `src/lib/grid/composition-engine.ts` | `REUSE / EXTEND` | Placement, staffing, clinical service, room rental already compose from shared slots |
| Grid offer/transaction state | `src/lib/grid/transaction-flow.ts` | `REUSE` | Preserve match/offer/reservation/fulfillment distinctions |
| External Grid enrollment | `src/lib/grid/external-participant-enrollment.ts` | `REUSE / VERIFY` | Maintain policy-class restrictions; no regulated generic path |
| Clinic → Grid | `src/lib/ecosystem/clinic-grid-bridge.ts` | `REUSE / EXTEND` | Add more operational demand/supply signals only when grounded in real records |
| EDU → Grid | `src/lib/ecosystem/edu-grid-bridge.ts` | `REUSE / EXTEND` | Carry human-reviewed educational evidence into supervised placement demand, never licensure |
| Route catalog | `src/lib/paths/catalog.ts` | `EXTEND` | Add richer route metadata and cross-plane edges; do not create another route engine |
| Resume / CareerArtifact | Career-readiness policy exists; canonical persisted artifact not yet proven | `BUILD_IF_GAP_CONFIRMED` | TDD persisted artifact/claim projection after schema audit |
| Learner profile | EDU enrollment/competency data exists | `EXTEND` | Build one profile projection over current EDU evidence |
| Clinical placement | Grid composition template exists; complete persisted lifecycle still partial | `BUILD_ON_EXISTING` | Persist multi-party placement state; do not create placement marketplace |
| Preceptor | Eligibility/composition concept exists | `EXTEND` | Model as Person professional relationship/capability + availability |
| Patient/care | Existing patient/clinical schema + patient screen contracts | `REUSE / EXTEND` | Keep patient private; move toward Person linkage without destabilizing care records |
| Current Visit | Current Visit screen/clinical convergence contracts exist | `REUSE / EXTEND` | Add only proven gaps; no second encounter editor |
| Telemedicine workflow | Telemedicine Screen Contract exists | `EXTEND` | Same encounter; connect media rail |
| Video/media transport | No complete verified production rail established by this audit | `CONNECT` | Integrate approved provider; do not rebuild transport stack |
| Lab internal state | lab order/result/event structures exist | `REUSE` | Preserve internal workflow/obligation truth |
| Lab external rail | Integration boundary | `CONNECT` | Vendor/interface adapters + status/evidence |
| Imaging internal state | imaging order/result/event structures exist | `REUSE` | Preserve internal state |
| Imaging/PACS rail | External authority | `CONNECT` | Integrate; do not rebuild PACS/RIS |
| Pharmacy/eRx | Internal medication/clinical context exists | `CONNECT` | External authoritative eRx/pharmacy rail |
| Referrals | referral + referral event structures exist; Clinic→Grid leakage signal exists | `REUSE / EXTEND` | Cross-org continuity + private demand; no referral fee shortcut |
| RCM internal | claim/payment/denial/remittance/insurance/balance structures exist | `REUSE / EXTEND` | Make state machine explicit and connect to Current Visit |
| Clearinghouse | External authoritative transport | `CONNECT / NEVER_REBUILD` | Integration adapter/state/reconciliation only |
| Payer systems | External authoritative adjudication | `CONNECT / NEVER_REBUILD` | Consume eligibility/status/remit data; never pretend Klinikos is payer authority |
| Inventory | Existing inventory structures plus Grid product policy | `REUSE / EXTEND` | Separate stock truth from commerce projection |
| Med-spa commerce | Existing clinic/provider/lead/inventory/Grid primitives | `EXTEND` | Cross-plane proof case, not separate marketplace |
| Quality | Existing quality measure/gap structures per repo evidence | `REUSE / EXTEND` | Deterministic rules/evidence; human closure |
| Expert Grid | Demand concept exists; complete supply/engagement not yet proven | `BUILD_ON_GRID` | Expert profile, eligibility, scoped engagement, minimum-necessary access, evidence |
| Network | Existing network/relationship surfaces | `REUSE / EXTEND` | Persistent governed relationship edges, not public exposure by default |
| Integration Hub | Existing `Integration`/event concepts | `EXTEND` | Standardize PLANNED→CONTRACTING→SANDBOX→CONNECTED→UAT→LIVE→MONITORED evidence states |
| Zumi/OpenAI | OpenAI Responses adapter + processing policy | `REUSE / VERIFY / GOVERN` | Keep provider abstraction, cost controls, PHI gates and deterministic authority |
| Screen Contracts | `src/lib/screen-experience-contracts.ts`, source registry | `REUSE / VERIFY / ENFORCE` | Complete coverage and server/runtime enforcement |
| Company OS | `src/lib/company-operating-canon.ts` and execution-control machinery | `EXTEND` | Add missing initiative/ICP/attribution/health/partner/scale/value contracts; no v2 OS |
| Canonical ecosystem graph | No single machine graph proven by this audit | `BUILD` | One node/edge/status registry that generates multiple views |
| Five-plane master visual | Human-designed artifact | `GENERATE_FROM_GRAPH` | Visual is projection, never authority |
| Licensing boards / DEA / authoritative credential sources | External institutions | `CONNECT / NEVER_REBUILD` | Verification adapters/evidence only |
| Public patient marketplace profile | Conflicts with privacy/Canon | `NEVER_BUILD` | Patient needs stay private/governed |

---

# 3. Canonical ecosystem graph target

The machine graph must describe the connections among the five planes without becoming a sixth authority.

## 3.1 Core node families

- `Actor`
- `Person`
- `Account`
- `Organization`
- `Location`
- `Relationship`
- `Claim`
- `Evidence`
- `Verification`
- `Credential`
- `AuthorityDecision`
- `Purpose`
- `Consent`
- `Demand`
- `Resource`
- `Requirement`
- `EligibilityDecision`
- `Match`
- `Opportunity`
- `Offer`
- `Agreement`
- `Reservation`
- `Assignment`
- `Order`
- `Appointment`
- `Encounter`
- `LearningActivity`
- `Placement`
- `Fulfillment`
- `Task`
- `Obligation`
- `ClaimFinancial`
- `Payment`
- `Payable`
- `Payout`
- `Settlement`
- `Reconciliation`
- `Outcome`
- `ReputationEvidence`
- `Memory`
- `Knowledge`
- `Integration`
- `PartnerRelationship`
- `Campaign`
- `Lead`
- `CommercialOpportunity`
- `Customer`
- `CapitalOpportunity`

Existing code/domain nouns should be reused where possible; this list is conceptual and must not trigger duplicate persisted models automatically.

## 3.2 Core edge families

`IS / HAS / BELONGS_TO / MEMBER_OF / WORKS_AT / LEARNS_AT / TEACHES_AT / PRECEPTS / SUPERVISES / AUTHORIZED_BY / VERIFIED_BY / CREDENTIALED_BY / OWNS / OPERATES / LOCATED_AT / OFFERS / NEEDS / REQUIRES / ELIGIBLE_FOR / MATCHES / INVITED_BY / AGREES_TO / RESERVES / ASSIGNED_TO / ORDERS / REFERS_TO / FULFILLS / DOCUMENTS / PROVES / BILLS / OWES / PAYS / RECEIVES / SETTLES / REVIEWS / TRUSTS / TRIGGERS / DEPENDS_ON / CONNECTS_TO / LEARNS_FROM / EXPANDS_TO`.

## 3.3 Universal lifecycle grammar

`INTENT → IDENTITY/CONTEXT → CLAIM → EVIDENCE → VERIFICATION → RELATIONSHIP → AUTHORITY → NEED/RESOURCE/WORK → REQUIREMENTS → ELIGIBILITY → DISCOVERY/MATCH/ROUTE → COMMUNICATION → OFFER/PLAN/QUOTE → AGREEMENT/CONSENT → RESERVATION/ORDER/ASSIGNMENT/APPOINTMENT → CARE/WORK/LEARNING/COMMERCE → FULFILLMENT → EVIDENCE → OBLIGATION WHERE APPLICABLE → CLAIM/PAYMENT/PAYABLE → SETTLEMENT/RECONCILIATION → OUTCOME → REPUTATION → MEMORY → INSIGHT → NEXT ACTION → RETURN/REFERRAL/EXPANSION`.

---

# 4. High-value cross-plane bridges

Priority is connecting existing kernels, not adding breadth for its own sake.

1. `PERSON / RELATIONSHIP → EXPERIENCE ENGINE`
2. `RESUME / CAREER CLAIMS → LEARNER / PROFESSIONAL PROFILE`
3. `EDU EVIDENCE → PLACEMENT DEMAND → GRID COMPOSITION`
4. `PLACEMENT FULFILLMENT → HOURS / COMPETENCY / COMPLETION`
5. `GRADUATION / EXTERNAL LICENSE → PROFESSIONAL PROJECTION`
6. `PROFESSIONAL PROFILE → ACTIVITY-SPECIFIC GRID ELIGIBILITY`
7. `CLINIC OS STAFFING GAP → GRID DEMAND`
8. `CLINIC UNUSED CAPACITY → GRID RESOURCE`
9. `CLINIC INVENTORY → PERMITTED GRID COMMERCE PROJECTION`
10. `CURRENT VISIT → LAB / IMAGING / PHARMACY / REFERRAL RAILS`
11. `CURRENT VISIT → RCM / FINANCIAL OS`
12. `QUALITY SIGNAL → INTERNAL REMEDIATION → EXPERT GRID`
13. `GRID FULFILLMENT → EVIDENCE → FINANCIAL OBLIGATION / PAYABLE WHERE APPLICABLE`
14. `FULFILLMENT / OUTCOME → REPUTATION → FUTURE RANKING`
15. `NETWORK RELATIONSHIP → FUTURE DISCOVERY / INVITATION`
16. `INTEGRATION EVENT → TASK / EXCEPTION → ZUMI PRIORITIZATION`
17. `CUSTOMER OUTCOME → CUSTOMER SUCCESS → CASE STUDY / REFERRAL`
18. `GRID SEARCH / DEMAND SIGNAL → MARKET INTELLIGENCE / PRODUCT PRIORITY`
19. `SALES OBJECTION / SUPPORT / CHURN → PRODUCT PRIORITY`
20. `REVENUE / CAPITAL → REINVESTMENT → PRODUCT / DISTRIBUTION`.

---

# 5. Recommended build order after Canon/blueprint convergence

## Stage A — Authority and rev3 truth

- update existing master engineering blueprint in place;
- preserve five-plane system;
- add dual status dimensions;
- reconcile current project-state snapshot;
- keep duplicate authorities unretired until migration proof is complete.

## Stage B — Canonical graph contract

TDD a machine-readable graph registry that references existing domain/route identifiers rather than introducing persistence.

Required generated lenses:

1. whole healthcare universe;
2. identity/trust;
3. patient/care;
4. Current Visit;
5. learner/EDU;
6. placement;
7. professional/career;
8. injector/aesthetics;
9. Grid exchange;
10. med-spa commerce/resource;
11. clinic operations;
12. RCM/money;
13. Quality/Expert;
14. organization/enterprise;
15. partner/integration;
16. Zumi/OpenAI;
17. security/privacy;
18. distribution;
19. retention/network effects;
20. capital/company OS;
21. data/evidence/memory.

## Stage C — Person / relationship substrate

Do this incrementally and migration-safe.

Test-first invariants:

- one Person may hold multiple org relationships;
- organization membership is not identity;
- Patient/Provider/User linkage never changes clinical or professional authority by itself;
- active context changes recompute visibility/authority;
- no cross-org data leakage;
- a self-claim never becomes verified relationship automatically.

## Stage D — Profile/career/placement convergence

Test-first:

- résumé claim remains unverified until evidence says otherwise;
- learner profile may include education evidence without publishing private fields;
- placement match does not equal school/site/preceptor approval;
- course completion does not equal licensure;
- post-graduation professional projection waits for external credential verification.

## Stage E — Grid / commerce / expert expansion

Extend current Grid kernels.

Test-first:

- ineligible participant cannot be ranked/selected for regulated activity;
- patient cannot become public supply;
- regulated product cannot use generic public commerce transaction path;
- referral routing cannot inherit generic transaction fee;
- Grid match does not create agreement/payment/fulfillment;
- med-spa and Expert Grid reuse universal resource/demand primitives.

## Stage F — Cross-organizational clinical + financial continuity

Test-first:

- outbound order and inbound result stay linked;
- result creates review/follow-up obligation where policy requires;
- telemedicine does not create duplicate encounter/chart;
- claim states do not advance from AI inference;
- external integration status cannot be represented live without evidence;
- payer/clearinghouse remain external authority.

## Stage G — Company compounding contracts

Extend existing company operating contract with:

- initiative validation;
- ICP/segment score;
- competitor watch;
- sales-stage exits;
- attribution;
- customer health;
- churn/win-back;
- partner states;
- capital prioritization;
- 90-day execution scoring;
- scale test;
- unicorn test;
- Value Graph.

Do not create a second Company OS.

## Stage H — Generated five-plane views

Only after graph/route/status contracts are stable:

- generate master five-plane ecosystem map;
- generate domain lenses from same graph;
- embed graph/version/source SHA in visual metadata;
- prevent manually edited diagrams from being treated as authority.

---

# 6. Mandatory invariants

These are release-blocking laws for applicable code:

1. `CLAIM != VERIFIED FACT != AUTHORITY`.
2. `PAYMENT != AUTHORITY`.
3. `SUBSCRIPTION != PROFESSIONAL ELIGIBILITY`.
4. `COURSE COMPLETION != LICENSE / CREDENTIAL AUTHORITY`.
5. `MATCH != AGREEMENT != FULFILLMENT != PAYMENT != SETTLEMENT`.
6. Hard eligibility precedes ranking.
7. Patient identity/demand is not public marketplace supply.
8. Unverified professional cannot publish governed professional service availability.
9. Regulated inventory cannot silently enter generic commerce.
10. AI cannot sign clinical records, finalize claims, settle money, create credentials or override authorization.
11. Organization claim does not grant organization authority.
12. Context switch cannot preserve stale data/permissions from prior context.
13. External integration/partner status cannot manufacture a live capability claim.
14. Public/browser DTOs cannot expose crown-jewel/server-only policy or minimum-necessary restricted data.
15. Historical/retired docs cannot override Master Canon.

---

# 7. Capital-efficiency law

For every proposed engineering addition ask in this order:

1. Can an existing kernel already express this?
2. Can it be implemented as a new policy/resource/activity/template/route rather than a new engine?
3. Can an external authoritative rail be connected instead of rebuilt?
4. Does the feature create measurable user value, revenue, retention, network liquidity, risk reduction or enterprise readiness?
5. Is the uncertainty high enough that a reversible experiment should precede durable infrastructure?

Default decision hierarchy:

`REUSE → EXTEND → GENERALIZE → CONNECT → PARTNER → BUILD NEW`.

`BUILD NEW` requires evidence that the first five cannot satisfy the requirement without unacceptable architectural, security, economic or product compromise.

---

# 8. Execution handoff contract

Before Codex changes implementation:

1. fetch latest remote branch;
2. inspect working tree and local unpushed work;
3. do not overwrite active parallel work;
4. update the existing master engineering blueprint to absorb this delta;
5. update current-project-state evidence to the exact new SHA/status;
6. use TDD for production-code changes;
7. run focused tests, then typecheck/lint/full relevant tests/build;
8. record external gates as external gates, not green claims;
9. do not retire duplicate governing docs until migration/content-loss verification passes;
10. do not merge to main until exact-head verification and review pass.

## Recommended Codex first implementation tranche

After rev3 documentation convergence, begin with:

`CANONICAL ECOSYSTEM GRAPH CONTRACT + TESTS`

before schema mutation.

Reason: it creates the machine-readable five-plane connection model, gives Person/Relationship migration and route expansion a stable target, and lets future diagrams/views derive from one graph without prematurely rewriting persistence.

Second tranche:

`PERSON / MEMBERSHIP / RELATIONSHIP MIGRATION DESIGN + TDD TESTS`, then minimal schema/migration implementation.

---

# 9. Completion definition for this delta

This delta is absorbed only when:

- the existing master engineering blueprint is rev3 and contains the corrected truths above;
- current project-state evidence reflects the exact branch head and current verification state;
- the machine-readable ecosystem graph exists with tests;
- major routes map to graph nodes/edges/statuses;
- Person/Relationship work follows a migration-safe design;
- Grid/EDU/Clinic/Clinical/Financial/Quality/Company OS reuse existing kernels;
- external rails remain evidence-gated;
- generated diagrams derive from the graph;
- duplicate governing docs remain subordinate/retired only after content-loss verification.

Until then this file remains an evidence register describing the outstanding convergence delta.
