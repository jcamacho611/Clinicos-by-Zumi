# Klinikos orchestration engines

## Product truth

Klinikos is the product. Zumi is an embedded intelligence and orchestration layer inside Klinikos.

The backend north star is:

`Identity → Intent → Path → Next Action → Outcome`

Klinikos keeps domain backends modular while presenting a unified experience. Zumi may interpret intent and explain decisions, but deterministic application logic remains authoritative for authorization, eligibility, regulated actions, money movement, connector readiness, and data access.

## Shared orchestration fabric

The `src/lib/orchestration` package is the shared contract between Clinic, Grid, EDU, network, revenue, identity, connectors, and Zumi.

Current v1 engines:

- `contracts.ts` — common actor, context, intent, capability, policy, Path, Next Action, signal, event, blocker, and match contracts.
- `intent-engine.ts` — deterministic structured intent fallback and model-output validation boundary.
- `capability-engine.ts` — governed capability registry plus role/permission/connector/review policy evaluation.
- `path-engine.ts` — Path runtime resolution, progression, and persistence interface.
- `next-action-engine.ts` — cross-domain action ranking and Path action production.
- `blocker-engine.ts` — explainable blockers and safe fallback alternatives.
- `event-engine.ts` — domain event bus, event-to-signal conversion, and Moving-signal collapse.
- `matching-engine.ts` — generalized deterministic match ranking with hard required dimensions that cannot be outweighed by soft scores.

The existing Living Home Path lookup is wired through the structured intent engine so the first visible product surface now consumes the backend orchestration layer instead of maintaining a second keyword resolver.

## Existing engines reused rather than replaced

Klinikos already has major domain foundations that remain authoritative:

- session/auth/passkeys/MFA and organization/user models
- roles, permissions, workspace authorization, and tenant isolation
- providers, credentials, malpractice, privileges, and deterministic Grid eligibility
- Grid resources, availability, composition, requests, transactions, and payouts
- patient, encounter, referral, care handoff, health passport, intake passport, consent, and sharing models
- scheduling/capacity and clinic workspaces
- billing/claim foundations
- connector taxonomy/catalog and customer-funded access strategy
- Zumi provider-neutral gateway and self-hosted inference foundation
- audit and reliability primitives

The orchestration package connects these systems. It does not duplicate their authority.

## Backend engine map

The full architecture remains 45 logical engines. They are not 45 required microservices. Several are capabilities over shared models and services.

### Identity, safety, and policy

1. Identity & Account
2. Authorization / RBAC
3. Klinikos Passport / Profile
4. Credential & Verification
5. Capability Registry
6. Intent
7. Path
8. Path Persistence
9. Next Action
10. Eligibility / Policy
11. Blocker / Alternative
12. Event / State Transition
13. Signal
14. Notification
15. Activity / Timeline
16. Healthcare Relationship / Graph

### Care and network

17. Provider Network
18. Referral Relay
19. Patient Navigation
20. Scheduling / Capacity

### Grid and coordination economy

21. Resource
22. Demand / Need
23. Availability
24. Matching
25. Offer / Terms
26. Reservation / Booking
27. Transaction
28. Fulfillment
29. Financial Obligation
30. Payment
31. Payout
32. Revenue / Fee

### Clinic infrastructure

33. Billing / Claim
34. Document
35. Consent / Data Sharing
36. Integration / Connector
37. Connector Activation / Entitlement
38. Zumi Orchestration
39. Human Review
40. Audit
41. Reliability / Failure
42. Job / Queue / Workflow
43. Search / Command
44. Telemetry / Outcome
45. Time-to-Outcome

## Next durable-state work

The v1 orchestration package deliberately introduces persistence as an interface rather than silently inventing database rows. The next schema-backed slice should persist active Paths, event ledger entries, notifications, and timeline state using current actor/organization boundaries.

Durable Path storage must support:

- actor/user ownership
- optional organization context
- selected Path definition
- raw/structured intent
- goal
- status
- current node
- completed nodes
- blocked nodes and reasons
- timestamps
- auditable progression events

## Matching law

Matching follows this rule:

`Need + hard eligibility + availability + location + constraints → ranked eligible matches`

A soft score can never override a failed hard eligibility dimension. Existing Grid eligibility remains the regulated professional-work authority; the generalized matcher ranks only candidates that pass required rules.

## Failure law

A failed model or connector must not destroy the user's journey.

- Zumi unavailable → deterministic intents and direct pathways remain.
- Connector unavailable → preserve Path and expose approved manual fallback where one exists.
- Missing eligibility → explain every blocker instead of lowering a score.
- Human review required → stop consequential completion while preserving safe preparatory work.

## Merge gates

Every orchestration change must pass the repository Quality workflow:

1. dependency install
2. Prisma client generation
3. Prisma schema validation
4. TypeScript
5. lint
6. tests
7. production build

Do not merge failed orchestration work.
