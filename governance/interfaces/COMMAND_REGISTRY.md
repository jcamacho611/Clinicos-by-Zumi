# KLINIKOS Command Registry

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Define the types of consequential commands implementation agents should route through owning domains rather than perform through ad-hoc cross-module database writes.

## Command contract

Every consequential command should define:

- command ID/name/version
- owning domain
- actor/context
- required authorization
- input schema
- idempotency key where needed
- validation
- expected domain events
- failure/reconciliation behavior
- audit requirement
- Zumi autonomy ceiling

## Platform / identity

- ActivateOrganizationContext
- InviteMembership
- AcceptMembership
- EndMembership
- GrantPrivilege
- RevokePrivilege
- AssignProfessional
- EndAssignment
- CreateDelegation
- EndDelegation
- SubmitCredentialEvidence
- RequestCredentialVerification
- ChangeConfiguration
- GrantEntitlementFromAuthority
- RevokeEntitlementFromAuthority

## Care

- ScheduleAppointment
- RescheduleAppointment
- CancelAppointment
- RecordStaffHandoff
- StartEncounter
- RecordClinicalEvidence
- RecordBodyMapVersion
- RecordProcedure
- PlaceOrder
- ReviewResult
- CreateReferral
- AdvanceReferral
- SignNote
- AddNoteAddendum
- CloseEncounter

## Patient

- UpdateReusableIntake
- GrantConsent
- RevokeConsent
- GrantProxyAccess
- RevokeProxyAccess
- RequestRecordRelease
- CompletePatientAction

## Revenue

- RequestEligibility
- PrepareAuthorization
- SubmitAuthorization
- ReviewCoding
- CreateChargeExpectation
- CreateClaim
- ValidateClaim
- SubmitClaim
- CorrectRejectedClaim
- PrepareAppeal
- SubmitAppeal
- PostRemittance
- ResolveRevenueException

## Financial

- CreateQuote
- CreateOrder
- CreateCheckoutIntent
- ReconcilePaymentEvidence
- ActivateSubscriptionFromEvidence
- IssueInvoice
- IssueRefund
- RecordDispute
- RecordPayable
- RecordPayout
- ReconcileFinancialState

## Communications / CRM

- CreateLead
- QualifyLead
- ChangeLeadStageFromEvidence
- SendCommunication
- ScheduleCallback
- SuppressDestination
- StartCampaign
- TransferCall

## Grid

- CreateGridDemand
- PublishGridResource
- UpdateGridAvailability
- EvaluateGridEligibility
- CreateGridOffer
- AcceptGridOffer
- CreateGridReservation
- CancelGridReservation
- StartGridFulfillment
- CompleteGridFulfillment
- OpenGridDispute
- ResolveGridDispute

## Network

- InviteNetworkRelationship
- AcceptNetworkRelationship
- UpdateNetworkPurpose
- MarkPreferredPartner
- SuspendNetworkRelationship

## EDU

- CreateProgram
- CreateCohort
- EnrollLearner
- AssignInstructor
- LaunchScenario
- SubmitAssessment
- ReviewAssessment
- RecordAttendance
- RecordCompletion
- IssueCertificate
- OptIntoGrid

## Digital business / implementation

- StartOperatingMap
- CompleteOperatingMap
- QualifyProspect
- SelectApprovedOffer
- PrepareProposal
- SendApprovedProposal
- StartImplementation
- CompleteOnboardingRequirement
- RunMigrationDryRun
- ApproveMigrationConflictResolution
- ExecuteApprovedMigration
- MarkGoLiveReady
- ActivateCustomer
- RecordFirstValue
- CreateExpansionRecommendation

## Enterprise / payer

- UpdateEnterpriseHierarchy
- ConfigureEnterprisePolicy
- ConfigureIdentityProvider
- DelegateEnterpriseAdmin
- StartAccessReview
- CompleteAccessReview
- ConfigurePayerContract
- UpdateAttribution
- EvaluateCareGap
- CompleteCareGapAction
- ClosePerformancePeriod

## Integration

- ConfigureConnection
- ValidateConnection
- TransmitIntegrationMessage
- RetryIntegrationMessage
- ReconcileIntegrationExchange
- DisableConnection

## Zumi command law

Zumi does not receive a magical `WriteAnything` command. Every tool maps to one or more explicit domain commands and inherits that command's authorization/autonomy rules.

## Command anti-patterns

Reject designs that:

- update another domain's tables directly
- infer permission from client state
- infer payment from redirect
- silently retry a non-idempotent financial/clinical action
- let AI choose an unrestricted command payload without validation
- omit audit/reconciliation for consequential state
