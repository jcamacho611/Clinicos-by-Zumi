# Klinikos BodyMap + Clinical Change Foundation

Status: **FOUNDATION ONLY — NOT PERSISTED BODY-MAP FUNCTIONALITY**

Authority: doctor-defined Current Visit P0 acceptance gate (#244), current Klinikos Source of Truth / Knowledge-to-Architecture hierarchy, Clinic OS canon, and current implementation truth.

## Purpose

This foundation defines the immutable clinical domain contract for structured body-map history and deterministic longitudinal comparison. It exists so Klinikos can eventually show **initial -> previous -> today** without replacing history, inventing clinical change, or allowing AI prose to become the source of clinical truth.

This foundation **does not satisfy P0 #244 by itself**. It does not yet provide database persistence, staff authoring, Current Visit body-map UI, audit persistence, or production PHI readiness.

## Domain invariants

### Append-only history

Production implementation must use **append-only/versioned persistence**. A new encounter creates a new body-map version; it does not update a prior body map in place.

**Historical versions are never overwritten.** A prior version remains recoverable exactly as recorded, including source encounter and creator.

Signed or locked encounter history must use **amendment/addendum semantics rather than mutation** when a correction is required.

### Comparison roles are derived, not persisted

**Comparison roles are derived, not persisted.** `initial`, `previous`, and `today` describe the role an immutable version plays in a particular longitudinal comparison. They are not permanent clinical attributes of a stored BodyMap version.

A version captured as today's evidence during one encounter can become the previous evidence during a later encounter. Persisting `stage=today` or `stage=previous` as authoritative state would therefore create stale truth.

The pure domain type may carry a comparison-only role for an in-memory comparison projection, but the persistence schema must store immutable facts such as source encounter, patient, organization, capture time, creator, revision/provenance, and findings. The server composition layer derives comparison roles when it selects evidence.

PR #276 owns the encounter-level rule for identifying the eligible prior finalized encounter. BodyMap persistence must not duplicate that decision as a stored stage flag.

### Scope and provenance

Production repositories must enforce **tenant + patient + encounter scoped reads** and writes through authenticated server capabilities.

Every persisted version must preserve exact **creator and captured-at provenance**, plus patient, encounter, organization context, and audit attribution required by Klinikos policy.

Browser clients receive only the minimum-necessary BodyMap/Change DTO. They never become the authorization boundary.

The pure comparator fails closed before computing a clinical delta when:

- compared versions belong to different patients;
- a version contains duplicate structured finding keys;
- normalized symptom severity is non-finite or outside the governed scale.

These checks prevent caller bugs or ambiguous source records from manufacturing longitudinal clinical truth.

### Structured clinical identity

A finding is identified structurally by:

- body region;
- laterality;
- symptom;
- source body-map version;
- source finding identifier.

Laterality remains first-class. A left-shoulder finding is not interchangeable with a right-shoulder finding.

### Severity semantics

The BodyMap `severity` field in this foundation is a **0–10 normalized symptom-severity scale**, where **higher values mean worse severity**. Only values from 0 through 10 inclusive are valid comparison evidence.

That semantic boundary is what makes `severity_improved` and `severity_worsened` deterministic. The comparator fails closed rather than assigning clinical direction to an invalid or incompatible value.

A ROM, strength, or another structured measure is **not** BodyMap severity. Those measurements require their own typed clinical evidence with scale/unit/direction semantics and should enter the broader Clinical Change Graph as separate evidence sources. Klinikos must not reuse the BodyMap severity comparator for measurements where higher does not necessarily mean worse.

### Deterministic change

The pure comparison layer may produce only evidence-supported deltas:

- severity improved;
- severity worsened;
- severity unchanged;
- finding added;
- functional-impact changed.

**Omission is never clinical resolution.** A finding documented previously but not redrawn today is not automatically resolved, removed, improved, or absent. This remains true whether today is empty or contains unrelated findings.

The comparator therefore emits no omission-derived resolution/removal delta. A future persisted resolution workflow must require an explicit clinician-recorded state/event with provenance before Klinikos may present a finding as resolved.

Every emitted delta must carry exact source-finding evidence.

### AI boundary

**AI may explain deterministic deltas but may not create unsupported findings.**

Zumi may summarize or translate structured change after authorization. Zumi does not invent body regions, laterality, symptom presence, severity, functional improvement, resolution, or deterioration when those facts are not supported by governed clinical evidence.

## Current Visit and prior-encounter contract

The production Current Visit implementation must eventually retrieve persisted body-map versions and present:

1. initial;
2. previous;
3. today;
4. what changed;
5. source evidence.

**Current Visit consumes persisted versions, never demo constants.**

PR #276 owns the shared encounter-level rule for selecting which prior finalized encounter is eligible to act as `previous` evidence. BodyMap persistence/composition should consume that rule rather than inventing another definition of `previous` inside this domain.

The provider must be able to update today's body map without destroying the initial or previous map. Staff capture and provider review must use profession/capability-aware authorization rather than generic frontend role checks.

## Follow-on persistence dependency

PR #271 is the current-main lifelong identity and Prisma multi-file foundation. BodyMap persistence should be implemented only after that architecture is accepted/reconciled, using additive multi-file Prisma models rather than modifying stale single-file assumptions.

The persistence tranche should:

1. add additive BodyMap / BodyMapFinding persistence models that store immutable source facts, not `initial/previous/today` stage labels;
2. add explicit clinician-recorded finding lifecycle/resolution state rather than deriving resolution from omission;
3. record the scale/meaning required for any future non-severity structured measurement rather than overloading the 0–10 severity field;
4. verify migration against a disposable Neon branch cloned from production shape before production deployment;
5. implement a server-only repository with organization + patient + encounter scoping;
6. expose create-new-version commands, never update-in-place for historical versions;
7. emit auditable create/review/resolve/amend events;
8. enforce profession/capability authorization for staff capture and provider review;
9. use PR #276 for encounter-level prior-source selection;
10. wire persisted versions into Current Visit as timeline + comparison evidence after the Current Visit convergence branch is reconciled;
11. prove the synthetic No-Fault Golden Case in UI and DB-backed journey tests;
12. extend broader Clinical Change with PT progression, imaging/results, ADL/function, work status, and other evidence sources without conflating them with BodyMap itself.

## Golden Case

Initial:
- left shoulder pain severity 8;
- no dizziness.

Previous:
- left shoulder pain severity 6;
- no dizziness.

Today:
- left shoulder pain severity 6;
- newly documented dizziness.

Expected deterministic output:
- initial -> previous: left-shoulder severity improved 8 -> 6;
- previous -> today: left-shoulder severity unchanged 6 -> 6;
- previous -> today: dizziness finding added;
- every delta includes supporting evidence references;
- no unsupported resolution, laterality, or clinical-change inference;
- cross-patient or structurally ambiguous comparisons fail closed.

## Non-claims

This document does **not** claim:

- body maps are persisted in production;
- doctor-defined Current Visit is complete;
- No-Fault longitudinal workflow is complete;
- PHI production readiness is complete;
- AI ambient documentation is complete;
- production lab, imaging, clearinghouse, or other external rails are live.

Those statuses remain governed by current implementation/runtime evidence, FEATURE_STATUS, EXTERNAL_DEPENDENCY_MATRIX, and P0 acceptance evidence.
