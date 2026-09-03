# KLINIKOS Master Execution Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement subordinate plans task-by-task. This document is a portfolio-level IMPLEMENTATION_CONTRACT and execution router. It is subordinate to `docs/KLINIKOS_MASTER_CANON.md` and the Master Engineering Blueprint. It does not create product/company law.

**Goal:** Convert the founder-approved Living Healthcare Reality / recovered Klinikos scope into a traceable portfolio of independently shippable programs so no accepted requirement can disappear between Canon, UX, code, revenue, evidence, and release.

**Architecture:** Preserve exactly five canonical planes as constitutional substrate while projecting unlimited Realities, Mission Rooms, workspaces, maps, and precision applications above them. Every requirement maps through a mandatory execution record: source → Canon law → program → experience → domain objects → APIs/events → Zumi → money → authority/security → tests → dependencies → release wave → evidence/KPI. Existing kernels are reused before anything new is created.

**Tech Stack:** Current repository stack on `main`: Next.js 15.5.x, React 19, TypeScript, Prisma/PostgreSQL, Tailwind, Framer Motion, Stripe, Vitest; target spatial runtime may add Three.js / React Three Fiber only through the approved Living Reality program with semantic DOM fallback and server-owned truth.

**Spec:** `docs/KLINIKOS_MASTER_CANON.md` + `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md` + founder-approved Option C / Living Healthcare Reality direction.

## Current verified starting point — 2026-09-03

- `main` exact SHA at plan creation: `16f0824db888a9887eb3e9d0a304eb802cc58cb7`.
- `main` is currently not branch-protected; required status checks are not enforced at branch-protection level.
- PR `#524` is a draft spatial plan whose useful safety laws remain, but whose first-tranche `no Three.js / no R3F / no canvas` limit is superseded by the newer founder-approved true-3D final direction.
- PR `#519` is a draft commercial doctrine that allows free organization core participation; this conflicts with the newer founder law: **Person account is free; activated organization capability is commercial.** Do not merge it unchanged.
- Current repo already contains substantial identity, Living Universe, Current Visit, Grid, EDU, Financial OS, Zumi, company, billing, appointments, cases, coding, handoff, consent, and other API/domain substrates. This program is convergence and extension, not a rewrite.

## Global Constraints

1. **ONE KLINIKOS / ONE PERSON / ONE GRAPH / ONE ZUMI / ONE AUTHORITY MODEL.**
2. Exactly five canonical planes remain. Realities are projections, not new constitutional planes.
3. **Person account = free. Organization activation = commercial.** A free Person may claim or describe an organization; organization authority + activated operating capability requires evidence and an approved commercial path.
4. **Intelligence ≠ authority.** Zumi may understand, retrieve, draft, prepare, explain, recommend, stage, and materialize interface; deterministic policy + authorized humans/servers control consequential action.
5. **3D projects truth; 3D never owns truth.** Essential workflows remain usable via semantic DOM/precision UI.
6. **Simple above. Powerful below.** Never expose backend ontology/policy jargon when plain language can express the outcome.
7. **CLAIM ≠ EVIDENCE ≠ VERIFICATION ≠ ELIGIBILITY ≠ ENTITLEMENT ≠ AUTHORITY.**
8. **PRICE ≠ QUOTE ≠ CONTRACT ≠ INVOICE ≠ PAYMENT ≠ PAYOUT ≠ SETTLEMENT.**
9. **REUSE → EXTEND → GENERALIZE → CONNECT → PARTNER → BUILD NEW.** `BUILD NEW` is last.
10. Current implementation state and strategy state remain separate.
11. No fake supply, fake customers, fake payments, fake credentials, fake integrations, fake clinical truth, fake progress, or fake network density.
12. No PHI production claim without the production security/legal gate and exact runtime evidence.
13. Browser is inspectable. Proprietary orchestration, ranking, authority, risk, pricing logic, hidden prompts, and unnecessary sensitive data remain server-side.
14. Every real feature must complete: `VISIBLE UI → USER ACTION → IDENTITY/CONTEXT → AUTHORITY → DOMAIN ENGINE → REAL DATA → PERSISTENCE/EVENT → TRUTHFUL RESULT → AUDIT/FINANCIAL STATE → NEXT ACTION`.
15. No production implementation program begins without its own approved subordinate spec + detailed TDD implementation plan.

---

# 1. THE EXECUTION RECORD — MANDATORY TRACEABILITY UNIT

Every accepted scope requirement gets one `ExecutionRecord` in the machine-readable traceability ledger.

```ts
export type ExecutionRecord = {
  requirementId: string;
  sourceRefs: string[];
  canonRefs: string[];
  strategyState: "NOW" | "NEXT" | "LATER" | "PARTNER" | "CONNECT" | "INTERNALIZE" | "NEVER_BUILD";
  implementationState: "LIVE_VERIFIED" | "BUILT_NEEDS_VERIFICATION" | "PARTIAL" | "DESIGNED" | "PLANNED" | "EXTERNAL_CONNECTION_REQUIRED" | "LEGAL_REVIEW_REQUIRED" | "NOT_BUILT" | "HISTORICAL_ONLY";
  programId: string;
  realityIds: string[];
  journeyIds: string[];
  frameIds: string[];
  domainObjects: string[];
  routeOrApiContracts: string[];
  events: string[];
  zumiCapabilities: string[];
  monetizationClass: string[];
  authorityRules: string[];
  securityPrivacyRules: string[];
  legalExternalDependencies: string[];
  codeDisposition: "REUSE" | "EXTEND" | "GENERALIZE" | "CONNECT" | "PARTNER" | "BUILD_NEW";
  codeKernelRefs: string[];
  testContracts: string[];
  dependencies: string[];
  ownerRole: string;
  kpis: string[];
  evidenceRequired: string[];
  releaseWave: string;
};
```

**Required machine artifact:** `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml`.

A requirement is not considered reconciled until every non-empty field required by its class is populated and a reviewer can trace it into an implementation or explicit gap.

---

# 2. UNIVERSAL EXPERIENCE / 3D FRAME GRAMMAR

Every Living Reality composes from the same frame language. Programs select the frames they need; they do not invent another shell.

| Frame | Name | User meaning | Spatial behavior | Precision behavior |
|---|---|---|---|---|
| `F0` | Arrival | Where am I / what is this? | Cinematic environment establishes context | Semantic heading + primary action available immediately |
| `F1` | Intent | What needs to happen? | World listens; irrelevant context recedes | Search/input/voice/action controls |
| `F2` | Interpretation | What did Klinikos understand? | Relevant objects begin to materialize | Plain-language structured interpretation + editable fields |
| `F3` | Active Object | What are we working on? | Object moves to focal depth | Accessible object summary / status |
| `F4` | Relationships | What is connected? | Eligible/related objects orbit/connect; private data remains minimized | List/table/graph alternative |
| `F5` | Inspector | What is true / missing / blocked? | Evidence, state, and attention gravity surface | Details panel with provenance/authority/status |
| `F6` | Mission / Workspace | Do the work | Environment recedes; mission context remains | Forms, notes, tables, video, editors, claims, clinical work |
| `F7` | Governed Action | What can happen now? | Action surface becomes prominent only when allowed | Deterministic validation + confirmation |
| `F8` | Verified Outcome | What happened? | Completed work recedes / relationship graph updates | Receipt, audit state, outcome, errors/reconciliation |
| `F9` | Next Action | What should happen next? | Next unresolved object gains governed attention | One clear next step + alternatives |
| `F10` | Time | What changed? | Past / now / future lens; projections visibly distinct | Timeline / delta / effective-date views |
| `F11` | Regional / Network | Where is supply, demand, capacity? | Map/graph/heat topology | Map/list/table fallback |

**Performance modes:**
- `FULL_REALITY`: full approved spatial runtime.
- `BALANCED_REALITY`: reduced particles/post-processing/animation and lower GPU cost.
- `PRECISION_MODE`: semantic DOM-first, low motion, no essential WebGL dependency.

---

# 3. PROGRAM PORTFOLIO

## `P00` — Truth, Canon, Evidence & Release Governance

**Purpose:** Make it impossible for chats, stale branches, historical pricing, unverified integrations, or design prototypes to silently become product truth.

**Applications/Realities:** Company Command / Truth Registry / Evidence Register / Release Evidence.

**Primary journeys:** decision accepted → classified → traced → built → verified → deployed → evidence updated.

**Frames:** `F3 F5 F8 F9 F10`.

**Objects:** `Requirement`, `Decision`, `EvidenceArtifact`, `ImplementationState`, `StrategyState`, `ReleaseCandidate`, `DeploymentEvidence`, `Claim`.

**API/event contracts:** existing Company/administrative evidence routes where appropriate; add server-owned traceability read projection only if Company Command needs runtime access. Events: `RequirementAccepted`, `EvidenceAttached`, `ImplementationStateChanged`, `ReleaseVerified`.

**Zumi:** explain current truth, identify contradictions, never manufacture status.

**Money:** prevents false commercial claims and capital waste; no direct customer fee.

**Tests:** authority-map checks; historical/active price distinction; integration-status truth; exact deployed SHA; no draft counted as main.

**Dependencies:** none. This is Gate 0.

**Wave:** `W0`.

---

## `P01` — Living Reality Runtime / Black Label / True 3D

**Purpose:** Replace the presentation layer that is underselling Klinikos with a premium adaptive spatial system while preserving semantic truth and accessibility.

**Applications/Realities:** Public Living Home, Member Living Home, Grid spatial view, Network view, Mission Rooms, Texas Twin, selected executive views.

**Journeys:** arrive → state intent → see world react → focus object → inspect → complete precision work → verified result → next action.

**Frames:** all frames, especially `F0–F7`, `F10`, `F11`.

**Objects:** consumes presentation-safe projections of existing domain objects; no independent 3D business entities.

**Target contracts:** `RealityProjection`, `SpatialNodeProjection`, `SpatialEdgeProjection`, `AttentionProjection`, `PerformanceTier`, `CameraIntent`. Server returns minimum-necessary data only.

**Zumi:** interface composition / contextual materialization.

**Money:** conversion, perceived enterprise quality, sales demo power; 3D itself is not a billable moat.

**Tests:** no-WebGL fallback, reduced motion, keyboard, screen reader, 200% zoom, mobile 390px meaningful task, low-end GPU tier, PHI/minimum-necessary projection, visual regression, performance budgets.

**Dependencies:** `P00`; existing `UniverseShell/ObjectStage/Inspector/ActionDock`; design token authority. Reconcile/supersede PR #524 rather than blindly merge.

**Wave:** `W1` foundation, expands through `W6`.

---

## `P02` — Public Value, Free Person Growth & Signup Continuity

**Purpose:** Turn the public site into a useful first interaction and make free Person identity the acquisition engine.

**Applications:** Public Living Gateway, signup, member home, intent continuation.

**Journeys:** public intent → safe first value → save/continue → free Person → return to exact goal → first persistent outcome.

**Frames:** `F0 F1 F2 F3 F5 F8 F9 F11`.

**Objects:** `Person`, `Account`, `IntentEnvelope`, `PublicResult`, `SavedIntent`, `Invite`, `RelationshipClaim`.

**Existing kernels to reuse:** current public gateway, account signup, Person/Account identity, member projection, Grid public-safe result behavior.

**Target API families:** reuse `/api/account/signup`; extend existing public Zumi/intent resolver and member projection rather than adding a second signup/auth rail.

**Zumi:** interpret public intent, ask only missing questions, preserve bounded non-PHI continuation.

**Money:** no Person signup fee; creates network density and organization leads.

**Tests:** signup release gate, versioned legal acceptance, same-origin/rate limits, no PHI persistence from public context, intent resumes after auth, truthful empty/no-result states.

**Dependencies:** `P00`, `P01` for final presentation.

**Wave:** `W1`.

---

## `P03` — Identity, Trust, Relationships & Professional Passport

**Purpose:** One lifelong Person identity with claims/evidence/verification, professional history, organization relationships, patient/caregiver context, and role-safe projections.

**Applications:** Identity Reality, Professional Passport, Trust Reality, public-safe professional projection, private evidence vault.

**Journeys:** claim profession → submit evidence → verify → become eligible → find work; student → graduate → professional → owner → educator without duplicate accounts.

**Frames:** `F3 F4 F5 F6 F7 F8 F10`.

**Objects:** `Person`, `ProfessionClaim`, `Evidence`, `Verification`, `Credential`, `License`, `PersonRelationship`, `OrganizationMembership`, `LocationAssignment`, `CareerArtifact`, `Availability`.

**APIs/events:** extend current identity/access/consent routes; events `ClaimCreated`, `EvidenceSubmitted`, `VerificationChanged`, `CredentialExpiring`, `RelationshipChanged`.

**Zumi:** resume/CV assistance, evidence-gap explanation, credential expiry guidance, career next action. Never self-verify.

**Money:** Person base free; optional premium professional services later; organization/employer economics downstream.

**Tests:** claim ≠ verification, expired license removes eligibility, context switch recomputes access, public projection cannot leak private evidence, resume claims remain claimed.

**Dependencies:** `P00`, identity kernel.

**Wave:** `W2`.

---

## `P04` — Organization Claim, Commercial Activation & Configuration Fabric

**Purpose:** Convert individual participation into paid institutional value without creating organization forks.

**Applications:** Organization Reality, Organization Blueprint, Commercial Activation, Configuration Studio.

**Journeys:** Person says “I run a clinic/business” → preliminary blueprint → organization claim → authority evidence → qualification → offer → contract/payment evidence → configuration → provisioned active organization.

**Frames:** `F1–F9`.

**Objects:** `Organization`, `OrganizationClaim`, `OrganizationMembership`, `Location`, `Department`, `ConfigurationRegistry`, `CapabilityEntitlement`, `CommercialOffer`, `Contract`, `ImplementationEngagement`.

**APIs:** extend `/api/onboarding/organizations` so free Person cannot silently create activated organization authority; reuse pricing/checkout/billing rails; server-owned organization provisioning.

**Zumi:** interviews organization, structures configuration, prepares blueprint and implementation scope.

**Money:** paid organization activation; subscription/contract, implementation, integrations, usage/support as appropriate. Price states must be explicit.

**Tests:** unpaid/free Person cannot gain organization operating authority; verified payment alone cannot create authority; configuration inheritance; multi-location scope; entitlement vs authority separation.

**Dependencies:** `P03`, `P08` financial contracts, current organization onboarding.

**Wave:** `W2`.

---

## `P05` — Clinic Operations / Front Desk / Scheduling / Intake

**Purpose:** Give staff a calm operational system organized around unfinished work rather than modules.

**Applications:** Clinic Reality, Today, Front Desk, Schedule, Intake, Forms, Tasks, Communications.

**Journeys:** appointment request → scheduling → readiness → registration/intake → handoff → visit; no-show → waitlist/recovery; missing forms/insurance → clear blocker.

**Frames:** `F3 F4 F5 F6 F7 F8 F9 F10`.

**Objects:** `Patient`, `Appointment`, future `AppointmentSeries`, `Location`, `ProviderAssignment`, `FormDefinition`, `FormResponse`, `Task/Obligation`, `Handoff`, `Coverage`, `Consent`.

**APIs:** reuse appointments, care-handoffs, consent, patient/intake, communications routes; generalize only where current kernels cannot support series/capacity/readiness.

**Zumi:** summarize arrivals, missing prerequisites, callbacks, schedule friction, waitlist candidates.

**Money:** core organization software; measurable labor/no-show/revenue effects.

**Tests:** schedule conflicts, partial intake, expired consent, wrong tenant, reschedule/no-show, mobile front-desk task, truthful waitlist/availability.

**Dependencies:** `P03`, `P04`.

**Wave:** `W4`.

---

## `P06` — Full EHR / Current Visit / Clinical Change / Specialty Packs

**Purpose:** Make the provider experience radically simpler while supporting the full longitudinal clinical workflow.

**Applications:** Current Visit, Patient Snapshot, What Changed, Staff Handoff, BodyMap, Assessment & Plan, Documentation, Coding support, Close Visit, specialty packs.

**Golden journey:** `PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → CLOSE VISIT → FOLLOW-UP → BILLING READINESS`.

**Frames:** `F3 F5 F6 F7 F8 F9 F10`; 3D is minimal during dense clinical work.

**Objects:** existing `Patient`, `Encounter`, clinical components, BodyMap, medications/allergies, diagnoses, procedures, notes/versions, `ServiceOrder`, `Result`, `Referral`, clinical-change/evidence links, coding candidates.

**APIs:** extend existing encounter/coding/care-handoff/order/result kernels; do not create a second clinical record.

**Zumi:** What Changed, note drafting, dictation/ambient draft, documentation gaps, code candidates, result/referral summary. Human review/signature mandatory.

**Money:** clinic/EHR recurring value, specialty configuration, implementation, revenue-readiness expansion.

**Tests:** signed-note immutability, source/evidence provenance, BodyMap history not overwritten, omission ≠ resolution, coding candidate ≠ final code, fail-closed Close Visit, clinical authority negative tests.

**Dependencies:** `P03`, `P05`, `P07`, `P08`, production PHI gate in `P16`.

**Wave:** `W4`–`W5`.

---

## `P07` — Telemedicine, Orders, Results, Referrals, Prior Auth & Interoperability

**Purpose:** Prevent cross-organizational work from disappearing when external systems perform part of the lifecycle.

**Applications:** Telemedicine workspace, Integration Inbox/Outbox, Orders & Results, Referral closure, Prior Authorization, future eRx adapter.

**Journeys:** appointment → telehealth readiness → video → Current Visit → order → external service → result → review → patient/follow-up; referral → acknowledge → accept → schedule → consult result → close; prior auth → submit → status → approve/deny → downstream action.

**Frames:** `F3 F4 F5 F6 F7 F8 F9 F10`.

**Objects:** `ServiceOrder`, `OrderStatusEvent`, `Result`, `ResultVersion`, `ResultReview`, `Referral`, `AuthorizationCase`, `IntegrationMessage`, `MappingException`, `InboxEvent`, `OutboxEvent`.

**APIs/adapters:** connect through FHIR/HL7/DICOM/X12/NCPDP/approved vendor adapters; external rail lifecycle must expose `PLANNED/SANDBOX/UAT/PRODUCTION_VERIFIED/DEGRADED` truth.

**Zumi:** summarize status, prepare follow-up, explain blockers; cannot invent external success.

**Money:** integration packs, enterprise connectivity, implementation; prior-auth/revenue operational value.

**Tests:** vendor outage, duplicate inbound event, retry/idempotency, mapping exception, critical result handling, external status truth, telehealth rail unavailable fallback.

**Dependencies:** `P06`, `P16`, vendor/contracts where required.

**Wave:** foundations `W4`, verified external rails later as evidence permits.

---

## `P08` — Financial OS / Revenue Cycle / Claims / Payments / No-Fault / Workers’ Comp

**Purpose:** Connect performed work to documentation, coding, claims, payment, reconciliation, and economic exceptions without collapsing financial states.

**Applications:** Financial Reality, Revenue Mission Room, Billing, Claims, Payments, RCM, No-Fault/Workers’ Comp Financial Case.

**Journeys:** service → documentation → coding support → charge expectation → charge → claim ready → submit → adjudicate → pay → reconcile; exception → owner → resolution → proof.

**Frames:** `F3 F5 F6 F7 F8 F9 F10`; spatial view useful for exception/mission context, precision UI for claims/forms.

**Objects:** `FinancialCase`, `ChargeExpectation`, `Charge`, `Claim`, `ClaimStatusEvent`, `Payment`, `Obligation`, `Payable`, `Payout`, `Settlement`, `Reconciliation`, `Denial/Exception`.

**APIs:** reuse billing/cases/financial kernels; Stripe for Klinikos/customer payment classes; clearinghouse/payer via adapters; never let processor state replace internal financial truth.

**Zumi:** surface missing documentation, coding gaps, unbilled work, rejections/denials, aging, unmatched payments, authorization blockers.

**Money:** recurring Revenue OS, implementation, managed RCM/performance economics only after legal/commercial review, organization billing.

**Tests:** payment redirect ≠ paid, duplicate webhook, refund/credit note, claim submission truth, interrupted settlement, performed-vs-charged reconciliation, no-fault case evidence/deadlines.

**Dependencies:** `P06`, `P07`, `P16`.

**Wave:** `W5`.

---

## `P09` — Grid Max / Capacity Exchange / Marketplace / Spatial Map

**Purpose:** Build the universal governed I NEED / I HAVE healthcare capacity exchange.

**Applications:** Grid Map, Grid Graph, Grid Market/List, Need/Have composer, saved watches, Mission Rooms.

**Journeys:** create Need/Have → verify → publish → discover → hard eligibility → rank → interest → agreement → reservation/assignment → fulfillment → evidence → money where applicable → reputation.

**Frames:** `F1–F11`, especially `F11`.

**Objects:** existing Grid participant/resource/demand/availability/capacity/match/offer/reservation/fulfillment/obligation/payout/dispute primitives; extend for additional resource classes, never `GridV2`.

**APIs:** reuse current Grid/capacity-exchange routes and MapLibre/OpenFreeMap foundations; target spatial projection from same server truth.

**Zumi:** natural-language Need/Have structuring, eligibility explanation, saved-search/watch assistance. AI never overrides hard eligibility.

**Money:** organization workforce/capacity tools; legally reviewed transaction/facilitation economics by resource class; vendor/employer value; no generic percentage on regulated referrals/clinical care.

**Tests:** privacy-reduced coordinates, ineligible never ranked, no fake supply, booking race, availability conflict, transaction/no-money path, mobile map/list, map unavailable fallback.

**Dependencies:** `P03`, `P04`, `P08` for money classes, `P16` security.

**Wave:** `W2`–`W3`.

---

## `P10` — Career, Jobs, Staffing & Healthcare Economic Participation

**Purpose:** Make Klinikos useful to healthcare professionals across a lifetime and help create real work/income, not just profiles.

**Applications:** Career Reality, Professional Opportunity Feed, Jobs/Shifts/Contracts, Staffing Mission Room.

**Journeys:** student → evidence → job; licensed professional → availability → eligible match → work → evidence/reputation; RN → lawful injector/aesthetics path; professional → owner/employer/preceptor.

**Frames:** `F1–F11` where spatial matching adds value.

**Objects:** Person/Passport + Grid job/shift/project + credential + availability + employer relationship + work evidence + reputation.

**APIs:** compose `P03` + `P09`; employment/staffing legal model remains explicit per jurisdiction.

**Zumi:** career advisor, application/interview preparation, evidence gaps, credential watch, opportunity explanation.

**Money:** employer/staffing operations, recruiting, optional professional premium, placement economics where lawful.

**Tests:** jurisdiction eligibility, worker classification flags, expired credential, duplicate application, employer authority, no pay-to-rank eligibility.

**Dependencies:** `P03`, `P09`, legal review in `P16`.

**Wave:** `W3`.

---

## `P11` — EDU, Simulation, Competency, Placement & Workforce Programs

**Purpose:** Make EDU the Human Capability Engine connecting learning to evidence, placement, employment, and institutional outcomes.

**Applications:** EDU Reality, My Path, Academy, Virtual Clinic Simulation, Instructor Workspace, Institution Command, Placement/Preceptor network.

**Journeys:** learn → practice → evidence → human review → competency → placement → Grid → work → experience → advancement.

**Frames:** `F0–F11`; simulation can use spatial environment, assessment stays precise.

**Objects:** existing Program/Course/Cohort/Enrollment/Evidence/Competency foundations plus Placement, PreceptorCapacity, HourEvent, Assessment, Rubric, CareerArtifact.

**APIs:** extend existing EDU and EDU→Grid bridge rather than separate LMS.

**Zumi:** tutor/coach, simulation facilitator, instructor assistance, evidence organization; EDU never self-confers licensure.

**Money:** institutional/workforce contracts, employer training, simulation licensing, selected individual paid programs while base Person remains free.

**Tests:** synthetic-data-only simulation, competency requires human review where specified, placement multi-party approvals, hours/evidence integrity, EDU ≠ license.

**Dependencies:** `P03`, `P09`.

**Wave:** `W3`.

---

## `P12` — Zumi Intelligence, Memory, Knowledge & Interface Composition

**Purpose:** Evolve Zumi from chat assistant into governed intelligence that assembles the correct Reality and safe action surface.

**Applications:** Zumi Command Surface across all Realities, Memory controls, internal AI Gateway/evals.

**Journeys:** intent → context → evidence retrieval → authority check → prepare → preview → human confirm where needed → deterministic tool → verified result → governed memory.

**Frames:** primarily coordinates `F1 F2 F3 F5 F7 F8 F9`; may materialize UI rather than answer with prose.

**Objects:** `MemoryCandidate`, `MemoryRecord`, `KnowledgeSource`, `Recommendation`, `ToolInvocation`, `AIUsage`, `EvaluationResult`, `ContextEnvelope`.

**APIs:** reuse existing `/api/zumi`, provider abstraction, tool catalog, orchestration registry; memory context never authority.

**Zumi:** this is the core Zumi program: clinical assistance, coding candidates, career, EDU, owner/CFO, Grid, Opportunity, Company Command.

**Money:** advanced Zumi/usage add-ons, enterprise AI, customer-funded variable usage.

**Tests:** hallucination, prompt injection, PHI egress, tool misuse, authority overreach, source ranking, contradiction/supersession, memory expiry/forget, provider outage/fallback, cost budgets.

**Dependencies:** `P00`, `P03`, `P16`; domain tools depend on their programs.

**Wave:** foundation `W5`, expands continuously.

---

## `P13` — Opportunity OS / Sales / RFP / Grant / Procurement

**Purpose:** Turn external opportunities into structured evidence-driven company workflows and reusable capability.

**Applications:** Opportunity Reality, Sales Pipeline, RFP Mission Room, Grant Mission Room, Procurement workbench.

**Journeys:** discover → ingest → requirements/deadlines → eligibility → bid/no-bid → gaps/partners → pricing/evidence → approval → submit → result → contract → delivery → invoice → cash → case study.

**Frames:** `F3 F4 F5 F6 F7 F8 F9 F10`.

**Objects:** `Opportunity`, `Buyer/Funder`, `Requirement`, `Deadline`, `Qualification`, `PartnerGap`, `Proposal`, `Submission`, `Award/Loss`, `Contract`, `EvidenceArtifact`.

**APIs:** Company Command/private source ingestion, email/portal connectors when authorized, document ingestion through governed Document system.

**Zumi:** requirement extraction, compliance matrix drafting, bid/no-bid explanation, proposal drafting, deadline risk; never invent qualifications.

**Money:** enterprise sales, government contracts, grants, implementation, customer capital.

**Tests:** mandatory prime qualification failure, stale deadline, partner unconfirmed, submission evidence, public-record/IP handling, no fabricated staff/reference.

**Dependencies:** `P00`, `P14`, `P16`.

**Wave:** `W5`.

---

## `P14` — Company Command / Diligence / Capital / CFO

**Purpose:** Make Klinikos its own first customer and operate the company through one evidence-based executive environment.

**Applications:** Company Command, Capital Reality, Diligence Rooms, Board/Investor/Lender views.

**Journeys:** signal → evidence → decision → owner → action → result; capital source → qualify → materials → diligence → decision → funded/not funded → covenant/reporting.

**Frames:** `F3 F4 F5 F6 F7 F8 F9 F10 F11`.

**Objects:** `CompanyMetric`, `CapitalSource`, `Loan`, `Grant`, `Investment`, `UseOfProceeds`, `Covenant`, `DiligenceArtifact`, `SalesPipeline`, `Risk`, `Decision`.

**APIs:** existing company routes + controlled evidence projections; no raw PHI by executive default.

**Zumi:** weekly highest-value priorities, evidence-linked CFO/CEO analysis, lender/investor package assistance.

**Money:** capital access, lower founder/admin cost, stronger diligence, faster sales/finance operations.

**Tests:** disclosure tiers, pipeline vs contracted, target vs actual, lender projection cannot expose crown jewels/PHI, model scenarios labeled.

**Dependencies:** `P00`, `P13`, `P16`.

**Wave:** `W5`.

---

## `P15` — Texas Infrastructure Digital Twin

**Purpose:** Model the Texas expansion as one governed infrastructure project before physical capital is committed.

**Applications:** Texas Infrastructure Reality / Regional Hub Twin / Jobs & Training plan / Sources & Uses room.

**Current founder planning truth to preserve as state:** ~`$5M` Phase I target; ~`$25M` broader planned expansion; `25` direct jobs by Year 2 target; up to `~705` long-range direct Texas jobs target/scenario; indirect Grid/EDU economic activity measured separately.

**Frames:** `F3–F11`, especially spatial facility/network/regional views.

**Objects:** `InfrastructureProject`, `Phase`, `Site`, `Facility`, `Power`, `Fiber`, `Cooling`, `ComputeResource`, `Equipment`, `VendorQuote`, `CapitalSource`, `Incentive`, `JobPlan`, `WageBand`, `TrainingPlan`, `Milestone`, `ActualSpend`, `Outcome`.

**APIs:** initially Company Command/internal project data; external utility/economic-development integrations only when real rails exist.

**Zumi:** reconcile audiences to one project truth, prepare lender/workforce/economic-development projections, highlight missing evidence.

**Money:** grants/incentives/debt/equity/customer-backed infrastructure; physical spend remains milestone-gated.

**Tests:** target never rendered as actual, sources=uses reconciliation, scenario labeling, duplicate agency projection uses same underlying values, downside case.

**Dependencies:** `P14`, `P16`, verified financing/site evidence.

**Wave:** digital twin `W5`; physical execution outside 90-day software release unless separately approved/funded.

---

## `P16` — Security, Privacy, Legal, IP & Production PHI Gate

**Purpose:** Turn security/trust into enterprise value and prevent product ambition from outrunning legal/technical authority.

**Applications:** Trust/Security admin, audit/evidence, legal acceptance, incident/recovery; mostly invisible to ordinary users.

**Journeys:** context switch → recompute authority; file upload → scan/classify → usable/rejected; incident → contain → investigate → recover → evidence.

**Frames:** mostly `F5 F7 F8 F9`; calm precision.

**Objects:** `AccessDecision`, `Consent`, `AuditEvent`, `SecurityEvent`, `LegalAcceptance`, `DataClassification`, `VendorRisk`, `Incident`, `BreakGlassEvent`.

**Controls:** MFA/passkeys, RBAC/ABAC, tenant isolation, least privilege, encryption, secret rotation, WAF/rate limits, malware/file scanning, dependency/SBOM/SAST/DAST, backups/restore, incident response, PHI egress, vendor/BAA/DPA gates.

**Zumi:** may explain access and prepare security/legal work; cannot grant itself permission or legal status.

**Money:** enterprise sales readiness, risk reduction, lower breach/contract risk.

**Tests:** tenant adversarial matrix, prompt injection, PHI leakage, stale permission, expired consent, browser bundle leakage, source maps, backup restore, incident game day.

**Dependencies:** `P00`; blocks PHI production and enterprise claims.

**Wave:** starts `W0`, continuous through `W6`.

---

## `P17` — Data Fabric, Event Architecture, Analytics, Digital Twin & Evolution Engine

**Purpose:** Make all Realities share temporal, provenance-rich truth and improve through governed measurement.

**Applications:** data/analytics foundations, regional capacity intelligence, Evolution Engine, internal observability.

**Objects:** shared identity/organization/patient/clinical/Grid/EDU/financial/evidence/event models plus provenance/effective-date metadata.

**Events:** appointment/capacity changes, shift changes, order/result, referral closure, financial transitions, learning/competency, network outcomes, product telemetry.

**Zumi:** reads governed projections; analytics/evolution proposes experiments, never autonomously rewrites production.

**Money:** enterprise analytics, regional intelligence, better retention and unit economics; no PHI data brokerage.

**Tests:** effective-date reconstruction (“what was true on date of service”), provenance, replay/idempotency, event ordering, de-identification/privacy, experiment rollback.

**Dependencies:** all domain programs; foundational event/provenance rules begin early.

**Wave:** foundation `W2`; analytics/evolution `W6`.

---

## `P18` — Enterprise, Partner, Vendor, Developer/API & Procurement Ecosystem

**Purpose:** Let external organizations integrate and transact without weakening authority or forcing full replacement.

**Applications:** Enterprise Reality, Partner/Vendor Reality, Developer Portal, Integration catalog, Procurement.

**Journeys:** enterprise connects/coexists → proves value → selectively migrates; vendor claims org → paid activation → offer → procurement/fulfillment; developer → app registration → scope → sandbox → review → production.

**Objects:** `EnterpriseTenant`, `Integration`, `PartnerRelationship`, `VendorOffer`, `ProcurementNeed`, `DeveloperApp`, `OAuthGrant`, `WebhookSubscription`, `UsageRecord`.

**APIs:** governed public/partner APIs and webhooks only after permission/data-minimization maturity; SSO/SAML/SCIM for enterprise.

**Zumi:** integration guidance, vendor/procurement assistance, enterprise operational intelligence.

**Money:** enterprise contracts, integrations, vendor plans, API, implementation, future partner certification/marketplace.

**Tests:** scopes, tenant boundaries, webhook signing/idempotency, vendor authority, API rate limits, data export rights, external rail status truth.

**Dependencies:** `P04`, `P16`, `P17`.

**Wave:** `W6` design/foundations; broad platform economy later.

---

## `P19` — Marketing, Brand, SEO, Growth & Public Story

**Purpose:** Build Apple-level discipline around a product-led narrative: transformation first, feature inventory second.

**Applications:** public Living Home, specialty/role/problem pages, interactive demos, research/content, campaign-specific Reality entry states.

**Core language:** `KLINIKOS — THE LIVING HEALTHCARE REALITY`; `Healthcare work, finally connected.`; `What needs to happen?`; `Klinikos helps healthcare move.`

**Journeys:** campaign/search → relevant Reality → useful result → Person signup or organization lead → activation → outcome → referral/invite.

**Frames:** `F0–F5`, `F8–F11`.

**Zumi:** personalized public-safe demos and qualification.

**Money:** pipeline, lower CAC, paid organizations/institutions; track value not vanity impressions.

**Tests:** real claims only, no fake case studies/network density, SEO public/private boundary, funnel instrumentation, performance/core web vitals, accessibility.

**Dependencies:** `P01`, `P02`, `P04`, real outcomes from `P20`.

**Wave:** preparation `W3`; controlled launch `W6`.

---

## `P20` — Customer Success, Implementation, KLINIKOS 10 & Expansion

**Purpose:** Turn sales into successful deployments and successful deployments into evidence, referrals, and repeatable expansion.

**Applications:** Implementation Mission Room, customer success, onboarding/configuration, outcome evidence.

**Journeys:** signed work → deposit/contract evidence → configuration → integration/data → training → activation → first value → measure → expansion → retention → referral.

**Strategy:** prove depth with design-partner practice → 10 strategic practices → 25 density → 100 repeatability/network economics.

**Objects:** `ImplementationEngagement`, `Milestone`, `Configuration`, `TrainingAssignment`, `OutcomeMetric`, `SupportIssue`, `ExpansionOpportunity`, `ReferencePermission`.

**Zumi:** implementation guide, training assistance, support triage, outcome summary.

**Money:** implementation, recurring organization revenue, expansion, lower churn.

**Tests:** sales promise maps to entitlement/configuration, time-to-first-value, support ownership, rollback, production parity, case study requires permission/evidence.

**Dependencies:** `P04` plus whichever domain was sold.

**Wave:** `W3` and continuous.

---

## `P21` — Quality Guardian, QA, Reliability & Release Proof

**Purpose:** Treat engineering/tester findings as product law and prevent “page exists” from being confused with a complete feature.

**Applications:** internal Quality/Assurance, Expert Grid bridge, release evidence.

**Journeys:** issue detected → owner → remediation → evidence → close; release candidate → quality/security/browser proof → deploy → exact SHA verify.

**Tests:** unit, integration, DB-backed journey, browser, mobile, accessibility, security, load/performance, tenant boundary, AI eval, provider failure, duplicate webhook, interrupted transaction, fresh DB.

**Zumi:** summarize failures and evidence; does not mark green without proof.

**Money:** lowers support/incident costs, improves enterprise trust.

**Dependencies:** all programs.

**Wave:** every wave.

---

## `P22` — Research, NIH/SBIR, Accelerators & Strategic Programs

**Purpose:** Separate scientific/non-dilutive research logic from ordinary procurement/sales while reusing the same evidence engine.

**Applications:** Research Mission Room inside Opportunity/Company Command.

**Journeys:** program fit → scientific aim → research uncertainty → work plan → validation → commercialization → submission/reporting.

**Objects:** `ResearchOpportunity`, `Aim`, `Hypothesis`, `Milestone`, `Experiment`, `Budget`, `Evidence`, `CommercializationPlan`.

**Zumi:** literature/requirements organization, draft support, gap identification; never fabricate scientific evidence.

**Money:** SBIR/STTR/grants/accelerators/strategic partnerships; classify application vs award correctly.

**Tests:** source provenance, aim-to-work-plan traceability, budget consistency, award state truth.

**Dependencies:** `P13`, `P14`, `P00`.

**Wave:** `W5`.

---

## `P23` — Economic Participation, Vendor/Sponsorship & New Revenue Hunt

**Purpose:** Continuously identify lawful ways Klinikos helps participants earn/save/utilize/learn and captures value without corrupting trust.

**Applications:** cross-cutting Commercial Fabric, Vendor/Sponsor surfaces, Capacity Yield, employer/organization economic views.

**Rule:** payment never buys clinical authority, credential truth, referral priority, PHI access, or legal eligibility.

**Monetization classes:** organization software; implementation; workforce/recruiting; EDU; Grid resource-class economics; AI usage; Revenue OS; integrations/API; vendor plans; procurement; sponsorship/ads; enterprise/government; managed services; analytics; infrastructure.

**Zumi:** explain economic options and estimate scenarios with labels, never promise revenue.

**Tests:** ad/sponsored disclosure, sensitive-data targeting prohibition, no pay-to-rank eligibility, unit economics/margin floor, stale-price protection.

**Dependencies:** relevant domain + `P16` legal/security + pricing authority.

**Wave:** design `W2`, controlled activation from `W3` onward.

---

# 4. RECOVERED SCOPE → PRIMARY PROGRAM TRACEABILITY

The recovered ~189-item inventory remains provenance. This map assigns primary ownership so nothing is orphaned. Cross-cutting requirements may propagate into several programs even when one program owns the primary record.

| Recovered scope families / IDs | Primary program(s) |
|---|---|
| 1–5 company thesis, not-a-module, One Klinikos, five-plane constitution | `P00 P01` |
| 5–13 Option C, 3D universe, semantic twin, cinematic/brand, public site | `P01 P19` |
| 13–21 value-before-signup, free Person, paid organization, universal identity, professional lifetime/passport | `P02 P03 P04` |
| 22–31 staffing, jobs, Grid primitives/composition/max map/digital twin | `P09 P10 P17` |
| 32–39 EDU, institutional delivery, EDU→economy, Kentucky workforce | `P11 P22` |
| 40–46 Clinic OS, full EHR, physician design-partner, Snapshot, What Changed, BodyMap, staff handoff | `P05 P06` |
| 47–58 telemedicine, scribe, coding, labs, imaging, referrals, eRx, payer, No-Fault/WC, specialty packs, med spa | `P06 P07 P08` |
| 59–64 patient/caregiver, Revenue OS/leakage, Mission Rooms | `P05 P06 P08` |
| 65–80 Zumi operating model, authority firewall, modes, memory, learning, evals, model/provider/partner strategy | `P12 P17 P22` |
| 81–95 communications, growth engine, Operating Map, Klinikos 10, demos, founding sales, land-without-displacement, connect/coexist/migrate, vendor/customer-funded architecture, configuration, vendor/ads/procurement | `P19 P20 P04 P18 P23` |
| 96–103 Opportunity OS, OHSU, Kentucky/Somerset, CancerX, VentureWell, grants, financing | `P13 P14 P22` |
| 104–107 Texas, programs, Mac/private compute, 888/company separation | `P15 P14` |
| 108–121 corporate structure, formation, trademark/IP/NDA, security, tenant tests, prompt injection, PHI, HIPAA/legal stack, production truth | `P16 P00` |
| 121–139 manual-first, definition of feature, Aug tester rules, mobile/accessibility/deploy/CI/current repo and domain foundations/gaps/PR #524/anti-duplication | `P21 P00` plus affected program |
| 140–150 pricing history/current fabric, Grid economics, organization/advertising/vendor/RCM/EDU/professional economics | `P23 P04 P08 P09 P11` |
| 151–160 north star, network KPIs, Apple marketing, messaging, SEO/content, outreach/CRM/proof | `P19 P20 P13` |
| 161–166 business positioning, investor moat/switching, Company Command, Founder Zumi/council | `P14 P12` |
| 167–173 idea validation, failure council, scorecard, cost law, stop list, superseded history, anti-compression | `P00 P21` |
| 174–180 user-order machine, flywheel, final company model, moat loop, simple UX, economic participation, opportunity fabric | `P02 P09 P10 P11 P23` |
| 181–186 Zumi assembles Reality, network cells, sales outcome wedge, EDU economic engine, enterprise coexist/migrate, operational→financial consequence | `P12 P09 P19 P11 P18 P08` |
| 187–189 artifact hierarchy, current status, master end state / Master Execution Engine | `P00` + this document |

The longer D→Z ledgers are not excluded by this numeric mapping. Each later recovered requirement must be inserted into the same `ExecutionRecord` register under the relevant program rather than creating a second scope ledger.

---

# 5. 90-DAY RELEASE WAVES

## `W0` — Days 0–7: Truth & Control

**Ship/lock:**
- Execution Engine + traceability artifact.
- Protect `main` / required checks plan and resolve CI governance.
- Classify every open PR: merge-ready / supersede / rebase / retire / dependency.
- Explicitly supersede PR #524 rendering limit while preserving safety laws.
- Block PR #519 commercial conflict until Person-free / org-paid law is reconciled.
- Current vs target pricing/integration/security evidence registry.
- PHI-production blocker inventory.

**Release evidence:** no product claims changed without proof; all active programs have owner/dependency/state.

## `W1` — Days 1–14: Living Reality + Public Person Entry

**Programs:** `P01 P02 P16 P21`.

**Ship:** cinematic public Living Home foundation, adaptive performance tiers, public intent → useful safe result, free Person signup continuity, member Living Home convergence, accessibility/no-WebGL path, full funnel telemetry.

**Commercial outcome:** more qualified Person entries and organization-intent leads.

## `W2` — Days 15–30: Identity + Trust + Paid Organization + Grid Core

**Programs:** `P03 P04 P09 P17 P23`.

**Ship:** Professional Passport foundations, claim/evidence/verification, organization claim/authority/commercial gate, configuration blueprint, Grid spatial/map/list core, Need/Have creation, initial organization paid activation path.

**Commercial outcome:** first repeatable free-person → paid-organization conversion system.

## `W3` — Days 31–45: Career + EDU + Implementation + Network Cells

**Programs:** `P10 P11 P20 P19`.

**Ship:** jobs/shifts/career path, EDU→Grid evidence bridge, placement/preceptor foundations, implementation mission room, KLINIKOS 10 proof workflow, first geographic network-cell acquisition campaign.

**Commercial outcome:** workforce/institutional/clinic distribution loops and measurable customer proof.

## `W4` — Days 46–60: Clinic Operations + Current Visit Golden Case

**Programs:** `P05 P06 P07 P16 P21`.

**Ship:** front-desk/TODAY readiness, doctor-defined Current Visit Golden Case, What Changed, BodyMap continuity, staff handoff, telemedicine-in-visit path, orders/results/referral follow-up foundations, clinical safety tests.

**Commercial outcome:** credible clinic operating/EHR wedge with design-partner proof.

## `W5` — Days 61–75: Revenue + Zumi + Opportunity + Company Command + Texas Twin

**Programs:** `P08 P12 P13 P14 P15 P22`.

**Ship:** Revenue Mission Room, claim/billing exception intelligence, governed Zumi interface composition/tools, Opportunity OS, controlled diligence views, Texas digital twin v1, research/grant mission room.

**Commercial/capital outcome:** stronger RFP/lender/investor readiness and measurable clinic ROI.

## `W6` — Days 76–90: Enterprise Hardening + Controlled Launch + Evolution

**Programs:** `P18 P19 P21 P17 P23` plus hardening of all prior waves.

**Ship:** enterprise controls/SSO design or bounded implementation, partner/API governance foundation, polished launch campaign, public-safe proof/case studies where evidence exists, evolution telemetry/experiment loop, full security/mobile/accessibility/reliability release proof.

**Commercial outcome:** controlled public acquisition, enterprise selling, partner/institutional readiness.

---

# 6. CHILD PLAN PORTFOLIO — EXACT NEXT PLAN FILES

No production code program is executed directly from this master plan. Create one detailed TDD plan per independent subsystem, each referencing its approved program spec and current-main audit.

Required child plans, in execution order:

1. `docs/superpowers/plans/2026-09-03-program-p00-truth-governance.md`
2. `docs/superpowers/plans/2026-09-03-program-p01-living-reality-runtime.md`
3. `docs/superpowers/plans/2026-09-03-program-p02-person-growth-engine.md`
4. `docs/superpowers/plans/2026-09-03-program-p16-production-security-gate.md`
5. `docs/superpowers/plans/2026-09-03-program-p03-identity-trust-passport.md`
6. `docs/superpowers/plans/2026-09-03-program-p04-org-commercial-activation.md`
7. `docs/superpowers/plans/2026-09-03-program-p09-grid-max.md`
8. `docs/superpowers/plans/2026-09-03-program-p10-career-workforce.md`
9. `docs/superpowers/plans/2026-09-03-program-p11-edu-workforce.md`
10. `docs/superpowers/plans/2026-09-03-program-p20-implementation-klinikos10.md`
11. `docs/superpowers/plans/2026-09-03-program-p05-clinic-operations.md`
12. `docs/superpowers/plans/2026-09-03-program-p06-current-visit-ehr.md`
13. `docs/superpowers/plans/2026-09-03-program-p07-external-care-rails.md`
14. `docs/superpowers/plans/2026-09-03-program-p08-financial-rcm.md`
15. `docs/superpowers/plans/2026-09-03-program-p12-zumi-intelligence.md`
16. `docs/superpowers/plans/2026-09-03-program-p13-opportunity-os.md`
17. `docs/superpowers/plans/2026-09-03-program-p14-company-command-capital.md`
18. `docs/superpowers/plans/2026-09-03-program-p15-texas-digital-twin.md`
19. `docs/superpowers/plans/2026-09-03-program-p18-enterprise-partner-api.md`
20. `docs/superpowers/plans/2026-09-03-program-p17-data-evolution.md`
21. `docs/superpowers/plans/2026-09-03-program-p19-growth-launch.md`
22. `docs/superpowers/plans/2026-09-03-program-p22-research-nondilutive.md`
23. `docs/superpowers/plans/2026-09-03-program-p23-economic-participation.md`
24. `docs/superpowers/plans/2026-09-03-program-p21-release-proof.md`

Each child plan must contain exact files/routes/types/tests after re-auditing the then-current `main`. It must not copy invented paths from this portfolio when a governed existing kernel already owns the function.

---

# 7. MASTER DEPENDENCY GRAPH

```text
P00 TRUTH / GOVERNANCE
 ├── P16 SECURITY / PHI GATE
 ├── P01 LIVING REALITY
 │    └── P02 PERSON GROWTH
 ├── P03 IDENTITY / TRUST
 │    ├── P04 ORGANIZATION COMMERCIAL ACTIVATION
 │    │    ├── P05 CLINIC OPERATIONS
 │    │    ├── P20 IMPLEMENTATION / KLINIKOS 10
 │    │    └── P18 ENTERPRISE / PARTNER
 │    ├── P09 GRID
 │    │    ├── P10 CAREER / WORKFORCE
 │    │    └── P11 EDU / PLACEMENT
 │    └── P06 CURRENT VISIT / EHR
 │         ├── P07 EXTERNAL CARE RAILS
 │         └── P08 FINANCIAL / RCM
 ├── P12 ZUMI overlays every authorized domain
 ├── P13 OPPORTUNITY
 │    ├── P22 RESEARCH / NON-DILUTIVE
 │    └── P14 COMPANY COMMAND / CAPITAL
 │         └── P15 TEXAS DIGITAL TWIN
 ├── P17 DATA / EVENTS / EVOLUTION consumes all program events
 ├── P19 GROWTH consumes real public-safe value/evidence
 ├── P23 ECONOMIC PARTICIPATION consumes approved domain economics
 └── P21 QUALITY / RELEASE gates every shipment
```

---

# 8. PROGRAM DEFINITION OF DONE

A program wave is not complete until all applicable gates are green:

1. requirement traceability complete;
2. existing kernel reuse decision documented;
3. RED tests written before production behavior where implementation begins;
4. schema/migration chain valid;
5. typecheck/lint/tests green;
6. security/confidentiality gates green;
7. browser/mobile/accessibility proof for user-facing work;
8. external integrations verified at their actual state, never inferred;
9. exact candidate SHA recorded;
10. deployed SHA verified if production claim is made;
11. truthful empty/error/degraded/manual-fallback states proven;
12. KPI telemetry present;
13. commercial/authority consequences match Canon;
14. evidence register updated;
15. no accepted requirement orphaned.

---

# 9. KPIs — ONE COMPANY SCOREBOARD

**North star:** `Weekly Successful Healthcare Outcomes Orchestrated`.

**Acquisition:** useful public intents, Person signup conversion, first-value rate, invite rate.

**Organization:** organization claims, qualified authority, paid activations, implementation time, first value, retention/expansion.

**Grid:** active Needs/Haves, eligible match rate, time-to-match, fulfillment, geographic/specialty density, repeat use.

**Career/workforce:** jobs/shifts/contracts filled, paid hours/income enabled where measurable, credential completion, employer repeat rate.

**EDU:** active learners, evidence reviewed, competencies, placements, completion, learning→work conversion.

**Clinical:** Current Visit close rate, unfinished work, result/referral closure, staff handoff completeness, after-hours/documentation burden measures where lawfully measurable.

**Financial:** billing-ready completion, claims advanced, exception resolution, payment/reconciliation accuracy, revenue recovered only when evidence supports it.

**Company:** MRR/ARR only when actual, contracted revenue, cash collected, gross margin, CAC/payback, pipeline by evidence state, implementation margin, capital efficiency.

**Quality/security:** release failure rate, escaped defects, tenant/security violations, availability, restore proof, Zumi unsafe-action/hallucination evals.

---

# 10. WHAT NOT TO DO

- Do not turn the 24 programs into 24 separate products or logins.
- Do not merge PR #524 unchanged as the final spatial direction.
- Do not merge PR #519 unchanged into the newer organization commercial law.
- Do not add Three.js/R3F before the subordinate `P01` design/TDD plan defines semantic projection, performance tiers, accessibility, browser secrecy, and tests.
- Do not activate PHI until `P16` production gate is evidence-green.
- Do not chase national Grid liquidity before proving one or more dense network cells.
- Do not buy Texas hardware/facility capacity merely because it is visually impressive; physical spend is milestone-, demand-, financing-, and unit-economics-gated.
- Do not let Opportunity/Capital claims become traction.
- Do not hardcode historical pricing generations.
- Do not let the master plan become another dead document: every child plan must update the traceability ledger and evidence state.

---

# 11. IMMEDIATE EXECUTION ORDER AFTER THIS PLAN IS APPROVED

1. Create `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml` with program records and recovered-scope entries.
2. Produce `P00` detailed plan and reconcile open PR portfolio/branch protection/CI truth.
3. Produce `P01` detailed Living Reality v2 plan that explicitly supersedes PR #524's final rendering limit while preserving its accessibility/server-authority laws.
4. Produce `P02` detailed public-value/free-Person plan against current signup/public gateway implementation.
5. Produce `P16` detailed production-security plan and keep it parallel to every user-facing wave.
6. Only then begin TDD implementation on `W1` from the then-current `main` in an isolated worktree/branch.

**Execution principle:** the architecture remains maximum-scope; implementation remains ruthlessly sequenced. Preserve the universe. Ship the smallest safe tranche that creates measurable user value, commercial value, evidence, and the next compounding advantage.
