# Route Registry Status — Screen Experience Contract Inventory

**Generated:** 2026-08-27  
**Basis SHA:** `9c81d6740c634e3b5a0622cf1701d44e8728253f` (main after PRs #356 and #357 merged)  
**Canon reference:** `src/lib/screen-experience-contracts.ts` (merged via PR #357)  
**Release gate:** `docs/SCREEN_EXPERIENCE_RELEASE_GATE.md`

## Rule

Every active route is a **production release blocker** without a complete Screen Experience Contract.

A Screen Experience Contract declares:
- What is visible by default / must remain hidden / can be discovered / can be promoted
- Eligibility, entitlement, authority
- Exact data projection (minimum necessary)
- Available actions
- Zumi: what it may read, infer, recommend, draft, execute, and what it is FORBIDDEN from doing
- PHI rules, audit requirements, provenance
- Marketing/commercial-use boundaries
- Denied/blocked/loading/empty/error behavior
- Mobile behavior, accessibility requirements

---

## Contract Status

### Priority 1 — Highest-Traffic Routes (production release blockers, address first)

| Route | File | Auth Level | Contract Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` | PUBLIC | CONTRACT_PENDING |
| `/grid/workspace` | `src/app/grid/workspace/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/clinic` | `src/app/clinic/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/visit` | `src/app/visit/page.tsx` | AUTHENTICATED + CLINICAL_CONTEXT | CONTRACT_PENDING |
| `/auth` | `src/app/auth/page.tsx` | PUBLIC (Universal Entry Router) | CONTRACT_PENDING |

**Notes on Priority 1 routes:**

- **`/` (Living Home):** Reference-locked to Obsidian palette. Public Zumi. PHI forbidden. Entry surface to all routes. Highest-priority contract because every person who arrives here is governed by it.
- **`/grid/workspace`:** Authenticated Grid home. Terminal step for `find-extra-work` and `fill-staffing-need` routes. History: `/grid/transactions` returned a 500 in production-mode browser QA — the workspace must be verified before release.
- **`/clinic`:** Clinic operator workspace. RBAC governs data projection. Clinical authority must not leak to non-clinical surfaces.
- **`/visit`:** Current Visit — the clinical convergence sequence. PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → CLOSE VISIT. Highest PHI risk. Zumi mode transitions must be declared per step.
- **`/auth`:** Universal Entry Router. ARRIVAL INTENT → VALUE → SIGN UP WHEN USEFUL → WHO ARE YOU / WHAT ARE YOU TRYING TO DO? → CLAIM RELATIONSHIP → VERIFY ONLY WHAT'S NECESSARY → SELECT ACTIVE EXPERIENCE. Identity foundation for all downstream surfaces.

---

### Priority 2 — Supporting Routes (address after Priority 1)

| Route | File | Auth Level | Contract Status |
|---|---|---|---|
| `/grid` | `src/app/grid/page.tsx` | PUBLIC | CONTRACT_PENDING |
| `/grid/transactions` | `src/app/grid/transactions/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/edu` | `src/app/edu/page.tsx` | PUBLIC / AUTHENTICATED | CONTRACT_PENDING |
| `/clinic/system-health` | `src/app/clinic/system-health/page.tsx` | AUTHENTICATED (OPERATOR) | CONTRACT_PENDING |
| `/auth/verify` | `src/app/auth/verify/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |

**Notes on Priority 2 routes:**

- **`/grid`:** Public marketplace entry — renders signed-out chrome with Sign in button. `/grid` is NOT the authenticated Grid home (`/grid/workspace`). Route guards must enforce this distinction: no step may point at `/grid` for a signed-in person.
- **`/grid/transactions`:** Terminal step for two routes. History: had a 500 in production-mode browser QA from a raw SQL table-name defect. Liquidity metrics surface added by PR #252 (pending rebase).
- **`/edu`:** Education and workforce entry. Dual-mode: public discovery and authenticated learner surface. EDU→Grid bridge: competency determinations are not licences — the contract must declare that the disclaimer travels on the readiness object itself.
- **`/clinic/system-health`:** Operator-facing. Integration lifecycle projection (PR #251 pending rebase). The `CONNECTED ≠ PRODUCTION_VERIFIED` invariant must be declared in the contract body.
- **`/auth/verify`:** Verification step for credential/relationship claims. Must declare exactly what verification asserts and what authority it does not confer.

---

### Priority 3 — Supplementary Surfaces

| Route | File | Auth Level | Contract Status |
|---|---|---|---|
| `/grid/needs/new` | `src/app/grid/needs/new/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/grid/trust` | `src/app/grid/trust/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |

**Notes:**

- **`/grid/needs/new`:** Clinic-Grid bridge destination. Prefilled from live signal re-derivation on open (not from the link itself). The contract must declare that unrecognized signal names are ignored and that a gap that closed since the link was generated yields an empty form, not a stale prefill.
- **`/grid/trust`:** Governed trust signals workspace. PR #249 pending rebase. `UniversalTrustSignal` is a projection contract, not persistence — the surface contract must state that no signal here claims or executes a refund, restriction, or legal conclusion.

---

### Internal API Routes (route.ts, not page.tsx — require API contract, not Screen Experience Contract)

| Route | File | Auth Level | Notes |
|---|---|---|---|
| `/api/health` | `src/app/api/health/route.ts` | PUBLIC | Live. Returns `{ status, service, mode, databaseConfigured, liveIntegrations, release, timestamp }`. Render health check configured. CI gate. |
| `/api/paths` | `src/app/api/paths/route.ts` | AUTHENTICATED | POST to start a route. Intent engine resolution. |
| `/api/grid/transactions` | `src/app/api/grid/transactions/route.ts` | AUTHENTICATED | Grid transaction board data. PR #252 adds `GridLiquiditySummary`. |

API routes need endpoint contracts (authorization model, input/output schema, audit), not Screen Experience Contracts. They are listed here for completeness.

---

## What Needs to Happen Next

1. **Author Screen Experience Contracts for Priority 1 routes** using the schema in `src/lib/screen-experience-contracts.ts`. Each contract is a TypeScript object co-located with its page or in a dedicated `src/lib/contracts/` directory.
2. **Rebase and merge PRs #249, #250, #251, #252** — each adds implementation that routes depend on. Their contracts should be authored after their merge.
3. **Unblock CI** — Settings → Billing and plans → GitHub Actions → raise spending limit. Once CI runs, add a check that rejects any new page.tsx without a corresponding contract entry.
4. **Register each contract in `src/lib/screen-experience-contracts.ts`** after authoring.
5. **Run browser/mobile QA against every Priority 1 route** before marking any as `CONTRACT_COMPLETE`.

---

## Completion Tracking

Update `CONTRACT_STATUS` from `CONTRACT_PENDING` to `CONTRACT_COMPLETE` for a route when:
- The contract TypeScript object is authored and registered
- PHI rules, Zumi modes, and authority boundaries are declared
- Mobile and accessibility requirements are stated
- A reviewer confirms the contract matches actual page behavior
- No open defect against this route blocks its contract

**Current summary:** 12 routes inventoried. 0 contracts complete. All are `CONTRACT_PENDING` as of 2026-08-27.
