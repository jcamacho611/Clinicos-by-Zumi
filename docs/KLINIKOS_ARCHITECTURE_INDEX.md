# KLINIKOS Architecture & Source-of-Truth Index

Status: `AUTHORITATIVE INDEX`  
Date: 2026-08-16

This file tells humans and agents where to look. It is navigation, not a competing implementation ledger.

## Precedence

When sources conflict, use this order:

1. **Current repository implementation, schema, migrations, tests, exact-head CI and verified runtime evidence** for what exists now.
2. `docs/SOURCE_OF_TRUTH.md` for current operating law.
3. `docs/KLINIKOS_ECOSYSTEM_CANON.md` for newest ecosystem/wiring/lifecycle direction.
4. `docs/KLINIKOS_DESIGN_AND_WIRING_CANON.md` for newest frontend/reference/wiring acceptance law.
5. `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md` for current commercial/pricing architecture.
6. `docs/FEATURE_STATUS.md` for capability status.
7. `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for external connection/gate truth.
8. `docs/MVP_JOURNEYS.md` for end-to-end proof contracts.
9. Current specialist specifications.
10. Constitution/Master Canon for deeper invariants not superseded above.
11. Legacy briefs, stale pricing estimates, old PR bodies and old brand hierarchy as history only.

A more detailed old document does not outrank a newer authoritative correction.

## Required read order before major implementation

1. Fetch latest `main`, open PRs, relevant branches and CI.
2. Read `SOURCE_OF_TRUTH.md`.
3. Read `KLINIKOS_ECOSYSTEM_CANON.md`.
4. For frontend work read `KLINIKOS_DESIGN_AND_WIRING_CANON.md`.
5. For pricing/commercial work read `KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`.
6. Read `FEATURE_STATUS.md` and relevant code/tests before claiming something is built.
7. Read `EXTERNAL_DEPENDENCY_MATRIX.md` before claiming an external rail is connected.
8. Read the relevant specialist spec and journey evidence.
9. Resolve conflicts explicitly rather than silently choosing old material.

## Current canonical thesis

Klinikos is the operating and opportunity infrastructure for the healthcare lifecycle. It connects education, careers, clinic operations, patient demand, workforce, facilities, resources, business ownership, networks, transactions, financial truth and intelligence through one persistent identity and governed ecosystem.

It is not merely an EHR/EMR, CRM, clinic-management product, staffing marketplace, AI assistant, patient portal, education product, billing product or med-spa tool.

## Current wiring thesis

Wiring means:

`UI → ACTION → IDENTITY / CONTEXT → INTENT → ROUTE → AUTHORIZATION / ELIGIBILITY → ENGINE(S) → REAL DATA / WORKFLOW → PERSISTENCE / EVENT → TRUTHFUL RESULT → AUDIT / FINANCIAL STATE → NEXT ROUTE`

A clickable link is not automatically wired. Pages are surfaces; routes are the product journeys.

## Ecosystem engines

Core engines include:

- Living Home
- Klinikos Intelligence / Zumi
- Clinic OS
- Grid
- EDU
- Care
- Billing / Financial OS
- Insights
- Network / Capacity
- Identity / Organizations / Roles
- Credentials / Eligibility / Trust
- Events / Audit / Provenance

Shared services also include documents/storage, communications, search/discovery, connectors, configuration/entitlements, observability/reliability and security/governance.

## Lifecycle model

Representative individual route:

`STUDENT → EDU → COMPETENCY → PLACEMENT → CREDENTIAL → GRID ELIGIBILITY → WORK → EXPERIENCE → REPUTATION → INDEPENDENT PRACTICE → CLINIC OWNER → CLINIC OS → NETWORK → EDUCATOR / EMPLOYER`

Representative organization route:

`NEW PRACTICE → CLINIC OS → OPERATIONAL MATURITY → REVENUE OPTIMIZATION → GRID → MORE CAPACITY → SECOND LOCATION → MULTI-SITE → NETWORK → ENTERPRISE`

## Front-door experience

Living Home is the operating front door. It asks:

> **WHAT NEEDS TO HAPPEN?**

Klinikos resolves intent into governed routes and dynamic workspaces rather than forcing users to understand the module architecture.

## Design authority

Converted surfaces follow the approved cinematic Living Home reference and the black/black-cherry/burgundy/dusty-rose/warm-ivory system.

Approved transparent asset paths, where present:

- `public/klinikos-orbital-k-transparent.png`
- `public/klinikos-wordmark-transparent.png`
- `public/klinikos-rose-wide-transparent.png`
- `public/klinikos-rose-centered-transparent.png`

See `KLINIKOS_DESIGN_AND_WIRING_CANON.md` for functional acceptance, not just visual styling.

## Grid scope

Grid is the generalized healthcare resource/opportunity/capacity/matching/transaction network. Its universal language is **I NEED / I HAVE**.

It may compose people, work, space, services, equipment/resource capacity, education capacity, organizations, referrals and other policy-governed resource classes.

Hard eligibility precedes ranking. AI interprets and explains; deterministic policy governs eligibility.

## Clinic OS / Grid / EDU connection

Clinic OS may surface authorized staffing gaps, capacity, referrals and resource needs into Grid.

Grid outcomes may return to Clinic OS as real booking, assignment, fulfillment, issue, follow-up and financial/audit state.

EDU may create competency, placement and credential evidence that contributes to eligibility only when governing policy permits.

## Financial truth

Economic routes converge on shared semantics:

`OPPORTUNITY → AGREEMENT → BOOKING / RESERVATION → FULFILLMENT → FINANCIAL OBLIGATION → PAYMENT EVIDENCE → PAYOUT / RECONCILIATION`

Use integer cents. Redirect is not payment. Internal obligation is not external settlement.

## Commercial architecture

Primary revenue routes are:

- paid operational analysis;
- paid implementation/onboarding;
- recurring Clinic OS;
- Grid economics where lawful;
- EDU individual/institutional revenue;
- multi-location/network/enterprise;
- customer-funded variable usage/add-ons.

Historical cost estimates are planning notes unless revalidated against real vendor usage. See `KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`.

## Status truth

Use `FEATURE_STATUS.md` vocabulary:

- BUILT
- PARTIALLY BUILT
- MANUAL FALLBACK
- ADAPTER READY
- PENDING CONNECTION
- BLOCKED
- NOT BUILT
- NOT BUILT BY DESIGN

No new strategic canon changes a feature's implementation status automatically.

## Runtime orientation

### Living Home / public intent

- `src/app/page.tsx`
- current Living Home components
- public/authenticated intent/routing services

### Grid

- `src/app/grid/`
- `src/app/(platform)/grid/`
- `src/components/grid/`
- `src/lib/grid/`
- Grid repositories/APIs/migrations

### Patient / Clinic / EDU / Intelligence

Follow the current route/component/repository/service families. Do not infer external production connectivity from the existence of an adapter or internal model.

### Database

- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma.config.ts`

Fresh migration success remains a merge gate.

### Deployment

- `.node-version`
- `package.json`
- `render.yaml`
- GitHub Actions Quality workflow
- production-start/deploy scripts

Canonical public domain: `https://klinikos.io`.

## Verification law

Compilation does not prove user journeys. Quality must include schema/migration validation, type/lint/tests, DB-backed journeys, production build/startup and relevant browser/mobile QA.

Repository green does not prove the external host deployed the same commit.

## Migration posture

Do not rewrite functioning architecture merely for naming purity. Prefer `KEEP / HARDEN / REFACTOR / MOVE / SPLIT / MERGE / DEPRECATE / REPLACE / BUILD NEW / DEFER` deliberately.

Use adapters, route definitions, shared services and events to evolve toward ecosystem architecture without destructive rewrites.

## Handoff rules

- Frontend consumes authorization but is never the security boundary.
- APIs enforce validation, authorization and tenant scope.
- Events are minimum-necessary and never an uncontrolled PHI bus.
- Grid discovers/composes; policy/eligibility/agreement/payment/safety/fulfillment govern continuation.
- Intelligence coordinates but cannot bypass deterministic controls.
- External payment rails may move money; Klinikos owns intent/evidence/entitlement/ledger semantics.
- Analytics stays downstream of operational truth.
- Pricing cannot force fake capabilities or unlimited unmeasured variable cost.

## Updating truth

- Major ecosystem/product decisions → `SOURCE_OF_TRUTH` + ecosystem canon.
- Frontend/reference/wiring decisions → design/wiring canon.
- Pricing/monetization decisions → pricing canon.
- Implementation changes → `FEATURE_STATUS`.
- External connection changes → `EXTERNAL_DEPENDENCY_MATRIX`.
- End-to-end evidence → `MVP_JOURNEYS`.

Preserve git history. Do not rewrite roadmap work as completed.