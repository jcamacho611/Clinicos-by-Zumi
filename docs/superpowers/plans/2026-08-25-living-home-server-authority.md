# Klinikos Living Home Server Authority Implementation Plan

Status: IMPLEMENTED IN PR #325, EXECUTABLE VERIFICATION PENDING
Date: 2026-08-25

> **For agentic workers:** this plan is the execution record for the Living Home browser-confidentiality tranche. Current runtime truth and newer `main` remain higher authority than this document.

**Goal:** Move authenticated Living Home intent resolution, Path selection, Path runtime, and guidance projection to the server while preserving the existing Marble/Obsidian client experience.

**Architecture:** Keep the rich interactive Living Home shell client-side, but replace raw Path/orchestration data with a browser-safe view model. A dedicated authenticated `POST /api/living-home/command` endpoint owns intent resolution, surface routing, Path creation, guidance, and projection. Initial dashboard Paths are projected server-side before serialization.

**Tech Stack:** Next.js 15 App Router, TypeScript, Zod, Vitest, existing clinic auth/RBAC, existing Path persistence/orchestration, existing browser-confidentiality gate.

**Spec:** `docs/superpowers/specs/2026-08-25-living-home-server-authority-design.md`

## Global constraints

- No Prisma/schema/migration changes.
- No identity/account/access/legal/EDU/Grid/clinical authority changes.
- Existing `/api/paths` behavior remains intact.
- Browser receives no runtime imports from `@/lib/orchestration`.
- Type-only imports are allowed because they are erased from the browser bundle.
- Tenant/role context comes only from authenticated server session.
- Unknown or ambiguous intent returns clarification rather than inventing a Path.
- Surface lookup may return a role-authorized destination without creating a Path.
- `tasks:create` is required only before consequential Path persistence, not before read-only surface navigation.
- Marble/Obsidian interaction and visual structure remain unchanged.
- Re-check latest `main` and open PR ownership before every write and immediately before merge.

---

## Task 1: Browser-safe Living Home view model and server projector

**Files**

- `src/lib/home/living-home-view-model.ts`
- `src/lib/home/living-home-presentation.ts`
- `tests/living-home-server-authority.test.ts`

**Implementation state:** implemented, not yet executable-verified in the repository runner.

### Browser-safe contract

`living-home-view-model.ts` contains presentation types only:

- `LivingHomePathState`
- `LivingHomeBlockerView`
- `LivingHomePathView`
- `LivingHomeSurfaceView`
- `LivingHomeCommandView`

It must not import database, repository, or orchestration runtime code.

### Server projection

`living-home-presentation.ts` is marked `server-only` and may consume:

- `PersistedPathSnapshot`
- `PathGuidance`
- `resolvePathRuntime`
- `getKlinikosPath`

It projects only minimum-necessary browser state:

- instance/path identity needed for links and UI continuity;
- title and user goal;
- bounded progress percentage;
- user-facing state and reason;
- safe blocker title/explanation/owner/resolvability;
- next-action label/href.

It must not serialize:

- Path node machinery;
- capability keys;
- blocker alternatives;
- policy predicates;
- candidate rules or scores;
- session internals;
- repository/audit internals.

---

## Task 2: Authenticated Living Home command endpoint

**File**

- `src/app/api/living-home/command/route.ts`

**Implementation state:** implemented, not yet executable-verified in the repository runner.

### Input

Strict Zod body:

```ts
{
  text: string // trimmed, 2..1000 chars
}
```

The browser does not supply:

- organization ID;
- user ID;
- role;
- tenant;
- Path ID as the routing decision.

### Server flow

1. Resolve authenticated clinic session.
2. Parse the user-entered text.
3. Resolve intent server-side.
4. If there is no Path candidate, attempt the existing role-filtered `resolveSurfaceLookup`.
5. If a safe surface exists, return a `surface` view without mutation.
6. If no surface or deterministic Path is safe, return `clarification` without mutation.
7. If intent is ambiguous, return clarification before Path creation.
8. Only when a Path will be created, enforce `tasks:create` using the authenticated session.
9. Create/reuse the Path through the existing Path repository.
10. Resolve guidance server-side.
11. Project the Path into `LivingHomePathView`.
12. Return the safe discriminated command view.
13. Route domain/Zod/Prisma failures through the existing API error boundary.

### Important regression caught during implementation

The first draft enforced `tasks:create` before all command handling. That would have narrowed legitimate read-only navigation for roles that can open a surface but cannot create tasks.

The corrected implementation preserves the pre-existing authority model:

- navigation/surface lookup uses existing role-filtered `canOpen` behavior;
- Path persistence requires `tasks:create` before `createPathInstance`.

Do not move that permission check back to the top of the route without a new authority review.

---

## Task 3: Server-project initial dashboard Paths

**File**

- `src/app/(platform)/dashboard/page.tsx`

**Implementation state:** implemented, not yet executable-verified in the repository runner.

The Server Component continues loading authoritative snapshots and guidance, then creates:

```ts
const livingPathViews = projectLivingHomePaths(activePaths, pathGuidance);
```

Only `livingPathViews` crosses into the Living Home Client Component.

Operating signal counts may continue to use server-loaded authoritative snapshots because those values never require browser-side orchestration.

---

## Task 4: Remove proprietary runtime from Living Home Client Components

**Files**

- `src/components/clinic/living-home.tsx`
- `src/components/clinic/living-home-operations.tsx`

**Implementation state:** implemented, not yet executable-verified in the repository runner.

### `living-home.tsx`

Must not runtime-import or execute:

- `resolveIntentDeterministically`;
- `resolveSurfaceLookup`;
- `resolvePathRuntime`;
- `getKlinikosPath`;
- other confidential orchestration runtime.

It may use type-only imports from server-owned modules because TypeScript erases them.

The client posts only `{ text }` to `/api/living-home/command` and renders the resulting browser-safe view.

### `living-home-operations.tsx`

Must not calculate Path runtime or load the Path catalog in the browser.

The Continue surface reads directly from `LivingHomePathView`:

- title;
- goal;
- progress;
- state/state label;
- reason;
- safe blockers;
- next-action href.

All existing schedule, Grid, EDU, opportunity, mobile, and Marble/Obsidian presentation remains outside the authority change.

---

## Task 5: Verification and merge gate

### Required exact-head commands

The repository's actual browser-confidentiality command is:

```bash
npm run security:client-boundary
```

Do **not** use the stale/nonexistent `verify:browser-confidentiality` command from earlier planning text.

Full expected verification lane:

```bash
npm test -- tests/living-home-server-authority.test.ts
npm run security:client-boundary
npm run type-check
npm run lint
npm test -- --run
npm run build
```

Where appropriate, the broader release/security gate may also be run:

```bash
npm run security:check
npm run verify:code
```

### Current verification truth

GitHub Actions on the implementation head has repeatedly produced jobs with `steps:null`, meaning no checkout or test command actually executed. That is an infrastructure-unavailable result, not a code failure and not green evidence.

No alternate full repository checkout is currently available through the connected tools. Therefore:

- do not claim focused tests passed;
- do not claim type-check passed;
- do not claim lint passed;
- do not claim build passed;
- do not claim browser confidentiality gate passed;
- do not equate mergeability with executable verification.

Source review and the committed regression contract remain useful evidence, but they do not substitute for command execution.

### Collision gate

Immediately before merge, re-read latest `main` and open PRs. Confirm no newer agent owns or modified:

- `src/components/clinic/living-home.tsx`
- `src/components/clinic/living-home-operations.tsx`
- `src/app/(platform)/dashboard/page.tsx`
- `src/app/api/living-home/command/route.ts`
- `src/lib/home/living-home-view-model.ts`
- `src/lib/home/living-home-presentation.ts`

If overlap exists, stop and reconcile. Never force/reset another agent's work.

### Diff gate

The tranche must contain no changes to:

- `prisma/schema.prisma`;
- `prisma/migrations/**`;
- release/migration scripts;
- identity/account/access/legal/EDU/Grid/clinical authority files.

### Merge truth

If merged despite unavailable hosted execution, the PR must explicitly preserve that limitation. After merge:

1. verify the merge commit is on `main`;
2. separately inspect build/deployment evidence;
3. never treat `merged` as equivalent to `production-live`.

---

## Follow-on dependency order

After this tranche is merged and re-baselined:

1. re-anchor/salvage universal unfinished-work projection from #256 onto current main;
2. project that work into role-aware Living Home;
3. continue Golden Current Visit using already-merged clinical-role/Clinical Change improvements;
4. continue Revenue Integrity progression;
5. connect Operating Map acquisition/value loop;
6. expand high-value public capability discovery;
7. add richer materialized Zumi action surfaces over the same server presentation boundary.

Do not begin a follow-on merely because it appears next here. Re-baseline current `main`, active PR ownership, production truth, and current P0 first.