# Klinikos Operating System Architecture

## Product law

Klinikos is an AI-native healthcare operating system and ecosystem. It is not merely an Electronic Medical Record (EMR), scheduling application, Customer Relationship Management (CRM) system, billing tool, provider marketplace, patient portal, or AI chatbot. Those are modules inside one shared operating platform.

## Shared core

Every Klinikos domain must reuse the same platform services instead of creating isolated substitutes.

1. Identity
2. Organizations and tenants
3. Locations and facilities
4. Users, roles, and permissions
5. Patient identity
6. Provider identity and credentialing
7. Event engine
8. Workflow engine
9. Task engine
10. Document service
11. Communications and notifications
12. Consent service
13. Audit service
14. Integration gateway
15. Financial ledger
16. Analytics and telemetry
17. Search
18. Klinikos Intelligence / Zumi gateway
19. Feature entitlements
20. Configuration
21. Security and compliance controls

## Domain modules

The shared core supports these bounded domains:

- Clinic Operations
- Patient / Client
- Scheduling and Capacity
- CRM / Growth
- Revenue Intelligence
- Clinical Workspace
- Billing and Insurance
- No-Fault
- Workers' Compensation
- Referral Network
- Results / Diagnostics
- Pharmacy / Prescribing
- Payments
- GRID marketplace
- Provider Trust / Credentialing
- EDU and Virtual Clinic Lab
- Network Command
- LifeChart / Care Constellation
- Operational Audit and Revenue Desk
- Sales, onboarding, and entitlements
- Digital front door

## Event-driven rule

Important business actions create immutable domain events. Events should not contain unnecessary Protected Health Information (PHI). Events trigger workflows, analytics, notifications, and AI recommendations.

Canonical examples:

- AppointmentScheduled
- AppointmentConfirmed
- AppointmentCanceled
- AppointmentNoShow
- LeadCreated
- LeadContacted
- LeadConverted
- FormRequested
- FormCompleted
- DocumentUploaded
- TaskCreated
- TaskCompleted
- ReferralCreated
- ReferralCompleted
- ResultReceived
- ResultReviewed
- EncounterSigned
- BillingPacketReady
- EligibilityChecked
- ClaimSubmitted
- ClaimAccepted
- ClaimRejected
- ClaimPaid
- PaymentReceived
- ProviderCredentialExpiring
- ProviderCredentialVerified
- CapacityPublished
- GRIDBookingRequested
- GRIDBookingAccepted
- CourseCompleted

Each event must carry a stable event ID, event type and version, occurred-at time, tenant scope, actor where applicable, subject/resource identifiers, correlation ID, causation ID, payload, and metadata.

## Workflow rule

Do not hard-code every clinic workflow into page components. Workflows must become configurable definitions with:

- trigger
- conditions
- actions
- human approvals
- timeouts
- escalations
- retry behavior
- audit requirements

## Klinikos Intelligence / Zumi rule

Zumi is the intelligence layer across Klinikos. It may summarize, classify, prioritize, detect operational anomalies, recommend actions, generate drafts, identify revenue opportunities, explain dashboards, retrieve authorized information, and prepare permitted workflows.

Zumi must not autonomously perform consequential clinical, legal, permission, or high-risk financial actions. Human authorization gates remain mandatory for sensitive actions.

## Integration rule

Klinikos owns the canonical internal model and uses adapters for external systems. External integrations may use FHIR, HL7 v2, X12 EDI, REST APIs, webhooks, SFTP/file exchange, OAuth, SMART on FHIR, or vendor-specific protocols. No vendor's proprietary schema becomes the Klinikos core model.

## Commercial vertical slice

Before attempting to replace a clinic's existing EHR, the first commercial operating slice must prove measurable financial value.

Import or connect:

- appointments
- leads
- patients/clients
- staff ownership
- communication outcomes

Detect:

- missed leads
- unbooked consultations
- cancellations
- no-shows
- patients due for rebooking
- unfinished follow-ups

Create:

- action queues
- responsible owner
- due time
- supporting evidence
- measurable opportunity value

Measure:

- opportunities identified
- contacts attempted
- appointments recovered
- revenue recovered
- conversion rates
- response times

This is the core proof loop: **Klinikos identified $X -> staff acted on $Y -> clinic recovered $Z.**

## Build order

### Phase 0 — protect and stabilize
Repository ownership, branch protection, secrets, backups, architecture docs, synthetic demo data, tests.

### Phase 1 — revenue and operations
Owner command center, patient registry, scheduling, tasks, follow-up, CRM, Revenue Desk, communications, Operational Audit, revenue recovery.

### Phase 2 — production foundation
Multi-tenancy hardening, permissions, audit, secure documents, consent, observability, backups, onboarding, entitlements, compliance controls.

### Phase 3 — financial interoperability
Eligibility, billing readiness, claims adapters, clearinghouse, remittance, denials, balances, payments.

### Phase 4 — clinical interoperability
FHIR gateway, EHR connectors, labs, imaging, results, referrals, prescribing partner.

### Phase 5 — GRID
Provider identity, credentialing, availability, facility capacity, matching, booking, payouts, trust.

### Phase 6 — EDU
Courses, competency, Virtual Clinic Lab, credentials, transition into GRID.

### Phase 7 — network intelligence
Network Command, benchmarking, LifeChart, Care Constellation, multi-organization intelligence.

## Development discipline

Do not rebuild working functionality merely to make the architecture prettier. Inspect, document, test, stabilize, refactor, then extend. Prefer a modular monolith until independently scalable services are operationally justified.

Never represent mocks as live integrations. Never claim regulatory certification not actually obtained. Never permit AI-generated content to silently overwrite authoritative records. Never bypass server-side authorization because a UI element is hidden. Never place secrets in source control.
