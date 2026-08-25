# Pharmacy, Medication & Remote Care Blueprint

Status: GOVERNING FUTURE DOMAIN BLUEPRINT
Phase: P3/P4

## Purpose

Own the medication and remote-observation workflow experience while keeping prescribing authority, pharmacy dispensing, authoritative drug information and medical-device truth in appropriate regulated/external systems.

## Personas

- provider
- nurse/clinical staff
- patient/proxy
- pharmacy operations
- care manager
- enterprise/payer operations

## Frontend surfaces

- medication list/reconciliation
- refill requests
- pharmacy selection
- formulary/benefit context where available
- prior authorization state
- e-prescribing handoff
- medication history
- interaction/safety alerts from authoritative source
- remote device readings
- trends
- review work
- patient device setup/status

## Domain authority

Care OS owns clinical medication decisions documented in the chart. Pharmacy/Medication OS owns workflow/orchestration state and adapter relationships. External e-prescribing/pharmacy/drug-information networks remain authoritative where required.

## Backend services

- MedicationReconciliationService
- MedicationWorkflowService
- RefillRequestService
- PharmacyDirectoryService
- FormularyBenefitService
- MedicationAuthorizationService
- EPrescribingAdapterService
- MedicationHistoryService
- DrugKnowledgeAdapter
- DeviceRegistryService
- ObservationIngestService
- ObservationValidationService
- RemoteReviewProjectionService
- DeviceAlertPolicyEngine

## Canonical data

MedicationRecord, MedicationReconciliation, RefillRequest, Pharmacy, FormularyEvidence, MedicationAuthorization, PrescriptionTransmissionReference, MedicationHistoryEvidence, Device, DeviceConnection, Observation, ObservationValidation, ReviewObligation.

## Medication workflow

`MEDICATION CONTEXT → RECONCILIATION → REQUEST/ORDER → AUTHORITATIVE PRESCRIBING RAIL → PHARMACY STATUS → FOLLOW-UP`

No direct AI prescribing.

## Remote-care workflow

`DEVICE → OBSERVATION → VALIDATION → RULE/THRESHOLD → REVIEW WORK → CLINICAL ACTION`

Potential device data:

- blood pressure
- glucose
- weight
- pulse oximetry
- heart rate
- selected wearables
- approved medical devices

Device data is not assumed clinically meaningful merely because it arrived.

## Commands

- reconcile medication
- request refill
- select pharmacy
- request benefit/formulary check
- prepare prior authorization
- invoke approved eRx rail
- connect/disconnect device
- ingest/validate observation
- acknowledge/review remote observation

## Events produced

MedicationReconciled, RefillRequested, MedicationAuthorizationRequired, PrescriptionPrepared, PrescriptionTransmitted, DeviceConnected, DeviceObservationReceived, DeviceObservationValidated, RemoteReviewRequired, RemoteReviewCompleted.

## Events consumed

Encounter/clinical decisions, payer benefit data, authorization state, patient communication preferences, device/vendor events.

## Zumi

May prepare medication reconciliation summaries, explain refill/authorization status, prepare operational steps and summarize remote trends. It must not prescribe, independently alter medication plans or convert raw device data into unsupported diagnoses.

Autonomy: L0-L3; L4 may apply to low-risk status polling/reminder/device ingestion after configuration.

## External adapters

- e-prescribing networks
- pharmacy directories
- PBM/formulary/benefit services
- drug knowledge services
- device vendor APIs
- remote monitoring gateways

## Safety

- alert fatigue control
- authoritative source/version for interactions
- provider review where required
- device identity/provenance
- data-quality flags
- units/reference ranges explicit
- no unsupported interpretation

## Privacy/security

Medication/device data is highly sensitive PHI. Apply tenant/patient authorization, minimum disclosure, encrypted transport/storage and careful logging/analytics.

## Economics

Supports Care/Enterprise subscriptions, Zumi automation and future remote-care programs. Do not create pharmacy/referral economics without legal/regulatory review.

## Tests

- prescribing authority separation
- refill workflow
- benefit/formulary provenance
- device observation units/provenance
- duplicate/out-of-order device events
- alert policy
- patient/provider access
- no AI medication authority

## Definition of done

Medication and remote-observation workflows can be coordinated from Klinikos while every regulated prescribing/dispensing/device authority remains explicit, evidence-backed and safely separated from AI orchestration.