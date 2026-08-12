# Klinikos ClinicOS Backend Completion Directive

Status: ACTIVE ENGINEERING DIRECTION

## Primary objective

Klinikos is primarily a clinic operating system and connected-care platform. Grid, EDU, Zumi, sales, and marketplace capabilities may support that mission, but ClinicOS is the primary product surface and backend priority.

The engineering objective is to turn the existing broad feature registry into durable, tenant-safe, auditable workflows that work without pretending external integrations are connected.

## Non-negotiable architecture

1. Deterministic domain services own clinical, billing, identity, authorization, consent, credential, and payment truth.
2. Zumi may read, summarize, draft, route, and orchestrate only through explicit tools and policy gates. It never becomes the source of clinical truth.
3. Every clinical write is attributable to an authenticated actor and organization.
4. Every consequential transition is auditable.
5. Signed/locked clinical records are append-only except through explicit amendment/addendum workflows.
6. External integrations are adapters with explicit connection state. Never represent adapter-ready as connected.
7. Every external-cost call passes commercial funding gates before vendor egress.
8. Manual fallback remains first-class for labs, imaging, eligibility, claims, referrals, documents, and other workflows while vendors are unavailable.
9. Cross-organization exchange is provenance-preserving and consent/access controlled.
10. Patient-visible release is distinct from internal clinical review.

## ClinicOS priority stack

### P0: longitudinal clinical core

Finish durable write/read/state-transition services for:
- patient identity and demographics
- insurance and guarantor context
- appointments, check-in, rooming, checkout, no-show and rescheduling
- encounters, SOAP/clinical notes, signatures, locks and addenda
- vitals
- allergies
- medications and reconciliation
- problems and diagnoses
- procedures
- orders
- referrals
- documents and forms
- tasks and follow-up
- patient portal release state

Acceptance rule: the chart timeline can reconstruct who did what, when, in which encounter, under which organization, and what became patient-visible.

### P1: closed-loop diagnostics and care coordination

Finish canonical workflows for:
- lab order -> transmission/manual fallback -> result -> abnormal/critical flags -> provider review -> patient release -> follow-up
- imaging order -> authorization state -> transmission/manual fallback -> report -> provider review -> patient release -> follow-up
- referral -> send -> receive -> accept/reject -> schedule -> complete -> consultation note -> close loop
- record request -> approve/deny -> package -> deliver -> receipt/failure -> retry/manual fallback

Use standard terminology fields where possible: LOINC for labs, RxNorm identifiers for medications, SNOMED/ICD mappings where appropriate, while preserving source values and provenance.

### P2: insurance, authorization and revenue cycle

Finish durable internal workflows for:
- insurance verification and aging
- eligibility request/result abstraction
- prior authorization requirement discovery state
- documentation requirements
- authorization request/response state
- claim preparation and validation
- CMS-1500 representation/export
- claim lifecycle and denial/appeal tracking
- payment posting and patient responsibility
- no-fault and workers compensation case linkage

External clearinghouse/payer calls remain adapter-ready until credentials/contracts exist.

### P3: interoperability spine

Build normalized adapter contracts around FHIR R4/US Core concepts and preserve room for:
- SMART on FHIR
- FHIR Bulk Data
- HL7 v2
- C-CDA
- Direct messaging
- Da Vinci CRD/DTR/PAS for prior authorization
- payer/provider access exchange

Do not require Klinikos to be a certified EHR to implement standards-aligned internal contracts. Do not claim certification.

### P4: operating intelligence

Only after P0-P3 truth paths are reliable, wire:
- front desk command center
- provider work queue
- inbox
- follow-up engine
- referral/results exception queues
- revenue recovery
- owner brief
- operating map
- automations
- Zumi orchestration

These surfaces must be projections over canonical backend state, not parallel databases of truth.

## Required backend patterns

### Domain state machines

Every consequential workflow gets explicit allowed transitions. Reject illegal transitions server-side. Important examples:
- appointment lifecycle
- encounter draft/review/signed/locked/addendum
- lab/imaging order and result lifecycle
- referral lifecycle
- prior authorization lifecycle
- claim lifecycle
- document review/release lifecycle
- consent lifecycle

### Idempotency

All external sends, imports, payments, claim operations, result ingestion, and orchestration commands require idempotency keys or equivalent replay protection.

### Provenance

Imported/shared data records source organization, source system, external identifier, received timestamp, author where known, original value, normalized value, and correction history.

### Audit

Audit records must answer actor, organization, patient/resource, action, timestamp, purpose where applicable, before/after or event metadata, and correlation/run identifier.

### Integration inbox/outbox

Use durable integration events rather than synchronous vendor assumptions. Support pending, sent, acknowledged, failed, retryable, dead-letter/manual-review states.

### Human review

Clinical drafts, result release, prescribing, prior authorization assertions, claim submission, credential decisions, and other governed actions require the appropriate human authority. Payment or AI capability never bypasses this.

## 2026 interoperability alignment

Architecture should account for the CMS interoperability/prior-authorization direction: FHIR R4, US Core/USCDI, SMART authorization, and Da Vinci CRD/DTR/PAS-style prior authorization workflows. Payer API requirements primarily begin in 2027, but Klinikos should make its internal contracts compatible now so future payer adapters do not require rewriting ClinicOS.

## Completion definition

A ClinicOS feature is not complete because a route renders. It is complete only when:
1. user and purpose are explicit;
2. interface exists;
3. durable database architecture exists;
4. permissions and tenant scope are enforced;
5. audit exists;
6. validation exists;
7. error recovery exists;
8. manual fallback exists when an external dependency can fail;
9. integration contract is explicit;
10. tests cover authorization, tenant isolation, state transitions and failure cases;
11. demo data is clearly synthetic;
12. documentation matches reality;
13. security implications are reviewed;
14. acceptance criteria pass.

## Immediate implementation order

1. Audit the existing Prisma models and APIs against P0 and close missing write/state-transition paths before creating duplicate models.
2. Complete the clinical timeline projection over existing patient/appointment/encounter/order/result/referral/document/task state.
3. Complete labs and imaging closed-loop internal workflows with manual fallback and review/release gates.
4. Complete referral closed-loop workflow and exception queue.
5. Complete insurance eligibility and prior-authorization internal abstractions, then claims lifecycle.
6. Add normalized FHIR-oriented adapter contracts and terminology/provenance fields without claiming external connectivity.
7. Wire Zumi only after deterministic services exist, as a governed orchestrator over those services.
8. Keep commercial gates in front of every variable-cost external adapter.

## Scope discipline

Do not create a new unrelated product while ClinicOS truth paths are incomplete. Do not prioritize cosmetic dashboards over missing clinical writes, lifecycle transitions, audit, consent, interoperability contracts, or revenue-cycle truth. Grid and EDU remain supported product lines, but ClinicOS receives primary backend engineering attention until the clinical operating spine is complete.