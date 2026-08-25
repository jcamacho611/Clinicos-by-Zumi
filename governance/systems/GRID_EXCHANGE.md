# Grid Exchange Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P2/P3

## Purpose

Create a governed healthcare demand/supply network for professionals, work, capacity, rooms, equipment, services, education and other lawful resources.

## Public grammar

> **I NEED**

> **I HAVE**

The user should not need marketplace jargon.

## Resource classes

Initial/target categories may include:

- professionals
- jobs
- shifts
- temporary coverage
- provider availability
- rooms
- chairs
- offices
- equipment
- business services
- education/training capacity
- preceptors
- clinical placements
- organizations
- diagnostic capacity
- other legally approved resources

Patient identity is not public Grid inventory.

## Core transaction

`DEMAND + RESOURCE + TIME + LOCATION + REQUIREMENTS + ELIGIBILITY → CANDIDATES → RANKING → OFFER → AGREEMENT → RESERVATION → FULFILLMENT → EVIDENCE → FINANCIAL CONSEQUENCE → RELATIONSHIP`

Eligibility precedes ranking.

Payment never creates professional eligibility.

## Frontend surfaces

- browse/search
- I Need creation
- I Have creation
- resource detail
- demand detail
- eligibility/readiness
- offers
- reservation
- fulfillment
- organization Grid workspace
- professional Grid workspace
- market/liquidity admin
- trust/report/dispute surfaces

## Plain-language states

- Available
- Needs verification
- Eligible
- Not eligible yet
- Offer received
- Reserved
- In progress
- Completed
- Needs review
- Cancelled

## Domain authority

Grid owns resource/demand/requirement/eligibility decision inputs, matching, offers, reservation and fulfillment. Identity/Trust owns credential evidence. Financial OS owns money truth. Network owns durable relationships.

## Backend services

- DemandService
- ResourceService
- AvailabilityService
- RequirementService
- EligibilityEngine
- MatchingEngine
- RankingEngine
- OfferService
- ReservationService
- FulfillmentService
- GridTransactionService
- GridTrustService
- DisputeService
- LiquidityAnalyticsService
- GridPolicyService

Reconcile with existing Grid implementation and fee-policy canon before introducing new services.

## Canonical data

Demand, Resource, ResourceType, Availability, Requirement, EligibilityEvaluation, CandidateMatch, RankingEvidence, Offer, AgreementReference, Reservation, Fulfillment, GridTransactionReference, TrustEvidenceReference, Dispute, MarketCell.

## Market-cell model

Measure liquidity by:

`RESOURCE TYPE × GEOGRAPHY × TIME WINDOW × ELIGIBILITY CLASS`

Do not claim nationwide liquidity because listings exist.

## Matching/ranking

Eligibility is deterministic/policy-driven where possible. Ranking can use proprietary server-side weights and heuristics.

Never ship ranking weights, trust formulas, anti-gaming logic or proprietary scoring to browser bundles.

## Commands

- create/update/close demand
- create/update resource
- publish/unpublish availability
- run eligibility
- request/submit offer
- accept/decline offer
- reserve/cancel
- confirm fulfillment
- report issue/dispute
- save relationship to Network after eligible successful interaction

## Events produced

GridDemandCreated, GridResourcePublished, GridEligibilityEvaluated, GridCandidatesGenerated, GridOfferCreated, GridOfferAccepted, GridReservationCreated, GridReservationCancelled, GridFulfillmentStarted, GridFulfillmentCompleted, GridDisputeOpened, GridDisputeResolved, GridRelationshipSuggested.

## Events consumed

CredentialVerified/Expired, OrganizationMembershipChanged, SchedulingAvailabilityChanged, EDUCompetencyEvidenceRecorded, PaymentEvidence/Settlement events, NetworkRelationship events, enterprise policy/configuration.

## Zumi

May:

- turn a natural-language need into structured demand
- identify missing requirements
- explain eligibility in plain English
- surface candidate options
- prepare offers/reservations
- detect unused capacity and ask an authorized owner whether to publish

Zumi does not decide licensure/credential truth or bypass eligibility.

Autonomy: L0-L3 normally; L4 for explicitly approved low-risk operational updates such as availability refreshes, never professional eligibility authority.

## External adapters

Potential identity/credential sources, maps/geolocation, payments, communication, calendars/scheduling and selected service-provider APIs.

## Trust & safety

Required capabilities:

- identity evidence
- credential evidence where applicable
- organization verification
- reporting
- suspension
- dispute
- fraud/abuse monitoring
- listing moderation
- anti-spam
- anti-impersonation
- evidence retention

## Regulatory/legal gates

Every monetized transaction class receives policy/legal classification.

Particularly sensitive areas include clinical referrals, professional fee splitting, professional services, state licensing, corporate practice rules and employment classification.

If classification is unknown, percentage-fee behavior must fail closed.

## Financial model

Potential monetization:

- organization subscription/tools
- professional Pro tools
- recruiting/campaign products
- promoted listings where appropriate
- business-services marketplace
- lawful room/capacity/equipment transactions
- verification/onboarding services

Do not optimize fees before liquidity and trust.

## Network effect

More real clinic demand attracts supply. More eligible supply improves fulfillment. Fulfillment produces evidence and durable Network relationships. Clinic OS can create demand from real operational shortages, reducing marketplace cold-start cost.

## Analytics

- active demand by cell
- eligible supply by cell
- time to first candidate
- fill/fulfillment rate
- cancellation
- dispute
- repeat relationship
- revenue/GMV separated
- customer value created

## Failure states

- no eligible supply
- credential expired
- availability stale
- conflicting reservation
- payment unresolved
- party cancelled
- dispute
- external verification unavailable

Show the exact next action.

## Tests

- eligibility-before-ranking
- fee-policy fail closed
- private data exclusion
- ranking secrecy/browser boundary
- tenant/role access
- reservation concurrency
- fulfillment evidence
- dispute flow
- payment/eligibility separation
- market-cell liquidity truth

## Definition of done

A real demand can be created, evaluated against real requirements, matched only to eligible supply, reserved, fulfilled, financially reconciled where applicable and optionally converted into a governed Network relationship with complete audit/evidence.