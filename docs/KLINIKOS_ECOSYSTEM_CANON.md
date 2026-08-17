# KLINIKOS — ECOSYSTEM CANON

Version: `2026-08-16.1`
Status: `AUTHORITATIVE PRODUCT-DIRECTION CANON`

This document captures the newest product architecture and supersedes narrower interpretations of Klinikos as clinic software, a marketplace, an education product, or an AI assistant. Runtime/code/schema/tests remain authoritative for what is actually implemented today.

## 1. Master definition

**Klinikos is the operating and opportunity infrastructure for the healthcare lifecycle.**

It connects education, careers, clinical operations, patient demand, workforce, facilities, resources, business ownership, networks, transactions, financial state, and intelligence through one persistent identity and governed ecosystem.

Major engines include:

- Living Home
- Klinikos Intelligence / Zumi
- Clinic OS
- Grid
- EDU
- Care
- Billing / Financial OS
- Insights
- Network / Capacity
- Identity / Organizations / Roles
- Credentials / Eligibility / Trust
- Events / Audit / Provenance

These are not separate products glued together. They are interoperating engines of one ecosystem.

## 2. Wiring definition

In Klinikos, **wiring** means more than links or API calls.

The required chain is:

`VISIBLE UI → USER ACTION → IDENTITY / CONTEXT → INTENT → ROUTE → AUTHORIZATION / ELIGIBILITY → RELEVANT ENGINE(S) → REAL DATA / WORKFLOW → PERSISTENCE / EVENT → TRUTHFUL RESULT → AUDIT / FINANCIAL STATE WHEN REQUIRED → NEXT USEFUL ROUTE`

A visually complete feature is not wired if any consequential part of that chain is fake, disconnected, unauthorized, non-persistent when persistence is required, or unable to produce a truthful next step.

## 3. Persistent identity, changing lifecycle

A person must not be permanently trapped in one persona. One identity can hold several roles simultaneously or evolve over time.

Canonical individual progression:

`STUDENT → EDU → TRAINING / SIMULATION → COMPETENCY EVIDENCE → PLACEMENT → CREDENTIAL / LICENSE STATE → GRID ELIGIBILITY → WORK → EXPERIENCE → REPUTATION → SPECIALIZATION → INDEPENDENT WORK → PRACTICE OWNER → CLINIC OS → MULTI-SITE / NETWORK → EDUCATOR / EMPLOYER / PRECEPTOR`

The same person may also remain a patient, provider, student, educator, contractor, owner, or Grid participant under the same identity with different active contexts and permissions.

## 4. Organization lifecycle

Organizations evolve too:

`NEW PRACTICE → CLINIC OS → OPERATIONAL MATURITY → REVENUE OPTIMIZATION → GRID PARTICIPATION → MORE PROVIDERS / CAPACITY → SECOND LOCATION → MULTI-SITE → NETWORK → ENTERPRISE`

Klinikos should surface the next useful capability based on actual context rather than forcing a fixed module menu.

## 5. Living Home is the operating front door

Living Home asks:

> **WHAT NEEDS TO HAPPEN?**

The user describes an outcome in ordinary language. Klinikos determines which engines, data, permissions, eligibility checks, workflows, and external rails are needed.

Examples:

### Staffing

`"I need an RN Friday"`

Living Home → organization context → Grid demand → policy/eligibility → matching → offer/reservation → fulfillment → financial/audit state → Clinic OS follow-up.

### Education

`"I need clinical placement hours"`

Living Home → student/program context → EDU requirement state → Grid placement capacity → eligible path → placement/application → completion evidence → competency/profile update.

### Clinic operations

`"Who needs follow-up today?"`

Living Home → Clinic OS → authorized follow-up state → priority workspace → assignment/action → resolution → audit.

### Growth

`"I want to open another clinic"`

Living Home → organization readiness → implementation route → facility/staffing/capacity needs → Grid/Network → onboarding → new location context.

### Revenue

`"Where are we losing money?"`

Living Home → Clinic OS + Billing + Insights → supported revenue leakage signals → recovery actions → owners/status → outcomes.

## 6. Route graph, not page graph

Pages are implementation surfaces. **Routes are the product.**

Klinikos should maintain reusable route definitions such as:

- Student → Professional
- Graduate → First Job
- RN → Specialty Training
- Professional → Per Diem
- Professional → Independent Contractor
- Contractor → Practice Owner
- Practice → Multi-Site
- Clinic → Staff
- Clinic → Provider
- Clinic → Rent Space
- Provider → Find Space
- Patient → Service
- Student → Placement
- School → Clinical Site
- Clinic → Specialist
- Provider → Continuing Education
- Clinic → Business Service
- Clinic → Revenue Recovery
- Clinic → Additional Location
- Facility → Monetize Capacity

Klinikos Intelligence should resolve current state, desired state, missing requirements, available routes, authorized actions, and next best step. It should not merely choose a page URL.

## 7. Grid's place in the ecosystem

Grid is the **resource, opportunity, capacity, matching, and transaction network**.

It may connect, where lawful and policy-permitted:

- people/providers/professionals
- shifts, jobs, PRN, contracts and projects
- rooms, chairs, facilities and time
- healthcare/business services
- equipment and permitted resource capacity
- education placements, preceptors, training seats
- organizations
- referral/appointment/diagnostic capacity
- patient/service demand only with appropriate privacy and governance

The universal language is:

**I NEED** → demand
**I HAVE** → supply/resource

Grid must support multi-party composition rather than fixed buyer/seller sides.

## 8. Clinic OS ↔ Grid

Clinic OS is both an operating system and a sensor for network opportunity.

Clinic OS may detect:

- staffing gap
- unused room/capacity
- referral leakage
- schedule gaps
- unmet patient demand
- unavailable specialist/capability
- resource/service need

When appropriate and authorized, those may become Grid demand or supply.

Grid outcomes should flow back into Clinic OS as real operational state: booking, assignment, required follow-up, fulfillment, financial obligation, issue, or audit event.

Do not duplicate the same underlying truth in competing tables/services when shared primitives can be used.

## 9. EDU ↔ Grid

EDU is part of the healthcare workforce supply chain:

`LEARN → PRACTICE / SIMULATE → COMPETENCY → PLACEMENT → CREDENTIAL EVIDENCE → ELIGIBILITY → OPPORTUNITY → EXPERIENCE → REPUTATION → CONTINUING EDUCATION`

Klinikos EDU is therefore not just an LMS. It can become the preparation and competency layer that feeds qualified participants into Grid and later brings professionals back for growth.

## 10. Patient / Care ↔ Grid

Where appropriate and permissioned:

`PATIENT/CLIENT DEMAND → ELIGIBLE PROVIDER / FACILITY / CAPACITY → SERVICE / APPOINTMENT → CLINIC OS / CARE FOLLOW-UP → BILLING / FINANCIAL STATE`

Grid must never expose unnecessary patient identity or PHI in public discovery. Progressive disclosure and minimum necessary access remain mandatory.

## 11. Financial OS closes the money loop

Economic routes should converge on shared financial truth rather than module-specific money logic.

Conceptually:

`OPPORTUNITY → AGREEMENT → BOOKING / RESERVATION → FULFILLMENT → FINANCIAL OBLIGATION → PAYMENT EVIDENCE → PAYOUT / RECONCILIATION → REPORTING`

Rules:

- use integer cents for financial state;
- browser redirects are not payment evidence;
- settlement is not complete without evidence;
- payout cannot outrun the governing fulfillment/payment policy;
- Grid, Clinic OS, EDU, commercial activation and services should share financial semantics where possible.

## 12. Insights creates the learning loop

Insights should consume operational truth and produce useful next routes.

Examples:

- Clinic OS → revenue leakage / workflow bottlenecks
- Grid → supply/demand imbalance, time-to-match, unfilled needs
- EDU → placement/competency progression
- Network → unused facility/capacity
- Financial OS → open obligations / margin / payment status
- Workforce → hard-to-fill roles / credential shortages

Insights are not decorative dashboards. A useful insight should explain why it matters and, where possible, offer a governed next action.

## 13. Network effect / flywheel

The long-term flywheel is:

`EDUCATION → SKILLS → CREDENTIALS → GRID → OPPORTUNITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENCE → CLINIC OWNERSHIP → CLINIC OS → NETWORK → MORE CAPACITY + MORE JOBS + MORE PATIENT DEMAND → MORE GRID ACTIVITY → MORE EDUCATION DEMAND → EDU`

The strategic moat is the governed infrastructure connecting the loop: identity, route history, eligibility, reputation/evidence, operational context, supply/demand, transactions, financial truth and next-step intelligence.

## 14. Klinikos Intelligence / Zumi

Zumi is Klinikos Intelligence, not the parent brand and not an independent authority.

It may:

- understand intent
- retrieve authorized context
- identify missing information
- explain choices
- map route options
- summarize
- research public information when safe
- prepare actions
- coordinate across engines

It may not override:

- authentication
- tenant boundaries
- RBAC/resource authorization
- credential/eligibility policy
- clinical release/governance
- financial/payment truth
- safety holds
- transaction state authority

AI interprets. Deterministic systems govern.

## 15. Event-driven ecosystem connection

Use events/adapters to connect engines where appropriate rather than hard-coupling every domain.

Example event families:

- `clinic.staffing_gap_detected`
- `clinic.capacity_available`
- `grid.demand.created`
- `grid.resource.created`
- `grid.match.eligibility_verified`
- `grid.offer.accepted`
- `grid.booking.fulfilled`
- `finance.obligation.created`
- `edu.competency.completed`
- `credential.updated`
- `clinic.followup.created`

Events must use minimum necessary payloads and must never become an uncontrolled PHI bus.

## 16. Architecture migration law

Do not perform a big-bang rewrite to make the code aesthetically match this canon.

Prefer:

- adapters
- shared services
- route definitions
- policy modules
- event contracts
- composition
- gradual migration

Preserve functioning models. Generalize only where the new ecosystem requires it.

## 17. Ecosystem acceptance journeys

The ecosystem is not considered wired until representative cross-engine journeys work truthfully, including:

1. Owner asks for an RN → Grid demand → eligibility → match/next action.
2. Student asks for placement hours → EDU requirements → Grid capacity → authorized next route.
3. Owner asks about revenue loss → Clinic OS + Billing + Insights → supported opportunities.
4. Provider needs treatment space → Grid facility/capacity route.
5. Clinic exposes unused capacity → governed Grid resource without unnecessary PHI.
6. Grid fulfillment → operational follow-up + financial obligation + audit/event.
7. Training/credential change → eligibility changes only when policy permits.
8. Patient demand → appropriate provider/facility without public PHI leakage.
9. Same identity switches role/context → UI adapts while permissions remain correct.
10. Tenant A never receives Tenant B data through any cross-engine route.

## 18. North star

**Simple frontend. Powerful connected backend. One persistent identity. Many roles. Many routes. Shared governance. Shared financial truth. Shared trust. Shared events.**

Living Home asks what needs to happen. Klinikos makes the correct parts of the ecosystem work together to make it happen.
