# P02 — Public Value / Free Person Growth / Signup Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the existing value-before-signup → free Person → resumed-goal path without creating a second continuation/auth system, while proving conversion, privacy, truthful empty states, and authority separation.

**Architecture:** Current `main` already contains the core P02 substrate: public Path projection with `continuationHref: /member?path=...`, `PublicLivingUniverseObjectStage` with `Join free and start here`, canonical `/signup`, `safePersonReturnTo`, Person account/session creation, `/member?path=...`, and `getMemberHomeProjection(..., requestedPathId)` which re-resolves the catalog Path server-side and exposes a governed `Continue this path` action. P02 therefore **reuses and generalizes those rails**. `src/lib/distribution/public-continuation.ts` remains the one low-sensitivity public continuation helper for protected public destinations; no signed entry-intent cookie, duplicate `entry-intent.ts`, or second auth rail is added in W1 unless a later test proves the existing bounded Path continuation cannot satisfy a required case.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, TypeScript 5.9.2, Prisma/PostgreSQL, existing Path catalog, existing Person auth/session/legal-release rails, existing public Zumi route and deterministic resolver, Vitest, Quality/deploy-contract.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p02-person-growth-engine-design.md`

## Current Verified Reuse Targets

- `src/lib/orchestration/public-living-universe.ts`
  - `continuationHrefForPathId(pathId)` returns `/member?path=<canonical-id>` only after resolving the server-owned catalog.
  - `PublicLivingUniverseProjection.continuationHref` is typed as `/member?path=${string}`.
- `src/components/marketing/public-living-universe-stage.tsx`
  - renders public value before signup;
  - builds `/signup?returnTo=<continuationHref>`;
  - says `Join free and start here` when the release gate is enabled;
  - truthfully exposes availability/governance before signup.
- `src/lib/auth/return-to.ts`
  - `safeMemberReturnTo` accepts only `/member` or one catalog-validated `path` query parameter;
  - `safePersonReturnTo` limits Person continuation to `/member`, `/grid`, or `/edu`.
- `src/app/signup/page.tsx` + `src/app/signup/signup-form.tsx`
  - preserve safe Person `returnTo`;
  - remain fail-closed on current Terms/Privacy/release evidence;
  - canonical signup stays the only Person creation path.
- `src/app/api/account/signup/route.ts`
  - creates only Person + Account + session/legal evidence;
  - does not create organization, professional, patient, clinical, billing, payment, or Grid authority.
- `src/app/member/page.tsx`
  - validates requested Path against `klinikosPathCatalog` before passing it to the repository.
- `src/lib/member/member-home-repository.ts`
  - resolves the Path again server-side;
  - treats query-string Path as navigation input, never evidence;
  - creates a person-safe entry action only through `personEntryHrefForPath()` + `isAllowedMemberActionHref()`.
- `src/lib/distribution/public-continuation.ts`
  - already carries bounded low-sensitivity destination metadata across login for protected destinations;
  - never carries the raw Public Zumi prompt.

## Global Constraints

- **REUSE before build-new.** Do not create `src/lib/auth/entry-intent.ts`, an intent-continuation database, another return-to parser, or a parallel signup/auth rail unless a specific failing requirement proves the existing Path continuation is insufficient.
- Person account remains free. No card, organization subscription, or paid tier is required to create one Person identity.
- Raw anonymous free text is potentially sensitive. Never put raw public prompt text in continuation URLs, localStorage, browser analytics payloads, durable anonymous intent records, or member Path parameters.
- Public continuation is **navigation context, not authority**.
- After authentication the server must resolve the requested Path from the current catalog and then resolve the person-safe entry route under current state.
- Self-asserted role/ownership/student/professional claims create no verification, membership, tenant authority, enrollment truth, clinical authority, or Grid eligibility.
- Preserve versioned Terms/Privacy acceptance and `getMemberSignupReleaseState()`; P02 implementation cannot open public signup by UI change alone.
- Public Zumi may degrade or be unavailable; deterministic public value and Path projection remain usable.
- No fabricated jobs, clinicians, placements, availability, revenue, customer outcomes, or network density.
- P01 may enhance this journey visually but WebGL is never required for intent, value, signup, sign-in, continuation, errors, or the first authenticated action.
- P16 owns privacy/abuse/disclosure gates and is a merge blocker for P02.
- Every code task uses RED → GREEN TDD and ends in an independently reviewable commit.

---

### Task 1: Lock the P02 convergence contract against current implementation truth

**Files:**
- Create: `tests/person-growth-engine-contract.test.ts`
- Read/Test: `src/lib/orchestration/public-living-universe.ts`
- Read/Test: `src/components/marketing/public-living-universe-stage.tsx`
- Read/Test: `src/lib/auth/return-to.ts`
- Read/Test: `src/app/signup/page.tsx`
- Read/Test: `src/app/signup/signup-form.tsx`
- Read/Test: `src/app/api/account/signup/route.ts`
- Read/Test: `src/app/member/page.tsx`
- Read/Test: `src/lib/member/member-home-repository.ts`
- Read/Test: `src/lib/distribution/public-continuation.ts`

**Interfaces:**
- Produces a machine-enforced contract that the existing continuation substrate remains the P02 rail and that a duplicate token/cookie/identity system cannot silently appear.

- [ ] **Step 1: Add the contract test**

Require all of the following:

```ts
expect(source("src/lib/orchestration/public-living-universe.ts")).toContain("continuationHrefForPathId");
expect(source("src/lib/orchestration/public-living-universe.ts")).toContain("/member?path=");
expect(source("src/components/marketing/public-living-universe-stage.tsx")).toContain("Join free and start here");
expect(source("src/lib/auth/return-to.ts")).toContain("safeMemberReturnTo");
expect(source("src/app/member/page.tsx")).toContain("klinikosPathCatalog.find");
expect(source("src/lib/member/member-home-repository.ts")).toContain("Continue this path");
expect(source("src/lib/distribution/public-continuation.ts")).toContain("raw Public Zumi prompt never belongs in the URL");
expect(existsSync("src/lib/auth/entry-intent.ts")).toBe(false);
expect(existsSync("src/app/api/account/entry-intent/route.ts")).toBe(false);
```

Also assert the canonical Person signup route remains `src/app/api/account/signup/route.ts` and no `signup-v2` route exists.

- [ ] **Step 2: Run the contract + existing baselines**

```bash
npx vitest run \
  tests/person-growth-engine-contract.test.ts \
  tests/public-free-entry-truthfulness.test.ts \
  tests/person-account-login-continuity.test.ts \
  tests/member-signup-legal-evidence-contract.test.ts \
  src/lib/distribution/public-continuation.test.ts
```

Expected: existing behavior passes; only genuinely missing new P02 assertions may be RED.

- [ ] **Step 3: Commit**

```bash
git add tests/person-growth-engine-contract.test.ts
git commit -m "test(growth): lock P02 reuse contract"
```

---

### Task 2: Prove value-before-signup across every mapped public Path family

**Files:**
- Create: `tests/public-value-before-signup.test.ts`
- Modify only if tests expose a gap:
  - `src/lib/orchestration/public-living-universe.ts`
  - `src/components/marketing/public-living-universe-stage.tsx`
  - `src/components/marketing/public-living-gateway.tsx`
  - `src/lib/marketing/public-living-actions.ts`

**Interfaces:**
- Consumes server-owned `PublicLivingUniverseProjection`.
- Produces a truthful public Object Stage plus free-Person continuation for all supported Path projections.

- [ ] **Step 1: Write table-driven tests using the existing action vocabulary**

For each action with an intentionally mapped canonical Path, require:
- a public-safe projection exists;
- it exposes title/summary/from/to/availability/governance before signup;
- `continuationHref` equals `/member?path=<the same canonical path id>`;
- the CTA points to `/signup?returnTo=<encoded member continuation>`;
- availability wording never upgrades `defined`, `requires_setup`, `requires_verification`, or `requires_organization_connection` into `available_now`;
- no Person/credential/organization/patient authority is implied.

For intentionally unmapped generic actions such as broad `learn`, require a truthful non-fabricated state rather than inventing a clinical or placement Path.

- [ ] **Step 2: Run RED/verification**

```bash
npx vitest run tests/public-value-before-signup.test.ts
```

- [ ] **Step 3: Fix only proven coverage defects**

Prefer adding/reconciling an existing catalog mapping over inventing new Path IDs. If a goal cannot yet be mapped truthfully, preserve a conversation/no-result state.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run \
  tests/public-value-before-signup.test.ts \
  tests/public-living-universe-reference-parity.test.ts \
  tests/public-living-universe-persistent-stage.test.ts \
  tests/public-living-home.test.ts
```

- [ ] **Step 5: Commit only if code/test changes occurred**

```bash
git add tests/public-value-before-signup.test.ts src/lib/orchestration/public-living-universe.ts src/components/marketing src/lib/marketing/public-living-actions.ts
git commit -m "test(growth): prove public value before signup"
```

---

### Task 3: Prove canonical signup preserves the Path and still creates only one free Person

**Files:**
- Create: `tests/person-path-signup-continuity.test.ts`
- Reuse/modify only if a defect is proven:
  - `src/app/signup/page.tsx`
  - `src/app/signup/signup-form.tsx`
  - `src/app/api/account/signup/route.ts`
  - `src/lib/auth/return-to.ts`
  - `src/lib/auth/person-account-repository.ts`

**Interfaces:**
- Public Path CTA → `/signup?returnTo=/member?path=<id>` → successful signup → `/member?path=<id>`.

- [ ] **Step 1: Write RED/verification tests**

Cover:
- valid catalog Path survives `safePersonReturnTo`;
- unknown Path is rejected and falls back safely;
- duplicate `path` query parameters are rejected;
- hash fragments are rejected for `/member` continuation;
- external/protocol-relative/backslash/CRLF return targets are rejected;
- signup form redirects only to its server-sanitized `returnTo` or `/member`;
- account creation still creates no Organization, membership, professional verification, patient relationship, Grid eligibility, payment, or clinic workspace;
- legal acceptance and release gate remain mandatory.

- [ ] **Step 2: Run tests**

```bash
npx vitest run \
  tests/person-path-signup-continuity.test.ts \
  tests/person-account-login-continuity.test.ts \
  tests/member-signup-legal-evidence-contract.test.ts \
  tests/person-account-authentication.test.ts
```

- [ ] **Step 3: Fix only server-owned defects**

Do not move return-target validation into client code. Do not weaken the release gate to make the journey test easier.

- [ ] **Step 4: Commit**

```bash
git add tests/person-path-signup-continuity.test.ts src/app/signup src/app/api/account/signup/route.ts src/lib/auth
git commit -m "test(auth): prove free Person Path continuity"
```

---

### Task 4: Prove returning-Person sign-in resumes the same safe Path

**Files:**
- Create: `tests/person-path-login-continuity.test.ts`
- Reuse/modify only if a defect is proven:
  - `src/app/login/page.tsx`
  - `src/components/clinic/login-form.tsx`
  - `src/lib/auth/return-to.ts`
  - existing Person login/auth route used by `LoginForm`

**Interfaces:**
- Protected public action and free-Person continuity must not collapse clinic-session authority and Person-session authority into one login meaning.

- [ ] **Step 1: Write tests**

Require:
- an existing Person session presented with `/member?path=<valid-id>` lands on that Person Path;
- an invalid Person return target falls back to `/member`;
- clinic sessions continue through `safeClinicReturnTo` and never acquire Person authority merely because the public intent was person-oriented;
- the “Join free” link on `/login` carries only `safePersonReturnTo` values;
- legacy `next` remains same-origin guarded and cannot bypass canonical `returnTo` safety;
- account/clinic credential disambiguation remains unchanged.

- [ ] **Step 2: Run**

```bash
npx vitest run tests/person-path-login-continuity.test.ts tests/person-account-login-continuity.test.ts
```

- [ ] **Step 3: Repair only proven continuity/auth defects, then commit**

```bash
git add tests/person-path-login-continuity.test.ts src/app/login src/components/clinic/login-form.tsx src/lib/auth
git commit -m "test(auth): prove returning Person goal continuity"
```

---

### Task 5: Prove authenticated re-resolution and first governed action

**Files:**
- Create: `tests/member-path-reresolution.test.ts`
- Reuse/modify only if a gap is proven:
  - `src/app/member/page.tsx`
  - `src/lib/member/member-home-repository.ts`
  - `src/lib/member/member-action-routes.ts`
  - `tests/living-universe-member-home.test.ts`

**Interfaces:**
- Query input → canonical server Path → `personEntryHrefForPath(path)` → `isAllowedMemberActionHref(candidate)` → `MemberHomeProjection.actions`.

- [ ] **Step 1: Write tests for every Person-reachable Path class**

Require:
- query `path` is looked up against the server catalog before display or route generation;
- unknown Path never appears in title/timeline/action;
- `Continue this path` is emitted only when the person-safe entry href passes the allowlist;
- requested Path changes navigation/context only, not credential, eligibility, membership, authority, or verification state;
- a clinic-oriented Path can route a Person toward an allowed claim/setup entry but cannot manufacture clinic membership;
- Grid/EDU destinations independently enforce their own downstream state.

- [ ] **Step 2: Run**

```bash
npx vitest run tests/member-path-reresolution.test.ts tests/living-universe-member-home.test.ts
```

- [ ] **Step 3: Fix and commit if required**

```bash
git add tests/member-path-reresolution.test.ts src/app/member/page.tsx src/lib/member
git commit -m "test(member): prove authenticated Path re-resolution"
```

---

### Task 6: Keep raw anonymous input out of continuation/storage/analytics boundaries

**Files:**
- Create: `tests/public-growth-privacy.test.ts`
- Modify only if a violation is found:
  - `src/components/marketing/public-living-gateway.tsx`
  - `src/lib/distribution/public-continuation.ts`
  - `src/lib/orchestration/public-living-universe.ts`
  - `src/app/api/zumi/public/route.ts`
  - existing public Zumi quota/session modules

**Interfaces:**
- The current browser session identifier may remain a random opaque ID; raw prompt history must not be persisted by P02 continuation mechanics.

- [ ] **Step 1: Add privacy/source tests**

Require:
- `protectedPublicContinuationHref()` never accepts/stores prompt text;
- Path continuation contains only a catalog Path ID;
- raw prompt is never written to localStorage/IndexedDB;
- sessionStorage use remains limited to the existing opaque public-conversation identifier, not prompt history;
- signup/login URLs contain no free text;
- growth event payloads added by P02 cannot contain email, name, raw prompt, patient details, notes, or arbitrary object spreads;
- public API error/no-result output remains `Cache-Control: no-store` where already required by the route contract.

- [ ] **Step 2: Run P16 disclosure/security checks**

```bash
npx vitest run tests/public-growth-privacy.test.ts
npm run security:client-boundary
npm run security:api-disclosure
```

- [ ] **Step 3: Fix any leakage at the owning server/client boundary, then commit**

```bash
git add tests/public-growth-privacy.test.ts src/components/marketing/public-living-gateway.tsx src/lib/distribution/public-continuation.ts src/lib/orchestration/public-living-universe.ts src/app/api/zumi/public/route.ts
git commit -m "test(growth): enforce public continuation privacy"
```

---

### Task 7: Add privacy-minimized P02 KPI evidence by reusing existing event substrates

**Files:**
- Read first:
  - `prisma/models/universal-account.prisma` (`AccountEvent`)
  - `src/lib/auth/person-account-repository.ts`
  - current public Zumi quota/usage repository and event/cost modules discovered from `/api/zumi/public`
- Create only if no equivalent typed registry exists: `src/lib/distribution/public-growth-events.ts`
- Create: `tests/public-growth-telemetry.test.ts`
- Modify the smallest existing server-side event/repository modules required for controlled counters.

**Interfaces:**
- KPI events/classes:
  - `public_first_value`
  - `public_no_result`
  - `free_signup_started`
  - `free_signup_completed`
  - `person_path_resumed`
  - `first_governed_action_selected`
- Event payloads contain controlled enum/path IDs, coarse source, boolean outcome, and timing bucket only.

- [ ] **Step 1: Audit before adding persistence**

Prefer existing public Zumi durable usage/quota/event persistence for pre-auth aggregate counts and existing `AccountEvent` for authenticated signup/resume evidence. Do **not** add a new analytics vendor or a generic event table if current substrates can support controlled counters.

If current public storage cannot safely support these counters without storing sensitive conversation content, add only the smallest aggregate counter/event record required and document why reuse was insufficient.

- [ ] **Step 2: Write RED/privacy tests**

Require typed event names and reject raw prompt, email, name, patient detail, free-text body, arbitrary query string, arbitrary metadata object, or scene payload. Verify account-linked events are written only after authentication exists.

- [ ] **Step 3: Instrument conversion boundaries**

Instrument server-confirmable moments rather than arbitrary client clicks whenever possible:
- public value: after a real public Path/Object Stage projection is produced;
- signup completed: canonical signup transaction/event;
- resumed: member server successfully resolves a requested Path;
- first governed action: server-safe route/action selection where an evidence hook exists.

- [ ] **Step 4: Run**

```bash
npx vitest run tests/public-growth-telemetry.test.ts
npm run security:check
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/distribution/public-growth-events.ts src/lib/auth src/lib/repositories prisma tests/public-growth-telemetry.test.ts
git commit -m "feat(growth): measure free Person conversion safely"
```

---

### Task 8: Prove no-result, provider-outage, disabled-signup, and P01-failure journeys

**Files:**
- Create: `tests/person-growth-engine-degraded-states.test.ts`
- Modify only when a missing state is proven:
  - `src/components/marketing/public-living-gateway.tsx`
  - `src/components/marketing/public-living-universe-stage.tsx`
  - `src/app/signup/page.tsx`
  - `src/app/member/page.tsx`
  - existing public Zumi fallback modules
  - browser verification script

**Interfaces:**
- Every degraded state remains actionable and truthful without WebGL or external AI.

- [ ] **Step 1: Add tests**

Cover:
- public Zumi provider unavailable → deterministic public intent/path behavior or truthful fallback;
- no canonical Path → no fabricated card/result;
- public signup release disabled → `View free membership status`, not fake `Join free` success;
- invalid/stale Path ID → safe member fallback;
- P01 canvas unavailable → same value→signup→member path remains complete;
- 390px mobile + keyboard path can reach public value, free membership status/signup, and resumed member action;
- reduced motion does not remove the acquisition path.

- [ ] **Step 2: Run targeted tests + browser QA**

```bash
npx vitest run tests/person-growth-engine-degraded-states.test.ts
npm run build
```

Extend the existing browser interaction verifier only where current coverage cannot exercise these states.

- [ ] **Step 3: Commit**

```bash
git add tests/person-growth-engine-degraded-states.test.ts src/components/marketing src/app/signup src/app/member scripts/verify-frontend-browser-interactions.mjs
git commit -m "test(growth): prove degraded free Person journeys"
```

---

### Task 9: Run the P02 + P16 release gate and reconcile implementation truth

**Files:**
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`
- Reuse current release/evidence registry; do not create another P02 status document.

**Interfaces:**
- Produces exact P02 state/evidence while keeping environment-level public signup availability separate.

- [ ] **Step 1: Run complete verification**

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

- [ ] **Step 2: Record what was reused versus changed**

Trace P02 requirements to the existing public Path projection, continuation href, return-to guard, signup rail, member Path re-resolution, new coverage/telemetry tests, and any minimal fixes actually required.

- [ ] **Step 3: Keep release truth precise**

Do not claim “free signup is live” from implementation/CI alone. `getMemberSignupReleaseState().enabled` remains the environment/legal release authority.

- [ ] **Step 4: Push final candidate and require exact-head GitHub Quality**

Both `Quality / verify` and `Quality / deploy-contract` must pass on the same final SHA.

- [ ] **Step 5: Commit evidence reconciliation**

```bash
git add docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json
git commit -m "docs(governance): record P02 growth-engine evidence"
```

## P02 Definition of Done

P02 is complete only when:

1. mapped visitors receive real public-safe Path value before signup;
2. public Path continuation reuses the canonical `/member?path=<catalog-id>` rail;
3. the canonical free Person signup/login path preserves only server-validated continuation;
4. member entry re-resolves the Path from the server catalog and routes only through person-safe action rules;
5. no continuation query creates verification, eligibility, membership, tenant, professional, patient, clinical, billing, or payment authority;
6. raw anonymous prompt text never enters continuation URLs, browser persistence, or growth telemetry;
7. signup-disabled, no-result, provider-outage, invalid-Path, mobile, reduced-motion, and no-WebGL states are truthful and complete;
8. P02 KPIs have privacy-minimized evidence using existing storage/event substrates wherever possible;
9. P16 disclosure/abuse/security gates pass;
10. exact-head `Quality / verify` and `Quality / deploy-contract` are green;
11. implementation readiness is not misrepresented as public membership release approval.
