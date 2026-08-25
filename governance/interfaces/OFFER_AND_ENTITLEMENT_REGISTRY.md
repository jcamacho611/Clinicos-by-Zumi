# KLINIKOS Offer & Entitlement Registry

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Centralize what Klinikos sells, what a buyer receives, how price is determined, what is free, what is usage-limited, what requires contracting and how product entitlements are activated.

## Offer fields

Each active/proposed offer should define:

- `offerId`
- seller legal entity
- buyer class
- public name
- plain-English promise
- scope
- eligibility
- amount/currency
- billing model
- implementation fee
- included usage
- overage/variable use
- payment rail
- contract requirement
- entitlement bundle
- direct-cost category
- target gross-margin guardrail
- effective date
- sunset/grandfather policy
- experiment cohort
- approval source
- status: PROPOSED / ACTIVE / GRANDFATHERED / RETIRED

## Current governance anchors

These are canonical commercial anchors referenced by current repository governance. They are not evidence of revenue or signed customer contracts.

| Offer | Anchor | Billing | Intended role |
|---|---:|---|---|
| Klinikos Free | $0 | free | distribution / identity / network entry |
| Clinic Operating Analysis | $500 | one-time | paid entry / operational diagnosis |
| Implementation Blueprint | $1,500 | one-time | implementation architecture / scoped plan |
| Founding Clinic Implementation | from $8,000 | project | implementation/deployment |
| Core | $995 | monthly | essential organization operating value |
| Growth | $1,995 | monthly | broader automation/revenue/growth |
| Scale | $3,995 | monthly | multi-location/advanced operations |
| Enterprise | custom | annual/custom | enterprise governance/integrations/support |

Before displaying a price publicly, implementation must reconcile the current commercial canon/Offer Registry state and mark the offer active.

## Free entitlement philosophy

Free should create:

- product comprehension
- identity/profile
- network supply
- useful Operating Map
- selected Grid/EDU discovery
- patient participation in provider workflows

Free must not create unlimited high-variable-cost AI/voice/document usage.

## Paid entitlement philosophy

Paid unlocks one or more:

- organization operations
- Care/Current Visit
- advanced Zumi automation
- Revenue OS
- multi-location governance
- premium Grid tools
- integration/connectivity
- usage-heavy AI/communications
- implementation/support
- enterprise capabilities

## Suggested entitlement bundles

Target architecture, subject to current product truth:

### `free`

- account/profile
- public/limited Zumi
- Operating Map
- selected public Grid/EDU
- selected professional organization profile capabilities

### `analysis`

- paid Operating Analysis delivery workflow

### `blueprint`

- implementation architecture/delivery workflow

### `core`

- organization workspace
- scheduling/intake/follow-up essentials
- selected Care/communications
- baseline Zumi allowance

### `growth`

- Core
- broader automation
- CRM/growth
- selected Revenue OS
- higher Zumi/communications allowance

### `scale`

- Growth
- multi-location
- advanced Revenue OS
- Grid/Network organization capabilities
- advanced automation/governance

### `enterprise`

- negotiated products/locations
- SSO/identity
- advanced policy/audit
- integration governance
- premium support
- contracted usage

Exact feature access must be encoded server-side from authoritative entitlement rules, not inferred from this document alone.

## Add-on / usage registry

Future optional products may include:

- Zumi premium automation
- voice/contact-center usage
- document/AI usage
- advanced Revenue OS
- premium Grid professional/organization tools
- connectors
- advanced analytics
- premium support

Each needs unit-cost model and customer-funded overage/bounds before activation.

## Entitlement lifecycle

`OFFER ACTIVE → CUSTOMER ACCEPTS → PAYMENT/CONTRACT EVIDENCE → ENTITLEMENT GRANTED → USAGE → RENEWAL/CHANGE → SUSPEND/REVOKE/GRANDFATHER`

Entitlement changes are auditable.

## Enterprise exception

Enterprise entitlement may activate from authoritative signed contract/invoice/procurement state rather than consumer checkout. Never require fake $0 Stripe checkout merely to fit the same flow.

## Grandfathering

Existing quoted/contracted customers retain executed commercial terms unless the contract permits change. New experiments require explicit cohort/versioning.

## Zumi rules

Zumi can:

- explain active offers
- compare approved bundles
- prepare checkout/proposal
- identify relevant next offer based on real need

Zumi cannot:

- invent a price
- invent a discount
- silently waive implementation
- promise unsupported features
- grant entitlement without financial/contract authority

## Tests

- active vs proposed offer state
- centralized price lookup
- entitlement server enforcement
- grandfathered cohort
- enterprise contract activation
- usage limit/overage
- no UI-only entitlement
- no unapproved Zumi discount
