# Klinikos Final-Form Onboarding Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Klinikos's existing public Living Home and Zumi acquisition surfaces to a truthful, privacy-safe, Black Label onboarding funnel that can accept real clinic prospects now and carry verified commercial customers into the existing signed activation flow without weakening payment, identity, organization, or PHI authority.

**Architecture:** Reuse the current public Zumi resolver, public DemoReservation/commercial intake, payment-verification truth, signed activation tokens, and provisioned clinic activation. Add the missing `/auth` Universal Entry Router as a non-authoritative continuation surface, replace the legacy `/start` product menu with that router, and retire the dead public-facing implication that `/api/onboarding/organizations` can create a production clinic. No new authentication authority or parallel onboarding database is introduced in this tranche.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5.9, Prisma 6.14, Zod 4, Vitest 3.2, existing Klinikos design system and security gates.

**Spec:** `docs/superpowers/specs/2026-08-26-klinikos-final-form-universal-experience-design.md`

## Global Constraints

- Current repository truth wins over old chat or stale docs.
- Public Living Home remains conversation-first; do not replace it with a persona/product menu.
- Public Zumi may understand and route safe intent but may not grant authority.
- Public onboarding must forbid PHI and authentication/payment secrets from AI processing.
- A public clinic intake may create a prospect/reservation only; it must not create paid software, clinical authority, organization authority, or production-PHI permission.
- Payment browser return is not payment evidence. Existing server-side payment verification remains authoritative.
- Paid clinic activation remains token-bound, server-owned, and dependent on verified commercial state.
- Passwords must never be autosaved in onboarding drafts.
- No private company strategy, proprietary routing/ranking logic, secrets, environment topology, raw database identifiers, internal scores, or operator-only data may enter the public browser bundle or public API response.
- Browser receives only minimum-necessary presentation DTOs and opaque/signed continuation references.
- Visual direction is Obsidian / Black Cherry / Oxblood / Warm Ivory / Dusty Rose. Remove legacy cyan/gold SaaS treatment from release-critical onboarding routes.
- Transparency/glass is reserved for bounded atmospheric or conversational layers such as the Zumi composer or small floating overlays. Data-entry forms and sensitive confirmation surfaces use solid high-contrast surfaces.
- Mobile support must cover 320, 375, 390, 430, 768, 1024, 1280 and 1440+ widths.
- Accessibility requires keyboard operation, visible focus, semantic labels/headings, live status announcements where state changes, contrast, zoom/reflow, and reduced-motion respect.
- Existing `Person` / `OrganizationMembership` foundation remains additive and does not replace current authentication/tenant authority in this tranche.
- No direct production use of `createOrganizationWorkspace`; `/api/onboarding/organizations` remains non-production synthetic-only.
- No new Prisma model or migration unless a required durable fact cannot be represented by the existing public DemoReservation/commercial truth. Current analysis shows no new model is necessary for clinic acquisition.
- All release claims require executable evidence. GitHub Actions being blocked is not a green result.

---

### Task 1: Lock the release contract with tests before implementation

**Files:**
- Create: `tests/final-form-onboarding-release.test.ts`
- Read: `tests/public-orchestration-browser-boundary.test.ts`
- Read: `tests/public-zumi-api-contract.test.ts`
- Read: `tests/analysis-activation.test.ts`
- Read: `tests/mvp-commercial-activation.test.ts`

**Interfaces:**
- Consumes existing public Zumi, sales reservation, payment-return, and activation routes.
- Produces a regression contract for the route and privacy behavior in Tasks 2-7.

- [ ] **Step 1: Write a failing source-contract test** asserting all of the following:
  - `src/app/auth/page.tsx` exists and renders the Universal Entry Router.
  - `/start` delegates to `/auth` instead of rendering a product-category menu.
  - `/auth` and its client component do not import proprietary server orchestration/runtime modules.
  - the public clinic path sends clinic-owner intent to the existing `/sales` acquisition route.
  - `/api/onboarding/organizations` remains explicitly synthetic/non-production only.
  - `/activate` continues to require a signed token and never accepts plan/payment/organization authority from the browser.
  - public onboarding copy forbids PHI.
  - password is not present in activation autosave draft serialization.
  - public browser files contain no `DATABASE_URL`, secret env access, raw checkout/organization authority, internal scoring weights, or private company strategy references.
  - `/auth`, `/start`, `/sales`, and `/activate` are covered by the intended screen-experience families.
- [ ] **Step 2: Run `npm test -- tests/final-form-onboarding-release.test.ts` in an executable checkout. Expected initial result:** FAIL because `/auth` is missing and `/start` still renders the legacy menu.
- [ ] **Step 3: Commit only the failing contract before production implementation.**

### Task 2: Implement the non-authoritative Universal Entry Router

**Files:**
- Create: `src/app/auth/page.tsx`
- Create: `src/components/auth/universal-entry-router.tsx`
- Read/reuse: `src/components/marketing/public-living-gateway.tsx`
- Read/reuse: `src/lib/distribution/public-continuation.ts`
- Read/reuse: `src/app/api/zumi/public/route.ts` if present through current route structure

**Interfaces:**
- Consumes: `/api/zumi/public` minimum-necessary public resolution DTO.
- Produces: public continuation to existing safe routes only; no account, role, credential, payment, or organization authority.

- [ ] **Step 1:** Add test expectations that the router accepts an optional safe `intent` handoff and provides one conversational input plus example prompts, not a permanent persona selector.
- [ ] **Step 2:** Implement `src/app/auth/page.tsx` as a server shell using current Black Label brand/design tokens, metadata, and `robots` appropriate for a public continuation surface.
- [ ] **Step 3:** Implement `UniversalEntryRouter` as a client component that posts non-sensitive intent to `/api/zumi/public`, validates the returned public resolution shape, and routes only through an explicit public-safe allowlist or existing protected-continuation helper.
- [ ] **Step 4:** Include clear return-user sign-in and patient-portal links, but do not collect passwords on this public router.
- [ ] **Step 5:** Add public copy stating that identity/organization/professional authority is verified only when the requested action requires it and that PHI should not be entered here.
- [ ] **Step 6:** Keep the proprietary resolution/ranking engine server-side; only public DTO types or duplicated narrow public DTO interfaces may be in the browser.
- [ ] **Step 7:** Run focused tests when an executable checkout is available.

### Task 3: Replace `/start` product selection with final-form continuation

**Files:**
- Modify: `src/app/start/page.tsx`

**Interfaces:**
- Consumes: `/auth` Universal Entry Router.
- Produces: compatibility entry route for old links without keeping a second product-menu experience.

- [ ] **Step 1:** Update the regression test to require `/start` to redirect to `/auth` while preserving safe optional query intent where feasible.
- [ ] **Step 2:** Replace the legacy four-card product menu with a server redirect to `/auth`.
- [ ] **Step 3:** Confirm no old cyan/gold UI from `/start` remains in the browser path.

### Task 4: Connect clinic-owner onboarding intent to existing public commercial intake

**Files:**
- Modify: `src/components/auth/universal-entry-router.tsx`
- Modify only if needed: `src/components/marketing/public-living-gateway.tsx`
- Read/reuse: `src/app/sales/page.tsx`
- Read/reuse: `src/components/command/zumi-interview.tsx`
- Read/reuse: `src/app/api/sales/reservations/route.ts`
- Read/reuse: `src/lib/repositories/sales-demo-repository.ts`

**Interfaces:**
- Consumes: current public sales reservation API and Zumi interview.
- Produces: real persisted clinic onboarding/prospect intake that leads to the correct commercial next step.

- [ ] **Step 1:** Add tests proving a clinic-owner/clinic-operations destination resolves to `/sales` or an existing equivalent clinic-acquisition route, never `/api/onboarding/organizations`.
- [ ] **Step 2:** Ensure the router's clinic-owner examples explicitly direct to the clinic operating analysis/onboarding conversation rather than sign-in-only Clinic OS.
- [ ] **Step 3:** Verify public sales intake remains rate-limited and `Cache-Control: no-store`.
- [ ] **Step 4:** Verify public intake creates only `DemoReservation`/commercial prospect truth and no production `User`, paid `Organization`, or PHI capability.
- [ ] **Step 5:** Keep exact checkout amount/provider selection server-owned.

### Task 5: Preserve verified commercial → signed activation → workspace handoff

**Files:**
- Read/modify only if needed: `src/app/payments/success/page.tsx`
- Read/modify only if needed: `src/components/commercial/payment-return-experience.tsx`
- Read/modify only if needed: `src/lib/commercial/analysis-activation.ts`
- Read/reuse: `src/lib/commercial/clinic-provisioning.ts`
- Read/reuse: `src/app/api/onboarding/activate/route.ts`
- Read/reuse: `src/app/activate/page.tsx`
- Read/reuse: `src/components/commercial/clinic-activation-form.tsx`

**Interfaces:**
- Consumes: signed reservation/payment evidence and paid clinic provisioning truth.
- Produces: one truthful, opaque activation path for commercially approved clinic activation.

- [ ] **Step 1:** Add tests that browser return never marks payment verified.
- [ ] **Step 2:** Add tests that activation authority is carried only by opaque/signed token and server-side records.
- [ ] **Step 3:** Verify payment-return UI never exposes raw reservation IDs, internal provider metadata, environment configuration, or operator notes.
- [ ] **Step 4:** Verify final paid workspace activation requires server-confirmed subscription/payment state before user creation.
- [ ] **Step 5:** Verify the activation draft excludes password and production PHI remains disabled after paid access until separate production approval.
- [ ] **Step 6:** If existing code already satisfies every test, do not rewrite it; record it as already-correct in the PR.

### Task 6: Converge onboarding visuals onto Black Label design

**Files:**
- Modify: `src/app/auth/page.tsx`
- Modify: `src/components/auth/universal-entry-router.tsx`
- Modify if necessary: `src/app/activate/page.tsx`
- Modify if necessary: `src/components/commercial/clinic-activation-form.tsx`
- Modify if necessary: `src/app/sales/page.tsx`
- Inspect/port current-safe fixes from open PR #354 rather than copying stale branch history.

**Interfaces:**
- Consumes: current design tokens and approved brand assets.
- Produces: one coherent acquisition/onboarding visual language.

- [ ] **Step 1:** Use Obsidian/Black Cherry/Oxblood structure, Warm Ivory text, and Dusty Rose/Ember accents.
- [ ] **Step 2:** Use glass/transparency only on the conversational composer or small floating/status layers; keep forms and confirmation panels solid and high-contrast.
- [ ] **Step 3:** Remove legacy cyan/gold product-menu treatments from any release-critical onboarding surface touched by this tranche.
- [ ] **Step 4:** Keep buttons at >= 4.5:1 text contrast and visible focus.
- [ ] **Step 5:** Ensure no meaningful information is conveyed solely through color or transparency.
- [ ] **Step 6:** Keep decorative atmosphere `pointer-events-none`, non-semantic, and reduced-motion safe.

### Task 7: Complete screen-experience and repository truth for the release-critical paths

**Files:**
- Modify: `src/lib/screen-experience-contracts.ts` only if route patterns need exact additions.
- Modify: `docs/ROUTE_REGISTRY_STATUS.md`
- Create or modify tests: `tests/final-form-onboarding-release.test.ts`

**Interfaces:**
- Consumes: existing `public-discovery` and `auth-signup` contracts.
- Produces: accurate route registry matching actual code.

- [ ] **Step 1:** Ensure `/auth`, `/start`, `/sales`, `/payments/success`, `/activate`, `/login`, and relevant onboarding APIs are accurately classified.
- [ ] **Step 2:** Remove stale registry claims for routes that do not exist; do not mark a route `CONTRACT_COMPLETE` without evidence.
- [ ] **Step 3:** Explicitly state public/private projection, PHI gate, Zumi authority boundary, minimum necessary data, error/loading/blocked states, mobile and accessibility requirements.
- [ ] **Step 4:** Keep operator/admin commercial routes intentionally hidden from public navigation and projections.

### Task 8: Security, responsive, accessibility and release verification

**Files/commands:**
- Tests from Tasks 1-7.
- Existing security scripts in `package.json`.

**Interfaces:**
- Produces evidence required before merge/deploy.

- [ ] **Step 1:** Run focused: `npm test -- tests/final-form-onboarding-release.test.ts tests/public-orchestration-browser-boundary.test.ts tests/public-zumi-api-contract.test.ts tests/analysis-activation.test.ts tests/mvp-commercial-activation.test.ts`.
- [ ] **Step 2:** Run `npm run type-check`.
- [ ] **Step 3:** Run `npm run lint`.
- [ ] **Step 4:** Run `npm run security:check`.
- [ ] **Step 5:** Run full `npm test`.
- [ ] **Step 6:** Run `npm run build`.
- [ ] **Step 7:** Browser QA at 320, 375, 390, 430, 768, 1024, 1280, and 1440+ for `/`, `/auth`, `/start`, `/sales`, `/payments/success`, `/activate`, and first post-activation destination. Confirm no horizontal overflow, clipped composer/buttons, hidden submit controls, or broken focus order.
- [ ] **Step 8:** Accessibility QA: keyboard-only complete flow, screen-reader headings/labels/status, focus visibility, 200% zoom/reflow, reduced motion, contrast.
- [ ] **Step 9:** Privacy QA in browser/network responses: no private strategy, proprietary weights, raw DB IDs used as authority, PHI, secrets, passwords, env values, operator notes, hidden customer data, or false live/integration claims.
- [ ] **Step 10:** Reconcile latest `main` immediately before integration and inspect overlapping open PRs.
- [ ] **Step 11:** If any verification cannot execute, keep the PR draft and state the exact missing evidence. Do not call the release green or production-ready.

## Release Success Criteria

A new clinic owner can arrive at `klinikos.io`, tell Zumi in ordinary language that they run a clinic or need operational help, reach a coherent Black Label onboarding conversation, submit a real non-PHI commercial intake, receive the correct server-owned next commercial step, and after verified commercial approval follow an opaque signed activation path to create their owner account and workspace. At no point does public input grant paid access, organization authority, clinical authority, payment state, or production PHI permission.

A non-clinic visitor can use the same public entry and be routed toward Grid, EDU, patient/public discovery, or sign-in without learning internal product taxonomy.

The browser never receives private company strategy, proprietary routing logic, secrets, operator-only data, PHI, or authority-bearing raw identifiers.
