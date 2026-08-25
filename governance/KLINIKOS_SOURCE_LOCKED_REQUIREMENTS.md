# KLINIKOS Source-Locked Requirements Register

Status: GOVERNING INPUT REGISTER
Purpose: prevent direct professional, founder, customer and canonical feature requirements from being silently lost as architecture evolves.

## Rule

Source-locked requirements preserve the **user need**, not necessarily the original implementation idea.

A requirement may be implemented, combined, generalized, hidden behind a simpler surface, superseded with traceability, blocked by an external dependency, deferred, or explicitly not built by design. It may not silently disappear.

For every material source-locked requirement track:

- Requirement ID
- Source / source type
- Persona
- Direct need
- Why it matters
- Current implementation status
- Current route/surface
- Current data/domain authority
- Permission/authority requirement
- External dependency
- Security/legal dependency
- Commercial/economic value
- Roadmap position
- Acceptance evidence
- Superseded/composed destination if changed

## Source classes

- `FOUNDER_REQUIREMENT`
- `DOCTOR_FEEDBACK`
- `NURSE_OR_CLINICAL_STAFF_FEEDBACK`
- `CLINIC_OPERATOR_FEEDBACK`
- `CUSTOMER_OR_PROSPECT_REQUEST`
- `CANONICAL_FEATURE_REGISTRY`
- `REGULATORY_OR_SECURITY_REQUIREMENT`
- `ENGINEERING_DISCOVERY`

## Canonical full-scope ingestion

`src/lib/feature-registry-canon.ts` is a direct product-scope source. Do not manually reproduce and then forget parts of it. Every section/feature in that registry must remain addressable in product truth with one of the repository statuses.

The registry already covers the connected clinic network, access/consent, multi-tenancy, users/providers/credentials, patient registration, complete chart, encounters, scheduling, front desk, provider workspace, patient portal and many additional domains. Treat the complete file as source material, not this summary.

## Direct professional clinical requirements

### DOC-001 One continuous provider visit

Need: physicians must work through one coherent Current Visit rather than reconstruct a visit from disconnected modules.

Required experience:

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → CLOSE VISIT`

Current Visit already exists. Preserve its governed Encounter authority and perfect it.

### DOC-002 Patient Snapshot

Make important context immediately available when authorized, including where relevant:

- demographics
- patient image/identity context
- contact information
- emergency/next-of-kin
- family/relationship context
- coverage/financial case
- allergies
- medications
- problem list
- major medical/surgical/family/social history
- immunization/preventive context
- advance-care-planning metadata
- consent/authorization state
- recent encounters/results/consults
- important alerts

Use progressive disclosure. Do not turn the screen into a wall.

### DOC-003 MA/LPN/RN to provider handoff

Staff work should flow forward so providers do not repeat it.

Progressively support:

- reason for visit
- what changed
- vitals
- medications/allergies reconciliation
- symptoms
- forms/screenings
- body-map update
- unresolved questions
- delegated tasks
- readiness/documents
- coverage/authorization state where relevant

Do not collapse MA, LPN and RN authority into a single assumed clinical role. Identity/role does not prove license/scope.

### DOC-004 Structured clinical documentation

Preserve access to:

- chief complaint
- HPI / interval history
- ROS
- vitals
- detailed physical examination
- history
- medications/allergies
- assessment
- plan
- procedures
- follow-up
- diagnoses
- procedure codes/modifiers
- provider review/signature
- immutable signed note + attributable addenda

Simplify the UX, not the clinical substance.

### DOC-005 Longitudinal Clinical Change

The system should make `INITIAL → PREVIOUS → TODAY` clinically useful.

Potential structured dimensions:

- pain
- body regions/laterality
- symptoms
- function/ADLs
- range of motion
- exam findings
- work status
- medications
- treatment progression
- procedures
- labs/imaging
- new/worsened/improved/unchanged findings

Never infer resolution from omission. AI may explain structured change but does not invent it.

### DOC-006 Versioned BodyMap

Preserve longitudinal versions rather than overwriting history.

Support as appropriate:

- body region
- laterality
- symptom type
- severity
- annotation
- source/author
- encounter/timestamp
- version/amendment
- resolution evidence

Provider presentation should make `INITIAL / PREVIOUS / TODAY` visually understandable.

### DOC-007 No-Fault / Workers' Compensation clinical case context

No-Fault/MSK should be a sophisticated specialty/case configuration over shared Klinikos architecture, not a separate EHR.

Account for where applicable:

- accident date/mechanism
- carrier/policy/claim
- adjuster
- attorney
- AOB / required documents
- authorizations
- IME
- denial/appeal
- deadlines
- initial injury baseline
- body regions
- pain/function/ADLs
- hospital/surgery history
- PT/treatment progression
- work status
- imaging/labs/consultations
- procedures
- documentation/coding/billing
- case financial state

Clinical component coverage should be reusable for cervical, thoracic, lumbar, shoulder, upper extremity, hip, knee, ankle/foot, neurological complaints, headache/dizziness, psychological symptoms, fracture/dislocation, emergency/hospital treatment, surgery/post-op, pain management, PT/rehab, function and work status.

### DOC-008 Specialty communication and consultation reports

Cross-specialty care should not vanish into fax/email/manual chasing.

Support authorized consult/result return for areas such as:

- pain management
- psychiatry/behavioral health
- physical therapy
- orthopedics
- EMG/neurodiagnostics
- other specialists

Track source, specialty/provider, date, report/impression, review state and follow-up requirement.

### DOC-009 EMG / specialty diagnostics

Support typed diagnostic orders/results with performing provider, result/impression, evidence, review, related diagnoses, follow-up and appropriate billing/coding relationship.

Do not create a one-off EMG architecture when a general diagnostic/result model can cover it safely.

### DOC-010 Procedures and injections

Support structured procedures such as injections, shockwave, Botox and other specialty-configured treatments where appropriate.

Potential fields include:

- procedure
- reason/rationale
- body location/laterality
- medication/product/dose/quantity where relevant
- lot number where appropriate
- technique
- outcome/instructions
- supporting evidence
- ICD/CPT/HCPCS/modifier relationship where appropriate
- provider signature
- financial consequence

Billing must never fabricate clinical justification.

### DOC-011 Laboratory workflow

Klinikos owns the order/result experience; external labs remain authoritative for their results.

Support:

- orders/catalog
- collection/status
- results
- abnormal/critical results
- provider review
- patient communication
- repeats
- longitudinal comparison
- external integration lifecycle

Named providers discussed historically include Quest, Labcorp, BioReference and health-system lab pathways. Never claim a named connection is production-live unless verified.

### DOC-012 Imaging/radiology workflow

Support MRI, CT, X-ray, ultrasound and other appropriate modalities through canonical imaging/order/result workflows and adapters.

Account for authorization, scheduling, transmission, reports/impression, image access where permitted, provider review, patient communication and follow-up.

Architect toward DICOM/DICOMweb/PACS/FHIR/HL7/vendor APIs as appropriate without claiming production connectivity until verified.

### DOC-013 Televisit inside the encounter

Telemedicine is an encounter mode, not another chart.

`APPOINTMENT → READINESS/CONSENT → VIDEO → SAME CURRENT VISIT → DOCUMENTATION → ORDERS → CODING → FOLLOW-UP → CLOSE`

### DOC-014 Ambient dictation/scribe

Target:

`CONSENT → AUDIO/DICTATION → TRANSCRIPT → STRUCTURED EVIDENCE → DRAFT NOTE → GAP DETECTION → CODING CANDIDATES → PROVIDER REVIEW → SIGNATURE`

Preserve provenance. AI must not invent exam findings, diagnoses, laterality, orders, result review, final codes or signatures.

### DOC-015 Medical coding

Support governed decision assistance around ICD-10-CM, CPT, HCPCS, modifiers, effective dates, documentation evidence, medical necessity context, payer/case context and human decision.

Coding interface should distinguish candidate suggestion, supporting evidence, missing information and final human decision.

### DOC-016 Billing / revenue continuation

Clinical work should connect cleanly to financial work.

`PERFORMED → DOCUMENTED → CODE SUPPORTED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → SENT → ACCEPTED/REJECTED → ADJUDICATED → PAID → RECONCILED`

Never label potential or estimated money as collected/recovered money.

### DOC-017 HIPAA/documentation/practice-safety requirements

Clinical product design must account for appropriate access control, audit, signed-record integrity, addenda, consent/purpose, minimum-necessary disclosure, provenance, secure integrations, review state and release state.

Do not reduce compliance to a badge.

### DOC-018 Patient identity / relationship requirements

Account for patient photograph/updated photo, identity documents where appropriate, demographics, emergency contact, next of kin, family/relationship linkage, authorization/consent state, advance-care-planning state and immunization state.

Not every field belongs on every default screen.

## Source-locked ecosystem requirements

The following product families are explicitly preserved in architecture even when not current P0:

- connected healthcare network
- universal connected patient record / master patient identity
- duplicate detection/reconciliation
- EHR/EMR
- clinic CRM
- scheduling/capacity
- front desk OS
- provider workspace
- patient portal/mobile
- Patient Health Passport
- Consent Wallet
- Universal Intake Passport
- telemedicine
- closed-loop referrals
- Care Constellation
- virtual care-team collaboration
- Episode Rooms / episode context
- one-click governed care handoff
- lab network
- imaging/diagnostic network
- diagnostic capacity exchange
- cross-clinic capacity marketplace
- No-Fault case management
- Workers' Compensation case management
- billing/revenue cycle
- AI coding copilot
- claim readiness
- denial intelligence
- insurance verification
- prior authorization
- payments/deposits/packages/memberships
- Med Spa / cash-pay operations
- medication/pharmacy network
- inventory/supply management
- Grid universal resource/capacity/workforce exchange
- Network relationship continuity
- EDU/workforce system
- lifelong professional identity/credential evidence
- Zumi intelligence/orchestration
- Financial OS
- enterprise governance
- integration hub
- migration/import/export
- analytics/assurance

This list is intentionally not a replacement for `src/lib/feature-registry-canon.ts`; the complete registry remains the exhaustive machine-readable feature source.

## No-silent-omission gate

Before calling a major architecture or roadmap reconciliation complete, report:

1. total source-locked requirements identified
2. built
3. partially built
4. blocked by external provider
5. deferred
6. combined/superseded with traceability
7. missing from roadmap
8. lacking a data/domain authority
9. lacking a frontend destination
10. lacking an acceptance test

Zero direct requirements may be silently lost.
