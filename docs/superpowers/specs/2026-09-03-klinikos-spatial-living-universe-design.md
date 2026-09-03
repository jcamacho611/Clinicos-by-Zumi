# Klinikos Spatial Living Universe — Approved Design

**Date:** 2026-09-03  
**Status:** APPROVED FOUNDER DESIGN — subordinate implementation design  
**Authority:** `docs/KLINIKOS_MASTER_CANON.md` → `docs/KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` + `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md` → this design → current verified implementation truth  
**Related design:** `docs/superpowers/specs/2026-08-31-klinikos-living-universe-entry-grid-design.md`

## 1. Decision

Klinikos will implement the **Spatial Living Universe** using a DOM-first, selectively-3D architecture.

The approved rule is:

> **HTML/React remains the precision interface. CSS depth and Framer Motion provide the universal spatial language. True WebGL/3D is introduced only where spatial relationships materially improve understanding. 3D is never required to use Klinikos. Zumi increasingly materializes governed interface instead of merely returning prose. Proprietary reasoning remains server-side.**

This design does not create a sixth plane, another shell, another Grid, another Zumi, another theme system, another identity system, or another business authority.

It extends the already-approved Black Label depth model:

`ENVIRONMENT → WORKSPACE → OBJECT STAGE → INSPECTOR → CRITICAL DECISION`

and preserves exactly five top-level ecosystem planes.

## 2. Product objective

The experience should feel spatial because depth communicates relationship, attention, consequence, and continuity — not because the product is trying to look futuristic.

Klinikos should increasingly feel like one living healthcare environment in which the current object moves into focus while context organizes itself around it.

Users still have real routes, browser history, links, forms, tables, lists, dialogs, sheets, keyboard navigation, and server-owned state. Spatial behavior is the presentation layer over those durable web primitives.

Permanent human questions remain:

- What matters now?
- What changed?
- What is unresolved?
- What can I do?
- What happens next?

## 3. Rendering architecture

### 3.1 Layer A — semantic DOM authority

All consequential controls and information remain semantic HTML/React:

- links;
- buttons;
- forms;
- tables;
- lists;
- headings;
- dialogs/sheets;
- Object Stage;
- Inspector;
- Action Dock;
- Current Visit;
- claims/billing work;
- EDU workflows;
- Grid transaction controls.

DOM order remains the accessibility and keyboard-navigation order. Visual transforms must never be used to create a different logical order.

### 3.2 Layer B — spatial composition

Use existing React/CSS/Framer Motion capabilities for:

- perspective;
- depth separation;
- controlled `translate3d`/scale/opacity;
- focus transitions between Environment, Workspace, Object Stage, Inspector, and Critical Decision;
- subtle parallax where it does not interfere with reading;
- Living Edge attention treatment;
- context-field compression/expansion;
- narrative transitions such as `BEFORE → NOW → NEXT`.

This is the default spatial architecture.

The first production spatial wave must add **no Three.js, React Three Fiber, Babylon.js, custom shader runtime, continuous particle engine, scroll-jacking camera, or mandatory canvas navigation**.

### 3.3 Layer C — selective true 3D

True WebGL may be introduced later only for a bounded visualization where 3D or GPU rendering provides measurable information advantage.

Candidate future surfaces include:

- Grid relationship/capacity constellations;
- organization/network topology;
- multi-party resource composition;
- geographic/network exploration where a 3D scene adds real comprehension;
- career/competency graph exploration;
- enterprise topology or system X-ray.

True 3D is **not** a default implementation technique for:

- Current Visit;
- dense clinical documentation;
- billing/claims;
- forms;
- scheduling grids;
- patient task flows;
- ordinary EDU reading;
- ordinary Grid list/map actions.

## 4. WebGL admission gate

A true-3D dependency may enter production only when all of the following are documented and verified:

1. the same task is materially harder to understand in the DOM/map/list presentation;
2. a non-WebGL equivalent remains complete and actionable;
3. the visualization is lazy-loaded and route/surface bounded;
4. no authority, ranking, eligibility, pricing, clinical, security, or payment decision exists only in the client visualization;
5. the browser receives only minimum-necessary server-projected data;
6. low-power/reduced-motion/unsupported-device behavior is defined;
7. keyboard and screen-reader users retain equivalent information and actions;
8. memory, main-thread, loading, mobile, and battery budgets are measured;
9. the visualization does not become a route/navigation authority;
10. production browser QA demonstrates measurable user value rather than novelty.

Until this gate is satisfied, DOM-first spatial composition wins.

## 5. Spatial depth model

Klinikos uses five presentation depths, which are **not ecosystem planes**:

### Environment

The broad atmosphere and surrounding operating context. It establishes location in Klinikos but should rarely demand attention.

### Workspace

The active operational field: Clinic, Money, Network/Grid, Learn/EDU, patient, company, or another governed projection.

### Object Stage

The consequential current object: Person, Patient, Encounter, Claim, Result, Referral, Grid Demand, Grid Resource, Grid Match, Transaction, Professional, Student, Organization, Task, Order, Case, or another Canon-governed object.

### Inspector

Evidence, relationships, authority, provenance, details, and relevant adjacent state.

### Critical Decision

The minimum surface needed to approve, sign, commit, publish, pay, submit, send, close, or perform another consequential action. The server revalidates authority before execution.

Depth is presentation only. It never grants authority.

## 6. Camera metaphor without camera authority

The user may experience Klinikos as moving between four practical views:

- **Wide** — what is happening?
- **Medium** — what is happening around this?
- **Close** — what matters about this object?
- **Precision** — what exactly must I do?

The implementation must not replace URLs, browser history, deep links, focus management, or conventional navigation with an opaque camera state machine.

A route change remains a route change. A modal/sheet remains a semantic modal/sheet. Spatial transition may explain continuity between them.

## 7. Domain expression

### Living Home

Most spatial/cinematic of the everyday surfaces. It may recompose around the active object, high-priority work, and Zumi materialization.

### Clinic / Current Visit

Spatial behavior communicates context and evidence continuity. The actual clinical workspace remains surgical, readable, fast, and primarily DOM-based.

### Money / Billing

Spatial behavior is restrained. Use depth to distinguish expected/actual/gap, exception → evidence → correction → settlement, and object inspection without degrading numeric scanning.

### Grid / Network

The strongest candidate for deeper spatial behavior. Native map/list/ledger remains authoritative for consequential discovery and action. A future 3D relationship field may supplement it after the WebGL admission gate.

### EDU / Learn

Use depth for progression, simulation context, evidence, competency, and opportunity. Long-form reading remains editorial DOM content.

### Patient

Warm, low-cognitive-load, next-step-first. Spatial behavior must never make care navigation harder.

## 8. Zumi — intelligence becomes interface

Zumi should increasingly select or materialize the best governed presentation for an authorized answer.

Examples:

- revenue question → expected/actual/gap narrative + exception objects;
- patient change question → initial/previous/today narrative + evidence;
- Grid need → need/requirements/eligible/available/action field;
- education question → current competency/evidence/next step;
- claim problem → blocked reason/evidence/corrective action.

Zumi does not receive permission to invent client-side policy or expose hidden reasoning.

The server remains authoritative for:

- identity/context;
- authorization;
- clinical truth;
- Grid eligibility;
- ranking rules;
- credential truth;
- payment/settlement truth;
- pricing/entitlement;
- risk/security logic;
- proprietary orchestration;
- hidden prompts;
- confidential margins and strategy.

Permanent boundary:

`USER INTENT → SERVER CONTEXT / AUTHORITY / POLICY / ZUMI → MINIMUM-NECESSARY PRESENTATION PROJECTION → SPATIAL EXPERIENCE → USER ACTION → SERVER REVALIDATION → EXECUTION / AUDIT`

## 9. Theme/material law

There is one appearance system:

- System/Auto;
- Marble = light;
- Obsidian = dark.

No spatial theme provider, Grid theme, 3D theme, Luxury theme, or second material stack may be introduced.

Spatial implementation must use semantic design tokens. New spatial files must not hardcode a second palette.

Spatial semantics should include reusable tokens for:

- perspective;
- environment/workspace/stage/inspector/decision depth;
- Living Edge;
- elevation/shadow;
- focus transition duration/easing;
- context opacity;
- spatial surface border/line treatment.

Both Marble and Obsidian must resolve those semantics.

## 10. Motion law

Motion explains causality and continuity. It is never decorative background activity for its own sake.

Allowed:

- selected object advancing toward Object Stage;
- Inspector entering as the object is inspected;
- context receding slightly when a critical decision needs focus;
- lens transitions that preserve the same object;
- narrative progression;
- restrained Living Edge attention.

Disallowed by default:

- continuous particles;
- perpetual floating cards;
- automatic camera orbit;
- scroll-jacking;
- motion that moves an interactive target while a user is trying to activate it;
- fake processing animations;
- motion that obscures error/blocked states.

`prefers-reduced-motion: reduce` must collapse spatial movement to near-instant state changes while preserving hierarchy, information, and action.

## 11. Responsive and capability fallback

Spatial depth is progressive enhancement.

### Desktop

May use full perspective/depth relationships where comprehension improves.

### Tablet

Reduce simultaneous depth and maintain touch target clarity.

### Mobile

Stage first. Context becomes drawers/sheets or progressive disclosure. No required WebGL. No hover dependency.

### Low-power / unsupported / assistive context

The complete task remains possible using semantic DOM, conventional layout, list/map alternatives, and equivalent controls.

3D is never an access gate.

## 12. Performance law

The first spatial wave must remain inside the existing application stack and should be compositor-friendly.

First-wave requirements:

- no new runtime 3D dependency;
- no continuous `requestAnimationFrame` loop;
- no mandatory canvas;
- no large spatial asset payload;
- no duplicated rose/brand asset system;
- no animation that blocks interaction or route readiness;
- existing production build/start contract remains unchanged.

Any later WebGL tranche must publish its measured bundle, CPU/main-thread, memory, mobile, and loading impact before merge.

## 13. Accessibility law

Spatial appearance never changes semantic meaning or access.

Required:

- DOM/focus order remains logical;
- all consequential actions remain keyboard reachable;
- focus indicators are never transformed offscreen or obscured;
- 44px consequential touch-target floor remains respected;
- 200% zoom preserves access to information/action;
- screen-reader output does not depend on visual depth;
- reduced-motion mode preserves content hierarchy;
- mobile Inspector/sheets preserve evidence and authority content rather than deleting it.

## 14. Confidentiality law

Assume the browser is inspectable.

Spatial projections must obey `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

Never ship hidden reasoning, proprietary ranking weights, confidential Zumi prompts, internal policy graphs, anti-gaming logic, security heuristics, internal pricing/margin logic, raw ORM objects, unnecessary PHI/PII, or unreleased strategy merely because a visualization needs data.

DTO/projection shape is the disclosure boundary.

## 15. First production spatial tranche — S1

The first implementation tranche is deliberately small and independently mergeable.

### S1 objective

Make the existing person-level Living Universe feel spatial and material-aware **without changing product authority, adding WebGL, or rewriting routes**.

### S1 scope

1. add shared spatial semantic tokens to the current design-token authority;
2. add a Living Universe spatial stylesheet/component boundary using CSS perspective and compositor transforms;
3. convert the existing `UniverseShell`, `ObjectStage`, `PlaneLens`, `Inspector`, and `ActionDock` to semantic material tokens in the touched areas rather than adding new hardcoded Obsidian values;
4. establish data attributes/contracts for Environment, Workspace, Object Stage, Inspector, and Critical Decision/Action Dock depth;
5. preserve the same Person object and five plane lenses;
6. make lens/object focus changes feel spatial without creating new authority or route state;
7. collapse transforms under reduced motion;
8. preserve the existing mobile Inspector and allowed-action filtering;
9. add structural tests proving no WebGL/canvas dependency and preserving current authorization boundaries.

### S1 non-goals

- no Three.js / React Three Fiber;
- no Grid 3D constellation;
- no Current Visit redesign;
- no Zumi backend rewrite;
- no new server business logic;
- no new route system;
- no new theme provider;
- no fake activity/data;
- no branch-wide color cleanup outside the touched Living Universe surface.

## 16. S1 acceptance criteria

S1 is complete only when:

1. the same `MemberHomeProjection` remains the data contract or changes only add presentation-safe fields;
2. five-plane behavior still passes existing tests;
3. member-action route filtering still rejects unsafe destinations;
4. no new package dependency for true 3D exists;
5. no canvas or continuous animation loop is required;
6. reduced-motion removes depth movement while retaining content;
7. Marble and Obsidian both resolve the touched surface through shared semantic tokens;
8. no new hex palette is introduced in touched Living Universe components;
9. keyboard/mobile Inspector behavior remains intact;
10. confidentiality/security gates remain green;
11. typecheck, lint, tests, PostgreSQL MVP journey verification, production build/start, browser interaction QA, and frontend release evidence follow the repository Quality contract;
12. customer-visible claims remain bounded to what runtime evidence proves.

## 17. Later tranches

### S2 — Object/context choreography

Add reusable spatial transition primitives for object selection, context recession, Inspector focus, and critical-decision focus across approved surfaces.

### S3 — Zumi interface materialization

Introduce typed presentation recipes selected server-side so Zumi can return governed workspace compositions instead of chat-only prose where authorized structured truth exists.

### S4 — Grid spatial relationship field

Build a non-WebGL relationship field first, synchronized with existing map/list/ledger and eligibility truth.

### S5 — WebGL evaluation

Run the WebGL admission gate against a bounded Grid/network use case. Add a GPU-rendered view only if testing demonstrates clear comprehension value and the non-WebGL equivalent remains complete.

### S6 — Native desktop expression

A future macOS client may use the same server APIs, authority model, identity, Zumi, Grid, and presentation contracts. It must not create a second backend or second business truth.

## 18. North star

The target is not “a 3D healthcare app.”

The target is:

> **A healthcare operating environment where the interface continuously reveals the right object, context, evidence, and next safe action with enough spatial depth to make complexity understandable — while the machinery, authority, and proprietary intelligence remain safely underneath.**
