# Route Registry Status — Screen Experience Contract Inventory

**Updated:** 2026-08-27  
**Basis main SHA:** `b08c81f41b2101a4b63f94ecf1a5b61d1f1c7fd4`  
**Active implementation branch:** `feat/final-form-onboarding-release-20260827`  
**Canon reference:** `src/lib/screen-experience-contracts.ts`  
**Release gate:** `docs/SCREEN_EXPERIENCE_RELEASE_GATE.md`

## Rule

Every active route is a **production release blocker** without a complete Screen Experience Contract and matching implementation evidence.

A Screen Experience Contract declares:
- what is visible by default / must remain hidden / can be discovered / can be promoted;
- eligibility, entitlement and authority;
- exact data projection and minimum-necessary rules;
- available actions;
- what Zumi may read, infer, recommend, draft and execute, and what it is forbidden from doing;
- PHI rules, audit requirements and provenance;
- marketing/commercial-use boundaries;
- denied/blocked/loading/empty/error behavior;
- mobile behavior and accessibility requirements.

---

## Contract Status

### Priority 1 — Acquisition, onboarding and highest-risk operating routes

| Route | File | Access | Contract Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` | PUBLIC | CONTRACT_PENDING |
| `/auth` | `src/app/auth/page.tsx` | PUBLIC (Universal Entry Router) | CONTRACT_PENDING |
| `/start` | `src/app/start/page.tsx` | PUBLIC compatibility redirect → `/auth` | CONTRACT_PENDING |
| `/sales` | `src/app/sales/page.tsx` | PUBLIC clinic operating analysis/intake | CONTRACT_PENDING |
| `/payments/success` | `src/app/payments/success/page.tsx` | PUBLIC opaque-reference commercial continuation | CONTRACT_PENDING |
| `/activate` | `src/app/activate/page.tsx` | PUBLIC signed-token activation | CONTRACT_PENDING |
| `/grid/workspace` | `src/app/grid/workspace/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/clinic` | `src/app/clinic/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/visit` | `src/app/visit/page.tsx` | AUTHENTICATED + CLINICAL_CONTEXT | CONTRACT_PENDING |

**Notes on Priority 1 routes:**

- **`/` (Living Home):** Public Zumi and public discovery. PHI forbidden. Proprietary routing stays server-side. Browser receives only a public-safe presentation DTO.
- **`/auth`:** Universal Entry Router. Public, non-authoritative continuation. It may understand safe intent and suggest a next route. It does not create professional, organization, payment or clinical authority.
- **`/start`:** Legacy-compatible alias only. It must not reintroduce a product/persona menu parallel to `/auth`.
- **`/sales`:** Public clinic acquisition and operating-analysis path. It may save non-PHI prospect/commercial intake. It does not create production clinic access.
- **`/payments/success`:** Browser arrival is not payment evidence. It may display only the server-projected state for an opaque signed reference.
- **`/activate`:** Requires a signed Klinikos activation token. Plan, organization, owner email and paid state remain server-owned. Password is never autosaved. Production PHI remains separately gated.
- **`/grid/workspace`:** Authenticated Grid home. Private Grid/organization data must remain tenant- and role-scoped.
- **`/clinic`:** Clinic operator workspace. RBAC governs data projection. Clinical authority must not leak to non-clinical surfaces.
- **`/visit`:** Current Visit. Highest PHI risk. Minimum-necessary projection, purpose, context, and Zumi authority boundaries are release gates.

---

### Priority 2 — Supporting routes

| Route | File | Access | Contract Status |
|---|---|---|---|
| `/grid` | `src/app/grid/page.tsx` | PUBLIC | CONTRACT_PENDING |
| `/grid/transactions` | `src/app/grid/transactions/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/edu` | `src/app/edu/page.tsx` | PUBLIC / AUTHENTICATED | CONTRACT_PENDING |
| `/clinic/system-health` | `src/app/clinic/system-health/page.tsx` | AUTHENTICATED (OPERATOR) | CONTRACT_PENDING |

**Notes on Priority 2 routes:**

- **`/grid`:** Public marketplace/network entry. It is not the authenticated Grid workspace.
- **`/grid/transactions`:** Transaction state is governed server-side and may not expose another organization's private data.
- **`/edu`:** Dual-mode public discovery and authenticated learning. Competency evidence is not licensure or employment authority.
- **`/clinic/system-health`:** Operator-facing integration lifecycle. `CONNECTED ≠ PRODUCTION_VERIFIED` remains invariant.

`/auth/verify` was previously listed here even though no matching route exists on current `main`. It is removed from the active route inventory until implementation truth exists. Verification requirements remain part of the canonical identity/authority architecture, not a fictional route claim.

---

### Priority 3 — Supplementary surfaces

| Route | File | Access | Contract Status |
|---|---|---|---|
| `/grid/needs/new` | `src/app/grid/needs/new/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |
| `/grid/trust` | `src/app/grid/trust/page.tsx` | AUTHENTICATED | CONTRACT_PENDING |

**Notes:**

- **`/grid/needs/new`:** Prefill must be re-derived from current live-safe state when opened, not trusted from stale client input.
- **`/grid/trust`:** Trust signals are governed projections, not automatic legal, refund, restriction or credential conclusions.

---

### Internal API routes

API routes require endpoint contracts (authorization, input/output schema, disclosure, rate limits, audit), not Screen Experience Contracts.

| Route | Access | Notes |
|---|---|---|
| `/api/health` | PUBLIC | Public health projection only. No secret/configuration topology. |
| `/api/zumi/public` | PUBLIC | Same-origin/allowed-origin, rate/quota governed, no-store, public-safe presentation DTO only. |
| `/api/sales/reservations` | PUBLIC POST / AUTHENTICATED GET | Public POST is rate-limited and creates commercial prospect/reservation truth only. |
| `/api/onboarding/organizations` | NON-PRODUCTION SYNTHETIC ONLY | Disabled in production. Must never become a public paid-access bypass. |
| `/api/onboarding/activate` | SIGNED ACTIVATION CONTEXT | PATCH saves non-secret draft; POST completes server-authorized activation. |
| `/api/paths` | AUTHENTICATED | Server-side route execution. |
| `/api/grid/transactions` | AUTHENTICATED | Governed Grid transaction projection. |

---

## Release work still required

1. Finish and verify the `/auth` Universal Entry Router and `/start` compatibility convergence.
2. Verify the public clinic acquisition → server-owned checkout/review → opaque payment continuation → signed activation chain end-to-end.
3. Preserve the production block on direct synthetic workspace creation.
4. Complete route-specific privacy/browser-boundary tests for onboarding and activation.
5. Complete Black Label visual convergence for acquisition/onboarding surfaces. Glass/transparency is limited to bounded conversational/atmospheric surfaces; forms remain solid and high contrast.
6. Run browser/mobile/accessibility QA on Priority 1 acquisition routes.
7. Run focused tests, type-check, lint, security gates, full tests and production build.
8. Reconcile current `main` and overlapping PRs immediately before integration.

---

## Completion tracking

A route becomes `CONTRACT_COMPLETE` only when:
- the applicable contract exists and accurately covers the route;
- implementation matches the contract;
- PHI/privacy, Zumi authority and minimum-necessary rules are verified;
- mobile and accessibility behavior are verified;
- no open defect blocks the route;
- required test/security/build evidence exists.

**Current summary:** 15 active user-visible routes inventoried in this release-oriented registry. `0` are being reclassified as `CONTRACT_COMPLETE` by documentation alone.
