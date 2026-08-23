# Klinikos BodyMap + Clinical Change Foundation

Status: **FOUNDATION ONLY — NOT PERSISTED BODY-MAP FUNCTIONALITY**

Authority: doctor-defined Current Visit P0 acceptance gate (#244), Klinikos Knowledge-to-Architecture Ledger, Clinic OS canon, and current implementation truth.

## Purpose

This foundation defines the immutable clinical domain contract for structured body-map history and deterministic longitudinal comparison. It exists so Klinikos can eventually show **initial -> previous -> today** without replacing history, inventing clinical change, or allowing AI prose to become the source of clinical truth.

This foundation **does not satisfy P0 #244 by itself**. It does not yet provide database persistence, staff authoring, Current Visit body-map UI, audit persistence, or production PHI readiness.

## Domain invariants

### Append-only history

Production implementation must use **append-only/versioned persistence**. A new encounter creates a new body-map version; it does not update the prior body map in place.

**Historical versions are never overwritten.** A prior version remains recoverable exactly as recorded, including the source encounter and creator.

Signed or locked encounter history must use **amendment/addendum semantics rather than mutation** when a correction is required.

### Scope and provenance

Production repositories must enforce **tenant + patient + encounter scoped reads** and writes through authenticated server capabilities.

Every persisted version must preserve exact **creator and captured-at provenance**, plus the patient, encounter, organization/tenant context, and audit attribution required by Klinikos policy.

Browser clients receive only the minimum-necessary BodyMap/Change DTO. They never become the authorization boundary.

### Structured clinical identity

A finding is identified structurally by:

- body region;
- laterality;
- symptom;
- the source body-map version and source finding identifier.

Laterality remains first-class. A left-shoulder finding is not interchangeable with a right-shoulder finding.

### Deterministic change

The current pure comparison layer may produce:

- severity improved;
- severity worsened;
- severity unchanged;
- finding added;
- finding removed only when a non-empty current map provides evidence of an updated map state;
- functional-impact changed.

An entirely empty current map is insufficient evidence that every prior finding resolved or disappeared. It therefore produces no removal inference.

Every emitted delta must carry source evidence references. A genuine removal must cite both the prior finding and the current map version that establishes the later map state.

### AI boundary

**AI may explain deterministic deltas but may not create unsupported findings.**

Zumi may summarize or translate structured change after authorization. Zumi does not invent body regions, laterality, symptom presence, severity, functional improvement, resolution, or deterioration when those facts are not supported by governed clinical evidence.

## Current Visit contract

The production Current Visit implementation must eventually retrieve persisted body-map versions and present the clinically useful sequence:

1. initial;
2. previous;
3. today;
4. what changed;
5. source evidence.

**Current Visit consumes persisted versions, never demo constants.**

The provider must be able to update today’s body map without destroying the initial or previous map. Staff capture and provider review must use profession/capability-aware authorization rather than generic frontend role checks.

## Follow-on persistence tranche after PR #245

Once the multi-file Prisma foundation from #245 is merged and current:

1. add additive BodyMap / BodyMapFinding persistence models in the multi-file schema layout;
2. verify the migration against a disposable Neon branch cloned from the production-shape database before any production deployment;
3. implement a server-only repository with organization + patient + encounter scoping;
4. expose a create-new-version command; do not expose update-in-place for historical versions;
5. emit auditable create/review/amend events;
6. implement profession/capability authorization for staff capture and provider review;
7. wire persisted versions into Current Visit as timeline + compare surfaces;
8. prove the synthetic No-Fault Golden Case in UI and DB-backed journey tests;
9. extend the broader Clinical Change Graph with PT progression, imaging/results, ADL/function, work status, and other evidence sources without conflating them with BodyMap itself.

## Golden Case locked by this foundation

Initial:
- left shoulder pain severity 8;
- no dizziness.

Previous:
- left shoulder pain severity 6;
- no dizziness.

Today:
- left shoulder pain severity 6;
- new dizziness documented.

Expected deterministic output:
- initial -> previous: left-shoulder severity improved 8 -> 6;
- previous -> today: left-shoulder severity unchanged 6 -> 6;
- previous -> today: dizziness finding added;
- every delta includes supporting evidence references;
- no unsupported resolution, laterality, or clinical-change inference.

## Non-claims

This document does **not** claim:

- body maps are persisted in production;
- the doctor-defined Current Visit is complete;
- No-Fault longitudinal workflow is complete;
- PHI production readiness is complete;
- AI ambient documentation is complete;
- production lab, imaging, clearinghouse, or other external rails are live.

Those statuses remain governed by current implementation/runtime evidence, FEATURE_STATUS, EXTERNAL_DEPENDENCY_MATRIX, and the P0 acceptance issues.