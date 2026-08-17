# KLINIKOS — PRICING & MONETIZATION CANON

Version: `2026-08-16.1`
Status: `AUTHORITATIVE COMMERCIAL DIRECTION`

This document defines the current commercial architecture. It does **not** assert that every product, connector, fee model, or price is live. Code/runtime/payment evidence governs actual sellability. If public pricing code conflicts with this document, fix the conflict deliberately rather than silently claiming one is current.

## 1. Commercial thesis

Klinikos should not depend on one SaaS subscription. It should support multiple legitimate revenue routes while preserving product truth.

The commercial ladder is:

`ANALYSIS → EVALUATION → IMPLEMENTATION → SUBSCRIPTION → GRID / NETWORK PARTICIPATION → ADD-ONS / USAGE / SERVICES`

Customers should understand what they are buying at each step.

## 2. Revenue routes

### A. Paid Operational Analysis / Workflow Review

A clinic may pay for a real operational analysis before adopting software.

Potential scope:

- workflow review
- revenue leakage assessment
- staffing/capacity analysis
- technology/integration assessment
- implementation roadmap
- operational risk review

This is service revenue, not SaaS entitlement unless the offer explicitly includes software access.

Current known checkout destination for the **Klinikos Operational Audit**:

`https://f7b959c2-9748-4f7e-9247-7bea69624c5f.paylinks.godaddy.com/`

The application must preserve prospect/qualification/workflow context around checkout. A return from that URL is **not** proof of payment.

### B. Implementation / Onboarding

High-value implementation work may include:

- workflow redesign
- Klinikos configuration
- tenant/location setup
- role setup
- forms/workflow configuration
- staff onboarding
- data/setup assistance
- connector preparation
- operating-model implementation

Implementation fees are distinct from recurring software fees.

### C. Clinic OS Subscription

Recurring software value may include, according to actual entitlements and implementation state:

- patients/clients
- appointments
- tasks
- follow-up
- forms/documents
- revenue readiness/recovery
- owner visibility
- role-aware Living Home
- relevant Grid access
- intelligence support

Do not wait for every future healthcare integration before selling useful operational software, but do not claim an integration is live when it is not.

### D. Grid Revenue

Grid may support lawful combinations of:

- professional subscriptions
- clinic/facility subscriptions
- organization/network subscriptions
- transaction/platform fees where lawful
- room/facility/capacity booking economics
- provider onboarding/verification services
- premium network tools
- analytics
- recruiting/staffing economics where lawful
- service-provider packages
- education/placement economics

Do **not** hard-code a single percentage fee as the definition of Grid. Different resource classes may require different pricing and legal treatment.

### E. EDU Revenue

Potential models include:

- institutional licensing
- individual training
- simulation access
- placement/network access where lawful
- continuing education
- institutional analytics

EDU should increase qualified ecosystem participation rather than exist as an isolated content library.

### F. Usage / Add-ons

Potential variable-cost add-ons include:

- AI usage
- messaging/SMS/email
- voice/phone partner usage
- maps/geocoding
- verification services
- storage
- external healthcare APIs
- premium support
- custom integrations
- white-label / custom branding where commercially justified

## 3. Customer-funded variable infrastructure

Variable external usage should generally follow:

`CUSTOMER PAYMENT / PLAN → ENTITLEMENT → INCLUDED ALLOWANCE → EXTERNAL USAGE → COST LEDGER → OVERAGE / LIMIT → MARGIN`

Do not subsidize unbounded AI, messaging, voice, maps, verification, or external API usage before revenue exists.

Use limits, allowances, metering, caching, batching and plan-specific access where appropriate.

## 4. Pricing structure, not fake precision

The current canonical commercial structure is:

1. **Operational Analysis / Audit** — paid service entry point.
2. **Implementation / Activation** — one-time setup/configuration work.
3. **Clinic OS** — recurring subscription.
4. **Grid Professional / Organization Access** — recurring and/or transaction economics depending on resource class.
5. **EDU** — individual or institutional pricing.
6. **Network / Multi-location / Enterprise** — higher-touch contract pricing.
7. **Usage Add-ons** — customer-funded variable usage.

Do not publish historical planning estimates as current production cost or pricing truth unless deliberately approved.

Older internal estimates such as generic "$600/mo Starter CRM" or "$2,400/mo Clinic Ops Pro" were planning exercises, not validated infrastructure cost truth. Current cost strategy is usage-driven and should be measured against actual vendor bills and customer behavior.

## 5. Margin law

For variable services:

`REVENUE - DIRECT VARIABLE COST - PAYMENT/PROCESSOR COST - REQUIRED DELIVERY COST = CONTRIBUTION MARGIN`

Track direct cost by customer/tenant/use case where practical.

Do not promise unlimited expensive usage at a fixed low price without measured economics.

## 6. Payment truth

**REDIRECT ≠ PAYMENT.**

Required architecture:

`SERVER-OWNED CHECKOUT INTENT → EXTERNAL PAYMENT RAIL → PAYMENT EVIDENCE / RECONCILIATION → ENTITLEMENT / ACTIVATION`

A query string, success page, client-side flag, or browser return must never create paid entitlement by itself.

Manual reconciliation is acceptable during MVP if truthful and auditable.

## 7. Manual-but-true commercial operations

Allowed during MVP:

- manual payment reconciliation
- manual implementation/onboarding
- manual credential review
- human dispute review
- prepared but unsent communication when a connector is absent
- manual settlement evidence collection

Not allowed:

- fake payment success
- fake message delivery
- fake credential verification
- fake payout
- fake external integration result
- invented Grid liquidity

## 8. Recommended sell sequence

Until runtime evidence supports broader automation, prioritize commercial offers in this order:

1. Paid operational analysis / audit.
2. Paid implementation / workflow optimization.
3. Clinic OS subscription for workflows that actually work today.
4. Grid participation for resource classes whose transaction path is operational and governed.
5. EDU contracts/access as those journeys become proven.
6. Multi-location/network/enterprise contracts after repeatable activation and support exist.

## 9. Commercial flywheel

The ecosystem should produce multiple monetizable relationships:

- EDU creates qualified future professionals.
- Grid creates work/resource transactions.
- Professionals become independent operators.
- Operators become Clinic OS customers.
- Clinics create new Grid supply/demand.
- Network density creates more transactions.
- Insights identifies operational and economic opportunities.
- Implementation/services accelerate adoption.

The goal is not to extract fees from every interaction. The goal is to create durable economic value and monetize where the value exchange is clear, lawful and commercially sustainable.

## 10. Pricing governance

Before changing a public price or transaction fee, answer:

- What real customer outcome is being sold?
- Is this software, service, transaction, usage, implementation, or mixed revenue?
- What is the direct variable cost?
- What external vendor cost can change with usage?
- What is included vs metered?
- What legal/regulatory constraints affect the fee?
- What happens when a customer exceeds included usage?
- What evidence grants entitlement?
- Can we deliver the offer today?

## 11. Public pricing law

Public pricing must be simpler than the internal architecture.

Do not expose internal cost tables, ledger terminology, connector implementation details, or hypothetical enterprise economics to ordinary buyers.

A buyer should understand:

- what outcome they get
- what is included
- what is usage-limited
- what setup costs
- what recurring access costs
- what is optional
- what requires external connection
- what happens next

## 12. Near-term KPI set

Track at minimum:

- qualified leads
- audit purchases
- audit → implementation conversion
- implementation → subscription conversion
- activation completion
- first value achieved
- recurring revenue
- direct variable cost
- gross/contribution margin
- churn/retention
- Grid demand created
- Grid matches/offers/reservations/fulfillment where live
- time to value
- support burden

## 13. North star

**Sell real outcomes first. Use customer revenue to fund variable infrastructure. Keep software, implementation, transaction economics, and external usage financially distinct. Never let pricing force the product to lie.**
