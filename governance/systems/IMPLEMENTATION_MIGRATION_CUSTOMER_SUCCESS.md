# Implementation, Migration & Customer Success Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P2

## Purpose

Turn sales into repeatable activation, migration, first value, renewal and expansion without relying on founder memory or long manual email threads.

## Customer lifecycle

`SIGNED → IMPLEMENTING → CONFIGURING → MIGRATING → TRAINING → GO-LIVE READY → ACTIVATED → FIRST VALUE → REPEATED VALUE → EXPANSION → RENEWAL`

## Frontend surfaces

- implementation workspace
- onboarding checklist
- migration status
- integration setup
- staff/provider setup
- training progress
- go-live readiness
- first-value scorecard
- customer success health
- renewal/expansion plan
- support/escalation handoff

## Domain authority

This domain owns implementation/project state, migration job state, activation evidence, customer-success milestones and expansion recommendations. It does not own imported clinical/financial facts after they are accepted into source domains.

## Backend services

- ImplementationProjectService
- OnboardingChecklistService
- OrganizationSetupService
- MigrationJobService
- ImportMappingService
- ImportValidationService
- DuplicateDetectionService
- MigrationReconciliationService
- TrainingAssignmentService
- GoLiveReadinessService
- ActivationService
- FirstValueService
- CustomerHealthService
- RenewalService
- ExpansionRecommendationService

## Canonical data

ImplementationProject, OnboardingRequirement, MigrationSource, ImportJob, MappingRule, ValidationError, DuplicateCandidate, ReconciliationRecord, TrainingAssignment, GoLiveGate, ActivationEvidence, ValueEvent, CustomerHealthSignal, RenewalMilestone, ExpansionRecommendation.

## Organization onboarding

Support:

- organization
- locations
- departments/service lines where relevant
- providers/staff
- roles/assignments
- services
- operating hours
- specialties/configuration
- existing systems
- data-migration needs
- integration needs
- billing/commercial entitlements
- training

## Migration

Potential import classes:

- demographics/patients
- staff/providers
- documents
- appointments
- clinical history where supported/authorized
- forms/templates
- balances/billing references
- organization configuration

Migration flow:

`SOURCE INVENTORY → EXPORT/EXTRACT → MAP → DRY RUN → VALIDATE → DUPLICATE/CONFLICT REVIEW → IMPORT → RECONCILE → ACCEPT → AUDIT`

Never silently discard records that fail mapping/validation.

## Go-live gates

Examples:

- required organization/location setup complete
- required staff/provider accounts active
- access/authority reviewed
- critical templates/configuration ready
- required external connections truthfully configured
- migration reconciled
- training minimum complete
- payments/commercial entitlements verified
- critical security/support contacts defined
- backup/release/monitoring readiness for new production dependencies

## First value

Do not treat sign-up or login as first value.

First-value evidence might be:

- first Current Visit completed
- first unfinished-work item resolved
- first verified operational saving
- first revenue exception resolved
- first Grid fulfillment
- first EDU cohort completion

Depends on customer use case.

## Customer health

Signals may include:

- activation completeness
- workflow usage
- unresolved implementation blockers
- support severity
- repeated value events
- champion/admin engagement
- integration health
- billing/renewal state
- product mismatch

Avoid black-box churn scores without explainable evidence.

## Zumi

May guide onboarding, explain missing setup, prepare mappings/checklists, summarize project status, flag stalled activation and suggest evidence-based expansion. It may not silently accept ambiguous clinical imports or alter contract entitlements.

Autonomy: L0-L4 for low-risk deterministic setup/status work; imports with ambiguous/conflicting data require review.

## Commands

- create implementation project
- complete setup requirement
- configure mapping
- run dry import
- accept/reject duplicate/conflict
- execute approved import
- record training
- evaluate go-live
- activate customer
- record first value
- create expansion recommendation

## Events produced

ImplementationStarted, OnboardingRequirementCompleted, MigrationDryRunCompleted, MigrationConflictDetected, MigrationCompleted, TrainingCompleted, GoLiveReady, CustomerActivated, FirstValueRecorded, CustomerRiskRaised, ExpansionRecommended, RenewalDue.

## Events consumed

Contract/entitlement activation, domain product events, Integration Hub health, support incidents, billing state.

## Security/privacy

- migration files private and short-lived according to policy
- strict access
- audit imports
- no production PHI in ordinary support tickets/analytics
- migration tooling validates tenant/context

## Customer value

Reduces time-to-live, migration fear, implementation cost and abandonment.

## Klinikos economics

Implementation revenue, higher conversion, lower support cost, faster recurring activation, lower churn and expansion.

## Tests

- dry-run/no-write behavior
- import mapping/versioning
- duplicate/conflict review
- rollback/repair where supported
- tenant isolation
- activation gates
- first-value evidence
- expansion based on real state

## Definition of done

A new customer can move from authoritative commercial activation through configuration, migration, training and go-live with explicit gates, reconciled data and measurable first value rather than founder-managed improvisation.