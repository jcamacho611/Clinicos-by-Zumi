# KLINIKOS OPERATING SYSTEM — MASTER SOURCE OF TRUTH

Version: `2026-08-14.4`
Status: `AUTHORITATIVE`

This document is the product and architecture source of truth for Klinikos.

If implementation, documentation, design, legacy naming, feature registries, or prior briefs conflict with this document, the latest verified source of truth and current repository/runtime evidence govern. `docs/SOURCE_OF_TRUTH.md` defines current visual, security, commercial, and engineering law. This document defines the deeper system architecture and product composition.

## 1. Non-negotiable definition

Klinikos is a healthcare operating system and ecosystem.

It is not merely an Electronic Medical Record (EMR), Electronic Health Record (EHR), Customer Relationship Management (CRM) system, clinic management application, staffing marketplace, education platform, patient portal, Artificial Intelligence assistant, or billing application. Those are capabilities or subsystems that may operate inside Klinikos.

Think of Klinikos as the operating environment underneath an interconnected healthcare economy.

The user experiences simplicity. The architecture handles complexity.

## 2. Product hierarchy

The master product is **Klinikos**.

- **Living Home** is the adaptive operating surface.
- **Klinikos Intelligence / Zumi** is the embedded reasoning and orchestration subsystem.
- **Clinic OS** is the operational system for clinics and organizations.
- **Grid** is the governed healthcare resource, opportunity, capacity, matching, transaction and fulfillment network.
- **Care** is the governed care-navigation and care-workflow layer.
- **Klinikos EDU** is the education, competency and workforce-development layer.
- **Network** is the multi-organization, multi-location coordination and analytics layer.
- **Patient** is the simplified patient-facing experience.

The repository spelling `Clinicos` is legacy technical naming only.

## 3. North-star flow

The canonical user and system flow is:

`IDENTITY → CONTEXT → INTENT → PATH → NEXT ACTION → GOVERNED EXECUTION → OUTCOME`

This supersedes older architecture descriptions that routed directly from identity into a generic personalized workspace without durable Path state.

### Meaning

- **Identity** establishes who the actor is.
- **Context** establishes organization, role, patient/resource scope, permissions and current environment.
- **Intent** captures what the actor is trying to accomplish.
- **Path** is the durable goal/workflow instance that coordinates progress across systems.
- **Next Action** is the best currently permitted and useful action.
- **Governed Execution** uses deterministic engines, domain services, connectors and human review where required.
- **Outcome** is the measured result, not merely a screen transition.

Living Home is the primary surface that projects this architecture to the user.

## 4. Core architectural law

The backend is organized around shared deterministic engines plus domain-specific services.

**Do not duplicate business logic inside screens, agents, routes or AI prompts when a shared engine can own it.**

The canonical dependency direction is:

`Identity / Context`
→ `Authorization / Policy`
→ `Capabilities / Contracts`
→ `Intent`
→ `Path Runtime`
→ `Next Action / Blockers`
→ `Domain Execution`
→ `Events / Signals`
→ `Financial / Communications / Integrations`
→ `Outcomes / Telemetry`
→ `Intelligence explanation and coordination`

Klinikos Intelligence may interpret and coordinate, but deterministic Klinikos services remain authoritative for permission, eligibility, credentials, payment truth, transaction state, clinical release, safety and destructive/binding actions.

## 5. Shared orchestration fabric

The shared orchestration fabric is the main convergence target.

### 5.1 Shared contracts

Define reusable contracts for:

- actor and context
- capability
- policy decision
- intent
- Path state
- Next Action
- blocker
- alternative/fallback
- event
- signal
- notification intent
- human-review request
- financial obligation
- connector readiness
- outcome

### 5.2 Intent Engine

The Intent Engine converts user/system requests into structured deterministic intents.

It must:

- preserve natural-language input;
- resolve known goals without forcing category selection;
- preserve ambiguity when confidence is low;
- request one concise clarification only when a consequential missing fact blocks safe execution;
- never widen authorization;
- emit structured intent that downstream engines can reason over.

### 5.3 Capability / Policy Engine

The shared capability-policy layer decides whether an actor in a context may perform or receive a capability.

It must consume:

- identity
- organization
- role
- resource ownership
- credentials
- jurisdiction
- patient authorization/consent where required
- entitlement
- connector readiness
- safety/clinical review requirements

A ranking engine may never override a hard policy failure.

### 5.4 Path Runtime

A Path is a durable goal-oriented workflow instance.

A Path must persist at minimum:

- actor
- organization/context
- goal/intent
- status
- current node
- completed nodes
- blocked nodes
- blockers
- contextual payload
- activity timestamps
- completion/cancellation state

Path transitions must be driven only by allowlisted user actions or trusted domain events that match the exact current node and Path type.

Unknown events do not advance Paths.

### 5.5 Path Event Ledger

Every consequential Path transition emits an append-only event record with:

- Path instance
- actor/system attribution
- source domain
- event type
- previous state
- resulting state
- reason/evidence
- timestamp

### 5.6 Next Action Engine

The Next Action Engine ranks the best currently permitted actions using:

- current Path node
- blockers
- urgency
- dependency readiness
- user role/context
- operational impact
- financial impact where legitimate
- safety/clinical constraints
- available alternatives

It returns explainable actions, not opaque scores.

### 5.7 Blocker / Alternative Engine

The blocker engine records why progress cannot continue and what truthful alternatives exist.

Examples:

- missing credential
- missing patient authorization
- connector not activated
- payment evidence absent
- availability conflict
- human review required
- unsupported external capability

Blocked must not be rendered as completed.

### 5.8 Human Review Engine

Human review remains explicit for regulated, clinical, credential, PHI-sharing, money-movement, destructive and binding actions where policy requires it.

The review engine must support:

- reasoned queue entries
- required reviewer role
- evidence/context
- approve / deny / request-info
- immutable decision record
- resulting state transition

## 6. Identity and context architecture

One human may hold multiple legitimate contexts.

The identity/context layer must support:

- multiple organizations
- multiple roles
- location context
- provider/professional context
- patient context
- student/educator context
- Grid participant context
- explicit context switching

Context switching must never leak data or permissions between organizations or patient contexts.

## 7. Healthcare relationship graph

Klinikos needs a governed graph abstraction over existing relational data.

The graph may describe relationships among:

- people
- organizations
- providers
- patients
- facilities
- care teams
- referrals
- education relationships
- Grid participants/resources
- payer/partner relationships

Graph traversal must always be authorization-filtered. It is not a reason to create a single unrestricted data lake.

## 8. Grid architecture

Grid is the governed healthcare resource orchestration network.

The universal expression is:

- **I NEED** → demand
- **I HAVE** → supply/resource

### 8.1 Canonical Grid concepts

- GridParticipant
- GridResource
- GridDemand
- GridRequirement
- GridCapability
- GridAvailability
- GridMatch
- GridOffer
- GridAgreement
- GridReservation / Booking
- GridTransaction
- GridFulfillment
- GridFinancialObligation
- GridDispute
- GridIncident
- GridReputationSignal

Existing provider/service/request/location/availability/payout models should be adapted into these abstractions rather than discarded without reason.

### 8.2 Matching pipeline

`DISCOVERY → HARD ELIGIBILITY → AUTHORIZATION → SUITABILITY → RANKING → OFFER`

Hard gates include, where relevant:

- credentials
- jurisdiction
- malpractice/insurance requirements
- availability
- geography
- facility policy
- setting
- organization rules
- price/budget
- resource state

Artificial Intelligence may interpret demand and explain matches. It does not decide eligibility.

### 8.3 Multi-party composition

Grid transactions may require multiple slots, not fixed buyer/seller sides.

Examples:

`PATIENT/CLIENT + ELIGIBLE CLINICIAN + APPROVED LOCATION + REQUIRED RESOURCE + TIME + CONSENT + PAYMENT`

`STUDENT + INSTITUTION + PRECEPTOR + CLINICAL SITE + HOURS + CREDENTIALS`

`PATIENT NEED + SPECIALIST + FACILITY CAPACITY + AUTHORIZATION`

Composition templates define required participants/resources, policy, agreements, scheduling, payment and fulfillment rules.

### 8.4 Reservation and collision safety

Reservations must prevent double-booking of providers, rooms, equipment and other exclusive capacity.

Availability alone does not guarantee a reservation.

### 8.5 Fulfillment

A booking is not success.

Grid must distinguish:

- BOOKED
- CHECKED_IN / STARTED
- IN_PROGRESS
- FULFILLED
- PARTIALLY_FULFILLED
- FAILED
- CANCELLED

Payout or settlement policy may depend on verified fulfillment.

## 9. Financial architecture

Klinikos records economic truth but should avoid unnecessary custody of funds.

### 9.1 Financial Obligation Engine

Represent obligations in integer cents.

Examples:

- customer payment due
- provider payable
- facility payable
- platform fee
- refund obligation
- partner fee
- implementation/service fee

Obligations require provenance and governing transaction/contract context.

### 9.2 Payment truth

`REDIRECT ≠ PAYMENT`.

Browser return state never creates entitlement or proves payment.

Use:

`server-owned checkout intent → external payment rail → verified payment evidence → reconciliation → entitlement/transaction transition`

### 9.3 Payouts

Payouts are separate from gross payment receipt and must respect:

- fulfillment requirements
- disputes/holds
- human approval when required
- processor evidence
- participant verification

## 10. Events, signals and activity

### 10.1 Event Engine

Every consequential domain transition should emit a structured event.

Events connect systems without allowing uncontrolled data flow.

Examples:

- appointment cancelled
- Grid demand opened
- credential verified
- referral completed
- Path advanced
- payment evidence recorded
- fulfillment confirmed

### 10.2 Signal Engine

Signals are interpreted operational meaning derived from events/data, such as:

- appointment at risk
- follow-up overdue
- unused capacity
- revenue opportunity
- credential expiring
- referral stalled

Signals must retain provenance.

### 10.3 Activity / Timeline Engine

Create a normalized timeline abstraction over domain events while preserving domain ownership and authorization.

## 11. Notifications and communications

The Notification Engine should produce governed notification intents rather than allowing arbitrary domain code to send messages directly.

A notification intent should include:

- recipient
- purpose
- permitted channel(s)
- sensitivity/PHI classification
- content template/data
- delivery requirement
- evidence state

PHI-containing or regulated messages require approved channels and appropriate policy.

Prepared does not mean delivered.

## 12. Integrations and connectors

Use one connector taxonomy and readiness model.

Canonical states include:

- READY
- CONFIGURED
- MANUAL_FALLBACK
- ADAPTER_READY
- PENDING_CONNECTION
- EXTERNAL_APPROVAL_REQUIRED
- BLOCKED

Connector activation should consider:

- organization entitlement
- customer-funded allowance where applicable
- credentials/secrets
- vendor readiness
- BAA/compliance approval where required
- health/reliability state

Do not present configured-looking UI as proof a connector is live.

## 13. Jobs, retries and reliability

Cross-system and long-running work requires a shared workflow/job abstraction.

It must support:

- idempotency
- retry policy
- exponential backoff
- dead-letter state
- failure reason
- human recovery path
- correlation to Path/event/transaction

Path state must survive connector or worker failure.

## 14. Search and command

Universal search/command is authorization-filtered.

It may search legitimate objects such as:

- patients
- providers
- organizations
- Grid resources/demand
- Paths
- tasks
- referrals
- documents
- EDU content

Search must never return an object merely because it exists; authorization is part of retrieval.

## 15. Outcome telemetry and Time-to-Outcome

Klinikos should measure whether work actually moves.

Outcome telemetry may record:

- Path started/completed/abandoned
- blocker frequency
- time between nodes
- time to first useful action
- time to completion
- recovered capacity/revenue only when legitimately derived
- Grid match/offer/booking/fulfillment conversion
- referral closure
- activation success

**Time-to-Outcome** is the duration from a valid goal/intention start to a defined useful outcome.

Do not optimize vanity engagement metrics at the expense of real operational outcomes.

## 16. Klinikos Intelligence / Zumi architecture

Zumi is a provider-neutral orchestration and reasoning layer.

It should consume structured engines rather than recreating their authority inside prompts.

Desired loop:

`UNDERSTAND → IDENTIFY UNKNOWN → RETRIEVE AUTHORIZED CONTEXT → PLAN → CHOOSE TOOLS → EXECUTE SAFE WORK → CROSS-CHECK → EXPLAIN → PRESENT NEXT ACTION`

Zumi may:

- interpret intent
- summarize
- compare
- research permitted public information
- explain blockers
- prepare actions
- coordinate tool use
- render structured results/workspaces

Zumi may not override:

- authentication
- authorization
- eligibility
- clinical release
- credential verification
- payment evidence
- safety holds
- binding/destructive confirmation requirements

PHI/sensitive data must be redacted before unrestricted external providers/tools receive it.

Core Klinikos workflows remain usable when Zumi is unavailable.

## 17. Clinic OS architecture

Clinic OS uses shared engines rather than bespoke page logic.

Priority domains include:

- patient registry/search
- intake/forms/documents
- scheduling
- staff tasks
- follow-up
- referrals/results
- provider workflow
- owner/operator priorities
- billing readiness
- revenue opportunities
- communications
- inventory where implemented

Domain events should advance Paths only through explicit adapters and allowlisted transitions.

## 18. Care architecture

Care is governed care coordination/navigation, not autonomous diagnosis.

Use shared identity, permission, consent, Path, event, notification and human-review engines for:

- appointments
- forms
- referrals
- results
- follow-up
- provider review
- patient navigation
- care-team coordination

Clinical judgment stays with qualified human professionals where required.

## 19. EDU architecture

EDU is part of the same identity, competency and opportunity ecosystem.

Lifecycle:

`LEARN → PRACTICE → QUALIFY → CREDENTIAL → ENTER GRID → OPPORTUNITY → WORK → REPUTATION → CONTINUING EDUCATION`

Education achievements may inform capability/eligibility only when verified by governed credential/evidence processes.

## 20. Patient architecture

Patient-facing Klinikos is intentionally simpler.

Prioritize:

- next appointment/action
- forms/documents
- balances/payment state where supported
- messages
- referrals/follow-up
- care navigation

Never expose internal clinic administration, unrestricted Grid data, backend architecture vocabulary or organization-wide operational intelligence.

## 21. Security architecture

Security is a system property, not a feature.

Required principles include:

- least privilege
- tenant isolation
- role/resource authorization
- patient-context isolation
- explicit consent/data-sharing rules
- encryption in transit and at rest where applicable
- auditability
- MFA where appropriate
- secrets management
- vendor/BAA governance
- rate limiting and abuse prevention
- backup and recovery
- incident response
- secure software/dependency practices
- retention/deletion policy

Do not combine databases or expose data merely because two applications communicate.

## 22. Data boundary law

Clinical data does not automatically flow into Grid, education, public profiles or marketing.

Grid staffing/resource workflows receive only the minimum data needed for the permitted transaction.

Education data does not automatically become clinical data.

External Artificial Intelligence providers receive only the minimum authorized data required for the task.

## 23. Frontend projection law

The frontend projects backend truth without exposing backend complexity.

Living Home should answer:

- what is happening
- what needs me
- what should I do next
- what is blocked
- what changed
- what opportunity exists

Backend terms such as Path IDs, policy engine, entitlement resolver or state machine should not be shown to normal users.

The approved cinematic rose reference governs converted product surfaces as defined in `docs/SOURCE_OF_TRUTH.md`.

## 24. Repository implementation law

Before changing architecture:

1. inspect current code, schema, migrations and tests;
2. classify relevant components as BUILT, PARTIAL, PLACEHOLDER, DEMO ONLY, NOT BUILT, NEEDS REFACTORING or REUSABLE SHARED SERVICE;
3. reuse existing models/services when they satisfy the contract;
4. add adapters before destructive rewrites;
5. keep domain authority deterministic;
6. preserve concurrent work;
7. run meaningful merge-ready gates.

Do not claim a subsystem is implemented because a document describes it.

## 25. Current convergence order

Unless current code evidence requires a safer dependency order:

### Phase A — shared orchestration fabric

Contracts → Capability/Policy → Intent → Path Runtime → Next Actions → Blockers/Alternatives → Events → Signals

### Phase B — durable shared state

Path persistence → event ledger → notifications → activity/timeline → human review → jobs/retries → telemetry

### Phase C — cross-domain execution

Clinic OS ↔ Grid ↔ Referrals/Care ↔ EDU/Credentials ↔ Financial obligations/payments ↔ Connectors

### Phase D — universal coordination

Relationship graph → generalized matching → resource/demand composition → reservations → fulfillment → reputation

### Phase E — intelligence and measurement

Zumi consumes structured engines → universal command/search → outcome telemetry → Time-to-Outcome optimization

## 26. Absolute rules

1. Do not reduce Klinikos to an EHR or clinic dashboard.
2. Do not claim capability without repository/runtime evidence.
3. Do not expose protected healthcare information unnecessarily.
4. Do not let Artificial Intelligence override deterministic authorization or eligibility.
5. Do not let browser state establish payment truth.
6. Do not fake external integration, delivery, verification or completion.
7. Preserve human review where policy requires it.
8. Core workflows remain usable when Intelligence/connectors are degraded.
9. Preserve Path state across subsystem failure.
10. Prefer shared engines over duplicated domain logic.
11. Reuse existing models/services before introducing new ones.
12. Use integer cents for financial state.
13. Keep patient, organization and Grid data boundaries explicit.
14. Every consequential transition must be auditable.
15. Backend complexity should produce frontend simplicity.

## 27. Completion law

Architecture work is complete only when the contracts are implemented in code, current domain services consume them, durable state is persisted where required, tests prove security and state transitions, and production/build gates are green.

A document alone is never completion.

## 28. Final objective

**ONE KLINIKOS IDENTITY.**

**MULTIPLE GOVERNED CONTEXTS.**

**ONE SHARED ORCHESTRATION FABRIC.**

**DURABLE PATHS FROM INTENT TO OUTCOME.**

**MULTIPLE SPECIALIZED EXPERIENCES.**

**STRICT DATA BOUNDARIES.**

**PERMISSIONED CROSS-SYSTEM EXECUTION.**

**ONE ECONOMIC AND CARE NETWORK.**

**MEASURED TIME TO OUTCOME.**

The user experiences one coherent system.
The architecture handles the complexity underneath.
