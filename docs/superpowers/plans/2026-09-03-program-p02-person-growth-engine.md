# P02 — Public Value / Free Person Growth / Signup Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Klinikos public entry into a value-before-signup growth engine that creates one free Person identity, safely preserves a bounded non-PHI goal across signup/sign-in, re-resolves that goal after authentication, and never turns self-assertion or payment into authority.

**Architecture:** Reuse the existing public Living intent resolver (`src/lib/orchestration/public-living-intent.ts`), `/api/zumi/public`, canonical `/signup` + `/api/account/signup`, Person account/session rails, same-origin controls, legal-acceptance release gate, and `/member`. Add one short-lived signed `IntentContinuation` token containing only allowlisted public intent class/selectors. The continuation is an HttpOnly cookie and is consumed by a dedicated authenticated continuation route before the member experience renders a safe resumed-goal projection.

**Tech Stack:** Next.js 15.5.22, React 19.1.1, TypeScript 5.9.2, `jose` 6.2.3 already installed, Zod 4.0.17, existing auth/session/legal controls, existing public Zumi route, Vitest, Quality/deploy-contract.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p02-person-growth-engine-design.md`

## Global Constraints

- Person account remains free; no card or organization subscription is required to create one Person identity.
- Do not create a second identity table, auth provider, signup rail, member home, public product, or raw anonymous-prompt datastore.
- Raw anonymous free text is potentially sensitive: never put it in URLs, continuation tokens, localStorage/sessionStorage/IndexedDB, analytics properties, or durable anonymous persistence.
- Continuation state contains only allowlisted non-PHI structure and never acts as an authorization grant.
- After authentication, the server re-resolves the goal under current Person/context/authority; public-stage interpretation cannot be promoted directly into private truth.
- “I own a clinic,” “I’m an RN,” “I’m a student,” or similar statements remain claims/intents, not verification, membership, tenant authority, enrollment truth, or clinical authority.
- Preserve the existing versioned Terms/Privacy acceptance and release gate; P02 cannot open signup merely by rendering a button.
- Reuse existing public Zumi deterministic fallback and safe public-intent resolver; public AI may be unavailable without breaking the path.
- No fabricated jobs, clinicians, availability, placements, customer outcomes, revenue, or network density.
- P01 WebGL may enhance this flow but can never be required for intent, signup, sign-in, errors, or continuation.
- P16 owns deeper abuse/security evidence and is a release blocker.
- Every code task uses RED → GREEN TDD and ends with an independently reviewable commit.

---

### Task 1: Lock the RED P02 growth/continuity contract

**Files:**
- Create: `tests/person-growth-engine-contract.test.ts`
- Read: `tests/public-free-entry-truthfulness.test.ts`
- Read: `tests/person-account-login-continuity.test.ts`
- Read: `tests/member-signup-legal-evidence-contract.test.ts`
- Read: `src/lib/orchestration/public-living-intent.ts`
- Read: `src/app/api/zumi/public/route.ts`
- Read: `src/app/signup/page.tsx`
- Read: `src/app/api/account/signup/route.ts`

**Interfaces:**
- Produces RED contract for `IntentContinuation`, mint/consume endpoints, and resumed member projection.

- [ ] **Step 1: Write the failing structural contract**

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("P02 free Person growth engine", () => {
  it("adds one bounded continuation rail", () => {
    expect(existsSync("src/lib/auth/entry-intent.ts")).toBe(true);
    expect(existsSync("src/app/api/account/entry-intent/route.ts")).toBe(true);
    expect(existsSync("src/app/api/account/continue/route.ts")).toBe(true);
  });

  it("keeps canonical signup instead of creating SignupV2", () => {
    expect(existsSync("src/app/signup/page.tsx")).toBe(true);
    expect(existsSync("src/app/api/account/signup/route.ts")).toBe(true);
    expect(existsSync("src/app/signup-v2/page.tsx")).toBe(false);
  });

  it("never stores raw public prompts in the continuation module", () => {
    const source = read("src/lib/auth/entry-intent.ts");
    expect(source).not.toContain("rawPrompt");
    expect(source).not.toContain("prompt:");
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/person-growth-engine-contract.test.ts
```

Expected: FAIL because the continuation rail does not exist.

- [ ] **Step 3: Re-run existing free-entry/login/legal baselines**

```bash
npx vitest run tests/public-free-entry-truthfulness.test.ts tests/person-account-login-continuity.test.ts tests/member-signup-legal-evidence-contract.test.ts
```

Expected: PASS before P02 changes.

- [ ] **Step 4: Commit RED contract**

```bash
git add tests/person-growth-engine-contract.test.ts
git commit -m "test(growth): lock P02 free Person continuity contract"
```

---

### Task 2: Define the allowlisted PublicIntentEnvelope and signed IntentContinuation

**Files:**
- Create: `src/lib/auth/entry-intent.ts`
- Create: `tests/entry-intent-token.test.ts`
- Read: `src/lib/auth/account-token.ts`
- Read: `src/lib/auth/config.ts`
- Read: `src/lib/security/same-origin.ts`

**Interfaces:**
- Produces:
  - `PublicIntentClass`
  - `PublicIntentEnvelope`
  - `IntentContinuation`
  - `ENTRY_INTENT_COOKIE_NAME`
  - `entryIntentCookieOptions()`
  - `signIntentContinuation(envelope)`
  - `verifyIntentContinuation(token)`
  - `sanitizeContinuationInput(input)`

- [ ] **Step 1: Write RED token/privacy tests**

Cover:
- valid token verifies;
- token expires after 15 minutes;
- tampered token returns `null`;
- unknown intent class is rejected;
- selectors outside the allowlist are stripped;
- selector values have bounded lengths/counts;
- no field named `prompt`, `rawPrompt`, `patient`, `diagnosis`, `note`, `secret`, `password`, or arbitrary JSON payload can survive parsing;
- cookie is HttpOnly, Secure in production, `SameSite=Lax`, `Path=/`, max age 900 seconds.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/entry-intent-token.test.ts
```

- [ ] **Step 3: Implement exact continuation vocabulary**

Use this W1 enum:

```ts
export const publicIntentClasses = [
  "care",
  "work",
  "staffing",
  "resource",
  "placement",
  "learn",
  "organization",
  "revenue",
  "referrals",
  "procurement",
  "explore",
] as const;
```

Allow selectors only for public-safe structural values such as `destinationKey`, `actionId`, `side`, `category`, `regionCode`, `specialtySlug`, and `source`. Do not accept arbitrary keys.

Sign with the existing server auth secret using a distinct JWT audience such as `klinikos-entry-intent` and 15-minute expiration. Reusing the server secret with a distinct issuer/audience is preferable to introducing a new unmanaged secret in W1; no continuation token may verify as an account session token because the audiences and schemas differ.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/entry-intent-token.test.ts
npm run security:env-boundary
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/entry-intent.ts tests/entry-intent-token.test.ts
git commit -m "feat(auth): add bounded intent continuation token"
```

---

### Task 3: Derive safe continuation from the existing public intent resolver

**Files:**
- Create: `src/lib/orchestration/public-intent-continuation.ts`
- Modify: `src/lib/orchestration/public-living-intent.ts` only where a stable destination/action identifier is required
- Modify: `src/lib/marketing/public-living-actions.ts` only if an existing action lacks a stable allowlisted mapping
- Create: `tests/public-intent-continuation.test.ts`

**Interfaces:**
- `continuationFromResolution(resolution, sourceActionId?): PublicIntentEnvelope | null`

- [ ] **Step 1: Write RED mapping tests**

Use real existing resolver results. Assert:
- work/Grid resolution maps to `work` with safe destination/action selectors;
- EDU maps to `learn` or `placement` based on allowlisted source action;
- clinic-management intent maps to `organization` but does not claim ownership;
- private-data request produces no sensitive continuation;
- casual conversation produces `null` unless a safe actionable goal exists;
- output never includes the original free-text prompt.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/public-intent-continuation.test.ts
```

- [ ] **Step 3: Implement deterministic derivation from resolved truth**

Derive continuation from the already-resolved destination/action plus controlled source action identity, not by copying the prompt. Preserve existing public resolver behavior and deterministic fallback.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/public-intent-continuation.test.ts tests/public-living-universe-persistent-stage.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/orchestration/public-intent-continuation.ts src/lib/orchestration/public-living-intent.ts src/lib/marketing/public-living-actions.ts tests/public-intent-continuation.test.ts
git commit -m "feat(growth): derive safe public continuation"
```

---

### Task 4: Add a same-origin endpoint that mints the continuation cookie only when the user chooses Continue/Join Free

**Files:**
- Create: `src/app/api/account/entry-intent/route.ts`
- Create: `tests/entry-intent-route.test.ts`
- Read: `src/app/api/account/signup/route.ts`
- Read: `src/lib/security/same-origin.ts`

**Interfaces:**
- `POST /api/account/entry-intent`
- Request body contains only an allowlisted envelope candidate or controlled action/resolution identifiers; never raw prompt.
- Response: `{ data: { saved: true } }`, `Cache-Control: no-store`, plus HttpOnly continuation cookie.

- [ ] **Step 1: Write RED route tests**

Cover:
- same-origin valid safe intent → 201/200 + cookie;
- cross-origin mutation → 403;
- raw `prompt` field → 400;
- unknown selector → stripped or rejected according to parser contract;
- oversized body → 413/400 according to existing route conventions;
- no-store response;
- no identifier or private data in response body.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/entry-intent-route.test.ts
```

- [ ] **Step 3: Implement with `evaluateSameOriginMutation` and Zod parsing**

Do not accept a destination URL from the client. Accept an enum/class plus allowlisted selectors and let the server determine the resume path later.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/entry-intent-route.test.ts
npm run security:api-disclosure
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/account/entry-intent/route.ts tests/entry-intent-route.test.ts
git commit -m "feat(growth): persist safe entry intent cookie"
```

---

### Task 5: Connect public Living Gateway value to Save/Continue/Join Free without making WebGL mandatory

**Files:**
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Modify: `src/app/api/zumi/public/route.ts` only to return stable safe resolution metadata if it does not already expose enough information
- Modify: `tests/public-living-universe-reference-parity.test.ts`
- Create: `tests/public-value-before-signup.test.ts`

**Interfaces:**
- The public result exposes a semantic Continue/Join Free action after a real public-safe result or truthful explanation.
- The browser POSTs safe structural continuation to `/api/account/entry-intent`, then navigates to `/signup` or `/login`.

- [ ] **Step 1: Write RED journey/component tests**

Assert:
- at least one supported public action reaches a useful result before signup;
- CTA reads `Continue` / `Join free` only after a result/next step exists;
- public result can be used in Precision mode with no canvas;
- no raw input string is appended to signup/login URL;
- no `localStorage`, `sessionStorage`, or IndexedDB use exists in the public continuation path;
- truthful no-result state renders without fabricated cards.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/public-value-before-signup.test.ts
```

- [ ] **Step 3: Implement semantic continuation CTA**

Use controlled server result metadata from the current public intent resolution. If safe continuation cannot be derived, navigate to signup/login without a continuation cookie and show a neutral authenticated restart prompt later.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/public-value-before-signup.test.ts tests/public-living-universe-reference-parity.test.ts tests/public-living-universe-persistent-stage.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/public-living-gateway.tsx src/app/api/zumi/public/route.ts tests/public-value-before-signup.test.ts tests/public-living-universe-reference-parity.test.ts
git commit -m "feat(growth): continue from public value into free Person signup"
```

---

### Task 6: Preserve continuation through canonical signup and returning-user login

**Files:**
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/signup/signup-form.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: existing login form/component referenced by `src/app/login/page.tsx` if the redirect is client-owned
- Modify: `tests/person-account-login-continuity.test.ts`
- Create: `tests/entry-intent-auth-continuity.test.ts`

**Interfaces:**
- If a valid continuation cookie exists, successful Person signup or Person login navigates to `/api/account/continue` rather than directly to `/member`.
- Existing explicit `returnTo` remains authoritative only when it passes the existing safe return guards and does not conflict with the continuation policy.

- [ ] **Step 1: Write RED auth-continuity tests**

Cover:
- new Person signup with valid intent → canonical signup endpoint still creates only Person/Account/session/legal evidence;
- returning Person login can use the same continuation;
- clinic login rail is not repurposed into Person authority;
- invalid/tampered/expired continuation falls back to the existing safe destination;
- existing `safePersonReturnTo` / `safeClinicReturnTo` protections remain intact.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/entry-intent-auth-continuity.test.ts tests/person-account-login-continuity.test.ts
```

- [ ] **Step 3: Integrate server-visible continuation presence**

The signup/login page may read whether the HttpOnly cookie exists and pass only a boolean/next-route choice into the form. Do not expose token content to the client.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/entry-intent-auth-continuity.test.ts tests/person-account-login-continuity.test.ts tests/member-signup-legal-evidence-contract.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/signup src/app/login tests/entry-intent-auth-continuity.test.ts tests/person-account-login-continuity.test.ts
git commit -m "feat(auth): preserve safe goal across join and sign-in"
```

---

### Task 7: Consume the continuation once, re-resolve under authenticated context, and show a resumed goal

**Files:**
- Create: `src/app/api/account/continue/route.ts`
- Create: `src/lib/member/resumed-intent.ts`
- Modify: `src/app/member/page.tsx`
- Modify: `src/lib/member/member-home-repository.ts`
- Create: `tests/authenticated-intent-reresolution.test.ts`

**Interfaces:**
- `GET /api/account/continue` requires a valid Person session, verifies the continuation cookie, maps it to an allowlisted authenticated resume state, clears the cookie, and redirects to a same-origin member destination.
- `resolveAuthenticatedResume(personSession, continuation): ResumedIntentProjection`

- [ ] **Step 1: Write RED re-resolution tests**

Cover:
- authenticated work intent resumes as a Person goal but does not certify eligibility;
- organization intent remains `claim_pending` / non-authoritative and does not create organization membership;
- professional intent does not create verified credential state;
- stale/expired continuation is discarded;
- cross-user reuse cannot establish authority;
- consumption clears the continuation cookie;
- destination is server-generated and same-origin only.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/authenticated-intent-reresolution.test.ts
```

- [ ] **Step 3: Implement minimal W1 resume projection**

Do not create a generalized task/intent database. Use the short-lived continuation to produce a Person-owned presentation state for the current request; durable SavedIntent remains outside W1 unless an existing repository already provides equivalent persistence.

- [ ] **Step 4: Render visible continuity in Member Living Home**

Show a safe message such as `Continue finding healthcare work` or `Continue connecting an organization`. The text must be derived from the allowlisted intent class, not echoed raw public input.

- [ ] **Step 5: Run GREEN**

```bash
npx vitest run tests/authenticated-intent-reresolution.test.ts tests/living-universe-member-home.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/account/continue/route.ts src/lib/member src/app/member/page.tsx tests/authenticated-intent-reresolution.test.ts
git commit -m "feat(member): resume public goal after authentication"
```

---

### Task 8: Add non-sensitive growth telemetry and cost controls

**Files:**
- Reuse/modify the repository's existing analytics/event module discovered during execution; do not create a second analytics product
- Create: `src/lib/analytics/public-growth-events.ts` only if there is no existing typed public-event registry
- Create: `tests/public-growth-analytics-privacy.test.ts`
- Modify: public/member/signup integration points from Tasks 5–7

**Interfaces:**
- Controlled events:
  - `public_intent_started`
  - `public_intent_classified`
  - `public_first_value_rendered`
  - `public_no_result`
  - `continue_selected`
  - `signup_started`
  - `signup_completed`
  - `intent_resumed`
  - `first_authenticated_outcome`

- [ ] **Step 1: Write RED privacy tests**

Assert event properties accept only enums, booleans, bounded counts, safe source identifiers, and coarse timing. Reject `prompt`, `email`, `name`, `patient`, free-text body, clinical details, or arbitrary object spreads.

- [ ] **Step 2: Implement typed event payloads**

Instrument only when an existing analytics sink is configured; otherwise preserve no-op/local evidence behavior rather than adding a new paid vendor.

- [ ] **Step 3: Add public AI budget/fallback assertions**

Reuse current `/api/zumi/public` rate/cost controls. If the current route lacks a deterministic per-public-feature budget, add a bounded server-side admission control in the same route/gateway substrate, not in the browser.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/public-growth-analytics-privacy.test.ts
npm run security:check
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics src/app src/components tests/public-growth-analytics-privacy.test.ts
git commit -m "feat(growth): measure public value without sensitive telemetry"
```

---

### Task 9: Prove abuse, privacy, accessibility, P01 fallback, and truthful empty states

**Files:**
- Create: `tests/person-growth-engine-adversarial.test.ts`
- Modify: `scripts/verify-frontend-browser-interactions.mjs` where needed for the full public→auth→member journey

**Interfaces:**
- Produces negative/security journey evidence for P16 and browser release proof.

- [ ] **Step 1: Add adversarial tests**

Cover:
- tampered token;
- expired token;
- replay after consumption;
- cross-origin mint attempt;
- open-redirect payload;
- account enumeration behavior remains non-disclosing beyond the existing approved message;
- rate limit/provider outage fallback;
- raw prompt with obvious clinical details never enters continuation/analytics/browser storage;
- organization/professional self-claims create no authority;
- no-result/empty network stays truthful;
- WebGL disabled still completes value→signup→resume;
- 390px mobile and keyboard path remain complete.

- [ ] **Step 2: Run targeted adversarial suite**

```bash
npx vitest run tests/person-growth-engine-adversarial.test.ts
```

Expected: PASS after Tasks 2–8.

- [ ] **Step 3: Run full release suite**

```bash
npm run security:check
npm run governance:traceability
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add tests/person-growth-engine-adversarial.test.ts scripts/verify-frontend-browser-interactions.mjs
git commit -m "test(growth): prove safe free Person acquisition journey"
```

---

### Task 10: Reconcile P02 traceability and exact-head release evidence

**Files:**
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`
- Reuse current evidence/release registry rather than creating another source of truth

**Interfaces:**
- Produces exact P02 implementation state, tests, KPIs, security gates, and evidence refs.

- [ ] **Step 1: Record the implemented P02 requirements**

Include safe continuation, value-before-signup, canonical signup reuse, authenticated re-resolution, claim/authority separation, truthful empty states, analytics privacy, and P01/P16 integration.

- [ ] **Step 2: Validate traceability**

```bash
npm run governance:traceability
```

- [ ] **Step 3: Push the final candidate and require exact-head Quality**

Both `Quality / verify` and `Quality / deploy-contract` must be green for the same final SHA.

- [ ] **Step 4: Do not claim public signup is live solely from CI**

`getMemberSignupReleaseState().enabled` remains a separate environment/legal release truth. Record the implementation as built/verified without representing free membership as publicly enabled until the deployment evidence says it is.

- [ ] **Step 5: Commit evidence**

```bash
git add docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json
git commit -m "docs(governance): record P02 growth-engine evidence"
```

## P02 Definition of Done

P02 is complete only when:

1. supported visitors receive a useful public-safe result or truthful next step before signup;
2. Person account creation remains free and canonical;
3. raw anonymous text never enters continuation URLs, browser storage, analytics, or long-lived anonymous persistence;
4. continuation is allowlisted, short-lived, signed, HttpOnly, tamper-resistant, and one-time consumed;
5. the same safe goal survives signup/sign-in and is re-resolved under authenticated context;
6. organization/professional/student assertions remain claims/intents rather than authority;
7. P01 failure cannot break the acquisition journey;
8. rate/provider/no-result states remain truthful;
9. growth telemetry is useful but privacy-minimized;
10. P16 adversarial/security gates and exact-head Quality are green;
11. implementation readiness is not misrepresented as environment-level public signup approval.
