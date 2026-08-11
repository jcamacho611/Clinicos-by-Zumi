# Klinikos Core Foundation Build

Status: ACTIVE FOUNDATION
Branch: `agent/klinikos-core-foundation`
Source of truth: `docs/CLINICOS_MASTER_CANON.md`

This build establishes the shared foundation required for Klinikos to operate as one ecosystem rather than a collection of clinic-first applications.

## Foundation order

1. Universal identity
2. Organization memberships
3. Multiple role assignments per membership
4. Context-aware authorization
5. Domain event backbone
6. User/organization Artificial Intelligence connections
7. Klinikos Intelligence Gateway
8. Intent routing
9. Shared payments, communications, integrations, and analytics
10. Specialized applications: Clinic, Patient, Provider, Grid, Education, Network, Partners

## Identity rule

A human identity is not a clinic user record. One identity may simultaneously participate as a patient, client, student, educator, provider, contractor, employee, owner, network participant, facility partner, or service partner.

Organization membership and role assignments determine what the identity may access in a particular context.

Existing clinic-bound `User` and patient `PortalAccount` structures are legacy-compatible records during migration and must not remain the long-term top-level identity architecture.

## Event rule

Cross-domain behavior must be expressed through permissioned domain events rather than hidden coupling between screens or direct unrestricted sharing of database objects.

Every event must declare whether it contains protected health information and must carry only the minimum information required for its intended consumers.

Examples:

- `appointment.cancelled`
- `shift.cancelled`
- `provider.available`
- `room.available`
- `patient.waitlisted`
- `payment.failed`
- `credential.expiring`
- `student.graduated`
- `claim.denied`

## Artificial Intelligence rule

The existing governed Zumi gateway is reusable infrastructure, but the platform architecture must become provider-agnostic and user/organization-connectable.

Klinikos owns workflows, permissions, context, tool access, healthcare rules, business rules, and auditability. Supported model providers supply intelligence through approved adapters.

Consumer subscriptions must never be assumed to pay for external Application Programming Interface usage.

## Migration safety

Do not remove working clinic functionality merely because the new architecture is broader.

Migration classifications are:

- KEEP
- REFACTOR
- MOVE
- SPLIT
- MERGE
- DEPRECATE
- BUILD NEW

Existing code continues to operate while shared platform foundations replace clinic-first assumptions incrementally.
