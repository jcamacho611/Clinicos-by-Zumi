# Final-Form Universal Frontend Tranche 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish repository truth, a public-safe universal path catalogue, and the first progressive-disclosure homepage layer without changing existing identity, legal, clinical, Grid, EDU or payment authority.

**Architecture:** Keep current public Zumi and governed domain stores authoritative. Add a pure presentation catalogue for user paths, backed by explicit truth states, then render that catalogue below the existing conversation-first hero. This tranche does not create accounts, permissions, organization claims, credentials or new Grid persistence.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind, Vitest source-contract tests.

**Spec:** `docs/superpowers/specs/2026-08-26-final-form-universal-frontend-design.md`

## Global Constraints

- Branch only; never implement directly on `main`.
- Re-read current main before merge and reconcile if it moved.
- Do not modify `src/components/marketing/public-living-gateway.tsx` in this tranche because protected-entry PR #263 also owns it.
- Do not modify Prisma/schema/migrations.
- Do not grant identity, organization, professional, clinical, EDU, Grid or payment authority.
- Do not claim future path capabilities are production-live.
- Public routing engine remains server-owned; no confidential intent engine may enter the browser bundle.
- Use current Obsidian/rose public design language and existing accessibility conventions.

---

### Task 1: Repository Truth Canon and Work Ledger

**Files:**
- Create: `docs/KLINIKOS_PRODUCT_TRUTH_CANON.md`
- Create: `docs/operations/KLINIKOS_WORK_LEDGER.md`

**Interfaces:**
- Consumes: current main SHA, current open PR inventory, existing feature registry canon.
- Produces: evidence hierarchy and persistent active-work ledger for future tranches.

- [ ] **Step 1:** Record the current main SHA and material open PRs affecting universal entry, identity/account, Living Home, Workforce, legal access, Grid/Trust/Interoperability and deployment.
- [ ] **Step 2:** Define canonical product truth states and evidence precedence.
- [ ] **Step 3:** Record explicit rules for `merged != deployed` and `deployed != production verified`.
- [ ] **Step 4:** Record current concurrency boundaries and the next implementation tranches.
- [ ] **Step 5:** Commit the two documents.

### Task 2: Public-Safe Universal Path Catalogue Test

**Files:**
- Create: `tests/final-form-public-paths.test.ts`
- Create later in Task 3: `src/lib/orchestration/public-path-catalog.ts`

**Interfaces:**
- Produces required source contract for path keys, truth-state vocabulary and no-authority invariant.

- [ ] **Step 1:** Write a failing Vitest contract expecting at least the required patient, caregiver, student, worker, professional, clinic owner, clinic staff, employer, school, workforce, educator, vendor, capacity, investor, entrepreneur, partner, procurement, referrer and enterprise paths.
- [ ] **Step 2:** Require every path to have a stable key, public destination, entry examples, first-value statement, verification summary, economics summary and truth state.
- [ ] **Step 3:** Require truth-state values to be one of `AVAILABLE_NOW`, `GOVERNED_ACCOUNT_REQUIRED`, `ACTIVE_DEVELOPMENT`, `PLANNED`.
- [ ] **Step 4:** Require the module to state that path metadata has no authority effect.
- [ ] **Step 5:** Commit the failing contract before implementation.

### Task 3: Implement Public-Safe Universal Path Catalogue

**Files:**
- Create: `src/lib/orchestration/public-path-catalog.ts`
- Test: `tests/final-form-public-paths.test.ts`

**Interfaces:**
- Produces: `PUBLIC_PATH_CATALOG`, `PUBLIC_ENTRY_FAMILIES`, `PublicPathDefinition`, `PublicPathTruthState`.
- Consumers: public homepage section only in this tranche.

- [ ] **Step 1:** Implement the exact truth-state type.
- [ ] **Step 2:** Implement all required path definitions using only current public/governed destinations.
- [ ] **Step 3:** Mark future/unmerged behavior as `ACTIVE_DEVELOPMENT` or `PLANNED`, never `AVAILABLE_NOW`.
- [ ] **Step 4:** Add curated entry families for `Get care`, `Find work`, `Run healthcare`, `Learn`, `Offer capacity`, and `Partner / build`.
- [ ] **Step 5:** Ensure exported data contains no credential, permission, clinical, payment or organization-authority mutation.
- [ ] **Step 6:** Run focused test when executable environment is available; otherwise record verification blocker without claiming green.
- [ ] **Step 7:** Commit implementation.

### Task 4: Progressive-Disclosure Universal Path Section

**Files:**
- Create: `src/components/marketing/universal-pathways-section.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/final-form-public-paths.test.ts`

**Interfaces:**
- Consumes: `PUBLIC_ENTRY_FAMILIES`.
- Produces: a public, accessible below-the-fold section that teaches visitors they can start with a goal rather than a product menu.

- [ ] **Step 1:** Extend test to require homepage import/render of `UniversalPathwaysSection` after `PublicLivingGateway` and before detailed product evidence.
- [ ] **Step 2:** Build an Obsidian/rose section with one headline, six intent families, example human-language prompts and current destination CTA.
- [ ] **Step 3:** Do not show internal truth-state labels to users; use truth states only to determine safe copy/CTA behavior.
- [ ] **Step 4:** Make non-live paths informational only; do not provide a CTA that implies unavailable functionality is usable now.
- [ ] **Step 5:** Add accessible headings, lists, keyboard-focusable links and mobile layout.
- [ ] **Step 6:** Wire the section into `src/app/page.tsx` without modifying `PublicLivingGateway`.
- [ ] **Step 7:** Run focused test when executable environment is available; otherwise record blocker.
- [ ] **Step 8:** Commit.

### Task 5: Truth/Overlap Review and Draft PR

**Files:**
- Review all branch files.
- Update: `docs/operations/KLINIKOS_WORK_LEDGER.md` if main or PR state moved.

**Interfaces:**
- Produces: conflict-aware draft PR for review, not a production claim.

- [ ] **Step 1:** Compare branch against latest main.
- [ ] **Step 2:** Confirm no overlap with active protected-entry file `src/components/marketing/public-living-gateway.tsx`.
- [ ] **Step 3:** Confirm no schema, auth, session, clinical, payment, EDU completion or Grid authority files changed.
- [ ] **Step 4:** Inspect diff for public capability inflation.
- [ ] **Step 5:** Open draft PR with exact verification truth and next tranche list.

## Next tranches after this one

2. Reconcile universal protected entry + universal Account/identity into progressive verification UX.
3. Build claim-aware business/student/professional verification paths.
4. Converge Zumi-assisted `I NEED / I HAVE` Grid creation and matching UX.
5. Rebuild authenticated Living Home around path-aware return state.
6. Converge patient, professional, clinic, EDU and enterprise surfaces into the same design system.
7. Add upload-to-structured-intent confirmation flow.
8. Add contextual referral loops and network-growth mechanics.
9. Add entitlement/commercial surfaces without authority coupling.
10. Run global responsive/accessibility/performance/security/truth release gate.
