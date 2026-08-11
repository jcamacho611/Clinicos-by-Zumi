# Klinikos Operating System Architecture

## Product law

Klinikos is an AI-native healthcare operating system and ecosystem. It is not merely an Electronic Medical Record (EMR), scheduling application, Customer Relationship Management (CRM) system, billing tool, provider marketplace, patient portal, or AI chatbot. Those are modules inside one shared operating platform.

## User-facing language law

All technical architecture described in this document is **backend-only implementation language** unless a specific term is medically or operationally useful to the person using Klinikos.

Do not expose engineering terms in normal clinic, patient, provider, owner, student, educator, or marketplace screens.

Never show users internal terms such as:

- event engine
- workflow engine
- tenant
- schema
- queue processor
- orchestration
- correlation ID
- causation ID
- API gateway
- adapter
- webhook
- service bus
- canonical model
- background job

Use plain healthcare, business, or medical language instead.

Examples:

- `AppointmentCanceled` becomes **Appointment canceled**.
- A revenue-recovery workflow becomes **This appointment may be recoverable** or **Patient needs rebooking**.
- A provider-credential event becomes **License expires in 30 days**.
- A failed billing integration becomes **Claim could not be sent**.
- A task queue becomes **Needs attention** or **Follow-up needed**.
- A workflow owner becomes **Assigned to**.
- An approval gate becomes **Provider review required** or **Owner approval required**.

The interface should answer in simple terms:

1. What happened?
2. What needs attention?
3. Why does it matter?
4. Who needs to handle it?
5. When is it due?
6. What can the user do next?

Medical terms are allowed when they are the natural language of the role using the system. Computer-engineering jargon is not.

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

These names describe internal system responsibilities. They are not navigation labels by default.

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

Important business actions create immutable domain events in the backend. Events should not contain unnecessary Protected Health Information (PHI). Events trigger workflows, analytics, notifications, and AI recommendations.

These internal event names must never be surfaced directly in normal user-facing copy.

Canonical internal examples:

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

Each event must carry the technical identifiers needed for safe backend processing, but those identifiers remain hidden from normal users.

## Workflow rule

Do not hard-code every clinic workflow into page components. Workflows must become configurable definitions in the backend with triggers, conditions, actions, human approvals, timeouts, escalations, retry behavior, and audit requirements.

User-facing screens should describe only the actual healthcare or business action, such as **Call patient**, **Review result**, **Complete claim documentation**, **Confirm appointment**, or **Approve provider**.

## Klinikos Intelligence / Zumi rule

Zumi is the intelligence layer across Klinikos. It may summarize, classify, prioritize, detect operational anomalies, recommend actions, generate drafts, identify revenue opportunities, explain dashboards, retrieve authorized information, and prepare permitted workflows.

Zumi must not autonomously perform consequential clinical, legal, permission, or high-risk financial actions. Human authorization gates remain mandatory for sensitive actions.

Zumi should speak like a knowledgeable healthcare operations assistant, not a software engineer.

Good examples:

- **Three patients need follow-up today.**
- **Two claims are missing documentation.**
- **Dr. Rivera has four open appointment slots tomorrow.**
- **A provider's malpractice policy expires next month.**
- **Approximately $2,400 in appointments may be recoverable.**

Avoid user-facing phrases such as **workflow triggered**, **event emitted**, **adapter failed**, **tenant mismatch**, or **queue processing**.

## Integration rule

Klinikos owns the internal data structure and connects to outside healthcare systems in the backend. The technical methods used for those connections remain implementation details unless an administrator specifically needs them for setup.

## Commercial vertical slice

Before attempting to replace a clinic's existing EHR, the first commercial operating slice must prove measurable financial value.

Import or connect appointments, leads, patients/clients, staff ownership, and communication outcomes.

Detect missed leads, unbooked consultations, cancellations, no-shows, patients due for rebooking, and unfinished follow-ups.

Create simple staff-facing actions showing the responsible person, due time, reason, and estimated opportunity value.

Measure opportunities identified, contacts attempted, appointments recovered, revenue recovered, conversion rates, and response times.

The user-facing proof should be simple: **Klinikos found the opportunity, the clinic acted, and revenue was recovered.**

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

All technical complexity should stay behind the scenes unless an administrator explicitly opens a technical configuration or diagnostics area.