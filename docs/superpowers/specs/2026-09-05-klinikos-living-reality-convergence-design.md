# Klinikos Living Reality — Spatial Convergence Design

**Status:** APPROVED-DIRECTION DESIGN SPEC

**Authority:** subordinate to `docs/KLINIKOS_MASTER_CANON.md` and the merged P01/P16 runtime on `main` at merge commit `6c399ae14084f4801c97fd62fc420a1c409d3fac`.

## 1. Decision

Klinikos will have **one spatial/runtime vocabulary**.

The merged P01/P16 implementation from PR #531 is the canonical integration spine because it is the only current implementation that has proven the full exact-head release contract across security, traceability, fresh migrations, typecheck, lint, complete tests, PostgreSQL journeys, production build/start, browser interaction, WebGL-disabled Precision Mode, reduced motion, mobile recomposition, 200% page zoom, and release-evidence capture.

Other open spatial/theme PRs are convergence sources, not independent merge authorities:

- **PR #534**: harvest `RealityClientIntent`, dedicated `CameraDirector`, renderer decomposition (`RealityNode`, `RealityEdge`), and stronger renderer/material tests. Do not merge its parallel runtime or duplicate `RealityProjection`.
- **PR #504**: harvest shared plane language, server-side public ecosystem disclosure projection, deterministic layout ideas, public `/ecosystem/universe` route, and truthful INTENT vs IMPLEMENTATION labeling. Do not keep a separate `src/components/universe/` spatial system.
- **PR #505**: harvest semantic authenticated-shell material tokens and remove hard-coded Obsidian literals. Reality tokens must derive from the same Obsidian/Marble authority.
- **PR #524**: historical/superseded. Preserve DOM/accessibility/server-authority laws; the no-Three/R3F restriction is not current doctrine.

## 2. Permanent Laws

1. One Klinikos.
2. One Person identity.
3. One governed graph.
4. One Zumi.
5. One server authority model.
6. One `RealityProjection` contract.
7. One runtime-mode authority.
8. One material authority with Obsidian and Marble.
9. 3D projects truth; it never owns clinical, financial, credential, payment, legal, organization, or security truth.
10. Every essential task must remain completable without WebGL.
11. Production PHI remains blocked until P16 evidence explicitly changes that state.
12. Client presentation intent cannot express consequential authority.
13. The five canonical planes remain constitutional dimensions, not five separate applications or routes.

## 3. Canonical Runtime Stack

```text
SERVER / DOMAIN AUTHORITY
        |
        | explicit-field projection only
        v
RealityProjection
        |
        +----------------------------+
        |                            |
        v                            v
SEMANTIC DOM                    LIVING REALITY
routes/forms/tables             R3F/Three.js
inspectors/action dock          camera/nodes/edges
        |                            |
        +-------------+--------------+
                      |
                      v
            RealityClientIntent
            (presentation only)
                      |
                      v
             server-authorized action
             through existing routes/APIs
```

### 3.1 `RealityProjection`

Canonical location:

`src/lib/living-reality/reality-projection.ts`

It remains a **minimum-necessary browser disclosure DTO**.

It must support the behavior layer without carrying raw member, Patient, Encounter, Organization, Claim, credential, or authority records into WebGL.

The projection may evolve to include safe presentation fields for:

- active object;
- focused object;
- spatial nodes;
- semantic edges;
- attention;
- camera intent;
- time projection;
- Zumi presentation state;
- Mission Room metadata;
- precision actions;
- implementation-state labels where public-safe.

Every added field requires confidentiality review and tests.

### 3.2 `RealityClientIntent`

Port the safety concept from PR #534 into the canonical runtime.

Permitted presentation intents should include only non-authoritative operations such as:

- focus object;
- inspect object;
- open real route;
- change canonical-plane lens;
- request action panel;
- change time view;
- enter/exit Mission Room presentation;
- request relationship view;
- recenter camera.

The union must be structurally incapable of expressing:

- approve;
- sign;
- diagnose;
- prescribe;
- order;
- verify credential;
- authorize organization;
- hire;
- classify worker;
- pay;
- settle;
- submit claim;
- award competency;
- accept legal terms on another party's behalf.

Consequential actions continue through existing governed DOM/routes/server APIs.

## 4. Behavior Layer

P01 tranche 2 is not “more 3D.” It is the semantic behavior engine that makes the environment a Living Reality.

### 4.1 Active Object vs Focused Object

**Active Object** = server/context-governed subject around which the current task is composed.

**Focused Object** = temporary presentation focus chosen by hover, keyboard focus, tap, inspection, or Zumi presentation.

Focus must never silently mutate Active Object or business state.

Transitions:

- distant -> relevant -> focused -> inspected -> activated -> precision workspace -> outcome -> receded.

### 4.2 Camera Grammar

One dedicated camera director owns camera presentation state.

Canonical intents:

- `ARRIVAL`
- `FOCUS_OBJECT`
- `SHOW_RELATIONSHIPS`
- `INSPECT`
- `MISSION`
- `OUTCOME`
- `NETWORK_OVERVIEW`
- `TIME_COMPARE`
- `PRECISION_LOCK`

Rules:

- active-object changes may recenter;
- inspection uses bounded dolly, not uncontrolled orbit;
- network overview pulls back;
- precision work locks/reduces camera motion;
- reduced-motion replaces cinematic travel with immediate or short cross-fade/state transitions;
- camera state is never route or authority state.

### 4.3 Semantic Relationship Grammar

Edges must declare a relationship class rather than render generic decorative lines.

Initial shared taxonomy:

- `care`
- `organization`
- `employment`
- `education`
- `evidence`
- `authority`
- `workflow_dependency`
- `referral`
- `financial`
- `capacity`
- `resource`
- `opportunity`
- `communication`
- `location`
- `lifecycle`

Each class maps to one material/animation grammar in both Obsidian and Marble.

No edge exists solely to make the scene look busy.

### 4.4 Attention Gravity

Attention is server-derived presentation priority, never client inference of clinical or financial risk.

Levels must be explicit and bounded.

Example safe behaviors:

- unresolved item moves closer;
- blocked dependency gains semantic blocked material;
- completed item recedes;
- newly changed item may pulse once, then settle;
- attention must include plain-language reason in DOM/Inspector.

The browser may animate a supplied attention level; it may not independently decide a patient is urgent, a claim is high risk, or a credential is invalid.

### 4.5 Time

Reality supports:

`PAST <- NOW -> FUTURE`

Time states:

- historical evidence;
- current authoritative state;
- scheduled future event;
- explicit projection/scenario.

Projected/scenario states must be visually and textually labeled so they cannot be mistaken for facts.

### 4.6 Zumi Presentation State

Zumi presentation states:

- `DORMANT`
- `LISTENING`
- `UNDERSTANDING`
- `CONNECTING`
- `PREPARING`
- `READY`
- `WATCHING`
- `NEEDS_REVIEW`

These are UX states only and reveal no hidden chain-of-thought.

Zumi may focus, compose, explain, prepare, and surface actions. It does not gain authority through presentation.

### 4.7 Mission Rooms

Mission Rooms are temporary goal-specific projections over canonical objects.

Examples:

- recover unresolved revenue;
- prepare tomorrow's schedule;
- fill two RN shifts;
- complete Current Visit;
- resolve referral leakage;
- complete workforce cohort;
- submit RFP.

Mission Room data contains only the minimum objects, relationships, blockers, owners, deadlines, evidence references, and permitted actions required by the objective.

Closing a Mission Room does not delete canonical objects; it ends the presentation context.

## 5. Precision Workspace Transition

When exact work begins, cinematic presentation must recede.

Examples:

- Current Visit documentation;
- coding review;
- patient demographics;
- consent;
- billing detail;
- claim correction;
- payment/reconciliation;
- contract review;
- credential review.

Required transition:

1. focused/active object remains context;
2. camera settles or locks;
3. scene contrast/motion reduces;
4. semantic DOM workspace becomes dominant;
5. user completes exact task through existing governed controls;
6. server confirms result;
7. RealityProjection refreshes;
8. outcome is shown;
9. completed work recedes;
10. next governed action is surfaced.

## 6. Material Convergence

There are exactly two first-class material identities:

- Obsidian;
- Marble.

`src/app/design-tokens.css` remains the semantic theme authority.

Rules:

- shell tokens derive from semantic design tokens;
- Reality tokens derive from semantic design tokens;
- no independent “3D theme” palette;
- no hard-coded Obsidian values in shared/member Living Reality surfaces except narrowly documented non-theme constants;
- material transitions must preserve readable DOM contrast;
- both themes require browser evidence.

PR #505's shell-token work should be ported/rebased onto current `main`, not merged blindly.

## 7. Public Ecosystem Convergence

`/ecosystem/universe` remains useful as a public educational/discovery Reality.

Its data path should become:

```text
canonicalEcosystemGraph
   -> public minimum-necessary ecosystem adapter
   -> canonical RealityProjection
   -> shared LivingRealityLayer
   -> semantic DOM Inspector/list
```

Preserve from #504:

- one shared plane-language register;
- deterministic representation;
- strip evidence paths and external vendor dependencies from browser DTO;
- show INTENT and IMPLEMENTATION as separate labels;
- public route contains no tenant/member/patient information.

Retire the separate `src/components/universe/` spatial vocabulary once equivalent shared-runtime behavior is verified.

## 8. Member Living Reality Convergence

The existing `src/components/living-universe/` shell remains semantic application UI during convergence.

The target is not to delete it wholesale. Instead:

- move shared plane language to one source;
- remove hard-coded color literals progressively;
- retain Object Stage / Inspector / Action Dock semantics;
- allow the canonical Living Reality layer to project around them;
- gradually move behavior ownership into common projection/interaction contracts;
- preserve real routes and keyboard/focus semantics.

## 9. Play-by-Play Acceptance Contract

Every scenario must be specified and later tested using this frame contract:

1. user-visible composition;
2. spatial objects;
3. semantic DOM;
4. active object;
5. focused object;
6. camera intent;
7. relationships;
8. attention state;
9. time state;
10. Zumi presentation state;
11. permitted user actions;
12. server data read;
13. server mutation permitted;
14. mutations prohibited from automation;
15. success transition;
16. incomplete transition;
17. permission-denied transition;
18. error transition;
19. network-slow transition;
20. WebGL-unavailable behavior;
21. reduced-motion behavior;
22. 390px mobile composition;
23. keyboard/screen-reader behavior;
24. audit/evidence consequence;
25. commercial gate if any;
26. analytics event;
27. KPI.

### Required scenarios

A. healthcare professional looking for work;
B. patient checking what happens next;
C. clinic owner understanding operations;
D. provider completing Current Visit;
E. biller investigating denied claims;
F. staff preparing tomorrow's schedule;
G. organization needing two nurses Friday;
H. student learning AI for healthcare;
I. vendor discovering commercial opportunity;
J. internal Klinikos team preparing an RFP.

These are ten contexts in one Reality grammar, not ten separate UI systems.

## 10. Performance / Degradation

Retain the verified P01 hierarchy:

- `FULL_REALITY`
- `BALANCED_REALITY`
- `PRECISION_MODE`

Minimum rules:

- essential tasks complete in Precision Mode;
- reduced motion caps cinematic movement;
- WebGL loss degrades without losing semantic state;
- DPR remains bounded;
- demand rendering remains default unless a future continuous animation has a measured and approved reason;
- no decorative permanent `requestAnimationFrame` loops;
- mobile is recomposed, not cropped;
- GPU/render telemetry must not receive PHI.

## 11. Security / Privacy

P16 remains parallel authority.

- Production PHI remains `BLOCKED`.
- Every new projection field is explicit-field allowlist data.
- Raw domain objects cannot be spread into RealityProjection.
- Browser confidentiality gate must include Living Reality fixtures.
- spatial coordinates, edge presence, labels, analytics, screenshots, cache, GPU buffers, logs, and error messages are disclosure surfaces.
- public routes must never imply that TARGET/PIPELINE capabilities are live.
- client focus/selection cannot be authorization.

## 12. Testing

Each implementation tranche requires:

- unit tests for projection and intent contracts;
- tests proving client intent cannot encode consequential actions;
- renderer-structure tests;
- camera-intent tests;
- semantic edge tests;
- attention tests;
- material/token convergence tests;
- confidentiality tests;
- reduced-motion/runtime-mode tests;
- member/public equivalence tests;
- PostgreSQL journeys when domain state is involved;
- production build/start;
- browser workflow in WebGL-off Precision Mode;
- reduced-motion browser proof;
- 390x844 mobile proof;
- 200% zoom proof;
- Obsidian and Marble screenshots;
- release artifact tied to exact head SHA.

## 13. Merge/Retirement Sequence

1. P01/P16 #531 merged — complete.
2. Port #534 safety/renderer primitives into the #531 spine.
3. Port/rebase #505 shell material convergence onto current main.
4. Port #504 public plane-language/projection/route onto shared RealityProjection.
5. Verify all three on one convergence branch.
6. Close #534, #505, and #504 as superseded/ported after evidence.
7. Write and implement Member Living Reality behavior tranche.
8. Implement scenarios A–J progressively.

## 14. Definition of Done

Spatial convergence is not done until:

- only one canonical `RealityProjection` exists;
- only one runtime-mode authority exists;
- only one client presentation-intent grammar exists;
- only one camera grammar exists;
- only one Obsidian/Marble material authority exists;
- public ecosystem and member Living Home use the shared grammar;
- duplicate spatial components are retired or explicitly reduced to semantic DOM adapters;
- essential workflows remain functional without WebGL;
- production PHI remains truthfully blocked unless separately approved with evidence;
- full exact-head Quality and browser evidence are green.
