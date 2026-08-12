# Klinikos Customer-Funded Access Model

Status: FOUNDATION IMPLEMENTED / FULL BILLING INTEGRATION PARTIAL

## Purpose

Klinikos should not fund variable third-party usage ahead of customer revenue.

The commercial system is designed around one rule:

> A production capability that creates variable external cost must be funded by customer money or explicitly authorized customer overage before the vendor/API call happens.

This applies to Zumi and to every other capability that can create provider, API, communications, compute, transaction, or infrastructure cost.

This document defines the commercial/paywall architecture. It does not set final public plan prices.

## Core commercial principles

1. Customer payment activates production access.
2. Account creation alone does not activate paid production capability.
3. Demo access may exist only under explicit demo rules and should default to synthetic data and capped/no external spend.
4. Subscription entitlements answer **what the organization bought**.
5. Usage funding answers **whether this particular variable-cost operation is funded**.
6. Product/safety policy remains above payment. A customer cannot purchase around clinical, privacy, credentialing, claims, record-release, or other governance rules.
7. Klinikos must not silently front unlimited vendor usage and hope to recover it later.
8. External-cost operations should reserve customer-backed budget before execution.
9. Usage must be metered by organization, cost bucket, capability, provider, and billing period.
10. Provider/vendor pricing changes should be absorbed through configuration and routing, not require rewriting product entitlements.
11. Klinikos core functions should remain usable when an optional paid connector or AI provider is unavailable, when product policy allows a manual fallback.
12. Customer-facing limits should be expressed in understandable product units where possible; internal vendor units and margins remain server-owned.

## Funding waterfall

For a variable-cost operation, Klinikos funds usage in this order:

1. Included allowance already funded by the subscription.
2. Prepaid customer balance / purchased usage pack.
3. Explicitly authorized overage amount.
4. If the operation still has an unfunded shortfall, block it before calling the vendor.

The platform should never interpret a stored payment method as permission for unlimited post-paid spend.

## Access decision order

The intended decision sequence is:

1. Product/safety policy
2. Authentication
3. Tenant scope
4. RBAC/resource scope
5. Paid subscription/payment state
6. Module/capability entitlement
7. Usage funding / allowance
8. Provider/connector availability
9. Execution
10. Metering
11. Verification where consequential
12. Audit

Commercial access never replaces security authorization.

## Paywall classes

### A. Subscription-gated core capability

Examples:

- operations workspace
- scheduling workspace
- task/follow-up workspace
- basic forms/document workspace
- owner reporting included in a plan

Commercial behavior:

- Requires an active paid subscription and the applicable entitlement.
- Does not consume a variable usage balance when no third-party cost is created.

### B. Included-then-metered capability

Examples:

- Zumi AI reasoning
- document extraction/OCR/AI processing
- voice AI
- SMS
- maps/geocoding
- external eligibility checks
- premium data enrichment

Commercial behavior:

- Plan includes a funded allowance.
- Usage consumes that allowance.
- When exhausted, Klinikos uses prepaid balance or authorized overage.
- If none exists, the operation is blocked or the user is offered an upgrade/top-up.

### C. Transaction-funded capability

Examples:

- Grid reservation/marketplace transaction fees
- payment-processing-linked services
- marketplace fulfillment services

Commercial behavior:

- The transaction itself funds the platform/provider cost according to the configured transaction economics.
- Fees should be calculated server-side.
- Do not hardcode one universal percentage for all Grid resource classes.

### D. Connection/contract-gated capability

Examples:

- EHR connections
- lab interfaces
- imaging interfaces
- clearinghouse connections
- enterprise identity/SSO
- specialized compliance/vendor services

Commercial behavior:

- Entitlement alone is insufficient.
- Required connector credentials/contracts/BAAs/business approvals must also exist.
- Setup, recurring connection charges, and pass-through vendor usage can be separately funded.

### E. Seat/location/capacity-gated capability

Examples:

- additional staff seats
- additional locations
- additional provider identities
- storage tiers
- high-volume scheduling/communications capacity

Commercial behavior:

- Base plan includes a configured quantity.
- Additional capacity requires an upgrade/add-on.
- Capacity should be enforced server-side, not only hidden in UI.

### F. Governed-only capability

Examples:

- regulated or clinically sensitive workflows
- actions requiring human review
- credential review
- record-release workflows
- claim workflows

Commercial behavior:

- Payment may make a supporting workflow available.
- Payment never removes required human review or converts a prohibited autonomous action into an allowed one.

## Cost buckets

The canonical commercial cost buckets currently planned are:

- `ai`
- `voice`
- `sms`
- `email`
- `maps`
- `document_processing`
- `eligibility`
- `identity_verification`
- `labs`
- `imaging`
- `telemedicine`
- `payments`
- `grid`
- `storage`
- `integrations`
- `other`

These are cost-accounting buckets, not permissions.

## Zumi paywall model

Zumi should feel like one assistant to the customer while using cost-aware routing internally.

A paid plan can include:

- access to Zumi
- an included monthly Zumi allowance
- allowed Zumi capabilities by subscription/module
- optional advanced reasoning allowance
- optional voice/document processing allowances
- prepaid usage packs
- explicitly authorized overage ceiling

For every model invocation, Klinikos should record at minimum:

- organization
- capability
- model/provider
- input/output usage
- tool calls
- estimated and actual provider cost where available
- funded source
- billing period
- request/run identifier

Zumi should choose the least expensive approved model that satisfies the capability/evaluation requirements. Customer-facing product identity remains Zumi; provider identity is infrastructure detail unless disclosure is legally/contractually required.

## Communications paywalls

### SMS

- Meter outbound/inbound billable messaging according to the vendor cost model.
- Subscription may include a monthly allowance.
- High-volume campaigns require both recipient eligibility/consent governance and sufficient funded balance.
- Mass-send preview should estimate billable units before execution.

### Email

- Basic transactional email may be included if marginal cost is negligible under the current vendor contract.
- High-volume/premium delivery services may be metered.
- Commercial gating never replaces consent or communication-preference checks.

### Voice

- Meter call minutes, transcription, synthesis, AI reasoning, and telephony where they create external cost.
- Pre-call or pre-session reservation should cover a conservative estimate; reconcile actual usage afterward.
- If a call may outlive the reserved balance, enforce a configured safe behavior rather than unlimited unfunded continuation.

## Document and forms paywalls

Core document storage/forms can be subscription-gated.

Variable-cost features should be separately meterable:

- OCR
- document classification
- extraction
- summarization
- large-file processing
- e-signature provider charges
- external fax/document delivery

A document being clinically or legally important does not justify silently bypassing the usage gate. A manual workflow can remain available when appropriate.

## Scheduling and telemedicine paywalls

Scheduling truth remains a core deterministic service.

Potential variable-cost services include:

- premium reminders
- maps/travel calculations
- telemedicine vendor minutes
- recording/transcription where permitted
- third-party calendar synchronization

Basic scheduling should not require Zumi to function.

## Eligibility, insurance, billing and claims paywalls

Potential pass-through/metered costs include:

- eligibility checks
- claim-status queries
- clearinghouse transactions
- coding/reference services
- payer-specific integrations

Commercial access must remain separate from billing/clinical governance. Zumi may explain readiness where allowed; autonomous claim submission remains governed by Zumi policy.

## Labs and imaging paywalls

External lab/imaging connections may involve:

- implementation/setup fee
- recurring connection fee
- per-transaction vendor charge
- interface maintenance tier

Klinikos should represent connection state honestly:

- not purchased
- purchased / pending connection
- contract pending
- credentials pending
- connected
- degraded
- disabled

A paid entitlement should not be displayed as a live integration before the actual external connection is verified.

## Grid paywalls

Grid monetization should support resource-class-specific economics rather than one universal fee.

Potential funding models:

- professional profile subscription
- facility/space listing access
- seller listing access
- premium visibility
- booking/reservation transaction fee
- fulfillment fee
- verification fee where legally/commercially appropriate
- enterprise network access

Grid eligibility and verification remain deterministic/governed. Paying more does not fabricate credentials or bypass verification.

## Storage paywalls

Plans should include a storage allowance with configurable expansion.

Potential metered dimensions:

- stored GB
- archival GB
- transfer/egress where material
- large-file processing
- retention tier

Klinikos must not delete or withhold required records merely because a usage tier changes. Retention and access rules must remain compliant with applicable product/legal requirements.

## Integration paywalls

Every integration should declare its commercial shape:

- included
- paid add-on
- setup fee
- recurring connector fee
- pass-through usage
- customer-supplied account
- contract required
- BAA required
- unavailable/pending

Do not make the frontend guess integration commercial state.

## Capacity paywalls

The commercial system should eventually support limits/allowances for:

- users/seats
- providers
- locations
- appointments/volume bands where commercially useful
- patient/client records where commercially useful
- Grid listings
- API usage
- automation runs
- workflow runs
- data retention/storage
- Zumi usage
- voice minutes
- SMS/messages
- document processing
- premium integrations

Final quantities and pricing remain commercial configuration, not hardcoded product assumptions.

## Demo and founding-clinic behavior

The current onboarding flow creates a broad 30-day trial subscription. That behavior should be narrowed before public paid launch.

Target behavior:

- Demo workspace can be created without payment only when it is explicitly synthetic/cost-capped.
- Production PHI/live connector use requires the applicable commercial + compliance state.
- Founding-clinic evaluation/implementation fees are separate from recurring software entitlement unless the commercial agreement explicitly credits or bundles them.
- A one-time implementation payment should not silently grant indefinite recurring vendor usage.

## Required persisted billing concepts

Planned data model should support, at minimum:

### Subscription

- organization
- plan key
- status
- period start/end
- modules/entitlements
- paid/confirmed source
- external billing customer/subscription references

### Allowance

- organization
- billing period
- cost bucket or capability
- granted amount/value
- remaining amount/value

### Prepaid balance

- organization
- purchased amount
- remaining amount
- expiration policy if any
- payment reference

### Usage reservation

- organization
- capability
- cost bucket
- estimated cost
- reserved allocations
- idempotency key
- expiration
- state

### Usage ledger

- reservation/run
- provider/vendor
- usage units
- actual provider cost
- customer charge/value where applicable
- funding source
- reconciliation state

### Authorized overage

- organization
- billing period
- maximum authorized amount
- remaining amount
- payment/billing authorization reference

All money should use integer minor units (for example cents) or a dedicated money type. Do not use floating-point dollars for ledger accounting.

## Reservation-before-spend rule

For a variable-cost vendor operation:

1. Estimate conservative maximum cost where possible.
2. Evaluate product/RBAC/entitlement gates.
3. Atomically reserve customer-backed funds.
4. Call vendor.
5. Record actual usage/cost.
6. Reconcile reservation.
7. Release unused reserved balance.
8. Audit.

If reservation fails, do not call the vendor.

For streaming/long-lived usage such as voice, reserve in chunks and stop/transition safely when the next funded chunk cannot be reserved.

## Upgrade experience

Do not show generic `403` errors for commercial limits.

A commercial denial should clearly map to one of:

- payment required
- subscription inactive
- upgrade required
- add-on required
- included usage exhausted
- prepaid funds required
- authorized overage exhausted
- connection/contract pending
- policy/governance blocked

The UI may offer:

- upgrade plan
- buy usage pack
- authorize a bounded overage
- purchase connector/add-on
- contact sales

Never display a payment CTA for a capability that is blocked by product/safety policy.

## Margin protection

Klinikos should calculate margin from real usage data, not assumptions.

Track per organization:

- subscription revenue
- add-on revenue
- usage-pack revenue
- transaction revenue
- vendor/API cost
- infrastructure allocation
- Zumi cost
- communications cost
- integration cost
- gross contribution margin

Commercial configuration should be adjustable as observed usage changes.

## Implementation status

### IMPLEMENTED

- Server-side Zumi module entitlement resolver.
- Entitlements fail closed when subscription rows do not qualify.
- Customer-funded pure access policy in `src/lib/commercial/customer-funded-access.ts`.
- Payment-confirmed production gate in that policy.
- Entitlement gate separated from payment/funding gate.
- Included allowance -> prepaid -> authorized overage funding waterfall.
- Unfunded shortfall blocks execution in the policy.
- Safety/product policy cannot be overridden by payment.
- Synthetic demo path is explicitly separate from production paid access.
- Unit tests for core commercial decisions.

### PARTIAL

- `ClinicSubscription` exists as the current subscription/entitlement source.
- Founding-clinic commercial offers exist.
- Product payment capabilities exist for clinic workflows, but are not yet the canonical SaaS subscription billing system.
- Zumi already has usage/cost-oriented provider concepts, but commercial reservation is not yet wired into each invocation.

### BLOCKED / EXTERNAL DEPENDENCY

- Final recurring billing provider/product catalog selection and credentials.
- Final plan prices/allowances/overage terms.
- Vendor-specific cost tables and contracts.
- Compliance/BAA status for production PHI egress to each paid provider.

### PLANNED NEXT

1. Add persisted allowance, prepaid balance, usage reservation, usage ledger, and bounded overage models.
2. Add a server-side commercial funding service with atomic reservation/reconciliation.
3. Require reservation in Zumi before provider egress that creates variable cost.
4. Add a normalized subscription-payment activation service/webhook path.
5. Replace broad unpaid production trial semantics with synthetic/capped demo semantics.
6. Add commercial gates to voice/SMS/document processing/maps/eligibility/connectors as those paid providers are connected.
7. Add organization billing/usage UI.
8. Add upgrade/top-up/overage authorization UI.
9. Add finance/usage observability and margin reporting.
10. Add adversarial tests proving vendor calls cannot occur without customer-backed funding.
