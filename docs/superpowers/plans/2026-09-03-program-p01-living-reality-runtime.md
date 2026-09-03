# P01 — Living Reality Runtime / Black Label / True 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a real GPU-backed Living Reality runtime using Three.js + React Three Fiber while preserving Klinikos's semantic web twin, five-plane authority, server-owned truth, accessibility, confidentiality, and exact-head release evidence.

**Architecture:** Extend the existing `UniverseShell / ObjectStage / PlaneLens / Inspector / ActionDock` kernel rather than replacing it. Add a presentation-only `RealityProjection` contract, a capability-aware runtime-mode resolver, and a lazy-loaded React Three Fiber scene synchronized to the same minimum-necessary projection. The canvas emits intent only; routes, authorization, clinical truth, payments, Grid eligibility, and consequential actions remain server-owned.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, TypeScript 5.9.2, React Three Fiber 9.x for React 19, Three.js 0.185.x, Tailwind 4, existing Marble/Obsidian design-token authority, Vitest, current Quality/deploy-contract workflow.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p01-living-reality-runtime-design.md`

## Global Constraints

- Exactly five canonical ecosystem planes remain authoritative; 3D depth is presentation, never a sixth plane.
- `3D projects truth. 3D never owns truth.`
- Preserve the existing router, browser history, deep links, semantic DOM order, keyboard access, forms, tables, dialogs, and precision workspaces.
- Preserve `UniverseShell / ObjectStage / PlaneLens / Inspector / ActionDock`; do not introduce `UniverseV2` or a parallel application shell.
- The browser receives only minimum-necessary presentation DTOs; hidden/private nodes are omitted server-side rather than sent and visually hidden.
- No proprietary ranking weights, eligibility rules, hidden prompts, anti-gaming logic, margins, raw ORM objects, unnecessary PHI, or private evidence enter scene payloads.
- One appearance authority only: System/Auto, Marble/light, Obsidian/dark.
- `FULL_REALITY`, `BALANCED_REALITY`, and `PRECISION_MODE` are performance/accessibility modes only; never pricing or authority modes.
- Dense clinical, financial, legal, and administrative work remains precision-first.
- P16 security/confidentiality gates are release blockers for P01.
- Prefer procedural geometry and open-source runtime libraries before paid assets or hosted 3D services.
- Every code task uses RED → GREEN TDD and ends in an independently reviewable commit.

---

### Task 1: Lock the RED P01 runtime contract

**Files:**
- Create: `tests/living-reality-runtime-contract.test.ts`
- Read: `tests/living-universe-member-home.test.ts`
- Read: `tests/public-living-universe-reference-parity.test.ts`
- Read: `src/components/living-universe/universe-shell.tsx`
- Read: `src/components/marketing/public-living-gateway.tsx`
- Read: `package.json`

**Interfaces:**
- Consumes: current `MemberHomeProjection`, existing public Living Gateway, current package manifest.
- Produces: executable RED contract for P01 package compatibility, projection boundary, three runtime modes, lazy canvas, and precision fallback.

- [ ] **Step 1: Add failing contract tests**

Create tests that assert these exact future artifacts exist and expose the stated API:

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("P01 Living Reality runtime contract", () => {
  it("defines one presentation-safe RealityProjection boundary", () => {
    expect(existsSync("src/lib/living-reality/reality-projection.ts")).toBe(true);
    const source = read("src/lib/living-reality/reality-projection.ts");
    expect(source).toContain("export type RealityProjection");
    expect(source).toContain("FULL_REALITY");
    expect(source).toContain("BALANCED_REALITY");
    expect(source).toContain("PRECISION_MODE");
  });

  it("keeps the GPU runtime lazy and the semantic twin present", () => {
    const shell = read("src/components/living-universe/universe-shell.tsx");
    expect(shell).toContain("LivingRealityRuntime");
    expect(shell).toContain("ObjectStage");
    expect(shell).toContain("Inspector");
    expect(shell).toContain("ActionDock");
  });

  it("adds the React-19-compatible R3F package family", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies["@react-three/fiber"]).toMatch(/^\^9\./);
    expect(pkg.dependencies.three).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx vitest run tests/living-reality-runtime-contract.test.ts
```

Expected: FAIL because the P01 projection/runtime files and R3F dependencies do not exist yet.

- [ ] **Step 3: Establish clean baseline**

Run:

```bash
npx vitest run tests/living-universe-member-home.test.ts tests/public-living-universe-reference-parity.test.ts tests/public-living-universe-persistent-stage.test.ts
```

Expected: PASS on the branch base. Stop if baseline fails for unrelated reasons.

- [ ] **Step 4: Commit RED contract**

```bash
git add tests/living-reality-runtime-contract.test.ts
git commit -m "test(living-reality): lock P01 runtime contract"
```

---

### Task 2: Add the approved renderer dependencies without widening the application shell

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/living-reality-runtime-contract.test.ts`

**Interfaces:**
- Consumes: React 19.1.1 / Next 15.5.22 application.
- Produces: `three`, `@react-three/fiber`, and matching TypeScript definitions only; no scene implementation yet.

- [ ] **Step 1: Install the stable React-19-compatible package family**

Run:

```bash
npm install three@^0.185.1 @react-three/fiber@^9.7.0
npm install -D @types/three@^0.185.4
```

`@react-three/fiber@9` is the major documented for React 19. Do not install the deprecated `react-three-fiber` package and do not add R3F 10 canary/alpha packages.

- [ ] **Step 2: Verify dependency tree**

```bash
npm ls three @react-three/fiber @types/three react react-dom
```

Expected: one React 19 tree and no invalid peer dependency.

- [ ] **Step 3: Run targeted security/package checks**

```bash
npm audit --omit=dev
npm run security:check
npx vitest run tests/living-reality-runtime-contract.test.ts -t "React-19-compatible"
```

Do not use `npm audit fix --force`. Record any new advisory in P16 evidence instead of hiding it.

- [ ] **Step 4: Commit dependency tranche**

```bash
git add package.json package-lock.json
git commit -m "build(living-reality): add React 19 3D runtime"
```

---

### Task 3: Define the minimum-necessary RealityProjection contract

**Files:**
- Create: `src/lib/living-reality/reality-projection.ts`
- Create: `src/lib/living-reality/member-reality-adapter.ts`
- Create: `tests/living-reality-projection.test.ts`
- Read: `src/components/living-universe/universe-shell.tsx`
- Read: `src/lib/member/member-home-repository.ts`

**Interfaces:**
- Produces:
  - `RealityMode = "FULL_REALITY" | "BALANCED_REALITY" | "PRECISION_MODE"`
  - `SpatialNodeProjection`
  - `SpatialEdgeProjection`
  - `AttentionProjection`
  - `CameraIntent`
  - `PrecisionActionProjection`
  - `RealityProjection`
  - `memberHomeToRealityProjection(projection: MemberHomeProjection): RealityProjection`

- [ ] **Step 1: Write projection minimization tests**

Use a representative `MemberHomeProjection` fixture and assert the resulting object contains only allowlisted display fields and same-origin action references. Add explicit negative assertions that serialized output does not contain keys such as `password`, `secret`, `prompt`, `rankingWeight`, `eligibilityScore`, `margin`, `rawOrm`, or hidden tenant metadata.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/living-reality-projection.test.ts
```

Expected: FAIL because the projection types/adapter do not exist.

- [ ] **Step 3: Implement focused projection types**

Use this stable shape:

```ts
export type RealityMode = "FULL_REALITY" | "BALANCED_REALITY" | "PRECISION_MODE";
export type CameraIntent = "ARRIVAL" | "FOCUS_OBJECT" | "SHOW_RELATIONSHIPS" | "INSPECT" | "MISSION" | "OUTCOME" | "NETWORK_OVERVIEW";

export type SpatialNodeProjection = {
  id: string;
  kind: string;
  label: string;
  state: string;
  emphasis: "normal" | "attention" | "selected" | "blocked" | "verified";
  route: `/${string}` | null;
};

export type SpatialEdgeProjection = {
  id: string;
  from: string;
  to: string;
  relationship: string;
  state: "visible" | "attention" | "blocked";
};

export type AttentionProjection = {
  objectId: string;
  level: "low" | "medium" | "high";
  safeReason: string;
};

export type PrecisionActionProjection = {
  id: string;
  label: string;
  href: `/${string}`;
};

export type RealityProjection = {
  realityId: string;
  contextId: string;
  title: string;
  modeHint: RealityMode;
  activeObject: SpatialNodeProjection | null;
  nodes: SpatialNodeProjection[];
  edges: SpatialEdgeProjection[];
  attention: AttentionProjection[];
  cameraIntent: CameraIntent | null;
  precisionActions: PrecisionActionProjection[];
};
```

The member adapter may project the current Person object plus safe five-plane context; it must not invent relationships that are not present in the current projection.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/living-reality-projection.test.ts tests/living-universe-member-home.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/living-reality tests/living-reality-projection.test.ts
git commit -m "feat(living-reality): add safe reality projection"
```

---

### Task 4: Build deterministic runtime-mode selection and downgrade policy

**Files:**
- Create: `src/lib/living-reality/runtime-mode.ts`
- Create: `tests/living-reality-runtime-mode.test.ts`

**Interfaces:**
- Produces:
  - `RuntimeCapabilities`
  - `resolveRealityMode(capabilities, preference): RealityMode`
  - `shouldDowngradeRealityMode(sample): RealityMode | null`

- [ ] **Step 1: Write RED tests for capability and preference combinations**

Cover:
- WebGL unavailable → `PRECISION_MODE`
- reduced motion + capable GPU → default `BALANCED_REALITY`
- explicit Precision preference → `PRECISION_MODE`
- healthy desktop capability → `FULL_REALITY`
- sustained poor frame sample from FULL → `BALANCED_REALITY`
- sustained poor frame sample from BALANCED → `PRECISION_MODE`
- mode selection never inspects pricing, role, tenant, or entitlement.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/living-reality-runtime-mode.test.ts
```

- [ ] **Step 3: Implement a pure resolver**

Keep this module DOM-free and renderer-free so it can be mutation-tested without browser mocks. Use explicit numeric thresholds for the first tranche: cap full-mode device pixel ratio at `1.75`, balanced at `1.25`, and downgrade after a 5-second representative sample below 30 FPS rather than reacting to a single frame.

- [ ] **Step 4: Run GREEN and mutation cases**

```bash
npx vitest run tests/living-reality-runtime-mode.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/living-reality/runtime-mode.ts tests/living-reality-runtime-mode.test.ts
git commit -m "feat(living-reality): govern runtime performance modes"
```

---

### Task 5: Create the semantic material bridge for WebGL

**Files:**
- Modify: `src/app/design-tokens.css`
- Create: `src/lib/living-reality/material-tokens.ts`
- Create: `tests/living-reality-materials.test.ts`

**Interfaces:**
- Produces `readLivingRealityMaterialTokens(element?: Element): LivingRealityMaterialTokens`.

- [ ] **Step 1: Write RED tests**

Assert that the token bridge reads semantic CSS custom properties and contains no independent hardcoded Obsidian/Marble palette in the scene source.

- [ ] **Step 2: Extend the one existing token authority**

Add semantic variables for environment, fog, object surface, relationship line, attention, selected, blocked, verified, and Living Edge in both Marble and Obsidian scopes. Do not create a new theme provider.

- [ ] **Step 3: Implement the bridge**

Convert CSS color values to renderer-consumable strings/numbers at runtime. Keep the source of visual truth in CSS tokens so switching atmosphere updates both DOM and canvas.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/living-reality-materials.test.ts tests/klinikos-theme-system.test.ts tests/design-system-adherence.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/design-tokens.css src/lib/living-reality/material-tokens.ts tests/living-reality-materials.test.ts
git commit -m "feat(living-reality): bridge semantic materials into 3D"
```

---

### Task 6: Build the lazy LivingRealityRuntime and scene root

**Files:**
- Create: `src/components/living-reality/living-reality-runtime.tsx`
- Create: `src/components/living-reality/living-reality-canvas.tsx`
- Create: `src/components/living-reality/scene/reality-scene.tsx`
- Create: `src/components/living-reality/scene/reality-node.tsx`
- Create: `src/components/living-reality/scene/reality-edge.tsx`
- Create: `tests/living-reality-renderer-structure.test.ts`

**Interfaces:**
- `LivingRealityRuntime({ projection, onIntent }: { projection: RealityProjection; onIntent: (intent: RealityClientIntent) => void })`
- `LivingRealityCanvas` is dynamically imported with SSR disabled.
- `RealityClientIntent` may contain only presentation intent: focus, inspect, open-route, change-lens, request-action-panel.

- [ ] **Step 1: Write RED structural and disclosure tests**

Assert:
- the R3F `<Canvas>` exists only in `living-reality-canvas.tsx`;
- `living-reality-runtime.tsx` lazy-loads the canvas;
- no `fetch`, database import, payment import, authorization import, or Zumi prompt import exists in scene files;
- scene nodes are created only from `RealityProjection.nodes`.

- [ ] **Step 2: Implement semantic-first boot**

The wrapper renders a non-blocking `aria-hidden` visual layer and leaves the semantic twin outside the canvas. Dynamic import happens after client hydration/capability resolution.

- [ ] **Step 3: Implement a procedural first scene**

Use simple geometry/materials only: selected active-object core, bounded surrounding nodes, relationship lines, subtle environment particles in FULL mode, simplified field in BALANCED mode. Do not add external textures or asset downloads.

- [ ] **Step 4: Control render-loop cost**

Use `frameloop="demand"` where compatible with the choreography and explicitly invalidate only when projection, camera transition, hover/focus, or bounded ambient movement requires it. FULL mode may use limited ambient motion; BALANCED should avoid continuous expensive updates.

- [ ] **Step 5: Run GREEN**

```bash
npx vitest run tests/living-reality-renderer-structure.test.ts tests/living-reality-runtime-contract.test.ts
npm run type-check
```

- [ ] **Step 6: Commit**

```bash
git add src/components/living-reality tests/living-reality-renderer-structure.test.ts
git commit -m "feat(living-reality): add lazy true 3D renderer"
```

---

### Task 7: Add camera choreography, context-loss recovery, and safe intent emission

**Files:**
- Create: `src/components/living-reality/scene/camera-director.tsx`
- Create: `src/components/living-reality/use-reality-runtime.ts`
- Create: `tests/living-reality-failure-modes.test.ts`

**Interfaces:**
- `CameraDirector({ intent, mode })`
- `useRealityRuntime()` returns current mode, user override setter, initialization state, and context-loss recovery state.

- [ ] **Step 1: Write RED failure-mode tests**

Cover WebGL initialization failure, context lost, user Precision override, visibility-hidden throttling, reduced-motion camera suppression, FULL→BALANCED→PRECISION downgrade, and recovery without losing the semantic task.

- [ ] **Step 2: Implement bounded camera intents**

Map only the approved `CameraIntent` enum to camera positions/transitions. Camera state must never call server actions directly.

- [ ] **Step 3: Implement context-loss and visibility handlers**

On loss, mark the visual runtime unavailable and surface Precision mode immediately. Do not reload the page or clear user work. On tab backgrounding, suspend or minimize rendering work.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/living-reality-failure-modes.test.ts tests/living-reality-runtime-mode.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/living-reality tests/living-reality-failure-modes.test.ts
git commit -m "feat(living-reality): add governed camera and recovery"
```

---

### Task 8: Integrate authenticated Member Living Home without replacing its semantic twin

**Files:**
- Modify: `src/components/living-universe/universe-shell.tsx`
- Modify: `src/lib/member/member-home-repository.ts` only if a presentation-safe field is demonstrably required
- Modify: `tests/living-universe-member-home.test.ts`
- Create: `tests/living-reality-member-equivalence.test.ts`

**Interfaces:**
- Consumes: `memberHomeToRealityProjection()`.
- Produces: same member semantic UI plus synchronized optional true-3D projection.

- [ ] **Step 1: Write RED equivalence tests**

Assert that every consequential action in the scene has the same or stricter semantic action in the DOM, the five lenses remain five, Person object ID remains stable, and switching the visual mode does not change authorized actions.

- [ ] **Step 2: Integrate runtime as a presentation layer**

Render `LivingRealityRuntime` behind/adjacent to the current grid while retaining `ObjectStage`, `PlaneLens`, `Inspector`, and `ActionDock`. Add a visible `Precision mode` control that does not require the canvas to function.

- [ ] **Step 3: Replace touched literal colors with semantic tokens**

Converge only the touched Living Universe areas while preserving behavior. Do not launch a repo-wide theme refactor in P01.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/living-universe-member-home.test.ts tests/living-reality-member-equivalence.test.ts tests/living-reality-materials.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/living-universe src/lib/member tests/living-universe-member-home.test.ts tests/living-reality-member-equivalence.test.ts
git commit -m "feat(member): project Living Home into true 3D"
```

---

### Task 9: Integrate the public Living Gateway with public-safe cinematic reality

**Files:**
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Create: `src/lib/living-reality/public-reality-projection.ts`
- Modify: `tests/public-living-universe-reference-parity.test.ts`
- Modify: `tests/public-living-universe-persistent-stage.test.ts`
- Create: `tests/public-living-reality-safety.test.ts`

**Interfaces:**
- `buildPublicRealityProjection(publicState): RealityProjection`
- Only real public-safe, aggregate, or explicitly synthetic/demo objects may enter the scene.

- [ ] **Step 1: Write RED safety tests**

Require explicit `truthKind: "REAL_PUBLIC" | "SYNTHETIC_DEMO" | "EMPTY"` in the public projection input and assert no fabricated live availability/network density is rendered from demo objects.

- [ ] **Step 2: Add the public projection adapter**

Reuse existing public action/path truth. Do not create new backend availability claims in P01.

- [ ] **Step 3: Add cinematic wrapper while preserving public controls**

The existing intent input, drawers, bottom navigation, signup links, error/no-result state, and Precision path stay semantic and first-interactive.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/public-living-universe-reference-parity.test.ts tests/public-living-universe-persistent-stage.test.ts tests/public-living-reality-safety.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/public-living-gateway.tsx src/lib/living-reality/public-reality-projection.ts tests/public-living-*.test.ts
git commit -m "feat(marketing): add public Living Reality projection"
```

---

### Task 10: Prove accessibility, mobile completion, confidentiality, and performance budgets

**Files:**
- Create: `tests/living-reality-accessibility-contract.test.ts`
- Create: `scripts/living-reality/check-bundle-budget.mjs`
- Modify: `.github/workflows/quality.yml` only if a deterministic budget check can run in CI without duplicating existing evidence jobs
- Modify: existing browser verification fixtures/scripts where necessary

**Interfaces:**
- Produces an enforceable P01 bundle/performance budget and browser evidence contract.

- [ ] **Step 1: Add source/accessibility RED tests**

Assert:
- canvas is `aria-hidden` and non-authoritative;
- every scene action has semantic equivalent;
- no hover-only required action;
- reduced motion avoids camera travel;
- 390px mode exposes a complete primary task;
- no raw sensitive strings are persisted to browser storage by P01.

- [ ] **Step 2: Add a bundle budget script**

Read Next build output and fail if the critical route eagerly absorbs the 3D chunk. The GPU chunk must remain dynamically split; document measured gzip/brotli size in release evidence rather than guessing an unmeasured target.

- [ ] **Step 3: Extend browser QA**

Exercise Marble/Obsidian, FULL/BALANCED/PRECISION, reduced motion, canvas initialization failure, keyboard navigation, 200% zoom, and 390px viewport. Capture screenshots only after confirming they contain no unauthorized real PHI.

- [ ] **Step 4: Run all P01/P16 gates**

```bash
npm run security:check
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add tests/living-reality-accessibility-contract.test.ts scripts/living-reality .github/workflows/quality.yml
git commit -m "test(living-reality): enforce accessibility and performance proof"
```

---

### Task 11: Reconcile P01 traceability and produce exact-head release evidence

**Files:**
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`
- Modify: P01 evidence/release docs already used by the repository rather than creating a second evidence authority

**Interfaces:**
- Consumes: exact candidate SHA and Quality evidence.
- Produces: truthful P01 implementation state and evidence refs.

- [ ] **Step 1: Update P01 records only after code is green**

Record exact requirement IDs, reuse targets, tests, security gates, measured bundle/performance evidence, and implementation state. Do not mark production deployed merely because PR CI is green.

- [ ] **Step 2: Run canonical validator**

```bash
npm run governance:traceability
```

Expected: PASS.

- [ ] **Step 3: Push and wait for exact-head GitHub Quality**

Both `Quality / verify` and `Quality / deploy-contract` must succeed on the final candidate head.

- [ ] **Step 4: Review final diff for authority leakage**

Confirm no scene/client file imports server secrets, private policy, raw ORM records, clinical authority logic, Grid ranking weights, or payment settlement logic.

- [ ] **Step 5: Commit final evidence update**

```bash
git add docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json
git commit -m "docs(governance): record P01 release evidence"
```

## P01 Definition of Done

P01 is complete only when:

1. the true-3D runtime is materially present on public/member Living Reality surfaces on capable devices;
2. every essential outcome remains complete in Precision Mode;
3. five canonical planes and one Person identity remain intact;
4. scene payloads are minimum-necessary and P16 disclosure gates pass;
5. no client state grants authority;
6. FULL/BALANCED/PRECISION downgrade paths are tested;
7. reduced-motion, keyboard, screen reader semantics, 200% zoom, and 390px completion are verified;
8. public demo state never masquerades as real network activity;
9. 3D code is lazy-loaded and measured;
10. exact-head `Quality / verify` and `Quality / deploy-contract` are green;
11. production claims remain bounded to separately verified deployment evidence.
