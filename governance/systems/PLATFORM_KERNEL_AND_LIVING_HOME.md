# Platform Kernel & Living Home Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0 foundation

## Purpose

Provide one shared identity/context/authorization/configuration/event/audit substrate and one role-aware operating front door without creating duplicate domain authority.

## Personas

All authenticated users: owners, administrators, front desk, MA/LPN/RN, providers, billers/coders, patients/proxies, professionals, learners/instructors and enterprise admins.

## Primary questions

- Owner: **What needs attention, where may money be stuck and where is capacity unused?**
- Provider: **What changed and what needs my decision?**
- Front desk: **Who is not ready?**
- Biller: **Where did legitimate payment stop?**
- Patient: **What do I need to do next?**
- Professional: **What am I eligible for?**
- Learner: **What should I complete next?**

## Frontend surfaces

- authenticated Living Home
- active organization/location context
- universal search
- global notifications
- global Zumi entry
- context switcher
- next-action lists
- system/integration health summaries where role permits

## Plain-language states

- Needs you
- Waiting
- Needs review
- Blocked
- Ready
- Done
- Connection unavailable
- Setup required

## Domain authority

Platform Kernel owns identity context, membership context, global authorization framework, shared configuration, audit/event primitives and cross-domain projections.

Living Home owns no clinical, claim, payment, Grid or EDU authority. It projects authoritative state.

## Backend services

- `IdentityService`
- `AccountService`
- `OrganizationContextService`
- `MembershipService`
- `AuthorizationEngine`
- `PurposeOfUseService`
- `ConfigurationService`
- `EntitlementService`
- `ObligationProjectionService`
- `NotificationService`
- `AuditService`
- `DomainEventService`
- `SearchService`
- `FeatureRegistry`
- `ExperimentRegistry`

Names are target architecture concepts; executors must reconcile current implementations before introducing new files/classes.

## Canonical data

Person, Account, Organization, Location, Department, Membership, Role, Profession, Capability, Credential, Privilege, Assignment, Delegation, Purpose, Consent, Configuration, Entitlement, ObligationProjection, AuditEvent, DomainEvent, Notification, Experiment.

## Obligation projection

Shared presentation shape should be derived from source domains and contain only minimum-necessary fields, conceptually:

- id
- sourceDomain
- sourceReference
- organization/location scope
- patient reference only where authorized
- owner/team
- plain-language title/reason
- state
- urgency
- dueAt
- safe actions
- evidence reference

Never duplicate underlying domain truth merely to populate Living Home.

## Commands

Examples:

- switch active context
- acknowledge notification
- request authorized action
- resolve/route a projected obligation through the source domain
- update allowed user preference

## Events consumed

All major domain lifecycle events needed to construct projections, including appointments, encounters, referrals, results, claims, payments, Grid, EDU and credential events.

## Events produced

ContextChanged, NotificationAcknowledged, ProjectionActionRequested, ConfigurationChanged, EntitlementChanged, AuditRecorded.

## Zumi

Zumi may read Living Home projections within authorization and route the user into source-domain actions. Zumi does not mutate projection state as a substitute for mutating the authoritative domain.

Autonomy: L0-L4 depending the specific source-domain tool; Living Home itself is primarily L0-L1 presentation.

## Permissions

Server-side resource authorization. A role label alone is not sufficient when patient, professional or enterprise context requires additional scope/relationship/purpose.

## Security

- no client-side authorization assumptions
- minimum DTO disclosure
- no cross-tenant search leakage
- no sensitive identifiers in public URLs
- no hidden-button security
- session/context changes audited where consequential

## Failure states

- organization unavailable
- membership inactive
- entitlement missing
- source domain degraded
- stale projection
- dependency unavailable

Living Home must show truthful degraded/partial states rather than silently omitting important work.

## Analytics

Measure time to first value, action completion, unresolved work age, role-specific surface engagement and Zumi value events without leaking PHI to inappropriate analytics.

## Customer value

Reduces navigation, duplicate checking, forgotten work and training complexity.

## Monetization

Foundation for all paid organizational plans; do not price Living Home as an isolated SKU.

## Tests

- tenant isolation
- role/context projection
- source-domain truth preservation
- stale/degraded state
- search authorization
- keyboard/mobile/accessibility
- no proprietary/sensitive over-disclosure in DTOs

## Definition of done

Each supported role can understand the most important next work from Living Home and take an authorized action that reaches the real source domain, persists correctly, audits appropriately and returns truthful status.
