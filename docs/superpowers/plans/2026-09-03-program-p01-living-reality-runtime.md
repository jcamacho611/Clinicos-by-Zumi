# P01 Living Reality Runtime / Black Label / True 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first production-grade true-3D Klinikos Living Reality runtime as a lazy, GPU-backed projection layer that enhances the existing semantic application without becoming a second router, backend, authority system, or data model.

**Architecture:** Preserve `UniverseShell`, public Living Gateway, routes, DOM precision UI, identity, authorization, and server truth. Add a presentation-safe `RealityProjection`, a client runtime with `FULL_REALITY / BALANCED_REALITY / PRECISION_MODE`, and a lazy React Three Fiber canvas that consumes only safe projections. Every consequential action continues through existing server-side authorization and every essential workflow remains usable without WebGL.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, TypeScript 5.9.x, Vitest 3.2.x, Tailwind 4, existing CSS semantic tokens, Three.js `0.185.1`, `@react-three/fiber` `9.7.0`, `@types/three` `0.185.1`. React Three Fiber v9 is the React 19-compatible major; do not introduce Drei/postprocessing in this tranche unless a later reviewed task proves it removes more code than it adds.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p01-living-reality-runtime-design.md`

## Global Constraints

- `3D projects truth. 3D never owns truth.`
- Extend current Living Universe/public kernels; do not create `UniverseV2`, a new router, a new auth shell, a second Grid, a second theme provider, or a second data store.
- The browser receives minimum-necessary projection DTOs only; hidden/private nodes are omitted rather than client-filtered.
- No client camera/raycast/local state establishes authorization, eligibility, clinical truth, payment truth, pricing, or entitlement.
- Semantic content and primary actions render before the 3D bundle.
- Dense clinical/financial work remains precision-first.
- `prefers-reduced-motion`, unsupported WebGL, low capability, explicit user preference, and runtime failure must retain a complete `PRECISION_MODE` path.
- Public 3D uses only public-safe, aggregate, explicitly synthetic/demo, or already-authorized public projection data. No anonymous PHI.
- P16 is a parallel release gate; no PHI-bearing production spatial claim is permitted merely because P01 renders successfully.
- Exact-head Quality, deploy-contract, browser evidence, confidentiality gates, and production build/start remain merge gates.

---

### Task 1: Lock the React 19-compatible rendering dependencies behind a RED contract

**Files:**
- Create: `tests/living-reality-runtime-contract.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: repository React `19.1.1` and Next `15.5.22`.
- Produces: installed `three`, `@react-three/fiber`, and `@types/three` versions that later runtime files may import.

- [ ] **Step 1: Write the failing dependency contract**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));

describe("P01 rendering dependency contract", () => {
  it("uses the React 19-compatible R3F major without adding a helper stack", () => {
    expect(pkg.dependencies.three).toMatch(/^\^?0\.185\.1$/);
    expect(pkg.dependencies["@react-three/fiber"]).toMatch(/^\^?9\.7\.0$/);
    expect(pkg.devDependencies["@types/three"]).toMatch(/^\^?0\.185\.1$/);
    expect(pkg.dependencies["@react-three/drei"]).toBeUndefined();
    expect(pkg.dependencies["@react-three/postprocessing"]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `npm test -- --run tests/living-reality-runtime-contract.test.ts`

Expected: FAIL because the three rendering packages are absent.

- [ ] **Step 3: Install the bounded rendering stack**

Run:

```bash
npm install three@0.185.1 @react-three/fiber@9.7.0
npm install --save-dev @types/three@0.185.1
npm ls react react-dom next three @react-three/fiber @types/three
```

Expected: one compatible React 19 tree with no peer-dependency error.

- [ ] **Step 4: Run the contract, typecheck, and production build**

Run:

```bash
npm test -- --run tests/living-reality-runtime-contract.test.ts
npm run type-check
npm run build
```

Expected: PASS. If install/build requires overrides or legacy-peer-deps, stop; do not hide an incompatible dependency graph.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/living-reality-runtime-contract.test.ts
git commit -m "build(p01): add React 19 living reality renderer"
```

---

### Task 2: Create the presentation-safe RealityProjection contract

**Files:**
- Create: `src/lib/living-reality/reality-projection.ts`
- Create: `src/lib/living-reality/member-reality-projection.ts`
- Create: `tests/living-reality-projection.test.ts`

**Interfaces:**
- Consumes: `MemberHomeProjection` from `src/components/living-universe/universe-shell.tsx`.
- Produces: `RealityProjection`, `SpatialNodeProjection`, `SpatialEdgeProjection`, `AttentionProjection`, `CameraIntent`, `PrecisionActionProjection`, and `memberRealityProjection()`.

- [ ] **Step 1: Write RED projection tests**

The test fixture must include extra server-only-looking fields on the source fixture (`secret`, `internalScore`, `passwordHash`) through a wider local test type and prove they are absent after projection.

```ts
expect(Object.keys(projected.nodes[0])).toEqual([
  "id", "kind", "label", "state", "summary", "claimStatus", "routeRef"
]);
expect(JSON.stringify(projected)).not.toContain("passwordHash");
expect(JSON.stringify(projected)).not.toContain("internalScore");
```

Also assert `modeHint === "FULL_REALITY"`, `cameraIntent === "ARRIVAL"`, actions remain same-origin route references, and only the five existing plane lenses become relationship nodes.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- --run tests/living-reality-projection.test.ts`

Expected: FAIL because the projection modules do not exist.

- [ ] **Step 3: Implement the projection types**

Use this exact public shape in `reality-projection.ts`:

```ts
export type RealityPerformanceMode = "FULL_REALITY" | "BALANCED_REALITY" | "PRECISION_MODE";
export type CameraIntent = "ARRIVAL" | "FOCUS_OBJECT" | "SHOW_RELATIONSHIPS" | "INSPECT" | "MISSION" | "OUTCOME" | "NETWORK_OVERVIEW";

export type SpatialNodeProjection = {
  id: string;
  kind: string;
  label: string;
  state: string;
  summary: string;
  claimStatus: "claimed" | "verified" | "in_review" | "unverified" | null;
  routeRef: `/${string}` | null;
};

export type SpatialEdgeProjection = {
  id: string;
  fromId: string;
  toId: string;
  kind: "lens" | "path" | "relationship";
  label: string;
};

export type AttentionProjection = {
  nodeId: string;
  level: "normal" | "elevated" | "critical";
  explanation: string;
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
  modeHint: RealityPerformanceMode;
  activeObject: SpatialNodeProjection | null;
  nodes: SpatialNodeProjection[];
  edges: SpatialEdgeProjection[];
  attention: AttentionProjection[];
  cameraIntent: CameraIntent | null;
  precisionActions: PrecisionActionProjection[];
};
```

`memberRealityProjection()` must explicitly construct these fields; never spread source objects.

- [ ] **Step 4: Run projection tests + confidentiality gate**

Run:

```bash
npm test -- --run tests/living-reality-projection.test.ts
npm run security:client-boundary
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/living-reality tests/living-reality-projection.test.ts
git commit -m "feat(p01): add safe living reality projection"
```

---

### Task 3: Implement deterministic runtime-mode selection and downgrade behavior

**Files:**
- Create: `src/lib/living-reality/runtime-mode.ts`
- Create: `tests/living-reality-runtime-mode.test.ts`

**Interfaces:**
- Produces: `selectInitialRealityMode(input)`, `degradeRealityMode(mode)`, `runtimeDprCap(mode)`.

- [ ] **Step 1: Write RED behavior tests**

Cover these exact cases:

```ts
expect(selectInitialRealityMode({ webgl: false, reducedMotion: false, userPreference: null, deviceMemoryGb: 8 })).toBe("PRECISION_MODE");
expect(selectInitialRealityMode({ webgl: true, reducedMotion: true, userPreference: null, deviceMemoryGb: 8 })).toBe("BALANCED_REALITY");
expect(selectInitialRealityMode({ webgl: true, reducedMotion: false, userPreference: "PRECISION_MODE", deviceMemoryGb: 8 })).toBe("PRECISION_MODE");
expect(selectInitialRealityMode({ webgl: true, reducedMotion: false, userPreference: null, deviceMemoryGb: 2 })).toBe("BALANCED_REALITY");
expect(degradeRealityMode("FULL_REALITY")).toBe("BALANCED_REALITY");
expect(degradeRealityMode("BALANCED_REALITY")).toBe("PRECISION_MODE");
expect(runtimeDprCap("FULL_REALITY")).toBe(1.5);
expect(runtimeDprCap("BALANCED_REALITY")).toBe(1.1);
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/living-reality-runtime-mode.test.ts`

- [ ] **Step 3: Implement pure selection logic**

The module must not access `window`; browser capability collection belongs in the runtime component. `deviceMemoryGb <= 4` biases to Balanced. User `PRECISION_MODE` always wins. Unsupported WebGL always returns Precision.

- [ ] **Step 4: Run tests**

Run: `npm test -- --run tests/living-reality-runtime-mode.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/living-reality/runtime-mode.ts tests/living-reality-runtime-mode.test.ts
git commit -m "feat(p01): govern living reality performance modes"
```

---

### Task 4: Build the lazy GPU runtime with procedural scene primitives

**Files:**
- Create: `src/components/living-reality/living-reality-layer.tsx`
- Create: `src/components/living-reality/living-reality-canvas.tsx`
- Create: `src/components/living-reality/living-reality-scene.tsx`
- Create: `src/components/living-reality/living-reality.module.css`
- Modify: `src/app/design-tokens.css`
- Test: `tests/living-reality-runtime-contract.test.ts`

**Interfaces:**
- `LivingRealityLayer({ projection, activeNodeId?, className? })`
- lazy client import of `LivingRealityCanvas` with no SSR requirement;
- `LivingRealityCanvas({ projection, mode, onRuntimeFailure })`;
- scene consumes only `RealityProjection`.

- [ ] **Step 1: Extend RED source contracts**

Assert:
- `living-reality-canvas.tsx` imports `Canvas` from `@react-three/fiber`;
- `living-reality-layer.tsx` uses dynamic import with `ssr: false`;
- `frameloop="demand"` is present;
- no `@/lib/db`, repositories, server orchestration, Prisma, Zumi private engine, or external asset URL appears in the runtime files;
- `design-tokens.css` defines semantic `--k-reality-*` tokens for environment, surface, edge, active, attention, blocked, success and living-edge.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/living-reality-runtime-contract.test.ts`

- [ ] **Step 3: Implement `LivingRealityLayer` capability collection**

Collect only presentation capability:

```ts
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const webgl = Boolean(document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl"));
const deviceMemoryGb = "deviceMemory" in navigator ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) : 8;
```

Keep mode in client state. Persist only an explicit Precision preference under `klinikos.reality.mode`; never persist domain/projection data.

- [ ] **Step 4: Implement the canvas**

Use:

```tsx
<Canvas
  dpr={[1, runtimeDprCap(mode)]}
  frameloop="demand"
  camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 100 }}
  gl={{ antialias: mode === "FULL_REALITY", alpha: true, powerPreference: "high-performance" }}
>
  <LivingRealityScene projection={projection} mode={mode} />
</Canvas>
```

Attach `webglcontextlost` handling in `onCreated`; call `preventDefault()` and `onRuntimeFailure("context-lost")` so the layer degrades instead of trapping the user.

- [ ] **Step 5: Implement procedural scene grammar**

Use only geometry/material/light/line primitives. Place the active object at `[0,0,0]`; distribute related nodes on a deterministic ring derived from index; create relationship lines from edge endpoints; use semantic token colors resolved in the DOM and passed as simple strings. No textures, model downloads, fake network-density particles, or uncontrolled continuous animation in tranche 1.

- [ ] **Step 6: Run tests/security/typecheck**

```bash
npm test -- --run tests/living-reality-runtime-contract.test.ts
npm run security:check
npm run type-check
```

- [ ] **Step 7: Commit**

```bash
git add src/components/living-reality src/app/design-tokens.css tests/living-reality-runtime-contract.test.ts
git commit -m "feat(p01): build lazy living reality canvas"
```

---

### Task 5: Integrate the Member Living Home without removing its semantic twin

**Files:**
- Modify: `src/components/living-universe/universe-shell.tsx`
- Modify: `tests/living-universe-member-home.test.ts`
- Create: `tests/living-reality-member-integration.test.ts`

**Interfaces:**
- `UniverseShell` creates `const reality = memberRealityProjection(projection)` once and renders `LivingRealityLayer` as an aria-hidden visual projection beneath existing DOM controls.
- Existing `PlaneLens`, `ObjectStage`, `Inspector`, `ActionDock`, links/forms and route behavior remain intact.

- [ ] **Step 1: Write RED integration assertions**

Assert `data-living-reality-host="member"`, the existing `data-member-living-universe="true"` remains, semantic action links still exist, and the scene layer never receives the original raw `MemberHomeProjection` object directly.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/living-reality-member-integration.test.ts tests/living-universe-member-home.test.ts`

- [ ] **Step 3: Integrate the layer**

Make `<main>` `relative isolate`; place `LivingRealityLayer` in a pointer-safe visual layer. Keep semantic controls above it. Scene node focus may update presentation focus only; any route/action continues through existing DOM/server contracts.

- [ ] **Step 4: Run member + accessibility-oriented source tests**

```bash
npm test -- --run tests/living-reality-member-integration.test.ts tests/living-universe-member-home.test.ts tests/klinikos-theme-system.test.ts
npm run security:check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/living-universe/universe-shell.tsx tests/living-reality-member-integration.test.ts tests/living-universe-member-home.test.ts
git commit -m "feat(p01): project member home into living reality"
```

---

### Task 6: Add the public-safe path Reality without fake density or PHI

**Files:**
- Create: `src/lib/living-reality/public-path-reality-projection.ts`
- Modify: `src/components/marketing/public-living-universe-stage.tsx`
- Create: `tests/public-living-reality-projection.test.ts`
- Modify: existing public Living Gateway tests where their DOM contract changes.

**Interfaces:**
- Consumes: one existing `PublicLivingUniverseProjection` path.
- Produces: `publicPathRealityProjection(item)` containing only the current path and its explicit checkpoints.

- [ ] **Step 1: Write RED privacy/truth tests**

Assert:
- node count equals the path's real checkpoint count plus one active path object, not an invented network population;
- labels come only from `item.title`, `from`, `to`, and safe step labels;
- commercial/governance copy remains in DOM precision UI rather than hidden mesh metadata;
- no patient/person identifiers are synthesized.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/public-living-reality-projection.test.ts`

- [ ] **Step 3: Implement adapter and integrate visual layer**

Render the 3D layer inside the Object Stage as presentation background while preserving the existing article, narrative, inspector, checkpoints and Action Dock. Add `data-living-reality-host="public-path"`.

- [ ] **Step 4: Run public regression tests + security gate**

```bash
npm test -- --run tests/public-living-reality-projection.test.ts
npm run security:check
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/living-reality/public-path-reality-projection.ts src/components/marketing/public-living-universe-stage.tsx tests/public-living-reality-projection.test.ts
git commit -m "feat(p01): add public safe living path reality"
```

---

### Task 7: Prove Precision Mode, reduced motion, context loss and CI browser fallback

**Files:**
- Modify: `src/components/living-reality/living-reality-layer.tsx`
- Modify: `scripts/verify-frontend-browser-interactions.mjs`
- Create: `tests/living-reality-degraded-states.test.ts`

**Interfaces:**
- Runtime exposes `data-living-reality-mode` and `data-living-reality-status` for accessibility/testing only; these are presentation states, not authority.

- [ ] **Step 1: Write RED degraded-state tests**

Cover: unsupported WebGL → Precision; `prefers-reduced-motion` → no nonessential camera animation; context loss → degrade one tier; repeated failure → Precision; explicit Precision override survives reload but stores no projection data.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/living-reality-degraded-states.test.ts`

- [ ] **Step 3: Implement status semantics**

DOM copy for Precision must say the full interface is available without 3D; never call it an error unless initialization actually failed.

- [ ] **Step 4: Extend browser verifier**

The existing CI Chrome runs with GPU disabled. Assert the public root still completes a meaningful action and reports `PRECISION_MODE`; do not require WebGL in CI. Preserve existing 390px, reduced-motion and 200% zoom checks.

- [ ] **Step 5: Run browser verifier against production build**

```bash
npm run build
PORT=3000 npm start > /tmp/p01-start.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
CHROME_BIN="$(command -v google-chrome || command -v chromium)" FRONTEND_BASE_URL=http://127.0.0.1:3000 node scripts/verify-frontend-browser-interactions.mjs
```

Expected: semantic/public workflow passes in Precision Mode on the CI-style browser.

- [ ] **Step 6: Commit**

```bash
git add src/components/living-reality/living-reality-layer.tsx scripts/verify-frontend-browser-interactions.mjs tests/living-reality-degraded-states.test.ts
git commit -m "test(p01): prove living reality fallback states"
```

---

### Task 8: Exact-head release proof and P16 handoff

**Files:**
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json` only to append/update concrete P01 requirement records with evidence from this branch; do not create new company law.
- Evidence: GitHub Quality jobs/artifacts on the final PR head.

**Interfaces:**
- Produces: reviewable P01 implementation/evidence state and explicit P16 blocker for PHI-bearing projection claims.

- [ ] **Step 1: Run local/static gates**

```bash
npm run governance:traceability
npm run security:check
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Confirm no duplicate renderer authority**

```bash
git grep -n -E 'UniverseV2|GridV2|new Router|@react-three/drei|@react-three/postprocessing' -- src package.json
```

Expected: no duplicate authority/helper-stack regression.

- [ ] **Step 3: Update traceability with exact implementation state**

Use `BUILT_NEEDS_VERIFICATION` until exact-head CI finishes. Record test contracts, files, P16 dependency and final head SHA evidence refs. Never mark `LIVE_VERIFIED` merely because the branch is mergeable.

- [ ] **Step 4: Push/open PR and require exact-head jobs**

Required final evidence: `Quality / verify` and `Quality / deploy-contract`, including browser screenshots/artifacts. Keep PHI production state blocked unless P16 separately proves it.

- [ ] **Step 5: Finish through `superpowers:finishing-a-development-branch`**

Do not merge a failed or stale-head PR.
