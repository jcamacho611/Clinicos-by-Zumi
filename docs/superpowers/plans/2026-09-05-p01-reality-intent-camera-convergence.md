# P01 Reality Intent + Camera Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest the strongest non-authoritative interaction and camera primitives from the prior P01 lineage into the already-merged P01/P16 Living Reality spine without creating a second projection, runtime, disclosure boundary, or material authority.

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
- This fresh branch starts from current `main` after the organized execution-index merge and replaces the obsolete stacked PR lineage without deleting prior source/provenance work.

---

### Task 1: Presentation-only RealityClientIntent contract

**Files:**
- Create: `src/lib/living-reality/reality-client-intent.ts`
- Create: `tests/living-reality-client-intent.test.ts`

**Interfaces:**
- Consumes: `CanonicalPlaneId` from `src/lib/ecosystem/canonical-ecosystem-graph.ts`.
- Produces: `RealityClientIntent` union for UI/renderer presentation requests only.

- [x] **Step 1: Preserve the previously verified failing contract test lineage**
- [x] **Step 2: Preserve RED evidence from the previous exact-head branch**
- [x] **Step 3: Port the minimal union to current main**
- [ ] **Step 4: Re-verify GREEN on this exact current-main lineage**

---

### Task 2: Expand the canonical camera-intent vocabulary only

**Files:**
- Modify: `src/lib/living-reality/reality-projection.ts`
- Create: `tests/living-reality-camera-contract.test.ts`

Require exactly the canonical camera intents:

`ARRIVAL · FOCUS_OBJECT · SHOW_RELATIONSHIPS · INSPECT · MISSION · OUTCOME · NETWORK_OVERVIEW · TIME_COMPARE · PRECISION_LOCK`

The test must also assert there is still exactly one exported `RealityProjection` type in `src/lib/living-reality/`.

- [x] Previous RED/GREEN evidence exists on the superseded lineage.
- [x] Port only `TIME_COMPARE` and `PRECISION_LOCK` to current main.
- [ ] Re-verify exact-head GREEN on the fresh lineage.

---

### Task 3: Dedicated CameraDirector with bounded demand-rendered transitions

**Files:**
- Create: `src/components/living-reality/scene/camera-director.tsx`
- Modify: `src/components/living-reality/living-reality-canvas.tsx`
- Create: `tests/living-reality-camera-director.test.ts`

The director must read projection camera intent, respect reduced motion, keep `frameloop="demand"`, invalidate only during a finite transition, never navigate/fetch/mutate domain state, and settle.

Representative presentation presets:

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

These are presentation configuration, not business semantics.

- [ ] Write RED contract test first.
- [ ] Verify RED is caused by missing director/wiring.
- [ ] Implement minimal bounded director.
- [ ] Verify targeted GREEN.

---

### Task 4: Renderer decomposition without a second runtime

**Files:**
- Create: `src/components/living-reality/scene/reality-node.tsx`
- Create: `src/components/living-reality/scene/reality-edge.tsx`
- Modify: `src/components/living-reality/living-reality-scene.tsx`
- Create: `tests/living-reality-renderer-convergence.test.ts`

Extract only projection-safe node/edge rendering. Keep canonical layout, lighting, environment and positions in the existing scene. Prohibit second Canvas, second RealityProjection, mutation handlers, raw domain records and new theme constants.

- [ ] Write RED convergence test first.
- [ ] Verify RED.
- [ ] Extract minimal node/edge renderers.
- [ ] Verify targeted GREEN.

---

### Task 5: Exact-head verification and prior-lineage retirement evidence

Run targeted tests, governance/security, Prisma generate/validate, typecheck, lint, full tests, MVP journeys, production build, diff check, exact-head GitHub Quality `verify` + `deploy-contract`, browser degradation/mobile/reduced-motion/200% zoom, review, and fresh-main concurrency check.

Only after equivalent behavior is verified on the canonical branch may the stale P01 PR be marked `PORT_AND_CLOSE` or `HARVESTED_AND_CLOSE`.
