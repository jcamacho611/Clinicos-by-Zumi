# Universal Entry Gateway v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ENTER KLINIKOS` the single governed path into interactive Klinikos by requiring a versioned pre-auth clickwrap agreement, binding that evidence to the authenticated identity at login, preserving public SEO/discovery, and keeping the experience visually native to the approved rose/obsidian Klinikos design.

**Architecture:** Reuse the existing `access_gate_acceptances`, `legal_agreement_versions`, and `legal_agreement_events` evidence substrate instead of creating a parallel legal store. Add a separate anonymous-entry token/cookie seam that binds an exact agreement key/version/hash to a short-lived entry session, record clickwrap execution before authentication with `userId`/`organizationId` unset, then bind that same acceptance to the authenticated user/organization only after successful credential verification. Public pages remain public; patient portal access remains on its separate patient contract path; interactive staff/professional entry routes converge through `/access` when the feature flag is enabled.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Zod 4, `jose` JWT signing, Prisma/PostgreSQL with existing raw-SQL legal evidence tables, Vitest, Tailwind/CSS design tokens.

**Spec:** `docs/superpowers/specs/2026-08-23-universal-entry-adaptive-klinikos-experience-design.md`

## Global Constraints

- Preserve public/indexable Klinikos discovery pages; the agreement protects interactive/protected access, not intentionally public marketing content.
- Use the existing Klinikos orbital-K/wordmark/rose design and `rose-home` visual system. Do not introduce a generic blue/teal SaaS theme.
- Dark mode remains the approved obsidian/black-cherry/warm-ivory Klinikos reference. This tranche must not overwrite active theme PR #240; light-mode convergence is a later coordinated tranche.
- Do not touch clinical-convergence files, Current Visit, Staff Handoff, Clinical Change, body-map, orders/results, EDU, Grid economics, Trust, interoperability, or active identity schema work.
- Do not add or modify Prisma schema/migrations in this tranche. The existing SQL legal-access migration already has the evidence columns required for anonymous entry and later identity binding.
- Do not create a second identity system, agreement database, or auth session system.
- Do not gate the patient portal with the proprietary-evaluation clickwrap; patient portal access remains a separate governed patient path.
- Zumi does not become legal, identity, credential, eligibility, payment, or clinical authority.
- Browser state never establishes acceptance. Server-signed tokens + persisted evidence are authoritative.
- A stale, mismatched, expired, unsigned, or missing entry token must fail closed when entry enforcement is enabled.
- Keep enforcement disabled by default until deployment configuration, counsel-reviewed agreement text, database migration state, and controlled end-to-end verification are proven.
- Never mutate the already-published `2026.08.18.1` agreement text in place. Create a new baseline entry agreement version for clickwrap wording.
- No raw patient information is used anywhere in this tranche.
- Exact current `main` at planning time is `4638b33e90a4eb0fba5230138d65c61d79c32829`; recheck before PR/merge because multiple non-overlapping draft branches are active.

---

## File structure

### New files

- `src/lib/legal/entry-agreement.ts` — builds the new baseline protected-entry agreement version from the current global agreement structure without mutating the published authenticated version.
- `src/lib/legal/entry-token.ts` — signs/verifies anonymous entry presentation/review/bound-cookie JWTs using server-only authority.
- `src/lib/legal/entry-access.ts` — persists anonymous clickwrap acceptance and atomically binds it to a verified authenticated identity.
- `src/app/api/access/review/route.ts` — converts a valid presented anonymous token into a reviewed token after the browser reaches the end.
- `tests/universal-entry-gateway.test.ts` — product/route/security contract for the public → entry → auth boundary.
- `tests/entry-agreement-evidence.test.ts` — exact evidence/token/binding contract.

### Modified files

- `src/app/access/page.tsx` — replace legacy email-verification gate with the real rose-branded Entry Airlock.
- `src/app/api/access/accept/route.ts` — replace legacy email-checkbox persistence with exact-version anonymous clickwrap execution.
- `src/app/login/page.tsx` — require a valid entry cookie before showing staff/professional login when enforcement is enabled; preserve patient portal separation.
- `src/app/api/auth/login/route.ts` — verify entry evidence and bind the persisted acceptance to the authenticated user/organization before returning an entitled login.
- `src/components/marketing/public-living-gateway.tsx` — route staff/professional interactive/sign-in CTAs through `/access` while preserving public informational pages.
- `src/lib/legal/legal-config.ts` — add a separate `KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED` flag helper so rollout can be controlled independently of role/product-specific authenticated legal gates.
- `.env.example` — document the entry-gate feature flag and rollout truth.
- `docs/legal/LEGAL_ACCESS_FOUNDATION.md` — document the new entry-order while preserving the authenticated/additional-agreement path.

---

### Task 1: Lock the route and evidence contract with RED tests

**Files:**
- Create: `tests/universal-entry-gateway.test.ts`
- Create: `tests/entry-agreement-evidence.test.ts`

**Interfaces:**
- Consumes: current source files only.
- Produces: regression requirements that later tasks must satisfy.

- [ ] **Step 1: Write `tests/universal-entry-gateway.test.ts`**

Use source-contract assertions that require all of the following:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("universal entry gateway", () => {
  it("keeps the public homepage public while routing interactive entry through /access", () => {
    const landing = read("src/app/page.tsx");
    const gateway = read("src/components/marketing/public-living-gateway.tsx");
    expect(landing).toContain("PublicLivingGateway");
    expect(gateway).toContain("/access");
    expect(gateway).toContain("Enter Klinikos");
  });

  it("does not put patient portal access behind the proprietary entry gate", () => {
    const gateway = read("src/components/marketing/public-living-gateway.tsx");
    expect(gateway).toContain("/portal/login");
    expect(gateway).not.toContain("/access?returnTo=%2Fportal%2Flogin");
  });

  it("gates professional login with server-owned entry evidence when enforcement is enabled", () => {
    const page = read("src/app/login/page.tsx");
    expect(page).toContain("requireEntryAccessForLogin");
    expect(page).toContain("/access");
  });

  it("binds acceptance only after successful credential authentication", () => {
    const route = read("src/app/api/auth/login/route.ts");
    const authenticateIndex = route.indexOf("authenticateCredentials");
    const bindIndex = route.indexOf("bindEntryAcceptanceToIdentity");
    expect(authenticateIndex).toBeGreaterThan(-1);
    expect(bindIndex).toBeGreaterThan(authenticateIndex);
  });
});
```

- [ ] **Step 2: Write `tests/entry-agreement-evidence.test.ts`**

Lock the new interfaces and invariants:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("entry agreement evidence", () => {
  it("uses a new immutable clickwrap agreement version", () => {
    const source = read("src/lib/legal/entry-agreement.ts");
    expect(source).toContain('ENTRY_TERMS_VERSION = "2026.08.23.1"');
    expect(source).toContain("clicking Agree & Enter Klinikos");
  });

  it("keeps anonymous entry evidence unbound until authentication", () => {
    const source = read("src/lib/legal/entry-access.ts");
    expect(source).toContain('"userId"');
    expect(source).toContain('"organizationId"');
    expect(source).toContain("NULL");
    expect(source).toContain("bindEntryAcceptanceToIdentity");
  });

  it("requires reviewed exact-version evidence before acceptance", () => {
    const route = read("src/app/api/access/accept/route.ts");
    expect(route).toContain("verifyEntryToken");
    expect(route).toContain('"reviewed"');
    expect(route).toContain("documentSha256");
  });

  it("never treats browser localStorage as legal authority", () => {
    const access = read("src/app/access/page.tsx");
    expect(access).not.toContain("localStorage.setItem");
  });
});
```

- [ ] **Step 3: Run the focused tests and confirm RED**

Run:

```bash
npx vitest run tests/universal-entry-gateway.test.ts tests/entry-agreement-evidence.test.ts
```

Expected: FAIL because the new entry files/interfaces and gateway routing do not yet exist.

- [ ] **Step 4: Commit the RED contract**

```bash
git add tests/universal-entry-gateway.test.ts tests/entry-agreement-evidence.test.ts
git commit -m "test(access): define universal entry gateway contract"
```

---

### Task 2: Create the immutable clickwrap agreement and anonymous token authority

**Files:**
- Create: `src/lib/legal/entry-agreement.ts`
- Create: `src/lib/legal/entry-token.ts`
- Modify: `src/lib/legal/legal-config.ts`
- Test: `tests/entry-agreement-evidence.test.ts`

**Interfaces:**
- Produces:
  - `buildEntryAgreement(config: LegalPublicConfig): AgreementPresentation`
  - `ENTRY_TERMS_KEY: "klinikos-protected-entry-confidentiality-esign"`
  - `ENTRY_TERMS_VERSION: "2026.08.23.1"`
  - `createEntryPresentedToken(...)`
  - `createEntryReviewedToken(...)`
  - `verifyEntryToken(...)`
  - `ENTRY_GATE_COOKIE_NAME`
  - `isEntryGateEnforcementEnabled()`

- [ ] **Step 1: Add `entry-agreement.ts`**

Create a new immutable agreement presentation that reuses the current public legal configuration but explicitly supports clickwrap electronic assent. Required first-section language must include:

```ts
export const ENTRY_TERMS_KEY = "klinikos-protected-entry-confidentiality-esign";
export const ENTRY_TERMS_VERSION = "2026.08.23.1";
export const ENTRY_TERMS_EFFECTIVE_DATE = "2026-08-23";
```

and:

```ts
"By affirmatively selecting every required acknowledgment and clicking Agree & Enter Klinikos, you intend that action to authenticate your electronic acceptance of this exact agreement version."
```

Reuse the substantive confidentiality, restricted-use, anti-copying, AI-authority, healthcare-technology, privacy/HIPAA-boundary, and Grid-truth concepts from `global-agreement.ts`, but do not modify `GLOBAL_TERMS_VERSION` or the stored text for `2026.08.18.1`.

- [ ] **Step 2: Add anonymous entry token claims in `entry-token.ts`**

Use `jose` and `getAuthSecret()` with claims:

```ts
type EntryTokenKind = "presented" | "reviewed" | "accepted";

type EntryTokenClaims = {
  kind: EntryTokenKind;
  entrySessionId: string;
  acceptanceId?: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
  presentedAt: string;
  reachedEndAt?: string;
  acceptedAt?: string;
};
```

Use issuer `klinikos-entry-gate`, audience `klinikos-protected-entry`, and a 20-minute presentation/review TTL. Accepted cookie proof may use a 2-hour TTL, enough to complete signup/login without becoming a durable authorization artifact.

`verifyEntryToken()` must compare kind + entrySessionId + document key/version/hash and reject mismatches.

- [ ] **Step 3: Add separate entry-gate flag**

In `src/lib/legal/legal-config.ts` add:

```ts
export function isEntryGateEnforcementEnabled() {
  return process.env.KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED === "true";
}
```

Do not change the existing authenticated `LEGAL_GATE_ENFORCEMENT_ENABLED` behavior in this task.

- [ ] **Step 4: Run focused tests**

```bash
npx vitest run tests/entry-agreement-evidence.test.ts
```

Expected: still FAIL only on persistence/route requirements not yet implemented; agreement version test passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/legal/entry-agreement.ts src/lib/legal/entry-token.ts src/lib/legal/legal-config.ts
git commit -m "feat(access): add protected entry agreement authority"
```

---

### Task 3: Persist anonymous acceptance and bind it atomically after login

**Files:**
- Create: `src/lib/legal/entry-access.ts`
- Test: `tests/entry-agreement-evidence.test.ts`

**Interfaces:**
- Consumes: `AgreementPresentation`, exact document hash, anonymous `entrySessionId`, request metadata.
- Produces:

```ts
export type AnonymousEntryAcceptance = {
  id: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
  acceptedAt: Date;
  sessionId: string;
};

export async function createAnonymousEntryAcceptance(input: {
  entrySessionId: string;
  agreement: AgreementPresentation;
  acknowledgments: Record<string, boolean>;
  presentedAt: Date;
  reachedEndAt: Date;
  acceptedAt: Date;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AnonymousEntryAcceptance>;

export async function bindEntryAcceptanceToIdentity(input: {
  acceptanceId: string;
  entrySessionId: string;
  documentKey: string;
  documentVersion: string;
  documentSha256: string;
  userId: string;
  organizationId: string;
  email: string;
  authSessionId: string;
}): Promise<void>;
```

- [ ] **Step 1: Implement anonymous insert using existing SQL columns**

`createAnonymousEntryAcceptance()` must insert into `access_gate_acceptances` with:
- `userId = NULL`
- `organizationId = NULL`
- exact key/version/hash/snapshot
- `signatureMethod = 'clickwrap'`
- `electronicSignatureConsentedAt`, `presentedAt`, `firstViewedAt`, `reachedEndAt`, `acknowledgedAt`, `signedAt`, and `acceptedAt`
- acknowledgments JSON
- anonymous `sessionId = entrySessionId`
- idempotency key
- source `protected-entry-gate`
- status `active`

Never store a fake typed signature or legal name for this pre-auth clickwrap.

- [ ] **Step 2: Implement atomic identity binding**

`bindEntryAcceptanceToIdentity()` must execute in a database transaction and update exactly one active anonymous row matching acceptance id + entry session + exact agreement identity where `userId IS NULL AND organizationId IS NULL`. It must set `userId`, `organizationId`, canonical authenticated `email`, and `sessionId = authSessionId`.

In the same transaction, insert a `legal_agreement_events` row with `eventType = 'legal.entry.bound_to_identity'` and metadata containing the exact document hash. Reject if zero or multiple rows are eligible, or if an active bound acceptance already conflicts.

- [ ] **Step 3: Run focused test**

```bash
npx vitest run tests/entry-agreement-evidence.test.ts
```

Expected: persistence/source contract assertions pass except API wiring not yet present.

- [ ] **Step 4: Commit**

```bash
git add src/lib/legal/entry-access.ts tests/entry-agreement-evidence.test.ts
git commit -m "feat(access): persist and bind entry acceptance evidence"
```

---

### Task 4: Replace the legacy `/access` flow with the real Klinikos Entry Airlock

**Files:**
- Modify: `src/app/access/page.tsx`
- Create: `src/app/api/access/review/route.ts`
- Modify: `src/app/api/access/accept/route.ts`
- Test: `tests/universal-entry-gateway.test.ts`
- Test: `tests/entry-agreement-evidence.test.ts`

**Interfaces:**
- Consumes: `buildEntryAgreement()`, entry token authority, anonymous evidence repository.
- Produces: a versioned pre-auth review/accept flow and secure HttpOnly accepted-entry cookie.

- [ ] **Step 1: Convert `/access` to a server page + focused client ceremony**

Preserve the route but remove the old email + verification workflow. Render the exact entry agreement and a server-created presented token. Use existing brand primitives (`KlinikosWordmark`, `rose-home`, rose atmosphere, current production asset paths) and keep the page visually continuous with the public Living Home.

The user-facing sequence is:

```text
Welcome to Klinikos
→ Review protected-entry terms
→ scroll to end
→ affirm base acknowledgments
→ Agree & Enter Klinikos
→ Create account / Sign in
```

Do not collect work email before the agreement. Do not use `localStorage` as authority.

- [ ] **Step 2: Add `/api/access/review`**

Accept only same-origin POST with a valid `presented` token. Verify exact document identity and return a `reviewed` token with `reachedEndAt`. This route is anonymous; it must not call `getAuthenticationSession()`.

- [ ] **Step 3: Replace `/api/access/accept`**

Schema:

```ts
const schema = z.object({
  reviewToken: z.string().min(1).max(5000),
  acknowledgments: z.record(z.string(), z.boolean()),
  idempotencyKey: z.string().uuid(),
  returnTo: z.string().max(500).optional(),
});
```

Verify every base acknowledgment, exact entry session/version/hash, and reviewed state. Persist with `createAnonymousEntryAcceptance()`. Return an `accepted` server token and set it in an HttpOnly, Secure-in-production, SameSite=Lax cookie. Return only safe next routes: `/login` and the future `/signup` path; do not return protected product data.

- [ ] **Step 4: Ensure the legacy email verification detour is gone**

`src/app/access/page.tsx` must no longer call `/api/access/request-verification`, collect work email, or write access version/email to browser storage.

- [ ] **Step 5: Run focused tests**

```bash
npx vitest run tests/universal-entry-gateway.test.ts tests/entry-agreement-evidence.test.ts
```

Expected: evidence tests pass; route contract may still fail until login/home wiring is completed.

- [ ] **Step 6: Commit**

```bash
git add src/app/access/page.tsx src/app/api/access/review/route.ts src/app/api/access/accept/route.ts tests
git commit -m "feat(access): build Klinikos protected entry airlock"
```

---

### Task 5: Gate staff/professional login and bind acceptance after authentication

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/lib/legal/entry-access.ts`
- Test: `tests/universal-entry-gateway.test.ts`
- Test: `tests/entry-agreement-evidence.test.ts`

**Interfaces:**
- Produces:
  - `readAcceptedEntryProof()` or equivalent server helper that reads/verifies the HttpOnly entry cookie.
  - `requireEntryAccessForLogin(returnTo?: string | null)` that redirects to `/access?returnTo=...` only when `KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED=true`.

- [ ] **Step 1: Add server helper to validate the accepted-entry cookie**

Validation requires `kind=accepted`, non-expired token, exact current entry key/version/hash, and an acceptance row that still exists active with matching acceptance id + anonymous entry session.

- [ ] **Step 2: Gate `/login`**

When entry enforcement is disabled, current login behavior remains unchanged. When enabled and no valid accepted-entry evidence exists, redirect to:

```text
/access?returnTo=/login
```

If a protected `returnTo` was supplied, preserve it through safe same-origin encoding so the user can return to the intended route after login.

- [ ] **Step 3: Bind after successful credentials**

In `/api/auth/login`, sequence must be:

```text
validate payload
→ rate limit
→ validate accepted entry proof when enforcement is on
→ authenticate credentials
→ create ClinicSession
→ bindEntryAcceptanceToIdentity
→ only then set auth cookie / return success
```

If binding fails, revoke/delete the newly created persistent auth session before returning an error so authentication cannot bypass the failed legal binding.

- [ ] **Step 4: Avoid duplicate baseline signing**

After binding, the row must contain the exact current entry key/version/hash and signed/e-sign timestamps so baseline entry can be recognized as completed. Do not automatically grant professional, Grid transaction, BAA, MSA, or other relationship-specific authority. Those remain separate future/additional agreements.

- [ ] **Step 5: Run focused tests**

```bash
npx vitest run tests/universal-entry-gateway.test.ts tests/entry-agreement-evidence.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/login/page.tsx src/app/api/auth/login/route.ts src/lib/legal/entry-access.ts tests
git commit -m "feat(auth): bind protected entry acceptance at login"
```

---

### Task 6: Make public Klinikos funnel every interactive professional route through `ENTER KLINIKOS`

**Files:**
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Test: `tests/universal-entry-gateway.test.ts`

**Interfaces:**
- Public informational routes remain direct.
- Protected staff/professional actions become `entryHref(returnTo)`.

- [ ] **Step 1: Add a single helper**

```ts
const entryHref = (returnTo: string) => `/access?returnTo=${encodeURIComponent(returnTo)}`;
```

Use it for Sign in and protected interactive destinations. Keep `/`, `/how-it-works`, `/pricing`, `/trust`, `/about`, public SEO/resource-detail surfaces, and patient portal paths directly accessible.

- [ ] **Step 2: Make the primary gateway CTA explicit**

The public Living Home needs a clear primary action labeled:

```text
ENTER KLINIKOS
```

that routes to `/access` and preserves the approved rose/obsidian design. Do not replace the existing public Zumi or SEO content with a giant legal wall.

- [ ] **Step 3: Preserve public Zumi as bounded acquisition intelligence**

Public Zumi may explain Klinikos and route toward public information, but protected/product actions must converge on `/access`. Do not give public Zumi authenticated Clinic OS, Grid transaction, private demo, or PHI access.

- [ ] **Step 4: Run focused gateway test**

```bash
npx vitest run tests/universal-entry-gateway.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/public-living-gateway.tsx tests/universal-entry-gateway.test.ts
git commit -m "feat(growth): converge protected actions on Enter Klinikos"
```

---

### Task 7: Document rollout controls and reconcile legal source-of-truth language

**Files:**
- Modify: `.env.example`
- Modify: `docs/legal/LEGAL_ACCESS_FOUNDATION.md`

**Interfaces:**
- No runtime authority changes beyond documentation/config flag.

- [ ] **Step 1: Add entry-gate environment flag**

Add:

```env
# Universal protected-entry airlock. Leave disabled until the 2026.08.23.1 entry agreement
# has counsel review, legal tables are deployed, and public -> entry -> login binding is proven.
KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED=""
```

Keep `LEGAL_GATE_ENFORCEMENT_ENABLED` documented for additional authenticated/product-specific agreement enforcement.

- [ ] **Step 2: Update legal-access architecture**

Document both flows explicitly:

```text
PUBLIC DISCOVERY → ENTER KLINIKOS → ENTRY AGREEMENT → ANONYMOUS EVIDENCE → SIGNUP/LOGIN → IDENTITY BINDING → PROTECTED INTERACTIVE ACCESS
```

and:

```text
AUTHENTICATED RELATIONSHIP → APPLICABLE ADDITIONAL AGREEMENT → REVIEW/SIGN → ROLE/PRODUCT-SPECIFIC ACCESS
```

State that the entry agreement is not a BAA, DPA, MSA, professional credential verification, clinical consent, or payment evidence.

- [ ] **Step 3: Commit**

```bash
git add .env.example docs/legal/LEGAL_ACCESS_FOUNDATION.md
git commit -m "docs(access): define universal entry rollout controls"
```

---

### Task 8: Run exact-head verification and open a draft PR

**Files:**
- No new production files unless verification reveals a defect.

**Interfaces:**
- Produces reviewable exact-head evidence; does not claim deployment.

- [ ] **Step 1: Run focused tests**

```bash
npx vitest run tests/universal-entry-gateway.test.ts tests/entry-agreement-evidence.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript, lint, and security boundary checks**

```bash
npm run type-check
npm run lint
npm run security:check
```

Expected: PASS, or record exact unrelated/pre-existing failures without mislabeling them as success.

- [ ] **Step 3: Run code-only release gate**

```bash
npm run verify:code
```

Expected: PASS if the environment can execute. If GitHub/container infrastructure blocks execution, record the exact evidence; do not call the branch green.

- [ ] **Step 4: Compare against latest main and active PR ownership**

Confirm no changed-file collision with #245 identity foundation, #240 theme system, active Current Visit PRs, EDU, Grid commerce/trust, or interoperability work. If `main` advanced, update/rebase safely before opening the PR.

- [ ] **Step 5: Open the PR as draft**

Title:

```text
feat(access): make Enter Klinikos the universal protected gateway
```

PR body must state:
- public SEO remains public;
- patient portal is not put behind proprietary clickwrap;
- pre-auth agreement evidence is exact-version/hash and server-authoritative;
- binding happens only after valid credential authentication;
- no new schema/migration in this tranche;
- no claim that legal text is final without counsel review;
- enforcement remains disabled until controlled production proof;
- no clinical/credential/payment authority is widened;
- no production deployment claim.

---

## Deferred follow-on programs from the umbrella spec

These are separate implementation plans after Gateway v1 is reviewable; they are not silently folded into this PR:

1. **Universal free signup + lifelong Person activation** after reconciling/landing the identity substrate from PR #245.
2. **Zumi first-run activation**: `What brings you here?` → progressive profile/context → adaptive Living Home, consuming the governed memory/knowledge work from PR #257 rather than creating another memory stack.
3. **Reference Environment / personalized demo** using synthetic data and real internal engines, with Current Visit as the physician hero workflow and no fake external completion.
4. **Living Home visual convergence** across Current Visit, Grid, EDU, Revenue Integrity, and owner operations, coordinated with PR #240 so Light is the same Klinikos composition in warm white/cream + pink/rose rather than a second visual product.
5. **Free Grid activation + commerce/pricing fabric**, consuming PRs #250/#252/#253 and future counsel-reviewed transaction-class economics.
6. **Demo → Make This Mine → implementation qualification** for specialty/location/configuration-driven clinic conversion without customer code forks.

The implementation order intentionally preserves active clinical convergence and today’s professional findings while giving Klinikos the universal acquisition/trust front door required by the broader business model.
