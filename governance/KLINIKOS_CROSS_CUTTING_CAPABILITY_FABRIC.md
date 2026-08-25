# KLINIKOS Cross-Cutting Capability Fabric

Status: GOVERNING PRODUCT + PUBLIC-DISCOVERY ARCHITECTURE
Date: 2026-08-25

## 1. Core correction

Klinikos must not classify major capabilities as if each belongs to only one module.

Many of the highest-value healthcare capabilities are **cross-cutting fabrics** that span multiple user experiences, backend domains, commercial products, SEO categories, workflows and external integrations.

Example:

**Telemedicine** is not merely a button under Care OS.

It spans:

`PUBLIC DISCOVERY → SCHEDULING → PATIENT ACCESS → IDENTITY → CONSENT → INSURANCE/AUTH → VIDEO → CURRENT VISIT → DOCUMENTATION → CODING → CLAIM/PAYMENT → FOLLOW-UP → ANALYTICS → CUSTOMER SUCCESS`

Therefore Klinikos must treat telemedicine as:

- a public SEO/search category;
- a clinic feature;
- a patient feature;
- a provider workflow;
- an encounter mode;
- a scheduling capability;
- a consent workflow;
- a communications capability;
- an integration surface;
- a revenue/coding workflow;
- a Zumi automation domain;
- an enterprise capability;
- a commercial replacement/consolidation opportunity.

This same rule applies to every major cross-cutting capability.

---

# 2. Capability Exposure Doctrine

Every major market-recognized capability must be evaluated for **five exposure layers**.

## Layer A: Public discovery

Can a buyer searching for this capability find a dedicated useful Klinikos page?

Examples:

- `/telemedicine`
- `/ehr-emr`
- `/medical-billing`
- `/medical-coding`
- `/prior-authorization`
- `/patient-portal`
- `/medical-scheduling`
- `/ai-medical-scribe`
- `/lab-results`
- `/medical-imaging`
- `/referral-management`
- `/healthcare-crm`
- `/healthcare-staffing`
- `/clinical-education`

A page must not be a thin SEO doorway. It should explain the capability, who needs it, how it connects to Klinikos, what external rails remain, current truth, and next action.

## Layer B: Product discovery

Can the appropriate authenticated user reach the capability from the correct role experience?

Examples:

- Provider sees telemedicine from Schedule and Current Visit.
- Patient sees telemedicine from appointment readiness.
- Front desk sees telemedicine readiness from Today.
- Owner sees telemedicine adoption/capacity/operations.

Do not expose every control to every role.

## Layer C: Zumi vocabulary

Can the user ask Zumi naturally for the capability?

Examples:

- `Start my telehealth visit.`
- `Which virtual visits are not ready tomorrow?`
- `Check insurance for tomorrow's telemedicine patients.`
- `Prepare follow-up for today's virtual visits.`

Zumi routes these requests to authoritative domain services.

## Layer D: Backend orchestration

Is the capability fully mapped across domain authority, data, commands, events, external adapters, failure states, audit and reconciliation?

## Layer E: Commercial / expansion story

Can Klinikos show how this capability:

- replaces another software bill;
- reduces operational work;
- creates revenue/capacity value;
- increases retention;
- creates Grid/Network demand;
- supports enterprise expansion?

---

# 3. Major cross-cutting capability families

The following capabilities must not be buried under one domain.

## A. Telemedicine / Virtual Care

Touches:

- public website / SEO
- clinic solutions
- patient portal
- provider workspace
- scheduling
- identity
- location/jurisdiction
- professional credentials
- consent
- intake
- insurance eligibility
- prior authorization
- video provider
- Current Visit
- AI scribe
- documentation
- orders/referrals
- coding
- billing/claims
- patient payment
- follow-up
- analytics
- customer success
- enterprise policy

Canonical workflow:

`DISCOVER / BOOK → VERIFY PATIENT → VERIFY PROVIDER / JURISDICTION → READINESS → CONSENT → COVERAGE/AUTH → VIDEO → CURRENT VISIT → DOCUMENTATION → ORDERS/REFERRALS → CODING/REVENUE → PATIENT INSTRUCTIONS → FOLLOW-UP → RECONCILIATION`

Klinikos owns the workflow and experience. Video transport can remain replaceable external infrastructure.

## B. Scheduling / Capacity

Touches:

- website booking
- patient portal
- front desk
- provider schedule
- resources/rooms/equipment
- telemedicine
- coverage/auth
- Grid
- enterprise
- communications
- payments/deposits
- waitlist
- cancellations/no-shows
- CRM/rebooking
- capacity analytics

Scheduling is not a calendar. It is a capacity engine.

## C. Communications / Contact Center

Touches:

- patient
- staff
- CRM
- appointment reminders
- telemedicine
- results
- referrals
- billing
- collections
- authorizations
- customer support
- Grid
- EDU
- website lead conversion
- Zumi

Channels may include:

- in-app
- secure messaging
- SMS
- email
- voice
- fax where necessary

Communication content, consent, sensitivity, assignment and response state must be governed separately from the delivery rail.

## D. Documents / Forms / E-sign / Consent

Touches:

- intake
- patient portal
- clinical chart
- telemedicine
- procedures
- No-Fault/WC
- billing
- referrals
- Grid
- credentials
- EDU
- enterprise contracts
- onboarding

Need versioning, signature evidence, review, expiration, retention, release and audit.

## E. AI Scribe / Ambient Documentation

Touches:

- telemedicine
- in-person encounters
- consent
- audio handling
- transcript
- Current Visit
- structured clinical evidence
- note drafting
- coding evidence
- provider review
- signature
- retention
- privacy
- Zumi research

Canonical flow:

`CONSENT → AUDIO → TRANSCRIPT → STRUCTURED EVIDENCE → DRAFT → GAP CHECK → CODING CANDIDATES → HUMAN REVIEW → SIGNATURE`

## F. Referral Management

Touches:

- Care
- Network
- Grid
- patient
- payer/auth
- documents
- diagnostics
- scheduling
- communications
- results
- revenue
- enterprise

Referral is a cross-organization lifecycle, not a fax event.

## G. Orders / Results

Touches:

- Current Visit
- labs
- imaging
- diagnostics
- pharmacy
- external integrations
- patient release
- review queues
- follow-up
- revenue integrity
- analytics

## H. Insurance / Eligibility / Authorization

Touches:

- patient intake
- scheduling
- telemedicine
- procedures
- referrals
- diagnostics
- medications
- claims
- patient responsibility
- revenue
- payer
- Zumi

Insurance cannot be treated as a billing-only module.

## I. Medical Coding

Touches:

- Current Visit
- documentation
- procedures
- diagnoses
- evidence
- claim readiness
- payer rules
- denial prevention
- Revenue OS
- Zumi
- quality/audit

## J. Payments / Commerce

Touches:

- patient balances
- appointments/deposits
- cash-pay services
- packages/memberships
- subscriptions
- Grid
- EDU
- enterprise invoices
- website checkout
- refunds/disputes
- financial reconciliation

Separate platform commerce, patient clinical payments, Grid settlement and enterprise billing.

## K. Patient Portal / Health Passport

Touches:

- scheduling
- intake
- forms
- consent
- telemedicine
- messaging
- results
- referrals
- payments
- records
- proxy/caregiver
- interoperability
- patient education

## L. Provider / Professional Workspace

Touches:

- clinical work
- schedule
- credentials
- Grid
- Network
- EDU
- earnings/transactions
- professional relationships
- continuing education
- practice ownership progression

Provider is a lifelong Klinikos persona, not merely a clinic staff account.

## M. CRM / Lead / Retention / Revenue Recovery

Touches:

- website
- phone/contact center
- scheduling
- med spa
- cash-pay services
- missed calls
- no-shows
- rebooking
- campaigns
- payments
- customer economics
- owner analytics
- Zumi

## N. Inventory / Supplies / Products

Touches:

- procedures
- med spa
- medication/infusion
- procurement
- lots/expiration
- cost accounting
- Grid/resource exchange
- supply chain
- revenue margin

## O. Professional Credentialing / Trust

Touches:

- account/signup
- clinic employment
- Grid eligibility
- Network
- provider schedule
- clinical authority
- EDU-to-work
- enterprise
- payer enrollment
- expiration/reminders

## P. Interoperability / Data Exchange

Touches every domain.

Includes:

- FHIR
- HL7
- DICOM/DICOMweb
- X12
- APIs
- webhooks
- external EHR migration/coexistence
- payer exchange
- patient access
- labs/imaging
- pharmacy
- devices

Interoperability should be a public capability and an enterprise trust capability, not merely a settings page.

## Q. Analytics / Insights

Touches:

- owner
- clinical quality
- revenue
- Grid
- EDU
- enterprise
- customer success
- AI cost/value
- operations

Separate product analytics, marketing analytics, operational analytics and clinical/quality analytics.

## R. AI Research / Expert Intelligence

Touches:

- clinical evidence
- payer policy
- coding/reimbursement
- operations
- engineering
- enterprise
- procurement
- strategy

Publicly marketable only with accurate claims and clear professional-authority boundaries.

## S. Practice Launch

Touches:

- commercial site
- organization onboarding
- website/CRM
- identity
- scheduling
- EHR/EMR
- patient portal
- payments
- communications
- Revenue OS
- Grid staffing
- EDU/training
- integrations
- business services

## T. Security / Trust / Compliance Operations

Touches every domain.

Publicly discoverable as enterprise capability but must never overstate compliance/certification.

---

# 4. Capability Registry

Create/maintain a machine-readable capability registry so every major capability has one canonical record.

Recommended fields:

- capability ID
- public name
- plain-English description
- public route(s)
- SEO category/keywords
- target personas
- target organization types
- top-level navigation parent
- internal surfaces
- domain owners
- commands
- events
- Zumi intents/tools
- external adapters
- entitlement/pricing class
- current status
- integration status
- source-locked requirements
- security/privacy classification
- legal/regulatory gates
- analytics events
- related capabilities
- related solution pages
- CTA
- last reviewed

This registry becomes the bridge between product architecture, route architecture, SEO, sales, design, Zumi and engineering.

---

# 5. Public route architecture

Use a hub-and-spoke structure.

Top-level hubs stay simple:

- `/platform`
- `/solutions`
- `/grid`
- `/edu`
- `/resources`
- `/trust`
- `/pricing`

Under them, expose major capability pages such as:

### Clinical / EHR

- `/ehr-emr`
- `/practice-management`
- `/clinical-documentation`
- `/current-visit`
- `/ai-medical-scribe`
- `/clinical-change`
- `/body-map`
- `/telemedicine`
- `/medical-scheduling`
- `/patient-portal`
- `/patient-intake`
- `/medical-forms-consents`
- `/secure-medical-messaging`
- `/lab-results`
- `/medical-imaging`
- `/referral-management`
- `/medication-management`

### Revenue

- `/medical-billing`
- `/revenue-cycle-management`
- `/medical-coding`
- `/insurance-eligibility`
- `/prior-authorization`
- `/medical-claims`
- `/denial-management`
- `/payment-posting`
- `/patient-payments`
- `/revenue-integrity`

### Operations / Growth

- `/front-desk-automation`
- `/healthcare-crm`
- `/ai-receptionist`
- `/missed-call-recovery`
- `/patient-rebooking`
- `/healthcare-inventory`
- `/practice-analytics`
- `/practice-launch`

### Network / Workforce

- `/healthcare-jobs`
- `/healthcare-shifts`
- `/provider-network`
- `/medical-office-space`
- `/healthcare-services-marketplace`
- `/healthcare-provider-credentialing`
- `/clinical-placements`
- `/preceptor-network`

### Enterprise / Interoperability

- `/healthcare-interoperability`
- `/fhir-api`
- `/ehr-integration`
- `/healthcare-enterprise`
- `/multi-location-practice-management`
- `/healthcare-security`
- `/healthcare-ai-governance`

Routes should be consolidated if keyword intent is too similar. Avoid cannibalizing search intent with dozens of near-duplicate pages.

---

# 6. Website cross-link law

Every capability page must link to the other capabilities that make it complete.

Example Telemedicine page links to:

- Scheduling
- Patient Portal
- Intake & Consent
- AI Scribe
- Current Visit
- Medical Coding
- Insurance / Authorization
- Patient Payments
- Secure Messaging

The visitor learns that Klinikos does not merely provide video. It owns the complete virtual-care workflow.

This same pattern applies everywhere.

---

# 7. Product cross-link law

Authenticated surfaces must expose related capabilities contextually rather than through giant navigation.

Example:

A virtual appointment can show:

- readiness
- consent
- insurance
- join visit
- Current Visit
- coding/revenue status
- follow-up

No user should manually assemble that workflow from seven modules.

---

# 8. Commercial bundling law

A capability can be publicly marketed even when it is commercially bundled into a broader Klinikos plan.

Public SEO category != separate subscription SKU.

Example:

Telemedicine may have a dedicated page but be included inside Core/Growth/Scale depending on final entitlement design.

This allows Klinikos to rank/discover broadly without becoming a confusing menu of 100 plans.

---

# 9. Completeness audit

For every major capability ask:

1. Can someone search for it publicly?
2. Does a useful public page exist?
3. Is it correctly linked from relevant solution pages?
4. Can the correct authenticated persona find it?
5. Can Zumi understand requests about it?
6. Are backend authorities mapped?
7. Are database/state transitions real?
8. Are external integrations truthfully represented?
9. Are failure/retry/reconciliation states defined?
10. Does it connect to revenue/customer value?
11. Is its pricing/entitlement clear?
12. Are legal/security/privacy gates defined?
13. Does analytics measure usage/value?
14. Does it connect to other capabilities without duplicate state?
15. Is there a source-locked requirement it must satisfy?

If any answer is missing, the capability is incomplete as an ecosystem capability even if one page/component already exists.

---

# 10. Final law

> **Klinikos should have a simple top-level interface but a broad public footprint. Major healthcare capabilities must be independently discoverable, deeply connected, and contextually surfaced across every role and workflow they affect.**

That is how Klinikos can be both simple to use and enormous in market coverage.
