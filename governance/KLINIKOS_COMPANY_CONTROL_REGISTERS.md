# KLINIKOS COMPANY CONTROL REGISTERS

Status: GOVERNING COMPANY-TRUTH CONTROL SYSTEM
Date: 2026-08-25

## 1. Purpose

Klinikos must not rely on chat memory, founder memory, spreadsheets with unclear authority, or narrative documents for consequential company truth.

The company operating system therefore requires explicit registers for the information that determines revenue, capital, risk, execution, customer value, corporate authority, partnerships, and network health.

Every register follows the same base truth contract where applicable:

- `record_id`
- `title`
- `owner`
- `truth_class`: `CURRENT_FACT | PROPOSED | EXECUTED`
- `source`
- `source_date`
- `evidence_location`
- `status`
- `next_action`
- `next_action_owner`
- `review_date`
- `supersedes`
- `notes`

A record without evidence is not allowed to silently become current fact.

## 2. Customer / Prospect Register

Purpose: one commercial truth source for organizations and buyers.

Required fields:

- organization
- buyer/contact
- source
- persona
- geography
- specialty/segment
- current systems
- stated problem
- urgency
- economic consequence
- qualification evidence
- stage
- offer
- proposal state
- contract state
- payment state
- implementation state
- first-value state
- expansion state
- next action
- owner

Review: daily pipeline review; weekly commercial review.

## 3. Offer / Pricing Register

Purpose: prevent pricing and entitlement truth from being scattered across site copy, code, payment links, proposals, and memory.

Required fields:

- offer_id
- public/internal label
- seller entity
- buyer class
- scope
- current price
- currency
- billing interval
- implementation fee
- included usage
- overage policy
- entitlement mapping
- effective date
- expiration/supersession
- experiment/cohort
- approval source
- payment path
- public visibility
- status

Review: whenever pricing changes; monthly commercial review.

## 4. Contract Register

Purpose: know exactly what the company has agreed to.

Required fields:

- counterparty
- contract type
- seller/buyer entity
- effective date
- term
- renewal
- termination
- payment terms
- committed amount
- data/privacy terms
- BAA/DPA applicability
- IP terms
- insurance requirements
- support/SLA obligations
- non-standard obligations
- signature evidence
- owner
- renewal alert

Review: monthly; 120/90/60/30-day renewal alerts where appropriate.

## 5. Vendor / Subprocessor Register

Required fields:

- vendor
- function
- customer-facing dependency
- data categories
- PHI/PII access
- BAA/DPA status
- annual/monthly cost
- contract
- renewal date
- security review
- reliability evidence
- lock-in risk
- portability/exit path
- current strategy: `KEEP | RENEGOTIATE | CONNECT | ABSTRACT | CONTROL | REPLACE | REMOVE`
- replacement candidate
- owner

Review: monthly spend review; quarterly vendor strategy.

## 6. Capital Opportunity Register

Purpose: one capital universe across customer capital, grants, procurement, debt, equity, prizes, tax credits, and strategic capital.

Required fields:

- opportunity
- capital type
- provider
- amount/range
- eligibility
- use restrictions
- dilution
- repayment
- guarantee/collateral
- application requirements
- decision timeline
- funding timeline
- probability based on evidence
- owner
- status
- next action

Never label debt, equity, tax credits, or reimbursement as grants.

Review: daily when cash constrained; otherwise weekly.

## 7. Lender Readiness Register

Required fields:

- lender/product
- requested amount
- use of funds
- entity
- revenue requirement
- time-in-business requirement
- credit requirement
- guarantor requirement
- collateral
- financial documents
- current qualification gaps
- debt-service analysis
- application state
- decision
- next action

Review: weekly while pursuing debt.

## 8. Investor Evidence Register

Required fields:

- thesis claim
- evidence category
- source
- current evidence
- missing proof
- public/private disclosure status
- data-room location
- owner
- next proof milestone

Evidence categories include:

- market
- product
- revenue
- retention
- customer value
- gross margin
- distribution
- network effects
- Grid liquidity
- EDU outcomes
- enterprise readiness
- security/regulatory maturity
- team
- cap table

Review: monthly and before fundraising.

## 9. Company Risk Register

Required fields:

- risk
- category
- severity
- likelihood
- current evidence
- trigger
- owner
- mitigation
- contingency
- residual risk
- review date

Categories:

- product
- clinical safety
- security
- privacy
- regulatory
- corporate
- cash
- capital
- sales
- implementation
- customer concentration
- vendor concentration
- AI
- integration
- marketplace
- reputation
- key-person
- data
- IP

Review: weekly for high/critical; monthly for all.

## 10. Decision Register

Required fields:

- question
- facts
- assumptions
- options
- customer impact
- economics
- risk
- reversibility
- decision
- decision owner
- date
- evidence
- review trigger
- outcome after review

Zumi should flag stale assumptions and overdue decision reviews.

Review: as decisions occur; quarterly retrospective.

## 11. Hiring / Bottleneck Register

Required fields:

- bottleneck
- current owner
- impact
- evidence
- can automation solve it?
- can contractor solve it?
- can partner solve it?
- permanent hire needed?
- proposed role
- total cost
- 30/60/90-day outcomes
- success metrics
- hiring trigger
- status

No hiring because a title sounds impressive.

Review: monthly or before new hiring.

## 12. Partnership Register

Required fields:

- partner
- category
- customer value
- distribution value
- integration value
- economic value
- credibility/regulatory value
- mutual incentive
- commercial model
- data involved
- contract state
- owner
- next action
- dependency risk

Review: weekly active pipeline; quarterly strategy.

## 13. Build / Buy / Partner / License / Invest / Acquire Register

Required fields:

- capability
- current vendor/system
- strategic importance
- customer pain
- annual current cost
- Klinikos gross-margin opportunity
- control advantage
- data/evidence advantage
- regulatory complexity
- build time/cost
- acquisition/partner candidates
- recommendation
- trigger for reevaluation

Review: quarterly and before major architecture commitments.

## 14. Customer Value Evidence Register

Required fields:

- customer
- workflow
- baseline
- intervention
- after state
- measurement period
- evidence source
- value type
- value status: `POTENTIAL | ESTIMATED | VERIFIED | REALIZED`
- customer confirmation
- monetization/expansion relevance

Possible value types:

- time saved
- software cost removed
- administrative work reduced
- readiness improvement
- referral closure
- denial/rejection reduction
- revenue exception resolution
- capacity utilization
- staffing fulfillment
- onboarding reduction
- documentation reduction

Review: weekly for active customers; monthly company scorecard.

## 15. Grid Liquidity Register

Primary key:

`RESOURCE TYPE × GEOGRAPHY × TIME WINDOW × ELIGIBILITY CLASS`

Required fields:

- demand count
- verified supply count
- eligible supply count
- matches
- time to first match
- fulfillment count
- repeat fulfillment
- cancellation/dispute rate
- transaction/economic-flow value
- monetization
- primary blocker
- next liquidity action

Review: weekly for active market cells.

## 16. EDU Institutional Pipeline

Required fields:

- institution
- buyer
- program/problem
- participant range
- delivery mode
- required curriculum
- reporting requirements
- accessibility requirements
- security/data requirements
- procurement method
- contract value
- proposal state
- launch timeline
- instructor capacity
- Grid/workforce connection
- renewal/expansion opportunity

Review: weekly active pipeline.

## 17. Security / Assurance Evidence Register

Required fields:

- control area
- expected control
- implementation state
- evidence
- owner
- last test
- next test
- customer/procurement disclosure status
- gap
- remediation

Areas include:

- tenant isolation
- identity/MFA
- access control
- encryption
- secrets
- backups/restores
- incident response
- vulnerability management
- dependency security
- audit
- logging/PHI minimization
- AI security
- vendor/subprocessor risk
- BAA/DPA posture
- accessibility
- DR/business continuity
- penetration-test strategy/results when real

Review: weekly critical gaps; monthly full review.

## 18. Integration Truth Register

Required fields:

- integration
- vendor/system
- purpose
- authoritative external party
- adapter owner
- credentials state
- environment
- status: `PLANNED | ADAPTER_READY | SANDBOX | UAT | CONTROLLED_PRODUCTION | PRODUCTION_VERIFIED | DEGRADED | DISABLED`
- last successful exchange
- failure/retry path
- reconciliation evidence
- cost
- contract/BAA/DPA
- replacement strategy

Review: daily critical integrations; weekly full integration health.

## 19. Corporate Governance Evidence Register

Required fields:

- entity
- corporate action
- status
- source document
- filing/signature evidence
- effective date
- responsible officer/counsel
- next required action

Track:

- formation
- EIN
- tax elections
- officers/directors
- authorized shares
- issued shares
- cap table
- IP assignment
- intercompany agreements
- annual filings
- material board/shareholder approvals

Proposed ownership is never executed ownership without evidence.

Review: monthly and before financing/material contracts.

## 20. Operating rule

A register is valuable only when it changes action.

Every company review should end with:

- what changed
- what is newly proven
- what became stale
- what is blocked
- who owns the next action
- when the evidence will be reviewed again

Do not create duplicate company truth merely because another tool has a convenient table. Integrations and external systems may mirror these registers, but the authority and definitions remain governed here.
