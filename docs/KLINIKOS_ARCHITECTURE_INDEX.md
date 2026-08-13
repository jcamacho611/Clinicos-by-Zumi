# KLINIKOS ARCHITECTURE & SOURCE-OF-TRUTH INDEX

Status: `AUTHORITATIVE INDEX`
Date: 2026-08-12

This file tells humans and agents which Klinikos sources govern which decisions.

## Precedence

When sources conflict, use this order:

1. `docs/SOURCE_OF_TRUTH.md` — current explicit product, brand, deployment, commercial, Grid, Zumi, frontend, and engineering law.
2. Current repository implementation, schema, migrations, tests, journeys, CI, and verified runtime/deployment evidence — truth about what actually exists and works.
3. `docs/KLINIKOS_CONSTITUTION.md` — cross-platform invariants that have not been explicitly superseded by current Source of Truth.
4. `docs/CLINICOS_MASTER_CANON.md` — deeper permanent/historical scope direction where it does not conflict with current Source of Truth or implementation evidence.
5. Current specialist architecture/decision documents.
6. `docs/FEATURE_STATUS.md`, `docs/EXTERNAL_DEPENDENCY_MATRIX.md`, and release/status registries that explicitly inherit the sources above.
7. Legacy feature registries, old product briefs, demos, historical pricing notes, old Render URLs/SHAs, ClinicOS/Clinicos branding, and earlier Zumi materials — historical context only.

A more detailed old document does not outrank a newer authoritative correction.

Implementation evidence outranks a roadmap claim when the question is “what exists now.” Canonical direction outranks an implementation accident when the question is “what should the architecture become,” unless the current Source of Truth explicitly changes that direction.

## Required read order before major implementation

Before changing major architecture:

1. Read `docs/SOURCE_OF_TRUTH.md`.
2. Inspect the current `main` implementation, relevant schema/migrations, tests, journeys, active PRs, and CI state.
3. Read `docs/KLINIKOS_CONSTITUTION.md` and the relevant sections of `docs/CLINICOS_MASTER_CANON.md` for deeper invariants/scope.
4. Read the relevant specialist architecture document if one exists.
5. Read `docs/FEATURE_STATUS.md` and `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for implementation/external truth.
6. State and resolve any conflict before implementing.

## Current canonical thesis

Klinikos is a universal, composable healthcare operating ecosystem.

It must not be reduced to any single one of these:

- EHR/EMR;
- clinic management;
- staffing;
- Grid marketplace;
- AI assistant;
- patient portal;
- education product;
- billing/revenue software;
- medical spa software.

Those are domains, experiences, or compositions inside the larger operating ecosystem.

## Core shared engines

Canonical reusable platform engines include, without artificially limiting future primitives:

- Universal Identity;
- Organizations / Tenancy;
- Relationships / Memberships;
- Authorization / Policy;
- Consent / Delegation;
- Credentials / Eligibility;
- Events / Audit / Provenance;
- Workflows / Automation;
- Klinikos Intelligence Gateway;
- Grid Matching / Resource Exchange;
- Connector / Integration Runtime;
- Financial Ledger / Payments;
- Communications;
- Documents / Object Storage;
- Search / Discovery;
- Notifications;
- Analytics / Operational Intelligence;
- Security / Governance;
- Configuration / Entitlements;
- Observability / Reliability.

A new reusable primitive may be added when the domain requires it. This list is not a ceiling.

## Domain compositions

Known domains/compositions include, without limiting future scope:

- Clinic;
- Patient;
- Provider;
- Grid;
- Education;
- Network;
- Revenue Cycle / Revenue Recovery;
- No-Fault;
- Workers' Compensation;
- Medical Spa;
- Home Health;
- Telehealth;
- Remote Monitoring;
- Labs;
- Imaging;
- Pharmacy;
- Supply Chain / Procurement;
- Credentialing;
- Referrals;
- Care Coordination;
- Research / Clinical Trials;
- Public / Population Health;
- Healthcare Business Services;
- Facility / Capacity Exchange;
- Transportation;
- Interpretation / Language Access.

## Front-door experience

The intended experience is:

`IDENTITY → INTENT → PERMISSION-AWARE ROUTING → PERSONALIZED WORKSPACE → SAFE NEXT ACTION → PROGRESS/RESULT`

The frontend must not expose backend architecture unnecessarily.

Living Home is the adaptive front door for authenticated users. Public entry should emphasize outcomes, trust, and clear commercial/product doors rather than an inventory of backend modules.

## Grid scope

Grid is a generalized healthcare resource/opportunity/capacity exchange, not a job board.

It should be able to combine legitimate healthcare supply/demand involving:

- people/provider time;
- shifts/work;
- rooms/chairs/facilities;
- appointment/diagnostic/referral capacity;
- equipment;
- services/professional expertise;
- training/placements/preceptors/supervision;
- permitted supplies/resources where lawful;
- organization demand;
- other future resource classes through the generalized transaction core.

Multi-party compositions are first-class. A Facility + Resource + Qualified Professional + Demand example is a composition, not the boundary of Grid.

Hard eligibility precedes ranking. Deterministic Klinikos state owns credential, payment, transaction, safety, and settlement truth.

## Klinikos Intelligence scope

Klinikos Intelligence is provider-neutral and governed.

Klinikos owns:

- context;
- identity/permissions;
- tools;
- workflows;
- prompt/policy versions;
- redaction/PHI policy;
- audit/provenance;
- cost controls;
- safety;
- user experience.

Model providers supply reasoning capability only where authorized.

AI interprets, drafts, researches, and coordinates. It does not become the source of truth for authentication, eligibility, credentialing, consent, payment, transaction, record release, clinical authority, or safety holds.

## Status truth

Use the current vocabulary from `docs/SOURCE_OF_TRUTH.md` and `docs/FEATURE_STATUS.md`:

- Ready / Built;
- Partially built;
- Manual fallback;
- Adapter ready / Configurable;
- Pending connection;
- Blocked;
- Roadmap / Not built.

External action state must represent evidence rather than database optimism.

Examples:

- Integration: `NOT_CONFIGURED / CONFIGURED / CONNECTING / CONNECTED / DEGRADED / FAILED / REVOKED`.
- Communication: `PREPARED / APPROVED / QUEUED / PROVIDER_ACCEPTED / DELIVERED / FAILED`.
- Payment: `CREATED / PENDING / AUTHORIZED / SETTLED / FAILED / REFUNDED / DISPUTED`.
- Workflow: `DETECTED / PREPARED / REQUIRES_REVIEW / APPROVED / EXECUTING / EXECUTED / FAILED / RESOLVED`.
- Match/transaction: `DISCOVERED / POTENTIALLY_ELIGIBLE / ELIGIBILITY_VERIFIED / OFFERED / ACCEPTED / BOOKED / FULFILLED / CANCELLED / FAILED`.

A browser redirect is not settlement. A queued message is not delivered. An internal credential review is not external board verification. A ledger obligation is not payout movement.

## Existing historical context

Older planning can contain useful capabilities such as clinic command workflows, patient/scheduling/intake, follow-up, med-spa CRM, revenue recovery, contractor networks, room/chair capacity, provider tiers, inventory, portals, billing readiness, referrals/results, no-fault/workers' comp, paid pilots, and implementation services.

Preserve useful capabilities, but map them into the current ecosystem instead of allowing old clinic-first definitions or old brand hierarchy to govern.

Historical cost/pricing estimates are planning artifacts. Current commercial anchors come from server-owned current code and current Source of Truth. Time-sensitive vendor costs, laws, and terms must be reverified externally when used for decisions.

## Cost / founder constraint

Architecture should remain cost-aware and founder-operable.

Prefer revenue-capable vertical slices and measured customer-funded variable usage while preserving long-term primitives.

Cost-awareness never permits bypassing patient safety, authorization, tenant isolation, auditability, privacy, credentialing, financial truth, or required security controls.

## Repository migration posture

Do not rewrite simply for naming purity.

For existing code choose deliberately among:

`KEEP / HARDEN / REFACTOR / MOVE / SPLIT / MERGE / DEPRECATE / REPLACE / BUILD NEW / DEFER`

Legacy `Clinicos`, old slugs, environment names, database identifiers, and historical migration names may remain when renaming them would create needless operational risk. Public product language still remains Klinikos.

## Handoff rules

- Frontend consumes authorization results but never becomes the security boundary.
- APIs enforce canonical contracts, authorization, validation, and tenant scope.
- Data architecture persists domain truth but does not invent policy semantics.
- Events use minimum-necessary payloads and never become an uncontrolled PHI bus.
- Workflows coordinate explicit state, retries, holds, failures, and human review.
- Grid discovers/composes opportunities; eligibility, agreements, payment, safety, and fulfillment govern whether they proceed.
- AI interprets/coordinates but cannot bypass deterministic controls.
- Integrations normalize vendor-specific data before core domains depend on it.
- Payments may use external regulated rails while Klinikos owns its internal intent/evidence/entitlement/ledger semantics.
- Analytics remains downstream of operational truth and does not become a shadow transaction system.

## Required acceptance journeys

Major platform work should be reasoned through complete journeys.

### Core operation

`IDENTITY → ORGANIZATION → AUTHORIZATION → ACTION → EVENT → WORKFLOW → RESULT/FALLBACK → AUDIT`

### Commerce / provisioning

`BUYER → SERVER-OWNED CHECKOUT INTENT → EXTERNAL PAYMENT ATTEMPT → VERIFIED EVIDENCE → ENTITLEMENT → PROVISIONING → IDENTITY → LOGIN → CORRECT ORGANIZATION → ACTIVE PRODUCT`

### Grid

`RESOURCE/DEMAND → MATCH → ELIGIBILITY → OFFER → ACCEPTANCE → RESERVATION → FINANCIAL OBLIGATION → FULFILLMENT → SETTLEMENT EVIDENCE/FALLBACK → AUDIT`

Do not substitute “payment page opened” for settled evidence or “financial obligation exists” for payout.

The automated journey set is defined by `scripts/mvp/run-all.mjs` and documented in `docs/MVP_JOURNEYS.md`.

## Updating source of truth

When a major decision is approved:

1. Update `docs/SOURCE_OF_TRUTH.md` when the decision changes current product/brand/deployment/commercial/security/experience law.
2. Update the Constitution when a cross-platform invariant changes.
3. Update the Master Canon when permanent deep scope/architecture direction changes and does not conflict with the current Source of Truth.
4. Add/update specialist architecture for detailed implementation guidance.
5. Update `FEATURE_STATUS` only after implementation evidence changes.
6. Update `EXTERNAL_DEPENDENCY_MATRIX` only when the real external gate/connection truth changes.
7. Preserve git history instead of rewriting unbuilt functionality as completed.
