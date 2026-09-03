# P02 — Public Value / Free Person Growth / Signup Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and prove the existing value-before-signup → free Person → resumed-goal journey, add privacy-minimized funnel evidence, and avoid building a duplicate continuation/auth system.

**Architecture:** Current `main` already implements most of P02. Public Path projections expose `continuationHref: /member?path=...`; `PublicLivingUniverseObjectStage` renders value and `Join free and start here`; `safeMemberReturnTo/safePersonReturnTo` validate the destination; canonical signup creates only Person/Account/session/legal evidence; `/member?path=...` re-resolves the Path through `klinikosPathCatalog`; `getMemberHomeProjection()` offers `Continue this path` only through person-safe route rules. P02 **reuses those exact rails**. `src/lib/distribution/public-continuation.ts` remains the one bounded public continuation helper; no `entry-intent.ts`, signed intent cookie, duplicate return parser, or second signup rail is added in W1.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, TypeScript 5.9.2, Prisma/PostgreSQL, existing Path catalog, Person auth/session/legal-release rails, public Zumi deterministic + provider paths, Vitest, Quality/deploy-contract.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p02-person-growth-engine-design.md`

## Global Constraints

- **REUSE before build-new.** Existing Path continuation is the P02 continuation mechanism unless a failing accepted requirement proves otherwise.
- Person account remains free; no card or organization subscription is required to create one Person identity.
- Raw anonymous free text is potentially sensitive and never enters continuation URLs, localStorage, durable funnel telemetry, or member Path parameters.
- Public continuation is navigation context only, never authority.
- After authentication the server re-resolves the requested Path and its person-safe entry route.
- Self-asserted clinic ownership, profession, student status, or other role creates no verification, membership, tenant authority, enrollment truth, clinical authority, or Grid eligibility.
- Preserve current Terms/Privacy/versioned acceptance and `getMemberSignupReleaseState()`; UI code cannot independently open public signup.
- External public AI may be degraded/unavailable; deterministic public value and Path projection remain usable.
- No fabricated jobs, clinicians, placements, availability, revenue, customer outcomes, or network density.
- P01 WebGL is optional presentation; acquisition/continuation must work in Precision/no-WebGL mode.
- P16 disclosure/security gates are merge blockers.
- Every code task follows RED → GREEN and ends with an independently reviewable commit.

---

### Task 1: Lock the existing P02 reuse contract

**Files:**
- Create: `tests/person-growth-engine-contract.test.ts`
- Read/Test existing:
  - `src/lib/orchestration/public-living-universe.ts`
  - `src/components/marketing/public-living-universe-stage.tsx`
  - `src/lib/auth/return-to.ts`
  - `src/app/signup/page.tsx`
  - `src/app/api/account/signup/route.ts`
  - `src/app/member/page.tsx`
  - `src/lib/member/member-home-repository.ts`
  - `src/lib/distribution/public-continuation.ts`

**Interfaces:**
- Machine-locks current continuation/auth reuse and forbids silent `SignupV2`/`entry-intent` duplication.

- [ ] **Step 1: Write the contract test**

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (p: string) => readFileSync(p, "utf8");

describe("P02 reuse contract", () => {
  it("uses the canonical Path continuation", () => {
    expect(read("src/lib/orchestration/public-living-universe.ts")).toContain("continuationHrefForPathId");
    expect(read("src/lib/orchestration/public-living-universe.ts")).toContain("/member?path=");
    expect(read("src/components/marketing/public-living-universe-stage.tsx")).toContain("Join free and start here");
    expect(read("src/lib/auth/return-to.ts")).toContain("safeMemberReturnTo");
    expect(read("src/app/member/page.tsx")).toContain("klinikosPathCatalog.find");
    expect(read("src/lib/member/member-home-repository.ts")).toContain("Continue this path");
  });
  it("does not create parallel signup or intent-token rails", () => {
    expect(existsSync("src/app/signup-v2/page.tsx")).toBe(false);
    expect(existsSync("src/lib/auth/entry-intent.ts")).toBe(false);
    expect(existsSync("src/app/api/account/entry-intent/route.ts")).toBe(false);
  });
});
```

- [ ] **Step 2: Run existing + new baselines**

```bash
npx vitest run \
  tests/person-growth-engine-contract.test.ts \
  tests/public-free-entry-truthfulness.test.ts \
  tests/person-account-login-continuity.test.ts \
  tests/member-signup-legal-evidence-contract.test.ts \
  src/lib/distribution/public-continuation.test.ts
```

Expected: PASS on current behavior; any failure identifies drift before P02 changes.

- [ ] **Step 3: Commit**

```bash
git add tests/person-growth-engine-contract.test.ts
git commit -m "test(growth): lock P02 reuse contract"
```

---

### Task 2: Prove value-before-signup and exact canonical Path continuation

**Files:**
- Create: `tests/public-value-before-signup.test.ts`
- Modify only if a test proves a defect:
  - `src/lib/orchestration/public-living-universe.ts`
  - `src/components/marketing/public-living-universe-stage.tsx`
  - `src/lib/marketing/public-living-actions.ts`

**Interfaces:**
- `projectPublicLivingUniverseForActionId(actionId)` → `PublicLivingUniverseProjection | null`.
- `continuationHrefForPathId(pathId)` → `/member?path=<catalog-id> | null`.

- [ ] **Step 1: Write the table-driven test**

```ts
import { describe, expect, it } from "vitest";
import { PUBLIC_LIVING_ACTIONS } from "@/lib/marketing/public-living-actions";
import { projectPublicLivingUniverseForActionId } from "@/lib/orchestration/public-living-universe";

const intentionallyUnmapped = new Set(["learn"]);

describe("public value before signup", () => {
  it("projects truthful Path value before asking for an account", () => {
    for (const action of PUBLIC_LIVING_ACTIONS) {
      const result = projectPublicLivingUniverseForActionId(action.id);
      if (intentionallyUnmapped.has(action.id)) {
        expect(result).toBeNull();
        continue;
      }
      expect(result, action.id).not.toBeNull();
      expect(result!.title.length).toBeGreaterThan(0);
      expect(result!.summary.length).toBeGreaterThan(0);
      expect(result!.governance.length).toBeGreaterThan(0);
      expect(result!.continuationHref).toBe(`/member?path=${encodeURIComponent(result!.pathId)}`);
      expect(["available_now", "requires_setup", "requires_verification", "requires_organization_connection", "defined"])
        .toContain(result!.availability);
    }
  });
});
```

If additional actions are intentionally unmapped on current main, add them to `intentionallyUnmapped` only when the approved product truth genuinely says the visitor has not provided enough context; do not use this set to hide a broken mapping.

- [ ] **Step 2: Add source assertion for the semantic CTA**

```ts
import { readFileSync } from "node:fs";
const stage = readFileSync("src/components/marketing/public-living-universe-stage.tsx", "utf8");
expect(stage).toContain('const signupHref = `/signup?returnTo=${encodeURIComponent(item.continuationHref)}`');
expect(stage).toContain("Join free and start here");
expect(stage).toContain("Joining costs nothing and is not a credential.");
```

- [ ] **Step 3: Run RED/verification**

```bash
npx vitest run tests/public-value-before-signup.test.ts tests/public-living-home.test.ts
```

- [ ] **Step 4: Repair only real mapping/copy defects**

A valid fix changes the existing server map/catalog projection or semantic stage. Do not invent a new Path ID or turn `requires_*`/`defined` into `available_now`.

- [ ] **Step 5: Run GREEN and commit**

```bash
npx vitest run \
  tests/public-value-before-signup.test.ts \
  tests/public-living-universe-reference-parity.test.ts \
  tests/public-living-universe-persistent-stage.test.ts \
  tests/public-living-home.test.ts
git add tests/public-value-before-signup.test.ts src/lib/orchestration/public-living-universe.ts src/components/marketing/public-living-universe-stage.tsx src/lib/marketing/public-living-actions.ts
git commit -m "test(growth): prove value before signup"
```

---

### Task 3: Prove signup/login preserve only safe Person Path context

**Files:**
- Create: `tests/person-path-auth-continuity.test.ts`
- Reuse/modify only if a defect is proven:
  - `src/lib/auth/return-to.ts`
  - `src/app/signup/page.tsx`
  - `src/app/signup/signup-form.tsx`
  - `src/app/login/page.tsx`
  - `src/components/clinic/login-form.tsx`
  - `src/app/api/account/signup/route.ts`

**Interfaces:**
- `safeMemberReturnTo(value)` accepts only `/member` or `/member?path=<known-catalog-id>`.
- `safePersonReturnTo(value)` accepts only safe member, `/grid`, `/edu` targets.

- [ ] **Step 1: Write exact return-target tests**

```ts
import { describe, expect, it } from "vitest";
import { safeMemberReturnTo, safePersonReturnTo } from "@/lib/auth/return-to";
import { klinikosPathCatalog } from "@/lib/paths/catalog";

describe("Person Path auth continuity", () => {
  const pathId = klinikosPathCatalog[0]!.id;
  it("preserves one known Path", () => {
    const target = `/member?path=${encodeURIComponent(pathId)}`;
    expect(safeMemberReturnTo(target)).toBe(target);
    expect(safePersonReturnTo(target)).toBe(target);
  });
  it("rejects unknown/ambiguous/external return targets", () => {
    expect(safePersonReturnTo("/member?path=not-real")).toBeNull();
    expect(safePersonReturnTo(`/member?path=${pathId}&path=${pathId}`)).toBeNull();
    expect(safePersonReturnTo("//evil.example/member")).toBeNull();
    expect(safePersonReturnTo("https://evil.example/member")).toBeNull();
  });
});
```

- [ ] **Step 2: Add source-level authority separation assertions**

```ts
import { readFileSync } from "node:fs";
const signup = readFileSync("src/app/api/account/signup/route.ts", "utf8");
const login = readFileSync("src/app/login/page.tsx", "utf8");
expect(login).toContain("safeClinicReturnTo");
expect(login).toContain("safePersonReturnTo");
for (const forbiddenCreation of ["organization.create", "membership.create", "provider.create", "patient.create"])
  expect(signup).not.toContain(forbiddenCreation);
```

- [ ] **Step 3: Run**

```bash
npx vitest run \
  tests/person-path-auth-continuity.test.ts \
  tests/person-account-login-continuity.test.ts \
  tests/member-signup-legal-evidence-contract.test.ts \
  tests/person-account-authentication.test.ts
```

- [ ] **Step 4: Fix only server-owned defects and re-run**

Do not move redirect validation to the client and do not weaken the signup release/legal gate.

- [ ] **Step 5: Commit**

```bash
git add tests/person-path-auth-continuity.test.ts src/lib/auth/return-to.ts src/app/signup src/app/login src/components/clinic/login-form.tsx src/app/api/account/signup/route.ts
git commit -m "test(auth): prove safe free Person continuation"
```

---

### Task 4: Prove member re-resolution never turns query input into authority

**Files:**
- Create: `tests/member-path-reresolution.test.ts`
- Reuse/modify only if a defect is proven:
  - `src/app/member/page.tsx`
  - `src/lib/member/member-home-repository.ts`
  - `src/lib/member/member-action-routes.ts`

**Interfaces:**
- `getMemberHomeProjection(session, requestedPathId?)` resolves `requestedPathId` back through `klinikosPathCatalog`.
- Person-safe action is generated through `personEntryHrefForPath()` then `isAllowedMemberActionHref()`.

- [ ] **Step 1: Write repository/source contract**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("src/app/member/page.tsx", "utf8");
const repo = readFileSync("src/lib/member/member-home-repository.ts", "utf8");

describe("member Path re-resolution", () => {
  it("treats query Path as navigation rather than evidence", () => {
    expect(page).toContain("klinikosPathCatalog.find");
    expect(repo).toContain("klinikosPathCatalog.find");
    expect(repo).toContain("personEntryHrefForPath");
    expect(repo).toContain("isAllowedMemberActionHref");
    expect(repo).toContain("navigation input, never evidence");
  });
  it("keeps authority separation visible", () => {
    expect(repo).toContain("not a license, organization role, patient relationship, Grid eligibility decision, or payment authority");
  });
});
```

- [ ] **Step 2: Add behavior test with existing repository mocks/fixtures**

Use the same Prisma mock style as current member/account tests. Call `getMemberHomeProjection()` with one valid catalog Path and one invalid ID. Assert valid input emits `continue-path` and invalid input emits no `continue-path`; neither changes claims/verification status.

The committed test must contain real mock calls and assertions—remove any scaffolding comments before commit.

- [ ] **Step 3: Run and fix**

```bash
npx vitest run tests/member-path-reresolution.test.ts tests/living-universe-member-home.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add tests/member-path-reresolution.test.ts src/app/member/page.tsx src/lib/member
git commit -m "test(member): prove Path re-resolution"
```

---

### Task 5: Add privacy-minimized funnel counters without a surveillance data model

**Files:**
- Create: `prisma/models/public-growth.prisma`
- Create: migration under `prisma/migrations/<timestamp>_public_growth_daily_counter/migration.sql`
- Create: `src/lib/distribution/public-growth-events.ts`
- Create: `src/lib/repositories/public-growth-repository.ts`
- Create: `tests/public-growth-telemetry.test.ts`
- Modify: `src/app/api/zumi/public/route.ts`
- Modify: `src/app/api/account/signup/route.ts`
- Modify: `src/app/member/page.tsx`

**Interfaces:**
- Daily aggregate only; no user/session/prompt/email/name/IP columns.
- Events: `PUBLIC_FIRST_VALUE | PUBLIC_NO_RESULT | FREE_SIGNUP_COMPLETED | PERSON_PATH_RESUMED`.
- `recordPublicGrowthEvent({ eventType, pathId?, day? }): Promise<void>` increments one aggregate row.

- [ ] **Step 1: Write the RED telemetry/privacy test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/models/public-growth.prisma", "utf8");
const events = readFileSync("src/lib/distribution/public-growth-events.ts", "utf8");

describe("P02 funnel telemetry", () => {
  it("stores aggregate counts without user-level tracking", () => {
    for (const required of ["day", "eventType", "count"]) expect(schema).toContain(required);
    for (const forbidden of ["personId", "accountId", "sessionId", "email", "ipAddress", "userAgent", "prompt", "question", "metadata"])
      expect(schema).not.toContain(forbidden);
  });
  it("accepts only controlled event names", () => {
    for (const name of ["PUBLIC_FIRST_VALUE", "PUBLIC_NO_RESULT", "FREE_SIGNUP_COMPLETED", "PERSON_PATH_RESUMED"])
      expect(events).toContain(name);
  });
});
```

- [ ] **Step 2: Add the aggregate model**

```prisma
model PublicGrowthDailyCounter {
  id        String   @id @default(cuid())
  day       DateTime @db.Date
  eventType String
  pathId    String   @default("")
  count     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([day, eventType, pathId])
  @@index([eventType, day])
  @@map("public_growth_daily_counters")
}
```

Migration must create the table, unique key, and index only; no PII columns.

- [ ] **Step 3: Add typed event registry and repository**

```ts
// src/lib/distribution/public-growth-events.ts
export const PUBLIC_GROWTH_EVENT_TYPES = [
  "PUBLIC_FIRST_VALUE", "PUBLIC_NO_RESULT", "FREE_SIGNUP_COMPLETED", "PERSON_PATH_RESUMED",
] as const;
export type PublicGrowthEventType = typeof PUBLIC_GROWTH_EVENT_TYPES[number];
```

```ts
// src/lib/repositories/public-growth-repository.ts
import "server-only";
import { db } from "@/lib/db";
import type { PublicGrowthEventType } from "@/lib/distribution/public-growth-events";

export async function recordPublicGrowthEvent(input: { eventType: PublicGrowthEventType; pathId?: string; day?: Date }) {
  const d = input.day ?? new Date();
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const pathId = input.pathId?.trim().slice(0, 120) ?? "";
  await db.publicGrowthDailyCounter.upsert({
    where: { day_eventType_pathId: { day, eventType: input.eventType, pathId } },
    create: { day, eventType: input.eventType, pathId, count: 1 },
    update: { count: { increment: 1 } },
  });
}
```

Before recording a non-empty `pathId`, callers must obtain it from a server-owned `PublicLivingUniverseProjection` or `klinikosPathCatalog`; never pass arbitrary request text.

- [ ] **Step 4: Instrument only server-confirmable boundaries**

In `/api/zumi/public`, after computing a non-null `universe`, fire-and-forget `PUBLIC_FIRST_VALUE` with `universe.pathId`; when the turn truthfully produces no universe/routeable result, record `PUBLIC_NO_RESULT`. Do not let telemetry failure fail the public answer:

```ts
void recordPublicGrowthEvent({ eventType: universe ? "PUBLIC_FIRST_VALUE" : "PUBLIC_NO_RESULT", pathId: universe?.pathId })
  .catch(() => undefined);
```

In canonical signup route, after successful Person transaction/session creation, record `FREE_SIGNUP_COMPLETED` with no path/user identifier.

In `/member`, after `requestedPath` is resolved from the catalog, record `PERSON_PATH_RESUMED` with `requestedPath.id`; do not pass account/person/session identifiers.

- [ ] **Step 5: Run migration/test/security verification**

```bash
npm run db:generate
npm run db:validate
npx vitest run tests/public-growth-telemetry.test.ts
npm run security:check
npm run type-check
```

- [ ] **Step 6: Commit**

```bash
git add prisma src/lib/distribution/public-growth-events.ts src/lib/repositories/public-growth-repository.ts tests/public-growth-telemetry.test.ts src/app/api/zumi/public/route.ts src/app/api/account/signup/route.ts src/app/member/page.tsx
git commit -m "feat(growth): add privacy-safe funnel evidence"
```

---

### Task 6: Prove degraded states, run P16 gates, and reconcile exact-head P02 truth

**Files:**
- Create: `tests/person-growth-engine-degraded-states.test.ts`
- Modify only if a test proves a defect:
  - `src/components/marketing/public-living-gateway.tsx`
  - `src/components/marketing/public-living-universe-stage.tsx`
  - `src/app/signup/page.tsx`
  - `src/app/member/page.tsx`
  - `scripts/verify-frontend-browser-interactions.mjs`
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`

**Interfaces:**
- Proves no-result, provider outage, signup-disabled, invalid Path, no-WebGL, mobile/reduced-motion paths.

- [ ] **Step 1: Write degraded-state source/behavior test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stage = readFileSync("src/components/marketing/public-living-universe-stage.tsx", "utf8");
const publicRoute = readFileSync("src/app/api/zumi/public/route.ts", "utf8");

describe("P02 degraded states", () => {
  it("keeps a deterministic public path when paid public inference is unavailable", () => {
    expect(publicRoute).toContain("if (!publicZumiDurableQuotaAttested(request))");
    expect(publicRoute).toContain("resolvePublicLivingIntent");
    expect(publicRoute).toContain("degraded: true");
  });
  it("does not fake enabled signup", () => {
    expect(stage).toContain("View free membership status");
    expect(stage).toContain("Account creation remains closed until its release evidence is complete.");
  });
});
```

Add browser assertions for 390px, keyboard, reduced motion, and P01 forced Precision/no-WebGL. The journey must reach public value/status/signup and member continuation without interacting with canvas.

- [ ] **Step 2: Run complete local release suite**

```bash
npm run security:check
npm run governance:traceability
npm run db:generate
npm run db:validate
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
```

- [ ] **Step 3: Update existing P02 traceability record**

Record reused continuation files, exact new tests, aggregate KPI evidence, P16 gates, and any minimal defects fixed. Do not create a separate P02 status registry.

- [ ] **Step 4: Keep environment-level release truth separate**

`getMemberSignupReleaseState().enabled` remains the authority for whether free signup is actually open in a deployment. CI green means implementation evidence, not public release approval.

- [ ] **Step 5: Push final candidate and require exact-head GitHub Quality**

Both `Quality / verify` and `Quality / deploy-contract` must pass on the same final SHA.

- [ ] **Step 6: Commit evidence**

```bash
git add tests/person-growth-engine-degraded-states.test.ts scripts/verify-frontend-browser-interactions.mjs docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json
git commit -m "docs(governance): record P02 growth-engine evidence"
```

## P02 Definition of Done

P02 is complete only when:

1. mapped visitors receive truthful public-safe Path value before signup;
2. continuation reuses canonical `/member?path=<catalog-id>` rather than a duplicate token/auth system;
3. signup/login preserve only server-validated Person continuation;
4. `/member` re-resolves the Path and routes only through person-safe action rules;
5. Path/query input never creates verification, eligibility, membership, tenant, professional, patient, clinical, billing, or payment authority;
6. raw anonymous prompt text never enters continuation URLs, durable funnel telemetry, or member Path state;
7. funnel evidence is daily aggregate only and stores no user/session/PII identifiers;
8. signup-disabled, no-result, provider-degraded, invalid-Path, mobile, reduced-motion, and no-WebGL states are truthful and complete;
9. P16 disclosure/security gates pass;
10. exact-head `Quality / verify` and `Quality / deploy-contract` are green;
11. implementation readiness is not misrepresented as public membership release approval.
