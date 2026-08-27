# KLINIKOS OPERATING NETWORK KERNEL DESIGN

Date: 2026-08-26  
Status: APPROVED ARCHITECTURAL DESIGN, IMPLEMENTATION NOT YET AUTHORIZED BY SPEC REVIEW  
Repository: `jcamacho611/Clinicos-by-Zumi`  
Design branch: `design/klinikos-final-form-universal-experience-20260826`

## 0. Purpose

This document converts the approved founder direction into a repository-level architecture contract.

Klinikos is not being redesigned as a larger EHR, a larger feature catalog, or a collection of adjacent SaaS modules. The target is one governed healthcare operating network whose visible experience becomes simpler as the system underneath becomes more capable.

Canonical brand statement:

> **Klinikos. The clinic operations ecosystem, powered by Zumi.**

Core architecture law:

> **Complexity belongs in Klinikos, not in the user's hands.**

Internal expression:

> **Complexity underneath. Clarity above. Intelligence everywhere. One best next move.**

This design does not authorize a big-bang rewrite. Existing authoritative systems are preserved, corrected, converged, and generalized in dependency order.

---

# 1. Repository truth at design approval

At approval time, current `main` was `5c93b4079d6080055a1f97527164a1fa763ab52f`.

The existing final-form design branch was at `944b4ad8c1c0f8e37d3833c0021b20ddfa248b32` and had diverged from `main`. The commits unique to current `main` were documentation-only funding and Kentucky staffing corrections with no direct overlap with this architecture. The branch also contains the existing universal-experience design work represented by PR #356.

Implementation must re-check `main`, the design branch, relevant open PRs, deployment truth, schema, migrations, tests, route registry, feature status, canons, and production evidence before each runtime tranche. Old SHA references are never treated as current merely because they appear in this document.

Current repository architecture already contains substantial material across:

- Living Home
- Zumi / Klinikos Intelligence
- Clinic OS / Care
- Current Visit
- Grid
- Network / capacity
- EDU / Workforce
- Patient
- Billing / Financial OS
- identity / account / organization / roles
- trust / verification / credentials
- commercial activation
- payments
- audit / events / provenance
- interoperability adapters
- security / safety controls
- design systems and multiple historical visual layers

This work must converge those systems. It must not create a second Grid, second Zumi, second identity authority, second Financial OS, second Clinic OS, second entitlement system, or second product-truth authority.

---

# 2. Product definition

Klinikos is the governed operating network through which healthcare work, care, people, capacity, education, professional identity, relationships, financial obligations, evidence, and intelligence can move.

It may contain capabilities that the market would separately label:

- EHR / EMR
- practice management
- scheduling
- telemedicine
- billing / revenue cycle
- patient portal
- CRM
- staffing marketplace
- professional network
- education / workforce platform
- AI copilot
- analytics
- provider directory
- payments
- resource marketplace

Those names describe capabilities, not the company architecture.

The user should experience one Klinikos.

---

# 3. New permanent commercial laws

The following laws are approved and must be encoded into product, commercial, design, and implementation decisions.

## 3.1 Free participation is distribution infrastructure

Free individual participation is not primarily a cheaper subscription tier.

It creates:

- supply
- demand
- density
- liquidity
- professional identity
- relationships
- referrals
- invitations
- career mobility
- discovery
- learning progression
- network distribution

Basic individual participation should generally remain free or low-friction where economically and legally appropriate.

Organizations pay when they need leverage: control, automation, volume, workflow, analytics, operational authority, enterprise administration, implementation, premium distribution, institutional delivery, or lawful transaction economics.

## 3.2 Land without displacement

Do not make initial customer value depend on replacing an incumbent system.

A clinic may first receive value from:

- Grid
- staffing
- referrals
- capacity
- organization identity
- Operating Map / workflow analysis
- revenue-readiness work
- communications
- implementation services
- selected operational workflows

Klinikos may coexist with an incumbent EHR while earning the right to absorb more workflow.

## 3.3 Expand by usefulness

Expansion occurs because the next Klinikos capability solves a problem the participant already has.

Do not use artificial product fragmentation merely to create upsells.

## 3.4 Replace by earned trust

A system should be replaced only when Klinikos can provide the necessary workflow, safety, reliability, authority, migration, support, and economic case.

Use the vendor lifecycle:

`CONNECT -> ABSTRACT -> CONTROL -> INTERNALIZE -> REPLACE`

or `NEVER REPLACE` when the external rail remains the rational authoritative infrastructure.

## 3.5 Founder omission does not equal engineering omission

A professional requirement does not become optional because the founder did not know the technical term required to request it.

Architecture must proactively account for normal requirements of a large-scale corporation, including reliability, security, privacy, accessibility, observability, release engineering, migration discipline, incident response, fraud/abuse controls, financial truth, legal evidence, auditability, data lifecycle, support, operational metrics, and disaster recovery.

## 3.6 No known failure may disappear silently

Every material failure must become one or more of:

- a visible state
- a retry
- a reconciliation item
- an owned obligation
- an alert
- an audit record
- a manual fallback
- a blocked state
- an incident

The happy path is not the architecture.

## 3.7 Customer dependence comes from value, not lock-in

Klinikos should become difficult to leave because it creates accumulated operational value, governed relationships, history, evidence, efficiency, and network utility, not because it hides data, traps customers, or creates artificial switching barriers.

---

# 4. Universal user order of operations

The canonical growth and product journey is:

1. **DISCOVER**
2. **RECEIVE VALUE**
3. **EXPRESS INTENT**
4. **CREATE FREE IDENTITY WHEN PERSISTENCE MATTERS**
5. **BUILD PROFILE / CLAIMS**
6. **VERIFY ONLY WHAT THE NEXT ACTION REQUIRES**
7. **ENTER GRID / RELEVANT NETWORK EXPERIENCE**
8. **RECEIVE OPPORTUNITY / CONNECTION / WORK / LEARNING VALUE**
9. **BUILD EVIDENCE + RELATIONSHIPS**
10. **RETURN**
11. **INVITE / REFER / CONNECT OTHERS**
12. **ORGANIZATION ENTERS OR DEEPENS**
13. **OPERATING MAP IDENTIFIES BUSINESS FRICTION**
14. **KLINIKOS SOLVES ONE WORKFLOW**
15. **PAID IMPLEMENTATION / SUBSCRIPTION / CONTRACT**
16. **CARE + MONEY + OPERATIONS EXPAND**
17. **MORE WORK RUNS THROUGH KLINIKOS**
18. **MORE GRID SUPPLY / DEMAND IS CREATED**
19. **NETWORK BECOMES MORE USEFUL**
20. **RETURN / EXPANSION FEEDS DISTRIBUTION AGAIN**

This sequence is a product/commercial architecture, not a requirement that every user literally traverses twenty screens.

---

# 5. Acquisition and distribution engine

Public routes should act as high-intent doors into one ecosystem.

Examples include:

- `/ehr`
- `/ehr/independent-practices`
- `/telemedicine`
- `/ai-medical-scribe`
- `/billing-readiness`
- `/no-fault`
- specialty pages
- `/labs`
- `/imaging`
- `/referrals`
- `/clinic-operations`
- `/grid`
- `/edu`
- truthful competitive-comparison routes where evidence supports them

Canonical route lifecycle:

`SEARCH / REFERRAL / SOCIAL / DIRECT -> PROBLEM ROUTE -> USEFUL ANSWER -> PUBLIC PROOF -> ZUMI CONTEXT -> NEXT ACTION -> IDENTITY WHEN NEEDED -> STRUCTURED INTENT -> RELEVANT DOMAIN -> VALUE -> RETURN / COMMERCIAL PATH`

SEO traffic is not the goal. Structured demand is the goal.

Intent must survive authentication and onboarding when technically safe.

---

# 6. Frontend contract

The simple frontend is evidence of a sophisticated system capable of hiding unnecessary complexity.

A normal user should primarily see:

- what matters
- what changed
- what requires them
- what should happen next

Default product composition should favor:

- one primary priority
- approximately 2-4 meaningful attention items
- one primary action
- ambient `Ask Klinikos`
- detail on demand

Role-level experience laws:

- Provider: **one visit**
- Staff: **one handoff**
- Patient: **one next action**
- Biller: **one truthful exception queue**
- Owner: **one operating picture**
- Student: **one next step toward opportunity**
- Professional: **one evolving identity and opportunity network**
- Enterprise: **one governed operating picture across fragmented systems**

Permanent navigation should remain role-aware and restrained. Hidden navigation never changes server-side authority.

Progressive disclosure is mandatory.

## 6.1 Visual identity correction

Brand atmosphere is subordinate to product clarity.

No decorative motif is permanent.

The interface itself is the signature.

The rose/flower is retired as a required product identity and must not remain a governing requirement merely because historical canons reference it. Existing rose assets may survive as non-authoritative historical/optional brand material only where deliberately chosen and where they do not compete with product work.

Do not replace the rose with another mandatory decorative gimmick.

Preferred visual law:

> **Order emerging from complexity, expressed with extreme restraint.**

Light mode target:

- warm ivory / bone / pearl
- graphite / near-black
- black cherry / oxblood
- restrained copper / dusty rose accents
- exceptional typography
- strong negative space
- subtle state-driven depth

Dark mode target:

- obsidian / true black
- black cherry / oxblood
- warm ivory
- restrained ember/copper/coral highlights
- controlled illumination

No cars, stock-doctor imagery, AI brains, giant flowers, giant glowing orbs, meaningless network wallpaper, generic medical blue, or dashboard-card theater.

---

# 7. Backend kernel architecture

The backend should converge around shared kernels with explicit authority boundaries.

## 7.1 Identity Kernel

Owns:

- one persistent person identity
- login/account linkage
- identity assurance state
- active context
- multiple simultaneous/evolving relationships

Invariant: account existence never grants authority.

## 7.2 Organization Kernel

Owns:

- organizations
- locations
- departments
- memberships
- effective dates
- organization relationships

Invariant: tenant and organization context are server-owned.

## 7.3 Trust / Authority Kernel

Owns:

- claims
- verification evidence
- credentials
- affiliation
- authority
- privileges
- purpose
- consent/proxy relationships
- agreement evidence

Invariant:

`CLAIM != VERIFIED FACT != AUTHORITY`

## 7.4 Intent Kernel

Owns structured understanding of:

- `I AM`
- `I NEED`
- `I HAVE`
- `I WANT TO DO`

Zumi may interpret intent. Deterministic policy owns consequential authorization and eligibility.

## 7.5 Work / Obligation Kernel

Owns:

- work item
- owner
- due state
- dependency
- blocker
- escalation
- exception
- completion evidence

Invariant: created is not completed.

## 7.6 Grid Kernel

Owns governed supply, demand, capacity, opportunity, matching, offers, reservations, fulfillment, disputes, and related transaction state.

Invariant: hard eligibility precedes ranking.

## 7.7 Network Relationship Graph

Owns durable useful relationships created through care, Grid, EDU, enterprise, referral, business, and organization activity.

Invariant: graph relationship does not independently grant access or authority.

## 7.8 Clinical Kernel

Owns authoritative clinical workflow state including patient context, Current Visit, Clinical Change, orders, results, documentation, BodyMap, specialty composition, and clinical provenance.

Invariant: clinical truth remains attributable and is never manufactured by AI.

## 7.9 Financial Kernel / Financial OS

Owns:

- server-owned price
- quote
- checkout intent
- payment intent
- payment evidence
- entitlement
- obligation
- payable
- refund
- settlement
- reconciliation
- revenue-integrity state

Invariant: redirect is not payment; obligation is not settlement.

## 7.10 Evidence / Audit Kernel

Owns evidence and attribution for consequential events and state transitions.

Invariant: consequential events never silently disappear.

## 7.11 Communication Kernel

Owns provider-agnostic communication intent and evidence for email, SMS, voice, messaging, and related channels.

Invariant: prepared, sent, accepted, delivered, failed, and replied are distinct where evidence supports those states.

## 7.12 Integration Kernel

Owns adapter lifecycle, credentials/configuration state, health, retries, external correlation, reconciliation, and vendor abstraction.

Invariant: configured, connected, UAT, controlled production, and production verified are distinct states.

## 7.13 Zumi Kernel

Owns authorized context, retrieval, research, planning, drafting, explanation, orchestration, and tool routing.

Invariant: Zumi is intelligence, never authority.

## 7.14 EDU Kernel

Owns education/program/cohort/simulation/assessment/evidence/human-review/completion state.

Invariant: education completion never manufactures professional licensure or clinical authority.

## 7.15 Entitlement Kernel

Owns free/paid/included/usage/organization/contract entitlements.

Invariant: payment cannot buy regulated authority.

## 7.16 Analytics Kernel

Owns product, customer, operational, commercial, and network measurement with explicit evidence class.

Invariant: estimated, projected, verified, realized, and collected are not interchangeable.

## 7.17 Search / Knowledge Kernel

Owns retrieval and indexed knowledge access.

Invariant: retrieval result does not become authoritative domain truth merely because it was returned.

## 7.18 Reliability Kernel

Cross-cutting runtime controls include queues, retries, backoff, dead-letter handling, reconciliation, idempotency, correlation IDs, observability, rollback, backups, restore, and incident workflow.

---

# 8. Global truth-state laws

Never collapse:

- `CLAIM != VERIFIED FACT != AUTHORITY`
- `MATCH != OFFER != ACCEPTANCE != RESERVATION`
- `BOOKING != FULFILLMENT`
- `PAYMENT INTENT != PAYMENT`
- `FINANCIAL OBLIGATION != SETTLEMENT`
- `ORDER CREATED != EXTERNAL ACCEPTANCE`
- `RESULT RECEIVED != PROVIDER REVIEW`
- `REFERRAL CREATED != REFERRAL CLOSED`
- `COURSE COMPLETED != PROFESSIONAL AUTHORITY`
- `CODE EXISTS != DEPLOYED`
- `DEPLOYED != PRODUCTION VERIFIED`
- `AI INTERPRETATION != AUTHORITATIVE FACT`

Every consequential transition should preserve the applicable subset of:

- actor
- timestamp
- identity
- organization
- location
- authority
- purpose
- consent
- source
- prior state
- new state
- idempotency key
- external correlation
- evidence/provenance
- retry/reconciliation state
- audit reference

---

# 9. Failure-mode architecture

The platform must intentionally account for realistic failure classes.

## 9.1 Request and concurrency failures

- duplicate request
- double-click / double-submit
- stale browser state
- two authorized users editing simultaneously
- retry after timeout
- partial write
- race for scarce capacity

Required controls may include idempotency, optimistic concurrency, transactions, locking where justified, deterministic conflict responses, and reconciliation.

## 9.2 External-system failures

- timeout followed by late success
- external rejection after local preparation
- duplicate webhook
- webhook replay
- webhook reordering
- provider degradation
- provider outage
- vendor credential expiry
- external schema/version change

Required controls may include correlation IDs, signed evidence, idempotent consumers, inbox/outbox patterns where justified, retries with backoff, dead-letter handling, reconciliation queues, manual fallback, and explicit degraded states.

## 9.3 Identity / authority failures

- revoked employment
- expired credential
- changed organization
- removed privilege
- withdrawn consent
- caregiver/proxy expiry
- terminated user
- stale session

Authority must be evaluated against current server truth for consequential actions.

## 9.4 Clinical/data failures

- duplicate result
- conflicting result
- unsigned draft
- addendum after signature
- wrong-patient risk
- laterality conflict
- incomplete handoff
- unavailable integration

Do not let AI fill missing truth.

## 9.5 Financial failures

- duplicate payment event
- failed payment
- partial refund
- full refund
- chargeback/dispute
- obligation without payout
- payout without reconciliation evidence

Financial OS owns the truth transition.

## 9.6 Communication failures

- bounce
- opt-out
- reassigned phone
- provider rejection
- delayed delivery
- unavailable transport

Never report delivery without evidence.

## 9.7 Platform failures

- bad deploy
- failed migration
- incompatible schema
- queue outage
- database outage
- cache inconsistency
- regional/provider outage
- backup corruption
- failed restore

Architecture must include release gates, migration safety, rollback, restore testing, observability, alerts, runbooks, and incident ownership.

## 9.8 Abuse and security failures

- fake clinics
- fake clinicians
- fake jobs
- impersonation
- credential fraud
- malicious upload
- prompt injection
- model/tool exfiltration attempt
- cross-tenant access attempt
- rate abuse
- spam
- marketplace manipulation

Controls include verification, least privilege, data minimization, safe upload pipeline, rate limiting, risk signals, moderation, audit, tenant isolation, secrets management, and human review.

---

# 10. Grid as distribution and economic graph

Grid is the universal healthcare supply/demand/capacity/opportunity layer.

Public grammar remains:

> **I NEED**
>
> **I HAVE**

Grid may govern policy-approved instances of:

- students
- workers
- clinicians
- professional services
- clinics
- employers
- schools
- educators
- vendors
- jobs
- shifts
- rooms
- chairs
- offices
- facilities
- equipment
- training
- placements
- preceptors
- specialist capacity
- diagnostic capacity
- referral capacity
- business services
- other lawful resources

Basic individual participation should remain free where feasible because it creates network liquidity.

Monetization should generally target organizational leverage and governed economic value rather than taxing every individual interaction.

Potential organization monetization includes:

- Clinic OS
- recruiting workflow
- advanced Grid administration
- premium distribution
- workflow automation
- communications
- analytics
- institutional EDU
- enterprise support
- implementation
- integrations
- lawful transaction economics

Never let payment, sponsorship, popularity, or AI preference override hard eligibility.

---

# 11. Professional lifecycle architecture

Preserve one evolving person across:

`STUDENT -> LEARNER -> COMPETENCY EVIDENCE -> PLACEMENT -> CREDENTIAL -> ELIGIBLE PROFESSIONAL -> WORK -> EXPERIENCE -> REPUTATION -> INDEPENDENT PROFESSIONAL -> PRACTICE OWNER -> EMPLOYER -> EDUCATOR / PRECEPTOR`

This lifecycle is a major source of long-term network defensibility.

EDU evidence may inform opportunity discovery only through appropriate authority and eligibility checks.

Reputation should begin with objective fulfillment/evidence where possible and must never substitute for required credentials.

---

# 12. Clinic land-and-expand architecture

Do not frame the first clinic conversation as a mandatory EHR replacement.

Target progression:

`PUBLIC VALUE -> FREE / LOW-FRICTION PARTICIPATION -> GRID VALUE -> ORGANIZATION VERIFICATION -> OPERATING MAP / ANALYSIS -> FIRST WORKFLOW -> PAID IMPLEMENTATION -> RECURRING OPERATIONS -> REVENUE / ZUMI -> CURRENT VISIT -> BROADER CLINIC OS -> SELECTIVE VENDOR REPLACEMENT`

The first-practice implementation should measure:

- current software stack cost
- staff time
- provider time
- number of steps/screens
- unfinished work
- telemedicine friction
- documentation time
- coding/billing handoff
- labs/imaging/referral friction
- workflow errors
- customer support burden

Claims such as faster, cheaper, or better become external claims only after evidence supports them.

---

# 13. First clinic / Current Visit proof

The first deep clinical proof remains the clinician-derived requirement for one continuous medical visit.

Provider sequence:

`PATIENT SNAPSHOT -> WHAT CHANGED -> STAFF HANDOFF -> TODAY -> CLINICAL -> ASSESSMENT & PLAN -> ORDERS & RESULTS -> DOCUMENTATION & CODING -> CLOSE VISIT`

Telemedicine is an encounter mode inside this visit, not a second chart.

Longitudinal model:

`INITIAL -> PREVIOUS -> TODAY`

Track evidence-backed change in symptoms, pain, body region/laterality, function/ADLs, ROM, findings, medications, work status, treatment progression, procedure response, labs, imaging, and other relevant clinical evidence.

AI may summarize or explain verified change.

AI may never invent change.

Staff work should arrive as a handoff rather than be recreated by the provider.

Specialty depth should compose through shared primitives and specialty packs rather than creating forked clinical architectures.

---

# 14. Zumi authority boundary

Zumi may:

- understand
- retrieve
- research
- summarize
- organize
- prepare
- draft
- recommend
- explain
- route
- orchestrate authorized actions

Zumi may not independently create:

- identity
- credential truth
- organization ownership
- professional authority
- clinical truth
- RBAC
- patient consent
- signature
- payment truth
- settlement truth
- licensure
- Grid eligibility

Deterministic engines and authoritative evidence own consequential execution.

Zumi's visible presence should be ambient and context-specific rather than a separate module requiring the user to "open AI."

---

# 15. Corporate-grade engineering floor

The company must implement normal large-scale engineering disciplines without waiting for founder prompts.

Required disciplines include:

- architecture decision records
- API/interface contracts
- schema ownership
- migration discipline
- code ownership
- TDD for behavioral changes
- unit tests
- integration tests
- database-backed tests for critical repositories
- end-to-end journey tests
- security testing
- tenant-isolation negative tests
- performance tests
- load tests where justified
- accessibility testing
- browser/device testing
- release gates
- environment separation
- secret management
- dependency/supply-chain review
- vulnerability management
- logging
- metrics
- tracing
- alerting
- SLOs / service targets where appropriate
- incident management
- runbooks
- backup
- restore testing
- disaster recovery
- vendor risk
- privacy controls
- retention/deletion
- legal agreement versioning
- audit
- fraud controls
- abuse controls
- moderation
- support tooling
- billing operations
- analytics governance
- feature flags
- rollback

Sophistication is welcome. Unnecessary complexity is not.

---

# 16. Evidence and company-readiness architecture

The product and corporation should continuously generate truthful evidence useful to customers, management, lenders, investors, grantors, workforce buyers, government buyers, and enterprise procurement.

Evidence classes must remain explicit:

- verified fact
- runtime verified
- built/code evidence
- documented user requirement
- external evidence
- proposal
- target
- assumption
- projection
- design intent
- future capability

Track actual metrics where evidence exists:

## Distribution

- source / route
- visitor intent
- registration
- verified participant
- invitation/referral

## Product activation

- time to first value
- first Grid action
- first match
- first useful workflow
- first successful return

## Network

- real demand
- eligible supply
- time to match
- offer rate
- acceptance
- reservation
- fulfillment
- dispute
- repeat relationship
- market-cell density

## Commercial

- qualified account
- paid analysis
- implementation
- subscription
- expansion
- churn/retention
- cash received
- gross/contribution margin

## Customer outcome

- verified time savings
- workflow-cycle reduction
- completed obligations
- revenue made ready
- revenue actually collected only when payment evidence exists
- capacity utilization
- reduced vendor cost where proven

## Engineering

- deployment state
- error rate
- latency
- queue/retry/dead-letter state
- security findings
- restore evidence
- tenant-isolation test health
- incident history

Do not convert projection into actual performance.

---

# 17. Capital resilience

The architecture must support two operating modes.

## 17.1 Capital-independent path

Without external financing, the company can progress through narrower sequencing:

- free distribution
- Grid participation
- founder-led sales
- paid assessment / implementation
- first-practice proof
- service revenue where appropriate
- narrow recurring workflow value
- customer-funded variable usage
- staged integrations

## 17.2 Capital-accelerated path

Capital may accelerate:

- product completion
- security/compliance maturity
- implementation capacity
- staffing
- sales/distribution
- integrations
- infrastructure
- customer acquisition
- working capital
- enterprise readiness

Capital cannot substitute for product-market fit, authority, clinical safety, payment truth, or customer evidence.

---

# 18. Implementation decomposition

This design is intentionally too broad for one implementation plan or one PR.

Implementation must be decomposed into independently reviewable, testable tranches.

## Tranche A: Truth and canon convergence

Goals:

- establish this design as the approved parent architecture
- mark superseded/contradictory visual and commercial language explicitly
- reconcile PR #356 with current `main`
- preserve source-locked founder and clinician requirements
- define machine-readable truth/supersession controls where absent
- eliminate competing declarations of the canonical category statement and visual law

## Tranche B: Shared kernel inventory and contracts

Goals:

- map existing identity, organization, authority, event, audit, entitlement, work, Financial OS, Grid, Zumi, and clinical services to canonical owners
- identify duplicates
- classify each as KEEP / REFACTOR / MERGE / MOVE / SPLIT / DEPRECATE / BUILD
- define typed interfaces before structural changes

## Tranche C: Free distribution and intent persistence

Goals:

- connect public routes to structured intent
- preserve safe intent through signup
- support free individual identity where appropriate
- route into existing Grid instead of parallel opportunity products
- instrument source, activation, and first value

## Tranche D: Grid return and invitation loop

Goals:

- profile + `I NEED / I HAVE`
- invitation/referral with reason/context
- truthful match/offer/reservation/fulfillment states
- return experience based on real opportunities and unfinished actions

## Tranche E: Organization conversion

Goals:

- organization claim and verification
- official representation without email-as-authority shortcuts
- free organization network value
- Operating Map / assessment
- paid conversion into implementation / operations

## Tranche F: First clinic proof

Goals:

- Current Visit convergence
- Staff Handoff
- Clinical Change
- telemedicine within encounter
- documentation/coding readiness
- first-practice measurement
- incumbent coexistence / integration path

## Tranche G: Reliability and failure-mode hardening

Goals:

- idempotency
- concurrency controls
- outbox/inbox where justified
- retry/backoff
- DLQ/reconciliation
- observability
- incident/runbook coverage
- backup/restore evidence
- external-provider failure behavior

## Tranche H: Economic and evidence instrumentation

Goals:

- acquisition attribution
- activation
- Grid liquidity
- paid conversion
- implementation
- recurring revenue
- retention/expansion
- verified customer outcomes
- lender/investor/customer evidence projections from authoritative state

## Tranche I: Network compounding

Goals:

- EDU-to-Grid
- worker-to-employer
- clinic-to-provider
- clinic-to-vendor/service
- clinic-to-referral-capacity
- repeat-relationship reduction of future friction

## Tranche J: Enterprise maturity

Goals:

- hierarchy
- stronger delegated administration
- SSO where justified
- enterprise policy
- procurement/trust evidence
- scale testing
- mature interoperability
- support/SLA controls where commercially justified

Each tranche requires its own implementation plan, tests, review, and verification.

---

# 19. Definition of done

A capability is not complete because code or a page exists.

For a capability to be called complete, the applicable path must support:

1. discovery
2. understandable value
3. correct identity/context
4. authorization/eligibility
5. domain authority
6. real data/evidence
7. persistence/event truth
8. truthful result
9. realistic failure handling
10. recovery/manual fallback where required
11. audit/provenance
12. accessibility
13. responsive/mobile behavior
14. external dependency truth
15. analytics/evidence
16. a clear next action
17. commercial/value outcome where the capability has one

Merged, deployed, and production verified remain separate states.

---

# 20. Security, privacy, and proprietary boundary

The browser is inspectable and untrusted.

Keep minimum-necessary state client-side.

Server-side confidential machinery includes, where applicable:

- hidden Zumi prompts
- Grid ranking weights
- anti-gaming logic
- fraud/risk rules
- confidential orchestration
- private economics
- security heuristics
- unnecessary PHI
- restricted clinical logic

Patient clinical information does not automatically flow into Grid, marketing, EDU, public profiles, or analytics that do not have a lawful/authorized need for it.

AI receives minimum necessary authorized context.

Frontend visibility is never authorization.

---

# 21. Explicit non-goals

This architecture does not authorize:

- claiming guaranteed commercial success
- claiming guaranteed financing
- claiming unverified HIPAA compliance
- claiming ONC certification without certification
- fabricating customers or revenue
- fabricating Grid supply/demand
- creating one enormous rewrite PR
- replacing every external vendor
- exposing proprietary internals in public UI
- forcing all users through the same onboarding
- making Grid a securities marketplace without legal/commercial design
- making AI authoritative
- creating separate accounts for every evolving role
- turning a completion badge into professional authority

---

# 22. Architectural acceptance tests

Future implementation should be challenged against these questions.

## Frontend simplicity

Can the role understand within seconds:

- where they are
- what matters
- what to do next

If not, the surface is too complicated.

## Backend integrity

Can the system explain:

- who initiated the consequential state
- what authority applied
- what evidence exists
- what failed
- who owns the failure
- what happens next

If not, the backend is not mature enough.

## Distribution

Can an individual receive real value before an organization buys Clinic OS?

If not, the free-distribution thesis is not implemented.

## Land without displacement

Can a clinic derive value while retaining an incumbent system?

If not, the commercial architecture is too brittle.

## Grid

Can the system distinguish eligibility from ranking, match from offer, booking from fulfillment, and obligation from settlement?

If not, Grid truth has collapsed.

## Zumi

Can Zumi help without becoming authority?

If not, the intelligence boundary is wrong.

## Evidence

Can every external claim be labeled by evidence class?

If not, company truth is drifting.

## Scale

Can retries, concurrent activity, provider outages, and partial failures be handled without silent corruption?

If not, large-scale readiness is incomplete.

---

# 23. Governing summary

The target experience is:

> **I tell Klinikos what I need. It understands the context I am authorized to use. It asks only for what the next safe step requires. It shows only what matters. It prepares or executes the work I am authorized to delegate. It preserves the evidence. If something fails, the failure becomes visible work. Then Klinikos tells me what needs to happen next.**

The target business machine is:

`DISCOVERY -> FREE VALUE -> IDENTITY -> GRID -> WORK / LEARNING / RELATIONSHIP -> EVIDENCE -> RETURN -> ORGANIZATION VALUE -> PAID OPERATIONS -> MORE ACTIVITY -> MORE NETWORK VALUE -> MORE DISCOVERY`

The target displacement strategy is:

> **Land without displacement. Expand by usefulness. Replace by earned trust.**

The target engineering law is:

> **Founder omission does not equal engineering omission. No known failure may disappear silently.**

The target product principle is:

> **The interface itself is the signature.**

The architecture should not attempt to make Klinikos look like a billion-dollar corporation. It should remove architectural ceilings so that, if market evidence validates the thesis, the product can grow into one without requiring the company to replace its foundational design.