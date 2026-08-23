# Kentucky EDU Main-Synchronization Gate — 2026-08-23

Status: **engineering/capture gate**. This document records current branch-divergence facts and the minimum checks required before the Kentucky EDU work can be merged. It is not a product-readiness or compliance certification.

## Current verified refs

- Current `main`: `4638b33e90a4eb0fba5230138d65c61d79c32829`
- PR #230 head (`feat/edu-institutional-workforce-impl`): `e0732bd4d6aa7f94ab173ffc17ccf281ca9ad667`
- PR #231 head (`capture/kentucky-ai-literacy-foundation`): `01bf71c25be322de1143475dcf7cdd82cef44323`
- Common merge base for both EDU branches: `0a5b56112a4ff9d0090a8cb00264925cb74d82c2`

## Divergence

GitHub comparison against current `main` shows:

- PR #230: **14 commits ahead / 32 commits behind** current `main`.
- PR #231: **2 commits ahead / 32 commits behind** current `main`.

The 32 commits added to `main` since the EDU branches split include material changes to legal/protected-access architecture, session/auth behavior, clinical convergence, persisted patient-vitals truth, remote-observation consent handling, source-of-truth/canon documents, and repository-wide governance tests.

## Direct file-overlap finding

A file-level compare of the 32 new `main` commits against PR #230's changed files shows **no direct path overlap** with the Kentucky/EDU files changed by PR #230. PR #231 adds only:

- `src/lib/edu/workforce-ai-literacy.ts`
- `src/lib/edu/workforce-ai-literacy.test.ts`

and likewise has no direct path overlap with the 32 new `main` files.

This lowers mechanical merge-conflict risk, but it does **not** remove semantic integration risk. The new `main` work changes cross-domain authority, legal-access, authentication, clinical-truth, consent, and architecture contracts that EDU code must continue to respect.

## Required synchronization gate before merge

Do not merge either EDU branch solely because GitHub reports it mergeable.

Before merge:

1. Update each EDU branch against current `main` without discarding either branch's truthful product boundaries.
2. Review all resulting diffs for accidental authority widening, especially around:
   - authentication/session state;
   - legal/protected-access gates;
   - tenant/institution/cohort separation;
   - synthetic EDU data versus real clinical records;
   - instructor authority over grading/completion/competency;
   - AI authority versus deterministic policy;
   - patient/participant consent and privacy boundaries.
3. Confirm the Kentucky `Programs` surface does not bypass new legal/auth/session rules.
4. Confirm no EDU route imports or serializes clinical patient data for ordinary training use.
5. Confirm PR #231's reusable AI-literacy layer remains curriculum definition only and does not imply automated teaching, automated grading, automated certification, or completed non-healthcare curricula.
6. Run the complete exact-head release gate after synchronization. A `mergeable` state is insufficient evidence.
7. If GitHub Actions again fails before checkout (`steps=null` / no runner), record that infrastructure condition separately and obtain equivalent local exact-head verification before any merge decision.

## Proposal/capture consequence

Until synchronization and exact-head verification are complete, proposal language should distinguish:

- **current mainline product truth**;
- **implemented but unmerged EDU branch capability**;
- **planned/configurable Kentucky implementation work**.

Do not describe PR #230 or PR #231 capability as production-live merely because the code exists on an open branch.

## Current procurement truth that must remain preserved during synchronization

The SCWDB proposal still requires:

- both Service A and Service B;
- all five occupational pathways;
- live remote plus in-person capacity;
- representative slides, participant activity, assessment items, certificate/badge example, and instructor guide;
- responsible AI boundaries including verification, privacy, cybersecurity, confidentiality, employer policy, and human review;
- administrative/financial capacity;
- at least three years of relevant organizational experience, subject to the still-pending interpretation of how key-personnel/subcontractor experience may count;
- truthful completion evidence sufficient for participant-level invoicing and audit;
- pricing that remains viable without assuming the approximately 980-person planning target is guaranteed.

The synchronization work must strengthen the reusable institutional EDU product without weakening any of those capture truths.