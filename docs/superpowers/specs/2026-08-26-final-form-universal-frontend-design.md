# Klinikos Final-Form Universal Frontend Design

## Goal

Reconstruct the Klinikos public and authenticated experience around one governed healthcare operating network: one identity, one intelligence layer, one trust graph, one Grid, and many role-aware paths. The redesign must preserve existing authority boundaries, reuse current domain truth, and make repository state explicit enough that public claims cannot silently drift away from what the code and deployment actually support.

## Current-state truth at design time

This design is anchored to `main@7cc55fa557075c9515acca8609bd860d52fb803c` on 2026-08-26. Executors MUST re-read current main before implementing any task and update the work ledger if main moves.

What already exists and should be reused rather than recreated:

- Public root composition at `src/app/page.tsx` using `PublicLivingGateway`, `ProductEvidenceSection`, `EcosystemHierarchy`, and `PublicTrustFooter`.
- Public Zumi conversation UI in `src/components/marketing/public-living-gateway.tsx` calling server-owned `/api/zumi/public` resolution rather than shipping the routing engine to the browser.
- Canonical public messaging in `src/lib/brand/canonical-messaging.ts`.
- Existing Grid demand/resource/eligibility and marketplace policy modules under `src/lib/grid/**` plus public Grid surfaces.
- Existing clinic-facing Living Home and workspace orchestration under `src/components/clinic/**`.
- Existing feature registry canon at `src/lib/feature-registry-canon.ts`.
- Existing patient, EDU, scheduling, billing, clinical, trust, integration and organization surfaces that already own their own authority.
- Active, unmerged work must be treated as concurrent rather than silently copied into this branch. In particular: universal protected entry, universal identity/account, Living Home server authority, Workforce max-upgrade, confidential-access legal drafting, Grid/Trust/Interoperability work.

## Product hierarchy

KLINIKOS is the healthcare operating ecosystem.

ZUMI is the conversational intelligence and experience-orchestration layer.

GRID is the network substrate for needs, offers, resources, opportunities, capacity and governed relationships.

EDU is the learning, competency and workforce advancement layer.

PATIENT, CLINICAL, OPERATIONS, COMMERCE and ENTERPRISE are governed execution domains inside the same ecosystem, not separate products with separate identities.

## Core interaction law

The universal journey is:

`ARRIVE -> UNDERSTAND VALUE -> CONVERSE -> IDENTIFY -> CLAIM -> VERIFY AS NEEDED -> AUTHORIZE -> CREATE NEED/HAVE INTENT -> MATCH -> WORK/CONNECT/TRANSACT -> RETURN -> EXPAND NETWORK`

The user should not have to understand the router, Grid taxonomy, role model or product map. Zumi should translate natural language into structured intent while backend policy and governing domains retain authority.

## Identity / claim / verification law

A self-reported claim is never authority.

The architecture must preserve the distinction:

`Person -> Claims -> Verifications -> Relationships -> Authority -> Intents -> Grid`

Examples:

- “I own a clinic” creates a claim and an organization-verification path, not ownership authority.
- “I am a nursing student” creates a student-affiliation claim; institutional email or approved alternate proof can verify the affiliation.
- “I am an NP” creates a professional claim; email alone cannot grant regulated clinical authority.
- A free-email address may create a personal identity but cannot by itself verify an organization relationship.

Friction rises with authority. Browsing is low-friction; representing an organization, accessing protected data, or executing consequential actions requires stronger proof.

## Public front-end target

The root page must become a progressive-disclosure Living Home, not a product-menu landing page.

### First viewport

Must answer quickly:

- What is Klinikos?
- Why does it matter?
- What can I do here?
- What should I do next?

Primary interaction remains Zumi.

The public experience may show a small set of example intents, but should not force the visitor to classify themselves manually before speaking.

### Progressive value

Anonymous visitors may receive public information and public-safe Grid/EDU/product guidance.

Account creation should occur when persistence or authority is needed: saving, posting, messaging, managing a profile, persistent uploads, organization representation, notifications, applications/requests, or protected workflows.

### Path families

The product must ultimately support governed paths for at least:

- patient / consumer
- caregiver / family
- student
- worker / job seeker
- professional / clinician
- clinic owner
- clinic staff
- employer / recruiter
- school / university / training organization
- workforce board / government program
- educator / instructor
- healthcare vendor
- space / equipment / capacity supplier
- investor / capital
- entrepreneur / founder
- partner / business development
- proposal / procurement / RFP submitter
- referrer
- enterprise buyer

These paths should share identity, claims, verification, Grid and policy foundations. They must not become independent account systems.

## Public path presentation

The first implementation tranche will add a public-safe path catalogue used only for presentation and routing hints. It MUST NOT grant authority or pretend that every end-state is already live.

Each public path definition must contain:

- stable key
- human label
- entry examples
- current public destination
- first-value statement
- verification expectation summary
- monetization posture summary
- public truth state

Truth states for public-path presentation:

- `AVAILABLE_NOW`: current main exposes a user-visible route and current product value.
- `GOVERNED_ACCOUNT_REQUIRED`: the public route can introduce the path, but meaningful continuation depends on an authenticated/governed flow.
- `ACTIVE_DEVELOPMENT`: approved/implemented branch work exists but is not production truth.
- `PLANNED`: design direction only; never describe as available.

## Repository truth convergence

Create one repository truth canon explaining evidence precedence:

1. production-verified release evidence
2. deployed release identity
3. current main
4. merged code
5. verified feature branch
6. active implementation branch
7. approved design
8. roadmap
9. concept
10. deprecated history

Product-state vocabulary:

- `PRODUCTION_VERIFIED`
- `DEPLOYED_UNVERIFIED`
- `MERGED_NOT_DEPLOYED`
- `IMPLEMENTED_UNVERIFIED`
- `IN_ACTIVE_DEVELOPMENT`
- `APPROVED_DESIGN`
- `PLANNED`
- `BLOCKED`
- `DEPRECATED`

Public claims must never be strengthened beyond the best evidence state that supports them.

## Design system

The universal front end must converge on the current Klinikos Black Label material language:

- Obsidian for focused/cinematic dark experiences
- Marble for high-legibility operational light experiences
- rose / black-cherry accent for attention and brand continuity
- calm spacing, high information hierarchy, restrained motion
- no generic SaaS gradients, random accent colors, crowded card walls or childish LMS styling

Accessibility outranks visual effect.

## Zumi authority boundary

Zumi may:

- understand intent
- explain product capability
- propose a next step
- draft structured Grid needs/offers
- help interpret uploads
- help users correct and confirm extracted information
- surface public-safe matches
- guide users toward verification

Zumi may not independently:

- verify identity
- grant organization authority
- grant clinical authority
- create verified attendance
- approve workforce completion
- grant licensure/credential status
- create financial authority
- expose PHI from public context
- bypass policy or governing domain services

## Grid role

Grid is the network graph for `I NEED` and `I HAVE` across people, organizations, services, resources, jobs, capacity, space, equipment, education, opportunities, referrals and other allowed classes.

The front end should progressively teach this value through actions, not through taxonomy lectures.

## Free / paid principle

Individuals generally create network liquidity and should receive meaningful free participation where safe: public discovery, basic identity, basic professional/student profile, basic Grid posting/discovery, basic networking.

Organizations pay when economic leverage is created: SaaS operations, recruiting, premium distribution, lead generation, automation, communications, education delivery, analytics, implementation, enterprise support, transactions or other lawful commercial value.

Payment is never authority.

## Security / privacy

Every path must fail closed on authority. No public component may receive secrets, raw internal policy, PHI, hidden proprietary routing logic, or unnecessary organization/internal identifiers.

Uploads must be confirmed before extracted claims become persistent structured facts.

## Front-end reconstruction sequence

1. Repository truth canon + persistent work ledger.
2. Public-safe universal path catalogue and source-contract tests.
3. Root page progressive-disclosure path section using the catalogue.
4. Canonical messaging expansion that preserves truthful existing-platform evidence while broadening the network thesis.
5. Reconcile protected-entry PR and universal Account/identity PRs before changing signup/verification flows.
6. Implement progressive verification UI backed by actual identity/claim/relationship authority.
7. Converge Grid entry/post/match experiences around Zumi-assisted `I NEED / I HAVE` drafting.
8. Add role/path-specific return experience on Living Home without duplicating domain authority.
9. Converge EDU, patient, organization and enterprise buyer visual systems.
10. Global accessibility, responsive, performance, security and truth audit before release.

## Definition of done

The redesign is not complete until:

- every primary user type has a documented path;
- root experience can accept open-language intent without exposing the router;
- business/student/professional claims trigger appropriate verification paths before corresponding privileges unlock;
- one identity can hold multiple relationships without duplicate accounts;
- Grid supports progressive need/have participation without forcing users to understand its schema;
- public copy distinguishes production/available behavior from active-development or planned behavior;
- all major routes visually belong to one Klinikos system;
- mobile, keyboard, screen-reader, loading, empty, partial, blocked and error states are explicitly tested;
- repository canon makes current product truth understandable without chat history;
- production release identity is verified before claiming the remodel live.
