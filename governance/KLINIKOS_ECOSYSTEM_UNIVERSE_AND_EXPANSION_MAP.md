# KLINIKOS Ecosystem Universe & Expansion Map

Status: PREDECESSOR REFERENCE — SUBORDINATE TO `docs/KLINIKOS_MASTER_CANON.md`

> This document defined the ecosystem boundary before Canon convergence. Its content is
> retained as specialist reference. Where it conflicts with the Master Canon, the Master
> Canon governs.
Date: 2026-08-25
Superseded by: `docs/KLINIKOS_MASTER_CANON.md` and the existing Master Engineering Blueprint

This file preserves an earlier ecosystem-universe and expansion map. It does not govern current product direction, implementation status, or the five-plane hierarchy. Retain it as provenance until unique accepted detail is migrated and verified.

## 1. Core principle

Klinikos is not a fixed collection of healthcare modules. It is an extensible operating network capable of representing legitimate healthcare participants, needs, resources, workflows, relationships, evidence, transactions, outcomes and external rails.

The permanent architectural question is not:

> Do we have a module for this?

It is:

> **Can this healthcare activity be represented using Klinikos' universal primitives, authority model, workflow/obligation graph, Grid, Network, Zumi, financial truth, evidence model and Integration Hub?**

If yes, extend through configuration, policy pack, adapter, capability, resource type, workflow, specialty pack or interface contract before creating an isolated product.

## 2. Universal ecosystem grammar

### Actors

- Person
- Patient
- Caregiver / Proxy
- Professional
- Student / Learner
- Employer
- Educator / Preceptor
- Organization
- Clinic / Practice
- Hospital / Health System
- Payer / Health Plan
- TPA / Administrator
- Government / Public Agency
- School / Workforce Board
- Lab
- Imaging / Diagnostic Organization
- Pharmacy
- Manufacturer
- Distributor
- Device Company
- Research Organization
- CRO / Sponsor
- Business-Service Provider
- Technology Vendor
- Financial-Service Provider
- Transportation / Logistics Provider
- Community / Social-Service Organization

### Things

- Identity
- Relationship
- Credential
- Capability
- Privilege
- Assignment
- Consent
- Purpose
- Patient
- Episode
- Coverage
- FinancialCase
- Need
- Demand
- Resource
- Capacity
- Availability
- Opportunity
- Requirement
- Eligibility
- Appointment
- Encounter
- Evidence
- ClinicalChange
- Order
- Result
- Referral
- Document
- Communication
- Obligation
- Price
- Offer
- Transaction
- PaymentEvidence
- Fulfillment
- Settlement
- Outcome
- Audit
- Memory
- Knowledge
- Decision
- IntegrationConnection

### Universal lifecycle

`DISCOVER → IDENTIFY → VERIFY → UNDERSTAND REQUIREMENTS → AUTHORIZE → MATCH/ROUTE → PREPARE → EXECUTE → MONITOR → EVIDENCE → RECONCILE → COMPLETE → RELATIONSHIP → LEARN`

Future sectors should reuse this grammar wherever possible.

## 3. Care-delivery ecosystem

Architecture must support, through core + specialty/configuration/adapters:

- primary care
- specialty medicine
- urgent/ambulatory care
- physician/NP/PA practices
- pain management
- orthopedics
- neurology
- psychiatry/behavioral health
- physical/occupational/speech therapy
- cardiology
- GI
- OB/GYN
- pediatrics
- podiatry
- dermatology
- ophthalmology/optometry where appropriate
- dental workflows where appropriate
- weight management
- med spa/aesthetic medicine
- ambulatory surgery centers
- home health
- remote care
- rehabilitation/post-acute coordination
- skilled nursing/long-term-care integrations
- hospice/palliative coordination where appropriate
- hospital/health-system overlay
- No-Fault
- Workers' Compensation
- occupational/employer health

Klinikos need not replace every specialized system. Own the experience/workflow and connect authoritative systems where replacement is irrational.

## 4. Patient / consumer ecosystem

Potential capabilities:

- patient portal
- Health Passport
- Universal Intake Passport
- Consent Wallet
- caregiver/proxy
- appointment discovery/request
- telehealth
- care navigation
- referral progress
- released results/records
- payments
- benefits/coverage context
- communication
- transportation coordination
- language/interpretation support
- community-resource navigation
- home-care coordination
- patient education
- chronic-care engagement
- preventive reminders
- care-gap action
- remote monitoring

## 5. Professional ecosystem

Potential:

- professional identity
- credentials/licensure
- employment
- contracting
- shifts
- temporary coverage
- professional services
- continuing education
- skills evidence
- preceptorship
- clinical placements
- mentorship
- professional relationships
- career progression
- practice launch
- ownership/employer transition
- trust/reputation evidence
- Grid opportunities

## 6. Organization operations ecosystem

Potential:

- practice management
- scheduling
- staffing
- intake
- chart/documentation
- forms/consent
- communications
- work/obligation management
- referrals
- orders/results
- inventory
- procurement
- rooms/facilities/equipment
- vendor management
- software-stack management
- CRM/acquisition
- contact-center operations
- reputation/reviews
- analytics
- implementation/training/support
- compliance/security operations

## 7. Revenue / financial ecosystem

Potential:

- eligibility/benefits
- prior authorization
- coding
- charge expectation
- claim readiness
- claims
- clearinghouse abstraction
- payer acknowledgments
- denials/appeals
- remittance
- payment posting
- patient responsibility
- invoices
- patient payments
- packages/memberships
- refunds/disputes
- reconciliation
- AR visibility
- revenue integrity
- cash-pay commerce
- marketplace settlement through compliant providers
- enterprise billing
- customer subscriptions

Always distinguish customer clinical economics from Klinikos platform revenue.

## 8. Payer / employer / risk ecosystem

Potential:

- provider access/data exchange
- payer-to-payer exchange
- prior authorization
- provider/network operations
- attributed populations
- care gaps
- quality measures
- utilization workflow
- case/care management
- employer health operations
- population outreach
- value-based contracts
- performance periods
- reconciliation
- provider performance
- member navigation
- self-insured employer / TPA workflows

Architect for applicable FHIR-based interoperability and prior-authorization ecosystems as standards/regulations require.

## 9. Diagnostics ecosystem

Potential:

- labs
- imaging
- pathology
- radiology
- EMG/neurodiagnostics
- cardiology testing
- sleep studies
- diagnostic services
- capacity discovery
- authorization
- scheduling
- orders/results
- reports/impressions
- provider review
- longitudinal comparison
- financial reconciliation

## 10. Pharmacy / medication ecosystem

Potential:

- medication list/reconciliation
- pharmacy selection
- e-prescribing through regulated rails
- formulary/benefit context
- medication prior authorization
- refill workflows
- medication history
- adherence support
- authoritative interaction evidence
- specialty-pharmacy coordination
- infusion workflows
- medication delivery coordination

## 11. Device / digital-health ecosystem

Potential:

- remote patient monitoring
- wearables
- home monitoring
- approved connected medical devices
- blood pressure
- glucose
- weight
- oxygen saturation
- activity/sleep where appropriate
- device observations
- patient-generated health data

Canonical pipeline:

`DEVICE → OBSERVATION → VALIDATION → RULE/THRESHOLD → REVIEW WORK → CLINICAL ACTION → OUTCOME`

## 12. Research / life-sciences ecosystem

Potential:

- trial discovery
- site feasibility
- participant recruitment under appropriate privacy/consent
- study workflows
- research organizations
- sponsors/CROs
- investigators
- study documents/scheduling
- digital health technology data
- real-world evidence
- de-identified analytics where lawful
- outcomes research
- post-market support
- patient-reported outcomes

Research is a separate governed purpose. Clinical-care data does not automatically become research data.

## 13. Public-health / government ecosystem

Potential:

- public-health reporting
- immunization interfaces
- reportable-condition workflows where required
- workforce programs
- government procurement
- Medicaid/public programs
- community-health initiatives
- emergency/disaster workflows
- institutional reporting
- grant/program opportunity routing

## 14. EDU / workforce ecosystem

Potential:

- institutions
- workforce boards
- employers
- training providers
- programs/cohorts/sessions
- instructors/learners
- virtual clinic
- assessments/rubrics
- competency evidence
- career readiness
- employer-sponsored training
- apprenticeships/work-based learning
- clinical placements
- preceptors
- continuing education
- Grid connection

Core loop:

`SHORTAGE → TRAINING → EVIDENCE → VERIFIED CAPABILITY → OPPORTUNITY → WORK → EXPERIENCE → ADVANCEMENT`

## 15. Grid / marketplace ecosystem

Universal public grammar:

**I NEED / I HAVE**

Potential resource classes:

- professionals
- jobs
- shifts
- temporary coverage
- professional services
- office space
- rooms/chairs
- equipment
- diagnostic capacity
- provider capacity
- education capacity
- preceptors
- clinical placements
- implementation services
- billing/credentialing/compliance/security/IT services
- translation/interpretation
- transportation/logistics
- appropriate supplies/resources

Every resource class receives its own eligibility, legal and economic policy pack. There is no universal marketplace fee.

## 16. Network ecosystem

Grid discovers. Network preserves governed relationships.

Potential relationships:

- patient/provider
- professional/organization
- employer/professional
- clinic/clinic
- clinic/lab
- clinic/imaging
- clinic/pharmacy
- clinic/vendor
- school/student
- school/preceptor
- school/employer
- payer/provider
- research site/sponsor
- implementation partner/customer

Relationship never automatically grants data access.

## 17. Procurement / supply ecosystem

Potential:

- medical supplies
- equipment/DME
- software
- business services
- facility services
- maintenance
- inventory/replenishment
- vendor comparison
- contract renewal
- stack rationalization
- group purchasing/negotiated rates where lawful

Strategic question:

> **What is the organization paying for that Klinikos can replace, connect, negotiate, automate, or source more efficiently?**

## 18. Facilities / real-estate / capacity ecosystem

Potential:

- medical office space
- procedure rooms
- therapy rooms
- chairs
- equipment rooms
- shared space
- temporary capacity
- expansion/location needs
- lawful sublease/booking

Scheduling + Grid can convert approved unused capacity into supply.

## 19. Transportation / logistics ecosystem

Potential partner/adaptor workflows:

- non-emergency medical transportation
- patient ride coordination
- specimen/courier logistics
- equipment/supply logistics
- medication delivery coordination

Each class needs its own legal/safety review.

## 20. Business-services ecosystem

Potential Grid/Network categories:

- accounting/tax
- legal
- cybersecurity/managed IT
- compliance
- billing
- credentialing
- recruiting/HR
- marketing/websites
- payroll integrations
- insurance services
- translation
- training
- implementation
- consulting

This can create lower-regulatory-complexity Grid liquidity before more sensitive clinical transaction categories.

## 21. Practice-launch ecosystem

Potential final product:

**Launch your practice with Klinikos**

Could coordinate:

- organization setup workflow
- website/digital presence
- scheduling
- intake/forms
- EHR/clinical operations
- telemedicine
- communications
- payments
- Revenue OS
- staffing/Grid
- training/EDU
- vendor selection
- implementation

Legal/professional boundaries must remain explicit.

## 22. Developer / partner ecosystem

Future:

- APIs
- OAuth/scopes
- webhooks
- sandbox
- connector SDK
- app registration
- specialty/workflow extensions
- implementation partners
- integration marketplace
- partner governance

## 23. Global / international readiness

U.S.-first healthcare rules must not be hardcoded into universal identity, workflow, Grid, EDU or relationship primitives.

Country/jurisdiction-specific packs should govern:

- payer model
- licensing
- privacy
- claims
- prescribing
- payment
- professional authority
- marketplace economics

## 24. Permanent expansion test

For every newly discovered opportunity answer:

1. Who needs it?
2. Who pays?
3. What current alternative exists?
4. Which existing Klinikos primitives already support it?
5. Which domains connect?
6. What new state/evidence is truly required?
7. What can Zumi automate?
8. What must remain human/external authority?
9. Does it create Grid supply/demand?
10. Does it create Network value?
11. Does it create EDU demand/supply?
12. Does it make/save customer money?
13. How does Klinikos monetize?
14. What legal/security/privacy gates apply?
15. Build, configure, partner, license, acquire or defer?
16. P0/P1/P2/P3/Future?

The ecosystem is intentionally open-ended. New categories are expected. The architecture must absorb them without losing coherence.
