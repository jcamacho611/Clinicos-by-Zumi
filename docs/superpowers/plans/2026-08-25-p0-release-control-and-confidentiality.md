# P0 Release Control and Confidentiality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current-main release evidence trustworthy and remove proprietary deterministic routing/runtime engines from authenticated browser bundles before broader P0 product expansion.

**Architecture:** Preserve current Path persistence, route catalog, guidance, and authorization. Move authenticated intent/runtime evaluation behind server capabilities or project only minimum-necessary DTOs, keeping the existing public-server routing pattern as precedent. Repair the release/governance path without weakening any quality gate, then enable branch protection only when the checks are actually executable.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, GitHub Actions, Render release contract, existing security/confidentiality checks.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Baseline `main@cdd425d8c6d468047a4c3f42b8fb5d26939be26e` is unprotected; do not push implementation directly to main.
- Do not weaken or delete security tests merely to make `security:check` green.
- Preserve deterministic no-model operation when no AI provider is configured.
- Preserve Path persistence, RBAC, tenant scope, guidance semantics, and current user-facing behavior unless a behavior is itself the confidentiality defect.
- Do not represent runner-allocation failure as code green or red.
- Do not enable required GitHub checks until those checks are reliably assignable/executable.
- Reconcile against newest main immediately before merge.

---

### Task 1: Lock the authenticated browser-confidentiality defect with a failing test

**Files:**
- Create: `tests/authenticated-living-home-confidentiality.test.ts`
- Read: `src/components/clinic/living-home.tsx`
- Read: `src/components/clinic/living-home-operations.tsx`
- Read: `src/lib/orchestration/intent-engine.ts`
- Read: `src/lib/orchestration/path-engine.ts`

**Interfaces:**
- Consumes: current client component import graph.
- Produces: regression guard proving authenticated client code cannot value-import confidential routing/runtime engines.

- [ ] **Step 1: Write the failing test**

Create `tests/authenticated-living-home-confidentiality.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("src/components/clinic/living-home.tsx", "utf8");
const operations = readFileSync("src/components/clinic/living-home-operations.tsx", "utf8");

describe("authenticated Living Home confidentiality", () => {
  it("does not ship deterministic routing/runtime engines to the browser", () => {
    for (const source of [home, operations]) {
      expect(source).not.toMatch(/from\s+["']@\/lib\/orchestration\/intent-engine["']/);
      expect(source).not.toMatch(/from\s+["']@\/lib\/orchestration\/path-engine["']/);
    }
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/authenticated-living-home-confidentiality.test.ts
```

Expected: FAIL because current `living-home.tsx` imports both engines and `living-home-operations.tsx` imports `path-engine`.

- [ ] **Step 3: Commit the RED contract**

```bash
git add tests/authenticated-living-home-confidentiality.test.ts
git commit -m "test(security): lock authenticated Living Home confidentiality"
```

### Task 2: Define the server-owned authenticated intent DTO

**Files:**
- Create: `src/lib/orchestration/living-home-intent-dto.ts`
- Create: `tests/living-home-intent-dto.test.ts`

**Interfaces:**
- Produces:

```ts
export type LivingHomeIntentResolution =
  | { kind: "path"; pathId: string; requiresClarification: boolean; clarification: string | null }
  | { kind: "surface"; answer: string; label: string; href: string }
  | { kind: "clarification"; question: string };
```

- [ ] **Step 1: Write the DTO contract test**

```ts
import { describe, expect, it } from "vitest";
import { livingHomeIntentResolutionSchema } from "@/lib/orchestration/living-home-intent-dto";

describe("Living Home intent DTO", () => {
  it("accepts only minimum-necessary presentation shapes", () => {
    expect(livingHomeIntentResolutionSchema.parse({
      kind: "path",
      pathId: "fix-referral-leakage",
      requiresClarification: false,
      clarification: null,
    }).kind).toBe("path");

    expect(() => livingHomeIntentResolutionSchema.parse({
      kind: "path",
      pathId: "fix-referral-leakage",
      hiddenWeights: [0.8, 0.2],
    })).toThrow();
  });
});
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm test -- tests/living-home-intent-dto.test.ts
```

Expected: FAIL because module/schema does not exist.

- [ ] **Step 3: Implement exact DTO schema**

Use the repository’s existing schema library (Zod if already used in orchestration DTOs). Keep `strict()` semantics so hidden decision payloads cannot hitchhike to the browser.

- [ ] **Step 4: Run focused test and verify GREEN**

```bash
npm test -- tests/living-home-intent-dto.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/orchestration/living-home-intent-dto.ts tests/living-home-intent-dto.test.ts
git commit -m "feat(security): define Living Home intent projection"
```

### Task 3: Add authenticated server capability for intent resolution

**Files:**
- Create: `src/app/api/living-home/intent/route.ts`
- Test: `tests/living-home-intent-route.test.ts`
- Reuse: `src/lib/orchestration/intent-engine.ts`
- Reuse: `src/features/zumi/deterministic-answer.ts`
- Reuse: existing clinic-session/auth helpers.

**Interfaces:**
- Consumes JSON `{ text: string }` under current clinic session.
- Produces `{ data: LivingHomeIntentResolution }` with `no-store` headers.

- [ ] **Step 1: Write route source/security test**

The test must assert:

```ts
const source = readFileSync("src/app/api/living-home/intent/route.ts", "utf8");
expect(source).toContain("requireClinicSession");
expect(source).toContain("resolveIntentDeterministically");
expect(source).toContain("resolveSurfaceLookup");
expect(source).toContain("livingHomeIntentResolutionSchema");
expect(source).toContain("no-store");
```

Also exercise exported pure handler/helper if route tests in this repo use that pattern: valid text resolves to exactly one DTO branch; text under 2 characters returns 400; unauthenticated caller returns 401/403 via existing route wrapper.

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm test -- tests/living-home-intent-route.test.ts
```

- [ ] **Step 3: Implement server route**

Server sequence:

```ts
const session = await requireClinicSession();
const text = parsed.data.text.trim();
const resolved = resolveIntentDeterministically(text);
const pathId = resolved.candidatePathIds[0] ?? null;

if (pathId) {
  return json({ data: {
    kind: "path",
    pathId,
    requiresClarification: resolved.requiresClarification,
    clarification: resolved.clarificationQuestions[0] ?? null,
  }});
}

const surface = resolveSurfaceLookup(text, session.role);
if (surface) return json({ data: { kind: "surface", ...surface }});

return json({ data: {
  kind: "clarification",
  question: resolved.clarificationQuestions[0] ?? "Tell Klinikos what you are trying to get done.",
}});
```

Do not return candidate arrays, scoring internals, weights, path runtime, or rule details.

- [ ] **Step 4: Run focused tests**

```bash
npm test -- tests/living-home-intent-route.test.ts tests/living-home-intent-dto.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/living-home/intent/route.ts tests/living-home-intent-route.test.ts
git commit -m "feat(security): resolve Living Home intent server-side"
```

### Task 4: Remove client routing/runtime engines while preserving UX

**Files:**
- Modify: `src/components/clinic/living-home.tsx`
- Modify: `src/components/clinic/living-home-operations.tsx`
- Create: `src/lib/orchestration/path-presentation.ts` only if a pure browser-safe calculation is genuinely presentation-only.
- Test: `tests/authenticated-living-home-confidentiality.test.ts`
- Test: existing Living Home tests.

**Interfaces:**
- Consumes: `POST /api/living-home/intent` DTO and server-projected path progress/guidance already loaded by page/API.
- Produces: same user-facing resolve/start/clarify behavior without client engine imports.

- [ ] **Step 1: Replace client intent resolution**

In `submitIntent`, replace direct `resolveIntentDeterministically(text)` / `resolveSurfaceLookup(...)` with:

```ts
const intentResponse = await fetch("/api/living-home/intent", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text }),
});
const intentPayload = await intentResponse.json() as { data?: LivingHomeIntentResolution; error?: string };
if (!intentResponse.ok || !intentPayload.data) throw new Error(intentPayload.error ?? "Klinikos could not understand that yet.");
```

Then branch on `kind`.

- [ ] **Step 2: Remove `resolvePathRuntime` from client UI**

Do not recreate hidden path progression in another client file. Prefer adding a presentation-safe progress field to the server-loaded snapshot/guidance projection if one already exists, or derive only from explicit server-provided completed/total step counts. The browser may calculate a percentage from `{ completedSteps, totalSteps }`; it may not import route execution/ranking/policy engines.

- [ ] **Step 3: Run confidentiality + Living Home tests**

```bash
npm test -- tests/authenticated-living-home-confidentiality.test.ts tests/route-registry.test.ts
npm run security:check
```

Expected: no Living Home `intent-engine` / `path-engine` findings.

- [ ] **Step 4: Run full code gates available locally**

```bash
npm run type-check
npm run lint
npm test -- --run
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/clinic/living-home.tsx src/components/clinic/living-home-operations.tsx src/lib/orchestration tests
git commit -m "fix(security): keep authenticated routing engines server-side"
```

### Task 5: Reconcile open PRs and release evidence before branch protection

**Files:**
- Modify only documentation/status files if reconciliation truth changed.
- Review open PRs #281, #282, #288, #293, #294 and any newer PRs.

**Interfaces:**
- Produces: one explicit merge/defer/close decision per overlapping open PR.

- [ ] **Step 1: Re-fetch exact current main and all open PRs**

Record exact SHA and overlap. In particular, verify that merged BodyMap PR #295 supersedes stale BodyMap work before closing/retargeting any competing branch.

- [ ] **Step 2: Classify each open PR**

Use only:

```text
MERGE CANDIDATE AFTER REBASE
KEEP OPEN AS FUTURE DEPENDENCY
SUPERSEDED / CLOSE
BLOCKED BY VERIFICATION
```

Record reason and file/migration overlap.

- [ ] **Step 3: Verify GitHub Actions infrastructure separately from code**

Trigger/inspect a current commit workflow. A job with `runner_id: 0`, empty runner, no steps, and immediate completion remains infrastructure-unavailable evidence.

Do not edit application code to “fix” an unassigned runner.

- [ ] **Step 4: Enable branch protection only when checks execute reliably**

Required target policy once CI is operational:

- pull request required before merge;
- required exact-head quality/deploy-contract checks;
- stale approvals dismissed if branch changes, if supported by repository governance;
- force pushes/deletions restricted on main.

If GitHub connector cannot configure repository protection directly, record the exact UI/admin action as the remaining operator step rather than pretending it is enabled.

- [ ] **Step 5: Update release truth docs and commit**

Do not change `FEATURE_STATUS` capability labels unless runtime/code evidence supports the change.

### Task 6: Final verification and PR

**Files:** no new planned runtime files.

- [ ] **Step 1: Rebase/reconcile with newest main**

- [ ] **Step 2: Run**

```bash
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

Run the canonical release/Render-aligned gate when an approved disposable database lane is available. Do not mutate production DB from a build.

- [ ] **Step 3: Browser QA authenticated Living Home**

Verify at minimum:

- no model provider configured still yields deterministic useful routing;
- path start works;
- surface lookup works;
- clarification works;
- existing paths/guidance render;
- mobile composer works;
- no proprietary source module appears in emitted client chunks via repository confidentiality scan.

- [ ] **Step 4: Open PR**

PR must state exact code evidence, hosted-CI truth, browser proof, and any remaining operator-only branch-protection step.
