# KLINIKOS — GRID CANON

Version: `2026-08-16.1`
Status: `AUTHORITATIVE SPECIALIST CANON`

This document defines Grid product and architecture law. Current implementation status remains governed by `docs/FEATURE_STATUS.md`, code, migrations, tests, exact-head CI, and verified runtime evidence.

## 1. Definition

**Grid is the universal healthcare resource, opportunity, capacity, matching, and transaction network inside Klinikos.**

Grid is not a nurse marketplace, staffing page, med-spa marketplace, or listing board. Clinical work and treatment-space capacity are the first revenue wedge, not the architectural boundary.

The entry language is intentionally simple:

- **I NEED** → structured demand;
- **I HAVE** → structured supply/resource.

Grid handles policy, eligibility, matching, composition, offers, reservations, financial obligations, fulfillment, and audit underneath.

## 2. Universal participants

One persistent Klinikos identity or organization may participate through one or more governed roles:

- healthcare professional;
- healthcare organization;
- student, educator, institution, preceptor, or training program;
- facility, room, chair, equipment, or capacity owner;
- clinical or business-service provider;
- patient/client only where privacy, authorization, and law permit;
- authorized Klinikos operator.

Participant role is contextual. It does not replace shared identity, organization, authentication, RBAC, credential, consent, or audit systems.

## 3. Universal resources

Grid resource classes may include:

- professional time, shifts, coverage, contracts, supervision, and consultation;
- rooms, chairs, facilities, training space, and appointment capacity;
- approved equipment, diagnostic, imaging, lab, rehabilitation, or simulation capacity;
- clinical and business services;
- education placements, preceptors, training seats, and required hours;
- referral or specialist capacity;
- other policy-governed healthcare resources.

Each resource class has a policy class. Non-clinical services must not inherit clinical credential rules merely because they use Grid. Regulated classes must never fall through to a generic permissive policy.

## 4. Canonical primitives

The target domain vocabulary is:

- participant and participant role;
- capability and requirement;
- resource and availability/capacity;
- demand and demand slot;
- eligibility check;
- match and ranking evidence;
- offer and agreement;
- reservation and booking;
- transaction and financial obligation;
- fulfillment;
- payout and settlement evidence;
- dispute, safety incident, and reputation evidence.

Existing working models may remain behind adapters. Do not perform a big-bang rewrite or create a duplicate identity, finance, event, credential, communication, or authorization system.

## 5. Demand and supply

Demand and supply are first-class persistent objects. Natural-language input may be interpreted into:

- kind/category;
- role, specialty, service, or capability;
- time, duration, recurrence, and urgency;
- geography and permitted delivery mode;
- required credentials and policy class;
- price/rate and capacity;
- visibility and authorization boundaries.

Only ask for missing information that materially blocks a governed next step. AI may interpret language; deterministic schemas and policies own accepted state.

## 6. Match pipeline

Matching proceeds in order:

1. **Discovery** — could the resource satisfy the need?
2. **Eligibility** — is it permitted for this exact opportunity?
3. **Authorization** — may the parties interact and see the required information?
4. **Suitability** — rank eligible candidates using explainable evidence.
5. **Offer** — issue according to the opportunity policy.

Hard eligibility precedes ranking. AI, sponsorship, payment, popularity, or operator preference may never override an eligibility failure.

Supported offer strategies may include top-match-first, controlled broadcast, round robin, and preferred-first. Strategy is configurable by opportunity/policy class.

## 7. Composition

Many healthcare transactions require several slots. Grid must not call an opportunity bookable until every required slot is satisfied.

Examples:

- shift coverage: organization + open shift + eligible professional;
- clinical placement: student + program requirement + preceptor + site + hours + credentials;
- home-health visit: authorized demand + eligible professional + service area + time + required authorization;
- aesthetic service: client + eligible clinician + approved location + required resource + time + consent + payment condition.

The composition engine owns slot readiness. A visually complete card does not establish readiness.

## 8. Availability, geography, and concurrency

- Explicit availability and capacity are authoritative.
- Acceptance rechecks eligibility and availability.
- Scarce resources lock atomically; one resource cannot be reserved twice.
- Browser geolocation requires explicit user action.
- Exact distance is shown only from valid coordinate truth.
- Public coordinates are precision-reduced; governed exact values remain server-side.
- OSM/keyless map fallback is valid; Google/Places/routing are separate external connections.
- Straight-line distance is not travel time.
- Empty markets remain empty; no synthetic nearby inventory.

## 9. Transaction truth

Canonical state progression:

`DEMAND → ELIGIBILITY → MATCH → OFFER → ACCEPTANCE → RESERVATION → PAYMENT CONDITION → BOOKING → FULFILLMENT → OBLIGATION → PAYOUT / RECONCILIATION → CLOSED`

Rules:

- acceptance is not reservation;
- reservation is not payment;
- browser return is not payment evidence;
- booking is not fulfillment;
- obligation/payable is not payout;
- payout is not settled without processor or approved reconciliation evidence;
- disputes and safety incidents are distinct;
- consequential transitions are attributable and audited.

## 10. Interfaces

### Participant/provider

The primary view answers: available opportunities, offers, upcoming work, earnings, and required actions. Enrollment may include identity, role, credentials, malpractice evidence where applicable, availability, service area, mobile/onsite/location preferences, and review state.

### Organization

An organization can state a need, see matching progress, select or auto-match, confirm, satisfy payment conditions, track fulfillment, and resolve follow-up.

### Location/capacity owner

An owner can publish approved capacity, availability, permitted uses, price, rules, approval mode, reservations, earnings, and payout state.

### Operator

An authorized operator can assist enrollment, review evidence, create demand/resource records, trigger matching, issue an offer, confirm supported payment evidence, mark fulfillment, and reconcile financial state. Operator actions remain permissioned and audited.

## 11. Privacy and visibility

Supported visibility policies include public, verified users, network only, organization only, invite only, match only, and private.

Public Grid uses minimum-necessary information. Patient identity, private addresses, credentials evidence, internal notes, payment data, and PHI are not public inventory. Details disclose progressively only for a legitimate authorized interaction.

## 12. Reputation and claims

Reputation begins with objective evidence: completions, acceptance/response time, cancellation, no-show, credential freshness, repeat transactions, disputes, and fulfillment reliability. Star ratings never replace professional eligibility.

Allowed claim: **Instant matching when eligible opportunities are available.**

Prohibited claims include guaranteed work, guaranteed placement, guaranteed supply, universal verification, payment, payout, or settlement without evidence.

## 13. Shared events and finance

Use shared Klinikos event and financial infrastructure. Representative events include:

- `grid.demand.created`;
- `grid.resource.created`;
- `grid.match.eligible`;
- `grid.offer.accepted`;
- `grid.reservation.created`;
- `grid.fulfillment.completed`;
- `finance.obligation.created`;
- `grid.payout.settled`.

Event payloads use minimum necessary data and never become an uncontrolled PHI bus.

## 14. Current evidence and gaps

Current repository evidence includes generalized demand/resource/offer/reservation primitives, deterministic resource policies, provider and external-participant enrollment, opt-in geolocation, keyless map fallback, Haversine radius rules, atomic reservation protection, financial obligations, fulfillment, disputes, safety incidents, and DB-backed journeys.

Named gaps include structured recurring/time interpretation, richer city/ZIP/map-origin editing, complete selected-result synchronization, denser self-service readiness UX, external license/malpractice verification, real payment/payout processor connection, and production marketplace liquidity.

## 15. Acceptance milestone

The current Grid milestone is safe to call pilot-ready only when:

- two materially different opportunity classes use the same underlying engine;
- valid supply can move from demand to offer immediately;
- ineligible and unavailable supply is excluded;
- atomic reservation protection is proven;
- payment, fulfillment, payable, payout, and settlement remain distinct;
- platform fee policy is server-owned and reportable;
- operator-assisted and self-service journeys are usable;
- consequential transitions are audited;
- external verification and settlement claims remain truthful.
