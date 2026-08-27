# Klinikos Public Platform Experience Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the brochure-style public entry, Grid, Clinics, and EDU surfaces with one terms-first, Zumi-led, interactive Klinikos product journey while preserving the real authorization, marketplace, education, legal-evidence, and security systems already implemented.

**Architecture:** Preserve the existing domain and security layers, then recompute only the public composition layer. Public entry becomes `ACCESS TERMS → ZUMI → INTENT → VALUE → AUTH/CLAIM WHEN CONSEQUENTIAL → ROLE-SPECIFIC PRODUCT`; Grid becomes one map-ledger marketplace rather than a card wall; Clinics and EDU become interactive gateways into existing product workflows rather than long marketing documents. The public legal gate records assent but is never treated as a substitute for authenticated role-specific agreements or as a security boundary for secrets.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Prisma/PostgreSQL, existing public Zumi API, existing MapLibre/OpenFreeMap Grid map, existing Grid repositories, existing legal access acceptance APIs, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-klinikos-final-form-universal-experience-design.md`, `docs/superpowers/specs/2026-08-26-klinikos-final-form-path-execution-map.md`, `docs/superpowers/specs/2026-08-27-klinikos-legal-defense-stack-design.md`, `docs/MARKETPLACE_DESIGN_RESEARCH.md`, `docs/design/KLINIKOS_JOURNEY_STAGE_DESIGN_ACCEPTANCE_CANON.md`

## Global Constraints

- There is one Klinikos, public routes are entry points into one operating ecosystem, not separate brochure products.
- First human interaction is the Klinikos Access, Confidentiality & Intellectual Property terms gate. No interactive Zumi, Grid, Clinics, or EDU surface is usable until assent is recorded for the current public-access version.
- The public access gate is legal/evidence UX, not a security boundary. Proprietary prompts, ranking logic, security logic, PHI, credentials, secrets, unreleased strategy, and privileged data remain server-side and must never be shipped to the browser.
- After the gate, Zumi is the universal front door and preserves bounded, non-PHI intent into the next product surface.
- Grid opens as a spatial marketplace, not a lane-card wall. Wide screens show coordinated map + result ledger above the fold. Mobile offers explicit map/results modes.
- Grid uses real published inventory only. No fake pins, fabricated availability, invented verification, or placeholder listings.
- Identity is not authority. Claim is not verification. Verification is not entitlement. Entitlement is not tenant/session authority.
- Clinics entry asks only the minimum questions required to route the person into existing clinic analysis, sign-in, claim, or activation workflows.
- EDU entry routes Learner, Instructor, and Institution intent into the existing EDU product and synthetic lab. Long role/curriculum tables are secondary reference content, not the first experience.
- Obsidian dark and Marble light are one design system. Every interactive control keeps a minimum 44px target and visible keyboard focus.
- Public Zumi must reject PHI/patient-record use and cannot make regulated clinical decisions.
- Preserve the existing `Klinikos Black Label` design language, rose visual system, and current theme tokens, but visuals may never overlap or obscure readable content while scrolling.
- Do not merge directly to `main`. This plan executes on `fix/public-platform-experience-20260827`, based on PR #361, and returns through reviewed PRs.

---

## File Structure

- `src/components/public/public-access-gate.tsx` - first-entry modal and public acceptance state, backed by `/api/access/accept`.
- `src/components/public/public-platform-shell.tsx` - shared client shell that blocks interactive children until the access gate is satisfied.
- `src/app/page.tsx` - minimal Zumi-led living home only, no stacked marketing sections.
- `src/components/marketing/public-living-gateway.tsx` - one-viewport Zumi-first home composition and corrected rose stacking.
- `src/app/grid/page.tsx` - canonical Grid marketplace route.
- `src/app/grid/browse/page.tsx` - compatibility redirect to canonical `/grid` preserving safe query/intent.
- `src/components/grid/grid-live-map.tsx` - app-like map/result workspace, no marketing-section wrapper.
- `src/app/founding-clinic/page.tsx` - interactive clinic entry and routing surface.
- `src/app/edu/page.tsx` - interactive academy gateway into existing EDU product.
- `tests/public-first-entry-contract.test.ts` - terms-first and homepage minimality contract.
- `tests/grid-marketplace-entry-contract.test.ts` - map-first Grid composition contract.
- `tests/public-clinic-entry-contract.test.ts` - clinic route is interactive routing, not pricing brochure.
- `tests/public-edu-entry-contract.test.ts` - EDU route is interactive academy entry, not reference tables.
- `docs/KLINIKOS_MASTER_CANON.md` - one current merged product authority, including first-entry order and app-not-brochure law.
- `docs/SOURCE_OF_TRUTH.md`, `AGENTS.md` - route agents to the master canon first and classify older canon/spec files as subordinate evidence or implementation detail.

---

### Task 1: Lock the first-entry contract with failing tests

**Files:**
- Create: `tests/public-first-entry-contract.test.ts`
- Test: `tests/public-first-entry-contract.test.ts`

**Interfaces:**
- Consumes: current `src/app/page.tsx`, `src/components/marketing/public-living-gateway.tsx`, `/api/access/accept`.
- Produces: a regression contract requiring `PublicPlatformShell`, terms-first blocking, a minimal living home, and the absence of stacked homepage marketing sections.

- [ ] **Step 1: Write the failing contract test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("public first-entry experience", () => {
  it("gates interactive Klinikos with the access agreement before Zumi", () => {
    const page = read("src/app/page.tsx");
    expect(page).toContain("PublicPlatformShell");
    expect(page).toContain("PublicLivingGateway");
  });

  it("does not stack marketing-document sections beneath the living home", () => {
    const page = read("src/app/page.tsx");
    expect(page).not.toContain("ProductEvidenceSection");
    expect(page).not.toContain("EcosystemHierarchy");
  });

  it("records public assent through the existing server access API", () => {
    const gate = read("src/components/public/public-access-gate.tsx");
    expect(gate).toContain('/api/access/accept');
    expect(gate).toContain("Access, Confidentiality");
    expect(gate).toContain("accepted: true");
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npx vitest run tests/public-first-entry-contract.test.ts`

Expected: FAIL because `PublicPlatformShell` and `public-access-gate.tsx` do not yet exist and the homepage still includes `ProductEvidenceSection` and `EcosystemHierarchy`.

- [ ] **Step 3: Commit the RED contract**

```bash
git add tests/public-first-entry-contract.test.ts
git commit -m "test: define terms-first public entry contract"
```

---

### Task 2: Implement the terms-first public platform shell and one-viewport Living Home

**Files:**
- Create: `src/components/public/public-access-gate.tsx`
- Create: `src/components/public/public-platform-shell.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Test: `tests/public-first-entry-contract.test.ts`
- Test: `tests/public-living-home.test.ts`
- Test: `tests/public-zumi-*.test.ts`

**Interfaces:**
- Produces: `PublicPlatformShell({ children }: { children: React.ReactNode })`.
- Produces: browser state key `klinikos-public-access-version` equal to the server-returned current document version.
- Consumes: `POST /api/access/accept` with `{ email, accepted: true }` and existing public Zumi behavior unchanged after access is granted.

- [ ] **Step 1: Implement minimal public gate**

```tsx
// src/components/public/public-access-gate.tsx
"use client";

export function PublicAccessGate({ onAccepted }: { onAccepted(version: string): void }) {
  // Obsidian full-screen modal. Collect email, require an unchecked confidentiality/IP
  // acknowledgment, POST to /api/access/accept, then persist only the returned version.
  // Do not claim this controls source-code secrecy or replaces authenticated agreements.
}
```

Required behavior:
1. first render is modal/focus-contained and visually dominant;
2. email + affirmative unchecked checkbox required;
3. submit to `/api/access/accept`;
4. save returned version in localStorage only after server success;
5. include links to complete Access Terms and Privacy Notice;
6. explicit copy that confidential/proprietary materials may not be copied, scraped, reverse engineered, competitively reproduced, or ingested into external AI systems without authorization;
7. no arbitrary penalty/liquidated-damage promise in UI copy;
8. 44px controls, keyboard operable, `role="dialog"`, `aria-modal="true"`.

- [ ] **Step 2: Implement shared shell**

```tsx
// src/components/public/public-platform-shell.tsx
"use client";

export function PublicPlatformShell({ children }: { children: React.ReactNode }) {
  // Compare locally recorded access version to the current public version returned by the gate.
  // Render children under an inert/aria-hidden wrapper until acceptance succeeds.
  // The legal gate is an interaction/evidence boundary only, never a confidentiality mechanism.
}
```

- [ ] **Step 3: Collapse homepage to the actual living home**

```tsx
// src/app/page.tsx
import { PublicLivingGateway } from "@/components/marketing/public-living-gateway";
import { PublicPlatformShell } from "@/components/public/public-platform-shell";

export default function HomePage() {
  return (
    <PublicPlatformShell>
      <PublicLivingGateway />
    </PublicPlatformShell>
  );
}
```

Remove `ProductEvidenceSection` and `EcosystemHierarchy` from the homepage. Keep evidence/trust pages discoverable through dedicated routes and compact navigation.

- [ ] **Step 4: Correct rose stacking and home density**

In `public-living-gateway.tsx`, make the rose visual owned by the home viewport rather than a fixed layer that can paint across later content. Use an absolute visual inside a relative `min-h-[100svh]` gateway container with clipped overflow, stable z-index layers, and text/composer above it. Remove any fixed visual that extends beyond the gateway.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npx vitest run tests/public-first-entry-contract.test.ts tests/public-living-home.test.ts tests/public-zumi-conversation.test.ts tests/public-zumi-access-routing.test.ts tests/public-zumi-intelligence-boundary.test.ts
npm run type-check
npm run lint
```

Expected: all PASS; no TypeScript or lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/public src/components/marketing/public-living-gateway.tsx tests/public-first-entry-contract.test.ts
git commit -m "feat: make Klinikos entry terms-first and Zumi-led"
```

---

### Task 3: Replace the Grid card wall with one map-ledger marketplace

**Files:**
- Create: `tests/grid-marketplace-entry-contract.test.ts`
- Modify: `src/app/grid/page.tsx`
- Modify: `src/app/grid/browse/page.tsx`
- Modify: `src/components/grid/grid-live-map.tsx`
- Reuse unchanged where possible: `src/components/grid/google-grid-map.tsx`, `src/components/grid/grid-exchange-field.tsx`, `src/lib/grid/intent-rules.ts`, Grid repositories.

**Interfaces:**
- Canonical public route: `/grid?intent=<allowlisted>&q=<safe query>`.
- Compatibility route: `/grid/browse` redirects to `/grid` preserving only `intent` and `q`.
- Grid map consumes real `locations`, `providers`, and `resources` from existing repositories and never manufactures markers.

- [ ] **Step 1: Write RED Grid contract**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Grid marketplace entry", () => {
  it("opens directly into the live spatial marketplace", () => {
    const page = read("src/app/grid/page.tsx");
    expect(page).toContain("GridLiveMap");
    expect(page).toContain("GridExchangeField");
    expect(page).not.toContain("buyLanes.map");
    expect(page).not.toContain("sellLanes.map");
  });

  it("does not place a marketing header between search and the map", () => {
    const map = read("src/components/grid/grid-live-map.tsx");
    expect(map).not.toContain("One geographic field for real published healthcare capacity");
    expect(map).toContain("data-grid-map-ledger");
  });
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/grid-marketplace-entry-contract.test.ts`

Expected: FAIL because `/grid` is still a card wall and `GridLiveMap` still carries a marketing-section heading.

- [ ] **Step 3: Build canonical `/grid` server page**

Move the real repository loading, intent interpretation, temporal filtering, and map props currently in `/grid/browse` into `/grid`. First viewport order:

```text
compact brand/navigation
I NEED / I HAVE + Zumi-compatible GridExchangeField
intent/filter chips
MAP | RESULT LEDGER split workspace
```

No lane cards before the map. No long explanatory manifesto. Trust/state explanations belong in selected-result detail, tooltips, or compact disclosure areas.

- [ ] **Step 4: Convert `/grid/browse` to compatibility redirect**

Use Next `redirect()` and `URLSearchParams` built only from allowlisted `intent` and bounded `q` values. Do not forward arbitrary query parameters.

- [ ] **Step 5: Convert `GridLiveMap` from page-section to workspace component**

Remove its external marketing heading/counters block and large vertical padding. Preserve map/list synchronization, geolocation, real-distance filtering, no-fake-pin rule, selected result behavior, and mobile map/list switch. Wide-screen workspace should consume the remaining viewport height rather than behave like a section in a long article.

- [ ] **Step 6: Verify GREEN and regression**

Run:

```bash
npx vitest run tests/grid-marketplace-entry-contract.test.ts tests/grid-black-label-spatial.test.ts tests/grid-map-provider.test.ts src/lib/grid/geo-rules.test.ts src/lib/grid/intent-rules.test.ts tests/public-grid-surfaces.test.ts tests/grid-auth-continuation.test.ts
npm run type-check
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/grid src/components/grid/grid-live-map.tsx tests/grid-marketplace-entry-contract.test.ts
git commit -m "feat: open Grid as a map-first healthcare marketplace"
```

---

### Task 4: Replace the founding-clinic brochure with an interactive Clinic gateway

**Files:**
- Create: `tests/public-clinic-entry-contract.test.ts`
- Modify: `src/app/founding-clinic/page.tsx`
- Reuse existing commercial/analysis routes and sign-in/claim flows.

**Interfaces:**
- Input choices: `run_clinic`, `fix_workflow`, `see_klinikos`, `claim_organization`.
- Consequential actions continue through existing authenticated/paid/claim routes; the gateway itself grants no authority.

- [ ] **Step 1: Write RED contract**

```ts
it("starts with an operating question instead of a pricing document", () => {
  const page = readFileSync("src/app/founding-clinic/page.tsx", "utf8");
  expect(page).toContain("What needs to happen in your clinic?");
  expect(page).not.toContain("Three reviewed stages before production");
  expect(page).not.toContain("$500 analysis has two truthful payment modes");
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/public-clinic-entry-contract.test.ts`

Expected: FAIL against the current commercial brochure.

- [ ] **Step 3: Implement the minimum-question Clinic gateway**

First viewport contains only brand, one operational question, four high-level intent choices, a compact Zumi affordance, and a clear sign-in/continue action. Progressive follow-up asks one question at a time and routes to existing analysis/activation/login/claim surfaces. Move pricing and long program explanation behind a secondary `How engagement works` link or dedicated commercial route.

- [ ] **Step 4: Verify**

Run:

```bash
npx vitest run tests/public-clinic-entry-contract.test.ts tests/commercial-qualification-experience.test.ts tests/commercial-activation-experience.test.ts tests/analysis-activation.test.ts
npm run type-check
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/founding-clinic/page.tsx tests/public-clinic-entry-contract.test.ts
git commit -m "feat: turn clinic entry into an operating gateway"
```

---

### Task 5: Replace EDU brochure tables with an interactive Academy gateway

**Files:**
- Create: `tests/public-edu-entry-contract.test.ts`
- Modify: `src/app/edu/page.tsx`
- Reuse existing `/edu/dashboard`, `/edu/lab`, institutional/program routes and synthetic-data rules.

**Interfaces:**
- Entry modes: `learner`, `instructor`, `institution`.
- Learner role choices map to the existing eight operational seats but do not imply licensure/credential authority.

- [ ] **Step 1: Write RED contract**

```ts
it("opens as an academy launcher rather than two reference tables", () => {
  const page = readFileSync("src/app/edu/page.tsx", "utf8");
  expect(page).toContain("How are you entering Klinikos EDU?");
  expect(page).not.toContain("Every student runs a real position.");
  expect(page).not.toContain("CURRICULUM-READY PACKAGES");
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/public-edu-entry-contract.test.ts`

Expected: FAIL against the current marketing/reference page.

- [ ] **Step 3: Implement Academy gateway**

First viewport contains brand, mode chooser, selected next action, compact synthetic-training disclosure, and an immediate path into the actual lab/dashboard or institutional inquiry. Role and curriculum catalogs move into secondary `Explore roles` and `Explore curriculum` views/links. Keep the non-licensure and synthetic-data boundary visible but concise.

- [ ] **Step 4: Verify**

Run:

```bash
npx vitest run tests/public-edu-entry-contract.test.ts tests/edu-black-label-academy.test.ts tests/edu-design-contract.test.ts tests/edu-foundation.test.ts tests/edu-demo-kit-access.test.ts
npm run type-check
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/edu/page.tsx tests/public-edu-entry-contract.test.ts
git commit -m "feat: make EDU an interactive academy entry"
```

---

### Task 6: Merge the experience order into the single current Klinikos Master Canon

**Files:**
- Create: `docs/KLINIKOS_MASTER_CANON.md` if absent.
- Modify: `docs/SOURCE_OF_TRUTH.md`
- Modify: `AGENTS.md`
- Test: `tests/canonical-truth-drift.test.ts`
- Create: `tests/master-canon-authority.test.ts`

**Interfaces:**
- Current product authority: `docs/KLINIKOS_MASTER_CANON.md`.
- Verified code/schema/migrations/tests/runtime remain implementation truth for what exists today.
- Existing design/domain/governance docs become subordinate elaboration or provenance and cannot redefine Klinikos independently.

- [ ] **Step 1: Write RED authority test**

```ts
it("declares exactly one current product canon", () => {
  const source = readFileSync("docs/SOURCE_OF_TRUTH.md", "utf8");
  const agents = readFileSync("AGENTS.md", "utf8");
  expect(source).toContain("docs/KLINIKOS_MASTER_CANON.md");
  expect(agents).toContain("docs/KLINIKOS_MASTER_CANON.md");
});
```

- [ ] **Step 2: Run RED**

Run: `npx vitest run tests/master-canon-authority.test.ts`

Expected: FAIL because the unified master canon does not yet exist in the current branch.

- [ ] **Step 3: Create the merged canon without duplicating specialist docs**

The master canon must contain, at minimum:

```text
ONE KLINIKOS authority rule
WHAT EXISTS TODAY vs WHAT KLINIKOS IS
ACCESS TERMS → ZUMI → INTENT → VALUE → AUTH/CLAIM WHEN CONSEQUENTIAL → PRODUCT
PATIENT lifecycle
PROFESSIONAL lifecycle
CLINIC lifecycle
REVENUE lifecycle
GRID map-first marketplace law
EDU → competency evidence → Grid → work → evidence → upskilling flywheel
CLAIM → EVIDENCE → VERIFICATION → ENTITLEMENT → AUTHORITY
Current Visit and clinical convergence
Financial OS / RCM ownership and external rails
Zumi/Memory truth boundaries
Black Label UX and Simple Above / Powerful Below
confidentiality/browser/server disclosure boundary
canonical target + current implementation status pattern
new discovery merge-forward rule
```

Do not paste old documents wholesale. Reconcile contradictions and point to subordinate documents for deep technical detail.

- [ ] **Step 4: Update agent bootstrap**

`SOURCE_OF_TRUTH.md` and `AGENTS.md` must say the master canon is the only current product-definition authority, while code/schema/tests/runtime prove implementation. Specialist docs elaborate but cannot override. History/evidence has no current-product authority.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npx vitest run tests/master-canon-authority.test.ts tests/canonical-truth-drift.test.ts tests/master-specification-register.test.ts
```

Expected: PASS.

Commit:

```bash
git add docs/KLINIKOS_MASTER_CANON.md docs/SOURCE_OF_TRUTH.md AGENTS.md tests/master-canon-authority.test.ts
git commit -m "docs: establish one merged Klinikos master canon"
```

---

### Task 7: Full exact-head verification and child PR back into #361

**Files:**
- Modify only if verification exposes a genuine regression.

**Interfaces:**
- Branch remains `fix/public-platform-experience-20260827`.
- Target base is `feat/supreme-canon-openai-partner-20260827-v2`, not `main`.

- [ ] **Step 1: Run source confidentiality gates**

Run: `npm run security:check`

Expected: PASS.

- [ ] **Step 2: Run complete quality suite**

Run:

```bash
npm run db:generate
npm run db:validate
npm run type-check
npm run lint
npm test
npm run build
```

Expected: PASS. Existing lint warnings must not increase.

- [ ] **Step 3: Verify route contracts and production release policy**

Run:

```bash
npx vitest run tests/public-first-entry-contract.test.ts tests/grid-marketplace-entry-contract.test.ts tests/public-clinic-entry-contract.test.ts tests/public-edu-entry-contract.test.ts tests/production-migration-policy.test.mjs tests/screen-experience-route-coverage.test.ts
```

Expected: PASS.

- [ ] **Step 4: Open a draft child PR**

Base: `feat/supreme-canon-openai-partner-20260827-v2`

Head: `fix/public-platform-experience-20260827`

Title: `fix: rebuild Klinikos public entry as interactive platform`

The PR body must list exact-head verification, screenshots/manual-browser work still required, confidentiality boundaries, and an explicit statement that it does not claim legal enforceability, HIPAA readiness, or external integrations beyond verified implementation.

- [ ] **Step 5: Keep both PRs draft until visual/browser acceptance**

Do not mark #361 ready or merge to main based on automated tests alone. The user-reported defects are visual and interactive, so final acceptance requires actual desktop/mobile browser review after deployment/preview is available.
