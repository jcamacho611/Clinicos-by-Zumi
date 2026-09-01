# Klinikos Action-First Living Universe Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the public Klinikos root into the first production Action-First Living Universe gateway using everyday intent language while preserving the current public Zumi server boundary, privacy protections, and existing domain/auth authorities.

**Architecture:** Reuse the existing `PublicLivingGateway`, `/api/zumi/public`, `sendPrompt`, deterministic fallback routing, and public continuation helpers. Change only the public projection: everyday-intent quick actions, minimal navigation, warm-light composition, and removal of stacked brochure sections from `/`. No new backend or client-side authority is introduced.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, existing Klinikos design/brand components and public Zumi orchestration.

**Spec:** `docs/superpowers/specs/2026-09-01-klinikos-action-first-living-universe-wave1-design.md`

## Global Constraints

- Exactly five Klinikos planes; Wave 1 creates no new plane or module authority.
- Everyday language first: the visitor starts from `What do you need today?`.
- Quick actions are prompts into the existing `sendPrompt` → `/api/zumi/public` path, never new client-side eligibility/routing truth.
- Keep `PublicLivingGateway` as the dominant root experience.
- Keep public PHI/private-data disclosure and server-side routing unchanged.
- `Join free` may use the existing `/grid/join` entry in Wave 1; do not invent another signup system.
- Do not create a Supabase/Lovable/Replit production fork or parallel database/backend.
- Existing brand artwork is not replaced in this tranche.
- No production code before a witnessed failing test.

---

### Task 1: RED — define the Action-First public contract

**Files:**
- Modify: `tests/public-living-home.test.ts`

**Interfaces:**
- Consumes: current source strings from `src/components/marketing/public-living-gateway.tsx` and `src/app/page.tsx`
- Produces: failing assertions that precisely define the required Wave 1 frontend projection

- [ ] **Step 1: Add a failing Action-First gateway test**

Add this test inside `describe("public Living Home conversation and accessibility contract", ...)`:

```ts
it("projects the public root as an action-first Living Universe instead of a module catalog", () => {
  expect(source).toContain("What do you need today?");
  expect(source).toContain("Tell Klinikos what you need");
  expect(source).toContain("I need care");
  expect(source).toContain("I need work");
  expect(source).toContain("I need someone");
  expect(source).toContain("I have my own client");
  expect(source).toContain("I need a room");
  expect(source).toContain("I have space available");
  expect(source).toContain("I want to learn");
  expect(source).toContain("I need a placement");
  expect(source).toContain("Help me run my practice");
  expect(source).toContain("I need to get paid");
  expect(source).toContain("I want to grow my healthcare business");
  expect(source).toContain("void sendPrompt(action.prompt)");
  expect(source).toContain('href="/grid/join"');

  expect(source).not.toContain('{ label: "Clinics", href: "/founding-clinic" }');
  expect(source).not.toContain('{ label: "Grid", href: "/grid" }');
  expect(source).not.toContain('{ label: "EDU", href: "/edu" }');
  expect(source).not.toContain('{ label: "Pricing", href: "/pricing" }');
  expect(source).not.toContain('{ label: "Trust", href: "/trust" }');

  expect(page).not.toContain("ProductEvidenceSection");
  expect(page).not.toContain("EcosystemHierarchy");
  expect(page).toContain("PublicLivingGateway");
  expect(page).toContain("PublicTrustFooter");
});
```

- [ ] **Step 2: Verify RED on the exact branch head**

Run:

```bash
npm test -- tests/public-living-home.test.ts
```

Expected: FAIL because the current gateway still leads with canonical product/clinic copy, module navigation, no action-first quick intents, and the root still imports/renders `ProductEvidenceSection` and `EcosystemHierarchy`.

- [ ] **Step 3: Commit the witnessed RED**

```bash
git add tests/public-living-home.test.ts
git commit -m "test: require action-first public Living Universe"
```

---

### Task 2: GREEN — add everyday intent actions without new routing authority

**Files:**
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Test: `tests/public-living-home.test.ts`

**Interfaces:**
- Consumes: existing `sendPrompt(rawPrompt: string): Promise<void>` and `/api/zumi/public`
- Produces: `quickIntentActions: readonly { label: string; prompt: string }[]` rendered as accessible buttons

- [ ] **Step 1: Add the quick-intent data next to the public navigation constants**

```ts
const quickIntentActions = [
  { label: "I need care", prompt: "I need care" },
  { label: "I need work", prompt: "I need work" },
  { label: "I need someone", prompt: "I need someone for my healthcare organization" },
  { label: "I have work available", prompt: "I have healthcare work available" },
  { label: "I have my own client", prompt: "I have my own client and need help putting the right healthcare pieces together" },
  { label: "I need a room", prompt: "I need a healthcare room or space" },
  { label: "I have space available", prompt: "I have healthcare space available" },
  { label: "I want to learn", prompt: "I want to learn or train for my next healthcare step" },
  { label: "I need a placement", prompt: "I need a clinical placement or clinical hours" },
  { label: "Help me run my practice", prompt: "Help me run my healthcare practice today" },
  { label: "I need to get paid", prompt: "I need help getting paid or fixing a billing problem" },
  { label: "I want to grow my healthcare business", prompt: "I want to start or grow my healthcare business" },
] as const;
```

- [ ] **Step 2: Replace module-first public nav with minimal public actions**

Use:

```ts
const navItems = [
  { label: "How Klinikos helps", href: "/how-it-works" },
] as const;
```

Desktop and mobile should separately expose:

```tsx
<Link href="/grid/join">Join free</Link>
<Link href="/login">Sign in</Link>
```

Do not add `Grid`, `EDU`, `Pricing`, or `Trust` as primary root navigation.

- [ ] **Step 3: Replace the initial hero hierarchy**

The dominant initial text must be:

```tsx
<p>Klinikos</p>
<h1 id="public-living-title">What do you need today?</h1>
<p>Tell Klinikos what you need. Zumi will help you find the next useful step.</p>
```

Keep the canonical company explanation as secondary proof/context below the interaction rather than the primary task.

- [ ] **Step 4: Add quick-intent buttons that reuse `sendPrompt`**

Render:

```tsx
<div aria-label="Common things to do in Klinikos">
  {quickIntentActions.map((action) => (
    <button
      className="... min-h-11 ..."
      key={action.label}
      onClick={() => void sendPrompt(action.prompt)}
      type="button"
    >
      {action.label}
    </button>
  ))}
</div>
```

The buttons must not directly navigate or infer eligibility.

- [ ] **Step 5: Rewrite composer-facing copy in ordinary language**

Use:

```tsx
placeholder="Tell Klinikos what you need..."
```

Keep an explicit disclosure containing both:

```text
cannot open private clinic records or make changes
```

and:

```text
Do not enter patient information here.
```

- [ ] **Step 6: Convert the initial root surface to the approved warm-light direction**

The root section should use a warm light base such as:

```tsx
className="min-h-screen overflow-hidden bg-[#fbf8f6] text-[#201718]"
```

Use restrained dark/rose surfaces only for the composer, selected accents, and conversation objects. Do not replace brand artwork files.

- [ ] **Step 7: Run the focused test**

Run:

```bash
npm test -- tests/public-living-home.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/marketing/public-living-gateway.tsx tests/public-living-home.test.ts
git commit -m "feat: make public gateway action-first"
```

---

### Task 3: GREEN — remove stacked brochure sections from the root

**Files:**
- Modify: `src/app/page.tsx`
- Test: `tests/public-living-home.test.ts`

**Interfaces:**
- Consumes: `PublicLivingGateway`, `PublicTrustFooter`
- Produces: root page containing only structured data + dominant gateway + minimal trust/legal footer

- [ ] **Step 1: Remove unused root imports**

Delete:

```ts
import { EcosystemHierarchy } from "@/components/marketing/ecosystem-hierarchy";
import { ProductEvidenceSection } from "@/components/marketing/product-evidence-section";
```

- [ ] **Step 2: Remove stacked brochure rendering**

Root body becomes:

```tsx
<>
  <script ... />
  <PublicLivingGateway />
  <PublicTrustFooter />
</>
```

Do not delete the underlying components/routes.

- [ ] **Step 3: Run the focused test**

```bash
npm test -- tests/public-living-home.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx tests/public-living-home.test.ts
git commit -m "feat: keep root focused on Living Universe entry"
```

---

### Task 4: Refactor — preserve accessibility and current public authority

**Files:**
- Modify only if needed: `src/components/marketing/public-living-gateway.tsx`
- Test: `tests/public-living-home.test.ts`

**Interfaces:**
- Consumes: current public Zumi conversation behavior
- Produces: no authority change; all prior safety/accessibility assertions remain green

- [ ] **Step 1: Run the complete public Living Home test**

```bash
npm test -- tests/public-living-home.test.ts
```

Expected: PASS all existing and new assertions.

- [ ] **Step 2: Run type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: PASS with no new warnings/errors attributable to this change.

- [ ] **Step 4: Run confidentiality/security gates**

```bash
npm run security:check
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Run production code verification**

```bash
npm run verify:code
```

Expected: PASS.

- [ ] **Step 7: Commit any refactor-only corrections if required**

```bash
git add src/components/marketing/public-living-gateway.tsx tests/public-living-home.test.ts
git commit -m "refactor: preserve public gateway authority boundaries"
```

Skip this commit if no refactor is needed.

---

### Task 5: Browser/review gate and PR handoff

**Files:**
- No production file required unless review finds a defect

**Interfaces:**
- Consumes: exact feature-branch head
- Produces: review-ready PR with explicit scope and no false deployment claim

- [ ] **Step 1: Review the root at desktop and mobile widths**

Verify:

- hero says `What do you need today?`;
- quick intent buttons are visible without knowing module names;
- composer remains the dominant interaction;
- warm-light composition is readable;
- `Join free`, `How Klinikos helps`, and `Sign in` are accessible;
- public disclosure is visible;
- conversation mode still works;
- keyboard submit and focus remain usable;
- no required hover-only behavior;
- no stacked brochure sections appear below the gateway.

- [ ] **Step 2: Open a PR against current `main`**

PR title:

```text
feat: make Klinikos public entry action-first
```

PR body must explicitly say:

- this is frontend projection only;
- current server-side Zumi routing is preserved;
- no new authority/eligibility/payment/PHI path is introduced;
- root brochure sections are removed but not deleted;
- Wave 2 will converge free entry onto the merged Person Account/session substrate;
- merged != deployed; production remains unclaimed until deployment/runtime verification.
