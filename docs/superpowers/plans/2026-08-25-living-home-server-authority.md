# Klinikos Living Home Server Authority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move authenticated Living Home intent resolution, Path selection, Path runtime and guidance projection to the server while preserving the existing Marble/Obsidian client experience.

**Architecture:** Keep the rich interactive Living Home shell client-side, but replace raw Path/orchestration data with a browser-safe view model. A dedicated authenticated `POST /api/living-home/command` endpoint owns intent resolution, surface routing, Path creation, guidance and projection. Initial dashboard Paths are also projected server-side before serialization.

**Tech Stack:** Next.js 15 App Router, TypeScript 5.9, Zod, Vitest, existing clinic auth/RBAC, existing Path persistence/orchestration, existing browser-confidentiality gate.

**Spec:** `docs/superpowers/specs/2026-08-25-living-home-server-authority-design.md`

## Global Constraints

- No Prisma/schema/migration changes.
- No identity/account/access/legal/EDU/Grid/clinical authority changes.
- Existing `/api/paths` behavior remains intact.
- Browser receives no runtime imports from `@/lib/orchestration`.
- Tenant/role context comes only from authenticated server session.
- Unknown or ambiguous intent fails to clarification rather than inventing a Path.
- Surface lookup may return a destination without creating a Path.
- Marble/Obsidian interaction and visual structure remain unchanged.
- Re-check latest `main` and open PR ownership before each code tranche and before merge.

---

### Task 1: Add the browser-safe Living Home view model and server projector

**Files:**
- Create: `src/lib/home/living-home-view-model.ts`
- Create: `src/lib/home/living-home-presentation.ts`
- Test: `tests/living-home-server-authority.test.ts`

**Interfaces:**
- Produces `LivingHomePathView`, `LivingHomeCommandView`, `LivingHomeSurfaceView`.
- Produces `projectLivingHomePath(snapshot, guidance)` and `projectLivingHomePaths(snapshots, guidanceList)`.
- Consumes existing `PersistedPathSnapshot`, `PathGuidance`, `resolvePathRuntime`, `getKlinikosPath` only inside the server projector.

- [ ] **Step 1: Write failing view-model/source-boundary tests**

Create assertions that the view-model file contains no `server-only`, database, repository or orchestration runtime import, and that the server projector is marked `server-only`.

Use the contract:

```ts
export type LivingHomePathState =
  | "needs_you"
  | "waiting"
  | "needs_review"
  | "blocked"
  | "ready"
  | "done"
  | "active";

export type LivingHomeBlockerView = {
  code: string;
  title: string;
  explanation: string;
  owner: "user" | "clinic" | "reviewer" | "connector" | "system";
  canResolveNow: boolean;
};

export type LivingHomePathView = {
  instanceId: string;
  pathId: string;
  title: string;
  goal: string;
  progressPercent: number;
  state: LivingHomePathState;
  stateLabel: string;
  reason: string;
  blockers: LivingHomeBlockerView[];
  nextActionLabel: string | null;
  nextActionHref: string | null;
};

export type LivingHomeSurfaceView = {
  label: string;
  href: string;
};

export type LivingHomeCommandView =
  | { kind: "path"; message: string; path: LivingHomePathView }
  | { kind: "surface"; message: string; surface: LivingHomeSurfaceView }
  | { kind: "clarification"; message: string; clarification: string }
  | { kind: "blocked"; message: string }
  | { kind: "unavailable"; message: string };
```

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```bash
npm test -- tests/living-home-server-authority.test.ts
```

Expected: fail because the view-model/projector files do not yet exist.

- [ ] **Step 3: Implement `living-home-view-model.ts`**

Create only the types above. Do not import orchestration or repositories.

- [ ] **Step 4: Implement `living-home-presentation.ts`**

Start with:

```ts
import "server-only";

import type { PathGuidance } from "@/lib/orchestration/path-guidance-engine";
import { resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import { getKlinikosPath } from "@/lib/paths/catalog";
import type { LivingHomePathState, LivingHomePathView } from "@/lib/home/living-home-view-model";
```

Implement deterministic state mapping:

```ts
function mapState(guidance: PathGuidance | null, completed: boolean): LivingHomePathState {
  if (completed) return "done";
  if (!guidance) return "active";
  if (guidance.state === "blocked") return "blocked";
  if (guidance.state === "review_required") return "needs_review";
  if (guidance.state === "waiting") return "waiting";
  if (guidance.state === "available" || guidance.state === "recommended") return "ready";
  if (guidance.state === "completed") return "done";
  return "active";
}
```

`projectLivingHomePath` must:

- resolve the current runtime server-side;
- use the canonical Path definition title;
- clamp `progressPercent` to `0..100`;
- copy only safe blocker fields;
- use guidance reason/title/href for the next action;
- never serialize capability keys, alternatives, Path nodes, scoring, predicates or session internals.

`projectLivingHomePaths` must match guidance by `instanceId` and preserve snapshot ordering.

- [ ] **Step 5: Run focused test and confirm GREEN**

Run:

```bash
npm test -- tests/living-home-server-authority.test.ts
```

Expected: pass for DTO shape and projector truth.

- [ ] **Step 6: Commit**

```bash
git add src/lib/home/living-home-view-model.ts src/lib/home/living-home-presentation.ts tests/living-home-server-authority.test.ts
git commit -m "feat(home): add server-owned Living Home projection"
```

---

### Task 2: Add the authenticated Living Home command endpoint

**Files:**
- Create: `src/app/api/living-home/command/route.ts`
- Test: `tests/living-home-server-authority.test.ts`

**Interfaces:**
- Consumes `LivingHomeCommandView` and `projectLivingHomePath`.
- Consumes current `getClinicSession`, `enforceApiPermission`, `resolveIntentDeterministically`, `resolveSurfaceLookup`, `createPathInstance`, `resolvePathGuidance`.
- Produces `POST /api/living-home/command` accepting `{ text: string }` only.

- [ ] **Step 1: Extend the failing test contract**

Assert the route:

- imports `getClinicSession` and `enforceApiPermission`;
- accepts only `text` through a Zod schema;
- does not accept `organizationId`, `role`, `pathId`, `userId`, or tenant context from the request body;
- imports the confidential intent engine only server-side;
- returns a projected view rather than a raw `PersistedPathSnapshot`.

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```bash
npm test -- tests/living-home-server-authority.test.ts
```

Expected: fail because the route does not exist.

- [ ] **Step 3: Implement the route**

Use this structure:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { resolveSurfaceLookup } from "@/features/zumi/deterministic-answer";
import { projectLivingHomePath } from "@/lib/home/living-home-presentation";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolvePathGuidance } from "@/lib/orchestration/path-guidance-engine";
import { createPathInstance } from "@/lib/orchestration/path-persistence-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

const commandSchema = z.object({
  text: z.string().trim().min(2).max(1_000),
}).strict();
```

Flow:

1. `getClinicSession()`; return 401 if absent.
2. `enforceApiPermission(session, "tasks", "create", { request })`; return denial before any Path creation.
3. Parse `{ text }`.
4. `resolveIntentDeterministically(text)`.
5. If no candidate Path, attempt `resolveSurfaceLookup(text, session.role)`.
6. If surface exists, return `{ kind: "surface", message: surface.answer, surface: { label: surface.label, href: surface.href } }` with 200.
7. If no Path and no surface, return `kind="clarification"` with the deterministic clarification and no mutation.
8. If `requiresClarification` is true because the intent is ambiguous, return clarification before creation.
9. Otherwise create the Path with the first candidate Path ID and the original text as goal.
10. Resolve guidance and project it.
11. Return `{ kind: "path", message: guidance?.reason ?? "This is organized. The next safe step is below.", path }` with 201.
12. Send thrown domain/network errors through `networkAccessErrorResponse`.

- [ ] **Step 4: Run focused test and confirm GREEN**

Run:

```bash
npm test -- tests/living-home-server-authority.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/living-home/command/route.ts tests/living-home-server-authority.test.ts
git commit -m "feat(home): move Living Home command routing server-side"
```

---

### Task 3: Server-project the initial dashboard Paths

**Files:**
- Modify: `src/app/(platform)/dashboard/page.tsx`
- Test: `tests/living-home-server-authority.test.ts`

**Interfaces:**
- Consumes `projectLivingHomePaths(activePaths, pathGuidance)`.
- Changes `LivingHome` props from raw `PersistedPathSnapshot[] + PathGuidanceView[]` to `LivingHomePathView[]`.

- [ ] **Step 1: Extend tests for initial projection**

Require `dashboard/page.tsx` to import `projectLivingHomePaths` and pass `initialPaths={livingPathViews}`. Require that raw `activePaths` and `pathGuidance` are not serialized directly into `LivingHome`.

- [ ] **Step 2: Run focused test and confirm RED**

- [ ] **Step 3: Modify dashboard**

After existing guidance resolution:

```ts
const pathGuidance = resolvePathGuidanceList(session, activePaths);
const livingPathViews = projectLivingHomePaths(activePaths, pathGuidance);
```

Pass only:

```tsx
initialPaths={livingPathViews}
```

Remove the `initialGuidance` prop from the client boundary.

Keep operating signal counts based on authoritative server-loaded snapshots exactly as they are.

- [ ] **Step 4: Run focused test and confirm GREEN**

- [ ] **Step 5: Commit**

```bash
git add src/app/\(platform\)/dashboard/page.tsx tests/living-home-server-authority.test.ts
git commit -m "refactor(home): project Paths before browser serialization"
```

---

### Task 4: Remove orchestration runtime from Living Home Client Components

**Files:**
- Modify: `src/components/clinic/living-home.tsx`
- Modify: `src/components/clinic/living-home-operations.tsx`
- Test: `tests/living-home-server-authority.test.ts`

**Interfaces:**
- Both components consume only `LivingHomePathView` and `LivingHomeCommandView` from `@/lib/home/living-home-view-model` using type-only imports.
- `LivingHome` posts raw user text to `/api/living-home/command`.

- [ ] **Step 1: Extend the RED contract**

Assert both Client Components contain no runtime import from:

- `@/lib/orchestration/intent-engine`
- `@/lib/orchestration/path-engine`
- `@/lib/orchestration/*`

Also require no runtime `getKlinikosPath` use in either client file.

- [ ] **Step 2: Run focused test and confirm RED**

- [ ] **Step 3: Refactor `living-home.tsx`**

Replace raw state:

```ts
const [paths, setPaths] = useState<LivingHomePathView[]>(initialPaths);
```

Remove client `guidance` state entirely.

Derive the active Path directly:

```ts
const activePath = useMemo(
  () => paths.find((path) => path.instanceId === activeInstanceId) ?? null,
  [paths, activeInstanceId],
);
```

Build workspace rows from `activePath.title`, `goal`, `progressPercent`, `stateLabel`, `reason` and `blockers` only.

`submitIntent` must no longer resolve intent locally. It should:

```ts
const response = await fetch("/api/living-home/command", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text }),
});
const payload = await response.json() as LivingHomeCommandView | { error?: string };
```

Handle:

- `path`: prepend projected Path, set active ID, show message;
- `surface`: set existing surface answer state;
- `clarification`: set clarification and transcript message;
- `blocked` / `unavailable`: show message without inventing a Path;
- 401/403/error: set failed state and show safe server error.

Phase semantics remain tied to real milestones:

- `understanding` before fetch;
- `connecting` while awaiting the server;
- `preparing` once a successful structured response is received;
- `ready` only after state is materialized.

- [ ] **Step 4: Refactor `living-home-operations.tsx`**

Change props from snapshots + guidance to:

```ts
paths: LivingHomePathView[];
```

Remove `resolvePathRuntime` and `getKlinikosPath` runtime imports.

The active continuation card should read directly from the selected `LivingHomePathView`:

- title = `activePath.title`
- goal = `activePath.goal`
- progress = `activePath.progressPercent`
- state/reason/blockers = projected values
- continue href = `activePath.nextActionHref ?? "/paths/" + activePath.pathId`

Path selector buttons use `path.title` directly.

- [ ] **Step 5: Run focused test and browser confidentiality gate**

Run:

```bash
npm test -- tests/living-home-server-authority.test.ts
npm run verify:browser-confidentiality
```

Expected: no Client Component runtime dependency reaches `src/lib/orchestration`.

- [ ] **Step 6: Commit**

```bash
git add src/components/clinic/living-home.tsx src/components/clinic/living-home-operations.tsx tests/living-home-server-authority.test.ts
git commit -m "refactor(home): keep Living Home orchestration off the browser"
```

---

### Task 5: Exact-head verification, collision audit and merge gate

**Files:**
- Verify all changed files only; no new feature scope.

**Interfaces:**
- Produces exact-head evidence and merge decision.

- [ ] **Step 1: Re-read latest `main` and open PRs**

Confirm no newer agent owns or modified:

- `src/components/clinic/living-home.tsx`
- `src/components/clinic/living-home-operations.tsx`
- `src/app/(platform)/dashboard/page.tsx`
- `src/app/api/living-home/command/route.ts`
- `src/lib/home/living-home-view-model.ts`
- `src/lib/home/living-home-presentation.ts`

If overlap exists, stop and reconcile rather than overwriting.

- [ ] **Step 2: Run focused tests**

```bash
npm test -- tests/living-home-server-authority.test.ts
```

- [ ] **Step 3: Run browser/security verification**

```bash
npm run verify:browser-confidentiality
```

- [ ] **Step 4: Run repository gates**

```bash
npm run type-check
npm run lint
npm test -- --run
npm run build
```

If hosted CI fails before checkout or runner allocation, report that as infrastructure-unavailable, never as green or as a code failure.

- [ ] **Step 5: Confirm no migration/schema/release diff**

Diff must contain no:

- `prisma/schema.prisma`
- `prisma/migrations/**`
- Render/release migration scripts
- identity/account/access/legal/EDU/Grid/clinical authority files.

- [ ] **Step 6: Open PR with explicit ownership and truth boundaries**

PR must state:

- exact base SHA;
- browser confidentiality objective;
- no schema/migration;
- no authority widening;
- preserved Living Home UX;
- concurrent lanes intentionally untouched;
- exact verification evidence and any unavailable gates.

- [ ] **Step 7: Re-read `main` immediately before merge**

If main advanced, compare changed files and re-anchor/reconcile if needed.

- [ ] **Step 8: Merge only with exact-head guard**

After merge, verify `main` contains the merge commit and separately verify release/deployment truth. Do not equate merge with production-live.
