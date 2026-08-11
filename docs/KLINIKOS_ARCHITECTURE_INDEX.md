# KLINIKOS ARCHITECTURE & SOURCE-OF-TRUTH INDEX

Status: AUTHORITATIVE INDEX
Date: 2026-08-11

This file tells humans and AI agents which Klinikos documents govern which decisions.

## Precedence

When sources conflict, use this order:

1. `docs/CLINICOS_MASTER_CANON.md` — ultimate product and architecture source of truth.
2. `docs/KLINIKOS_CONSTITUTION.md` — operating laws and cross-specialty invariants.
3. Current repository implementation and tests — truth about what is actually built.
4. Current approved architecture decisions / migration notes.
5. Current specialist architecture documents.
6. Current product/status registries that explicitly inherit the Master Canon.
7. Legacy feature registries, old product briefs, demos, historical pricing notes, and earlier Clinicos/Zumi materials — historical context only when they conflict with the above.

No historical document may override the Master Canon merely because it is more detailed.

## Required read order before major implementation

Before changing major architecture, an agent must:

1. Read `docs/CLINICOS_MASTER_CANON.md`.
2. Read `docs/KLINIKOS_CONSTITUTION.md`.
3. Inspect the relevant current source code, schema, tests, migrations, and active pull requests.
4. Read the relevant specialist architecture document if one exists.
5. State any conflict or gap before implementing.

## Current canonical thesis

Klinikos is a universal, composable healthcare operating ecosystem.

It must not be reduced to:

- Electronic Medical Record / Electronic Health Record
- clinic management
- staffing
- Grid marketplace only
- Artificial Intelligence assistant
- patient portal
- education product
- billing software
- medical spa software

Those are domains, applications, experiences, or compositions inside the operating ecosystem.

## Core shared engines

Canonical shared platform engines include:

- Universal Identity
- Organizations / Tenancy
- Relationships / Memberships
- Authorization / Policy
- Consent / Delegation
- Credentials / Eligibility
- Events
- Workflows / Automation
- Klinikos Intelligence Gateway
- Grid Matching / Resource Exchange
- Connector / Integration Runtime
- Financial Ledger / Payments
- Communications
- Documents / Object Storage
- Search / Discovery
- Notifications
- Audit / Provenance
- Analytics / Operational Intelligence
- Security / Governance
- Configuration / Entitlements
- Observability / Reliability

A new reusable primitive may be added when justified. This list is not an artificial ceiling.

## Domain compositions

Known domains and compositions include, without limiting future scope:

- Clinic
- Patient
- Provider
- Grid
- Education
- Network
- Revenue Cycle
- Revenue Recovery / Operational Audit
- No-Fault
- Workers' Compensation
- Medical Spa
- Home Health
- Telehealth
- Remote Patient Monitoring
- Laboratories
- Imaging
- Pharmacy
- Supply Chain / Procurement
- Credentialing
- Referrals
- Care Coordination
- Research / Clinical Trials
- Public / Population Health
- Healthcare Business Services
- Healthcare Facility / Capacity Exchange
- Transportation
- Interpretation / Language Access

## Front-door experience

The intended experience remains:

IDENTITY
→ CONNECT / RESOLVE INTELLIGENCE
→ INTENT DISCOVERY
→ PERMISSION-AWARE ROUTING
→ PERSONALIZED WORKSPACE
→ SAFE ACTION / WORKFLOW.

The frontend must not expose backend architecture unnecessarily.

## Grid scope

Grid is a generalized healthcare resource exchange, not a job board.

It should ultimately be able to combine legitimate healthcare supply and demand involving:

- people
- provider time
- shifts
- rooms
- chairs
- facilities
- capacity
- equipment
- services
- training / placements
- supervision
- professional expertise
- permitted resources / inventory where lawful
- patient demand where appropriate
- organization demand

Multi-party opportunities are first-class. An example such as Facility + Resource + Qualified Clinician + Client Demand is a composition, not the boundary of the system.

## Artificial Intelligence scope

Klinikos Intelligence is provider-agnostic and governed.

Klinikos owns:

- context
- permissions
- tools
- workflows
- prompt/policy versions
- redaction
- Protected Health Information rules
- audit
- cost controls
- safety
- user experience

Model providers supply intelligence where authorized.

Consumer AI subscriptions must never be assumed to include third-party API usage.

## Status truth

The repository must distinguish:

- BUILT
- PARTIAL
- PLACEHOLDER
- DEMO ONLY
- NOT BUILT
- NEEDS REFACTORING
- REUSABLE SHARED SERVICE

External-action statuses must represent reality rather than database intent.

Examples:

Integration: NOT_CONFIGURED / CONFIGURED / CONNECTING / CONNECTED / DEGRADED / FAILED / REVOKED

Communication: PREPARED / APPROVED / QUEUED / PROVIDER_ACCEPTED / DELIVERED / FAILED

Payment: CREATED / PENDING / AUTHORIZED / SETTLED / FAILED / REFUNDED / DISPUTED

Workflow: DETECTED / PREPARED / REQUIRES_REVIEW / APPROVED / EXECUTING / EXECUTED / FAILED / RESOLVED

Match: DISCOVERED / POTENTIALLY_ELIGIBLE / ELIGIBILITY_VERIFIED / OFFERED / ACCEPTED / BOOKED / FULFILLED / CANCELLED / FAILED

## Existing historical business/product context

Older repo notes and prior planning may contain useful ideas such as:

- clinic command center workflows
- patient registry / scheduling / intake
- follow-up and task tracking
- med-spa customer relationship management
- revenue leakage / recovery
- contractor nurse / injector network
- room/chair/location availability
- provider tiers
- inventory
- patient/provider portals
- billing readiness
- referrals/results
- no-fault/workers' compensation
- paid pilots and implementation services

Preserve useful capabilities, but map them into the current Klinikos ecosystem instead of allowing old clinic-first definitions to govern.

Historical cost and pricing estimates are planning artifacts, not canonical current market facts. Re-verify time-sensitive costs, laws, vendor capabilities, and pricing before decisions.

## Cost / founder constraint

Current architecture should remain cost-aware and founder-operable.

Prefer incremental architecture and revenue-capable vertical slices while preserving long-term primitives.

Do not interpret cost-awareness as permission to skip patient safety, authorization, tenant isolation, auditability, privacy, or required security controls.

## Repository migration posture

Do not perform a rewrite simply for naming purity.

For existing code, decide intentionally among:

KEEP
HARDEN
REFACTOR
MOVE
SPLIT
MERGE
DEPRECATE
REPLACE
BUILD NEW
DEFER.

Existing clinic-first and Zumi naming may remain temporarily when changing it would create unnecessary risk. Introduce adapters and canonical abstractions first where appropriate.

## Specialist prompt / architecture library

The repository should eventually contain separate specifications/directives for:

### Technical
- Backend / Core OS
- Frontend / Experience
- Database + Data Architecture
- API + Contract Architecture
- Event + Workflow Architecture
- AI / Intelligence Platform
- Integrations + Healthcare Interoperability
- Cybersecurity / Zero Trust
- Healthcare Compliance + Patient Safety
- Grid / Marketplace / Resource Exchange
- Payments + Financial OS
- Cloud + DevOps + Platform Engineering
- Testing + Verification + Reliability
- Observability + Operations
- Analytics + Intelligence / Data Platform
- Principal Architect / Master Integrator

### Business / Operating
- Product & Product Management
- Healthcare Operations
- Legal / Regulatory
- Clinical Governance
- Sales / Go-to-Market
- Pricing / Monetization
- Marketplace Operations
- University / Education Operations
- Customer Success / Implementation
- Finance / Accounting
- Insurance / Risk
- Enterprise Procurement
- Partnerships
- Competitive Intelligence
- Growth / Network Effects

Every specialist inherits the Master Canon and Constitution and may not silently redefine shared primitives.

## Handoff rules

- Frontend uses backend authorization results but never becomes the security boundary.
- APIs expose canonical contracts and must enforce authorization and validation.
- Data architecture persists canonical domain truth but does not invent policy semantics.
- Events use minimum necessary payloads and never become an uncontrolled PHI bus.
- Workflows coordinate actions through explicit states and failure handling.
- Grid discovers opportunities; eligibility, policy, agreements, and payment determine whether transactions proceed.
- AI interprets and coordinates but cannot bypass deterministic controls.
- Integrations normalize vendor-specific data before core domains depend on it.
- Payments use external regulated rails as appropriate while Klinikos maintains its own ledger semantics.
- Analytics is downstream of operational truth and must not become a shadow transaction system.

## Required acceptance journeys

Major platform work should be tested through end-to-end journeys, including at minimum:

### Core action
IDENTITY → ORGANIZATION → AUTHORIZATION → ACTION → EVENT → WORKFLOW → EXTERNAL/INTERNAL RESULT → AUDIT

### Commerce / provisioning
VERIFIED BUYER → CHECKOUT → SETTLED PAYMENT → ENTITLEMENT → PROVISIONING → IDENTITY → LOGIN → CORRECT ORGANIZATION → ONBOARDING → ACTIVE PRODUCT

### Grid
RESOURCE LISTED → DEMAND CREATED → MATCH DISCOVERED → ELIGIBILITY VERIFIED → OFFER → ACCEPTANCE → AGREEMENT → PAYMENT → BOOKING → SERVICE → FULFILLMENT → PAYOUT → AUDIT

## Updating the source of truth

When a major architecture or product decision is approved:

1. Update the Master Canon if the decision changes the fundamental product definition or architecture contract.
2. Update the Constitution if it changes a cross-platform law/invariant.
3. Add or update a specialist architecture/decision document for detailed implementation guidance.
4. Update repository implementation truth only after code actually changes.
5. Never rewrite history to make unbuilt functionality appear complete.
