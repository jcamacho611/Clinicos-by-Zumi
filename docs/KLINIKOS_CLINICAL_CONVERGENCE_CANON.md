# KLINIKOS — CLINICAL CONVERGENCE CANON

Version: `2026-08-22.1`
Status: `AUTHORITATIVE CLINICAL EXPERIENCE / ARCHITECTURE CANON`

## 1. Purpose

Klinikos clinical architecture must become more sophisticated underneath while becoming simpler for the person delivering care.

The physician or other appropriately authorized practitioner should not have to reconstruct a visit by manually navigating separate patient, encounter, lab, imaging, referral, document, coding, telemedicine, case, and billing modules.

**Current Visit is the provider-facing convergence surface.**

Modules remain governed work queues for the teams and specialists who need them. Current Visit composes authorized, minimum-necessary projections of those domain truths into one continuous encounter experience. It does not duplicate or replace the authoritative repositories behind those domains.

## 2. Canonical Current Visit sequence

The target provider sequence is:

**Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit**

This is a product journey, not a requirement that every section be expanded all the time. Progressive disclosure should keep ordinary follow-ups compact while allowing a complex specialty or case-driven visit to reveal the additional structure it needs.

### Patient Snapshot

Show only the minimum relevant patient context already authorized for the encounter, such as:

- identity / MRN and visit context;
- allergies;
- active medications;
- active problems;
- meaningful risk flags;
- coverage/case context where relevant;
- prior-visit reference;
- location/provider context.

The snapshot is not a replacement for the longitudinal chart.

### What Changed

The product should make change visible without requiring a provider to reread an entire chart.

Target comparison:

`INITIAL → PREVIOUS → TODAY`

Potential structured domains include:

- symptoms and severity;
- pain;
- range of motion;
- function and ADLs;
- examination findings;
- medication changes;
- lab and imaging events;
- therapy/treatment progression;
- work status;
- order/referral state;
- meaningful case progression.

**AI may summarize a deterministic change set; AI must not invent the change set.**

If structured comparison is not available, the UI must state that truthfully rather than presenting an AI guess as longitudinal clinical truth.

### Staff Handoff

Front desk, MA, LPN, RN, provider, coder/biller, case manager, and administrator do not need the same clinical screen.

Encounter-specific staff handoff should progressively support governed capture such as:

- reason for visit;
- vitals;
- medication/allergy reconciliation;
- symptoms and screenings;
- forms/questionnaire state;
- delegated intake work;
- body-map update where applicable;
- unresolved staff-to-provider questions.

The provider receives a concise handoff rather than recreating completed intake.

Until encounter-specific handoff persistence exists, Klinikos must not label general patient summary data as a completed staff handoff.

## 3. Existing encounter lifecycle remains authority

Clinical experience convergence must preserve the existing lifecycle and audit boundaries.

Representative state progression:

`DRAFT → READY_FOR_REVIEW → SIGNED → LOCKED`

Addenda remain separately attributable and must not overwrite the signed original.

The presentation layer may explain readiness but is not transition authority. Server-side encounter lifecycle rules remain authoritative.

Training, AI output, a Grid profile, or a template never grants clinical authority.

## 4. Orders and results converge into the visit without losing domain authority

Lab, imaging, medication, referral, procedure, and future clinical-order systems remain governed domains.

Current Visit should eventually surface the relevant part of their lifecycle:

**ordered → transmitted → accepted → performed → resulted → reviewed → communicated → closed**

External completion is never inferred from an internal UI state. An internal order record does not prove a vendor accepted it. A result record does not prove a provider reviewed it. A reviewed result does not prove the patient was notified.

Klinikos should converge these states visually while preserving their separate evidence, audit, adapter, reconciliation, and release rules.

## 5. Specialty architecture

Do not build separate incompatible EHR products for every specialty.

Target composition:

**KLINIKOS CORE + SPECIALTY PACK + ORGANIZATION CONFIG + LOCATION OVERRIDE**

A specialty pack may define or compose:

- clinical component sets;
- encounter templates;
- intake components;
- order-set defaults;
- specialty questionnaires;
- close-visit requirements;
- workflow rules;
- reports and specialty metrics.

Specialty configuration must not override authentication, tenant isolation, credential validity, clinical authority, signed-record immutability, payment truth, or external-connection truth.

No-Fault/MSK is an important stress-test specialty because it requires longitudinal symptoms, function, body mapping, treatment progression, case context, documentation and revenue continuity. It must still reuse the same underlying clinical components as ordinary musculoskeletal care rather than fork the product.

## 6. Body maps and longitudinal findings

Body-map state should become versioned clinical evidence, not an overwriteable image attachment.

Target pattern:

`INITIAL BODY MAP → VISIT N → TODAY`

Each version should be immutable after its governed clinical finalization point and should preserve structured region/laterality/finding context sufficient for deterministic comparison.

The implementation must not claim this capability before persistence and clinical review rules exist.

## 7. Telemedicine convergence

A virtual visit should use the same Current Visit architecture as an in-person visit.

Target journey:

`SCHEDULE → CURRENT VISIT → VIRTUAL READINESS / CONSENT → VIDEO SESSION → SAME ENCOUNTER → ORDERS / DOCUMENTATION / CODING → CLOSE VISIT`

The Telemedicine workspace may remain an operational queue. It must not become a second incompatible chart.

An appointment marked telemedicine does not prove live video infrastructure exists.

## 8. Clinical AI / ambient documentation

Klinikos already has governance concepts for drafts, review, audit and human authority. Ambient clinical intelligence should build on those boundaries rather than create a parallel AI chart.

Target future pipeline:

`AUDIO / DICTATION → TRANSCRIPT SEGMENTS → CLINICAL EVIDENCE → DRAFT SECTIONS → GAP ANALYSIS → CODE CANDIDATES → HUMAN REVIEW → PROVIDER SIGNATURE`

Where practical, generated clinical content should be evidence-linked so a reviewer can understand the source used to prepare a draft.

AI must never silently:

- invent an exam finding;
- change laterality;
- fabricate a diagnosis;
- claim an order occurred;
- claim a result was reviewed;
- finalize a code;
- sign a note;
- close an encounter;
- submit a claim.

## 9. Revenue integrity convergence

Clinical completion should progressively reconcile to financial completion.

Target operating chain:

**PERFORMED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → CLAIM SENT → ACCEPTED → ADJUDICATED → PAID → RECONCILED**

The engine should surface exceptions such as:

- performed/documented service without expected charge;
- signed encounter not yet coded;
- qualifying charge without claim readiness;
- claim without acceptance evidence;
- unresolved denial;
- payment without reconciliation.

This is an operational/revenue integrity graph, not permission to fabricate charges or submit unsupported claims.

## 10. Integration architecture

Klinikos internal canonical clinical models remain application truth. External standards and vendors belong at adapter boundaries.

Relevant standards may include FHIR/US Core, SMART, HL7 v2, X12, DICOM/DICOMweb, NCPDP, or vendor-specific APIs/files where required.

The application should progressively support durable integration infrastructure:

- outbox;
- inbox;
- idempotency;
- retries;
- reconciliation;
- dead-letter handling;
- interface monitoring;
- partner/environment status.

Do not describe an adapter, credential, sandbox, or internal event as a live external connection.

## 11. Role and authority convergence

Generic UI role names are not sufficient authority for regulated work.

Clinical authority should progressively incorporate the relevant combination of:

- identity;
- organization membership;
- profession;
- credential/license evidence;
- privilege;
- location assignment;
- service/capability;
- purpose/context;
- effective dates;
- supervision/delegation when required.

Owner/administrator authority is not automatic universal clinical-record authority.

MA, LPN and RN workflow scope should not remain permanently collapsed into one undifferentiated `clinical_staff` experience.

## 12. Zumi relationship to clinical truth

Zumi may:

- explain the visit state;
- summarize authorized deterministic change data;
- surface unfinished work;
- prepare drafts;
- help navigate or coordinate governed actions;
- explain why a close-visit blocker remains.

Zumi does not widen:

- authentication;
- tenant scope;
- clinical scope of practice;
- credential status;
- provider signature authority;
- result-review authority;
- patient-release authority;
- claim/payment authority.

Patient/clinical truth remains in clinical repositories and is retrieved under current authorization rather than copied indiscriminately into AI memory.

## 13. Current implementation truth for V1

As of this canon's initial implementation slice, Klinikos already has real encounter draft/review/sign/lock/addendum behavior, human-reviewed coding, patient summary data, labs, imaging, referrals, documents, audit and related workspaces.

The first Current Visit convergence slice may truthfully provide:

- Current Visit framing;
- patient snapshot from already-authorized patient DTO data;
- provider-oriented note ordering;
- deterministic required-documentation blockers;
- preserved coding/review/signature/audit behavior;
- explicit `not available` states for structured longitudinal change and encounter-specific staff handoff.

It does **not** by itself establish:

- persisted structured Clinical Change Graph;
- encounter-specific staff intake snapshot;
- versioned body maps;
- ambient clinical scribe;
- encounter-native external order transport;
- live lab/radiology/telehealth network connectivity;
- production terminology licensing;
- automated charge reconciliation;
- certified-EHR status;
- HIPAA compliance status.

## 14. Next domain slices

Recommended dependency order after the V1 presentation/projection foundation:

1. encounter-specific staff handoff / intake snapshot;
2. structured clinical component/template architecture;
3. structured longitudinal findings + Clinical Change Graph;
4. versioned body-map evidence for applicable specialties;
5. encounter-native projections of existing orders/results/referrals;
6. provider/location/profession/credential authority convergence;
7. effective-dated terminology and evidence-linked coding support;
8. revenue-integrity reconciliation;
9. ambient/evidence-linked Zumi clinical drafting after structured encounter truth stabilizes;
10. validated external integration rails.

These may be parallelized only where dependencies and schema ownership are clear.

## 15. Merge blockers

A clinical convergence change is blocked from merge if it:

- replaces server authority with frontend state;
- invents longitudinal change or staff handoff completion;
- lets AI create final clinical truth;
- weakens note signature/lock/addendum semantics;
- leaks unnecessary PHI/PII to the browser;
- duplicates a governed domain into a conflicting client-owned state;
- calls an external adapter live without runtime evidence;
- forks a specialty into an incompatible application when reusable configuration is sufficient;
- bypasses tenant/resource authorization;
- treats owner/admin as automatic unrestricted clinical authority;
- removes persistent access to governed Zumi from the authenticated application shell.

## 16. Product thesis

Klinikos should not win by cloning the navigation complexity of incumbent EHRs.

It should combine deep operational state with a simpler provider experience:

**What changed? What still needs to happen? Did the downstream system actually complete it? Did the work become appropriate financial completion?**

The defensible destination is a connected clinical, operational, integration, revenue and healthcare-relationship graph interpreted through governed Zumi intelligence while deterministic Klinikos services remain authority.
