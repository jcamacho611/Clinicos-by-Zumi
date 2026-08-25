# Zero-Cost Production Failover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Klinikos deployable to a zero-cost Vercel Next.js runtime from the existing GitHub repository without changing the production database, losing any current `main` work, or allowing the host build to mutate production schema.

**Architecture:** Keep Neon and all Klinikos domain/runtime contracts intact. Add a small Vercel deployment contract that runs the ordinary Next.js build only, extend `/api/health` to report Vercel release identity, and add static contract tests plus an incident runbook. Existing Render configuration remains intact as rollback/reference until custom-domain cutover is verified.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, Node.js, Prisma 6.14, Vitest 3.2.4, Vercel native Next.js hosting, Neon Postgres.

**Spec:** `docs/superpowers/specs/2026-08-25-zero-cost-production-failover-design.md`

## Global Constraints

- Preserve the entire existing `main` history and all intentional product work.
- Do not create a second Klinikos application or duplicate domain systems.
- Vercel build must never execute `prisma migrate deploy`, `prisma db push`, or `npm run render:build`.
- Neon remains the production database authority.
- Existing Render service remains untouched until replacement deployment proves healthy.
- Missing external credentials preserve unavailable/pending truth; never invent production-live state.
- `klinikos.io` cutover occurs only after exact live SHA and smoke-test evidence.
- No production database mutation is part of this implementation plan.

---

### Task 1: Define the Vercel deployment contract

**Files:**
- Create: `vercel.json`
- Test: `tests/vercel-deployment-contract.test.ts`

**Interfaces:**
- Consumes: existing `npm run build` from `package.json` and existing non-Render `postinstall` behavior.
- Produces: a host configuration that tells Vercel to use the Next.js framework and ordinary application build while forbidding Render-specific or migration commands by contract test.

- [ ] **Step 1: Write the failing contract test**

Create `tests/vercel-deployment-contract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
const postinstall = readFileSync("scripts/postinstall.mjs", "utf8");

describe("Vercel production deployment contract", () => {
  it("uses the ordinary Next.js application build", () => {
    expect(vercel.framework).toBe("nextjs");
    expect(vercel.buildCommand).toBe("npm run build");
    expect(packageJson.scripts.build).toContain("next build");
  });

  it("does not run database migrations or the Render-specific build path", () => {
    const serialized = JSON.stringify(vercel);
    expect(serialized).not.toContain("migrate deploy");
    expect(serialized).not.toContain("db push");
    expect(serialized).not.toContain("render:build");
  });

  it("keeps non-Render postinstall limited to Prisma client generation", () => {
    const nonRenderBranch = postinstall.slice(postinstall.indexOf("} else {"));
    expect(nonRenderBranch).toContain('"generate"');
    expect(nonRenderBranch).not.toContain('"migrate"');
    expect(nonRenderBranch).not.toContain('"db", "push"');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails because `vercel.json` does not exist**

Run:

```bash
npx vitest run tests/vercel-deployment-contract.test.ts
```

Expected: FAIL reading `vercel.json`.

- [ ] **Step 3: Add the minimal Vercel configuration**

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build"
}
```

Do not set a migration command, output directory, custom Node server, or Render script.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npx vitest run tests/vercel-deployment-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add vercel.json tests/vercel-deployment-contract.test.ts
git commit -m "feat(release): add zero-cost Vercel deployment contract"
```

---

### Task 2: Make release identity host-portable

**Files:**
- Modify: `src/app/api/health/route.ts`
- Test: `tests/vercel-release-identity.test.ts`

**Interfaces:**
- Consumes: Render release variables, generic build stamp, Vercel system environment variables.
- Produces: `/api/health` release identity that can prove the actual GitHub commit on Render or Vercel without exposing secrets.

- [ ] **Step 1: Write the failing test**

Create `tests/vercel-release-identity.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const healthRoute = readFileSync("src/app/api/health/route.ts", "utf8");

describe("host-portable release identity", () => {
  it("recognizes Vercel Git release identity", () => {
    expect(healthRoute).toContain("VERCEL_GIT_COMMIT_SHA");
    expect(healthRoute).toContain("VERCEL_GIT_COMMIT_REF");
  });

  it("preserves Render and generic release identity fallbacks", () => {
    expect(healthRoute).toContain("RENDER_GIT_COMMIT");
    expect(healthRoute).toContain("RENDER_GIT_BRANCH");
    expect(healthRoute).toContain("GIT_COMMIT_SHA");
    expect(healthRoute).toContain("release-identity.json");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run tests/vercel-release-identity.test.ts
```

Expected: FAIL because Vercel environment names are absent.

- [ ] **Step 3: Extend the release identity resolution**

Update `nonSecretReleaseIdentity()` so commit resolution is:

```ts
const commit =
  process.env.RENDER_GIT_COMMIT?.trim() ||
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  process.env.GIT_COMMIT_SHA?.trim() ||
  stamp.commit?.trim() ||
  null;
```

and branch resolution is:

```ts
const branch =
  process.env.RENDER_GIT_BRANCH?.trim() ||
  process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
  stamp.branch?.trim() ||
  null;
```

Do not expose any other Vercel or provider environment values.

- [ ] **Step 4: Run focused release identity tests**

Run:

```bash
npx vitest run tests/vercel-release-identity.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/health/route.ts tests/vercel-release-identity.test.ts
git commit -m "fix(release): report Vercel commit identity in health"
```

---

### Task 3: Add the zero-cost failover runbook

**Files:**
- Create: `docs/ops/ZERO_COST_HOST_FAILOVER_2026-08-25.md`
- Test: `tests/zero-cost-host-failover-runbook.test.ts`

**Interfaces:**
- Consumes: the deployment contract from Task 1 and health identity from Task 2.
- Produces: an exact operator sequence that prevents DNS cutover before preview proof and prevents unverified environment flags from being copied blindly.

- [ ] **Step 1: Write the failing runbook contract test**

Create `tests/zero-cost-host-failover-runbook.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runbook = readFileSync("docs/ops/ZERO_COST_HOST_FAILOVER_2026-08-25.md", "utf8");

describe("zero-cost host failover runbook", () => {
  it("requires exact release proof before domain cutover", () => {
    expect(runbook).toContain("/api/health");
    expect(runbook).toContain("exact current `main` SHA");
    expect(runbook).toContain("Do not attach `klinikos.io`");
  });

  it("keeps database migrations outside the Vercel build", () => {
    expect(runbook).toContain("never runs production migrations");
    expect(runbook).toContain("Neon remains the production database");
  });

  it("requires truth-preserving environment transfer", () => {
    expect(runbook).toContain("Do not copy blank or unverified capability flags as `true`");
    expect(runbook).toContain("production-approved credentials");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails because the runbook is absent**

Run:

```bash
npx vitest run tests/zero-cost-host-failover-runbook.test.ts
```

Expected: FAIL reading the missing runbook.

- [ ] **Step 3: Write the runbook**

The runbook must contain these operator stages in order:

1. Incident truth: Render and GitHub Actions compute blocked; current production remains rollback/reference.
2. Vercel project creation from the existing `jcamacho611/Clinicos-by-Zumi` repository.
3. Core environment transfer: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_SECRET`, preview `NEXT_PUBLIC_APP_URL`.
4. Production-approved capability credentials copied only where already authoritative.
5. Explicit statement that the Vercel build never runs production migrations and Neon remains the production database.
6. Preview build from current `main`.
7. `/api/health` comparison against exact current `main` SHA.
8. Smoke checks: `/`, `/api/health`, `/login`, Living Home/dashboard, Grid, EDU, patient portal, provider/current-visit paths that are currently accessible in the intended environment.
9. Runtime error review.
10. Domain attachment only after proof.
11. HTTPS/cookie/auth/canonical validation on `klinikos.io`.
12. Rollback path that preserves Render until the replacement is stable.
13. A permanent anti-drift rule: merged does not equal deployed.

- [ ] **Step 4: Run the focused runbook test and verify it passes**

Run:

```bash
npx vitest run tests/zero-cost-host-failover-runbook.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/ops/ZERO_COST_HOST_FAILOVER_2026-08-25.md tests/zero-cost-host-failover-runbook.test.ts
git commit -m "docs(release): add zero-cost host failover runbook"
```

---

### Task 4: Verify the change set before merge

**Files:**
- No new files.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: merge evidence only; no claim of production deployment.

- [ ] **Step 1: Run focused tests**

```bash
npx vitest run tests/vercel-deployment-contract.test.ts tests/vercel-release-identity.test.ts tests/zero-cost-host-failover-runbook.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run existing release-sensitive tests**

```bash
npx vitest run tests/render-no-automatic-production-migrations.test.ts tests/production-migration-policy.test.mjs
```

Expected: PASS. The Vercel path must not weaken the existing Render migration boundary.

- [ ] **Step 3: Parse the Vercel config independently**

```bash
node -e 'const v=require("./vercel.json"); if(v.framework!=="nextjs"||v.buildCommand!=="npm run build") process.exit(1); console.log(v)'
```

Expected: exits 0 and prints the two intended contract values.

- [ ] **Step 4: Run source-level secret/migration scan**

```bash
node - <<'NODE'
const fs = require('fs');
const v = fs.readFileSync('vercel.json','utf8');
for (const forbidden of ['migrate deploy','db push','render:build']) {
  if (v.includes(forbidden)) throw new Error(`forbidden Vercel command: ${forbidden}`);
}
console.log('Vercel deployment contract is migration-free.');
NODE
```

Expected: PASS.

- [ ] **Step 5: Compare the branch to `main`**

Only these implementation surfaces should differ:

- `vercel.json`
- `src/app/api/health/route.ts`
- three focused tests
- the failover spec, plan, and runbook

No product-domain files should change.

- [ ] **Step 6: Open PR with explicit truth labels**

PR body must state:

- Vercel compatibility is code-ready.
- Vercel project/workspace connection is still an external setup gate until actually connected.
- No production deployment is claimed.
- No production database migration is performed by this change.
- Existing Render remains untouched.

---

### Task 5: External deployment and production proof

**Files:**
- No repository changes unless the preview build reveals a real compatibility defect.

**Interfaces:**
- Consumes: merged host-portable repository and a connected Vercel Hobby workspace with GitHub access.
- Produces: an actual preview deployment, then optionally a custom-domain production deployment after verification.

- [ ] **Step 1: Connect/import the existing GitHub repository in Vercel Hobby**

Use the existing repository, not a generated copy.

- [ ] **Step 2: Configure core environment values**

Configure the verified production Neon/auth values without inventing optional capability state.

- [ ] **Step 3: Deploy current `main` as preview**

Expected: Next.js build succeeds without any production migration command.

- [ ] **Step 4: Verify exact SHA**

Fetch preview `/api/health` and require:

```text
release.commit == exact current GitHub main SHA
status == ok
```

- [ ] **Step 5: Perform smoke checks**

Verify public and authorized critical paths from the runbook.

- [ ] **Step 6: Review runtime errors**

Any material 5xx/auth/database/provider error blocks domain cutover.

- [ ] **Step 7: Attach `klinikos.io` only after preview proof**

Update `NEXT_PUBLIC_APP_URL` to the canonical production URL as required by the deployed runtime, redeploy if Vercel requires a build-time value, and attach the custom domain.

- [ ] **Step 8: Verify production**

Require HTTPS, canonical domain, auth/cookie behavior, and exact `/api/health` SHA.

- [ ] **Step 9: Preserve rollback**

Do not delete the existing Render service during the stabilization window.

## Self-review

- Spec coverage: all design requirements map to Tasks 1-5.
- No placeholders: no TBD/TODO steps remain.
- Type/variable consistency: Vercel environment names match Vercel's documented Git metadata variables; existing Render and generic fallbacks remain unchanged.
- Product scope: no Care/Grid/EDU/Zumi/clinical/business behavior is modified by the failover implementation.
