# Klinikos Universal Frontend Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current fragmented/cinematic-heavy Klinikos frontend into the healthcare-first universal experience defined by `docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md`, while preserving existing domain truth, security boundaries, and working product behavior.

**Architecture:** Perform a dependency-ordered convergence rather than a big-bang rewrite. First reconcile shared design tokens and shell behavior, then role-specific Homes and clinical operations, then Current Visit, Money, Grid, EDU, enterprise/admin surfaces, and finally mobile/accessibility/browser parity. Existing domain repositories, APIs, authorization, financial semantics, Grid eligibility, and Zumi orchestration remain authoritative; frontend work consumes minimum-necessary server projections.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5.9, Tailwind CSS 4, Framer Motion 12, Radix primitives, Lucide, Vitest, Prisma/PostgreSQL.

**Spec:** `docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md`

## Global Constraints

- Normal operational UI is light-first, healthcare-first, calm, spacious, professional, and accessible.
- Dark Obsidian is optional, not the mandatory clinical default.
- No video-game/neon/cyberpunk operational UI.
- No five-plane architecture map as a normal dashboard.
- Persistent navigation is role-derived and generally limited to 4–7 destinations.
- Zumi remains ambient intelligence and never widens authority.
- Frontend is never the authorization/confidentiality boundary.
- All consequential state remains truthful; no fake payment, provider, result, referral, Grid, message, fulfillment, or integration states.
- Grid eligibility precedes ranking.
- Current Visit remains the provider-facing clinical convergence surface.
- Patient experience remains dramatically simpler than staff/enterprise UI.
- 320px+ reflow, keyboard-only operation, 200% zoom, visible focus, reduced motion, and non-color status communication are merge requirements.
- Required verification commands include `npm run db:validate`, `npm run type-check`, `npm run lint`, `npm run test`, `npm run test:mvp`, `npm run security:check`, and `npm run build` as applicable.

---

### Task 1: Build the route and surface census

**Files:**
- Inspect: `src/app/`
- Inspect: `src/components/`
- Inspect: `src/features/`
- Create: `docs/design/KLINIKOS_FRONTEND_ROUTE_CENSUS_2026-08-30.md`

**Interfaces:**
- Consumes: current route tree and universal frontend canon.
- Produces: one authoritative migration table used by Tasks 2–14.

- [ ] **Step 1: Enumerate every page route** under `src/app/`, including route groups, public routes, authenticated routes, patient/provider portals, Grid, EDU, admin, legal, errors, loading states, and API-adjacent UI routes.
- [ ] **Step 2: Classify each route** as `KEEP`, `RESTYLE`, `RECOMPOSE`, `MERGE`, `DEPRECATE`, `REDIRECT`, or `EXPERT-ONLY`.
- [ ] **Step 3: Assign each route** a user role, primary goal, expected outcome, role navigation family, governing canon, and source-of-truth dependency.
- [ ] **Step 4: Identify UI fiction and stale visual debt**, especially dark-only pages, giant card walls, fake dashboards, architecture-style UI, duplicate navigation, stale branding, fake data assumptions, or visually exposed internal system structure.
- [ ] **Step 5: Commit the census** before changing application code.

### Task 2: Establish the clinical-light design token foundation

**Files:**
- Modify: `src/app/design-tokens.css`
- Modify: `src/app/accessibility.css`
- Audit: `src/app/cinematic-global.css`
- Audit: `src/app/cinematic-home-overrides.css`
- Audit: `src/app/cinematic-command-overrides.css`
- Audit: `src/app/cinematic-legacy-overrides.css`
- Inspect/update: `src/components/ds/`
- Inspect/update: `src/components/ui/`
- Test: existing design/accessibility tests plus new focused token assertions where present.

**Interfaces:**
- Produces: semantic tokens for white/pearl/mist surfaces, graphite/slate text, clinical teal/sage/medical-blue interaction accents, precise status colors, spacing, focus, radii, elevation, and optional Obsidian theme.

- [ ] **Step 1: Write failing token assertions** proving operational surfaces have semantic light clinical tokens and that dark tokens remain theme-scoped rather than global defaults.
- [ ] **Step 2: Run focused tests** and confirm failure before implementation.
- [ ] **Step 3: Add semantic tokens** from the universal canon without hardcoding colors independently in every route.
- [ ] **Step 4: Remove or isolate cinematic CSS rules** that globally force black backgrounds, glow, rose/constellation imagery, or dark-only component assumptions.
- [ ] **Step 5: Preserve intentional public/dark presentation support** behind explicit theme/surface classes.
- [ ] **Step 6: Verify focus contrast, text contrast, reduced motion, and 200% zoom behavior.**
- [ ] **Step 7: Run focused tests and commit.**

### Task 3: Converge brand and shell primitives

**Files:**
- Inspect/update: `src/components/brand/`
- Inspect/update: `src/components/design/`
- Inspect/update: `src/components/command/`
- Inspect/update: authenticated layouts under `src/app/(clinic)/` and `src/app/(platform)/`
- Use approved assets under `public/`.

**Interfaces:**
- Produces: one role-aware Klinikos shell with brand, active context, 4–7 destination navigation, Ask Klinikos, profile/context control, and Explore Klinikos.

- [ ] **Step 1: Add tests for role-derived navigation** covering clinic owner, front desk, provider, biller, quality, patient, and learner presentation defaults.
- [ ] **Step 2: Prove navigation does not create authorization** by preserving server-side access tests/negative cases.
- [ ] **Step 3: Implement the light clinical shell** using the real Klinikos wordmark/orbital mark at restrained sizes.
- [ ] **Step 4: Remove duplicate simultaneous mega-nav/sidebar/subnav patterns** on migrated routes.
- [ ] **Step 5: Preserve persistent Ask Klinikos access** without creating a second assistant.
- [ ] **Step 6: Verify keyboard navigation, focus order, mobile shell behavior, and commit.**

### Task 4: Rebuild Living Home as an adaptive briefing

**Files:**
- Modify: `src/app/page.tsx`
- Inspect/update: current Living Home components in `src/components/command/` and related public/authenticated intent components.
- Test: Living Home source/behavior tests and MVP journeys.

**Interfaces:**
- Consumes: structured attention items and governed Zumi/route services.
- Produces: role-aware Home with one primary priority/all-clear, 2–4 attention items, one supported contextual opportunity, and Ask Klinikos.

- [ ] **Step 1: Write failing tests** that reject KPI-card-wall rendering and require structured attention items with actions.
- [ ] **Step 2: Implement light clinical Home** with calm typography and whitespace.
- [ ] **Step 3: Remove giant ecosystem-ball/architecture-map treatment** from normal authenticated Home.
- [ ] **Step 4: Preserve public brand moments only where they do not compete with value/action.**
- [ ] **Step 5: Verify degraded/empty/error/provider-disabled Zumi behavior.**
- [ ] **Step 6: Test at 1440, 768, 390 and 320 widths; commit.**

### Task 5: Front Desk Today and registration readiness

**Files:**
- Inspect/update: front-desk routes in `src/app/(clinic)/` and/or `src/app/(platform)/`
- Inspect/update: `src/components/clinic/`
- Test: front-desk workflow tests and MVP journey coverage.

**Interfaces:**
- Produces: `Home → Today → patient blocker → resolve → handoff` route.

- [ ] **Step 1: Add a failing journey test** for arrival, missing registration item, resolution, and handoff.
- [ ] **Step 2: Recompose Today around arrivals, blockers, next action, and minimum-necessary administrative context.**
- [ ] **Step 3: Remove unnecessary clinical detail from front-desk projections.**
- [ ] **Step 4: Add truthful empty/loading/permission/error states.**
- [ ] **Step 5: Verify keyboard/mobile and commit.**

### Task 6: MA/LPN/RN staff handoff convergence

**Files:**
- Inspect/update: clinical staff routes under `src/app/(clinic)/`
- Inspect/update: `src/components/clinic/`
- Read/use: existing encounter/intake repositories and `KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`
- Test: encounter/staff-handoff tests.

**Interfaces:**
- Produces: encounter-specific handoff state distinguishing patient-reported, staff-captured, unresolved, and provider-review-required information.

- [ ] **Step 1: Write failing role tests** proving MA/LPN/RN presentation and permitted actions differ without relying on client-side hiding for authority.
- [ ] **Step 2: Implement intake/handoff sequence** for reason, vitals, meds/allergies, symptoms/screens/body context, unresolved questions, and completion state where current authoritative schema supports it.
- [ ] **Step 3: Do not invent persisted data that the backend does not yet own.** Label unsupported target states explicitly or defer them.
- [ ] **Step 4: Verify provider receives a truthful encounter-specific handoff and commit.**

### Task 7: Provider Current Visit convergence

**Files:**
- Inspect/update: provider/encounter routes under `src/app/(clinic)/` and `src/app/(platform)/`
- Inspect/update: `src/components/clinic/`
- Read/use: `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`
- Test: encounter lifecycle, result correction, referral evidence, signature/lock/addendum, and coding tests.

**Interfaces:**
- Produces: `Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`.

- [ ] **Step 1: Add a failing synthetic clinical journey** including improving symptom, unchanged symptom, new concern, corrected result, received specialist evidence, and unresolved Close Visit items.
- [ ] **Step 2: Build the first viewport** to answer identity, reason, change, handoff, and provider-required judgment.
- [ ] **Step 3: Preserve deterministic change truth** and keep AI summaries subordinate to source evidence.
- [ ] **Step 4: Ensure corrected results can reopen review** and result visibility never equals closure.
- [ ] **Step 5: Keep specialist evidence received distinct from adoption/referral closure.**
- [ ] **Step 6: Keep encounter signature distinct from financial completion.**
- [ ] **Step 7: Verify mobile Current Visit and commit.**

### Task 8: Patient and provider longitudinal object stages

**Files:**
- Inspect/update: patient routes under `src/app/(clinic)/`, `src/app/(platform)/`, and `src/app/portal/`
- Inspect/update: `src/components/portal/`, `src/components/clinic/`
- Test: patient resource authorization and portal tests.

**Interfaces:**
- Produces: patient Object Stage for staff/provider and simplified patient portal for patients/proxies.

- [ ] **Step 1: Add negative-access tests** proving owner/admin, proxy, patient, and clinical roles do not collapse into the same chart authority.
- [ ] **Step 2: Recompose staff/provider patient view around identity, change, unfinished work, evidence, timeline, and contextual actions.**
- [ ] **Step 3: Keep patient portal around Home, Appointments, Forms, Messages, Account with contextual Results/Payments only when authorized.**
- [ ] **Step 4: Add proxy-context labeling and audit-safe transitions where supported.**
- [ ] **Step 5: Verify mobile/accessibility and commit.**

### Task 9: Money / Billing / Revenue Readiness

**Files:**
- Inspect/update: billing/financial routes under `src/app/(platform)/`
- Inspect/update: relevant financial components and repositories.
- Test: financial truth, entitlement/payment evidence, claim/revenue-readiness tests.

**Interfaces:**
- Produces: action-first revenue workflow exposing exact stop point and owner/action.

- [ ] **Step 1: Add failing tests** preventing `redirect = payment`, `signed note = revenue complete`, or estimated opportunity = collected cash.
- [ ] **Step 2: Recompose Money around actionable blockers rather than chart walls.**
- [ ] **Step 3: Present the chain `performed → documented → coded → charge → claim ready → accepted → paid → reconciled` only to the depth relevant to the current action.**
- [ ] **Step 4: Add empty/error/manual-fallback states and commit.**

### Task 10: Grid universal exchange UI

**Files:**
- Modify: `src/app/grid/`
- Modify: `src/app/(platform)/grid/`
- Modify: `src/components/grid/`
- Consume: `src/lib/grid/`
- Test: Grid eligibility, map, transaction, privacy, location, and marketplace journeys.

**Interfaces:**
- Produces: `I NEED / I HAVE → requirements → eligibility → list/map → inspect → offer/request → transaction next state`.

- [ ] **Step 1: Add failing UI/journey tests** requiring eligibility before ranking and banning fake pins/inventory.
- [ ] **Step 2: Replace category-card-wall entry** with intent-first `WHAT DO YOU NEED? / WHAT DO YOU HAVE?` composition.
- [ ] **Step 3: Implement list/map shared selection** using real map infrastructure and reviewed coordinates only.
- [ ] **Step 4: Present eligibility, availability, location, trust/requirements, terms, price, action in canonical order.**
- [ ] **Step 5: Preserve transaction distinctions for match/offer/acceptance/reservation/payment/booking/fulfillment/obligation/settlement.**
- [ ] **Step 6: Verify privacy-reduced public location behavior, mobile Results/Map switching, keyboard alternative, and commit.**

### Task 11: EDU progression and Virtual Clinic Lab

**Files:**
- Modify: `src/app/edu/`
- Modify: `src/components/edu/`
- Consume: `src/lib/edu/` and current EDU APIs.
- Test: learner/instructor/institution journeys.

**Interfaces:**
- Produces learner, instructor, and institution experiences defined by the universal canon.

- [ ] **Step 1: Add failing progression tests** for learn → practice → demonstrate → human review → placement/eligibility handoff.
- [ ] **Step 2: Replace marketing/LMS table-first views** with learner progression and next-action surfaces.
- [ ] **Step 3: Make Virtual Clinic Lab feel like a synthetic clinic environment** while clearly remaining non-production training data.
- [ ] **Step 4: Build instructor exception/review flow and institution program/cohort/outcome flow.**
- [ ] **Step 5: Keep human competency decisions visually/semantically distinct from AI assistance; commit.**

### Task 12: Owner, enterprise, network, quality, and insights convergence

**Files:**
- Inspect/update: owner/admin/enterprise/quality/insights routes under `src/app/(platform)/`
- Inspect/update: relevant `src/components/clinic/`, `src/components/design/`, and analytics components.
- Test: role/resource authorization plus insight evidence tests.

**Interfaces:**
- Produces action-first organization and multi-site views.

- [ ] **Step 1: Add role-specific first-viewport tests** for clinic owner and enterprise admin.
- [ ] **Step 2: Recompose owner Home around attention, money, capacity, Grid, and team.**
- [ ] **Step 3: Recompose enterprise around cross-site exceptions, sites, performance, workforce/capacity, integrations, and governance.**
- [ ] **Step 4: Recompose Insights as conclusions first, evidence second, charts third.**
- [ ] **Step 5: Recompose Quality/Assurance around plain-language review needs before expert rule/evidence drilldown.**
- [ ] **Step 6: Verify no owner/admin clinical-authority widening and commit.**

### Task 13: Identity, verification, integration, and expert admin surfaces

**Files:**
- Inspect/update: identity/profile/access/admin routes under `src/app/`
- Inspect/update: integration/admin components and authorization services.
- Test: identity-claim vs verified-state, membership/authority, and connection-lifecycle tests.

**Interfaces:**
- Produces progressive trust UI and truthful connection state.

- [ ] **Step 1: Add tests distinguishing claim, verification, membership, credential, privilege, and eligibility.**
- [ ] **Step 2: Build progressive verification UI proportional to the next privilege.**
- [ ] **Step 3: Ensure connection UI distinguishes configured, provider-verified, authorized, sandbox/UAT, production-proven, degraded, and action-required states where the backend supports them.**
- [ ] **Step 4: Keep technical diagnostics behind deliberate expert/admin navigation; commit.**

### Task 14: Mobile, accessibility, truth-state and design-system hardening

**Files:**
- Modify: `src/app/accessibility.css`
- Modify: shared shell/design components.
- Add/update focused accessibility/responsive tests.
- Update: route census with final status.

**Interfaces:**
- Produces release-ready responsive/accessibility baseline for all migrated surfaces.

- [ ] **Step 1: Verify 320, 390, 768, 1440, and 1920 compositions** for each core journey.
- [ ] **Step 2: Verify keyboard-only navigation, focus order, focus visibility, reduced motion, 200% zoom, semantic landmarks, status announcements, and modal focus management.**
- [ ] **Step 3: Verify every major route has intentional empty/loading/error/permission/manual-fallback states.**
- [ ] **Step 4: Remove micro-text, overflow, clipped headings, desktop-sidebars-on-mobile, and color-only state.**
- [ ] **Step 5: Run `npm run type-check`, `npm run lint`, `npm run test`, `npm run test:mvp`, `npm run security:check`, `npm run db:validate`, and `npm run build`.**
- [ ] **Step 6: Fix every failure on the exact candidate head and commit.**

### Task 15: Figma parity and acceptance evidence

**Files:**
- Update: Figma master design/handoff references.
- Create/update: `docs/design/KLINIKOS_FIGMA_ACCEPTANCE_MATRIX_2026-08-30.md`
- Update: `docs/MVP_JOURNEYS.md` where journey evidence changes.

**Interfaces:**
- Produces: traceable design-to-code evidence for the universal frontend.

- [ ] **Step 1: Ensure Figma contains the required high-fidelity screens** enumerated in the universal frontend canon, including System X-Ray as a separate expert presentation.
- [ ] **Step 2: Map every Figma core screen to a real route/component or explicitly labeled target/synthetic state.**
- [ ] **Step 3: Capture desktop/mobile visual comparison for each core journey.**
- [ ] **Step 4: Record intentional differences and eliminate unexplained drift.**
- [ ] **Step 5: Confirm five-second/thirty-second comprehension for representative user types.**
- [ ] **Step 6: Update acceptance matrix and commit.**

### Task 16: Merge-ready verification

**Files:**
- Update: PR description, `FEATURE_STATUS.md` only for capabilities whose implementation truth actually changed, and relevant journey evidence.

**Interfaces:**
- Produces: one merge-ready candidate, not a collection of unverified screenshots.

- [ ] **Step 1: Fetch current `main` and reconcile drift without reviving stale design branches.**
- [ ] **Step 2: Run fresh database migration validation as required by repository law.**
- [ ] **Step 3: Run exact-head type, lint, unit/integration tests, MVP journeys, security gates, production build/startup checks, and browser/mobile acceptance.**
- [ ] **Step 4: Review browser payloads and client/server DTOs for unnecessary PHI/PII/proprietary disclosure.**
- [ ] **Step 5: Resolve actionable review blockers.**
- [ ] **Step 6: Leave a green merge-ready PR unless explicit merge authorization is current for the exact candidate head.**

## Self-review

- Spec coverage: all major user families, Clinic OS, Current Visit, Grid, EDU, Money, enterprise, identity, integrations, mobile/accessibility, truth states, and Figma parity are mapped to implementation tasks.
- No task authorizes a parallel identity, Grid, EHR, financial ledger, Zumi, credential, document, or audit store.
- No task moves authority into the client.
- No task treats dark cinematic styling as the clinical default.
- No task permits fake external/product truth.
- Commercial/upgrade work remains subordinate to real entitlement/payment evidence and existing pricing canon.
