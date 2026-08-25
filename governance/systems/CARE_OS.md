# Care OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P1

## Purpose

Provide the clinical and practice-operating core through one continuous patient/encounter experience while preserving professional authority, longitudinal evidence and downstream operational/revenue continuity.

## Personas

- physician/APP provider
- RN
- LPN
- MA
- front desk
- coder/biller
- clinical administrator
- patient/proxy through Patient OS projection

## Primary provider question

> **What changed, what matters, and what do I need to decide?**

## Required subsystems

1. Patient Chart
2. Current Visit
3. Clinical Change
4. BodyMap
5. Staff Handoff
6. Scheduling
7. Orders
8. Results
9. Referrals
10. Telemedicine
11. Documents
12. Forms
13. Consents
14. Procedures
15. Signatures/Addenda
16. Specialty Packs
17. No-Fault / Workers' Compensation
18. Episode / case context

## Current Visit

Preserve the existing encounter authority. Do not create a parallel editor.

Required narrative:

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → CLOSE VISIT`

### Patient Snapshot

Authorized projection may include:

- demographics
- patient photo/identity context
- emergency/next-of-kin
- active coverage/case
- allergies
- medications
- problem list
- relevant histories
- key alerts
- recent relevant results
- active referrals/orders
- consent/authorization context

### What Changed

Structured `INITIAL → PREVIOUS → TODAY` where evidence exists.

Dimensions may include symptoms, pain, body region/laterality, function/ADLs, ROM, exam findings, work status, medications, treatment, procedures, labs, imaging, new/unresolved findings.

Absence of evidence is not resolution.

### Staff Handoff

Capture appropriate pre-provider work without treating MA/LPN/RN roles as interchangeable authority.

Potential fields:

- reason for visit
- interval change
- vitals
- medication/allergy reconciliation
- screenings
- forms
- body-map delta
- delegated work
- unresolved questions
- readiness

### Close Visit

Closing the note does not silently close downstream obligations. Surface unsigned documentation, unresolved orders/results/referrals, coding blockers, follow-up and other legitimate next work.

## Source-locked professional requirements

Care OS must retain traceability for:

- demographics
- updated patient photo
- driver's-license/passport identity documents where appropriate
- emergency contact / next of kin
- family/relationship links
- HIPAA authorization state
- advance-care-planning state
- immunization state
- chief complaint
- HPI / interval history
- ROS
- vitals
- detailed physical exam
- medical/surgical/family/social histories
- medications/allergies/problems
- body diagrams
- baseline vs previous vs today
- function/ADLs
- diagnoses/procedures
- ICD/CPT/HCPCS/modifiers through governed coding support
- assessment/plan
- procedure notes
- AI dictation/scribe
- tele-visit
- MA/LPN/RN intake/handoff
- specialty templates/components
- pain/PT/orthopedics/psychiatry/EMG and other configured specialties
- cross-specialty consultation reports
- labs/imaging
- procedures/injections/shockwave/Botox where clinically/configurationally appropriate
- No-Fault and Workers' Compensation context
- provider signature
- note locking
- addenda
- audit history
- billing readiness

## No-Fault / Workers' Compensation

Use shared clinical primitives plus case configuration.

Potential case data:

- accident/injury date
- mechanism
- carrier
- claim
- adjuster
- attorney
- assignment-of-benefits status
- authorization
- IME
- denial/appeal
- deadlines
- initial injury baseline
- body regions/laterality
- hospital/surgery history
- work status
- function/ADLs
- treatment progression
- therapy
- imaging
- EMG
- procedures
- coding/billing relationship

Do not turn Current Visit into an administrative wall; surface only relevant case context.

## Orders/results/referrals

Universal order categories may include lab, imaging, medication, therapy, consultation, procedure and diagnostic test.

Lifecycle:

`ORDERED → TRANSMITTED → ACCEPTED → SCHEDULED/ACCESSIONED → PERFORMED → RESULTED → PROVIDER REVIEWED → PATIENT INFORMED → FOLLOW-UP COMPLETE → FINANCIALLY RECONCILED`

Referral closure target:

`CREATED → RECORDS READY → SENT → RECEIVED → SCHEDULED → PATIENT SEEN → REPORT RETURNED → REFERRING PROVIDER REVIEWED → FOLLOW-UP → CLOSED`

A sent referral is not a closed referral.

A result existing is not provider review.

## Telemedicine

Telemedicine is an encounter mode:

`APPOINTMENT → READINESS → CONSENT → VIDEO → SAME CURRENT VISIT → DOCUMENTATION → ORDERS → CODING → FOLLOW-UP`

Video vendor remains adapter until internalization is economically justified.

## Specialty Packs

Specialty Packs configure reusable clinical components rather than fork the application.

Initial/target packs include Primary Care, Pain, Orthopedics, PT, Neurology, Psychiatry/Behavioral Health, Cardiology, GI, OB/GYN, Pediatrics, Podiatry, Dental, Med Spa, Weight Management, No-Fault, Workers' Comp and EMG/Neurodiagnostics.

## Backend authorities

Target services, reconciled against current code before creation:

- EncounterService
- ClinicalEvidenceService
- ClinicalChangeEngine
- PatientTimelineService
- BodyMapService
- StaffHandoffService
- SchedulingEngine
- OrderService
- ResultService
- ReferralService
- TelemedicineEncounterService
- ConsentService
- DocumentService
- ProcedureService
- SignatureService
- SpecialtyConfigurationEngine
- ClinicalAuditService

## Canonical data

Patient, Encounter, ClinicalEvidence, ClinicalChange, BodyMapVersion, StaffHandoff, Appointment, AppointmentSeries where justified, Order, Result, Referral, Procedure, Document, Consent, Signature, Addendum, Coverage/FinancialCase reference, Episode reference, SpecialtyConfiguration.

## Commands

Examples:

- create/update encounter draft
- record structured evidence
- record body-map version
- record staff handoff
- sign note
- add addendum
- place order
- acknowledge/review result
- create/advance referral
- schedule/reschedule/cancel appointment
- start telemedicine encounter

## Events produced

AppointmentScheduled, AppointmentCompleted, EncounterStarted, ClinicalEvidenceRecorded, ClinicalChangeDerived, BodyMapVersionRecorded, ProcedurePerformed, NoteSigned, NoteAmended, OrderPlaced, ResultReceived, ResultReviewed, ReferralCreated, ReferralSent, ReferralCompleted, ReferralReviewed.

## Events consumed

Coverage/authorization state, credential/privilege state, external result/integration events, payment/revenue projections, consent changes and enterprise configuration.

## Zumi

May prepare pre-visit summaries, explain structured change, draft documentation from supported evidence, identify missing information, prepare orders/referrals/coding candidates and summarize downstream work.

Clinical diagnosis, treatment choice, prescription, signature and clinical factual assertions remain human/professional authority.

Autonomy generally L0-L3; L4 only for explicitly authorized low-risk operational work, never clinical judgment.

## External adapters

- labs
- imaging/PACS
- telemedicine/video
- eRx/pharmacy
- external EHR/FHIR/HL7
- identity/coverage/payer systems

## Permissions

Use patient relationship, organization/location, professional role, privilege, assignment, purpose and consent where applicable. Admin role alone does not grant unrestricted clinical authority.

## PHI/PII

High sensitivity. Minimize browser DTOs, logs, analytics and external model exposure. Apply data-purpose rules and audit consequential access/actions.

## Failure states

- external result delayed
- provider not privileged
- patient consent/readiness missing
- conflicting/stale data
- unsigned documentation
- unavailable integration
- unresolved referral
- incomplete order transmission

No silent success.

## Customer value

Reduces provider cognitive load, duplicate intake, fragmented specialty workflow, chart hunting and downstream lost work.

## Monetization

Core Care/Clinic OS subscription, implementation/migration, specialty configuration, selected Zumi usage and enterprise licensing.

## Tests

- encounter lifecycle
- signature/lock/addendum immutability
- role/profession/tenant access
- Clinical Change determinism
- BodyMap history preservation
- staff handoff authority
- order/result/referral closure
- telemedicine same-encounter behavior
- No-Fault golden case
- mobile/keyboard/accessibility
- no unsupported AI clinical state

## Definition of done

A real database-backed patient journey can move from scheduling/intake through Current Visit, structured longitudinal change, appropriate orders/results/referrals, documentation/signature and truthful downstream work without creating parallel clinical truth or requiring the provider to navigate a module wall.