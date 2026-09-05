# P01 — Living Reality Runtime / Black Label / True 3D — Design

**Date:** 2026-09-03  
**Status:** FOUNDER-DIRECTED W1 SUBORDINATE DESIGN — review gate before implementation  
**Base audited:** `main@e8f79a5e2419cc24b54f08aba9c44522c9a94784`  
**Authority:** subordinate to `docs/KLINIKOS_MASTER_CANON.md`, the Master Engineering Blueprint, the merged Master Execution Engine, and current verified implementation truth.  
**Program:** `P01` / `W1`  
**Depends on:** merged `P00`  
**Parallel gate:** `P16` Security / Privacy / Legal / IP / Production PHI Gate

## 1. Founder decision

Klinikos will ship a **real, premium, GPU-backed Living Reality runtime** rather than stopping at a flat dashboard with cosmetic depth.

The target is not a decorative 3D website. It is one living healthcare environment in which people, organizations, work, capacity, evidence, time, and governed next actions can be understood spatially while durable application truth remains server-owned.

Permanent law:

> **3D projects truth. 3D never owns truth.**

The implementation must feel materially more ambitious than the current presentation layer while preserving the semantic application beneath it.

## 2. Reconciliation with PR #524

PR #524 contains valuable safety architecture and is **partially superseded**, not discarded.

Preserve from #524:

- semantic HTML/React remains the precision and accessibility authority;
- routes, URLs, browser history, deep links, focus, forms, tables, sheets, dialogs, and ordinary web interaction remain real;
- five presentation depths remain useful: `ENVIRONMENT → WORKSPACE → OBJECT STAGE → INSPECTOR → CRITICAL DECISION`;
- one System/Marble/Obsidian material system;
- minimum-necessary server projections;
- server ownership of identity, authorization, clinical truth, Grid eligibility, payment/settlement, pricing/entitlement, risk/security, and proprietary orchestration;
- reduced motion, keyboard, screen reader, mobile, and 200% zoom are release requirements;
- true 3D cannot become route authority or business authority.

Supersede from #524:

- the first-tranche blanket prohibition on `three`, React Three Fiber, canvas, or a GPU render loop;
- the assumption that true WebGL must wait until a later wave;
- the framing that DOM/CSS-only spatial composition is sufficient for the founder-approved final experience.

P01 therefore absorbs #524's **safety laws** while replacing its **renderer ceiling**.

## 3. Approaches considered

### A. DOM/CSS-only spatial treatment

Lowest engineering risk and bundle cost, but it does not reach the approved experiential standard. It remains useful as the Precision fallback, not as the final flagship renderer.

### B. WebGL-everywhere application shell

Maximum spectacle but wrong architecture. It would make dense clinical/financial work harder, increase accessibility and mobile risk, turn canvas into an accidental application shell, and pressure the browser to receive more data than necessary.

### C. Hybrid Living Reality runtime — selected

A true 3D scene is a **projection layer** synchronized with a semantic React precision twin. The user can experience the product as one spatial world on capable devices, while every essential outcome remains accessible without WebGL.

This is the selected architecture because it maximizes presentation quality without creating a second product, second backend, second navigation model, or second authority system.

## 4. Existing kernels to preserve

Current main already contains the semantic Living Universe foundation:

- `src/components/living-universe/universe-shell.tsx`
- `src/components/living-universe/object-stage.tsx`
- `src/components/living-universe/plane-lens.tsx`
- `src/components/living-universe/inspector.tsx`
- `src/components/living-universe/action-dock.tsx`
- `src/app/member/page.tsx`
- `tests/living-universe-member-home.test.ts`
- current public Living Universe / public intent surfaces
- current Marble/Obsidian design token authority
- current frontend confidentiality gates and exact-head browser evidence workflow.

P01 **extends these kernels**. It does not replace them with `UniverseV2`, a new router, a new auth shell, or a separate canvas-only app.

## 5. Target architecture

P01 introduces one bounded rendering subsystem:

`SERVER TRUTH → RealityProjection → LivingRealityRuntime → Spatial Scene + Precision Twin → governed user action → SERVER REVALIDATION`

### 5.1 `RealityProjection`

A server-owned, presentation-safe view model. It contains only what the current experience is authorized to display.

Representative shape:

```ts
export type RealityProjection = {
  realityId: string;
  contextId: string;
  title: string;
  modeHint: "FULL_REALITY" | "BALANCED_REALITY" | "PRECISION_MODE";
  activeObject: SpatialNodeProjection | null;
  nodes: SpatialNodeProjection[];
  edges: SpatialEdgeProjection[];
  attention: AttentionProjection[];
  cameraIntent: CameraIntent | null;
  precisionActions: PrecisionActionProjection[];
};
```

This is a projection contract, not a domain model. It must never become a duplicate source of truth.

### 5.2 `SpatialNodeProjection`

Presentation-safe node representing an already-governed object. It may carry safe identity such as object type, display label, visual state, minimum-necessary status, and a server-generated interaction token or route reference.

It must not carry raw ORM objects, hidden eligibility data, confidential ranking weights, private prompts, internal risk scores, secret pricing logic, or unnecessary PHI.

### 5.3 `SpatialEdgeProjection`

Describes a permitted visible relationship. Hidden/private relationships remain absent rather than merely invisible in the scene.

### 5.4 `AttentionProjection`

Represents **what deserves visual attention**, not why proprietary policy decided it. The browser receives the outcome and safe explanation, never the private mechanism.

### 5.5 `CameraIntent`

A presentation hint such as `ARRIVAL`, `FOCUS_OBJECT`, `SHOW_RELATIONSHIPS`, `INSPECT`, `MISSION`, `OUTCOME`, or `NETWORK_OVERVIEW`. It cannot grant access or perform navigation by itself.

## 6. Rendering stack

P01 may add **Three.js + React Three Fiber** as the true-3D implementation substrate after compatibility is confirmed against the repository's current React/Next versions during the implementation plan.

Preferred implementation characteristics:

- React Three Fiber for React lifecycle integration;
- Three.js as the rendering engine;
- optional small helper utilities only when they eliminate meaningful custom code;
- no paid 3D SaaS dependency required for core runtime;
- no Unity/Unreal/WebAssembly game-engine shell;
- no proprietary hosted scene editor dependency;
- no external 3D asset marketplace dependency for the first production tranche.

The first tranche should favor **procedural geometry, typography, lines, points, depth, lighting, material tokens, and simple reusable primitives**. This keeps cost near zero, protects IP, reduces payload, and lets Klinikos develop a recognizable visual language rather than looking like a template marketplace.

## 7. One runtime, three performance modes

### `FULL_REALITY`

For capable desktop/tablet hardware when WebGL is healthy. Enables the full approved spatial scene, relationship field, depth choreography, selective particles/ambient motion, richer lighting, and camera transitions.

### `BALANCED_REALITY`

Same information architecture with reduced node count, simplified materials, lower pixel ratio, reduced post-processing, lighter animation, and bounded scene complexity.

### `PRECISION_MODE`

Semantic DOM-first experience with no essential canvas dependency. It is not a degraded apology; it is the focused mode for accessibility, low-power devices, dense work, unsupported WebGL, reduced motion, or user preference.

Mode selection is a **performance/accessibility decision**, never a pricing or authority decision.

Users must be able to switch to Precision Mode. `prefers-reduced-motion` must reduce or eliminate nonessential camera and object movement, and may bias the runtime toward Balanced/Precision behavior.

## 8. Progressive boot architecture

The page must not wait for 3D to become useful.

Target boot sequence:

1. server renders semantic arrival/primary action;
2. core page becomes interactive;
3. client capability check decides whether to initialize a 3D mode;
4. 3D runtime is lazy-loaded;
5. scene hydrates from the same safe `RealityProjection`;
6. if initialization fails, Precision Mode remains fully usable with no user-data loss.

The canvas is therefore an enhancement to a functioning application, not the prerequisite for entering Klinikos.

## 9. Spatial grammar

P01 implements the already-approved universal frames:

- `F0 Arrival`
- `F1 Intent`
- `F2 Interpretation`
- `F3 Active Object`
- `F4 Relationships`
- `F5 Inspector`
- `F6 Mission / Precision Workspace`
- `F7 Governed Action`
- `F8 Verified Outcome`
- `F9 Next Action`
- `F10 Time / Change`
- `F11 Regional / Network Spatial`

A Reality selects the frames it needs. It does not invent another product shell.

### Spatial behavior

- arrival establishes the world and current context;
- intent causes irrelevant objects/context to recede;
- the active object advances into focal depth;
- eligible/visible relationships materialize around it;
- inspector/evidence surfaces appear when requested;
- dense work transitions into a precision workspace rather than forcing forms into 3D;
- consequential actions surface only when server truth says they are available;
- verified outcomes alter the projected world after server confirmation;
- unresolved next action receives governed attention.

## 10. First production surfaces

### 10.1 Public Living Home

The most cinematic acquisition surface. It should demonstrate that Klinikos is a living healthcare network without fabricating network density or private data.

Public scene content must be synthetic, aggregate, public-safe, or explicitly authorized. No patient PHI belongs in the anonymous scene.

### 10.2 Member Living Home

The first authenticated full Reality. Reuse current `UniverseShell / ObjectStage / PlaneLens / Inspector / ActionDock` semantics and place the 3D scene behind/alongside them as the spatial projection.

The Person remains the same Person object. Switching contexts/lenses changes the projection, not identity.

### 10.3 Grid / Network spatial foundation

P01 may establish reusable node/edge primitives and a bounded safe network demo, but **Grid eligibility, ranking, transaction, and private supply logic belong to P09**. P01 supplies the renderer, not a second Grid.

### 10.4 Mission Rooms / Texas Twin foundation

P01 may establish reusable spatial container primitives. Actual Company Command/Texas business truth belongs to later programs.

## 11. Dense clinical and financial work

True 3D is available to establish context and relationships, but the following remain precision-first once work becomes dense:

- Current Visit documentation;
- medication/allergy review;
- orders/results review;
- coding and claim detail;
- billing tables;
- forms and signatures;
- scheduling grids;
- legal acceptance;
- settings/admin forms.

P01's success is not measured by putting every pixel in WebGL. It is measured by making the entire product feel like one coherent reality while preserving speed and accuracy where precision matters.

## 12. Interaction and authority boundary

The scene may emit only **intent** such as:

- focus object;
- inspect object;
- open safe route;
- request action panel;
- change presentation lens;
- ask Zumi about a visible object.

Consequential action path remains:

`SCENE/DOM INTENT → SERVER CONTEXT → AUTHORITY/POLICY → CURRENT DATA → ACTION PREVIEW → HUMAN CONFIRMATION WHERE REQUIRED → SERVER EXECUTION → AUDIT/EVIDENCE → NEW PROJECTION`

No client raycast, camera state, local flag, hidden mesh, animation state, payment state, or AI response can establish authorization.

## 13. Confidentiality and PHI

Assume the browser, canvas buffers, network payloads, bundle, devtools, local storage, screenshots, and scene graph are inspectable.

P01 therefore requires:

- minimum-necessary DTOs;
- no hidden/private nodes sent merely to simplify client filtering;
- no proprietary ranking/eligibility weights;
- no raw policy graph;
- no hidden prompts/reasoning;
- no confidential margin/pricing algorithms;
- no unnecessary PHI in geometry labels, texture assets, logs, telemetry, analytics, or browser storage;
- private/no-store handling where user-specific data is projected;
- P16 approval before any production claim involving PHI-bearing spatial projections.

## 14. Visual/material system

One material authority remains:

- System/Auto
- Marble/light
- Obsidian/dark

P01 extends semantic design tokens for 3D equivalents such as environment background, fog, surface, line, relationship, attention, selected object, evidence, blocked state, success state, and Living Edge.

The WebGL runtime must consume resolved semantic material values. It may not hardcode an independent rose/black/white palette or create a second theme provider.

## 15. Motion and cinematic direction

The founder-approved experience may be visually dramatic. Motion is permitted when it communicates state, relationship, focus, scale, or continuity.

Allowed examples:

- world arrival/reveal;
- controlled camera travel;
- relationship formation;
- focus gravity around the active object;
- restrained ambient particles/fields;
- network pulse based on **real or explicitly synthetic/demo** state;
- time-lens transitions;
- verified completion causing the scene to settle/reconfigure.

Forbidden:

- fake processing;
- fake activity/network density;
- motion that obscures blocked/error states;
- perpetual movement that prevents reading/selection;
- moving consequential controls away from a user's pointer/focus;
- animation whose only purpose is to delay interaction.

## 16. Performance contract

The P01 implementation plan must establish measurable budgets and automatically degrade the renderer rather than allowing GPU spectacle to break the product.

Minimum design requirements:

- semantic primary content must render without waiting for Three.js;
- 3D bundle must be split from critical application boot;
- dynamic resolution/pixel ratio cap;
- bounded node/edge counts per scene tier;
- no unbounded texture/geometry growth;
- no per-frame React state churn;
- render loop may pause or reduce work when scene is idle/hidden;
- visibility changes and tab backgrounding reduce GPU work;
- unsupported WebGL falls through to Precision Mode;
- sustained poor frame performance triggers Balanced/Precision downgrade rather than a broken experience;
- memory/context-loss recovery path is defined.

Implementation testing must capture bundle impact, startup timing, interaction readiness, representative frame behavior, and mobile behavior before merge.

## 17. Accessibility contract

Every essential visible concept/action in the scene has an equivalent semantic representation.

Required:

- logical DOM/focus order;
- keyboard operation of all consequential actions;
- screen-reader labels for active object, relationships, status, evidence, and available action;
- 200% zoom remains usable;
- 390px mobile has a meaningful complete task;
- reduced motion preserves state transitions without disorienting camera movement;
- no information communicated by color/depth/motion alone;
- no hover-only essential action;
- canvas failure never traps the user.

## 18. Error/degraded states

P01 must have designed states for:

- WebGL unavailable;
- context lost;
- GPU performance too low;
- Reality projection unavailable;
- partial projection;
- no results / empty network;
- blocked/unauthorized action;
- server timeout;
- offline/degraded connection where applicable;
- reduced-motion mode;
- Precision Mode user override.

The UI states what happened and what remains possible. It never pretends the world is populated when real data is empty.

## 19. Testing strategy

P01 is not complete until the implementation plan covers:

- RED contract before runtime code;
- existing Living Universe member tests remain green;
- projection minimization tests;
- scene-to-DOM equivalence tests;
- no-WebGL fallback;
- WebGL initialization failure;
- context-loss recovery;
- FULL → BALANCED → PRECISION transitions;
- reduced motion;
- keyboard and screen reader behavior;
- 200% zoom;
- 390px mobile meaningful task;
- Marble + Obsidian visual evidence;
- confidentiality/browser disclosure gates;
- production build/start;
- exact-head browser screenshots/evidence;
- performance/bundle evidence;
- no authority widening.

## 20. Cost discipline

P01 should be visually expensive and economically lean.

Default cost strategy:

- open-source rendering libraries;
- procedural scene language before purchased assets;
- no 3D SaaS required to serve each user;
- reuse current app/backend/identity/projection infrastructure;
- lazy-load GPU code;
- no separate game backend;
- no second design system;
- no duplicated data store.

Spend is justified only where it materially improves conversion, product comprehension, enterprise presentation, or workflow comprehension.

## 21. Commercial consequence

P01 is not a standalone 3D SKU. Its direct business value is:

- materially stronger first impression and demo power;
- higher public intent completion and signup conversion;
- stronger investor/enterprise perceived product quality;
- clearer network/relationship comprehension;
- a reusable spatial runtime for Grid, EDU, Company Command, Texas Twin, and selected EHR context.

The moat remains the governed network/data/workflow system underneath, not a shader.

## 22. Definition of done for the P01 design

This design is ready for implementation planning when:

- true 3D is explicitly admitted in W1;
- #524 safety laws are preserved and its renderer ceiling is explicitly superseded;
- existing semantic kernels are reused;
- no second product/backend/authority/router/theme is created;
- projection and confidentiality boundaries are explicit;
- performance modes/fallback are explicit;
- dense EHR/financial work remains precision-capable;
- test and release evidence requirements are explicit;
- P16 remains a parallel production gate.

## 23. North star

> **Klinikos should look and feel like the living operating reality its architecture already describes: cinematic when orientation and relationships matter, surgical when precision matters, and always governed by one underlying truth.**
