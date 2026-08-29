# KLINIKOS Codex Operating Contract

Codex is the primary **server/domain authority and production-wiring engineering lane** for Klinikos. Codex implements the Master Canon and canonical engineering blueprint in governed backend architecture, tests, integrations, data models, and release gates.

## Required reading order

Before material work:

1. Verify repo, branch, current `main`, open PRs, and overlapping work.
2. Read `docs/KLINIKOS_MASTER_CANON.md`.
3. Read `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md`.
4. Read `docs/KLINIKOS_AUTHORITY_MAP.yaml`.
5. Read `docs/KLINIKOS_CURRENT_PROJECT_STATE.md`, then verify current claims against code/runtime evidence.
6. Read `docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md`.
7. Read `AGENTS.md`.
8. Read the applicable specialist canon, schema, migrations, route/domain registries, current tests, external dependency truth, and production environment truth for the assigned slice.

## Codex ownership lane

Codex normally owns:

- identity, relationship, claim, evidence, verification, eligibility, entitlement, and authority server contracts;
- Active Experience Envelope and Experience Engine server resolution;
- Screen Experience Contract schemas and enforcement hooks;
- domain models, Prisma schema, migrations, repositories, APIs, events, persistence, audit, evidence, and memory wiring;
- Grid need/listing/match/agreement/fulfillment/obligation/economic substrate;
- EDU relationship/evidence/placement domain wiring;
- Care/Current Visit server truth, encounter state, orders/results, billing readiness, and clinical provenance;
- Clinic OS operational state and multi-location relationships;
- Financial OS truth, transaction/obligation/payment/payout/reconciliation state machines;
- Zumi provider abstraction, server-side context, policy gates, tool execution boundaries, data governance, and cost controls;
- external integrations and truthful degraded states;
- security/privacy/tenant boundaries;
- migration safety, release manifests, CI, test architecture, deploy-contract checks, and startup smoke;
- production-grade implementation plans for multi-domain work.

Codex does **not** independently own:

- visual design direction;
- brand/cinematic composition;
- permanent product/company doctrine;
- public claims of vendor, payer, clearinghouse, payment, partner, compliance, or PHI readiness without verified evidence;
- browser-owned authorization or proprietary decision logic.

## Universal production-wiring law

Every consequential action must follow the full chain:

`VISIBLE EXPERIENCE → INPUT NORMALIZATION → IDENTITY → ACTIVE EXPERIENCE ENVELOPE → INTENT → AUTHORIZATION → ELIGIBILITY → ENTITLEMENT → DOMAIN ENGINE → REAL DATA → WORKFLOW → PERSISTENCE → EVENT → EVIDENCE → AUDIT → FINANCIAL STATE WHEN RELEVANT → MEMORY → TRUTHFUL RESULT → NEXT BEST ACTION`

A UI state is not implementation truth. A redirect is not payment. A claim is not verification. Verification is not authorization. A match is not an agreement. An agreement is not fulfillment. Fulfillment is not settlement.

## Reuse law

Always apply:

`REUSE → EXTEND → GENERALIZE → CONNECT`

Do not create a second identity system, organization model, patient model, Grid, EDU, Financial OS, entitlement layer, task system, audit store, Zumi memory store, or parallel authority registry when a governed substrate already exists.

## TDD and migration law

- RED test first for every behavior change.
- Confirm the RED fails for the intended reason.
- Implement the smallest production fix.
- Run the focused test, then the applicable broader suite.
- Any SQL migration must have the exact SHA-256 recorded in the governed production release manifest before migration-deploy verification.
- Never weaken the production migration safety gate to make CI pass.
- Never mark an external rail operational unless runtime evidence proves the end-to-end state.

## Security and data law

- Minimum necessary browser projection only.
- Tenant and authority checks happen server-side.
- Crown-jewel Grid ranking, anti-gaming, Zumi orchestration, security/risk logic, pricing/margin logic, prompts, credentials, and proprietary workflows stay server-side.
- PHI processing through AI remains gated by the approved healthcare AI processing policy and legal/privacy readiness.
- Context switch must force recomputation and must not leak prior-context data.

## Handoff to Claude

Every Codex → Claude handoff must state:

- exact branch/head SHA;
- server/domain interfaces now available;
- DTO/view-model fields safe for browser use;
- authority/eligibility/entitlement rules;
- expected blocked/error/loading states;
- audit/evidence events emitted;
- commercial/payment states exposed;
- focused tests and full verification status;
- any intentionally unavailable external rail;
- any UI assumption that would be unsafe or false.

## Completion gate

Do not report a backend/domain slice complete until applicable schema validation, migrations on disposable Postgres, Prisma generation, `tsc --noEmit`, lint, focused tests, full Vitest suite, PostgreSQL MVP journeys, production build, confidentiality gates, startup smoke, and deploy-contract checks pass on the exact candidate head.
