# KLINIKOS Final Ecosystem Architecture

Status: GOVERNING FINAL-FORM DOMAIN MAP
Date: 2026-08-25
Baseline: `main@5eb1bda23c4053093f4e11d351298ffe1c7131ea`

## 1. One product, many governed domains

Klinikos is one healthcare operating network. Domains exist to preserve authority and engineering clarity, not to create a module wall.

```text
                            LIVING HOME + ZUMI
                         What needs to happen next?
                                   |
              +--------------------+--------------------+
              |                    |                    |
             CARE                MONEY                NETWORK
              |                    |                    |
      +-------+------+       +-----+------+       +-----+------+
      |              |       |            |       |            |
   PATIENT         PAYER   REVENUE      FINANCIAL GRID       EDU
      |              |       |            |       |            |
      +--------------+-------+------------+-------+------------+
                                   |
                    IDENTITY / TRUST / CONSENT
                                   |
                              ENTERPRISE
                                   |
                           INTEGRATION HUB
                                   |
      +---------+---------+---------+---------+---------+
      |         |         |         |         |         |
    Payers   Claims     Labs     Imaging   Pharmacy External EHRs
                                   |
                    DATA + PLATFORM OPERATIONS
```

## 2. Shared laws

### Identity is not authority

A person can have one identity while holding different memberships, professional roles, credentials, privileges, assignments and purposes in different contexts.

### Frontend is not authority

The browser receives minimum-necessary DTOs. Hiding a button is never authorization.

### AI is not authority

Zumi may understand, prepare, orchestrate and explain. Domain services and authoritative external systems decide consequential state.

### Relationship is not permission

A Network relationship or Grid fulfillment does not grant chart access.

### Payment is not eligibility

No commercial action creates a professional credential, clinical authority or lawful referral relationship.

### Event existence is not completion

A referral being sent is not a completed referral. A result existing is not provider review. A redirect is not payment. A note being signed is not necessarily the end of downstream work.

## 3. Core platform graphs

Klinikos compounds through governed graphs rather than isolated records:

- Identity & Relationship Graph
- Professional Authority Graph
- Clinical Change Graph
- Unfinished Work / Obligation Graph
- Capacity Graph
- Grid Opportunity Graph
- Learning & Competency Graph
- Evidence Graph
- Revenue Integrity Graph
- Financial Truth Graph
- Integration / Reconciliation Graph
- Memory / Decision Graph
- Network Relationship Graph
- Consent / Purpose Graph

## 4. Domain ownership

| Domain | Owns | Must not own |
|---|---|---|
| Platform Kernel | identity context, organization context, authorization framework, configuration, audit/event primitives | clinical truth, payment truth |
| Living Home | presentation/projection of next useful work | underlying clinical/financial/task authority |
| Care OS | encounters, clinical evidence, clinical workflow, orders/referrals/results state | payment settlement, professional credential verification |
| Patient OS | patient-facing access/proxy/release experience | underlying clinical fact creation |
| Revenue OS | revenue progression, claim readiness, coding/revenue exceptions | bank/payment settlement truth |
| Financial OS | offer, payment evidence, entitlement, settlement/reconciliation | clinical justification |
| Zumi | intent, orchestration, explanation, approved tool execution | domain authority |
| Grid | demand/resource/eligibility/matching/fulfillment | license authority, patient record authority |
| Network | governed relationships and repeat interaction | automatic patient-data permission |
| EDU | curriculum, assessment, instructor review, completion evidence | licensure |
| Identity/Trust | professional profile, credential evidence, assignments/privileges | medical diagnosis, payment truth |
| Payer/VBC | payer contracts/population/quality operational context | unvalidated autonomous clinical judgment |
| Pharmacy | medication workflow state and adapter orchestration | external prescribing authority when regulated rail controls it |
| Enterprise | hierarchy, delegated admin, enterprise policy/entitlement | unrestricted clinical authority |
| Digital Business | acquisition, qualification, approved offers, CRM/onboarding orchestration | pricing invention, legal binding outside approved authority |
| Integration Hub | connection lifecycle, transport, mapping, reconciliation | redefining canonical domain objects |
| Data Platform | provenance, lineage, quality, analytics projections | silently changing source-of-truth domain facts |
| Implementation/CS | migration/onboarding/customer-value state | production clinical truth by convenience |
| Trust/Assurance | evidence of controls and enterprise trust | claiming controls not implemented |
| Platform Operations | runtime/release/reliability/security infrastructure | business-domain truth |
| Developer Ecosystem | governed external extension points | bypassing platform authorization |

## 5. Core event flows

### Encounter to payment

`EncounterCompleted → DocumentationState → CodingReviewed → ChargeExpected → ClaimReady → ClaimSubmitted → ClaimAdjudicated → PaymentEvidence → Reconciliation`

### Appointment readiness

`AppointmentScheduled → IntakeRequirements → CoverageCheck → AuthorizationRequirements → ResourceReadiness → Ready / NeedsAction`

### Referral closure

`ReferralCreated → RecordsReady → Sent → Received → Scheduled → Seen → ReportReceived → ProviderReviewed → FollowUpComplete → ReferralClosed`

### Result closure

`OrderPlaced → ResultReceived → CriticalRuleCheck → ProviderReviewed → PatientInformed → FollowUpComplete`

### Capacity to Grid

`AvailabilityDetected → HumanApproval → GridResourcePublished → EligibleDemandMatched → Reservation → Fulfillment → FinancialEvidence → NetworkRelationshipOption`

### Workforce shortage to EDU

`PersistentGridDemand → ShortageSignal → Program/Cohort → AssessmentEvidence → HumanReview → CompetencyEvidence → OptInGrid → Opportunity → Work`

### Public visitor to customer

`Visit → PublicZumi/OperatingMap → Qualification → ApprovedOffer → Contract/Checkout → Payment/SignatureEvidence → CRM → Onboarding → Activation → FirstValue`

## 6. System blueprint contract

Every system blueprint must define:

1. purpose
2. personas
3. primary user question
4. frontend surfaces
5. plain-language states
6. domain authority
7. backend services
8. canonical data/entities
9. state machines
10. commands
11. events produced
12. events consumed
13. APIs/server actions
14. Zumi tools
15. Zumi autonomy level
16. external adapters
17. permissions
18. PHI/PII classification
19. audit requirements
20. failure states
21. retry/reconciliation
22. analytics
23. customer value
24. customer economic value
25. Klinikos monetization
26. network effect
27. security requirements
28. regulatory/legal gates
29. performance/scale
30. tests
31. definition of done
32. current repository status
33. source-locked requirements
34. dependencies
35. roadmap phase

## 7. Build order law

Final-form scope remains documented at all times, but implementation proceeds in dependency order:

- P0: production/release truth + self-selling website + unfinished work + Living Home + Golden Current Visit + Revenue Integrity + analytics
- P1: Zumi operations autopilot
- P2: vendor consolidation
- P3: Grid/Network/EDU/Identity density
- P4: Enterprise/Payer/VBC
- P5: developer/partner/global ecosystem

A new idea interrupts current P0 only when it is required for safety, revenue activation, current customer value or a hard dependency.

## 8. Architecture acceptance test

A proposed capability is rejected or redesigned if it:

- creates a second authority
- requires the user to understand unnecessary backend jargon
- cannot explain its next action
- has no failure/reconciliation state
- has no authorization story
- exposes sensitive/proprietary logic to browser
- has no truthful commercial path
- cannot identify its owning domain
- cannot identify its source-of-truth data
- cannot identify its measurable customer value
- creates a dead-end custom implementation that does not compound into platform architecture
