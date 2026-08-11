# KLINIKOS CONSTITUTION

Status: AUTHORITATIVE COMPANION TO `docs/CLINICOS_MASTER_CANON.md`
Date: 2026-08-11

This document does not replace the Master Canon. It operationalizes it.

If this document conflicts with `docs/CLINICOS_MASTER_CANON.md`, the Master Canon governs.

## Purpose

Klinikos is not a collection of portals or disconnected healthcare applications. It is a composable healthcare operating ecosystem whose products, marketplaces, workflows, networks, and user experiences are assembled from shared platform primitives.

The architecture must preserve a credible path from one user and one clinic to very large healthcare networks without requiring massive-scale infrastructure on day one.

## Constitutional laws

### 1. One universal identity
One human may simultaneously be a patient, clinician, student, contractor, employee, educator, administrator, owner, caregiver, guardian, or other legitimate participant. Do not create separate identity universes for each product.

### 2. One organization and relationship model
Clinics, medical spas, health networks, hospitals, universities, labs, imaging centers, pharmacies, insurers, service companies, public-health organizations, and future legitimate organization types must use a generalized organization model with typed relationships.

### 3. One authorization philosophy
Authentication establishes identity. Authorization determines who may do what to which resource, for what purpose, under which organization, based on which relationship, consent, credential, location, jurisdiction, sensitivity, and time limit.

Artificial Intelligence is never a superuser.

### 4. One event language
Meaningful domain changes become governed events. Domains communicate through permissioned events and contracts rather than unsafe direct coupling.

### 5. One workflow/automation philosophy
Events describe what happened. Workflows determine what should happen next. High-impact actions must preserve approvals, human checkpoints, retries, failure states, idempotency, and auditability.

### 6. One ledger truth
Payment processors move funds. Klinikos records the economic meaning of obligations, charges, fees, subscriptions, payouts, refunds, balances, disputes, and settlements in a provider-independent ledger.

### 7. One audit truth
Sensitive actions must be attributable to actor, identity, organization, role, policy, consent, credential, resource, timestamp, provider/system, and resulting state.

### 8. One status philosophy
The product must never fake completion. Status values describe reality, including pending, degraded, failed, revoked, delivered, settled, fulfilled, and verified states where appropriate.

### 9. One intelligence gateway
External Artificial Intelligence providers are interchangeable intelligence suppliers behind a governed Klinikos Intelligence layer. Klinikos owns context, permissions, tools, workflows, safety, audit, cost controls, and user experience.

### 10. One connector framework
External systems connect through reusable connector definitions, installations, authorization, credentials, capabilities, synchronization, webhook/event intake, normalization, retries, monitoring, revocation, and audit.

### 11. One generalized healthcare resource model
Grid is not merely a staffing marketplace. It is a healthcare resource exchange for matching legitimate demand with people, time, facilities, capacity, equipment, services, education placements, permitted inventory/resources, and future resource classes.

### 12. One design system and adaptive frontend
The frontend must not mirror backend complexity. Users experience one Klinikos environment that adapts to identity, organization, relationships, permissions, intent, and context.

### 13. Domain composability
Before creating a new platform primitive, ask whether the new use case can be expressed through existing identity, organizations, relationships, permissions, resources, demand, credentials, events, workflows, intelligence, payments, communications, integrations, data, and audit primitives.

### 14. No artificial scope ceiling
Current domains such as Clinic, Patient, Provider, Grid, Education, Network, Revenue Cycle, No-Fault, Workers' Compensation, Medical Spa, Home Health, Telehealth, Labs, Imaging, Pharmacy, Research, Public Health, Supply Chain, Credentialing, Referral, Care Coordination, Healthcare Business Services, and Procurement are examples of compositions, not the final boundary of Klinikos.

### 15. Build from one to massive scale by preserving contracts, not by overbuilding
Do not pretend code written today handles a billion users. Instead, identify what conceptual contracts and data boundaries must be correct now and which implementations can be replaced as scale grows.

### 16. Safety over automation
Patient safety, privacy, legal boundaries, scope of practice, credential eligibility, and human clinical judgment take precedence over convenience or automation.

### 17. Truth over appearance
Code existence does not prove a feature works. A test passing does not prove a business journey works. A saved credential does not prove an integration is connected. Checkout success does not prove settlement. A database state change does not prove an external communication was delivered.

### 18. Inspect before changing
Repository implementation claims must be backed by repository evidence. Preserve working code when possible. Use KEEP, HARDEN, REFACTOR, MOVE, SPLIT, MERGE, DEPRECATE, REPLACE, BUILD NEW, or DEFER decisions intentionally.

### 19. Security is cross-cutting
Identity, authorization, encryption, secrets, tenant isolation, monitoring, vulnerability management, backups, incident response, supply-chain security, rate limiting, and recovery requirements surround the whole platform.

### 20. Frontend simplicity is a backend requirement
The desired user experience is: tell Klinikos what you need, and Klinikos determines what can safely and legitimately be done and assembles the appropriate workflow, people, resources, information, services, and actions.

## Shared engine inventory

The platform should converge on a reusable set of engines and services:

1. Universal Identity
2. Organizations and Tenancy
3. Relationships and Memberships
4. Authorization and Policy
5. Consent and Delegation
6. Credentials and Eligibility
7. Events
8. Workflow and Automation
9. Klinikos Intelligence Gateway
10. Grid Matching / Resource Exchange
11. Integration Platform
12. Financial Ledger and Payments
13. Communications
14. Documents / Object Platform
15. Search and Discovery
16. Notifications
17. Audit and Provenance
18. Analytics and Operational Intelligence
19. Security and Governance
20. Configuration, Entitlements, and Feature Access
21. Observability and Reliability

These are not a permanent ceiling. New primitives should be introduced only when they are genuinely reusable across multiple domains and cannot be cleanly composed from existing ones.

## Core resource abstraction

Klinikos should be capable of representing:

- people
- organizations
- locations
- roles
- relationships
- resources
- demand
- services
- credentials
- availability
- appointments
- opportunities
- documents
- contracts
- payments
- claims
- education
- equipment
- inventory where appropriate
- events
- workflows

A future healthcare resource graph may be useful conceptually, but a graph database should not be introduced without a demonstrated query or scale requirement.

## Grid constitutional model

Grid may eventually orchestrate multi-party combinations such as:

- provider + shift
- provider + facility
- facility + available room
- clinic + qualified worker
- patient demand + provider availability
- provider + facility + patient demand
- university + student + preceptor + clinical site
- organization + specialist service
- provider + insurance/credentialing service
- unused healthcare capacity + legitimate demand

A Grid match must progress through truthful stages such as possible, eligibility-verified, approved, booked, fulfilled, cancelled, or failed. Marketplace discovery must never be treated as proof of legal or professional eligibility.

## Economic operating principle

Klinikos should continuously look for ways to:

- make money
- save money
- recover money
- save time
- reduce waste
- expose unused capacity
- create opportunity
- improve access
- improve safety
- improve coordination

The system should support revenue-producing vertical slices early without corrupting the long-term architecture.

## Cost-aware build law

Assume limited founder capital. Prefer existing infrastructure, free or inexpensive tiers where responsible, managed services that reduce operations burden, incremental implementation, and early revenue-producing capabilities. Do not trade away healthcare safety or foundational security merely to reduce cost.

## Mandatory specialist architecture set

Klinikos architectural work should be governed by specialist disciplines that all inherit this Constitution and the Master Canon:

- Backend / Core OS
- Frontend / Experience
- Database + Data Architecture
- API + Contract Architecture
- Event + Workflow Architecture
- AI / Intelligence Platform
- Integrations + Healthcare Interoperability
- Cybersecurity / Zero Trust
- Healthcare Compliance + Patient Safety
- Grid / Resource Exchange
- Payments + Financial OS
- Cloud + DevOps + Platform Engineering
- Testing + Verification + Reliability
- Observability + Operations
- Analytics + Intelligence / Data Platform
- Principal Architect / Master Integrator

Business and operating disciplines should also remain aligned:

- Product & Product Management
- Healthcare Operations
- Legal / Regulatory
- Clinical Governance
- Sales / Go-to-Market
- Pricing / Monetization
- Marketplace Operations
- University / Education Operations
- Customer Success / Implementation
- Finance / Accounting
- Insurance / Risk
- Enterprise Procurement
- Partnerships
- Competitive Intelligence
- Growth / Network Effects

## Handoff law

No specialist may redefine another specialist's canonical primitive silently.

Examples:

- Data Architecture owns canonical persistence models but cannot redefine authorization semantics.
- API Architecture exposes domain contracts but cannot bypass policy checks.
- Frontend may hide unavailable actions for usability but backend authorization remains authoritative.
- AI Architecture may interpret intent and propose actions but cannot grant access or commit high-risk actions outside governed workflows.
- Grid may discover matches but Credentials/Eligibility and Authorization determine whether they can proceed.
- Payments may move through external processors, but Financial OS owns ledger semantics.
- Integrations normalize vendor-specific data before core domains depend on it.
- Analytics consumes canonical operational/event data and must not become an alternate transactional source of truth.

## Acceptance philosophy

Major capabilities must be verified as complete journeys, for example:

IDENTITY → ORGANIZATION → AUTHORIZATION → ACTION → EVENT → WORKFLOW → EXTERNAL PROVIDER → CONFIRMED RESULT → AUDIT

and

RESOURCE LISTED → DEMAND CREATED → MATCH DISCOVERED → ELIGIBILITY VERIFIED → OFFER → ACCEPTANCE → AGREEMENT → PAYMENT → BOOKING → SERVICE → FULFILLMENT → PAYOUT → AUDIT

and

VERIFIED BUYER → CHECKOUT → SETTLED PAYMENT → ENTITLEMENT → PROVISIONING → IDENTITY → LOGIN → CORRECT ORGANIZATION → ONBOARDING → ACTIVE PRODUCT

## Final constitutional objective

Klinikos should make legitimate healthcare resources, relationships, workflows, and opportunities increasingly programmable and interoperable while making the human experience simpler.

The deterministic Klinikos backend remains authoritative.
Artificial Intelligence coordinates and assists.
Grid makes resources discoverable and connectable.
Events make the ecosystem responsive.
Authorization preserves boundaries.
Audit preserves truth.
The design system makes the ecosystem feel like one product.
