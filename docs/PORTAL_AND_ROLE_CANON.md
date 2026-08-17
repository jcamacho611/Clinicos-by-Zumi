# KLINIKOS — PORTAL & ROLE CANON

Version: `2026-08-16.1`
Status: `AUTHORITATIVE SPECIALIST CANON`

## 1. Persistent identity, explicit context

One person may be a patient, student, provider, contractor, owner, educator, preceptor, organization user, or Grid participant over time or simultaneously.

Klinikos must not create a disconnected account for every lifecycle stage. It must also never blur active context, audience, tenant, or permission merely because one identity holds several roles.

## 2. Canonical role families

- platform/founder operator where explicitly authorized;
- organization owner and administrator;
- front desk/operations;
- provider and clinical staff;
- biller/coder/financial operations;
- case manager/quality/viewer;
- patient/client;
- Grid participant/resource owner/service provider;
- student/instructor/institution/preceptor.

Role labels are functional. Product copy and fixtures should use neutral role terminology rather than personal names.

## 3. Session and audience boundaries

- Patient authentication/session is separate from clinic staff session.
- A patient session cannot become a staff/provider session through a route or client flag.
- Organization/tenant context is server-owned.
- Switching role/context requires an authorized server decision.
- Founder/platform breadth does not widen access to tenant or patient data automatically.
- Protected return destinations must be same-origin and policy-allowed.

## 4. UI law

Navigation, rails, cards, counts, and actions adapt to active role/context and real state. A route existing in the application does not mean every role sees or can use it.

All consequential API/server actions repeat authorization. Client-side hiding is usability, not security.

## 5. Enrollment and readiness

Enrollment may collect role-specific information while reusing shared identity and organization primitives. Examples include:

- provider credentials, malpractice evidence where applicable, capabilities, availability, and service area;
- organization/facility identity, locations, policies, and capacity;
- seller/service/resource details and permitted use;
- student/instructor/institution relationships.

Submitted, reviewed, verified, approved, published, paused, expired, suspended, and revoked remain distinct. Internal human review must not be described as external primary-source verification.

## 6. Patient portal

The patient portal exposes only patient-owned or explicitly released information and actions. Patient-visible forms, appointments, balances, messages, consents, and records retain their own ownership/release rules.

## 7. Grid and EDU portals

Grid participants see opportunities, offers, bookings, capacity, required actions, earnings/obligations, and settlement state appropriate to role. EDU users see only course/scenario/grade/evidence state permitted by student, instructor, or institution context.

## 8. Acceptance

Representative role-routing, return-to, tenant isolation, patient/staff separation, and resource-level authorization must pass before a portal or role surface is considered connected.
