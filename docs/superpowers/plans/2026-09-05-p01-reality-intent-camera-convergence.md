# P01 Reality Intent + Camera Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest the strongest non-authoritative interaction and camera primitives from PR #534 into the already-merged P01/P16 Living Reality spine without creating a second projection, runtime, disclosure boundary, or material authority.

**Architecture:** Keep `src/lib/living-reality/reality-projection.ts` as the sole browser projection contract and `LivingRealityLayer`/`LivingRealityCanvas` as the sole runtime. Add one presentation-only `RealityClientIntent` union and one dedicated camera director consumed by the existing canvas/scene. Renderer decomposition is allowed only where it reduces responsibility in the canonical scene; no parallel scene/runtime tree may survive.

**Tech Stack:** Next.js 15.5, React 19.1, Three 0.185.1, React Three Fiber 9.7.0, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-05-klinikos-living-reality-convergence-design.md`

## Global Constraints

- One `RealityProjection`; do not add or rename a second projection contract.
- `RealityClientIntent` is presentation-only and structurally cannot encode approval, signing, payment, settlement, credential verification, clinical orders, hiring, worker classification, claim submission, or legal acceptance.
- Camera state is presentation state only; it cannot mutate route, server, clinical, financial, organization, credential, payment, or security state.
- Keep `FULL_REALITY`, `BALANCED_REALITY`, and `PRECISION_MODE` as the only performance authority.
- Keep `frameloop="demand"`; camera motion must be bounded and settle.
- Reduced-motion behavior must avoid cinematic travel.
- Essential work remains DOM-authoritative and fully usable without WebGL.
- Production PHI remains blocked; no new raw domain object enters the projection.
- No Drei, postprocessing package, physics engine, duplicate palette, or dependency downgrade.
- This branch is stacked on the exact-head green browser-verifier repair PR #540 and must be rebased onto current `main` after that repair integrates.

---

### Task 1: Presentation-only RealityClientIntent contract

**Files:**
- Create: `src/lib/living-reality/reality-client-intent.ts`
- Create: `tests/living-reality-client-intent.test.ts`

**Interfaces:**
- Consumes: `CanonicalPlaneId` from `src/lib/ecosystem/canonical-ecosystem-graph.ts`.
- Produces: `RealityClientIntent` union for UI/renderer presentation requests only.

- [ ] **Step 1: Write the failing contract test**

Create a test that imports the source as text and requires the permitted discriminants:

```ts
const permitted = [
  "FOCUS_OBJECT",
  "INSPECT_OBJECT",
  "OPEN_ROUTE",
  "CHANGE_LENS",
  "REQUEST_ACTION_PANEL",
  "CHANGE_TIME_VIEW",
  "ENTER_MISSION_ROOM",
  "EXIT_MISSION_ROOM",
  "SHOW_RELATIONSHIPS",
  "RECENTER_CAMERA",
] as const;
```

The same test must reject forbidden authority verbs in the union source:

```ts
const forbidden = [
  "APPROVE", "SIGN", "DIAGNOSE", "PRESCRIBE", "ORDER",
  "VERIFY_CREDENTIAL", "AUTHORIZE_ORGANIZATION", "HIRE",
  "CLASSIFY_WORKER", "PAY", "SETTLE", "SUBMIT_CLAIM",
  "AWARD_COMPETENCY", "ACCEPT_LEGAL_TERMS",
] as const;
```

- [ ] **Step 2: Run RED**

Run:

```bash
npx vitest run tests/living-reality-client-intent.test.ts
```

Expected: FAIL because `reality-client-intent.ts` does not exist on the canonical spine.

- [ ] **Step 3: Implement the minimal union**

Create:

```ts
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

export type RealityClientIntent =
  | { kind: "FOCUS_OBJECT"; objectId: string }
  | { kind: "INSPECT_OBJECT"; objectId: string }
  | { kind: "OPEN_ROUTE"; href: `/${string}` }
  | { kind: "CHANGE_LENS"; lensId: CanonicalPlaneId }
  | { kind: "REQUEST_ACTION_PANEL"; objectId: string | null }
  | { kind: "CHANGE_TIME_VIEW"; direction: "PAST" | "NOW" | "FUTURE" }
  | { kind: "ENTER_MISSION_ROOM"; missionId: string }
  | { kind: "EXIT_MISSION_ROOM" }
  | { kind: "SHOW_RELATIONSHIPS"; objectId: string }
  | { kind: "RECENTER_CAMERA"; objectId: string | null };
```

Do not add dispatch or server mutation behavior in this task.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/living-reality-client-intent.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/living-reality/reality-client-intent.ts tests/living-reality-client-intent.test.ts
git commit -m "feat(p01): add presentation-only reality intents"
```

---

### Task 2: Expand the canonical camera-intent vocabulary only

**Files:**
- Modify: `src/lib/living-reality/reality-projection.ts`
- Create: `tests/living-reality-camera-contract.test.ts`

**Interfaces:**
- Consumes: existing `CameraIntent` and `RealityProjection`.
- Produces: one canonical camera vocabulary shared by server projections and the renderer.

- [ ] **Step 1: Write RED test**

Require these exact canonical camera intents:

```ts
[
  "ARRIVAL",
  "FOCUS_OBJECT",
  "SHOW_RELATIONSHIPS",
  "INSPECT",
  "MISSION",
  "OUTCOME",
  "NETWORK_OVERVIEW",
  "TIME_COMPARE",
  "PRECISION_LOCK",
]
```

The test must also assert there is still exactly one exported `RealityProjection` type in `src/lib/living-reality/`.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/living-reality-camera-contract.test.ts
```

Expected: FAIL because `TIME_COMPARE` and `PRECISION_LOCK` are not yet present.

- [ ] **Step 3: Extend only the existing `CameraIntent` union**

Append:

```ts
| "TIME_COMPARE"
| "PRECISION_LOCK"
```

Do not alter disclosure fields or add camera coordinates to the server DTO.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/living-reality-camera-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/living-reality/reality-projection.ts tests/living-reality-camera-contract.test.ts
git commit -m "feat(p01): complete canonical camera intent grammar"
```

---

### Task 3: Dedicated CameraDirector with bounded demand-rendered transitions

**Files:**
- Create: `src/components/living-reality/scene/camera-director.tsx`
- Modify: `src/components/living-reality/living-reality-canvas.tsx`
- Create: `tests/living-reality-camera-director.test.ts`

**Interfaces:**
- Consumes: `projection.cameraIntent`, active object presence, performance mode, browser reduced-motion preference, R3F camera + invalidate.
- Produces: bounded presentation-only camera positioning that settles without a permanent frame loop.

- [ ] **Step 1: Write RED structural test**

Require `LivingRealityCanvas` to render one `CameraDirector` and require the director to:

```text
read projection.cameraIntent
read prefers-reduced-motion
call invalidate only during a finite transition
never call router.push/replace
never fetch
never call an API
never mutate RealityProjection
```

The test must reject an unconditional permanent `useFrame` loop.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/living-reality-camera-director.test.ts
```

Expected: FAIL because no canonical camera director exists.

- [ ] **Step 3: Implement the director**

Use one configuration map such as:

```ts
const CAMERA_PRESETS = {
  ARRIVAL: { position: [0, 0, 8], fov: 42 },
  FOCUS_OBJECT: { position: [0, 0, 6.4], fov: 40 },
  SHOW_RELATIONSHIPS: { position: [0, 0, 8.8], fov: 44 },
  INSPECT: { position: [0.4, 0.15, 5.8], fov: 38 },
  MISSION: { position: [0, 0.2, 7.4], fov: 40 },
  OUTCOME: { position: [0, 0, 8.2], fov: 42 },
  NETWORK_OVERVIEW: { position: [0, 0.3, 10.4], fov: 46 },
  TIME_COMPARE: { position: [0, 0.1, 9.4], fov: 45 },
  PRECISION_LOCK: { position: [0, 0, 8], fov: 42 },
} as const;
```

Treat these values as presentation configuration, not business semantics. Use a finite interpolation scheduled only after intent changes; in reduced motion, apply the target immediately and invalidate once. Stop scheduling frames when the interpolation reaches its target.

- [ ] **Step 4: Wire the director into the existing Canvas**

Keep the existing Canvas, DPR cap, context-loss guard, and `frameloop="demand"`. Do not introduce a second Canvas or runtime.

- [ ] **Step 5: Run GREEN**

```bash
npx vitest run tests/living-reality-camera-director.test.ts tests/living-reality-runtime-mode.test.ts tests/living-reality-degraded-states.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/living-reality/scene/camera-director.tsx src/components/living-reality/living-reality-canvas.tsx tests/living-reality-camera-director.test.ts
git commit -m "feat(p01): add bounded living reality camera director"
```

---

### Task 4: Renderer decomposition without a second runtime

**Files:**
- Create: `src/components/living-reality/scene/reality-node.tsx`
- Create: `src/components/living-reality/scene/reality-edge.tsx`
- Modify: `src/components/living-reality/living-reality-scene.tsx`
- Create: `tests/living-reality-renderer-convergence.test.ts`

**Interfaces:**
- Consumes: existing `SpatialNodeProjection`, `SpatialEdgeProjection`, safe attention level, shared `RealityPalette`, positions computed by the canonical scene.
- Produces: focused renderer units only; no alternate scene graph or projection.

- [ ] **Step 1: Write RED test**

Require the canonical scene to import `RealityNode` and `RealityEdge` from `src/components/living-reality/scene/`, while prohibiting:

```text
second Canvas
second RealityProjection definition
business mutation handlers
raw domain records
new theme constants outside the shared palette
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/living-reality-renderer-convergence.test.ts
```

Expected: FAIL because the current scene renders node/edge primitives inline.

- [ ] **Step 3: Extract `RealityNode`**

Move only node mesh/material rendering into the focused component. Inputs are projection-safe presentation values and position. Preserve existing appearance and attention semantics.

- [ ] **Step 4: Extract `RealityEdge`**

Move only edge line rendering into the focused component. Do not add decorative edges or continuous animation.

- [ ] **Step 5: Refactor `LivingRealityScene` to compose the extracted units**

Keep canonical node-position calculation and environment/lights in the canonical scene for this tranche. No new renderer architecture.

- [ ] **Step 6: Run GREEN**

```bash
npx vitest run tests/living-reality-renderer-convergence.test.ts tests/living-reality-projection.test.ts tests/living-reality-degraded-states.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/living-reality/scene src/components/living-reality/living-reality-scene.tsx tests/living-reality-renderer-convergence.test.ts
git commit -m "refactor(p01): converge living reality renderer primitives"
```

---

### Task 5: Exact-head verification and #534 retirement evidence

**Files:**
- Modify only if evidence needs recording: `docs/superpowers/specs/2026-09-05-klinikos-living-reality-convergence-design.md`
- No product behavior changes in this task.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: exact-head evidence proving the harvested primitives operate inside one canonical P01 spine.

- [ ] **Step 1: Run targeted tests**

```bash
npx vitest run tests/living-reality-client-intent.test.ts tests/living-reality-camera-contract.test.ts tests/living-reality-camera-director.test.ts tests/living-reality-renderer-convergence.test.ts
```

- [ ] **Step 2: Run repository gates**

```bash
npm run governance:traceability
npm run security:check
npm run db:generate
npm run db:validate
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
git diff --check
```

- [ ] **Step 3: Push candidate and require exact-head GitHub Quality**

Require both:

```text
Quality / verify = success
Quality / deploy-contract = success
```

including WebGL-disabled Precision, reduced motion, 390x844 mobile, 200% zoom, confidentiality, and release evidence.

- [ ] **Step 4: Review against the approved convergence spec**

Confirm:

```text
one RealityProjection
one Canvas/runtime
one camera grammar
one presentation-intent grammar
no new authority
no new PHI disclosure
no new material authority
no permanent animation loop
```

- [ ] **Step 5: Mark PR #534 HARVESTED_AND_CLOSE only after equivalent behavior is verified on the canonical branch**

Do not close #534 before the replacement evidence exists.
