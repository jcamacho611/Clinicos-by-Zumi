# Klinikos Universal Entry, Adaptive Experience, and Reference Environment Design

Date: 2026-08-23  
Status: DESIGN SPEC — USER-APPROVED DIRECTION, IMPLEMENTATION PLAN PENDING REVIEW  
Branch: `chatgpt/universal-entry-adaptive-shell-spec`

## 1. Purpose

This specification converts the 2026-08-22/23 professional feedback, clinical-convergence work, universal Grid identity thesis, freemium/transaction strategy, legal-access foundation, Living Home design canon, and user-approved product direction into one coherent architecture for how people first enter Klinikos, how Klinikos learns what they need, how the product visually adapts, and how the reference demo proves the full platform without exposing unnecessary complexity.

This design is additive. It does not replace Current Visit, Clinical Change Graph, Staff Handoff, Grid, EDU, Financial OS, Revenue Integrity, specialty composition, interoperability, Zumi governance, or the server-confidentiality boundary.

The product goal is:

> Klinikos may become extremely complex underneath while remaining unusually simple, fast, calm, and obvious at the surface.

The company-wide interaction model is:

`INTENT → AUTHORIZED CONTEXT → RELEVANT TRUTH → NEXT USEFUL ACTION → OWNED COMPLETION`

The company-wide continuity question is:

> What happened next?

---

## 2. Non-negotiable product laws

1. **Klinikos is one ecosystem, not a collection of unrelated products.** Clinic OS, Grid, EDU, Care, Financial OS, Network, Enterprise, Current Visit, and Zumi operate over shared identity, relationship, authority, event, evidence, and financial truth.
2. **The complexity belongs to Klinikos, not the user.** Backend depth may increase indefinitely; perceived frontend complexity should decrease.
3. **One person, one evolving identity.** Student, professional, employee, contractor, preceptor, owner, educator, organization member, and Grid participant may be simultaneous contexts of one identity.
4. **Zumi interprets and orchestrates but does not become deterministic authority.** Credentials, permissions, eligibility, signing, payment, settlement, clinical truth, and regulated completion remain governed elsewhere.
5. **Eligibility precedes ranking.** Payment, sponsorship, AI confidence, or popularity cannot override failed hard eligibility.
6. **Current Visit remains the provider-facing convergence surface.** The provider should not reconstruct the patient by navigating separate modules.
7. **Patients are not public Grid profiles.** Patient-related network activity remains permissioned, minimum-necessary, and private.
8. **Public information is public.** Contractual confidentiality supplements technical secrecy; it does not convert intentionally public marketing content into a trade secret.
9. **Frontend = experience. Backend = authority and intelligence. DTO = disclosure boundary.** Hidden prompts, ranking weights, anti-gaming methods, pricing/margin logic, trust/risk logic, security heuristics, credentials, and unnecessary PHI/PII stay server-side.
10. **No fake success.** Redirect is not payment. Adapter is not live integration. Match is not eligibility. Reservation is not fulfillment. AI suggestion is not clinical truth. Demo data is synthetic and clearly synthetic.
11. **Reference/demo work must use real Klinikos engines wherever those engines already exist.** External parties may be simulated in a synthetic environment; internal Klinikos state machines should remain real.
12. **Customer variation uses configuration, not forks.** Target composition remains `KLINIKOS CORE + SPECIALTY PACK + ORGANIZATION CONFIG + LOCATION OVERRIDE`.

---

## 3. The architectural expansion: Layer Zero

The 2026-08-23 gateway/freemium work is a new **Layer Zero** around the already accepted Klinikos architecture.

### Layer 0 — Discovery, trust, entry, activation

- public discovery/SEO
- Enter Klinikos
- mandatory protected-entry agreement
- signup/login
- pre-auth acceptance binding
- Zumi onboarding
- basic identity/profile
- personalized reference/demo experience
- initial Grid utility
- free activation and paid expansion

### Layer 1 — Shared identity and authority

- identity
- organizations
- locations
- roles
- profession
- credentials
- privileges
- relationships
- visibility
- consent
- agreements
- entitlements
- policy

### Layer 2 — Ecosystem engines

- Clinic OS
- Grid
- EDU
- Care
- Financial OS
- Network
- Enterprise
- Commerce / transaction capabilities
- professional/business presence

### Layer 3 — Clinical Convergence

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

### Layer 4 — Continuity / moat engines

- Clinical Change Graph
- Workflow Completion Graph
- Revenue Integrity Graph
- Integration/Reconciliation Graph
- Healthcare/Grid Relationship Graph
- Capability/Credential Graph
- Capacity Graph
- Learning/Capability Graph
- Commerce/Transaction Graph

### Layer 5 — Zumi intelligence across authorized context

Zumi helps the user understand and act across the layers without becoming the authority behind them.

---

## 4. Public discovery versus protected Klinikos

### 4.1 Public Discovery Surface

Public pages remain viewable and indexable where doing so helps discovery, credibility, SEO, press, investors, referrals, advertising, and social sharing.

Representative public surfaces may include:

- homepage
- public how-it-works
- public research/education content
- public product summaries
- public pricing concepts where intentionally published
- public case studies when truthful and authorized
- public company/about pages

Public pages must avoid exposing restricted implementation detail, hidden commercial logic, proprietary workflow internals, private demonstrations, hidden Zumi instructions, Grid matching/ranking logic, unreleased strategy, or customer-sensitive information.

### 4.2 The one governed interactive door

The primary transition from public discovery into protected Klinikos is:

> **ENTER KLINIKOS**

No protected interactive surface should be reachable by bypassing this journey through a stale deep link, direct route, or direct API call.

Protected interactive surfaces include, as applicable:

- personalized Zumi
- private demonstrations
- interactive product reference environment
- authenticated Grid participation
- professional Grid profiles
- organization workspaces
- EDU workspaces
- Clinic OS
- Current Visit
- private product previews
- protected product APIs

Server-side authorization remains the enforcement boundary. Navigation hiding is not sufficient.

---

## 5. The Klinikos Access Airlock

The Access Airlock is the bridge between anonymous discovery and the governed Klinikos ecosystem.

### 5.1 Entry sequence

`PUBLIC DISCOVERY → ENTER KLINIKOS → ACCESS AIRLOCK → ACCEPT ENTRY AGREEMENT → CREATE ACCOUNT / SIGN IN → BIND ACCEPTANCE TO IDENTITY → ZUMI → PERSONALIZED KLINIKOS`

### 5.2 Visual requirement

The airlock is not a generic legal modal or disconnected white legal page.

It remains inside the approved Klinikos visual world:

- orbital K
- KLINIKOS wordmark
- cinematic rose
- spacious composition
- restrained motion
- warm, readable typography
- clear affirmative controls

The legal ceremony must be understandable and accessible, but the user should feel that they are entering Klinikos rather than leaving it.

### 5.3 Two-stage evidence model

The existing authenticated legal-access architecture is preserved and generalized.

Recommended sequence:

1. Anonymous/pre-auth `EntrySession` is created server-side.
2. The exact entry agreement key/version/hash is presented.
3. Required acknowledgments are collected affirmatively; none are preselected.
4. The server records pre-auth presentation/acceptance evidence tied to the entry session and privacy-minimized request evidence.
5. The visitor creates an account or signs in.
6. The server proves continuity between the entry session and authenticated identity.
7. The acceptance is bound/ratified to the authenticated Klinikos identity.
8. Protected session capability is granted only after applicable acceptance is current.

A pre-auth checkbox alone is not the final source of contractual identity truth.

### 5.4 Agreement layering

Do not force every participant to accept every future commercial document at entry.

The legal system should become progressive:

**Entry layer**
- Terms of Use
- Privacy disclosures as applicable
- Confidentiality/restricted-use obligations for protected access
- acceptable use
- electronic-signature intent
- AI/Zumi authority boundaries

**Professional / Grid layer**
- professional truth representations
- Grid participant terms
- regulated-opportunity terms where required

**Organization / Clinic layer**
- organization authority
- MSA/order/SOW
- DPA
- BAA where legally required
- implementation/integration terms

**Seller / commerce layer**
- seller/merchant terms
- transaction/cancellation/dispute terms

**EDU / institutional layer**
- learner or institutional terms
- program-specific rules

Agreement state becomes a governed input to eligibility and entitlement rather than one global boolean.

---

## 6. Signup/login and one evolving identity

### 6.1 No forced persona fork

Do not permanently ask the user to choose one identity such as Nurse, Student, Owner, Provider, or Educator.

The same person may be several at once.

Target identity progression:

`VISITOR → MEMBER → BASIC GRID PROFILE → PROFESSIONAL / LEARNER / OWNER CONTEXT → EVIDENCE SUBMITTED → VERIFIED WHERE APPLICABLE → ORGANIZATION-AUTHORIZED WHERE APPLICABLE`

### 6.2 Minimal account creation

Initial account creation should ask only what is needed for secure identity and the next useful action.

Do not require a complete professional, clinic, organization, or learner profile before delivering any value.

### 6.3 Progressive profile composition

Zumi and the product progressively ask for fields that unlock the user’s stated goal.

Example:

User: “I’m an RN looking for weekend work.”

Klinikos may need, in sequence:

- basic identity
- jurisdiction/state
- professional self-description
- desired work context
- availability
- credential evidence if required to proceed
- verification state

The platform must distinguish:

- self-asserted
- document submitted
- verification pending
- externally verified
- organization-granted privilege
- action-specific eligibility

These states must never collapse into one generic “verified” badge.

---

## 7. Zumi onboarding: the first authenticated experience

### 7.1 Living Home remains the first authenticated surface

Do not route a new user into a giant onboarding wizard, plan picker, module catalog, or static dashboard.

The first authenticated experience is Living Home in onboarding state.

Primary question:

> **What brings you here?**

Returning-state variants may include:

> **What needs your attention?**

> **Your next patient is ready.**

> **Three opportunities match what you are looking for.**

> **You are close to your next learning milestone.**

### 7.2 Progressive Product Disclosure

Klinikos should not expose its total feature breadth at once.

The system identifies the current objective, relevant role/context, and authorized capabilities, then reveals the smallest useful workspace that can move the user forward.

Examples:

- “I need an RN Friday.” → Grid demand
- “Show me what changed with my next patient.” → Current Visit
- “Why have we not been paid?” → Revenue Integrity
- “I need clinical hours.” → EDU + Grid placement
- “I own a clinic and referrals disappear.” → referral continuity workspace/demo
- “I have a room open Saturday.” → Grid resource/supply
- “I want to grow my med spa.” → Business/commerce/CRM route

### 7.3 Zumi must not silently persist inferred facts as authority

Natural-language onboarding can produce **intent candidates** and **profile suggestions**.

Structured facts with consequence must be user-confirmed or verified through authoritative systems before being persisted as authoritative profile/credential/organization truth.

---

## 8. Living Home is the universal adaptive shell

Living Home remains the primary adaptive operating surface rather than a dashboard catalog.

### 8.1 Permanent elements

The exact visible treatment may adapt by viewport and context, but the product identity should consistently preserve:

- Klinikos brand/header
- Zumi command/composer access
- active identity/context affordance
- theme control
- trustworthy system/work state
- access to deeper governed navigation when needed

### 8.2 Contextual transformation

Living Home can transform its center surface into a real domain workspace while preserving the same visual and interaction language.

Representative projections:

- Current Visit
- Grid demand/resource workflow
- EDU learner/instructor workspace
- Revenue Integrity exceptions
- referral continuity
- owner operations
- workforce/capacity
- professional profile/credential state
- business storefront/commerce

Do not throw the user into unrelated visual applications.

### 8.3 Outcome-first language

Backend terms remain backend.

Prefer:

- “Continue” instead of “Open Path”
- “This connection still needs to be set up” instead of “Capability unavailable”
- “This option does not meet the requirements” instead of “Resource eligibility failure”
- “Two items still need attention” instead of exposing raw workflow-state vocabulary

---

## 9. Original Klinikos visual identity and theme law

The existing approved Living Home visual system remains the source of truth.

### 9.1 Dark mode

Preserve the current Klinikos identity:

- obsidian / near-black foundations
- black cherry / deep oxblood structural surfaces
- burgundy/black-cherry cinematic rose
- warm ivory primary typography
- dusty rose / muted coral / ember-pink accents
- restrained intelligence glow
- editorial spacing and negative space
- compact orbital K + KLINIKOS wordmark

Do not drift into cyan/teal-dominant generic healthcare SaaS.

### 9.2 Light mode

Light mode is **not a new brand or redesign**.

It uses the same:

- geometry
- hierarchy
- typography scale
- rose composition
- header
- composer
- rails
- workspaces
- interaction patterns

The environment is inverted for readability:

- warm white / cream background
- pale blush / very light rose structural surfaces
- pink / dusty-rose / coral rose treatment
- dark oxblood / charcoal typography
- pale rose-gray borders
- high-contrast focus states
- same restrained Zumi identity

### 9.3 Theme persistence

Pre-auth theme preference persists locally. Authenticated users may persist theme preference to their account. System preference may be supported.

Avoid flash-of-wrong-theme and hydration mismatch.

### 9.4 Accessibility

Both modes must meet strong contrast and keyboard/focus requirements, support reduced motion, zoom, screen readers, and mobile layouts.

---

## 10. Current Visit as the clinical hero workflow

The reference environment’s strongest physician story is Current Visit.

Target sequence remains:

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

### 10.1 Frontend goal

The physician should feel:

- I know who this patient is.
- I know what changed.
- I know what staff already handled.
- I know what requires my judgment.
- I know what happens next.

The provider should not need to manually traverse Patients → Labs → Imaging → Referrals → Billing → Tasks → Messages merely to reconstruct today’s visit.

### 10.2 Domain authority remains separate

Current Visit composes projections from real domain repositories. It does not duplicate their authority.

Labs, imaging, referrals, medications, tasks, forms, revenue state, and other domain engines continue to own their truth and lifecycle.

### 10.3 Continuity after signing

The reference experience should demonstrate that Klinikos does not stop at documentation.

After clinical work, it may surface truthful downstream state such as:

- order awaiting confirmation/transmission
- result awaiting review
- referral awaiting acceptance/scheduling
- patient communication outstanding
- coding review needed
- charge expected but missing
- claim readiness exception
- follow-up due

This is a major differentiation from note-centric systems.

---

## 11. Reference Environment and personalized demo

### 11.1 The reference environment is not a fake sales shell

It is the highest-quality truthful implementation of Klinikos using synthetic data and real internal product components.

The same environment can serve as:

- sales demo
- investor demo
- physician-feedback environment
- QA environment
- UAT starting point
- EDU simulation base
- specialty-pack validator
- implementation reference

### 11.2 Two demo modes

**Guided Demo**
- short, opinionated, problem-focused
- Zumi guides the user
- designed for first-value understanding in minutes

**Exploration Mode**
- user can inspect the real working reference product
- synthetic data only unless otherwise authorized
- truthful unavailable/pending external states

### 11.3 Personalized demo composition

The demo should be generated from the user’s stated objective rather than one universal canned tour.

Examples:

**Orthopedic / No-Fault / MSK**
- Current Visit
- initial → previous → today
- body map when implemented
- imaging
- PT progression
- referral state
- financial-case context
- revenue continuity

**Primary care**
- chronic conditions
- medications
- labs
- preventive work
- referrals
- follow-up

**Med spa / cash-pay business**
- lead
- consult
- booking
- provider
- room/resource
- service
- payment
- rebooking
- Grid capacity

**RN / professional**
- profile
- credential state
- availability
- opportunities
- EDU
- fulfillment/reputation evidence

**Student**
- learning
- simulation
- assessment
- instructor review
- competency evidence
- placement
- professional transition

### 11.4 Demo conversion

After demonstrating value, the preferred conversion is:

> **Make this mine.**

Then collect only the information necessary to build an implementation/configuration proposal.

Target path:

`DEMO → MAKE THIS MINE → CURRENT SYSTEMS / LOCATIONS / TEAM / SPECIALTY / REQUIRED INTEGRATIONS → GAP / CONFIGURATION MAP → COMMERCIAL REVIEW → IMPLEMENTATION → UAT → GO-LIVE`

---

## 12. Free entry and value-first monetization

### 12.1 Core rule

Joining Klinikos should be free enough to build network liquidity and demonstrate value.

Free does not mean unlimited variable-cost rails.

### 12.2 Natural value ladder

Representative ladder:

`VISITOR $0 → MEMBER $0 → BASIC GRID PROFILE $0 → BASIC PROFESSIONAL / LEARNER / BUSINESS PRESENCE $0 → PERSONALIZED DEMO $0 → FIRST VALUE → OPTIONAL PAID EXPANSION`

Paid expansion may include:

- professional tools
- seller/business tools
- Clinic OS
- specialty packs
- premium/operational Zumi
- advanced analytics
- EDU/institutional capabilities
- integrations
- implementation
- multi-location/enterprise governance
- managed services
- usage rails
- lawful transaction economics

### 12.3 Payment principle

> **Show value → show what more is possible → ask for payment.**

Avoid `Pay → Hope`.

### 12.4 Economic ownership of variable-cost services

AI inference, SMS, voice, verification, telehealth, payments, maps, storage, and other third-party rails need a defined economic owner through allowance, acquisition budget, pass-through, usage, premium tier, or organization-funded balance.

---

## 13. Commerce, storefronts, and transaction architecture

This design recognizes commerce as a shared capability under Grid rather than a disconnected product.

Potential governed transaction classes include:

- space/capacity rental
- non-clinical business services
- education
- permitted products/equipment
- workforce transactions where lawful
- professional services where lawful
- diagnostic/resource capacity
- other future classes approved by policy

Clinical-referral or professional-fee economics must not blindly copy Airbnb/Uber/Upwork models; transaction-class-specific legal review is required.

### 13.1 Pricing policy engine

Do not hardcode one global percentage.

Target server-side decision chain:

`TRANSACTION CLASS → JURISDICTION → PARTICIPANT TYPES → AGREEMENT → PRICING POLICY VERSION → FEES / OBLIGATIONS → PAYMENT EVIDENCE → PAYOUT / RECONCILIATION`

### 13.2 Business/professional presence

Participants may eventually maintain governed public or network-facing presence including applicable:

- profile
- organization/location affiliation
- services
- availability
- permitted products/resources
- education
- opportunities
- business media/content
- booking/contact routes
- reputation/evidence
- promotions/sponsored visibility clearly labeled

Sponsored placement never overrides eligibility.

---

## 14. Invitation and network growth

Organization onboarding should become a network multiplier.

A clinic may invite its legitimate workforce into Klinikos. Each person retains one evolving identity rather than becoming a disposable organization-only account.

Target invitation flow:

`ORGANIZATION INVITES PERSON → ENTRY GATE → ACCOUNT / EXISTING IDENTITY → ORGANIZATION MEMBERSHIP → ZUMI CONTEXT → OPTIONAL PERSONAL GRID / EDU / CAREER USE`

The organization gains governed workforce/capacity truth. The individual gains a portable longitudinal Klinikos identity.

Visibility remains separated into:

- private identity
- organization-visible membership/assignment state
- intentionally Grid-discoverable profile projection

Employment, compensation, internal schedule, and other private HR data are not automatically public Grid data.

---

## 15. Trust, abuse, and reputation

Network growth requires trust infrastructure from the start.

Design must anticipate:

- identity fraud
- credential fraud
- fake opportunities
- fake products/services
- spam
- harassment
- scraping
- ranking manipulation
- fake fulfillment
- payment fraud
- disputes
- cancellations/no-shows
- blocks/reports
- suspensions
- appeals
- rate limits
- audit evidence

Reputation should favor objective evidence such as fulfillment, reliability, verified education, credential freshness, cancellation/no-show history, repeat relationships, disputes, and other policy-approved signals.

Reputation never substitutes for eligibility.

---

## 16. Clinical, Grid, EDU, and financial convergence examples

### 16.1 Referral continuity

`CLINIC OS DETECTS UNMET REFERRAL → ZUMI EXPLAINS → GRID FINDS ELIGIBLE CAPACITY → REFERRAL WORKFLOW → APPOINTMENT / RESULT → PROVIDER REVIEW → PATIENT COMMUNICATION → CLOSED LOOP`

### 16.2 Workforce capacity

`CLINIC DETECTS UNCOVERED SHIFT → GRID DEMAND → ELIGIBLE PROFESSIONAL → OFFER / RESERVATION → WORK → FULFILLMENT → FINANCIAL / REPUTATION STATE`

### 16.3 Workforce shortage to EDU

`GRID SHORTAGE SIGNAL → EDU PATHWAY / PARTNER → LEARNING / COMPETENCY EVIDENCE → PLACEMENT → PROFESSIONAL IDENTITY → WORK`

### 16.4 Clinical-to-revenue continuity

`CARE PERFORMED → DOCUMENTED → CODE EVIDENCE → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → SUBMITTED → ACCEPTED → ADJUDICATED → PAID → RECONCILED`

Every missing transition can become owned unfinished work.

---

## 17. Implementation compatibility with current repo

### 17.1 Reuse existing legal foundation

Reuse/version existing:

- global agreement document model
- agreement key/version/hash
- acknowledgments
- reviewed/presentation evidence
- e-sign intent
- execution evidence
- signed-copy/history mechanisms
- authenticated protected-session enforcement

Generalize it for pre-auth entry-session evidence and later identity binding rather than replacing it.

### 17.2 Preserve existing organization onboarding

The current clinic-owner organization onboarding/provisioning path remains useful for paid organization activation.

It should move later in the journey rather than acting as the universal person-level front door.

### 17.3 Preserve in-progress clinical work

The active `chatgpt/encounter-staff-handoff-projection` branch is a valid continuation of Clinical Convergence and must not be overwritten by Gateway work.

Gateway/reference work should consume Current Visit as it matures rather than creating a fake replacement.

### 17.4 No new duplicate auth/identity platform

If the current schema constrains `User` to an organization, the implementation plan must evolve that architecture carefully through migrations/adapters/membership modeling. It must not solve the problem by creating a second disconnected authentication system.

---

## 18. Error handling and truth states

The experience must fail truthfully and helpfully.

Representative states:

- agreement version changed → require current acceptance
- pre-auth entry session expired → restart airlock without losing public access
- acceptance cannot be bound → deny protected access and provide recovery
- user already exists → sign in and bind acceptance safely
- requested action needs credential evidence → explain requirement; do not pretend user is eligible
- connector not configured → show setup/pending state
- no Grid supply → truthful empty state; never fake inventory
- Zumi uncertain → ask one targeted clarification
- protected API accessed without current agreement → fail closed server-side

---

## 19. Testing requirements

Implementation must include automated and manual evidence for:

### Legal/access

- public pages remain accessible without agreement
- protected page/API fail closed without current agreement
- exact version/hash acceptance
- anonymous/pre-auth entry session creation
- identity binding after signup
- identity binding after login
- replay/idempotency behavior
- stale agreement reacceptance
- agreement history preservation
- direct deep-link bypass denial

### Identity/onboarding

- one identity can acquire multiple contexts safely
- inferred intent is not silently authoritative
- profile visibility boundaries
- organization membership does not force public Grid visibility

### Theme/design

- dark mode visual fidelity
- light mode is same composition, not alternate design
- theme persistence pre-auth and post-auth
- no flash/hydration regression
- keyboard, focus, reduced motion, zoom, screen reader
- 390 / 768 / 1024 / 1402 / 1440 / 1920 widths

### Zumi/adaptive shell

- user intent routes to correct governed workspace
- Zumi state labels are truthful
- missing consequential fact triggers clarification rather than fabrication
- same-surface workspace remains usable

### Clinical reference

- synthetic-only reference data
- Current Visit uses real internal projections
- What Changed is deterministic or truthfully unavailable
- Staff Handoff never claims completeness without evidence
- downstream completion state remains truthful

### Commerce/Grid

- eligibility before ranking
- pricing policy server-side
- redirect != payment
- reservation != fulfillment
- no fake inventory/distance/availability

---

## 20. Program decomposition

This design is intentionally larger than one implementation PR. Safe execution should be decomposed into reviewable programs.

### Program A — Source-of-truth and canon reconciliation

Update repository-wide canon after this spec is approved so every future agent understands:

- Layer Zero gateway
- public versus protected surfaces
- mandatory interactive entrance
- two-stage agreement binding
- Zumi-first onboarding
- progressive product disclosure
- Living Home universal shell
- theme inversion law
- reference environment role
- free-entry/value-first monetization

### Program B — Entry Gateway / Legal Airlock

- entry session
- pre-auth agreement presentation/acceptance
- identity binding
- protected-route/API enforcement
- deep-link guard
- recovery and reacceptance

### Program C — Universal person-level identity activation

- decouple universal identity from mandatory clinic-owner provisioning where necessary
- contextual memberships/roles
- visibility state
- profile progression

### Program D — Zumi onboarding and adaptive Living Home

- onboarding state
- intent candidate confirmation
- contextual first routes
- same-surface workspace projection

### Program E — Dark/light theme completion

- preserve exact dark identity
- implement light inversion
- persistence
- accessibility/visual QA

### Program F — Reference Environment

- synthetic organizations/personas/patients/cases
- guided/exploration modes
- Current Visit hero journey
- owner/Grid/EDU branching stories
- truthful external partner simulation

### Program G — Demo-to-implementation conversion

- Make This Mine
- configuration discovery
- current-system/integration requirements
- implementation proposal handoff
- human commercial review

### Program H — Free Grid utility and network activation

- basic profile
- I NEED / I HAVE
- saved interests/alerts
- invitations
- governed org claims

### Program I — Commerce and pricing fabric

- transaction classes
- pricing-policy engine
- seller tools
- lawful fee models
- payment/payout/reconciliation truth

### Program J — Continued clinical convergence

Continue independently but compatibly:

- Staff Handoff
- Clinical Change Graph
- specialty composition
- orders/results convergence
- telehealth in encounter
- revenue integrity
- interoperability

Programs may overlap only where dependencies are explicit and merge conflicts are controlled.

---

## 21. First implementation tranche after plan approval

The first implementation tranche should be **Entry Gateway + Legal Airlock + theme-aware protected transition**, because it creates the durable front-door dependency for Zumi onboarding, demo personalization, free Grid activation, and product protection.

It should not attempt to implement all Grid commerce, all EDU, all Current Visit future features, or all identity-schema evolution in the same PR.

Expected first-tranche outcome:

1. Public discovery remains accessible.
2. `Enter Klinikos` becomes the canonical interactive entry CTA.
3. Protected interactive routes require current entry agreement.
4. Agreement may be executed pre-auth through an entry session.
5. Signup/login binds the accepted entry session to the authenticated identity.
6. Dark mode matches current Klinikos reference.
7. Light mode uses the same geometry with white/cream + pink/rose inversion.
8. After successful auth/binding, the user enters Living Home in Zumi onboarding state.
9. No existing Clinic OS, Grid, EDU, Current Visit, payment, or clinical authority is weakened.

---

## 22. Success criteria

This design is successful when a first-time visitor can:

1. discover Klinikos publicly without being blocked from basic marketing/SEO content;
2. click one obvious `Enter Klinikos` action;
3. understand and affirm the applicable protected-entry agreement;
4. create an account or sign in without encountering a disconnected visual system;
5. arrive in the original Klinikos Living Home visual world;
6. meet Zumi and explain what they need in ordinary language;
7. receive a personalized, truthful next experience without learning module names;
8. experience meaningful free value before a paid boundary where appropriate;
9. move into a synthetic working reference/demo when useful;
10. understand a natural path to Grid, EDU, Clinic OS, professional/business tools, or enterprise without separate accounts or disconnected products.

For the provider reference journey, success means the clinician can understand the patient, change, staff handoff, required judgment, orders/results, close-visit blockers, and downstream continuity with materially less context switching than a traditional module-wall workflow.

---

## 23. Final product statement

Klinikos should not be designed as a collection of healthcare software modules.

Klinikos is a unified healthcare operating, economic, professional, clinical, educational, financial, capacity, and coordination network that progressively reveals only what the current person needs.

The public site earns curiosity.

The Entry Gateway establishes trust and governed access.

Identity preserves the person across their healthcare lifetime.

Zumi understands the intent.

Living Home assembles the appropriate experience.

Current Visit simplifies the clinician’s moment of care.

Grid connects people, organizations, resources, demand, and capacity.

EDU develops capability.

Commerce and Financial OS track legitimate economic state.

Continuity engines ensure important work does not disappear at boundaries.

The defining product law is:

> **Every new backend capability should eventually reduce, not increase, the amount of software the user has to consciously operate.**
