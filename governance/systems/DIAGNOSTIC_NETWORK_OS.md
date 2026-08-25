# Diagnostic Network OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P1/P2/P3

## Purpose

Own the clinic-facing workflow for laboratory, imaging and specialty diagnostics while keeping external diagnostic organizations authoritative for performance/results and allowing capacity to connect into Grid/Network later.

## Required direct professional coverage

The professional feedback specifically requires laboratory and radiology/imaging workflows, specialty result/impression capture, consultation reports and EMG/neurodiagnostic results without forcing providers to chase disconnected systems.

## Diagnostic classes

- laboratory
- MRI
- CT
- X-ray
- ultrasound
- other imaging modalities
- EMG/neurodiagnostic testing
- specialty diagnostic procedures
- consultation reports

## Core lifecycle

`ORDERED → AUTHORIZATION/READINESS → TRANSMITTED → ACCEPTED → SCHEDULED/ACCESSIONED → PERFORMED/COLLECTED → RESULTED → PROVIDER REVIEWED → PATIENT INFORMED → FOLLOW-UP → FINANCIAL RECONCILIATION → CLOSED`

## Frontend surfaces

- Current Visit order entry
- patient chart diagnostics timeline
- results inbox
- critical/abnormal review
- imaging report/impression
- consultation/EMG report
- diagnostic scheduling/readiness
- external connection status
- patient-released result projection

## Domain authority

Care OS owns orders and clinical review state. Diagnostic Network orchestrates adapters, diagnostic facility/resource metadata, status and capacity projections. External lab/imaging/diagnostic provider owns its result/report.

## Backend services

- DiagnosticOrderRoutingService
- LabCatalogAdapter
- LabResultMappingService
- ImagingOrderRoutingService
- ImagingReportService
- DiagnosticFacilityDirectory
- DiagnosticStatusService
- CriticalResultPolicyService
- DiagnosticReconciliationService
- DiagnosticCapacityProjectionService

## Canonical data

Order, DiagnosticFacility, DiagnosticCapability, ExternalAccession/StudyReference, Result, ResultVersion, Report, Impression, CriticalFlag, ProviderReview, PatientRelease, FollowUpObligation, DiagnosticCapacity.

## Standards/adapters

Architect for appropriate combinations of:

- FHIR
- HL7 v2
- LOINC
- DICOM
- DICOMweb
- PACS
- vendor APIs

Named vendors/facilities such as Quest, Labcorp, BioReference, radiology groups or health-system diagnostics must remain `planned/adapter-ready/sandbox/live` according to actual evidence, never assumed production-live.

## Result integrity

- preserve source/provenance
- preserve corrected/amended versions
- distinguish preliminary/final/corrected
- critical-result workflow
- provider review separate from result receipt
- patient release separate from provider review

## Commands

- place diagnostic order
- transmit through adapter
- reconcile external status
- receive/map result
- acknowledge critical result
- record provider review
- release result when authorized
- create follow-up
- publish appropriate available capacity to Grid only with authorized organization configuration

## Events produced

DiagnosticOrderTransmitted, DiagnosticOrderAccepted, DiagnosticScheduled, DiagnosticPerformed, DiagnosticResultReceived, DiagnosticResultCorrected, CriticalResultDetected, DiagnosticResultReviewed, DiagnosticResultReleased, DiagnosticFollowUpRequired, DiagnosticCapacityAvailable.

## Events consumed

Care orders, authorization state, Integration Hub responses, Grid/Network configuration, patient release preferences/consent, financial reconciliation state.

## Zumi

May summarize results for clinician review from source evidence, identify missing/changed reports, prepare follow-up and explain status. It must not independently interpret diagnostic findings into a diagnosis or mark provider review complete.

Autonomy: L0-L3; status polling/routing may be L4 when explicitly authorized.

## Grid/Network opportunity

Appropriate diagnostic capacity can eventually become Grid supply. Referral/order demand can discover eligible diagnostic capacity. Successful organizational relationships can become Network edges. Legal/clinical/payer rules precede marketplace economics.

## Security/privacy

High-PHI domain. Minimize payloads/logs, enforce patient/organization authorization, encrypt transport/storage and audit consequential review/release.

## Customer value

Reduces chasing reports, duplicate portal work and lost follow-up; improves order-to-result closure.

## Monetization

Care/Enterprise subscription, integration/connectivity, diagnostic-capacity network products where lawful. Avoid prohibited referral-fee models.

## Tests

- order/result correlation
- corrected-result versioning
- critical-result workflow
- provider-review separation
- patient-release separation
- unknown-code reconciliation
- duplicate/out-of-order interface events
- Grid capacity privacy/eligibility

## Definition of done

A provider can order and follow a diagnostic workflow inside Klinikos from Current Visit through authoritative result, review, patient communication and follow-up, with honest external connection state and no manual portal-chasing where a verified integration exists.