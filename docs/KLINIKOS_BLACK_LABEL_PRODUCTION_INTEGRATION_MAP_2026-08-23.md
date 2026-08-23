# Klinikos Black Label Production Integration Map

**Date:** 2026-08-23  
**Authority baseline:** `main@447ff2e6cbf617325af6b37c03eca401a5a9f79a`  
**Design authority:** `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md`

## Purpose

Preserve the exact dependency graph for the current Black Label production conversion so independently valuable design/clinical/EDU work can be reconciled without parallel theme systems, lost Claude work, stale-base bulk merges, or unverified production claims.

This document is an **integration map, not release evidence**. Every production-code tranche remains subject to exact-head executable verification and browser/mobile/accessibility QA.

## Current root

`main@447ff2e6cbf617325af6b37c03eca401a5a9f79a`

This main commit preserves the corrected Claude Design Black Label V2 authority and does not itself mean the production application has been fully converted.

## Active Black Label dependency graph

```text
main @ 447ff2e6
│
├── PR #272  THEME + AUTHENTICATED SHELL FOUNDATION
│   branch: feat/black-label-theme-shell-v1-20260823
│   head:   f7cc77772ce2dbce7f31faa092241dce878eaa8c
│   purpose: System / Marble / Obsidian single appearance authority
│   │
│   ├── PR #274  GRID SPATIAL FIELD
│   │   branch: design/grid-spatial-field-v1-20260823
│   │   head:   59af387fe589352418db38e4c4c39fa12c7223a3
│   │
│   ├── PR #275  BILLING / REVENUE INTEGRITY
│   │   branch: design/billing-revenue-integrity-v1-20260823
│   │   head:   0a90cc7739b8f9a642aa48013a218c2987a8f977
│   │
│   ├── PR #277  PATIENT PORTAL / PRIVATE HOSPITALITY
│   │   branch: design/patient-portal-private-hospitality-v1-20260823
│   │   head:   afe6f2dd21a147959e2406658addbe1a4c8e1ad1
│   │
│   └── PR #280  FRONT DESK / OPERATIVE WORKSPACE
│       branch: design/front-desk-operative-v1-20260823
│       head:   5a4b12db697a2ece6437a7316b5c6fed1f07c5fa
│
├── PR #269  CURRENT VISIT CLINICAL CONVERGENCE
│   branch: feat/current-visit-clinical-convergence-20260823
│   head:   998975e36ce41c490ff6d0395e57ca583c6366e9
│   purpose: governed vitals/handoff/lab-imaging/Close Visit substrate
│   │
│   └── PR #273  CURRENT VISIT OBJECT STAGE
│       branch: design/current-visit-object-stage-v1-20260823
│       head:   fd5b545beb33c739ed3a32f9899e5d30a297348f
│
└── PR #260  EDU WORKFORCE / INSTITUTIONAL DELIVERY
    branch: feat/edu-kentucky-rfp-ready
    head at design branch point: 682690c41ce68f3359892a190b64ef1f98b68811
    │
    └── PR #279  EDU BLACK LABEL ACADEMY
        branch: design/edu-black-label-academy-v1-20260823
        head:   1b1c1e5013ed744934a75aa21a0f7ffcf425bab4
```

## Why the graph is intentionally split

### Theme lineage

PR #272 owns the presentation substrate. Grid, Billing, Patient Portal, and Front Desk are presentation-heavy and therefore stack directly on #272 rather than each inventing a second theme provider or duplicating semantic material variables.

### Clinical lineage

PR #269 owns the continuing clinical truth from the prior Current Visit branches. PR #273 changes presentation only and therefore stacks on #269 rather than copying encounter, evidence, handoff, vitals, medication reconciliation, or Close Visit logic.

### EDU lineage

PR #260 contains the workforce/institutional EDU engine, including real sessions, attendance evidence, assessments, grading, completions, reports, and Kentucky capture work. PR #279 stacks on that authoritative implementation. When the EDU lineage reaches verified current main, its design materials should reconcile with #272 rather than create a separate permanent EDU theme provider.

## Current CI blocker

GitHub Actions is currently failing **before checkout** across unrelated exact heads.

Observed signature:

- `verify`: `steps:null`, `logs_url:null`
- `deploy-contract`: `steps:null`, `logs_url:null`
- no repository checkout
- no dependency install
- no Prisma validation
- no TypeScript
- no tests
- no lint
- no build

Fresh independent examples:

| Surface | PR | Quality run | Exact result |
| --- | ---: | ---: | --- |
| Billing | #275 | `32668504141` | both jobs `steps:null` |
| Patient Portal | #277 | `32668650087` | both jobs `steps:null` |
| EDU | #279 | `32668851293` | both jobs `steps:null` |
| Front Desk | #280 | `32668973025` | both jobs `steps:null` |

This is infrastructure unavailable, not green or red code evidence. Do not merge production tranches solely because GitHub reports them mergeable.

## Exact verification gate when runner capacity returns

For every production tranche, run against the exact PR head after latest-main reconciliation:

```bash
npx prisma validate
npx tsc --noEmit
npm test -- --run
npm run lint
npm run build
```

Also run any repository-specific security/MVP/startup gates present in the current workflow; the workflow itself remains authority for the full command list.

### Browser quality gate

At minimum inspect relevant routes at:

- 1920x1080
- 1440x900
- 1024x768
- 768x1024
- 430x932
- 390x844

Check Marble, Obsidian, keyboard, touch where relevant, reduced motion, loading/empty/partial/error/permission states, and no horizontal overflow.

## Required merge sequence

### Phase 0 — restore executable evidence

1. Restore GitHub Actions runner allocation or another trusted exact-head execution lane.
2. Do not spend repeated runs while jobs continue to return `steps:null`.
3. Re-check `main` immediately before reconciliation.

### Phase 1 — presentation substrate

1. Rebase/reconcile PR #272 onto latest `main`.
2. Execute the complete release gate against the new exact head.
3. Browser-test `/` plus at least one authenticated Marble and Obsidian route.
4. Squash-merge #272.
5. Verify the new main SHA.
6. Close PR #240 as superseded **only after** #272 is safely merged; preserve #240 history.

### Phase 2 — clinical substrate

1. Rebase/reconcile #269 onto the verified post-#272 main.
2. Resolve overlap explicitly; do not bulk merge stale clinical branches.
3. Run Prisma/type/test/lint/build plus Current Visit Golden Case evidence.
4. Merge #269 only after exact-head verification.
5. Rebase #273 onto that verified main.
6. Verify Current Visit visually and functionally; then merge #273.

### Phase 3 — independent Black Label verticals

Rebase each design vertical independently onto verified main and merge smallest-safe-first. Suggested order:

1. #280 Front Desk — narrow operational route, useful shell stress test.
2. #275 Billing — financial truth and dense-table stress test.
3. #277 Patient Portal — separate patient identity boundary and hospitality stress test.
4. #274 Grid — larger public spatial/map surface and external map runtime.

Each receives its own exact-head gate. A failure in one vertical must not block unrelated verified verticals.

### Phase 4 — EDU

PR #260 requires special treatment because its production database/schema and Prisma migration ledger have had known divergence.

Before merge:

1. Reconcile #260 onto the newest verified `main`.
2. Resolve migration-ledger drift through reviewed Prisma deployment/reconciliation; never fabricate `_prisma_migrations` rows.
3. Run the complete schema/migration/repository/test/build gate.
4. Verify institutional and Kentucky demo routes.
5. Merge #260 only after database + code truth align.
6. Rebase/reconcile #279 onto the merged EDU substrate and current Black Label theme.
7. Verify learner + instructor + mobile + synthetic-data classification before merging #279.

## Supersession rules

Do not delete useful branch history until continuing value is confirmed present in current verified main.

Known relationships:

- #272 supersedes the useful appearance intent of #240.
- #269 consolidates continuing Current Visit value from #246, #247, #255, #258, #261.
- #273 must not become `CurrentVisitV2`; the existing EncounterEditor/domain authority remains canonical.
- #279 must not become a separate LMS or EDU app shell with independent identity/grade/completion authority.

## Black Label invariants during reconciliation

Every rebase/merge must preserve:

1. **One appearance authority** — System / Light / Dark, Marble / Obsidian.
2. **No second global shell.**
3. **One existing domain authority per workflow.**
4. **Intelligence becomes interface, but AI does not become authority.**
5. **Financial truth remains evidence-backed.**
6. **Clinical signed history and Close Visit remain governed.**
7. **Grid listing/review/ranking/payment states remain distinct.**
8. **EDU AI cannot certify attendance, competence, completion, grade, licensure, or professional authority.**
9. **Patient portal exposes only authorized/released patient information.**
10. **No fake data is introduced to make a surface look populated.**
11. **No customer-visible claim outruns the underlying query/runtime truth.**
12. **No stale deep route is allowed to silently preserve a previous visual era.**

## Truth corrections already discovered during design conversion

These are product-quality findings and must not be accidentally reverted:

### Front Desk

`listAppointmentsForOrganization(session.organizationId)` is not date-scoped when called without `{from,to}`. Therefore Front Desk must not present that result as strictly `today` unless a deliberate organization-timezone date window is added. Current Black Label branch uses **Schedule readiness** and sends date-specific narrowing to `/schedule`.

### Patient Portal

The current portal dashboard does not expose governed secure messages. Patient login copy must not advertise `messages` until the workflow exists. The synthetic-data warning is appropriate for non-production seeded demo credentials, not as an unconditional production statement.

### Grid

Public browsing cannot truthfully call a participant/resource `eligible` before signed-in identity/context and hard eligibility checks exist. Public discovery may state review/publication facts, availability, location/distance and terms; governed eligibility belongs after context exists.

### Billing

Local claim workflow status is not clearinghouse evidence. `SUBMITTED`, `ACCEPTED` or similar local labels must not visually imply an externally acknowledged 837/277/835 lifecycle without authoritative evidence.

## Next product-design targets after this stack is controlled

Do not create all of these simultaneously. Use the same bounded-vertical discipline:

1. Provider workspace outside Current Visit.
2. Patient index/chart.
3. Tasks / workflow completion.
4. Messages / communications.
5. Network.
6. Insights.
7. Settings/admin remaining deep-route convergence.
8. Legal/public support routes.
9. Full route census + random deep-route audit.

## Definition of integration complete

The Black Label conversion is not complete when the homepage is beautiful or when these PRs exist.

It is complete only when:

- the relevant code is on verified current main;
- production build/start gates pass;
- deployed SHA is known;
- browser/mobile/accessibility QA passes;
- random deep routes no longer reveal stale visual systems;
- customer-visible claims match actual authoritative state;
- and the product behaves as one Klinikos operating environment rather than a collection of redesigned modules.
