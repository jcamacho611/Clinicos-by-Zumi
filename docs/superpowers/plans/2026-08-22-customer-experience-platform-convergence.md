# Klinikos Customer Experience + Platform Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the full clinician/IT/billing/operator conversation into one continuous customer-facing Klinikos implementation, beginning with trust, routes, theme/accessibility and legal first-access behavior, then converging shared identity, clinical, financial, Grid, EDU, Zumi-memory and enterprise primitives without forking the product.

**Architecture:** Preserve current main and active approved work. Reuse existing legal-access, atmosphere, shell, Grid, EDU, Financial OS, Zumi, audit and server-boundary foundations. Introduce shared primitives incrementally behind the current architecture and verify each customer-facing journey end to end before advancing dependent work.

**Tech Stack:** Next.js / React / TypeScript, Prisma + PostgreSQL, current Klinikos CSS/design-token system, existing auth/session/RBAC, GitHub Actions Quality gate, current deployment/database providers as verified from repository/environment truth.

**Spec:** `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`

## Global Constraints

- Preserve current functionality; no big-bang rewrite.
- `docs/SOURCE_OF_TRUTH.md` and current code/schema/tests/runtime remain authoritative.
- Read `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` before frontend/API work.
- Read `docs/KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` and `docs/FRONTEND_EXPERIENCE_CANON.md` before frontend work.
- Public Living Home remains the approved cinematic Obsidian reference; operational work may use Marble/light where it improves sustained reading.
- Theme choice changes presentation only; it never changes authority, feature entitlement or safety behavior.
- First-access legal gating must use versioned server evidence and may not claim BAA/HIPAA/compliance authority it does not provide.
- Public anonymous discovery must not be needlessly blocked by authenticated-app legal gating; protected authenticated workspace access is the governed gate unless later legal counsel explicitly requires broader gating.
- No fake vendor/payment/credential/clinical/completion state.
- No feature status promotion without evidence.
- No external connection status promotion without verified live evidence.
- All sensitive/proprietary authority remains server-side.
- All material UI changes require responsive, keyboard, screen-reader, zoom, reduced-motion and browser-payload review.
- Customer customization is configuration, not code forks.

---

### Task 1: Merge the cross-domain architecture authority

**Files:**
- Create: `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`
- Modify: `docs/SOURCE_OF_TRUTH.md`
- Modify: `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
- Create: `docs/superpowers/plans/2026-08-22-customer-experience-platform-convergence.md`

**Interfaces:**
- Consumes: current `main`, specialist canons, clinician/IT/billing/operator conversation.
- Produces: discoverable repository authority and dependency order for all later tasks.

- [x] **Step 1: Add the Knowledge-to-Architecture Ledger**
- [x] **Step 2: Add ledger precedence and update rules to Source of Truth**
- [x] **Step 3: Add ledger to the Architecture Index required read order**
- [x] **Step 4: Open a docs-only PR with no implementation-status inflation**
- [ ] **Step 5: Verify exact-head diff contains only intended docs**
- [ ] **Step 6: Merge after repository policy permits**

### Task 2: Re-anchor the existing protected-access legal foundation

**Files:**
- Reuse/re-port from PR #170:
  - `prisma/migrations/20260818182000_legal_access_foundation/migration.sql`
  - `src/app/(platform)/admin/legal/page.tsx`
  - `src/app/api/legal/accept/route.ts`
  - `src/app/api/legal/agreements/[acceptanceId]/pdf/route.ts`
  - `src/app/api/legal/review/route.ts`
  - `src/app/legal/accept/LegalAcceptanceClient.tsx`
  - `src/app/legal/accept/page.tsx`
  - `src/app/legal/agreements/page.tsx`
  - `src/lib/legal/agreement-pdf.ts`
  - `src/lib/legal/global-agreement.ts`
  - `src/lib/legal/legal-access.ts`
  - `src/lib/legal/legal-config.ts`
  - `src/lib/legal/review-token.ts`
  - `src/lib/security/same-origin-post.ts`
  - relevant auth/session/login/logout/account-preference edits
  - legal tests and legal docs.

**Interfaces:**
- Consumes: current auth/session/organization/audit/document systems.
- Produces: `requiresLegalAcceptance`-style protected-workspace gate backed by immutable agreement version/evidence.

- [ ] **Step 1: Compare PR #170 changed files against current main and identify overlap/conflicts**
- [ ] **Step 2: Create a fresh current-main branch; do not merge the 218-commit-stale branch directly**
- [ ] **Step 3: Port legal schema/migration additions without replacing unrelated current Prisma schema**
- [ ] **Step 4: Port server legal configuration, exact version/hash registration, review token and same-origin protections**
- [ ] **Step 5: Port acceptance/review/PDF routes with current session/tenant APIs**
- [ ] **Step 6: Port accessible legal acceptance UI and Agreement Center**
- [ ] **Step 7: Gate first protected authenticated access until current required agreement version is accepted**
- [ ] **Step 8: Preserve public marketing pages and sign-in discovery unless counsel explicitly requires anonymous-site blocking**
- [ ] **Step 9: Add reacceptance path when agreement version changes**
- [ ] **Step 10: Run migration guard, replay/idempotency, wrong-tenant, unsigned-page/API denial, same-origin and PDF/hash tests**
- [ ] **Step 11: Verify on disposable database branch before any production migration**
- [ ] **Step 12: Keep production enforcement disabled until exact environment/counsel/runtime gates are satisfied**
- [ ] **Step 13: Open reviewable PR and merge only after exact-head verification**

### Task 3: Convert the existing atmosphere control into a true Klinikos theme system

**Files:**
- Modify: `src/app/design-tokens.css`
- Modify: `src/components/design/klinikos-atmosphere.tsx`
- Modify as required: `src/lib/design/atmosphere.ts`
- Modify as required: `src/app/experience-convergence.css`
- Modify as required: `src/components/clinic/app-shell.tsx`
- Test: `tests/legacy-theme-conversion.test.ts`
- Add focused tests under `tests/` for atmosphere/theme persistence and reference-lock behavior.

**Interfaces:**
- Consumes: existing `data-klinikos-atmosphere`, `data-klinikos-atmosphere-preference`, localStorage preference, design tokens.
- Produces: one theme/atmosphere system, not a second competing provider.

- [ ] **Step 1: Write failing tests proving `day`/`dawn` are not forced to the same dark tokens as `night`**
- [ ] **Step 2: Define semantic Marble/light tokens using warm ivory/limestone/rose/black-cherry values from the Klinikos system**
- [ ] **Step 3: Keep Night/Obsidian tokens faithful to current cinematic rose system**
- [ ] **Step 4: Preserve Living Home as reference-locked Obsidian where required**
- [ ] **Step 5: Make sustained operational surfaces eligible for Marble/light presentation**
- [ ] **Step 6: Preserve Auto and explicit user preference; map browser `color-scheme` accurately**
- [ ] **Step 7: Ensure tables/forms/modals/popovers/navigation have semantic tokens in both modes rather than hard-coded dark colors**
- [ ] **Step 8: Verify contrast, focus rings, reduced motion and no hydration flash**
- [ ] **Step 9: Add visual/manual QA at 1920, 1440, 1402×1122, 1024, 768 and 390 widths**
- [ ] **Step 10: Merge theme slice only after exact-head tests/build pass or documented runner-infrastructure exception is independently verified**

### Task 4: Make route/path experience immaculate and role coherent

**Files:**
- Inspect/modify: `src/components/clinic/app-shell.tsx`
- Inspect/modify: `src/lib/navigation.ts`
- Inspect/modify: `src/lib/navigation-experience.ts`
- Inspect/modify relevant `(platform)` layouts/routes
- Test existing navigation/product-control tests and add route-contract tests.

**Interfaces:**
- Consumes: authenticated session, active role, active organization/location, route metadata, capability checks.
- Produces: role-derived 4–7 destination shell, Explore Klinikos fallback, persistent Zumi, preserved task context and predictable return paths.

- [ ] **Step 1: Build route inventory for public, auth, clinic, provider, patient, Grid, EDU, Billing, admin and legal surfaces**
- [ ] **Step 2: Identify duplicates, legacy dead ends, stale aliases and routes that bypass the canonical shell**
- [ ] **Step 3: Preserve valid legacy deep links through redirects/adapters rather than breaking users**
- [ ] **Step 4: Ensure primary navigation remains role-derived and concise**
- [ ] **Step 5: Keep full authorized capability discoverable through Explore Klinikos and contextual actions**
- [ ] **Step 6: Preserve Zumi conversation continuity across trusted client navigation**
- [ ] **Step 7: Ensure page title/breadcrumb/back behavior reflects task hierarchy, not module hierarchy**
- [ ] **Step 8: Verify mobile navigation, focus return, keyboard shortcuts and accessible dialog semantics**
- [ ] **Step 9: Add end-to-end route contracts for representative front desk, provider, biller, owner, student, instructor, Grid participant and patient roles**

### Task 5: Customer first-hour experience

**Files:**
- Modify: `src/components/commercial/clinic-first-login-launch.tsx`
- Modify relevant activation/first-login routes and briefing service.
- Integrate legal acceptance state and configuration/readiness truth.

**Interfaces:**
- Consumes: legal acceptance, entitlement/payment evidence, production patient-data gate, organization/location configuration, integration readiness.
- Produces: truthful first-hour checklist and best-next-action route.

- [ ] **Step 1: Make legal agreement acceptance the first protected-workspace requirement**
- [ ] **Step 2: After acceptance, show organization activation/readiness rather than a generic dashboard wall**
- [ ] **Step 3: Surface exactly what is active, what is pending and what the user should do next**
- [ ] **Step 4: Never imply production PHI, live connection or payment state without evidence**
- [ ] **Step 5: Provide guided routes to clinic operations, team, configuration, connections and training based on actual role/readiness**
- [ ] **Step 6: Verify new-customer flow on desktop/mobile and keyboard-only**

### Task 6: Identity, profession and authority foundation

**Files:**
- Inspect first: `prisma/schema.prisma`, `src/lib/auth/`, role/capability repositories and current Grid credential models.
- Add migration only after current schema mapping.

**Interfaces:**
- Produces reusable professional identity/assignment/capability primitives consumed by Clinic OS, Grid, EDU, scheduling and billing.

- [ ] **Step 1: Inventory current user/role/provider/credential/location schema**
- [ ] **Step 2: Produce KEEP/HARDEN/GENERALIZE matrix before schema changes**
- [ ] **Step 3: Add profession separately from active application role where missing**
- [ ] **Step 4: Add effective-dated organization/location professional assignments where missing**
- [ ] **Step 5: Add explicit capability checks for high-consequence actions rather than widening generic roles**
- [ ] **Step 6: Preserve delegation/supervision/cosign extensibility**
- [ ] **Step 7: Add wrong-tenant, wrong-location, wrong-profession, expired-credential and student-production negative tests**

### Task 7: Configuration Registry + specialty composition

- [ ] **Step 1: Inventory current specialty/template/feature-entitlement configuration**
- [ ] **Step 2: Add versioned configuration registry only where current models cannot safely express inheritance**
- [ ] **Step 3: Support Base → Specialty Pack → Organization → Location inheritance**
- [ ] **Step 4: Preserve exact configuration/template version on signed historical artifacts**
- [ ] **Step 5: Build specialty packs as configuration bundles, not code forks**

### Task 8: Patient, coverage, financial case and identity matching

- [ ] **Step 1: Inventory current patient, insurance, case and identifier models**
- [ ] **Step 2: Separate patient identity from Coverage and FinancialCase where current schema conflates them**
- [ ] **Step 3: Preserve progressive registration**
- [ ] **Step 4: Add duplicate-candidate/matching workflow with manual review rather than weak automatic merge**
- [ ] **Step 5: Add No-Fault as a deep case pack using reusable case primitives**

### Task 9: Scheduling, appointment series and capacity

- [ ] **Step 1: Inventory current appointment/provider/location/resource models**
- [ ] **Step 2: Add appointment-series semantics without breaking existing appointments**
- [ ] **Step 3: Resolve availability from provider + assignment + location + service + resource + payer/case/readiness where applicable**
- [ ] **Step 4: Reuse capacity primitives with Grid rather than duplicate them**
- [ ] **Step 5: Add waitlist/cancellation recovery events only from real availability**

### Task 10: Clinical composition, Current Visit and Clinical Change Graph

- [ ] **Step 1: Inventory encounter/note/template/observation/body-map models**
- [ ] **Step 2: Build reusable versioned clinical components instead of cloned specialty notes**
- [ ] **Step 3: Converge Current Visit to Snapshot → Today → What Changed → Assessment/Plan → Orders/Results → Documentation/Coding → Close**
- [ ] **Step 4: Version body maps**
- [ ] **Step 5: Add evidence-linked initial/previous/today change representation**
- [ ] **Step 6: Add synthetic No-Fault golden case regression**

### Task 11: Orders, results and integration operations

- [ ] **Step 1: Inventory current lab/imaging/medication/referral models and external adapters**
- [ ] **Step 2: Generalize to canonical typed ServiceOrder only where migration is safe**
- [ ] **Step 3: Add explicit order/result state events**
- [ ] **Step 4: Preserve corrected/amended result versions and reopen required review**
- [ ] **Step 5: Add durable outbox/inbox/idempotency/correlation semantics where missing**
- [ ] **Step 6: Add Mapping & Reconciliation Workbench for unknown/unmatched/rejected events**
- [ ] **Step 7: Keep authoritative specimen/vendor catalog requirements outside generative AI**

### Task 12: Revenue Integrity, terminology and clearinghouse convergence

- [ ] **Step 1: Inventory current billing/coding/claim/payment models**
- [ ] **Step 2: Add versioned terminology/effective-date service only where current code is insufficient**
- [ ] **Step 3: Link clinical evidence → expected charge → charge → claim → response → remittance → reconciliation**
- [ ] **Step 4: Add evidence-backed revenue exceptions without inferring unsupported billability**
- [ ] **Step 5: Preserve canonical claim truth independent of clearinghouse vendor**
- [ ] **Step 6: Connect external clearinghouse only through truthful adapter lifecycle**

### Task 13: Credentialing convergence

- [ ] **Step 1: Distinguish license/NPI/verification/enrollment/privilege/malpractice/sanctions/certification states**
- [ ] **Step 2: Make provider × location × payer × specialty/service × effective-date readiness queryable**
- [ ] **Step 3: Feed readiness into scheduling, billing and Grid eligibility**
- [ ] **Step 4: Never treat uploaded evidence as primary-source verification**

### Task 14: Grid and EDU convergence

- [ ] **Step 1: Reuse shared identity/authority/capacity/financial primitives**
- [ ] **Step 2: Convert authorized Clinic OS capacity/gaps into Grid demand/supply**
- [ ] **Step 3: Keep minimum-necessary privacy during matching**
- [ ] **Step 4: Feed EDU evidence into credential/eligibility review without granting authority**
- [ ] **Step 5: Preserve student simulation/production separation**

### Task 15: Zumi Memory & Knowledge OS

- [ ] **Step 1: Audit current bounded conversation continuity and any existing durable memory repositories**
- [ ] **Step 2: Add governed memory metadata/provenance before bulk persistence**
- [ ] **Step 3: Implement authority levels, tenant/subject scope, supersession, expiry and audit**
- [ ] **Step 4: Start with explicit preferences/goals, approved organization knowledge, product truth references, decisions and measured outcomes**
- [ ] **Step 5: Retrieve clinical/financial/credential truth from authoritative domains instead of duplicating it into AI memory**
- [ ] **Step 6: Build context assembly after authorization/minimization**
- [ ] **Step 7: Add memory correction/forget controls where policy permits**
- [ ] **Step 8: Add memory poisoning, prompt injection, cross-tenant and stale-truth tests**

### Task 16: Canonical Reference Environment and customer acceptance

- [ ] **Step 1: Populate synthetic organizations, locations, roles, patients, cases, payers, orders/results, claims, Grid resources and EDU users**
- [ ] **Step 2: Demonstrate specialty configuration without code forks**
- [ ] **Step 3: Demonstrate negative access cases**
- [ ] **Step 4: Demonstrate integration exception queues and simulated external rails with explicit simulated labels**
- [ ] **Step 5: Use the Reference Environment for sales, training, QA and customer UAT**
- [ ] **Step 6: Run customer-discussion acceptance matrix: every material clinician/IT/billing/operator observation maps to visible workflow, backend primitive, backlog dependency or explicit defer decision**

### Task 17: Enterprise, quality, public health, remote care and later regulated rails

- [ ] **Step 1: Build enterprise command views only after shared primitives are stable**
- [ ] **Step 2: Add validated quality/population-health measures with versioned definitions**
- [ ] **Step 3: Add remote monitoring/device workflows with source/provenance and alert ownership**
- [ ] **Step 4: Add public-health/research/network-exchange rails only when contracts, standards and policy are verified**
- [ ] **Step 5: Evaluate ONC/certification/TEFCA/eRx/EPCS/PDMP strategy using current primary sources before claiming readiness**

## Program completion gate

The program is not complete because architecture docs exist or screens look polished. Completion requires:

- accepted customer-discussion insights mapped and traceable;
- protected first-access legal flow implemented and verified before production enablement;
- real purposeful light/dark experience preserving Klinikos art direction;
- no broken/dead-end route paths for representative roles;
- responsive/accessibility acceptance;
- shared authority/configuration/patient/capacity primitives used across engines;
- Clinical Change/Evidence and order/result reconciliation proven with synthetic cases;
- revenue integrity tied to evidence;
- Grid/EDU convergence without authority leakage;
- Zumi memory governed by source, scope, supersession and revalidation;
- Reference Environment demonstrates positive and forbidden journeys;
- feature/external status remains truthful;
- exact-head tests/build/journey evidence exists for each merged slice.
