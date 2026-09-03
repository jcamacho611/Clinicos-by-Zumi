# Klinikos Spatial Living Universe S1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing person-level Living Universe feel spatial and material-aware using semantic DOM/CSS depth while preserving routes, five-plane behavior, authority boundaries, accessibility, mobile behavior, and current production truth.

**Architecture:** Keep the existing `UniverseShell → ObjectStage / PlaneLens / Inspector / ActionDock` composition and `MemberHomeProjection` contract. Add shared semantic spatial tokens to the current Marble/Obsidian token authority, then use one CSS-module depth layer around the existing semantic React components. S1 introduces no WebGL/canvas runtime and no new business logic; the browser receives the same minimum-necessary projection and all consequential actions continue through existing server routes.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.9, Tailwind CSS 4, CSS Modules, existing Klinikos design tokens, Framer Motion already installed but not required for S1, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-03-klinikos-spatial-living-universe-design.md`

## Global Constraints

- Exactly five ecosystem planes remain authoritative; spatial depth levels are presentation only and are not a sixth plane.
- No `three`, `@react-three/fiber`, Babylon.js, custom shader runtime, mandatory canvas, continuous `requestAnimationFrame`, or scroll-jacking camera in S1.
- No second theme provider. Continue System/Auto + Marble/light + Obsidian/dark through `src/app/design-tokens.css`.
- No new hardcoded color palette in touched Living Universe components; resolve touched surface color/line/shadow/attention through semantic tokens.
- Preserve `MemberHomeProjection` as the server-owned presentation contract unless a new field is strictly presentation-safe and independently justified.
- Preserve `isAllowedMemberActionHref()` filtering and destination-side authorization.
- Preserve the current mobile Inspector content and keyboard access.
- DOM order remains focus/screen-reader order; transforms may not create a different logical order.
- `prefers-reduced-motion: reduce` removes spatial movement while preserving content and hierarchy.
- Frontend secrecy boundary remains: browser intent/input → authenticated server capability → proprietary/policy engine → minimum-necessary presentation DTO → browser.
- No fake data, fake network activity, fake authority, fake integration status, or fake processing state.
- Before execution, start from the then-current `main`, not this plan branch. Inspect open PR #505 (`shell-material-convergence`) because it also touches `design-tokens.css`; reuse any merged semantic token work and do not duplicate its `--k-shell-*` vocabulary. Do not merge intentionally RED commercial PRs merely to clear the queue.

---

### Task 1: Lock the RED spatial-experience contract

**Files:**
- Create: `tests/living-universe-spatial-experience.test.ts`
- Read: `tests/living-universe-member-home.test.ts`
- Read: `src/components/living-universe/universe-shell.tsx`
- Read: `src/components/living-universe/object-stage.tsx`
- Read: `src/components/living-universe/plane-lens.tsx`
- Read: `src/components/living-universe/inspector.tsx`
- Read: `src/components/living-universe/action-dock.tsx`
- Read: `src/app/design-tokens.css`
- Read: `package.json`

**Interfaces:**
- Consumes: current `UniverseShell({ projection }: { projection: MemberHomeProjection })` and current `MemberHomeProjection`.
- Produces: an executable source contract for S1; later tasks must make these assertions green without weakening them.

- [ ] **Step 1: Write the failing structural tests**

Create `tests/living-universe-spatial-experience.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UniverseShell, type MemberHomeProjection } from "@/components/living-universe/universe-shell";
import { canonicalEcosystemGraph } from "@/lib/ecosystem/canonical-ecosystem-graph";

const read = (path: string) => readFileSync(path, "utf8");

const projection: MemberHomeProjection = {
  person: { displayName: "Jordan Lee" },
  activeLens: "lifecycle",
  lenses: canonicalEcosystemGraph.planes.map((plane, index) => ({
    id: plane.id,
    number: String(index + 1).padStart(2, "0"),
    title: plane.label,
    description: `${plane.label} explains the same object.`,
    status: plane.id === "lifecycle" ? "active" : "available",
  })),
  object: {
    id: "person-profile",
    title: "Your Klinikos identity",
    kind: "Person profile",
    state: "Account active",
    summary: "One Person object remains authoritative while the presentation changes depth.",
    claimStatus: "unverified",
  },
  timeline: {
    before: "Account established.",
    now: "Context is active.",
    next: "Take a governed next action.",
  },
  inspector: {
    eyebrow: "Evidence and authority",
    title: "What Klinikos knows",
    body: "Presentation depth does not create authority.",
    evidence: ["Person projection"],
    authority: ["Destination revalidates authority"],
  },
  actions: [
    { id: "grid", label: "Explore Grid", href: "/grid" },
    { id: "edu", label: "Continue learning", href: "/edu" },
  ],
};

describe("Spatial Living Universe S1", () => {
  it("keeps true 3D out of the first production tranche", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies?: Record<string, string> };
    const dependencies = pkg.dependencies ?? {};
    expect(dependencies).not.toHaveProperty("three");
    expect(dependencies).not.toHaveProperty("@react-three/fiber");
    expect(dependencies).not.toHaveProperty("@babylonjs/core");

    const spatial = read("src/components/living-universe/living-universe-spatial.module.css");
    expect(spatial).not.toContain("canvas");
    expect(spatial).not.toContain("requestAnimationFrame");
    expect(spatial).toContain("perspective: var(--k-spatial-perspective)");
  });

  it("renders the approved spatial depth contract without creating another plane", () => {
    const html = renderToStaticMarkup(createElement(UniverseShell, { projection }));
    for (const depth of ["environment", "workspace", "object-stage", "inspector", "critical-decision"]) {
      expect(html).toContain(`data-spatial-depth=\"${depth}\"`);
    }
    expect(projection.lenses).toHaveLength(5);
    expect(html).not.toContain("sixth plane");
  });

  it("keeps reduced-motion and responsive flattening in the spatial layer", () => {
    const spatial = read("src/components/living-universe/living-universe-spatial.module.css");
    expect(spatial).toContain("@media (prefers-reduced-motion: reduce)");
    expect(spatial).toContain("@media (max-width: 1279px)");
    expect(spatial).toContain("transform: none");
  });

  it("uses semantic material tokens instead of a new Living Universe literal palette", () => {
    const files = [
      "src/components/living-universe/universe-shell.tsx",
      "src/components/living-universe/object-stage.tsx",
      "src/components/living-universe/plane-lens.tsx",
      "src/components/living-universe/inspector.tsx",
      "src/components/living-universe/action-dock.tsx",
    ];
    for (const path of files) {
      const source = read(path);
      expect(source, path).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(source, path).not.toMatch(/(?:bg|text|border|ring)-white(?:\/|\b)/);
      expect(source, path).not.toMatch(/(?:bg|text|border|ring)-black(?:\/|\b)/);
    }

    const tokens = read("src/app/design-tokens.css");
    for (const token of [
      "--k-spatial-perspective",
      "--k-spatial-stage-z",
      "--k-spatial-inspector-z",
      "--k-spatial-shadow-stage",
      "--k-living-edge",
    ]) {
      expect(tokens).toContain(token);
    }
  });

  it("preserves existing member action filtering and mobile Inspector behavior", () => {
    const html = renderToStaticMarkup(createElement(UniverseShell, { projection }));
    expect(html).toContain('href="/grid"');
    expect(html).toContain('href="/edu"');
    expect(html).toContain('data-mobile-inspector="true"');
    expect(html).toContain("Open Inspector");
  });
});
```

- [ ] **Step 2: Run the new test and prove RED**

```bash
npx vitest run tests/living-universe-spatial-experience.test.ts
```

Expected: FAIL because `living-universe-spatial.module.css`, `data-spatial-depth`, new spatial tokens, and literal-palette convergence do not yet exist.

- [ ] **Step 3: Re-run the pre-existing member-home test as a baseline**

```bash
npx vitest run tests/living-universe-member-home.test.ts
```

Expected: PASS on the clean current-main base. If it does not, stop and classify the unrelated baseline failure before changing production code.

- [ ] **Step 4: Commit the RED contract**

```bash
git add tests/living-universe-spatial-experience.test.ts
git commit -m "test(living-universe): lock spatial S1 contract"
```

---

### Task 2: Add shared spatial semantic tokens and the depth stylesheet

**Files:**
- Modify: `src/app/design-tokens.css`
- Create: `src/components/living-universe/living-universe-spatial.module.css`
- Test: `tests/living-universe-spatial-experience.test.ts`

**Interfaces:**
- Consumes: existing Marble/Obsidian semantic token authority.
- Produces: CSS variables `--k-spatial-perspective`, `--k-spatial-stage-z`, `--k-spatial-inspector-z`, `--k-spatial-shadow-stage`, `--k-spatial-shadow-inspector`, `--k-spatial-context-opacity`, `--k-living-edge`, plus module classes `environment`, `workspace`, `stagePlane`, `inspectorPlane`, `decisionPlane`.

- [ ] **Step 1: Add non-color spatial geometry tokens to the existing shared design-token scope**

Add these declarations to the existing `[data-klinikos-ds]` shared-token block rather than creating a new theme root:

```css
  --k-spatial-perspective: 1400px;
  --k-spatial-stage-z: 22px;
  --k-spatial-inspector-z: 10px;
  --k-spatial-context-opacity: .82;
  --k-spatial-focus-scale: 1.006;
  --k-spatial-duration: var(--duration-base);
  --k-spatial-ease: var(--ease-out-expo);
```

- [ ] **Step 2: Add material-specific spatial attention/elevation tokens to Obsidian**

Inside the existing Obsidian `html:root` / `data-klinikos-atmosphere="night"` block, add:

```css
  --k-living-edge: color-mix(in srgb, var(--k-accent) 46%, transparent);
  --k-spatial-shadow-stage: 0 34px 110px rgba(0, 0, 0, .42);
  --k-spatial-shadow-inspector: 0 22px 70px rgba(0, 0, 0, .30);
  --k-spatial-context-wash: color-mix(in srgb, var(--k-public-surface) 86%, transparent);
```

- [ ] **Step 3: Add Marble equivalents**

Inside the existing Marble `dawn/day/golden` block, add:

```css
  --k-living-edge: color-mix(in srgb, var(--k-accent) 34%, transparent);
  --k-spatial-shadow-stage: 0 28px 80px rgba(63, 32, 36, .14);
  --k-spatial-shadow-inspector: 0 18px 56px rgba(63, 32, 36, .11);
  --k-spatial-context-wash: color-mix(in srgb, var(--k-public-surface) 92%, transparent);
```

These literal values live only inside the centralized token authority. Touched component source must not carry its own palette.

- [ ] **Step 4: Create the CSS-module depth layer**

Create `src/components/living-universe/living-universe-spatial.module.css`:

```css
.environment {
  perspective: var(--k-spatial-perspective);
  perspective-origin: 50% 30%;
}

.workspace {
  position: relative;
  transform-style: preserve-3d;
}

.stagePlane,
.inspectorPlane {
  backface-visibility: hidden;
  transition:
    transform var(--k-spatial-duration) var(--k-spatial-ease),
    opacity var(--k-spatial-duration) var(--k-spatial-ease),
    box-shadow var(--k-spatial-duration) var(--k-spatial-ease);
}

.stagePlane {
  transform: translate3d(0, 0, var(--k-spatial-stage-z));
}

.inspectorPlane {
  transform: translate3d(0, 0, var(--k-spatial-inspector-z));
}

.decisionPlane {
  position: relative;
  z-index: 20;
}

@media (max-width: 1279px) {
  .workspace {
    transform-style: flat;
  }

  .stagePlane,
  .inspectorPlane {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stagePlane,
  .inspectorPlane {
    transform: none;
    transition: none;
  }
}
```

Do not add continuous keyframes.

- [ ] **Step 5: Run the token/spatial-file subset**

```bash
npx vitest run tests/living-universe-spatial-experience.test.ts -t "keeps true 3D|keeps reduced-motion"
```

Expected: the CSS-file/dependency/reduced-motion assertions pass; render/material assertions remain RED until later tasks.

- [ ] **Step 6: Run theme-system regression tests**

```bash
npx vitest run tests/klinikos-theme-system.test.ts tests/black-label-design-contract.test.ts tests/design-system-adherence.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/design-tokens.css src/components/living-universe/living-universe-spatial.module.css
git commit -m "feat(design): add shared spatial experience tokens"
```

---

### Task 3: Wire Environment → Workspace → Object Stage → Inspector → Critical Decision

**Files:**
- Modify: `src/components/living-universe/universe-shell.tsx`
- Modify: `src/components/living-universe/object-stage.tsx`
- Test: `tests/living-universe-spatial-experience.test.ts`
- Test: `tests/living-universe-member-home.test.ts`

**Interfaces:**
- Consumes: CSS module classes from Task 2 and the unchanged `MemberHomeProjection`.
- Produces: rendered `data-spatial-depth` contract for `environment`, `workspace`, `object-stage`, `inspector`, `critical-decision`.

- [ ] **Step 1: Import the spatial module into `UniverseShell`**

```ts
import spatial from "@/components/living-universe/living-universe-spatial.module.css";
```

- [ ] **Step 2: Mark and style the hierarchy in `UniverseShell`**

Change the outer `<main>` so it includes `spatial.environment`, preserves `data-member-living-universe`, and adds:

```tsx
data-spatial-depth="environment"
```

Use:

```tsx
className={`${spatial.environment} min-h-screen overflow-x-hidden bg-[var(--k-public-bg)] text-[var(--k-text)]`}
```

On the main three-column grid, add `spatial.workspace` and:

```tsx
data-spatial-depth="workspace"
```

Wrap `ObjectStage` in:

```tsx
<div className={spatial.stagePlane} data-spatial-depth="object-stage">
  <ObjectStage
    activeLens={activeLens}
    lens={lens}
    object={projection.object}
    timeline={projection.timeline}
  />
</div>
```

Wrap `ActionDock` separately so its sticky positioning is not transformed:

```tsx
<div className={spatial.decisionPlane} data-spatial-depth="critical-decision">
  <ActionDock actions={projection.actions} />
</div>
```

Wrap Inspector in:

```tsx
<div className={`${spatial.inspectorPlane} min-w-0`} data-spatial-depth="inspector">
  <Inspector activeLens={activeLens} inspector={projection.inspector} lens={lens} />
</div>
```

Do not move `ActionDock` into a transformed ancestor beyond the existing Stage column.

- [ ] **Step 3: Convert all touched `UniverseShell` color/line/surface classes to semantic tokens**

Use these mappings throughout the file:

```text
page/background → var(--k-public-bg) / var(--k-ambient)
primary text → var(--k-text)
secondary text → var(--k-muted)
lines → var(--k-line)
accent/focus → var(--k-accent)
raised/panel surfaces → var(--k-public-surface) / var(--k-public-raised)
shell/work depth → var(--k-shell) / var(--k-work-bg)
```

Valid class examples:

```tsx
bg-[var(--k-public-bg)]
text-[var(--k-text)]
text-[var(--k-muted)]
border-[var(--k-line)]
ring-[var(--k-accent)]
bg-[var(--k-public-surface)]
```

The file must contain no hex literals and no direct Tailwind white/black palette classes when complete.

- [ ] **Step 4: Convert `ObjectStage` to semantic material and Living Edge tokens**

Keep current markup and `data-living-object-id`. The outer section becomes:

```tsx
className="relative min-w-0 overflow-hidden rounded-[30px] border border-[var(--k-line)] bg-[var(--k-public-raised)] px-5 py-6 shadow-[var(--k-spatial-shadow-stage)] sm:px-8 sm:py-8"
```

Use `var(--k-accent)`, `var(--k-muted)`, `var(--k-text)`, `var(--k-line)`, `var(--k-living-edge)`, `var(--status-resolved)`, and the shared surfaces for all other touched states. Do not change `claimStatus`, `authorityNotice`, timeline ordering, or `Before / Now / Next` semantics.

- [ ] **Step 5: Run the spatial render test**

```bash
npx vitest run tests/living-universe-spatial-experience.test.ts -t "renders the approved spatial depth contract"
```

Expected: PASS.

- [ ] **Step 6: Run member-home regression**

```bash
npx vitest run tests/living-universe-member-home.test.ts
```

Expected: PASS, including exactly five lenses, one Person object, allowed-action filtering, and route wiring.

- [ ] **Step 7: Commit**

```bash
git add src/components/living-universe/universe-shell.tsx src/components/living-universe/object-stage.tsx tests/living-universe-spatial-experience.test.ts
git commit -m "feat(living-universe): establish spatial object-stage hierarchy"
```

---

### Task 4: Converge Plane Lens, Inspector, and Action Dock onto the same material/depth language

**Files:**
- Modify: `src/components/living-universe/plane-lens.tsx`
- Modify: `src/components/living-universe/inspector.tsx`
- Modify: `src/components/living-universe/action-dock.tsx`
- Test: `tests/living-universe-spatial-experience.test.ts`
- Test: `tests/living-universe-member-home.test.ts`

**Interfaces:**
- Consumes: current component APIs unchanged.
- Produces: zero-literal-palette touched Living Universe component set; Inspector/Action Dock remain behaviorally identical while inheriting Marble/Obsidian.

- [ ] **Step 1: Convert `PlaneLens` to semantic tokens**

Preserve `aria-pressed`, button behavior, horizontal mobile scrolling, and five-plane labels. Use:

```text
border → var(--k-line)
focus ring → var(--k-accent)
active background → var(--k-public-raised)
resting background → var(--k-public-surface)
primary text → var(--k-text)
secondary text → var(--k-muted)
active marker → var(--k-accent)
attention shadow → color-mix(in srgb, var(--k-living-edge) 70%, transparent)
```

- [ ] **Step 2: Convert `Inspector` to semantic tokens**

Preserve desktop `<aside>` and mobile `<details data-mobile-inspector="true">`. Use:

```text
surface → var(--k-public-surface)
line → var(--k-line)
primary text → var(--k-text)
secondary text → var(--k-muted)
accent → var(--k-accent)
verified/evidence marker → var(--status-resolved)
shadow → var(--k-spatial-shadow-inspector)
```

Do not remove evidence or authority content on mobile.

- [ ] **Step 3: Convert `ActionDock` to semantic tokens**

Preserve `isAllowedMemberActionHref()`, sticky behavior, link destinations, and 44px minimum height. First action may use `var(--k-accent)` as primary treatment; remaining actions use shared surfaces/lines/text. Focus uses `var(--k-accent)`.

- [ ] **Step 4: Run material contract**

```bash
npx vitest run tests/living-universe-spatial-experience.test.ts -t "uses semantic material tokens"
```

Expected: PASS for all five touched components and required spatial tokens.

- [ ] **Step 5: Run member-home and theme regressions**

```bash
npx vitest run \
  tests/living-universe-member-home.test.ts \
  tests/living-universe-spatial-experience.test.ts \
  tests/klinikos-theme-system.test.ts \
  tests/black-label-design-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add \
  src/components/living-universe/plane-lens.tsx \
  src/components/living-universe/inspector.tsx \
  src/components/living-universe/action-dock.tsx \
  tests/living-universe-spatial-experience.test.ts
git commit -m "feat(living-universe): converge spatial context and actions"
```

---

### Task 5: Prove accessibility, confidentiality, performance shape, and no authority regression

**Files:**
- Modify: `tests/living-universe-spatial-experience.test.ts`
- Read/verify: `scripts/security/browser-confidentiality-gate.mjs`
- Read/verify: `scripts/security/server-env-taint-gate.mjs`
- Read/verify: `scripts/security/api-disclosure-gate.mjs`

**Interfaces:**
- Consumes: completed S1 implementation.
- Produces: regression protection for no camera authority, no canvas/WebGL dependency, semantic focus order, and browser-safe presentation boundaries.

- [ ] **Step 1: Add source assertions against camera/canvas authority**

```ts
it("keeps spatial composition as presentation rather than navigation authority", () => {
  const shell = read("src/components/living-universe/universe-shell.tsx");
  const spatial = read("src/components/living-universe/living-universe-spatial.module.css");

  expect(shell).not.toContain("pushState(");
  expect(shell).not.toContain("replaceState(");
  expect(shell).not.toContain("requestAnimationFrame(");
  expect(shell).not.toContain("<canvas");
  expect(spatial).not.toContain("scroll-snap-type");
  expect(spatial).not.toContain("position: fixed");
});
```

This does not forbid legitimate Next.js links; it forbids S1 from inventing a client camera/router authority.

- [ ] **Step 2: Add authority-boundary assertions**

```ts
it("does not widen the existing presentation contract into authority", () => {
  const shell = read("src/components/living-universe/universe-shell.tsx");
  const dock = read("src/components/living-universe/action-dock.tsx");

  expect(shell).toContain("MemberHomeProjection");
  expect(dock).toContain("isAllowedMemberActionHref");
  expect(shell).not.toContain("eligibilityScore");
  expect(shell).not.toContain("rankingWeight");
  expect(shell).not.toContain("permissionGrant");
  expect(shell).not.toContain("paymentVerified");
});
```

- [ ] **Step 3: Run targeted tests**

```bash
npx vitest run tests/living-universe-spatial-experience.test.ts tests/living-universe-member-home.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run confidentiality gates**

```bash
npm run security:check
```

Expected: all three gates PASS.

- [ ] **Step 5: Run type and lint gates**

```bash
npm run type-check
npm run lint
```

Expected: PASS with no new warning attributable to S1.

- [ ] **Step 6: Commit**

```bash
git add tests/living-universe-spatial-experience.test.ts
git commit -m "test(living-universe): guard spatial authority and disclosure"
```

---

### Task 6: Run the full release gate and capture customer-visible evidence

**Files:**
- Verify: `.github/workflows/quality.yml`
- Verify: `scripts/verify-release.mjs`
- Verify: `scripts/verify-frontend-browser-interactions.mjs`
- Modify only if existing release-evidence tooling intentionally writes tracked evidence files.

**Interfaces:**
- Consumes: exact S1 implementation head.
- Produces: exact-head evidence that S1 works in the same migration/build/start/browser path as production Klinikos.

- [ ] **Step 1: Run the repository's full local release verifier**

```bash
npm run verify:release
```

Expected: the established local gate completes successfully, including its own disposable-database migration/test/journey/build/start/health path. Do not replace it with an ad-hoc long-running `npm start` session.

- [ ] **Step 2: Run the targeted browser verifier against an exact-head production build when local Chrome is available**

Use the same server-start pattern as `.github/workflows/quality.yml`, not a new command:

```bash
set -euo pipefail
PORT=3000 npm start > /tmp/spatial-s1-browser.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
  if curl --fail --silent --show-error http://127.0.0.1:3000/api/health > /dev/null; then
    break
  fi
  if [ "$attempt" -eq 30 ]; then
    cat /tmp/spatial-s1-browser.log
    exit 1
  fi
  sleep 1
done
CHROME=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROME="$(command -v "$candidate")"
    break
  fi
done
if [ -z "$CHROME" ]; then
  echo "No supported Chrome/Chromium available locally; exact-head CI remains mandatory."
  exit 2
fi
CHROME_BIN="$CHROME" FRONTEND_BASE_URL=http://localhost:3000 node scripts/verify-frontend-browser-interactions.mjs
```

Expected when Chrome is available: PASS. If local Chrome is unavailable, record that limitation; do not weaken the CI browser gate.

- [ ] **Step 3: Push and require exact-head GitHub Quality**

The exact S1 head must pass the existing Quality sequence:

```text
source confidentiality
→ install
→ Prisma generate/validate
→ fresh PostgreSQL migrations
→ typecheck
→ lint
→ tests
→ PostgreSQL MVP journeys
→ production build
→ post-build confidentiality
→ production startup smoke
→ frontend browser interactions
→ frontend release evidence
→ production-host deploy contract
```

Do not merge if the exact head is RED, cancelled, or stale relative to the reviewed diff.

- [ ] **Step 4: Review the uploaded frontend evidence artifact**

Use the `living-universe-release-evidence` artifact from the exact-head Quality run. Inspect at minimum the existing captures:

```text
canonical 1402×1122
desktop 1440×1000
wide 1920×1080
tablet transition 1024×900
tablet 768×1024
mobile 390×844
reduced motion 1402×1122
verified browser zoom 200%
```

For the member Living Universe surface, additionally verify through the browser interaction test or an authenticated test fixture that:

```text
Object Stage is readable
Inspector is available
Action Dock remains reachable
five lenses remain usable
no horizontal body overflow appears
focus targets are not hidden by transform
no required information is hover-only
```

- [ ] **Step 5: Verify both Marble and Obsidian before merge**

Use the existing theme control/fixture rather than adding a second theme mechanism. Confirm no touched Living Universe component paints an Obsidian-only literal surface over Marble and that text/line contrast remains legible in both modes.

- [ ] **Step 6: Verify reduced motion before merge**

Use `prefers-reduced-motion: reduce` and confirm `stagePlane` and `inspectorPlane` transforms are removed while all information and actions remain present.

- [ ] **Step 7: Commit generated tracked evidence only if existing repository tooling intentionally requires it**

```bash
git status --short
```

If the existing verifier created tracked evidence files, add only those exact files and use the repo's established evidence commit convention. If evidence exists only as the GitHub artifact, make no evidence-only repository commit.

---

## Self-review

### Spec coverage

- DOM-first spatial architecture: Tasks 1–4.
- No WebGL/canvas first wave: Tasks 1, 2, 5.
- Five depth levels as presentation rather than planes: Tasks 1, 3.
- Existing routes/history/authority preserved: Tasks 3, 5.
- Marble/Obsidian single material authority: Tasks 2–4, 6.
- Reduced motion and mobile flattening: Tasks 2, 6.
- Zumi/server secrecy boundary: Task 5; no Zumi backend change is included in S1 by design.
- Performance/no continuous render loop: Tasks 1, 5, 6.
- Accessibility/focus/mobile Inspector: Tasks 1, 4, 6.
- Exact-head release evidence: Task 6.
- Selective future WebGL remains outside S1, as required by the spec.

### Placeholder scan

No `TBD`, `TODO`, “implement later”, generic “add error handling”, or undefined code interfaces remain in this plan.

### Type/interface consistency

The plan preserves the existing `UniverseShell`, `MemberHomeProjection`, `ObjectStage`, `PlaneLens`, `Inspector`, and `ActionDock` APIs. New module class names are consistently `environment`, `workspace`, `stagePlane`, `inspectorPlane`, `decisionPlane`. New token names are consistently `--k-spatial-perspective`, `--k-spatial-stage-z`, `--k-spatial-inspector-z`, `--k-spatial-context-opacity`, `--k-spatial-focus-scale`, `--k-spatial-duration`, `--k-spatial-ease`, `--k-living-edge`, `--k-spatial-shadow-stage`, `--k-spatial-shadow-inspector`, `--k-spatial-context-wash`.
