# Revenue Integrity OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P1/P2

## Purpose

Connect legitimate clinical/operational activity to financial progression and make every broken transition visible, explainable and actionable without overstating revenue.

## Primary user question

> **Where did legitimate payment stop?**

## Core chain

`PERFORMED → DOCUMENTED → CODE SUPPORTED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → CLAIM SENT → ACCEPTED → ADJUDICATED → PAID → RECONCILED`

Each transition must identify its evidence source and the party/system responsible for moving it forward.

## Subsystems

1. Coding Intelligence
2. Charge Expectation
3. Claim Readiness
4. Eligibility
5. Prior Authorization
6. Claims
7. Clearinghouse Abstraction
8. Denials
9. Appeals
10. Remittance
11. Payment Posting
12. Revenue Exceptions
13. Accounts Receivable work projection
14. Revenue analytics

## Frontend surfaces

- Revenue Living Home
- coding review
- claim readiness
- claim lifecycle
- denial/appeal queue
- remittance/payment posting
- revenue exception list
- patient/encounter revenue timeline
- authorization work
- insurance readiness

## Plain-language states

- Documentation still needs review
- Coding needs review
- Charge may be missing
- Claim is ready to send
- Claim was rejected
- Insurance denied this claim
- Payment arrived and needs reconciliation
- This item is fully reconciled

Never label an estimate as recovered revenue.

## Domain authority

Revenue OS owns revenue progression and claim/coding/reconciliation work state. Financial OS owns actual payment/settlement/entitlement truth. Care OS owns clinical evidence and signature truth.

## Backend services

- CodingEvidenceEngine
- CodingSuggestionService
- ChargeExpectationEngine
- ClaimReadinessEngine
- EligibilityService
- AuthorizationService
- ClaimService
- ClaimTransmissionService
- ClearinghouseAdapterRegistry
- DenialService
- AppealService
- RemittanceService
- PaymentPostingService
- RevenueExceptionEngine
- RevenueReconciliationService
- AccountsReceivableProjectionService

Reconcile with existing repository services before introducing new ones.

## Canonical data

RevenueCase/EncounterRevenueProjection, CodeCandidate, CodingDecision, ChargeExpectation, Charge, Claim, ClaimLine, ClaimSubmission, ClaimAcknowledgment, Denial, Appeal, Remittance, PaymentPosting, RevenueException, EligibilityEvidence, AuthorizationRequest/Decision/Expiration, ReconciliationItem.

## Coding Intelligence

Support ICD-10-CM, CPT, HCPCS, modifiers, units/place-of-service where applicable, effective dates, documentation evidence, diagnosis/procedure relationships, payer/case context and medical-necessity evidence.

AI can identify candidate concepts/codes, missing evidence and inconsistencies. Human/provider/coder authority remains final where required.

Frontend should show:

- Suggested
- Why it may fit
- Supporting evidence
- What's missing
- Human decision

Never invent diagnosis, laterality, procedure or documentation to increase reimbursement.

## Eligibility

Flow:

`PATIENT + COVERAGE → PAYER/PLAN → ELIGIBILITY REQUEST → RESPONSE → BENEFITS/LIMITS → REFERRAL/AUTHORIZATION REQUIREMENTS → READY / NEEDS ACTION`

Record source, timestamp and limitations of response.

## Prior authorization

Flow:

`SERVICE + PATIENT + PAYER + PLAN + CLINICAL EVIDENCE → REQUEST → SUBMISSION → ACKNOWLEDGMENT → STATUS → APPROVAL/DENIAL → QUANTITY/VISITS/DATE LIMIT → EXPIRATION → APPEAL/FOLLOW-UP`

Zumi may gather existing evidence, identify missing items, prepare submission, monitor state and prepare appeal. Human authority applies where required.

## Claims / clearinghouse abstraction

Klinikos owns canonical claim state and uses replaceable clearinghouse/payer adapters.

Architecture must support applicable X12 transaction families through the Integration Hub, including eligibility, claim submission, remittance and claim-status capabilities where available.

The user should not need to operate a separate clearinghouse portal when an authorized connected workflow exists.

## Denials / appeals

Track denial category/reason, related claim/line, authoritative payer response, missing/correctable information, deadline, evidence packet, correction/appeal submission and final outcome.

Frontend example:

**Insurance denied this claim.**

Reason: missing authorization.

**An appeal package is ready for review.**

Do not overstate likelihood of success.

## Payment posting / reconciliation

When remittance/payment evidence arrives:

- parse/validate
- match to claim/account
- post allowed amounts/adjustments/responsibility
- detect unmatched/ambiguous state
- reconcile against Financial OS payment evidence where applicable
- create exception if unable to reconcile

## Commands

- review/approve coding decision
- create/update authorization request
- submit approved authorization
- create claim
- validate claim
- submit claim through adapter
- correct rejected claim
- create/submit appeal
- post remittance/payment
- resolve revenue exception

## Events produced

EligibilityChecked, AuthorizationRequired, AuthorizationSubmitted, AuthorizationApproved, AuthorizationDenied, AuthorizationExpired, CodingReviewRequired, CodingReviewed, ChargeExpected, ClaimReady, ClaimSubmitted, ClaimRejected, ClaimAccepted, ClaimAdjudicated, DenialCreated, AppealSubmitted, RemittanceReceived, PaymentPostingCreated, RevenueExceptionCreated, RevenueExceptionResolved, RevenueReconciled.

## Events consumed

EncounterCompleted, ProcedurePerformed, NoteSigned, NoteAmended, Order/Result evidence, PaymentEvidence, CoverageUpdated, Contract/PayerConfigurationChanged.

## Zumi

- explain rejection/denial in plain English
- prepare eligibility/authorization work
- prepare coding review
- prepare claim corrections
- prepare appeal packet
- identify unresolved revenue exceptions
- summarize AR/revenue work

Autonomy: L0-L3 generally; L4 only for explicitly approved deterministic polling/posting/reconciliation tasks with strong evidence and reversibility.

## External adapters

- payer eligibility/authorization
- clearinghouse
- payer claim status
- remittance
- external billing/RCM during transition

## Permissions

Clinical evidence access must follow clinical authority/purpose. Billing staff may access minimum necessary revenue/clinical documentation based on policy. Revenue access does not imply full clinical edit permission.

## PHI/PII

High sensitivity. Avoid marketing analytics and broad logs. Integration payload retention must be purposeful and governed.

## Failure/reconciliation states

- payer unavailable
- ambiguous member/coverage
- authorization response incomplete
- claim transmission uncertain
- duplicate submission
- out-of-order acknowledgment
- remittance unmatched
- coding evidence missing
- signed note amended after claim preparation

Every uncertain state creates reconciliation work rather than fake success.

## Customer value

Reduces manual payer work, coding/claim errors, denial follow-up effort and invisible revenue leakage.

## Monetization

Revenue OS subscription/add-on, implementation, approved usage/connectivity, premium automation and enterprise licensing. Percentage-based healthcare economics require category-specific legal review before activation.

## Tests

- evidence-linked coding
- no unsupported code suggestion finalization
- eligibility/authorization lifecycle
- claim idempotency/replay
- rejection/correction
- denial deadline/appeal
- remittance matching
- revenue/Financial OS boundary
- tenant/role access
- no potential-as-realized language

## Definition of done

A real completed encounter can progress through documentation/coding/claim/payment-reconciliation states with evidence for each step, visible blockers, correct authorization and truthful user language.