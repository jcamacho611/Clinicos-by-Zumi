# KLINIKOS Architecture & Source-of-Truth Index

Status: `AUTHORITATIVE INDEX`  
Date: 2026-08-14  
Current merged baseline at update: `main@4b2a5dc89f3dae7a175b2f8eda9f83f866b77de6`

This file tells humans and agents where to look. It is navigation, not a competing implementation ledger.

## Precedence

When sources conflict, use this order:

1. **Current repository implementation, schema, migrations, tests, exact-head CI and verified runtime evidence** for what exists now.
2. `docs/SOURCE_OF_TRUTH.md` for current brand, product, deployment, commercial, Grid, intelligence, frontend, security and engineering law.
3. `docs/FEATURE_STATUS.md` for capability status.
4. `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for external connection/gate truth.
5. `docs/MVP_JOURNEYS.md` for end-to-end proof contracts.
6. Current specialist specifications and the product/website master scope.
7. Constitution/Master Canon for deeper invariants and permanent historical scope not superseded above.
8. Legacy briefs, old PR bodies, old SHAs/Render URLs, historical pricing/build notes and `Clinicos`/old Zumi brand hierarchy as history only.

A more detailed old document does not outrank a newer authoritative correction.

## Canonical product documents

- `docs/SOURCE_OF_TRUTH.md` — operating law.
- `docs/FEATURE_STATUS.md` — implementation/status truth.
- `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md` — full public/authenticated/customer/product surface map.
- `docs/MARKETPLACE_DESIGN_RESEARCH.md` — official-source marketplace research translated into original Klinikos design laws.
- `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md` — current Grid discovery/location contract and next convergence targets.
- `docs/EXTERNAL_DEPENDENCY_MATRIX.md` — external rails and blockers.
- `docs/MVP_JOURNEYS.md` — DB-backed journey proof.
- `docs/EXPOSED_UI_AUDIT.md` — exposed language/interaction review when current.

## Required read order before major implementation

1. Read `SOURCE_OF_TRUTH` and `FEATURE_STATUS`.
2. Fetch current `main`, open PRs, relevant code/schema/migrations/tests and CI.
3. Read the relevant specialist spec and external-dependency truth.
4. Consult Constitution/Master Canon for deeper invariants if needed.
5. Resolve conflicts before implementation rather than silently choosing an older document.

## Current canonical thesis

Klinikos is a universal, composable healthcare operating ecosystem. It must not be reduced to a single EHR/EMR, clinic-management product, staffing marketplace, AI assistant, patient portal, education product, billing product or med-spa tool. Those are domains or experiences within the larger system.

## Core shared engines

Reusable engines include identity, organizations/tenancy, relationships/memberships, authorization/policy, consent/delegation, credentials/eligibility, events/audit/provenance, workflows/automation, Klinikos Intelligence gateway, Grid matching/resource exchange, connectors, financial ledger/payments, communications, documents/storage, search/discovery, notifications, analytics/operational intelligence, security/governance, entitlements/configuration and observability/reliability.

A new reusable primitive may be added when the domain genuinely requires it. The list is not a ceiling.

## Domain compositions

Known compositions include Clinic, Patient, Provider, Grid, Education, Network, Revenue Cycle/Recovery, No-Fault, Workers’ Compensation, Medical Spa, Home Health, Telehealth, Remote Monitoring, Labs, Imaging, Pharmacy, Supply/Procurement, Credentialing, Referrals/Care Coordination, Research/Trials, Population Health, Healthcare Business Services, Facility/Capacity Exchange, Transportation and Language Access.

## Front-door experience

The intended experience is:

`IDENTITY → INTENT → PERMISSION-AWARE ROUTING → RELEVANT WORKSPACE → SAFE NEXT ACTION → PROGRESS/RESULT`

The public root is now a conversation-first Living Home. Authenticated Living Home is the role-aware operating briefing. The frontend must not expose backend architecture unnecessarily.

## Grid scope

Grid is a generalized healthcare resource/opportunity/capacity exchange, not a job board. It may combine people/provider time, work, rooms/chairs/facilities, appointment/diagnostic/referral capacity, equipment, services, training/placements/preceptors, permitted products/supplies and organization demand through the generalized transaction core.

Current public discovery uses the Exchange Field, explicit opt-in geolocation, real-only map inventory, a keyless OSM fallback and deterministic search/radius truth. See `GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md`.

Hard eligibility precedes ranking. Deterministic Klinikos state owns credential, payment, transaction, safety and settlement truth.

## Klinikos Intelligence scope

Klinikos owns context, identity/permissions, tools, workflows, prompt/policy versions, redaction/PHI policy, audit/provenance, cost controls, safety and UX. Model providers provide reasoning only where authorized.

AI may interpret, draft, research and coordinate. It does not become the source of truth for authentication, eligibility, credentialing, consent, payment, transaction, record release, clinical authority or safety holds.

## Status truth

Use the vocabulary in `SOURCE_OF_TRUTH` / `FEATURE_STATUS`:

- Built / Ready;
- Partially built;
- Manual fallback;
- Adapter ready / Configurable;
- Pending connection;
- Blocked;
- Roadmap / Not built.

External-action state must reflect evidence. A redirect is not settlement, a queued message is not delivery, internal credential review is not external board verification and a ledger obligation is not payout movement.

## Core runtime orientation

### Public Living Home

- `src/app/page.tsx`
- `src/components/marketing/public-living-gateway.tsx`
- `src/lib/orchestration/public-living-intent.ts`

### Patient portal

- `src/app/portal/`
- `src/components/portal/`
- portal session/auth libraries
- `src/lib/repositories/portal-repository.ts`

Patient identity/session remains separate from clinic staff identity.

### Grid

- `src/app/grid/`
- `src/app/(platform)/grid/`
- `src/components/grid/`
- `src/lib/grid/`
- Grid repositories/APIs
- Grid migrations

### Clinic OS / Network / EDU / Intelligence

Follow the relevant route, component, repository/service and migration families; do not infer production external connectivity from an internal model or adapter.

### Database

- `prisma/schema.prisma`
- `prisma/migrations/`
- `prisma.config.ts`

Fresh-migration success is a merge gate. Do not rewrite applied production history casually or introduce clinical cascade deletion merely to simplify tests.

### Deployment

- `.node-version`
- `package.json`
- `render.yaml`
- GitHub Actions Quality workflow
- production-start preflight/runtime scripts

Canonical host contract:

```bash
npm ci --include=dev --ignore-scripts && npm run render:build
npm start
```

Build/generate/migrate during deploy; runtime serves the already-built application.

## Verification law

Quality covers Prisma generate/validate, fresh PostgreSQL migrations, TypeScript, lint, tests, DB-backed MVP journeys, production build, production startup smoke and exact deploy-contract. Repository green does **not** prove the external production host deployed that commit.

## Cost / founder-operability constraint

Prefer revenue-capable vertical slices and measured customer-funded variable usage while preserving long-term primitives. Cost-awareness never permits bypassing safety, authorization, tenant isolation, audit, privacy, credentialing or financial truth.

## Repository migration posture

Do not rewrite simply for naming purity. Use `KEEP / HARDEN / REFACTOR / MOVE / SPLIT / MERGE / DEPRECATE / REPLACE / BUILD NEW / DEFER` deliberately. Legacy `Clinicos` repository/env/database/migration identifiers may remain when renaming would introduce needless risk; public language remains Klinikos.

## Handoff rules

- Frontend consumes authorization but is never the security boundary.
- APIs enforce canonical validation, authorization and tenant scope.
- Events use minimum-necessary payloads and never become an uncontrolled PHI bus.
- Workflows coordinate explicit state, retries, holds, failures and human review.
- Grid discovers/composes opportunities; eligibility, agreements, payment, safety and fulfillment govern continuation.
- Intelligence interprets/coordinates but cannot bypass deterministic controls.
- Integrations normalize vendor-specific state before core domains depend on it.
- External payment rails may move money; Klinikos owns its internal intent/evidence/entitlement/ledger semantics.
- Analytics stays downstream of operational truth.

## Acceptance journeys

Core operation:

`IDENTITY → ORGANIZATION → AUTHORIZATION → ACTION → EVENT → WORKFLOW → RESULT/FALLBACK → AUDIT`

Commerce/provisioning:

`BUYER → SERVER CHECKOUT INTENT → EXTERNAL PAYMENT ATTEMPT → VERIFIED EVIDENCE → ENTITLEMENT → PROVISIONING → LOGIN → CORRECT ORGANIZATION → ACTIVE PRODUCT`

Grid:

`RESOURCE/DEMAND → MATCH → ELIGIBILITY → OFFER → ACCEPTANCE → RESERVATION → FINANCIAL OBLIGATION → FULFILLMENT → SETTLEMENT EVIDENCE/FALLBACK → AUDIT`

The executable journey set is defined by the current `scripts/mvp/run-all.mjs` and documented in `docs/MVP_JOURNEYS.md`.

## Updating source of truth

Major decisions update `SOURCE_OF_TRUTH`; implementation changes update `FEATURE_STATUS`; external changes update `EXTERNAL_DEPENDENCY_MATRIX`; detailed interaction law belongs in specialist specs. Preserve git history instead of rewriting roadmap work as completed.