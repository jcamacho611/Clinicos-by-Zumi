# Persisted BodyMap Longitudinal Composition Design

**Status:** Approved direction under founder-granted execution authority; implementation not yet started.

**Goal:** Convert governed persisted BodyMap evidence into deterministic comparison-only `initial / previous / today` clinical projections and evidence-backed deltas without allowing AI, omission, drafts from unrelated encounters, or stale comparison labels to become clinical authority.

## Scope

This tranche creates the server-side/pure-domain bridge between the merged BodyMap persistence substrate and the existing BodyMap comparator.

It does **not** add Current Visit UI, mutation routes, provider authorization UI, AI summaries, production migration execution, or external integrations.

## Authority hierarchy

1. persisted BodyMap versions/findings are source evidence;
2. merged `selectPreviousFinalizedEncounter(...)` is the sole authority for the encounter that may serve as `previous`;
3. comparison roles are derived in memory and never persisted;
4. deterministic comparator creates supported deltas;
5. Zumi may later explain those deltas but cannot create or alter them.

## Design choice

### Recommended approach: one deterministic composition layer

Create a pure composition module that accepts:

- current encounter reference;
- candidate encounter references;
- persisted BodyMap versions already scoped to the same organization/patient.

The composer selects and projects evidence. Database loading remains a server repository concern. This separation lets selection/comparison logic be exhaustively tested without a database and prevents ORM records from becoming the domain interface.

Alternative rejected: make the repository directly return `initial / previous / today`. This would mix database retrieval with clinical comparison semantics and make the source-selection law harder to test independently.

Alternative rejected: have Zumi infer which historical BodyMap matters. That would move clinical authority into model output and violate the clinical canon.

## Stage semantics

### Today

`today` is the latest persisted BodyMap version for the current encounter, selected deterministically by:

1. `capturedAt DESC`;
2. `createdAt DESC` as tie-breaker.

The current encounter may still be draft/ready for review because today's working clinical evidence belongs to the active encounter.

If the current encounter has no persisted BodyMap version, `today` is explicitly unavailable.

### Previous

`previous` is derived in two steps:

1. call the merged `selectPreviousFinalizedEncounter(...)` against the current encounter and candidate encounter references;
2. select the latest persisted BodyMap version associated with that exact encounter.

No other historical encounter can silently substitute for the selected previous encounter. If the selected prior finalized encounter has no BodyMap evidence, `previous` is unavailable even if an older encounter has a BodyMap. This prevents changing the meaning of “previous.”

### Initial

`initial` is the earliest persisted BodyMap version attached to an eligible finalized encounter that occurred before the current encounter.

Eligibility uses the same finalized status vocabulary as the previous-encounter authority: Signed, Locked, Addendum Needed.

Selection is deterministic by:

1. encounter service date ascending;
2. BodyMap `capturedAt ASC`;
3. BodyMap `createdAt ASC` as tie-breaker.

If the earliest historical eligible BodyMap is the same version selected as `previous`, the projection may expose both role references for presentation, but the delta engine must not generate a meaningless initial→previous comparison against the same version.

If no eligible historical BodyMap exists, `initial` is unavailable. Today's first-ever capture is not relabeled as historical baseline in this tranche.

## Persisted-to-domain projection

Persisted findings are projected into comparison findings with:

- finding id;
- body region;
- laterality;
- symptom;
- severity;
- explicit clinical state;
- functional impact;
- annotations.

Persistence-only fields such as raw sourceObservation do not enter the comparator unless a later typed evidence contract explicitly needs them.

Projection must fail closed on invalid timestamps, patient mismatch, encounter mismatch, duplicate finding identities, or unsupported persisted clinical state.

## Explicit resolution

The comparison-domain `BodyMapFinding` gains required `clinicalState: "active" | "resolved"`.

The delta vocabulary gains `finding_resolved`.

A `finding_resolved` delta is emitted only when:

- the previous version contains the same structured finding as `active`;
- the current version contains that same structured finding explicitly as `resolved`.

Its evidence contains both prior and current finding references.

When explicit resolution is emitted, resolution dominates that finding for that comparison. The comparator does not additionally emit `severity_improved` merely because resolved severity is `0`, avoiding duplicate clinical messaging.

A current resolved finding with no matching prior active finding does not create a longitudinal resolution delta. It remains explicit source evidence, but there is insufficient comparative evidence to assert a transition.

A missing current finding never emits resolution.

## Normalized finding identity

The comparator and persistence layer must use semantically equivalent normalization:

- Unicode NFKC;
- whitespace collapse;
- trim;
- lowercase;
- laterality preserved as a first-class identity segment.

This prevents persistence from accepting one normalized identity while the comparator treats the same finding as different.

## Composition output

The pure composer returns a deliberate object shaped conceptually as:

- `status`: `available | partial | unavailable`;
- `initial`: projected BodyMap version or null;
- `previous`: projected BodyMap version or null;
- `today`: projected BodyMap version or null;
- `initialToPrevious`: deterministic deltas or empty;
- `previousToToday`: deterministic deltas or empty;
- `availability`: explicit reason codes per missing stage.

Recommended reason vocabulary:

- `today_not_captured`;
- `no_prior_finalized_encounter`;
- `previous_body_map_not_captured`;
- `no_initial_historical_body_map`;
- `invalid_evidence`.

The output carries no AI prose.

## Error handling

Fail closed with a structured invalid-evidence result rather than manufacturing deltas when:

- any supplied BodyMap belongs to another patient or organization context supplied by the caller;
- a BodyMap claims an encounter id inconsistent with the selected stage;
- timestamps are invalid;
- duplicate normalized finding identities exist;
- clinical state is unsupported;
- severity violates the governed 0–10/null contract;
- resolved findings contradict the persistence invariant.

Absence is not an error. Missing evidence produces availability reason codes and partial/unavailable status.

## Repository interaction

No raw browser access is introduced.

A later server loader may call existing repositories to obtain:

- the current encounter;
- patient encounter history;
- patient BodyMap timeline.

It then passes deliberate references/DTOs into the pure composer. The pure composer itself does not import Prisma or `db`.

## Current Visit integration boundary

This tranche stops before UI integration.

A follow-on Current Visit change may consume the composition output and replace the static `change.status = "not_available"` only when deterministic evidence is actually available.

The UI must show source/evidence affordances and explicit unavailable states rather than hiding gaps.

## Tests

Test-first coverage must include:

1. exact previous encounter comes from `selectPreviousFinalizedEncounter`;
2. previous does not fall back to an older BodyMap when the selected previous encounter lacks one;
3. latest BodyMap for today is deterministic;
4. earliest eligible historical BodyMap becomes initial;
5. initial and previous same-version case generates no self-comparison delta;
6. 8→6 produces severity improved;
7. 6→6 produces severity unchanged;
8. new dizziness produces finding added;
9. explicit active→resolved produces exactly one `finding_resolved` delta with two evidence refs;
10. omission produces no resolution;
11. resolved without prior active does not manufacture a transition;
12. Unicode-equivalent keys cannot bypass identity matching;
13. cross-patient/encounter evidence fails closed;
14. missing today / previous / initial produce explicit availability reason codes;
15. input objects remain immutable.

## Non-goals / non-claims

This design does not claim:

- BodyMap production migration has run;
- Current Visit UI is complete;
- provider/staff mutation authorization is complete;
- production PHI readiness;
- Zumi clinical reasoning authority;
- full P0 #244 completion.

## Follow-on sequence

1. implement this pure composition + explicit resolution delta;
2. add server-only loader using existing scoped repositories;
3. wire Current Visit What Changed to the deterministic output;
4. add profession/capability-governed authoring;
5. run DB-backed synthetic No-Fault Golden Case;
6. extend the Clinical Change Graph with other typed evidence domains.
