# Klinikos BodyMap + Clinical Change Foundation

Status: **BACKEND PERSISTENCE IMPLEMENTED ON FEATURE BRANCH — NOT YET MERGED OR PRODUCTION-DEPLOYED**

Authority: doctor-defined Current Visit P0 acceptance gate (#244), current Klinikos Source of Truth / Knowledge-to-Architecture hierarchy, Clinic OS canon, and current implementation truth.

## Purpose

This foundation defines the immutable clinical domain contract for structured body-map history and deterministic longitudinal comparison. It exists so Klinikos can show **initial -> previous -> today** without replacing history, inventing clinical change, or allowing AI prose to become the source of clinical truth.

The current feature branch implements the backend persistence substrate: additive BodyMap version/finding schema, migration, deterministic input validation, append-only server repository, explicit amendment lineage, explicit finding state, governed capture-source codes, bounded audit events, and scoped read DTOs. The final migration has been exercised successfully on a disposable Neon branch cloned from the production-shaped database and that branch was deleted without applying changes to production.

This work **does not satisfy P0 #244 by itself**. It does not yet provide staff/provider BodyMap authoring UI, profession/capability action wiring, Current Visit BodyMap presentation, persisted-to-comparator composition, broader Clinical Change aggregation, or production PHI approval.

## Domain invariants

### Append-only history

BodyMap persistence is **append-only/versioned**. This append-only/versioned persistence is the contract: a new capture creates a new BodyMap version. A new capture creates a new BodyMap version; it does not update a prior BodyMap in place.

**Historical versions are never overwritten.** A prior version remains recoverable exactly as recorded, including source encounter and creator provenance.

Signed or locked encounter history requires **amendment/addendum semantics rather than mutation**. The server repository refuses an ordinary new BodyMap capture against a finalized encounter unless explicit amendment lineage is provided.

### Comparison roles are derived, not persisted

**Comparison roles are derived, not persisted.** `initial`, `previous`, and `today` describe the role an immutable version plays in a particular longitudinal comparison. They are not permanent clinical attributes of a stored BodyMap version.

A version captured as today's evidence during one encounter can become the previous evidence during a later encounter. Persisting `stage=today` or `stage=previous` as authoritative state would create stale truth.

The persisted schema stores immutable facts such as source encounter, patient, organization, capture time, creator, amendment provenance, and findings. The server composition layer must derive comparison roles when it selects evidence.

The merged prior-encounter selector from PR #276 owns the encounter-level rule for identifying the eligible prior finalized encounter. BodyMap persistence does not duplicate that decision as a stored stage flag.

### Scope and provenance

The BodyMap repository is server-only and uses **tenant + patient + encounter scoped reads**. Its write transaction verifies:

- active patient belongs to the organization;
- encounter belongs to the organization;
- encounter patient matches the requested patient;
- active actor belongs to the organization;
- amendment source, when supplied, belongs to the same organization, patient, and encounter.

Every persisted version preserves exact creator and captured-at provenance, plus patient, encounter, organization, governed source, and optional amendment lineage.

BodyMap capture sources are machine-governed values only:

- `clinical_capture`;
- `staff_intake`;
- `provider_review`;
- `structured_import`.

Free-text source values are rejected by deterministic validation and by the PostgreSQL enum. This keeps narrative or PHI-like prose out of a field that is also copied into bounded audit metadata.

A BodyMap version must contain at least one explicit finding. An empty version is rejected because omission has no resolution meaning.

Materially future-dated evidence is rejected. The deterministic validator allows no more than five minutes of clock skew beyond the validation clock so future timestamps cannot silently reorder longitudinal evidence.

Audit events are written in the same database transaction as the BodyMap version. Audit metadata records bounded provenance such as actor, encounter, finding count, governed source, and amendment reference; it does not duplicate the clinical finding payload into audit metadata.

Browser clients are not part of this persistence tranche. Future clients must receive only minimum-necessary BodyMap/Change DTOs and must never become the authorization boundary.

### Structured clinical identity

A finding is identified structurally by:

- body region;
- laterality;
- symptom;
- source BodyMap version;
- source finding identifier.

The persistence layer stores a deterministic normalized `findingKey` and enforces uniqueness within a single immutable BodyMap version. Identity normalization applies Unicode NFKC normalization, collapses whitespace, trims, and normalizes case before constructing the key so visually equivalent findings cannot bypass duplicate detection through width/case/spacing variations.

Laterality remains first-class. A left-shoulder finding is not interchangeable with a right-shoulder finding.

### Severity semantics

The BodyMap `severity` field is a **0–10 normalized symptom-severity scale**, where **higher values mean worse severity**. Persistence accepts only whole-number values from 0 through 10 inclusive or null.

This is enforced twice:

1. deterministic TypeScript validation before the write transaction;
2. a PostgreSQL check constraint in the migration.

A finding explicitly marked `resolved` may carry only severity `0` or null. Contradictory resolved state with nonzero severity is rejected by both application validation and PostgreSQL.

The final disposable Neon proof confirmed that severity `11` and `resolved + severity 6` are rejected by PostgreSQL itself.

A ROM, strength, or another structured measure is **not** BodyMap severity. Those measurements require their own typed clinical evidence with scale/unit/direction semantics and should enter the broader Clinical Change Graph as separate evidence sources. Klinikos must not reuse the BodyMap severity comparator for measurements where higher does not necessarily mean worse.

### Explicit finding state and omission safety

Persisted findings can explicitly record `active` or `resolved` state.

**Omission is never clinical resolution.** A finding documented previously but absent from a later BodyMap is not automatically resolved, removed, improved, or absent.

A resolution exists only when a clinician-authorized workflow records that state in a new immutable version with provenance. The persistence layer can store this explicit evidence; the Current Visit/comparator presentation of resolved state is a later composition task and must remain evidence-backed.

### Deterministic change

The pure comparison layer may produce only evidence-supported deltas:

- severity improved;
- severity worsened;
- severity unchanged;
- finding added;
- functional-impact changed.

Every emitted delta carries exact source-finding evidence. The persistence work does not change the comparator into an AI or heuristic system.

The pure comparator continues to fail closed when:

- compared versions belong to different patients;
- a version contains duplicate structured finding keys;
- normalized symptom severity is non-finite or outside the governed scale.

### AI boundary

**AI may explain deterministic deltas but may not create unsupported findings.**

Zumi may summarize or translate structured change after authorization. Zumi does not invent body regions, laterality, symptom presence, severity, functional improvement, resolution, deterioration, amendment lineage, or encounter completion when those facts are not supported by governed clinical evidence.

## Current persistence implementation

Feature-branch implementation consists of:

- `prisma/models/clinical-body-map.prisma`
  - immutable `BodyMapVersion`;
  - immutable child `BodyMapFinding`;
  - `BodyMapLaterality`;
  - `BodyMapFindingState`;
  - `BodyMapCaptureSource`;
  - no persisted `initial/previous/today` field.
- `prisma/migrations/20260823200000_body_map_persistence_v1/migration.sql`
  - additive tables/enums/indexes;
  - severity and resolved-state check constraints;
  - governed capture-source enum;
  - restrictive amendment lineage;
  - child findings cascade only with their owning BodyMap version.
- `src/lib/clinical/body-map-persistence.ts`
  - deterministic Unicode/whitespace identity normalization and validation;
  - governed capture-source validation;
  - empty-version rejection;
  - material future-time rejection with bounded clock skew;
  - duplicate identity rejection;
  - explicit resolved/severity consistency;
  - malformed runtime payload fail-closed behavior;
  - deliberate persisted DTO types.
- `src/lib/repositories/body-map-repository.ts`
  - server-only append-only writes;
  - transactional provenance validation;
  - finalized-encounter amendment guard;
  - same-transaction audit event;
  - tenant-scoped explicit-select reads;
  - deterministic latest ordering by captured time then created time;
  - no update/delete API for historical BodyMap rows.

## Final disposable Neon migration proof

The final exact migration was applied to temporary branch:

- project: `ClinicOS Production`;
- temporary branch name: `body-map-persistence-v1-final-proof-20260823`;
- temporary branch id: `br-icy-wave-athu3nht`;
- parent: production-shaped branch `br-ancient-term-atolp7vw`.

Observed after migration and before synthetic BodyMap data:

- legacy patients: 6;
- legacy encounters: 4;
- legacy users: 5;
- capture-source enum: clinical_capture/staff_intake/provider_review/structured_import;
- resolved-severity check present: 1;
- existing severity check present;
- BodyMap amendment/finding ownership constraints created by the migration.

Synthetic-only proof then confirmed:

- a `provider_review` BodyMap version can be inserted;
- active left-shoulder pain severity 6 can be inserted;
- explicit resolved right-shoulder pain severity 0 can be inserted;
- free-text capture source is rejected by PostgreSQL;
- active severity 11 is rejected by PostgreSQL;
- resolved severity 6 is rejected by PostgreSQL;
- legacy counts remain exactly 6 patients / 4 encounters / 5 users.

The temporary branch was then deleted. **No migration or synthetic data was applied to production.**

Earlier disposable proofs were superseded by this final proof after the capture-source and resolved-severity constraints were added.

## Current Visit and prior-encounter contract

The production Current Visit implementation must retrieve persisted BodyMap versions and ultimately present:

1. initial;
2. previous;
3. today;
4. what changed;
5. source evidence.

**Current Visit consumes persisted versions, never demo constants.**

The merged PR #276 selector determines which prior finalized encounter is eligible to act as `previous` evidence. The next composition tranche should use that selector, retrieve the appropriate persisted BodyMap versions under server authorization, and pass only deliberate comparison DTOs to the deterministic comparator.

The provider must be able to record today's BodyMap without destroying the initial or previous map. Staff capture and provider review must use profession/capability-aware authorization rather than generic frontend role checks.

## Follow-on work

The next bounded tranches are:

1. add governed staff/provider authoring actions with profession/capability checks;
2. project persisted BodyMap records into comparison-only `initial / previous / today` DTOs using merged PR #276 prior-encounter selection;
3. wire Current Visit timeline + What Changed presentation to real persisted evidence;
4. prove the synthetic No-Fault Golden Case through DB-backed journey tests and UI;
5. extend the wider Clinical Change Graph with PT progression, imaging/results, ADL/function, work status, and other typed evidence sources without conflating them with BodyMap severity;
6. enable production PHI only after the separate production environment/security gate is satisfied.

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

- this feature branch is merged to main;
- the BodyMap migration has run in production;
- Current Visit BodyMap authoring/presentation is complete;
- No-Fault longitudinal workflow is complete;
- profession/capability authoring authorization is wired;
- physician validation is complete;
- PHI production readiness is complete;
- AI ambient documentation is complete;
- production lab, imaging, clearinghouse, or other external rails are live.

Those statuses remain governed by current implementation/runtime evidence, FEATURE_STATUS, EXTERNAL_DEPENDENCY_MATRIX, the release gate, and P0 acceptance evidence.
