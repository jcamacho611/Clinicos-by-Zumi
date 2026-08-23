# BodyMap + Clinical Change Foundation Implementation Plan

> **Execution status:** implemented on PR #248 through the pure-domain foundation. Full repository release verification remains externally blocked because GitHub-hosted jobs are not being assigned a runner.

**Goal:** Build the first immutable, evidence-aware BodyMap and longitudinal Clinical Change domain foundation required by doctor-defined Current Visit P0 #244, without fake persistence or collision with PR #245's Prisma multi-file work.

**Architecture:** A pure clinical domain layer represents immutable body-map versions and computes evidence-linked `initial -> previous -> today` deltas deterministically. This tranche deliberately does **not** persist body maps and does **not** claim Current Visit completion.

**Authority:** `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`, `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md`, P0 #244, and current implementation truth.

## Safety correction that supersedes the original draft

The initial plan contemplated a `finding_removed` delta when a prior finding was omitted from a later map. Clinical review found that unsafe: a clinician can document a new finding without redrawing every prior finding. Therefore:

- **Omission is never clinical resolution.**
- An empty current map produces no resolution/removal inference.
- A non-empty current map that omits a prior finding also produces no resolution/removal inference.
- Resolution, when added in the persistence tranche, must be an explicit clinician-recorded structured state/event with provenance and authorization.
- `BodyMapDeltaKind` intentionally contains no omission-derived removal state.

## Global constraints

- Preserve encounter, signing, addendum, coding, tenant, audit, and provider authority.
- No database migration in this tranche.
- Historical body-map versions are immutable facts.
- Comparison never mutates inputs.
- Every emitted delta cites exact source finding/version evidence.
- AI does not infer clinical deltas in this layer.
- Laterality and body region are first-class.
- Missing prior/current observation means unknown/no-comparison, never improvement or resolution.
- No browser claim that persisted body-map history exists until real persistence is wired.

## Task status

### Task 1 — Immutable BodyMap domain contract

- [x] Define `BodyLaterality`, `BodyMapStage`, `BodyMapFinding`, `BodyMapVersion`, `BodyMapEvidenceRef`, `BodyMapDeltaKind`, and `BodyMapDelta`.
- [x] Keep the contract persistence-agnostic and AI-agnostic.
- [x] Keep exact source finding references in emitted evidence.

### Task 2 — Deterministic evidence-linked comparison

- [x] Stable key from normalized body region + laterality + symptom.
- [x] `severity_improved`, `severity_worsened`, `severity_unchanged`.
- [x] `finding_added` for newly documented findings.
- [x] `functional_impact_changed` when the same structured finding changes function.
- [x] No mutation of historical versions.
- [x] No omission-derived resolution/removal inference.

### Task 3 — Doctor-defined Golden Case

- [x] Initial left-shoulder pain 8.
- [x] Previous left-shoulder pain 6.
- [x] Today left-shoulder pain 6 plus newly documented dizziness.
- [x] Lock 8 → 6 improvement, 6 → 6 unchanged, and dizziness added.
- [x] Require supporting evidence references on every emitted delta.

### Task 4 — Persistence / Current Visit follow-on contract

- [x] Lock append-only/versioned persistence.
- [x] Lock tenant + patient + encounter scoped server access.
- [x] Lock historical non-overwrite and creator/captured-at provenance.
- [x] Lock amendment/addendum semantics rather than mutation.
- [x] Lock `initial -> previous -> today` retrieval semantics.
- [x] Lock Current Visit to persisted versions, never demo constants.
- [x] Lock Zumi/AI to explanation of governed evidence, never unsupported findings.
- [x] State explicitly that this foundation alone does not satisfy P0 #244.

## Fresh focused verification evidence

The exact branch source blobs were reconstructed and their Git blob hashes matched the GitHub branch:

- `src/lib/clinical/body-map-types.ts` → `e616c90acc61c61d8806b8b1524a16f652dd5a93`
- `src/lib/clinical/body-map-change.ts` → `89cb4340a471b28dac2b8fa02b26740b05ebbd5b`

Using TypeScript 5.8.3, the exact source files compiled under strict settings and focused executable assertions passed for:

- 8 → 6 severity improvement;
- 6 → 6 unchanged severity;
- new dizziness finding;
- evidence cardinality;
- empty-current anti-inference;
- non-empty omission anti-inference;
- historical input immutability.

This is **focused domain verification only**, not a substitute for the repository's full release gate.

## Remaining external merge gate

Before this PR can be called release-green or merged under repository law:

- [ ] restore executable GitHub Actions runner allocation / Actions billing quota;
- [ ] run exact-head `npx vitest run tests/body-map-change.test.ts` in the repository checkout;
- [ ] run `npm run type-check`;
- [ ] run `npm run lint`;
- [ ] run the repository Quality/release gate including migrations, build, startup, security, and MVP journeys;
- [ ] reconcile latest `main` immediately before merge.

Do not weaken or bypass these gates.

## Follow-on after PR #245 lands

1. add additive multi-file Prisma `BodyMap` / `BodyMapFinding` persistence models;
2. verify migration on a disposable Neon branch cloned from production shape;
3. implement server-only tenant/patient/encounter repository;
4. expose create-new-version and explicit-resolution commands, never historical update-in-place;
5. emit auditable create/review/amend/resolve events;
6. enforce profession/capability authorization;
7. wire persisted versions into Current Visit timeline/compare UI;
8. prove the synthetic No-Fault Golden Case in DB-backed journeys;
9. extend Clinical Change with PT progression, results, ADL/function, and work status as separate evidence sources.
