# Patient OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P1/P2

## Purpose

Give patients and authorized proxies one understandable place to manage their participation in care without exposing internal clinical or operational complexity.

## Primary question

> **What do I need to do next?**

## Frontend surfaces

- patient Living Home
- appointments
- intake/forms
- consents
- telehealth readiness/join
- released results
- released documents
- messages
- care instructions
- balances/payments
- record requests
- proxy/caregiver management
- Patient Health Passport
- Universal Intake Passport

## Backend authority

Patient OS owns patient-facing access, release/proxy/consent interaction and patient-action projections. It does not create underlying clinical facts or override provider release decisions.

## Backend services

- PatientAccessService
- PatientActionProjection
- ProxyService
- ConsentWalletService
- PatientPassportService
- PatientDocumentService
- PatientCommunicationService
- PatientPaymentProjection
- RecordReleaseService
- IntakePassportService

## Canonical data

PatientIdentityLink, ProxyRelationship, Consent, ReleaseAuthorization, PatientActionProjection, IntakeProfile, PassportProjection, CommunicationPreference, RecordRequest, PatientDocumentAccess.

## Patient Health Passport

Progressively support portable patient-controlled projections of appropriate identity/emergency information, allergies, medications, diagnoses, immunizations, care team, recent visits, labs/imaging, referrals, insurance and advance directives.

Sharing requires explicit scope, purpose, time limit and audit where appropriate.

## Consent Wallet

Track consent type, scope, recipient, purpose, effective/expiration dates, revocation and version evidence.

Potential types include treatment, communication, telehealth, AI/audio, photo/media, proxy/caregiver, information sharing and research when separately governed.

## Universal Intake Passport

Allow patients to confirm/update reusable demographics, insurance, pharmacy, medications, allergies and medical/surgical/family/social history. Organization-specific questions remain separate.

Do not overwrite organization clinical history simply because the patient updates reusable intake data; changes must enter an appropriate review/reconciliation path.

## Commands

- complete/update intake
- accept/revoke permitted consent
- request appointment
- join telehealth
- request record release
- grant/revoke proxy access where policy permits
- pay balance through Financial OS
- acknowledge instructions

## Events produced

PatientIntakeUpdated, ConsentGranted, ConsentRevoked, ProxyGranted, ProxyRevoked, RecordRequested, PatientActionCompleted, PatientPaymentRequested.

## Events consumed

AppointmentScheduled, FormRequired, ResultReleased, DocumentReleased, FollowUpRequired, BalanceUpdated, TelehealthReady, ConsentRequirementCreated.

## Zumi

Patient-facing Zumi may explain released information in plain language, help complete operational steps, navigate appointments/forms/payments and answer product/process questions. It must not diagnose, prescribe, reveal unreleased records or expose internal/private data.

Autonomy: L0-L3 for operational actions; no autonomous consent or clinical decisions.

## Permissions/privacy

- strong patient/proxy identity verification
- release rules before clinical information exposure
- patient existence not leaked through public search
- proxy scope and expiration explicit
- no public Grid linkage to patient identity
- patient-visible access history where appropriate

## Failure states

- identity mismatch
- proxy not authorized
- result/document not released
- appointment unavailable
- payment pending
- telehealth unavailable
- consent missing
- external record unavailable

Use explanatory copy with next step.

## Customer value

Reduces repeated intake, phone calls, portal fragmentation and confusion. Improves readiness and follow-through.

## Monetization

Primarily supports organizational subscription/retention, payments and network value. Essential participating-provider patient access should not be monetized aggressively as a separate patient tax.

## Tests

- patient/proxy authorization
- release-state enforcement
- consent version/revocation
- reusable intake reconciliation
- balance/payment projection truth
- no public patient leakage
- mobile/accessibility

## Definition of done

A patient can securely understand and complete their next permitted action without needing to understand the clinic's internal systems, while all clinical/release/financial authority remains in the proper source domain.