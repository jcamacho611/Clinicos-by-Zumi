# Klinikos Operating Network Architecture

Date: 2026-08-23
Status: APPROVED ARCHITECTURE DIRECTION

## Purpose

Evolve Klinikos from a collection of strong healthcare product surfaces into one coherent healthcare operating network with multiple commercial entry points, shared truth, shared identity, shared intelligence, shared evidence, and compounding network effects.

Klinikos remains truthful about implementation state. This architecture does not convert roadmap capabilities into production claims.

## Core Thesis

Klinikos is the operating ecosystem for healthcare.

It combines:

- Clinic OS for recurring healthcare operations;
- Grid for governed demand, supply, capacity, matching, reservations, and transactions;
- Network for durable partner relationships, referrals, handoffs, and capacity coordination;
- Klinikos EDU for workforce training, simulation, evidence, assessment, and institutional delivery;
- Klinikos Intelligence, Zumi, as the governed intelligence layer across roles and surfaces;
- Patient access through a separate authorization boundary;
- commercial activation, entitlements, payment evidence, and organization provisioning;
- a shared identity, relationship, evidence, and policy substrate.

These are not separate companies or disconnected products. They are commercial doors into one graph.

## Product Configuration Model

### Klinikos Care

Primary buyers: clinics, practices, healthcare organizations.

Jobs:
- run patient flow;
- coordinate staff work;
- manage encounters and operational evidence;
- prepare referrals and handoffs;
- manage tasks, forms, records, revenue-readiness, and follow-up;
- surface the next useful action through Living Home and Zumi.

Revenue model:
- recurring SaaS;
- implementation;
- premium modules;
- usage-based intelligence;
- enterprise configuration and integrations.

### Klinikos Grid

Primary participants: organizations, professionals, service providers, resource owners, buyers, sellers, network participants.

Jobs:
- express I NEED / I HAVE;
- discover governed resources and opportunities;
- match on hard eligibility before ranking;
- create offers and reservations;
- record obligations, fulfillment, disputes, incidents, and evidence;
- preserve truthful geographic and availability state.

Revenue model:
- transaction and reservation fees where permitted;
- premium organization/network access;
- paid readiness or verification workflows;
- enterprise procurement and capacity coordination;
- premium placement or matching services where lawful.

### Klinikos Network

Primary buyers: clinics, healthcare networks, referral partners, workforce systems, institutional partners.

Jobs:
- maintain partner relationships;
- coordinate referrals and handoffs;
- track capacity and availability;
- preserve consent, purpose-of-use, minimum-necessary sharing, and human approval boundaries;
- retain relationships after initial discovery.

Revenue model:
- enterprise network subscriptions;
- coordination modules;
- advanced analytics and reporting;
- implementation and integration services.

### Klinikos EDU

Primary buyers: workforce boards, employers, health systems, schools, training organizations, professional associations, clinics.

Jobs:
- create programs, pathways, cohorts, sessions, instructors, and participants;
- deliver live instructor-led learning supported by software;
- simulate occupational work using synthetic data;
- generate learner evidence;
- support submissions, rubrics, pre/post knowledge checks, attendance, completion, and credentials;
- provide institutional reporting and continuous curriculum improvement.

Revenue model:
- implementation/customization;
- per participant/per completion;
- institutional license;
- instructor-led session/day fees;
- enterprise reporting and configuration;
- premium pathway or employer-specific content.

### Klinikos Intelligence

Zumi is a horizontal governed intelligence layer, not a separate chatbot product.

Role-aware modes include:
- owner/operator intelligence;
- front-desk intelligence;
- provider intelligence;
- billing/revenue intelligence;
- patient assistance within patient-scoped boundaries;
- Grid discovery and transaction assistance;
- EDU learner, instructor, and administrator assistance;
- enterprise analysis using permitted aggregate data.

Revenue model:
- premium AI tiers;
- included allowances plus customer-funded variable usage;
- enterprise intelligence packages.

Zumi never widens authorization, determines payment truth, establishes credential eligibility, releases clinical information, or overrides instructor/program authority.

### Klinikos Patient

Primary user: patient.

Jobs:
- see the next required action;
- access patient-scoped appointments, forms, balances, messages, and released records;
- maintain separation from staff/provider sessions;
- eventually participate in appropriately governed network and service workflows.

Revenue model:
- primarily supports clinic retention and platform value;
- permissible premium convenience or service revenue may be evaluated separately and must not distort patient access or clinical truth.

### Klinikos Enterprise

Primary buyers: multi-site organizations, workforce boards, networks, health systems, large employers, institutional partners.

Jobs:
- configure organizations, programs, roles, policies, entitlements, reporting, and integrations;
- view aggregate operational and workforce evidence;
- manage multi-organization relationships and deployment readiness;
- preserve deterministic policy and audit boundaries.

Revenue model:
- custom enterprise contracts;
- implementation;
- advanced reporting;
- integration/API packages;
- white-label/institutional configuration where appropriate.

## Shared Substrates

### Lifelong Identity and Relationship Graph

One person may hold multiple governed relationships over time: learner, employee, contractor, provider, patient, instructor, owner, organization member, network participant.

Identity continuity must not imply authorization continuity. Every role and resource relationship remains governed by explicit policy, tenant, consent, and context.

### Evidence Graph

Klinikos should converge toward a reusable evidence model answering:
- who acted;
- under what authority;
- on what object;
- when;
- with what source/input;
- what changed;
- who reviewed or approved it;
- what outcome followed.

Evidence supports clinical operations, EDU completion, Grid fulfillment, credential review, payment verification, audit, and institutional reporting without pretending those domains are identical.

### Policy and Authority Layer

Deterministic systems own:
- auth and sessions;
- tenant isolation;
- RBAC/resource authorization;
- consent/minimum necessary;
- credential and eligibility state;
- payment and settlement truth;
- clinical release;
- learner completion approval where required;
- transaction eligibility;
- sensitive-data egress.

AI may assist with interpretation and preparation but does not own these decisions.

## Compounding Flywheel

The target network effect is:

PATIENT / EMPLOYER / ORGANIZATION DEMAND
→ CLINIC OR WORKFORCE CAPACITY NEED
→ GRID DISCOVERY AND MATCHING
→ NETWORK RELATIONSHIP RETENTION
→ EDU BUILDS MISSING CAPABILITY
→ ZUMI SUPPORTS LEARNING AND WORK
→ CLINIC OS / WORKFORCE OPERATIONS EXECUTE
→ EVIDENCE CAPTURES OUTCOMES
→ BETTER MATCHING, TRAINING, AND OPERATIONS
→ MORE ORGANIZATIONS AND PARTICIPANTS
→ MORE LIQUIDITY AND CAPACITY

## Kentucky Workforce Configuration

The SCWDB bid should use the same underlying architecture through a Workforce configuration, not a fork.

### Workforce Home
Role-aware Living Home for participant, instructor, and administrator.

### Workforce EDU
Programs, pathways, cohorts, live sessions, scenarios, assessments, rubrics, attendance, completion, certificate/badge, and reporting.

### Workforce Intelligence
Zumi supports applied AI learning, instructor preparation, feedback drafting, and aggregate program interpretation while instructors and administrators retain authority.

### Workforce Grid
Future/optional bridge from training evidence to approved opportunities, employers, organizations, education, services, and capacity discovery.

### Workforce Network
SCWDB, workforce areas, employers, training partners, educational institutions, and other approved partners can be represented as governed relationships rather than disconnected contact lists.

### Workforce Evidence
Enrollment → session → attendance → activity/submission → assessment → instructor review → completion approval → credential → aggregate reporting.

## Website Narrative

Canonical positioning:

**Klinikos — The operating ecosystem for healthcare.**

Commercial message:

- Run your organization.
- Find what you need.
- Train your workforce.
- Coordinate your network.
- Serve your patients.
- Let Klinikos Intelligence connect the work.

The public Living Home remains conversation-first. It should route intent into Care, Grid, Network, EDU, Patient, or Enterprise without forcing visitors to understand the internal product taxonomy.

## Commercial Architecture

Klinikos should support multiple revenue engines without fragmenting product truth:

1. Clinic SaaS subscriptions.
2. Implementation and customization.
3. Zumi premium intelligence and metered usage.
4. Grid transaction/reservation/matching revenue where lawful.
5. EDU institutional and per-participant revenue.
6. Enterprise/network subscriptions.
7. Advanced reporting and analytics.
8. Verification/readiness support services.
9. Workforce and institutional contracts.
10. Integration/API and configuration services.

The core business metric should evolve from isolated subscription revenue toward expansion revenue per organization plus network liquidity and retained relationships.

## Configuration Principles

1. One core platform, many governed configurations.
2. No copy-pasted forks for Kentucky or vertical customers.
3. Shared primitives should be reused only where domain truth remains clear.
4. Every customer-facing claim must map to a current implementation status.
5. Manual-but-truthful beats fake automation.
6. AI never replaces deterministic authority boundaries.
7. Network effects must improve user value, not manufacture inventory or activity.
8. Evidence should be portable across reports but remain domain-specific in meaning.
9. Commercial packaging can differ while underlying identity, policy, audit, and evidence foundations remain shared.
10. Prioritize changes that unlock paid value, institutional proof, or compounding network effects.

## Delivery Sequence

### Phase 1: Canonical product and commercial configuration
Unify product naming, configuration registry, public narrative, institutional/workforce configuration, and shared evidence vocabulary.

### Phase 2: Workforce/Kentucky convergence
Make EDU institution-ready, expose role-aware workforce home, lock attendance/assessment/completion/reporting evidence, and prepare finalist demo flows.

### Phase 3: Grid × EDU bridge
Allow governed, opt-in movement from completed learning into approved opportunity/resource discovery without converting a certificate into employment eligibility.

### Phase 4: Enterprise/network operating layer
Add multi-organization program/network administration and aggregate reporting using existing tenant/relationship primitives.

### Phase 5: Evidence and intelligence compounding
Deepen cross-surface evidence references, aggregate outcome interpretation, and controlled Zumi assistance.

## Success Criteria

The architecture is successful when:

- a new buyer can understand Klinikos as one ecosystem in under one minute;
- Clinic OS, Grid, Network, EDU, Patient, and Zumi remain independently usable but visibly connected;
- the Kentucky workforce configuration reuses platform infrastructure rather than becoming a one-off branch;
- one organization can expand into additional Klinikos products without duplicate identity or commercial setup;
- evidence and relationship data become more valuable as the ecosystem grows;
- the product remains truthful about external dependencies, regulatory state, and production readiness;
- every major new feature strengthens at least one paid customer journey or network flywheel.