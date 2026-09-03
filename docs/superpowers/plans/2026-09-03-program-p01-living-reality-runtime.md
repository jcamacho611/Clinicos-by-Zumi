# P01 — Living Reality Runtime / Black Label / True 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a real GPU-backed Living Reality using Three.js + React Three Fiber while preserving the existing semantic web twin, five-plane governance, server-owned truth, accessibility, confidentiality, and exact-head release evidence.

**Architecture:** Extend `UniverseShell / ObjectStage / PlaneLens / Inspector / ActionDock`; do not replace them. A minimum-necessary `RealityProjection` feeds a lazy R3F canvas. The canvas emits only the exact `RealityClientIntent` union defined below; all routes, authorization, clinical truth, Grid eligibility, payment truth, and consequential actions remain outside the renderer and are revalidated by existing server/destination boundaries.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, TypeScript 5.9.2, Three.js `^0.185.1`, `@react-three/fiber` `^9.7.0`, `@types/three` `^0.185.4`, Tailwind 4, current Marble/Obsidian design tokens, Vitest, current Quality/deploy-contract workflow.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p01-living-reality-runtime-design.md`

## Global Constraints

- Exactly five canonical ecosystem planes remain authoritative.
- `3D projects truth. 3D never owns truth.`
- The semantic DOM remains complete, focusable, routable, screen-reader-accessible, and independently usable.
- No `UniverseV2`, second router, second theme provider, second Grid, second Zumi, or parallel server truth model.
- Scene payloads contain minimum-necessary presentation data only.
- Never ship hidden prompts, ranking weights, eligibility formulas, anti-gaming logic, margins, secrets, raw ORM objects, private evidence, unnecessary PII/PHI, or server policy into the scene.
- `FULL_REALITY`, `BALANCED_REALITY`, `PRECISION_MODE` are performance/accessibility modes only.
- Dense clinical, financial, legal, and administrative work remains precision-first.
- WebGL failure, reduced motion, mobile, or user preference may downgrade rendering but never the task.
- P16 disclosure/security gates are merge blockers.
- Prefer procedural/open-source visual assets before paid hosted 3D services.
- Every code task follows RED → GREEN and ends with an independently reviewable commit.

---

### Task 1: Lock the P01 RED runtime contract and renderer dependency family

**Files:**
- Create: `tests/living-reality-runtime-contract.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces package contract: `three`, `@react-three/fiber@9`, `@types/three`.
- Produces required source paths for later tasks.

- [ ] **Step 1: Write the failing contract test**

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("P01 Living Reality runtime", () => {
  it("requires one React-19-compatible 3D runtime", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.dependencies["@react-three/fiber"]).toMatch(/^\^9\./);
    expect(pkg.dependencies.three).toMatch(/^\^0\.185\./);
    expect(pkg.devDependencies["@types/three"]).toMatch(/^\^0\.185\./);
  });

  it("requires the governed projection, mode resolver, and lazy runtime", () => {
    for (const path of [
      "src/lib/living-reality/reality-projection.ts",
      "src/lib/living-reality/reality-client-intent.ts",
      "src/lib/living-reality/runtime-mode.ts",
      "src/components/living-reality/living-reality-runtime.tsx",
      "src/components/living-reality/living-reality-canvas.tsx",
    ]) expect(existsSync(path), path).toBe(true);
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/living-reality-runtime-contract.test.ts
```

Expected: FAIL on missing packages/files.

- [ ] **Step 3: Install only the approved stable package family**

```bash
npm install three@^0.185.1 @react-three/fiber@^9.7.0
npm install -D @types/three@^0.185.4
npm ls three @react-three/fiber @types/three react react-dom
```

Expected: one valid React 19 tree. Do not install `react-three-fiber` or R3F 10 canary/alpha.

- [ ] **Step 4: Run package/security verification**

```bash
npm audit --omit=dev
npm run security:check
```

Record new advisories for P16; never run `npm audit fix --force`.

- [ ] **Step 5: Commit dependency tranche**

```bash
git add package.json package-lock.json tests/living-reality-runtime-contract.test.ts
git commit -m "build(living-reality): lock P01 renderer runtime"
```

---

### Task 2: Define the only browser projection and client-intent contracts

**Files:**
- Create: `src/lib/living-reality/reality-projection.ts`
- Create: `src/lib/living-reality/reality-client-intent.ts`
- Create: `src/lib/living-reality/member-reality-adapter.ts`
- Create: `tests/living-reality-projection.test.ts`
- Test: `tests/living-reality-runtime-contract.test.ts`

**Interfaces:**
- Produces `RealityMode`, `SpatialNodeProjection`, `SpatialEdgeProjection`, `AttentionProjection`, `CameraIntent`, `PrecisionActionProjection`, `RealityProjection`, `RealityClientIntent`, `memberHomeToRealityProjection()`.

- [ ] **Step 1: Write the RED projection/minimization test**

```ts
import { describe, expect, it } from "vitest";
import { memberHomeToRealityProjection } from "@/lib/living-reality/member-reality-adapter";
import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";

const fixture: MemberHomeProjection = {
  person: { displayName: "Jordan Lee" },
  activeLens: "lifecycle",
  lenses: [],
  object: {
    id: "person-profile",
    title: "Your Klinikos identity",
    kind: "Person profile",
    state: "Account active",
    summary: "Person-owned context.",
    claimStatus: "unverified",
  },
  timeline: { before: "Joined", now: "Active", next: "Continue" },
  inspector: { eyebrow: "Evidence", title: "What is true", body: "Bounded", evidence: [], authority: [] },
  actions: [{ id: "grid", label: "Explore Grid", href: "/grid" }],
};

describe("RealityProjection", () => {
  it("projects only presentation-safe fields", () => {
    const projection = memberHomeToRealityProjection(fixture);
    const serialized = JSON.stringify(projection);
    expect(projection.activeObject?.id).toBe("person-profile");
    expect(projection.precisionActions[0]?.href).toBe("/grid");
    for (const forbidden of [
      "password", "secret", "hiddenPrompt", "systemPrompt", "rankingWeight",
      "eligibilityScore", "internalMargin", "rawOrm", "organizationId",
    ]) expect(serialized).not.toContain(forbidden);
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/living-reality-projection.test.ts
```

Expected: FAIL on missing modules.

- [ ] **Step 3: Create the exact projection types**

```ts
// src/lib/living-reality/reality-projection.ts
export type RealityMode = "FULL_REALITY" | "BALANCED_REALITY" | "PRECISION_MODE";
export type CameraIntent =
  | "ARRIVAL"
  | "FOCUS_OBJECT"
  | "SHOW_RELATIONSHIPS"
  | "INSPECT"
  | "MISSION"
  | "OUTCOME"
  | "NETWORK_OVERVIEW";

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

export type RealityProjection = {
  realityId: string;
  title: string;
  modeHint: RealityMode;
  activeObject: SpatialNodeProjection | null;
  nodes: SpatialNodeProjection[];
  edges: SpatialEdgeProjection[];
  attention: Array<{ objectId: string; level: "low" | "medium" | "high"; safeReason: string }>;
  cameraIntent: CameraIntent | null;
  precisionActions: Array<{ id: string; label: string; href: `/${string}` }>;
};
```

- [ ] **Step 4: Create the exact client-intent union**

```ts
// src/lib/living-reality/reality-client-intent.ts
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

export type RealityClientIntent =
  | { kind: "FOCUS_OBJECT"; objectId: string }
  | { kind: "INSPECT_OBJECT"; objectId: string }
  | { kind: "OPEN_ROUTE"; href: `/${string}` }
  | { kind: "CHANGE_LENS"; lensId: CanonicalPlaneId }
  | { kind: "REQUEST_ACTION_PANEL"; objectId: string | null };
```

No approve/sign/submit/pay/settle/publish/verify/authorize/rank/match/book/order variants are allowed.

- [ ] **Step 5: Implement the minimum member adapter**

```ts
// src/lib/living-reality/member-reality-adapter.ts
import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";
import type { RealityProjection } from "@/lib/living-reality/reality-projection";

export function memberHomeToRealityProjection(input: MemberHomeProjection): RealityProjection {
  const activeObject = {
    id: input.object.id,
    kind: input.object.kind,
    label: input.object.title,
    state: input.object.state,
    emphasis: "selected" as const,
    route: null,
  };
  return {
    realityId: "member-living-home",
    title: input.object.title,
    modeHint: "FULL_REALITY",
    activeObject,
    nodes: [activeObject],
    edges: [],
    attention: [],
    cameraIntent: "FOCUS_OBJECT",
    precisionActions: input.actions.map((action) => ({ id: action.id, label: action.label, href: action.href })),
  };
}
```

Do not invent edges that the current minimum-necessary member projection does not contain.

- [ ] **Step 6: Run GREEN and commit**

```bash
npx vitest run tests/living-reality-projection.test.ts tests/living-universe-member-home.test.ts
npm run type-check
git add src/lib/living-reality tests/living-reality-projection.test.ts
git commit -m "feat(living-reality): add safe reality contracts"
```

---

### Task 3: Govern FULL/BALANCED/PRECISION modes and semantic material tokens

**Files:**
- Create: `src/lib/living-reality/runtime-mode.ts`
- Create: `src/lib/living-reality/material-tokens.ts`
- Modify: `src/app/design-tokens.css`
- Create: `tests/living-reality-runtime-mode.test.ts`
- Create: `tests/living-reality-materials.test.ts`

**Interfaces:**
- `resolveRealityMode(capabilities, preference): RealityMode`
- `shouldDowngradeRealityMode(sample): RealityMode | null`
- `readLivingRealityMaterialTokens(element?: Element): LivingRealityMaterialTokens`

- [ ] **Step 1: Write RED mode tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveRealityMode, shouldDowngradeRealityMode } from "@/lib/living-reality/runtime-mode";

describe("Living Reality performance modes", () => {
  const capable = { webgl: true, reducedMotion: false, coarsePointer: false, deviceMemoryGb: 8 };
  it("fails to Precision without WebGL", () => {
    expect(resolveRealityMode({ ...capable, webgl: false }, "auto")).toBe("PRECISION_MODE");
  });
  it("honors explicit Precision preference", () => {
    expect(resolveRealityMode(capable, "precision")).toBe("PRECISION_MODE");
  });
  it("uses Full on healthy desktop capability", () => {
    expect(resolveRealityMode(capable, "auto")).toBe("FULL_REALITY");
  });
  it("downgrades sustained poor performance one level", () => {
    expect(shouldDowngradeRealityMode({ mode: "FULL_REALITY", averageFps: 24, sampleMs: 5000 })).toBe("BALANCED_REALITY");
  });
});
```

- [ ] **Step 2: Implement the pure resolver**

```ts
import type { RealityMode } from "@/lib/living-reality/reality-projection";

type Preference = "auto" | "full" | "balanced" | "precision";
type Capabilities = { webgl: boolean; reducedMotion: boolean; coarsePointer: boolean; deviceMemoryGb: number | null };

export function resolveRealityMode(c: Capabilities, p: Preference): RealityMode {
  if (!c.webgl || p === "precision") return "PRECISION_MODE";
  if (p === "balanced" || c.reducedMotion || c.coarsePointer || (c.deviceMemoryGb !== null && c.deviceMemoryGb < 4)) return "BALANCED_REALITY";
  return "FULL_REALITY";
}

export function shouldDowngradeRealityMode(s: { mode: RealityMode; averageFps: number; sampleMs: number }): RealityMode | null {
  if (s.sampleMs < 5000 || s.averageFps >= 30) return null;
  if (s.mode === "FULL_REALITY") return "BALANCED_REALITY";
  if (s.mode === "BALANCED_REALITY") return "PRECISION_MODE";
  return null;
}
```

Runtime applies DPR caps of `1.75` Full and `1.25` Balanced.

- [ ] **Step 3: Add semantic CSS variables to the existing token authority**

```css
--k-reality-environment: var(--k-public-bg);
--k-reality-object: var(--k-public-surface);
--k-reality-line: var(--k-line);
--k-reality-attention: var(--k-accent);
--k-reality-selected: var(--k-accent);
--k-reality-blocked: var(--k-danger);
--k-reality-verified: var(--k-success);
--k-reality-living-edge: color-mix(in srgb, var(--k-accent) 42%, transparent);
```

Use actual existing semantic variable names if the current token file has a more specific equivalent; do not create a parallel palette.

- [ ] **Step 4: Implement token bridge**

```ts
export type LivingRealityMaterialTokens = {
  environment: string;
  object: string;
  line: string;
  attention: string;
  selected: string;
  blocked: string;
  verified: string;
};

export function readLivingRealityMaterialTokens(element: Element = document.documentElement): LivingRealityMaterialTokens {
  const style = getComputedStyle(element);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    environment: read("--k-reality-environment"),
    object: read("--k-reality-object"),
    line: read("--k-reality-line"),
    attention: read("--k-reality-attention"),
    selected: read("--k-reality-selected"),
    blocked: read("--k-reality-blocked"),
    verified: read("--k-reality-verified"),
  };
}
```

- [ ] **Step 5: Run GREEN and commit**

```bash
npx vitest run tests/living-reality-runtime-mode.test.ts tests/living-reality-materials.test.ts tests/klinikos-theme-system.test.ts
npm run type-check
git add src/lib/living-reality src/app/design-tokens.css tests/living-reality-runtime-mode.test.ts tests/living-reality-materials.test.ts
git commit -m "feat(living-reality): govern modes and materials"
```

---

### Task 4: Build the lazy R3F scene with no authority imports

**Files:**
- Create: `src/components/living-reality/living-reality-runtime.tsx`
- Create: `src/components/living-reality/living-reality-canvas.tsx`
- Create: `src/components/living-reality/scene/reality-scene.tsx`
- Create: `src/components/living-reality/scene/reality-node.tsx`
- Create: `src/components/living-reality/scene/reality-edge.tsx`
- Create: `src/components/living-reality/scene/camera-director.tsx`
- Create: `tests/living-reality-renderer-structure.test.ts`

**Interfaces:**
- `LivingRealityRuntime({ projection, onIntent })`
- `LivingRealityCanvas({ projection, mode, onIntent })`
- scene files consume only `RealityProjection`, `RealityMode`, `RealityClientIntent`, material tokens.

- [ ] **Step 1: Write RED structural test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(p, "utf8");

describe("P01 renderer boundary", () => {
  it("keeps Canvas isolated and lazy", () => {
    expect(read("src/components/living-reality/living-reality-canvas.tsx")).toContain("<Canvas");
    expect(read("src/components/living-reality/living-reality-runtime.tsx")).toContain("dynamic(");
    expect(read("src/components/living-reality/living-reality-runtime.tsx")).toContain("ssr: false");
  });
  it("keeps authority and data engines out of scene modules", () => {
    const scene = ["reality-scene.tsx", "reality-node.tsx", "reality-edge.tsx", "camera-director.tsx"]
      .map((n) => read(`src/components/living-reality/scene/${n}`)).join("\n");
    for (const forbidden of ["@/lib/db", "api-authorization", "stripe", "eligibility", "ranking", "hiddenPrompt", "process.env"])
      expect(scene).not.toContain(forbidden);
  });
});
```

- [ ] **Step 2: Create lazy wrapper**

```tsx
"use client";
import dynamic from "next/dynamic";
import type { RealityProjection, RealityMode } from "@/lib/living-reality/reality-projection";
import type { RealityClientIntent } from "@/lib/living-reality/reality-client-intent";

const LivingRealityCanvas = dynamic(
  () => import("./living-reality-canvas").then((m) => m.LivingRealityCanvas),
  { ssr: false },
);

export function LivingRealityRuntime(props: {
  projection: RealityProjection;
  mode: RealityMode;
  onIntent: (intent: RealityClientIntent) => void;
}) {
  if (props.mode === "PRECISION_MODE") return null;
  return <div aria-hidden="true" data-living-reality-visual><LivingRealityCanvas {...props} /></div>;
}
```

- [ ] **Step 3: Create canvas with bounded renderer settings**

```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import type { RealityProjection, RealityMode } from "@/lib/living-reality/reality-projection";
import type { RealityClientIntent } from "@/lib/living-reality/reality-client-intent";
import { RealityScene } from "./scene/reality-scene";

export function LivingRealityCanvas(props: {
  projection: RealityProjection;
  mode: RealityMode;
  onIntent: (intent: RealityClientIntent) => void;
}) {
  const dpr: [number, number] = props.mode === "FULL_REALITY" ? [1, 1.75] : [1, 1.25];
  return <Canvas dpr={dpr} frameloop="demand"><RealityScene {...props} /></Canvas>;
}
```

- [ ] **Step 4: Implement procedural scene only from projection nodes/edges**

`RealityScene` maps `projection.nodes` to `RealityNode` and `projection.edges` to `RealityEdge`. `RealityNode` may emit only `FOCUS_OBJECT`/`INSPECT_OBJECT`. Camera choreography maps the `CameraIntent` enum to bounded positions; it never calls an API/server action.

```tsx
export function RealityScene({ projection, mode, onIntent }: SceneProps) {
  return <>
    <ambientLight intensity={mode === "FULL_REALITY" ? 0.7 : 0.9} />
    {projection.nodes.map((node, index) => (
      <RealityNode key={node.id} node={node} index={index} onIntent={onIntent} />
    ))}
    {projection.edges.map((edge) => <RealityEdge key={edge.id} edge={edge} />)}
    <CameraDirector intent={projection.cameraIntent} mode={mode} />
  </>;
}
```

- [ ] **Step 5: Run GREEN and commit**

```bash
npx vitest run tests/living-reality-renderer-structure.test.ts tests/living-reality-runtime-contract.test.ts
npm run type-check
npm run security:client-boundary
git add src/components/living-reality tests/living-reality-renderer-structure.test.ts
git commit -m "feat(living-reality): add lazy true 3D scene"
```

---

### Task 5: Integrate Member + Public Living Reality while preserving the precision twin

**Files:**
- Modify: `src/components/living-universe/universe-shell.tsx`
- Create: `src/lib/living-reality/public-reality-projection.ts`
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Create: `tests/living-reality-member-equivalence.test.ts`
- Create: `tests/public-living-reality-safety.test.ts`

**Interfaces:**
- Member: current `MemberHomeProjection` → `memberHomeToRealityProjection()` → optional visual runtime + unchanged semantic `ObjectStage/PlaneLens/Inspector/ActionDock`.
- Public: existing `PublicLivingUniverseProjection` → presentation-only `RealityProjection` with explicit `truthKind`.

- [ ] **Step 1: Write member-equivalence RED test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const shell = readFileSync("src/components/living-universe/universe-shell.tsx", "utf8");
describe("Member Living Reality equivalence", () => {
  it("keeps the semantic twin after adding 3D", () => {
    for (const name of ["LivingRealityRuntime", "ObjectStage", "PlaneLens", "Inspector", "ActionDock"])
      expect(shell).toContain(name);
    expect(shell).toContain("Precision mode");
  });
});
```

- [ ] **Step 2: Integrate runtime without moving authority**

Add a client mode state resolved by `resolveRealityMode()`, render `LivingRealityRuntime` as visual enhancement, and retain the current semantic grid and action filtering unchanged. Scene `OPEN_ROUTE` intents must pass `isAllowedMemberActionHref()` before router navigation.

- [ ] **Step 3: Implement public projection with truth class**

```ts
export type PublicRealityTruthKind = "REAL_PUBLIC" | "SYNTHETIC_DEMO" | "EMPTY";

export function publicPathToRealityProjection(
  item: PublicLivingUniverseProjection,
  truthKind: PublicRealityTruthKind,
): RealityProjection {
  return {
    realityId: `public-path:${item.pathId}`,
    title: item.title,
    modeHint: "FULL_REALITY",
    activeObject: { id: item.pathId, kind: "Path", label: item.title, state: item.availability, emphasis: "selected", route: null },
    nodes: [{ id: item.pathId, kind: "Path", label: item.title, state: item.availability, emphasis: "selected", route: null }],
    edges: [], attention: [], cameraIntent: "FOCUS_OBJECT", precisionActions: [],
  };
}
```

The `truthKind` must remain available to the public wrapper/test so synthetic/demo presentation can never be labeled as live network activity.

- [ ] **Step 4: Preserve semantic public intent/action controls first**

The public input, Object Stage, signup/path continuation, drawers, mobile controls, no-result state, and emergency text remain semantic and usable before/without the canvas.

- [ ] **Step 5: Run GREEN and commit**

```bash
npx vitest run \
  tests/living-reality-member-equivalence.test.ts \
  tests/public-living-reality-safety.test.ts \
  tests/living-universe-member-home.test.ts \
  tests/public-living-universe-reference-parity.test.ts \
  tests/public-living-universe-persistent-stage.test.ts
npm run security:check
git add src/components/living-universe src/components/marketing src/lib/living-reality tests/living-reality-member-equivalence.test.ts tests/public-living-reality-safety.test.ts
git commit -m "feat(living-reality): integrate public and member reality"
```

---

### Task 6: Prove fallback, accessibility, context-loss, and performance budgets

**Files:**
- Create: `tests/living-reality-failure-modes.test.ts`
- Create: `tests/living-reality-accessibility-contract.test.ts`
- Create: `scripts/living-reality/check-bundle-budget.mjs`
- Modify: `scripts/verify-frontend-browser-interactions.mjs`
- Modify: `.github/workflows/quality.yml` only to add a deterministic budget command if it is not already covered by the Quality job.

**Interfaces:**
- Produces enforced no-WebGL/reduced-motion/mobile behavior and evidence that the 3D chunk is lazy.

- [ ] **Step 1: Write failure-mode tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveRealityMode } from "@/lib/living-reality/runtime-mode";

describe("Living Reality fallbacks", () => {
  it("uses Precision when WebGL is unavailable", () => {
    expect(resolveRealityMode({ webgl: false, reducedMotion: false, coarsePointer: false, deviceMemoryGb: 8 }, "auto"))
      .toBe("PRECISION_MODE");
  });
  it("never makes pricing or authority a performance input", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile("src/lib/living-reality/runtime-mode.ts", "utf8"));
    for (const forbidden of ["price", "entitlement", "role", "organizationId", "authority"])
      expect(source).not.toContain(forbidden);
  });
});
```

- [ ] **Step 2: Add browser accessibility assertions**

Browser QA must exercise:
- keyboard-only member/public primary action;
- reduced motion;
- 200% zoom;
- 390px viewport;
- forced Precision mode;
- simulated WebGL initialization/context-loss fallback;
- Marble and Obsidian;
- no canvas focus target required for task completion.

Extend `verify-frontend-browser-interactions.mjs` with explicit assertions and screenshots only from synthetic/non-PHI fixtures.

- [ ] **Step 3: Add dynamic-chunk budget check**

```js
// scripts/living-reality/check-bundle-budget.mjs
import { readFileSync } from "node:fs";
const manifest = JSON.parse(readFileSync(".next/build-manifest.json", "utf8"));
const eager = JSON.stringify(manifest.pages?.["/"] ?? []);
if (/react-three-fiber|three(?:\.|-)/i.test(eager)) {
  console.error("Living Reality renderer leaked into the eager root bundle");
  process.exit(1);
}
console.log("Living Reality renderer remains dynamically split");
```

If Next's current manifest uses hashed names that cannot identify the dependency reliably, derive the check from build stats/chunk module output and test that script with a fixture rather than pretending a weak grep proves the budget.

- [ ] **Step 4: Run full local release suite**

```bash
npm run security:check
npm run governance:traceability
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
node scripts/living-reality/check-bundle-budget.mjs
```

- [ ] **Step 5: Commit**

```bash
git add tests/living-reality-failure-modes.test.ts tests/living-reality-accessibility-contract.test.ts scripts/living-reality scripts/verify-frontend-browser-interactions.mjs .github/workflows/quality.yml
git commit -m "test(living-reality): enforce fallback and release budgets"
```

---

### Task 7: Reconcile P01 traceability and exact-head release evidence

**Files:**
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`
- Reuse current evidence/release artifacts; do not create a second release registry.

**Interfaces:**
- Produces truthful P01 implementation state tied to the exact final candidate SHA.

- [ ] **Step 1: Update the existing P01 record only after the code is green**

Record concrete reuse targets, test files, P16 gates, renderer dependency versions, measured bundle evidence, performance-mode evidence, accessibility/browser evidence, and remaining deployment gaps.

- [ ] **Step 2: Validate the machine ledger**

```bash
npm run governance:traceability
```

Expected: PASS.

- [ ] **Step 3: Push and require exact-head GitHub Quality**

Both `Quality / verify` and `Quality / deploy-contract` must pass on the same final SHA. A mergeable PR state is not evidence.

- [ ] **Step 4: Final disclosure review**

```bash
grep -RInE 'hiddenPrompt|systemPrompt|rankingWeight|eligibilityScore|internalMargin|process\.env' \
  src/components/living-reality src/lib/living-reality || true
```

Any match must be reviewed; secret/policy/authority leakage is a merge blocker.

- [ ] **Step 5: Commit evidence**

```bash
git add docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json
git commit -m "docs(governance): record P01 release evidence"
```

## P01 Definition of Done

P01 is complete only when:

1. a real R3F/Three runtime is materially present on capable public/member Living Reality surfaces;
2. every essential task remains complete in Precision mode;
3. exactly five canonical planes and one Person identity remain intact;
4. scene DTOs are minimum-necessary and P16 gates pass;
5. the client-intent union contains presentation/navigation intent only;
6. Full/Balanced/Precision downgrade paths are tested;
7. reduced motion, keyboard, 200% zoom, 390px, WebGL failure/context loss, Marble/Obsidian are verified;
8. public demo/synthetic state never masquerades as real network activity;
9. renderer code is dynamically split and measured;
10. exact-head `Quality / verify` and `Quality / deploy-contract` are green;
11. production deployment claims remain separate from PR/CI implementation evidence.
