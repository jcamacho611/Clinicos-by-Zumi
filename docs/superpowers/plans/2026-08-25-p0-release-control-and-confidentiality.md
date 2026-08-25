# P0 Release Control and Confidentiality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current-main release evidence trustworthy and remove proprietary authenticated routing/runtime machinery from browser bundles before broader P0 expansion.

**Architecture:** Keep Path persistence, capability policy, route catalog, runtime, guidance, and deterministic intent server-side. Replace authenticated client evaluation with strict server-produced DTOs. Living Home receives a safe Path presentation rather than raw runtime evaluation. Do not weaken the current Quality workflow or Render-aligned release gates. Branch protection becomes an operator action only after `Quality / verify` and `Quality / deploy-contract` reliably execute.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zod, Vitest, GitHub Actions, Render release contract, existing browser-confidentiality/security gates.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Baseline is `main@cdd425d8c6d468047a4c3f42b8fb5d26939be26e`, currently unprotected with required checks disabled.
- Implementation must start on a feature branch from newest main, never by direct push to main.
- Current `.github/workflows/quality.yml` documents an account-level runner allocation/billing condition. Do not edit application code or weaken CI to “fix” `runner_id: 0` / `steps:null`.
- Preserve useful deterministic operation with no paid/model provider.
- Preserve Path persistence, RBAC, tenant scope, guidance semantics, capability policy, and audit.
- Browser gets only presentation/action DTOs, never engine implementations, hidden candidates/weights, capability policy internals, or raw path runtime.
- Reconcile newest main immediately before merge.

---

### Task 1: Lock the authenticated browser-confidentiality defect with RED tests

**Files:**
- Create: `tests/authenticated-living-home-confidentiality.test.ts`
- Read: `src/components/clinic/living-home.tsx`
- Read: `src/components/clinic/living-home-operations.tsx`
- Read: `scripts/security/browser-confidentiality-gate.mjs`

- [ ] **Step 1: Write the failing import guard**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync("src/components/clinic/living-home.tsx", "utf8");
const operations = readFileSync("src/components/clinic/living-home-operations.tsx", "utf8");

describe("authenticated Living Home confidentiality", () => {
  it("does not ship routing/runtime engines to the browser", () => {
    for (const source of [home, operations]) {
      expect(source).not.toMatch(/from\s+["']@\/lib\/orchestration\/intent-engine["']/);
      expect(source).not.toMatch(/from\s+["']@\/lib\/orchestration\/path-engine["']/);
    }
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/authenticated-living-home-confidentiality.test.ts
```

Expected on the baseline: FAIL. `living-home.tsx` imports `intent-engine` and `path-engine`; `living-home-operations.tsx` imports `path-engine`.

- [ ] **Step 3: Commit the RED contract**

```bash
git add tests/authenticated-living-home-confidentiality.test.ts
git commit -m "test(security): lock authenticated Living Home confidentiality"
```

### Task 2: Define strict authenticated intent and Path-presentation DTOs

**Files:**
- Create: `src/lib/orchestration/living-home-intent-dto.ts`
- Create: `src/lib/orchestration/living-home-path-dto.ts`
- Create: `tests/living-home-intent-dto.test.ts`
- Create: `tests/living-home-path-dto.test.ts`

**Interfaces:**

```ts
import { z } from "zod";

export const livingHomeIntentResolutionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("path"),
    pathId: z.string().min(1).max(120),
    requiresClarification: z.boolean(),
    clarification: z.string().min(1).max(500).nullable(),
  }).strict(),
  z.object({
    kind: z.literal("surface"),
    answer: z.string().min(1).max(800),
    label: z.string().min(1).max(100),
    href: z.string().startsWith("/").max(500),
  }).strict(),
  z.object({
    kind: z.literal("clarification"),
    question: z.string().min(1).max(500),
  }).strict(),
]);
```

Path presentation:

```ts
export const livingHomePathPresentationSchema = z.object({
  instanceId: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  goal: z.string().min(1).max(500),
  progressPercent: z.number().int().min(0).max(100),
  state: z.enum(["active", "blocked", "paused", "completed"]),
  href: z.string().startsWith("/").max(500),
}).strict();
```

- [ ] **Step 1: Write RED strict-schema tests**

Include a mutation that adds `hiddenWeights`, `currentNodeId`, `completedNodeIds`, `capabilityKey`, or `pathRuntime` and prove it is rejected.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/living-home-intent-dto.test.ts tests/living-home-path-dto.test.ts
```

- [ ] **Step 3: Implement exactly with Zod strict schemas**

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- tests/living-home-intent-dto.test.ts tests/living-home-path-dto.test.ts
git add src/lib/orchestration/living-home-intent-dto.ts src/lib/orchestration/living-home-path-dto.ts tests
git commit -m "feat(security): define Living Home presentation DTOs"
```

### Task 3: Add server-owned intent resolution

**Files:**
- Create: `src/app/api/living-home/intent/route.ts`
- Create: `src/lib/orchestration/resolve-living-home-intent.ts`
- Create: `tests/living-home-intent-route.test.ts`
- Reuse: `src/lib/orchestration/intent-engine.ts`
- Reuse: `src/features/zumi/deterministic-answer.ts`
- Reuse: `src/lib/auth/session.ts`

**Interfaces:**

```ts
export async function resolveLivingHomeIntent(input: {
  text: string;
  role: ClinicRole;
}): Promise<LivingHomeIntentResolution>;
```

HTTP request body:

```ts
z.object({ text: z.string().trim().min(2).max(2000) }).strict()
```

- [ ] **Step 1: Write RED resolver tests**

Prove one known Path intent, one known surface intent, and one ambiguous intent produce exactly one DTO branch and no candidate arrays/weights.

- [ ] **Step 2: Write RED route tests**

Require `requireClinicSession()`, strict body parser, `Cache-Control: no-store`, 400 for invalid text, and normal session denial for unauthenticated access.

- [ ] **Step 3: Implement server resolver**

```ts
const resolved = resolveIntentDeterministically(text);
const pathId = resolved.candidatePathIds[0] ?? null;
if (pathId) {
  return {
    kind: "path",
    pathId,
    requiresClarification: resolved.requiresClarification,
    clarification: resolved.clarificationQuestions[0] ?? null,
  };
}
const surface = resolveSurfaceLookup(text, role);
if (surface) return { kind: "surface", ...surface };
return {
  kind: "clarification",
  question: resolved.clarificationQuestions[0] ?? "Tell Klinikos what you are trying to get done.",
};
```

- [ ] **Step 4: Implement route with `NextResponse.json`**

Return only `livingHomeIntentResolutionSchema.parse(...)` output.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/living-home-intent-route.test.ts tests/living-home-intent-dto.test.ts
git add src/app/api/living-home/intent/route.ts src/lib/orchestration/resolve-living-home-intent.ts tests
git commit -m "feat(security): resolve authenticated Living Home intent server-side"
```

### Task 4: Project Path runtime server-side and return safe presentation from Path APIs

**Files:**
- Create: `src/lib/orchestration/living-home-path-presentation.ts`
- Create: `tests/living-home-path-presentation.test.ts`
- Modify: `src/app/api/paths/route.ts`
- Modify: `src/app/api/paths/[instanceId]/route.ts`
- Modify: `src/app/api/paths/[instanceId]/advance/route.ts`
- Modify: `src/app/(platform)/dashboard/page.tsx`
- Reuse: `src/lib/orchestration/path-engine.ts`
- Reuse: `src/lib/paths/catalog.ts`
- Reuse: `src/lib/orchestration/path-guidance-engine.ts`

**Interfaces:**

```ts
import "server-only";

export function projectLivingHomePath(
  snapshot: PersistedPathSnapshot,
): LivingHomePathPresentation;
```

Projection algorithm:

1. resolve the current path definition with `getKlinikosPath(snapshot.pathId)`;
2. fail closed if no definition;
3. calculate runtime with `resolvePathRuntime({ pathId: snapshot.pathId, snapshot })`;
4. return `instanceId`, `definition.title`, `snapshot.goal`, rounded `runtime.progress * 100`, snapshot state, and `/paths/${snapshot.instanceId}`;
5. validate through `livingHomePathPresentationSchema` before returning.

- [ ] **Step 1: Write RED projection tests**

Prove a known snapshot produces the correct percentage and omits raw runtime fields/current node/capability data.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/living-home-path-presentation.test.ts
```

- [ ] **Step 3: Implement server-only projector**

- [ ] **Step 4: Change Path API responses used by Living Home**

Where the create/get/advance routes currently return snapshots, add a `presentation` field produced server-side. Preserve existing snapshot field only for callers that still require it; do not broaden its use in Living Home.

- [ ] **Step 5: Dashboard initial load**

Project `activePaths` to `pathPresentations` server-side and pass those to Living Home alongside existing server-generated guidance.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- tests/living-home-path-presentation.test.ts tests/route-registry.test.ts
npm run type-check
git add src/lib/orchestration/living-home-path-presentation.ts src/app/api/paths src/app/'(platform)'/dashboard/page.tsx tests
git commit -m "feat(security): project Path runtime server-side"
```

### Task 5: Remove client engines and raw runtime evaluation

**Files:**
- Modify: `src/components/clinic/living-home.tsx`
- Modify: `src/components/clinic/living-home-operations.tsx`
- Modify: `tests/authenticated-living-home-confidentiality.test.ts`
- Modify: existing Living Home regression tests.

- [ ] **Step 1: Replace client intent evaluation**

`submitIntent` POSTs `{ text }` to `/api/living-home/intent`, parses `LivingHomeIntentResolution`, and uses the returned `pathId` only as input to the existing server Path-start API.

- [ ] **Step 2: Store/render Path presentations, not `resolvePathRuntime(...)` output**

`LivingHomeOperations` uses `LivingHomePathPresentation[]` for Continue title/goal/progress/href. Remove its imports of `path-engine` and `getKlinikosPath` if no other UI behavior still requires the catalog.

- [ ] **Step 3: Handle path creation/advance responses**

When an API mutation succeeds, update the local presentation from `response.data.presentation`; never evaluate runtime in the browser.

- [ ] **Step 4: Run confidentiality and Living Home tests**

```bash
npm test -- tests/authenticated-living-home-confidentiality.test.ts tests/living-home-path-presentation.test.ts
npm run security:check
```

Expected: no authenticated Living Home `intent-engine` or `path-engine` browser finding.

- [ ] **Step 5: Run code gates and commit**

```bash
npm run type-check
npm run lint
npm test -- --run
npm run build
git add src/components/clinic/living-home.tsx src/components/clinic/living-home-operations.tsx tests
git commit -m "fix(security): keep authenticated routing engines server-side"
```

### Task 6: Reconcile open PR/migration authority before branch protection

**Files:**
- Modify: `docs/FEATURE_STATUS.md` only if verified status changed.
- Modify: `docs/PRODUCTION_ENVIRONMENT_TRUTH.md` only if runtime evidence changed.
- Review: every open PR at implementation time, initially including #281, #282, #288, #293, #294.

- [ ] **Step 1: Re-fetch exact current main and open PRs**

Record SHA, base/head, mergeability, migrations, and file overlap. Explicitly verify whether merged BodyMap #295 fully supersedes #288 before closing it.

- [ ] **Step 2: Classify every open PR**

Use only:

```text
MERGE CANDIDATE AFTER REBASE
KEEP OPEN AS FUTURE DEPENDENCY
SUPERSEDED / CLOSE
BLOCKED BY VERIFICATION
```

If a PR is proven superseded, close it with a reason linking the merged replacement. Do not close merely because it is old.

- [ ] **Step 3: Inspect fresh Quality workflow evidence**

Use current exact-head workflow runs. A run with no assigned runner/steps is `INFRASTRUCTURE UNAVAILABLE`, not code failure/success.

- [ ] **Step 4: Do not modify `.github/workflows/quality.yml` unless evidence shows a workflow defect**

Current file already documents the account-level Actions condition and contains jobs `verify` and `deploy-contract`.

- [ ] **Step 5: Commit only evidence-backed truth-doc changes**

### Task 7: Branch-protection operator gate

**Files:** no repository file change required unless governance documentation records the step.

- [ ] **Step 1: Prove hosted checks execute on a current PR**

Both `Quality / verify` and `Quality / deploy-contract` must receive a runner and execute their steps. Green is required before making them mandatory.

- [ ] **Step 2: Configure `main` in GitHub Settings → Branches / Rulesets**

Because the connected GitHub tool in this environment does not expose branch-protection mutation, this is an operator-only action:

1. target branch `main`;
2. require pull request before merging;
3. require status checks before merging;
4. select `Quality / verify`;
5. select `Quality / deploy-contract`;
6. require branch to be up to date before merging;
7. block force pushes;
8. block branch deletion;
9. dismiss stale approvals on new commits if reviewer workflow is being used.

Do not mark this complete until branch metadata reports `protected: true` and required checks are present.

### Task 8: Final verification and PR

- [ ] **Step 1: Reconcile newest main**

- [ ] **Step 2: Run fresh local/repository evidence**

```bash
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

When a verified disposable DB is available, run `npm run verify:release`. Also run `npm run verify:production` read-only against the deployed environment.

- [ ] **Step 3: Browser QA authenticated Living Home**

Prove deterministic routing without paid model provider, Path start, Path Continue progress, surface lookup, clarification, mobile composer, and no confidential engine in emitted client chunks/security scan.

- [ ] **Step 4: PR evidence**

State exact local gate results, hosted Quality state, production verification state, and whether the operator-only branch-protection step is still outstanding.
