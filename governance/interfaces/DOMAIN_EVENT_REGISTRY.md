# KLINIKOS Domain Event Registry

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Define canonical business events so domains communicate through explicit evidence rather than hidden cross-module writes. Existing code/events remain implementation truth until migrated; this registry defines target semantics.

## Event contract requirements

Every durable/consequential event should include appropriate:

- eventId
- eventType/version
- occurredAt
- recordedAt
- tenant/organization scope
- location scope where relevant
- actor/system source
- subject/object references
- causationId
- correlationId
- provenance/evidence reference
- sensitivity classification
- idempotency identity where applicable

Do not place full PHI payloads in generic event logs when references/minimum data are sufficient.

## Platform / identity

- `AccountCreated`
- `AccountVerified`
- `OrganizationCreated`
- `OrganizationActivated`
- `MembershipInvited`
- `MembershipActivated`
- `MembershipEnded`
- `ActiveContextChanged`
- `EntitlementChanged`
- `ConfigurationChanged`
- `AccessReviewRequired`
- `AccessReviewCompleted`

## Credential / trust

- `ProfessionalProfileUpdated`
- `CredentialSubmitted`
- `CredentialVerified`
- `CredentialRejected`
- `CredentialExpired`
- `PrivilegeGranted`
- `PrivilegeRevoked`
- `AssignmentActivated`
- `AssignmentEnded`
- `DelegationCreated`
- `DelegationEnded`
- `ExclusionFlagRaised`

## Scheduling / readiness

- `AppointmentScheduled`
- `AppointmentRescheduled`
- `AppointmentCancelled`
- `AppointmentCheckedIn`
- `AppointmentCompleted`
- `IntakeRequired`
- `IntakeCompleted`
- `ReadinessIssueDetected`
- `AppointmentReady`

## Clinical

- `EncounterStarted`
- `ClinicalEvidenceRecorded`
- `ClinicalEvidenceCorrected`
- `ClinicalChangeDerived`
- `BodyMapVersionRecorded`
- `StaffHandoffRecorded`
- `ProcedurePerformed`
- `NoteSigned`
- `NoteAmended`
- `EncounterClosed`

## Orders / results / referrals

- `OrderPlaced`
- `OrderTransmitted`
- `OrderAccepted`
- `ResultReceived`
- `ResultCorrected`
- `CriticalResultDetected`
- `ResultReviewed`
- `ResultReleasedToPatient`
- `ReferralCreated`
- `ReferralSent`
- `ReferralReceived`
- `ReferralScheduled`
- `ReferralVisitCompleted`
- `ReferralReportReceived`
- `ReferralReviewed`
- `ReferralClosed`

## Insurance / authorization

- `CoverageUpdated`
- `EligibilityRequested`
- `EligibilityChecked`
- `EligibilityUnresolved`
- `AuthorizationRequired`
- `AuthorizationPrepared`
- `AuthorizationSubmitted`
- `AuthorizationApproved`
- `AuthorizationDenied`
- `AuthorizationExpired`
- `AuthorizationAppealPrepared`
- `AuthorizationAppealSubmitted`

## Coding / revenue / claims

- `CodingReviewRequired`
- `CodingReviewed`
- `ChargeExpected`
- `ChargeRecorded`
- `ClaimReadinessChanged`
- `ClaimReady`
- `ClaimSubmitted`
- `ClaimAcknowledged`
- `ClaimRejected`
- `ClaimAccepted`
- `ClaimAdjudicated`
- `DenialCreated`
- `AppealPrepared`
- `AppealSubmitted`
- `RemittanceReceived`
- `PaymentPostingCreated`
- `RevenueExceptionCreated`
- `RevenueExceptionResolved`
- `RevenueReconciled`

## Financial

- `OfferSelected`
- `QuoteIssued`
- `CheckoutStarted`
- `PaymentPending`
- `PaymentVerified`
- `PaymentFailed`
- `SubscriptionActivated`
- `SubscriptionPastDue`
- `SubscriptionCancelled`
- `InvoiceIssued`
- `InvoicePaid`
- `EntitlementGranted`
- `EntitlementRevoked`
- `RefundIssued`
- `DisputeOpened`
- `DisputeResolved`
- `PayableCreated`
- `PayoutSent`
- `SettlementRecorded`
- `FinancialReconciliationRequired`
- `FinancialReconciled`

## Communications / CRM

- `LeadCreated`
- `LeadQualified`
- `LeadStageChanged`
- `MissedCallDetected`
- `CallbackRequired`
- `MessageQueued`
- `MessageSent`
- `MessageDelivered`
- `MessageFailed`
- `CommunicationSuppressed`
- `AppointmentReminderSent`
- `CampaignStarted`
- `CampaignCompleted`

## Grid

- `GridDemandCreated`
- `GridDemandClosed`
- `GridResourcePublished`
- `GridResourceUnavailable`
- `GridEligibilityEvaluated`
- `GridCandidatesGenerated`
- `GridOfferCreated`
- `GridOfferAccepted`
- `GridReservationCreated`
- `GridReservationCancelled`
- `GridFulfillmentStarted`
- `GridFulfillmentCompleted`
- `GridDisputeOpened`
- `GridDisputeResolved`
- `GridRelationshipSuggested`

## Network

- `NetworkInvitationCreated`
- `NetworkInvitationAccepted`
- `NetworkRelationshipCreated`
- `NetworkRelationshipUpdated`
- `NetworkRelationshipSuspended`
- `PreferredPartnerChanged`
- `RepeatInteractionRequested`

## EDU

- `EduEnrollmentCreated`
- `EduSessionStarted`
- `EduAttendanceRecorded`
- `EduAssessmentSubmitted`
- `EduAssessmentReviewed`
- `EduCompletionRecorded`
- `CertificateIssued`
- `WorkforceEvidenceRecorded`
- `EduGridOptInRecorded`

## Patient

- `PatientIntakeUpdated`
- `ConsentGranted`
- `ConsentRevoked`
- `ProxyGranted`
- `ProxyRevoked`
- `RecordRequested`
- `PatientActionCompleted`

## Diagnostic / medication / devices

- `DiagnosticOrderTransmitted`
- `DiagnosticScheduled`
- `DiagnosticPerformed`
- `DiagnosticResultReceived`
- `DiagnosticResultCorrected`
- `DiagnosticResultReviewed`
- `MedicationReconciled`
- `RefillRequested`
- `MedicationAuthorizationRequired`
- `PrescriptionPrepared`
- `PrescriptionTransmitted`
- `DeviceConnected`
- `DeviceObservationReceived`
- `DeviceObservationValidated`
- `RemoteReviewRequired`
- `RemoteReviewCompleted`

## Digital business / implementation

- `OperatingMapStarted`
- `OperatingMapCompleted`
- `ProspectQualified`
- `ProposalPrepared`
- `ProposalSent`
- `CommercialAgreementActivated`
- `ImplementationStarted`
- `OnboardingRequirementCompleted`
- `MigrationDryRunCompleted`
- `MigrationConflictDetected`
- `MigrationCompleted`
- `GoLiveReady`
- `CustomerActivated`
- `FirstValueRecorded`
- `CustomerRiskRaised`
- `ExpansionRecommended`
- `RenewalDue`

## Enterprise / payer / assurance

- `EnterpriseHierarchyChanged`
- `EnterprisePolicyChanged`
- `DelegatedAdminChanged`
- `SSOConfigured`
- `ContractEntitlementChanged`
- `PopulationAttributed`
- `CareGapDetected`
- `CareGapClosed`
- `QualityMeasureUpdated`
- `ProviderReadinessChanged`
- `PerformancePeriodClosed`
- `ControlEvidenceAdded`
- `ControlEvidenceExpired`
- `RiskOpened`
- `RiskMitigated`
- `VendorRiskChanged`
- `AssuranceGapDetected`

## Zumi orchestration

- `ZumiIntentResolved`
- `ZumiActionPrepared`
- `ZumiApprovalRequested`
- `ZumiToolExecuted`
- `ZumiActionFailed`
- `ZumiValueEventRecorded`

## Event rules

1. Events describe something that happened, not an unverified prediction.
2. Derived events identify their derivation/evidence source.
3. Consumers must be idempotent for retried events.
4. Event versions are explicit when payload semantics change.
5. Event handling failure creates observable retry/reconciliation state.
6. Events do not silently grant permission or entitlement.
7. Analytics events are not clinical/financial authority.
