# Klinikos Unicorn Living Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the authenticated Klinikos dashboard visibly feel like the approved outcome-first Marble/Obsidian operating ecosystem while preserving all existing backend and domain authority.

**Architecture:** Keep the existing `DashboardPage` data loading and `LivingHome` behavior authoritative. Add one server-rendered operating-context band, one scoped presentation wrapper, and a CSS-only experience layer. No schema, API, routing, Zumi authority, Grid authority, clinical authority, billing authority or EDU authority changes.

**Tech Stack:** Next.js App Router, React Server Components, existing React client Living Home, Tailwind utility classes, global CSS, Vitest source-contract tests.

**Spec:** `docs/superpowers/specs/2026-08-24-unicorn-living-home-design.md`

## Global Constraints

- Preserve `requireClinicSession()` as identity and tenant authority.
- Preserve `LivingHome` behavior and its current APIs.
- Preserve existing System / Light / Dark atmosphere authority.
- Do not modify public `/` in this tranche.
- Do not modify Prisma, migrations, API routes, clinical stores, Grid state, EDU completion or payment state.
- Never add fake counts, revenue, urgency, verification, eligibility, completion or provider state.
- Use only values already loaded by `DashboardPage`.
- Maintain keyboard, screen-reader and reduced-motion behavior.

---

### Task 1: Lock the experience source contract

**Files:**
- Create: `tests/unicorn-living-home-experience.test.ts`

**Interfaces:**
- Consumes: source files `src/app/(platform)/dashboard/page.tsx`, `src/app/layout.tsx`, `src/app/unicorn-experience.css`
- Produces: a static contract proving scoped wiring, truth-derived context, dual material modes and responsive/reduced-motion requirements

- [ ] **Step 1: Write the failing test**

Create a Vitest source-contract test that asserts:

```ts
expect(dashboard).toContain('className="unicorn-dashboard"');
expect(dashboard).toContain('className="unicorn-living-shell"');
expect(dashboard).toContain("activePaths.length");
expect(dashboard).toContain("livingAppointments.length");
expect(dashboard).toContain("gridSignals.length");
expect(dashboard).toContain("gatewayStatus.available");
expect(layout).toContain('import "./unicorn-experience.css"');
expect(css).toContain('html:root[data-klinikos-atmosphere="night"] .unicorn-living-shell');
expect(css).toContain('html:root[data-klinikos-atmosphere="day"] .unicorn-living-shell');
expect(css).toContain("@media (max-width: 767px)");
expect(css).toContain("@media (prefers-reduced-motion: reduce)");
```

Also assert the dashboard source does not contain hard-coded fake metric labels such as `Revenue recovered`, `Verified matches`, or `AI completed`.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/unicorn-living-home-experience.test.ts
```

Expected: FAIL because `unicorn-dashboard`, `unicorn-living-shell`, the stylesheet import and stylesheet do not yet exist.

- [ ] **Step 3: Commit the RED contract**

```bash
git add tests/unicorn-living-home-experience.test.ts
git commit -m "test(experience): lock unicorn Living Home contract"
```

---

### Task 2: Add truthful operating context to DashboardPage

**Files:**
- Modify: `src/app/(platform)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `session`, `livingAppointments`, `activePaths`, `gridSignals`, `gatewayStatus`
- Produces: server-rendered `.unicorn-operating-context`, `.unicorn-dashboard`, `.unicorn-living-shell`, and `data-klinikos-role`

- [ ] **Step 1: Add a pure role display helper**

Use a local function returning human-readable labels for existing roles without changing authority.

- [ ] **Step 2: Derive context strings from already-loaded truth**

Create strings from:

```ts
activePaths.length
livingAppointments.length
gridSignals.length
gatewayStatus.available
```

Use singular/plural wording. Do not add a Grid signal chip when the count is zero. Use `Zumi connected` only when `gatewayStatus.available` is true; otherwise show `Deterministic command mode`.

- [ ] **Step 3: Wrap the current content**

Use:

```tsx
<div className="unicorn-dashboard" data-klinikos-role={session.role}>
  <div className="unicorn-operating-context" aria-label="Current operating context">...</div>
  {existing launch block}
  <section className="unicorn-living-shell" aria-label="Klinikos Living Home">
    <LivingHome ... />
  </section>
</div>
```

Do not alter the `LivingHome` props or data-loading logic.

- [ ] **Step 4: Run the focused test**

Run:

```bash
npx vitest run tests/unicorn-living-home-experience.test.ts
```

Expected: still FAIL because the stylesheet/import are not complete.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(platform)/dashboard/page.tsx'
git commit -m "feat(home): add truthful operating context shell"
```

---

### Task 3: Add the Marble/Obsidian experience layer

**Files:**
- Create: `src/app/unicorn-experience.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: existing semantic variables from `design-tokens.css`, existing `data-klinikos-atmosphere` values and dashboard wrapper classes
- Produces: scoped visual treatment for authenticated Living Home only

- [ ] **Step 1: Create the stylesheet**

The stylesheet must:

- scope all dashboard changes under `.unicorn-dashboard` / `.unicorn-living-shell`;
- make Obsidian a layered command environment with restrained rose atmosphere;
- make Marble a warm editorial operating surface with minimal glow;
- strengthen hero scale and spatial hierarchy;
- refine phase rail and destination rail geometry;
- elevate composer and Zumi overlap without changing DOM semantics;
- create a premium operating-context band;
- give the materialized workspace a clear staged-object feel;
- avoid hiding any existing content;
- include tablet/mobile recomposition at 1119px, 767px and 430px;
- include reduced-motion treatment;
- keep minimum readable sizes and 44px targets already present in the DOM.

- [ ] **Step 2: Import after existing convergence styles**

Add:

```ts
import "./unicorn-experience.css";
```

in `src/app/layout.tsx` after `experience-convergence.css` and before `accessibility.css` so accessibility remains the final override.

- [ ] **Step 3: Run the focused contract**

Run:

```bash
npx vitest run tests/unicorn-living-home-experience.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run theme regression**

Run:

```bash
npx vitest run tests/klinikos-theme-system.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/unicorn-experience.css src/app/layout.tsx
git commit -m "feat(design): ship unicorn Marble Obsidian Living Home"
```

---

### Task 4: Verify, review, merge

**Files:**
- No intended production-file changes unless verification exposes a defect.

**Interfaces:**
- Consumes: exact branch head
- Produces: verified PR and merged `main`

- [ ] **Step 1: Run focused and release checks**

```bash
npx vitest run tests/unicorn-living-home-experience.test.ts tests/klinikos-theme-system.test.ts
npm run type-check
npm run lint
npm test -- --run
npm run build
```

If hosted CI cannot allocate a runner, report that as infrastructure-unavailable rather than green or red code evidence.

- [ ] **Step 2: Re-read current `main` and open PR collisions**

Confirm no concurrent branch changed `src/app/(platform)/dashboard/page.tsx`, `src/app/layout.tsx`, or `src/app/unicorn-experience.css`. Reconcile by taking current-main authority first if overlap appears.

- [ ] **Step 3: Open a PR against current `main`**

PR body must state this is presentation-only, no authority/schema changes, and list exact verification evidence.

- [ ] **Step 4: Self-review the exact PR diff**

Reject any fake status, hidden content, authority widening, public-home regression, theme inconsistency or mobile overflow risk found in review.

- [ ] **Step 5: Merge with expected head SHA**

Use a protected expected-head merge so a concurrent mutation cannot be silently merged.

- [ ] **Step 6: Verify the new main SHA**

Read `main` after merge and confirm the merge commit is present before calling the tranche complete.
