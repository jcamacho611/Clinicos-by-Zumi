# P0 Revenue Integrity Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Klinikos revenue integrity backward from existing claim-level truth into a safe pre-claim review surface that detects a high-confidence break between reviewed coding and the claim path, then surfaces that break in Billing and Living Home without inventing revenue.

**Architecture:** Preserve `src/lib/revenue/revenue-integrity-path.ts` as canonical claim progression and `src/lib/repositories/revenue-integrity-repository.ts` as the tenant-scoped single-claim reader. Add one server-only pre-claim scanner over finalized encounters, reviewed superbills, and claim linkage. Its output is a read-only `RevenueReviewItem`, never a charge or claim. Feed the projection into Billing and the P0 `NeedsActionItem` adapter.

**Tech Stack:** TypeScript, existing Prisma/PostgreSQL schema, Next.js server components, Vitest, Billing workspace, `NeedsActionItem`, and existing MVP runner.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Depends on `2026-08-25-p0-universal-work-projection-and-living-home.md` for Living Home integration.
- Do not infer a dollar amount from CPT/HCPCS/procedure codes without an authoritative fee schedule/configuration.
- Missing claim does not equal lost revenue.
- Reviewed coding without a linked claim supports only “Billing path may need review.”
- Existing claim/payer states remain exactly as conservative as `revenue-integrity-path.ts`.
- No autonomous coding, claim creation, claim submission, or payer-status inference.
- A role without `can(role, "billing", "read")` gets no financial projection.

---

### Task 1: Define the browser-safe revenue-review vocabulary

**Files:**
- Create: `src/lib/revenue/revenue-review.ts`
- Create: `tests/revenue-review-contract.test.ts`

**Interfaces:**

```ts
export type RevenueReviewReason =
  | "reviewed_coding_without_claim"
  | "claim_missing_required_coding"
  | "open_denial";

export type RevenueEvidenceLevel = "verified_internal" | "externally_confirmed" | "unknown";

export interface RevenueReviewItem {
  id: string;
  organizationId: string;
  patientId: string;
  encounterId: string | null;
  claimId: string | null;
  reason: RevenueReviewReason;
  title: string;
  explanation: string;
  amountCents: number | null;
  evidenceLevel: RevenueEvidenceLevel;
  evidenceRefs: string[];
  href: string;
}
```

- [ ] **Step 1: Write RED contract tests**

```ts
expect(buildReviewedCodingWithoutClaimReview({
  organizationId: "org-1",
  patientId: "p-1",
  encounterId: "e-1",
  superbillId: "sb-1",
})).toMatchObject({
  reason: "reviewed_coding_without_claim",
  title: "Billing path may need review",
  amountCents: null,
  evidenceLevel: "verified_internal",
});
```

Also require every generated title/explanation to reject `/recovered|lost revenue|guaranteed/i`.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/revenue-review-contract.test.ts
```

- [ ] **Step 3: Implement pure builders**

`reviewed_coding_without_claim` uses no amount. `open_denial` may carry the stored `Denial.amountCents`. `externally_confirmed` is only accepted when the caller supplies an already verified external evidence reference.

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- tests/revenue-review-contract.test.ts
git add src/lib/revenue/revenue-review.ts tests/revenue-review-contract.test.ts
git commit -m "feat(revenue): define truthful revenue review items"
```

### Task 2: Add the tenant-scoped pre-claim scanner

**Files:**
- Create: `src/lib/repositories/revenue-review-repository.ts`
- Create: `tests/revenue-review-repository.test.ts`
- Reuse: `prisma/schema.prisma` Encounter, Superbill, ClaimDraft, Denial models.

**Interfaces:**

```ts
export async function listRevenueReviewItems(
  session: Pick<ClinicSession, "organizationId" | "role">,
): Promise<RevenueReviewItem[]>;
```

- [ ] **Step 1: Write RED authorization/query tests**

```ts
await expect(listRevenueReviewItems({
  organizationId: "org-1",
  role: "clinical_staff" as ClinicRole,
})).rejects.toMatchObject({ status: 403 });
```

Every query must contain `organizationId` inside the database predicate.

- [ ] **Step 2: Lock the first pre-claim exception**

Create `reviewed_coding_without_claim` only when all are true:

1. encounter is in the current organization;
2. encounter has a signed/finalized artifact sufficient for billing review;
3. linked superbill exists;
4. `superbill.reviewedAt !== null`;
5. `procedures` is a non-empty array;
6. `diagnoses` is a non-empty array;
7. no ClaimDraft in the same organization references that encounter or superbill.

Expected output:

```ts
expect(items[0]).toMatchObject({
  reason: "reviewed_coding_without_claim",
  amountCents: null,
  evidenceLevel: "verified_internal",
});
```

- [ ] **Step 3: Add negative tests**

No pre-claim item for Draft/unsigned encounter, unreviewed superbill, missing procedure/diagnosis evidence, existing claim, or cross-tenant data.

- [ ] **Step 4: Implement bounded explicit-select reads**

Use `take: 200` and deterministic newest-first encounter/superbill ordering. Do not return raw ORM rows to callers.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/revenue-review-repository.test.ts tests/revenue-review-contract.test.ts
git add src/lib/repositories/revenue-review-repository.ts tests/revenue-review-repository.test.ts
git commit -m "feat(revenue): detect reviewed coding without a claim path"
```

### Task 3: Project existing claim issues through the same review DTO

**Files:**
- Modify: `src/lib/repositories/revenue-review-repository.ts`
- Modify: `tests/revenue-review-repository.test.ts`
- Reuse: `src/lib/revenue/revenue-integrity-path.ts`

- [ ] **Step 1: Write RED tests for existing claims**

A claim whose canonical revenue path first unresolved stage is `coded` creates `claim_missing_required_coding`. An open Denial creates `open_denial` with stored `amountCents` and appeal deadline evidence.

```ts
expect(items.some((item) => item.reason === "claim_missing_required_coding")).toBe(true);
expect(items.some((item) => item.reason === "open_denial")).toBe(true);
```

- [ ] **Step 2: Implement by translating existing claim truth**

Do not introduce a second revenue state machine. Reuse `buildRevenueIntegrityPath(...)` or an extracted shared claim-snapshot helper.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/revenue-integrity-path.test.ts tests/revenue-integrity-repository.test.ts tests/revenue-review-repository.test.ts
git commit -am "feat(revenue): unify claim exceptions into revenue review"
```

### Task 4: Add Revenue Review to the Billing Black Label workspace

**Files:**
- Modify: `src/app/(platform)/billing/page.tsx`
- Modify: `src/components/clinic/billing-workspace-real.tsx`
- Modify: `tests/billing-black-label-revenue-integrity.test.ts`

- [ ] **Step 1: Write RED copy/presentation assertions**

Required user language: `Needs review`, `Billing path may need review`, `Open denial`, `Amount under review`. Prohibit `Lost revenue`, `Recovered revenue`, `Guaranteed recovery`.

- [ ] **Step 2: Load `listRevenueReviewItems(session)` beside existing billing/payments/Grid truth**

- [ ] **Step 3: Render a primary review queue**

Show title, explanation, amount only when authoritative, and governed link to encounter/claim. Do not expose internal evidence refs as user copy.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/billing-black-label-revenue-integrity.test.ts tests/revenue-review-repository.test.ts
git add src/app/'(platform)'/billing/page.tsx src/components/clinic/billing-workspace-real.tsx tests/billing-black-label-revenue-integrity.test.ts
git commit -m "feat(billing): surface evidence-backed revenue review"
```

### Task 5: Feed Revenue Review into Living Home unfinished work

**Files:**
- Modify: `src/lib/home/needs-action-projection.ts`
- Modify: `src/app/(platform)/dashboard/page.tsx`
- Create: `tests/needs-action-revenue-projection.test.ts`

**Interfaces:**

```ts
export function projectRevenueNeedsAction(input: {
  organizationId: string;
  role: ClinicRole;
  items: RevenueReviewItem[];
}): NeedsActionItem[];
```

- [ ] **Step 1: Write RED role tests**

Use `can(role, "billing", "read")` as the gate. No billing-read permission means no DB query and no revenue NeedsAction items.

- [ ] **Step 2: Map review items**

```ts
{
  domain: "revenue",
  state: "needs_review",
  title: item.title,
  reason: item.explanation,
  evidenceRef: `revenue-review:${item.id}`,
}
```

- [ ] **Step 3: Wire dashboard loading and grouping**

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/needs-action-revenue-projection.test.ts tests/living-home-needs-action.test.ts
git commit -am "feat(home): surface revenue review as unfinished work"
```

### Task 6: Connect Current Visit `chargeReadiness` to the review evidence

**Files:**
- Create: `src/lib/revenue/current-visit-charge-readiness.ts`
- Create: `tests/current-visit-charge-readiness.test.ts`
- Modify: `src/app/(platform)/encounters/[encounterId]/page.tsx`
- Reuse: `src/lib/clinical/close-visit-resolution.ts`

**Interfaces:**

```ts
export function buildCurrentVisitChargeReadiness(input: {
  encounterId: string;
  reviewItems: RevenueReviewItem[] | null;
}): GovernedDomainEvaluation<ChargeResolutionState>;
```

- [ ] **Step 1: Write RED tests**

`reviewItems === null` returns `not_evaluated`; a matching review exception returns `needs_attention` with `source: "revenue-review"`; evaluated empty list returns `ready` only when the repository scan actually covered that encounter.

- [ ] **Step 2: Implement pure adapter**

- [ ] **Step 3: Load billing evidence server-side only for a session allowed to see it**

If provider-facing Current Visit should not expose billing evidence for the current role, preserve `not_evaluated`; do not widen billing permission to make Close Visit look complete.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/current-visit-charge-readiness.test.ts tests/current-visit-model.test.ts
git add src/lib/revenue/current-visit-charge-readiness.ts src/app/'(platform)'/encounters/'[encounterId]'/page.tsx tests/current-visit-charge-readiness.test.ts
git commit -m "feat(revenue): connect charge readiness to governed evidence"
```

### Task 7: Add a DB-backed revenue continuity journey

**Files:**
- Create: `scripts/mvp/revenue-continuity-journey.mts`
- Modify: `scripts/mvp/run-all.mjs`

- [ ] **Step 1: Seed synthetic signed encounter + reviewed superbill + no claim**

Expect exactly one `reviewed_coding_without_claim` item with `amountCents = null`.

- [ ] **Step 2: Create/link ClaimDraft**

Expect that pre-claim item to disappear and claim-level path to become authority.

- [ ] **Step 3: Add open Denial with stored amount/deadline**

Expect one `open_denial` review item carrying only the stored amount/deadline.

- [ ] **Step 4: Resolve denial**

Expect open-denial item to disappear.

- [ ] **Step 5: Assert cross-tenant isolation**

- [ ] **Step 6: Run journey directly**

```bash
npx tsx scripts/mvp/revenue-continuity-journey.mts
```

- [ ] **Step 7: Register in `scripts/mvp/run-all.mjs`, run `npm run test:mvp`, then commit**

```bash
npm run test:mvp
git add scripts/mvp/revenue-continuity-journey.mts scripts/mvp/run-all.mjs
git commit -m "test(revenue): prove revenue continuity journey"
```

### Task 8: Final verification and PR

- [ ] **Step 1: Reconcile latest main plus the Current Visit and NeedsAction branches**

- [ ] **Step 2: Run fresh evidence**

```bash
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
npm run test:mvp
```

- [ ] **Step 3: PR non-claims**

State: no recovered-revenue claim; no expected dollar value without authoritative fee configuration; no live clearinghouse/payer confirmation beyond connector truth; no autonomous claim creation/submission; no settlement/reconciliation claim without evidence.
