# KLINIKOS Architecture & Source-of-Truth Index

Status: `AUTHORITATIVE INDEX`  
Date: 2026-08-18

This file tells humans and agents where to look. It is navigation, not a competing implementation ledger.

## Precedence

When sources conflict, use this order:

1. **Current repository implementation, schema, migrations, tests, exact-head CI and verified runtime evidence** for what exists now.
2. `docs/SOURCE_OF_TRUTH.md` for current operating law.
3. `docs/KLINIKOS_ECOSYSTEM_CANON.md` for newest ecosystem/wiring/lifecycle direction.
4. `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` for repository-wide client/server confidentiality, proprietary-logic, browser-disclosure, and frontend secrecy law.
5. `docs/KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` for the uploaded design package and pixel-reference authority.
6. `docs/KLINIKOS_DESIGN_AND_WIRING_CANON.md` for newest frontend/reference/wiring acceptance law.
7. `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md` for current commercial/pricing architecture.
8. `docs/FEATURE_STATUS.md` for capability status.
9. `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for external connection/gate truth.
10. `docs/MVP_JOURNEYS.md` for end-to-end proof contracts.
11. `docs/GRID_CANON.md`, `docs/ZUMI_CANON.md`, `docs/EDU_CANON.md`, `docs/CLINIC_OS_CANON.md`, `docs/PORTAL_AND_ROLE_CANON.md`, and `docs/FINANCIAL_OS_CANON.md` for specialist domain law.
12. Current specialist specifications, including `docs/KLINIKOS_ASSURANCE_AND_EXPERT_GRID_CANON.md` when present on the active candidate branch.
13. Constitution/Master Canon for deeper invariants not superseded above.
14. Legacy briefs, stale pricing estimates, old PR bodies and old brand hierarchy as history only.

A more detailed old document does not outrank a newer authoritative correction.

## Required read order before major implementation

1. Fetch latest `main`, open PRs, relevant branches and CI.
2. Read `SOURCE_OF_TRUTH.md`.
3. Read `KLINIKOS_ECOSYSTEM_CANON.md`.
4. For any frontend, API, Zumi, Grid, Quality/Assurance, pricing, analytics, admin, integration, or client-visible work, read `FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` before editing.
5. For frontend design work read `KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` and `KLINIKOS_DESIGN_AND_WIRING_CANON.md`.
6. For pricing/commercial work read `KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`.
7. Read `FEATURE_STATUS.md` and relevant code/tests before claiming something is built.
8. Read `EXTERNAL_DEPENDENCY_MATRIX.md` before claiming an external rail is connected.
9. Read the relevant specialist spec and journey evidence.
10. For recovery work, read `BRANCH_LEDGER.md` and `RECOVERY_AND_COMPLETION_ROADMAP.md`.
11. Resolve conflicts explicitly rather than silently choosing old material.

## Current canonical thesis

Klinikos is the operating and opportunity infrastructure for the healthcare lifecycle. It connects education, careers, clinic operations, patient demand, workforce, facilities, resources, business ownership, networks, transactions, financial truth and intelligence through one persistent identity and governed ecosystem.

It is not merely an EHR/EMR, CRM, clinic-management product, staffing marketplace, AI assistant, patient portal, education product, billing product or med-spa tool.

## Current wiring thesis

Wiring means:

`UI → ACTION → IDENTITY / CONTEXT → INTENT → ROUTE → AUTHORIZATION / ELIGIBILITY → ENGINE(S) → REAL DATA / WORKFLOW → PERSISTENCE / EVENT → TRUTHFUL RESULT → AUDIT / FINANCIAL STATE → NEXT ROUTE`

A clickable link is not automatically wired. Pages are surfaces; routes are the product journeys.

Confidential/proprietary execution additionally follows:

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER-SIDE POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY PRESENTATION DTO → BROWSER`

The frontend presents approved results. It is not where Klinikos stores or executes confidential competitive logic merely for convenience.

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

See `KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` for the uploaded package authority and `KLINIKOS_DESIGN_AND_WIRING_CANON.md` for functional acceptance, not just visual styling.

## Frontend confidentiality authority

`FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` applies across every product surface and engine.

Assume every value sent to the browser can be inspected and retained. Minification, obfuscation, hidden DOM, disabled buttons, route secrecy, client feature flags, and a private source repository are not confidentiality boundaries.

Server-confidential by default includes:

- credentials/secrets;
- Zumi hidden prompts/directives and private orchestration;
- proprietary Rules & Evidence execution logic;
- Grid/Expert Grid ranking, trust, risk, anti-gaming, and matching logic;
- private pricing/margin/economic formulas;
- unreleased strategy/roadmap/business information;
- privileged security/infrastructure details;
- unnecessary PHI/PII or private operational state.

Browser boundaries use explicit minimum-necessary DTO/view-model projections. Raw ORM/domain records are not browser contracts. Server Component values passed to Client Components are browser disclosures and must be reviewed.

## Grid scope

Grid is the generalized healthcare resource/opportunity/capacity/matching/transaction network. Its universal language is **I NEED / I HAVE**.

It may compose people, work, space, services, equipment/resource capacity, education capacity, organizations, referrals and other policy-governed resource classes.

Hard eligibility precedes ranking. AI interprets and explains; deterministic policy governs eligibility.

Confidential ranking weights, anti-gaming controls, private trust/risk heuristics, rejected-candidate internals, and hidden marketplace economics stay server-side by default.

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

Private pricing formulas, margins, commissions, unpublished discount logic, and internal commercial strategy are not automatically browser-visible because a pricing page exists.

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

Authority: `docs/GRID_CANON.md` plus repository-wide confidentiality law in `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

### Zumi / Klinikos Intelligence

- `src/features/zumi/`
- `src/app/api/zumi/`
- governed provider, conversation, memory, redaction, entitlement, and audit services

Authority: `docs/ZUMI_CANON.md` plus repository-wide confidentiality law in `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

### EDU

- `src/app/edu/`
- `src/app/api/edu/`
- `src/lib/edu/`
- education models and journeys

Authority: `docs/EDU_CANON.md`.

### Clinic OS, portals, and roles

- `src/app/(platform)/`
- `src/app/portal/`
- `src/lib/auth/`
- clinic/patient/domain repositories and APIs

Authority: `docs/CLINIC_OS_CANON.md` and `docs/PORTAL_AND_ROLE_CANON.md`.

### Financial OS

- commercial/payment/entitlement services
- Grid fee, obligation, settlement, and payout repositories

Authority: `docs/FINANCIAL_OS_CANON.md`.

### Assurance / Quality Guardian / Expert Grid

- `src/lib/orchestration/`
- `src/lib/repositories/quality-assurance-repository.ts` where present
- Zumi trusted Quality Guardian bridges where present
- Expert Grid matching/engagement services where present

Authority on an active candidate branch: `docs/KLINIKOS_ASSURANCE_AND_EXPERT_GRID_CANON.md`, always constrained by `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

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

For material frontend/API/security changes, verification also includes the relevant client/server DTO boundary, response minimization, tenant/RBAC, cache/no-store, error sanitization, secret/public-env, client bundle/payload, static/public asset, and third-party telemetry checks defined in `FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

## Migration posture

Do not rewrite functioning architecture merely for naming purity. Prefer `KEEP / HARDEN / REFACTOR / MOVE / SPLIT / MERGE / DEPRECATE / REPLACE / BUILD NEW / DEFER` deliberately.

Use adapters, route definitions, shared services and events to evolve toward ecosystem architecture without destructive rewrites.

Never move confidential authority or proprietary algorithms into client code simply to make a migration easier.

## Handoff rules

- Frontend consumes authorization but is never the security or confidentiality boundary.
- APIs enforce validation, authorization, tenant scope, and minimum-necessary response projection.
- Raw ORM/domain objects are not frontend contracts by default.
- Server Components do not make broad Client Component props safe; serialized props are browser disclosure.
- Zumi hidden prompts, private orchestration, proprietary Rules & Evidence logic, ranking algorithms, private pricing logic, and security heuristics remain server-side unless explicitly reviewed for disclosure.
- Events are minimum-necessary and never an uncontrolled PHI bus.
- Grid discovers/composes; policy/eligibility/agreement/payment/safety/fulfillment govern continuation.
- Intelligence coordinates but cannot bypass deterministic controls.
- External payment rails may move money; Klinikos owns intent/evidence/entitlement/ledger semantics.
- Analytics stays downstream of operational truth and must not become an uncontrolled sensitive-data egress path.
- Pricing cannot force fake capabilities or unlimited unmeasured variable cost.
- Client feature flags, hidden UI, obfuscation, or minification never substitute for server-side authorization/confidentiality controls.

## Updating truth

- Major ecosystem/product decisions → `SOURCE_OF_TRUTH` + ecosystem canon.
- Frontend confidentiality/trade-secret/server-boundary decisions → `FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON` + `SOURCE_OF_TRUTH` when a repository-wide invariant changes.
- Frontend/reference/wiring decisions → design/wiring canon.
- Pricing/monetization decisions → pricing canon.
- Implementation changes → `FEATURE_STATUS`.
- External connection changes → `EXTERNAL_DEPENDENCY_MATRIX`.
- End-to-end evidence → `MVP_JOURNEYS`.
- Branch/recovery classification → `BRANCH_LEDGER`.
- Prioritized completion order → `RECOVERY_AND_COMPLETION_ROADMAP`.

Preserve git history. Do not rewrite roadmap work as completed.
