# Klinikos Commercial Fabric Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the retired fixed clinic sales ladder from active Klinikos authority and product behavior and replace it with outcome-first, first-useful-result, server-owned commercial fabric behavior.

**Architecture:** Centralize the replacement in `src/lib/commercial/klinikos-commercial.ts`, then make sales/demo/admin/customer routes consume that contract. Add a repository convergence test that rejects retired commercial identifiers in active source/current authority, and update canonical documentation to describe the same customer progression and commercial boundary.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.9, Vitest 3, server-owned commercial catalog, GitHub Actions release verification.

**Spec:** `docs/superpowers/specs/2026-09-02-commercial-fabric-migration-design.md`

## Global Constraints

- One Klinikos; no clinic-only commercial funnel may become a parallel product architecture.
- `FREE PARTICIPATION AND FIRST VALUE -> PAID CAPABILITY FOLLOWS ADDITIONAL ECONOMIC VALUE` is the commercial boundary.
- Customer progression is `DISCOVERY -> JOIN FREE -> INTENT -> CONTEXT -> FIRST USEFUL RESULT -> ECONOMIC VALUE -> PAID CAPABILITY -> MEASURED OUTCOME -> RETENTION -> EXPANSION`.
- Browser display is not commercial authority; product identity, price, entitlement and billing truth remain server-owned.
- Payment never creates identity, verification, eligibility, clinical/professional authority, tenant access, referral priority, or other governed authority.
- No trade secrets or crown-jewel implementation details may be added to public/customer copy.
- Do not fabricate revenue, customers, deployments, outcomes, or regulatory status.
- Compatibility URLs may survive only if their rendered semantics are migrated.

---

### Task 1: Add legacy-commercial regression guard

**Files:**
- Create: `tests/commercial-fabric-migration.test.ts`

**Interfaces:**
- Consumes: repository filesystem and current authority/source directories.
- Produces: a Vitest guard that rejects retired commercial identifiers from active files and validates the new commercial doctrine exists in the central commercial module.

- [ ] **Step 1: Write the failing tests**

Create tests that recursively inspect `src`, `docs`, `governance`, and `README.md` and reject the retired offer identities and machine keys, while allowing the migration spec/plan to discuss the generic phrase `retired legacy commercial ladder` without reproducing the old names.

The test must also import the new commercial fabric constants expected from `@/lib/commercial/klinikos-commercial` and assert the progression includes `FIRST USEFUL RESULT`, `ECONOMIC VALUE`, `PAID CAPABILITY`, and `MEASURED OUTCOME`.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/commercial-fabric-migration.test.ts`

Expected: FAIL because current source/docs still contain retired identifiers and the new commercial-fabric exports do not exist yet.

- [ ] **Step 3: Commit the red test**

Commit message: `test(commercial): guard retired clinic ladder`

### Task 2: Replace the central commercial model

**Files:**
- Modify: `src/lib/commercial/klinikos-commercial.ts`
- Modify: `src/lib/sales/canonical-display.ts`
- Modify: `src/lib/sales-demo-rules.ts`
- Modify: `src/lib/sales-audit-rules.ts`
- Test: `tests/commercial-fabric-migration.test.ts`
- Test: existing commercial/sales tests that import the old offer object.

**Interfaces:**
- Produces: `customerCommercialProgression`, `unfinishedWorkProgression`, `commercialFabricPrinciples`, and governed offer-class metadata.
- Removes: the fixed legacy offer object and retired offer projection logic.

- [ ] **Step 1: Implement minimal central exports**

Add immutable, server-owned metadata for the canonical progression and commercial rules. Keep current independent subscriptions/add-ons/services only when not dependent on the retired ladder. Remove retired offer names, machine keys, mandatory credit-forward logic, and implementation references that exist solely to support the old funnel.

- [ ] **Step 2: Convert sales/demo rules**

Change recommendations from `sell next ladder step` to `identify unfinished work -> establish first useful result -> record economic value -> select an appropriate governed paid capability or human-reviewed enterprise/service path`.

- [ ] **Step 3: Run focused commercial tests**

Run: `npm test -- tests/commercial-fabric-migration.test.ts tests/pricing-truth.test.ts tests/sales-demo-rules.test.ts tests/landing-funnel.test.ts tests/revenue-funnel-convergence.test.ts tests/sales-commercial-catalog-convergence.test.ts tests/canonical-sales-display.test.ts tests/pricing-experience.test.ts`

Expected: PASS after obsolete assertions are migrated to the new contract.

- [ ] **Step 4: Commit**

Commit message: `feat(commercial): replace legacy ladder with commercial fabric`

### Task 3: Migrate customer and admin routes

**Files:**
- Modify: `src/app/sales/page.tsx`
- Modify: `src/app/operational-audit/page.tsx`
- Modify: `src/app/founding-clinic/page.tsx`
- Modify: `src/app/start/page.tsx`
- Modify: `src/app/private-demo/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/(platform)/admin/sales/page.tsx`
- Modify: `src/app/(platform)/admin/sales/audit/page.tsx`
- Modify other active route files found by the regression guard.

**Interfaces:**
- Consumes: the commercial fabric exports from Task 2.
- Produces: outcome-first acquisition and internal qualification experiences.

- [ ] **Step 1: Replace customer-facing CTAs**

Use problem/outcome language such as `Show Klinikos what needs to happen`, `Find unfinished work`, `Get a first useful result`, `See the next governed action`, and `Explore the right operating capability` rather than selling a predetermined paid analysis.

- [ ] **Step 2: Replace compatibility route semantics**

Keep legacy URL paths only when useful for link continuity; their content must route users into the new intent/problem entry and never reproduce the retired model.

- [ ] **Step 3: Replace admin scoring semantics**

Score account readiness, authority, problem severity, evidence quality, economic consequence, and next-action suitability rather than `audit qualification`.

- [ ] **Step 4: Run route/convergence tests**

Run the focused Vitest suite plus `npm run type-check`.

Expected: PASS and no retired identifiers in active source.

- [ ] **Step 5: Commit**

Commit message: `feat(sales): make acquisition outcome first`

### Task 4: Converge current authority and operating documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/KLINIKOS_MASTER_CANON.md`
- Modify: `docs/KLINIKOS_COMMERCIAL_CANON.md`
- Modify: `docs/FINANCIAL_OS_CANON.md`
- Modify: `docs/SALES-AUDIT-FUNNEL.md` or rename/replace its content as current commercial-fabric guidance.
- Modify: `docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md`
- Modify: `docs/FEATURE_STATUS.md`
- Modify: `docs/KLINIKOS_CURRENT_PROJECT_STATE.md`
- Modify: `docs/BUILD_STATUS_2026_FOUNDING_CLINIC_PLAN.md`
- Modify: `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md`
- Modify: `docs/legal/COMMERCIAL_PACKAGING_AND_PRODUCT_STRATEGY.md`
- Modify additional current-authority files discovered by the guard.

**Interfaces:**
- Consumes: approved migration spec and central commercial fabric.
- Produces: one current written commercial truth.

- [ ] **Step 1: Remove retired current-state assertions**

Delete obsolete offer names, fixed ladder sequence, machine keys, and credit-forward language.

- [ ] **Step 2: Replace with commercial fabric**

State the outcome-first customer progression, free/paid boundary, server-owned offer catalog, measured-outcome expansion rule, and progressive-disclosure boundary.

- [ ] **Step 3: Sanitize provenance/history references**

Where old material must remain for provenance, replace detailed retired offer reproduction with a generic `retired legacy commercial ladder` marker and a pointer to the current commercial canon.

- [ ] **Step 4: Run migration guard**

Run: `npm test -- tests/commercial-fabric-migration.test.ts`

Expected: PASS across source, current docs, governance, and README.

- [ ] **Step 5: Commit**

Commit message: `docs(canon): converge on commercial fabric`

### Task 5: Full verification and PR

**Files:**
- No new production files expected; verification may require correcting failures in files already touched.

**Interfaces:**
- Produces: verified branch and reviewable PR.

- [ ] **Step 1: Run tests**

Run: `npm test`

Expected: 0 failing tests.

- [ ] **Step 2: Run type-check and lint**

Run: `npm run type-check && npm run lint`

Expected: exit 0.

- [ ] **Step 3: Run release/security verification**

Run: `npm run security:check && npm run verify:code`

Expected: exit 0.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 5: Search repository for retired identifiers**

Search the branch for the forbidden legacy offer names and machine keys.

Expected: zero active matches; migration spec/plan may contain only generic retirement language, not old offer identities.

- [ ] **Step 6: Compare branch to main and inspect every changed file**

Confirm no unrelated changes, no customer/traction fabrication, no trade-secret disclosure, and no accidental pricing/authority drift.

- [ ] **Step 7: Open PR**

Title: `feat(commercial): retire legacy clinic ladder for commercial fabric`

PR body must summarize the retired model, replacement doctrine, routes/docs/code migrated, tests run, and explicit non-goals. Do not merge until exact-head CI is green.
