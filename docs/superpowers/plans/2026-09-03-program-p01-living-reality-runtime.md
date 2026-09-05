# P01 Living Reality Runtime / Black Label / True 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first production-grade true-3D Klinikos Living Reality runtime as a lazy GPU-backed projection layer that enhances the existing semantic application without becoming a second router, backend, authority system, data model, Grid, or theme.

**Architecture:** Server code constructs a minimum-necessary `RealityProjection` from already-authorized domain/view data before anything crosses into the client runtime. The existing DOM application remains the semantic/precision twin and owns real links, forms, browser history, focus, accessibility and dense work. A lazy React Three Fiber scene receives only `RealityProjection`, emits presentation intent only, and automatically downgrades through `FULL_REALITY → BALANCED_REALITY → PRECISION_MODE` when capability, accessibility or runtime health requires it.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, TypeScript 5.9.x, Vitest 3.2.x, Tailwind 4, existing semantic design tokens; target renderer Three.js `0.185.1`, `@react-three/fiber` `9.7.0`, `@types/three` `0.185.1`. Do not add Drei/postprocessing in tranche 1.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p01-living-reality-runtime-design.md`

## Global Constraints

- `3D projects truth. 3D never owns truth.`
- `RealityProjection` is built server-side for authenticated/member data. Client components may consume it but may not derive broader spatial truth from raw domain/ORM/session objects.
- Extend `UniverseShell`, public Living Gateway/Object Stage, existing routes, existing member repository, current theme authority and current security gates.
- No `UniverseV2`, second router/auth shell/Grid/theme/data store, canvas-only application or WebGL business authority.
- Hidden/private nodes are omitted server-side rather than shipped and hidden client-side.
- No camera/raycast/local state establishes tenant access, eligibility, professional/clinical authority, payment state, pricing or entitlement.
- Semantic primary content is interactive before the 3D bundle.
- Dense clinical/financial/legal/admin work stays precision-first.
- Unsupported WebGL, reduced motion, low capability, runtime/context loss and explicit user preference retain a complete `PRECISION_MODE` path.
- Public scenes contain only existing public-safe path data, aggregate data or explicitly synthetic/demo data. Never fabricate network density or anonymous PHI.
- P16 remains a parallel gate. P01 success does not authorize production PHI.
- Exact-head `Quality / verify`, `Quality / deploy-contract`, browser/mobile/reduced-motion/200%-zoom evidence, confidentiality gates and production build/start are merge gates.

---

### Task 1: Lock renderer dependencies behind an intentional RED contract

**Files:**
- Create: `tests/living-reality-runtime-contract.test.ts`
- Modify after RED: `package.json`, `package-lock.json`

**Interfaces:** produces a React-19-compatible rendering substrate for later client files.

- [ ] **Step 1: Add the failing dependency contract**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));

describe("P01 true-3D dependency contract", () => {
  it("uses the bounded React 19 renderer without helper-stack creep", () => {
    expect(pkg.dependencies.three).toMatch(/^\^?0\.185\.1$/);
    expect(pkg.dependencies["@react-three/fiber"]).toMatch(/^\^?9\.7\.0$/);
    expect(pkg.devDependencies["@types/three"]).toMatch(/^\^?0\.185\.1$/);
    expect(pkg.dependencies["@react-three/drei"]).toBeUndefined();
    expect(pkg.dependencies["@react-three/postprocessing"]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run/record RED**

`npm test -- --run tests/living-reality-runtime-contract.test.ts`

Expected: dependency assertions fail because no Three/R3F packages exist yet.

- [ ] **Step 3: Install exact bounded packages and regenerate lockfile with npm**

```bash
npm install three@0.185.1 @react-three/fiber@9.7.0
npm install --save-dev @types/three@0.185.1
npm ls react react-dom next three @react-three/fiber @types/three
```

Do not hand-author a lockfile, use `--legacy-peer-deps`, or add an override to silence incompatibility. If the package tree is incompatible, stop and revise the renderer choice.

- [ ] **Step 4: Verify dependency GREEN**

```bash
npm test -- --run tests/living-reality-runtime-contract.test.ts
npm run type-check
npm run build
```

- [ ] **Step 5: Commit**

`git commit -am "build(p01): add React 19 living reality renderer"`

---

### Task 2: Define the safe projection contract and construct member Reality server-side

**Files:**
- Create: `src/lib/living-reality/reality-projection.ts`
- Create: `src/lib/living-reality/member-reality-projection.ts`
- Modify: `src/app/member/page.tsx`
- Modify: `src/components/living-universe/universe-shell.tsx`
- Create: `tests/living-reality-projection.test.ts`
- Create: `tests/living-reality-member-server-boundary.test.ts`

**Interfaces:**
- `memberRealityProjection(member: MemberHomeProjection): RealityProjection` is called in the server page after `getMemberHomeProjection()`.
- `UniverseShell` receives both `{ projection: MemberHomeProjection; realityProjection: RealityProjection }`.
- Only `realityProjection` is passed to the GPU runtime.

- [ ] **Step 1: Add RED projection/minimization tests**

Use a wider test fixture containing `secret`, `passwordHash` and `internalScore`; prove none survive explicit projection. Node keys must be exactly:

```ts
["id", "kind", "label", "state", "summary", "claimStatus", "routeRef"]
```

Assert five current plane lenses become safe relationship nodes, same-origin actions remain route references, `modeHint` is a presentation hint only, and no source object is spread into output.

- [ ] **Step 2: Add RED server-boundary source test**

Assert `src/app/member/page.tsx` imports/calls `memberRealityProjection`, passes `realityProjection` to `UniverseShell`, and `universe-shell.tsx` does **not** import `member-reality-projection`, DB, repositories or server orchestration.

- [ ] **Step 3: Implement projection types**

```ts
export type RealityPerformanceMode = "FULL_REALITY" | "BALANCED_REALITY" | "PRECISION_MODE";
export type CameraIntent = "ARRIVAL" | "FOCUS_OBJECT" | "SHOW_RELATIONSHIPS" | "INSPECT" | "MISSION" | "OUTCOME" | "NETWORK_OVERVIEW";
export type SpatialNodeProjection = {
  id: string; kind: string; label: string; state: string; summary: string;
  claimStatus: "claimed" | "verified" | "in_review" | "unverified" | null;
  routeRef: `/${string}` | null;
};
export type SpatialEdgeProjection = { id: string; fromId: string; toId: string; kind: "lens" | "path" | "relationship"; label: string };
export type AttentionProjection = { nodeId: string; level: "normal" | "elevated" | "critical"; explanation: string };
export type PrecisionActionProjection = { id: string; label: string; href: `/${string}` };
export type RealityProjection = {
  realityId: string; contextId: string; title: string; modeHint: RealityPerformanceMode;
  activeObject: SpatialNodeProjection | null; nodes: SpatialNodeProjection[];
  edges: SpatialEdgeProjection[]; attention: AttentionProjection[];
  cameraIntent: CameraIntent | null; precisionActions: PrecisionActionProjection[];
};
```

All builders explicitly assign fields; no object spreading from server/domain records.

- [ ] **Step 4: Build Reality in `member/page.tsx` before client boundary**

```tsx
const projection = await getMemberHomeProjection(session, requestedPath?.id);
const realityProjection = memberRealityProjection(projection);
return <UniverseShell projection={projection} realityProjection={realityProjection} />;
```

`member-reality-projection.ts` must be safe to execute server-side and must not be imported by client code.

- [ ] **Step 5: Verify**

```bash
npm test -- --run tests/living-reality-projection.test.ts tests/living-reality-member-server-boundary.test.ts tests/living-universe-member-home.test.ts
npm run security:client-boundary
npm run type-check
```

- [ ] **Step 6: Commit**

`git commit -am "feat(p01): add server-owned living reality projection"`

---

### Task 3: Implement deterministic performance/accessibility mode logic

**Files:** create `src/lib/living-reality/runtime-mode.ts`, `tests/living-reality-runtime-mode.test.ts`.

**Interfaces:** `selectInitialRealityMode(input)`, `degradeRealityMode(mode)`, `runtimeDprCap(mode)`.

- [ ] **Step 1: RED tests** cover unsupported WebGL→Precision, reduced motion→Balanced, explicit Precision override, <=4GB device memory→Balanced, FULL→BALANCED→PRECISION degradation, DPR caps 1.5/1.1.
- [ ] **Step 2: Run RED** with the targeted test.
- [ ] **Step 3: Implement pure functions only**; this module never reads `window`/`navigator`.
- [ ] **Step 4: Run GREEN** and typecheck.
- [ ] **Step 5: Commit** `feat(p01): govern living reality performance modes`.

---

### Task 4: Build the lazy procedural GPU runtime

**Files:**
- Create `src/components/living-reality/living-reality-layer.tsx`
- Create `src/components/living-reality/living-reality-canvas.tsx`
- Create `src/components/living-reality/living-reality-scene.tsx`
- Create `src/components/living-reality/living-reality.module.css`
- Modify `src/app/design-tokens.css`
- Extend `tests/living-reality-runtime-contract.test.ts`

**Interfaces:** `LivingRealityLayer({ projection, className? })`; dynamic client-only `LivingRealityCanvas`; scene accepts only `RealityProjection`.

- [ ] **Step 1: RED source contract** requires dynamic import `ssr:false`, R3F `Canvas`, `frameloop="demand"`, semantic `--k-reality-*` tokens, and forbids DB/repository/orchestration/private-Zumi imports or external 3D asset URLs.
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Capability collection** reads only WebGL availability, reduced-motion, device memory and explicit presentation preference. Persist only `klinikos.reality.mode`, never projection/domain data.
- [ ] **Step 4: Canvas contract** uses bounded DPR, `frameloop="demand"`, camera `[0,0,8]`, FOV 42, near .1/far 100, and context-loss handler that prevents default then requests downgrade.
- [ ] **Step 5: Procedural scene** puts active object at origin, related nodes on a deterministic ring, edges as lines, semantic token-derived colors/materials, bounded lighting. No downloaded models/textures, no fake network particles, no uncontrolled continuous loop.
- [ ] **Step 6: Verify** targeted tests + `security:check` + typecheck.
- [ ] **Step 7: Commit** `feat(p01): build lazy living reality canvas`.

---

### Task 5: Integrate Member Living Home while preserving DOM authority

**Files:** modify `src/components/living-universe/universe-shell.tsx`, `tests/living-universe-member-home.test.ts`; create `tests/living-reality-member-integration.test.ts`.

- [ ] **Step 1: RED integration assertions** require `data-living-reality-host="member"`, preserve `data-member-living-universe`, existing semantic links/buttons/forms, and prove runtime receives only the separate `RealityProjection` prop.
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Render the layer** as a visual projection beneath/alongside the current semantic controls. Do not derive Reality client-side. Presentation focus may change locally; route/action execution stays with existing DOM/server contracts.
- [ ] **Step 4: Verify** member tests, theme tests, security gate, typecheck.
- [ ] **Step 5: Commit** `feat(p01): project member home into living reality`.

---

### Task 6: Add the public-safe path Reality without fake density or PHI

**Files:** create `src/lib/living-reality/public-path-reality-projection.ts`, `tests/public-living-reality-projection.test.ts`; modify `src/components/marketing/public-living-universe-stage.tsx` and affected public tests.

- [ ] **Step 1: RED privacy/truth tests** require one active path node plus only its actual checkpoints, labels derived only from existing public-safe path fields, no patient/person identifiers, no invented population/density, and governance/commercial copy remains semantic DOM.
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement adapter and visual layer** inside existing Object Stage while preserving narrative, inspector, checkpoints, signup/Grid actions and all public safety copy.
- [ ] **Step 4: Verify** public tests + `security:check` + typecheck.
- [ ] **Step 5: Commit** `feat(p01): add public safe living path reality`.

---

### Task 7: Prove degraded/accessibility paths in production build

**Files:** modify `living-reality-layer.tsx`, `scripts/verify-frontend-browser-interactions.mjs`; create `tests/living-reality-degraded-states.test.ts`.

- [ ] **Step 1: RED tests** cover WebGL unavailable, reduced motion, context loss, repeated runtime failure and explicit Precision override.
- [ ] **Step 2: Implement status semantics** with `data-living-reality-mode/status`; Precision copy states full functionality remains available without 3D.
- [ ] **Step 3: Extend browser verifier**. CI Chrome runs `--disable-gpu`; it must prove a meaningful public workflow succeeds in Precision Mode. Preserve current mobile 390px, reduced-motion and real 200% page-zoom proof.
- [ ] **Step 4: Run production build/start + browser interaction verifier.**
- [ ] **Step 5: Commit** `test(p01): prove living reality fallback states`.

---

### Task 8: Release proof and P16 handoff

**Files:** update only concrete P01 records/evidence in `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`; do not create new company law.

- [ ] **Step 1: Run complete gates:** governance, security, typecheck, lint, full tests, MVP journeys, build.
- [ ] **Step 2: Search for duplicate renderer authority/helper-stack creep** (`UniverseV2`, `GridV2`, Drei, postprocessing, second router/theme).
- [ ] **Step 3: Mark implementation `BUILT_NEEDS_VERIFICATION` until exact-head CI completes**, with exact test/code/P16 dependency refs.
- [ ] **Step 4: Require final PR-head `Quality / verify` + `Quality / deploy-contract` and browser artifacts.**
- [ ] **Step 5: P16 may raise only the public/member non-PHI spatial control to its evidence-supported technical state. `P16-PRODUCTION-PHI` remains blocked.**
- [ ] **Step 6: Finish via `superpowers:finishing-a-development-branch`; never merge stale/failed head.**

## Self-review result

- Spec coverage: projection ownership, hybrid runtime, modes, public/member surfaces, security boundary, performance, accessibility, degraded states and exact-head evidence all terminate in tasks.
- Authority check: server constructs authenticated RealityProjection; client renderer consumes it only.
- Scope check: P01 remains renderer/presentation infrastructure; Grid eligibility, EHR clinical truth, transactions and PHI production authority remain outside this tranche.
- Placeholder scan: no implementation TBD/TODO placeholders.
