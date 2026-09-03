# P01 Client Intent Interface Lock

**Status:** Normative implementation detail for `docs/superpowers/plans/2026-09-03-program-p01-living-reality-runtime.md` Task 6.  
**Authority:** subordinate to the approved P01 design and Master Canon.  
**Purpose:** remove ambiguity found during plan self-review. The 3D browser layer emits presentation intent only; it never emits or owns a consequential domain command.

## Required file

Create during P01 Task 6:

`src/lib/living-reality/reality-client-intent.ts`

## Exact W1 union

```ts
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

export type RealityClientIntent =
  | {
      kind: "FOCUS_OBJECT";
      objectId: string;
    }
  | {
      kind: "INSPECT_OBJECT";
      objectId: string;
    }
  | {
      kind: "OPEN_ROUTE";
      href: `/${string}`;
    }
  | {
      kind: "CHANGE_LENS";
      lensId: CanonicalPlaneId;
    }
  | {
      kind: "REQUEST_ACTION_PANEL";
      objectId: string | null;
    };
```

## Hard rules

- `OPEN_ROUTE` is navigation intent only. The destination independently reauthenticates and reauthorizes.
- The scene may not emit `approve`, `sign`, `submit`, `pay`, `settle`, `publish`, `verify`, `authorize`, `rank`, `match`, `book`, `assign`, `order`, `prescribe`, `claim`, or equivalent consequential domain commands.
- `objectId` identifies only an object already present in the minimum-necessary `RealityProjection`; arbitrary IDs from scene code are rejected by the runtime handler.
- `CHANGE_LENS` accepts only the five canonical plane IDs.
- `href` must pass the same-origin/allowed-action checks already used by the semantic twin before navigation.
- No tenant ID, role, credential state, clinical truth, payment state, ranking weight, eligibility value, security policy, hidden prompt, or proprietary rule belongs in `RealityClientIntent`.
- P16 disclosure gates must cover this file and all producers/consumers of the union.

## Required tests

P01 Task 6/8 tests must prove:

1. every scene-emitted intent conforms to this union;
2. arbitrary object IDs are ignored/rejected;
3. unsafe/external routes are ignored/rejected;
4. changing visual lens does not mutate authority or server context;
5. every supported scene intent has an equivalent semantic DOM action or inspection path;
6. no additional intent variant is added without an explicit plan/spec amendment and traceability consequence.
