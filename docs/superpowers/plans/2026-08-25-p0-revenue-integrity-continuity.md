# P0 Revenue Integrity Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Klinikos revenue integrity backward from existing claim-level truth into a safe pre-claim review surface that can detect one high-confidence break between documented/coded work and the billing path, then surface that break in Billing and Living Home without inventing revenue.

**Architecture:** Preserve `revenue-integrity-path.ts` as the canonical claim progression and `revenue-integrity-repository.ts` as the tenant-scoped single-claim reader. Add a separate server-only pre-claim scanner over signed/finalized encounters, reviewed coding/superbill evidence, and claim linkage. Its output is a read-only `RevenueReviewItem`, not a new claim or charge. Feed that projection into Billing and, through the P0 `NeedsActionItem` adapter, into owner/biller Living Home.

**Tech Stack:** TypeScript, Prisma/PostgreSQL existing schema, Next.js server components, Vitest, existing Billing workspace and NeedsAction projection.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Depends on the Universal Work Projection plan for Living Home integration.
- Do not infer an amount from CPT/HCPCS or procedure codes unless an authoritative fee schedule/configuration is explicitly connected.
- A missing claim is not automatically “lost revenue.”
- A reviewed superbill/complete coding record may support “billing path may need review,” not “money lost.”
- Existing claim/payer states remain exactly as conservative as `revenue-integrity-path.ts` defines them.
- No production claim submission is added here.
- No autonomous coding or claim creation.
- Role without billing read receives no financial projection.

---

### Task 1: Define `RevenueReviewItem` and safe issue vocabulary

**Files:**
- Create: `src/lib/revenue/revenue-review.ts`
- Create: `tests/revenue-review-contract.test.ts`

**Interfaces:**

```ts
export type RevenueReviewReason =
  | "signed_encounter_without_billing_path"
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

- [ ] **Step 1: Write failing contract tests**

Prove:

- `amountCents` may be null and must remain null when no authoritative amount exists;
- externally confirmed state cannot be constructed without external evidence input in the pure builder;
- title/explanation use review language, not recovered/lost language.

Example expected wording:

```ts
expect(item.title).toBe("Billing path may need review");
expect(item.explanation).toContain("No claim is linked");
expect(item.explanation).not.toMatch(/recovered|lost revenue|guaranteed/i);
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- tests/revenue-review-contract.test.ts
```

- [ ] **Step 3: Implement types + pure builders**

Keep this module browser-safe if Billing/Living Home will consume the DTO.

- [ ] **Step 4: Verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add src/lib/revenue/revenue-review.ts tests/revenue-review-contract.test.ts
git commit -m "feat(revenue): define truthful revenue review items"
```

### Task 2: Add tenant-scoped pre-claim scanner

**Files:**
- Create: `src/lib/repositories/revenue-review-repository.ts`
- Create: `tests/revenue-review-repository.test.ts`
- Read/reuse: `src/lib/repositories/billing-truth-repository.ts`
- Read/reuse: current Encounter/Superbill/ClaimDraft Prisma relations in `prisma/schema.prisma`.

**Interfaces:**

```ts
export async function listRevenueReviewItems(
  session: Pick<ClinicSession, "organizationId" | "role">,
): Promise<RevenueReviewItem[]>;
```

- [ ] **Step 1: Write failing authorization and query-scope tests**

Mock `db` using the same pattern as `tests/revenue-integrity-repository.test.ts`.

Prove:

```ts
await expect(listRevenueReviewItems({ organizationId: "org-1", role: "clinical_staff" as ClinicRole }))
  .rejects.toMatchObject({ status: 403 });
```

and all DB reads carry `organizationId` inside the query.

- [ ] **Step 2: Lock the first high-confidence exception**

The scanner should create `reviewed_coding_without_claim` only when repository evidence proves all of:

1. encounter belongs to organization;
2. encounter is finalized/signed enough for billing review;
3. a superbill/coding artifact exists and is reviewed or otherwise in the repository-defined human-reviewed state;
4. at least one procedure and diagnosis are present;
5. no `ClaimDraft` is linked to that encounter/superbill.

Expected output:

```ts
expect(items[0]).toMatchObject({
  reason: "reviewed_coding_without_claim",
  amountCents: null,
  evidenceLevel: "verified_internal",
});
```

- [ ] **Step 3: Add negative tests**

No item when:

- encounter is Draft;
- coding is incomplete;
- claim already exists;
- cross-tenant rows exist;
- no evidence supports a billing expectation.

- [ ] **Step 4: Implement explicit-select repository**

Do not use broad `include: true`. Return only the fields required to build the DTO. Prefer bounded result counts and deterministic ordering.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/revenue-review-repository.test.ts tests/revenue-review-contract.test.ts
git add src/lib/repositories/revenue-review-repository.ts tests/revenue-review-repository.test.ts
git commit -m "feat(revenue): detect reviewed coding without a billing path"
```

### Task 3: Add existing-claim issues to the same review model without duplicating claim truth

**Files:**
- Modify: `src/lib/repositories/revenue-review-repository.ts`
- Modify: `tests/revenue-review-repository.test.ts`
- Reuse: `buildRevenueIntegrityPath(...)` / `readRevenueIntegrityPath(...)` logic where appropriate.

**Interfaces:**
- Produces review items for:
  - claim missing coding;
  - open denial;
  - optionally signed encounter without any billing artifact only if product/business rules can prove such a billing path is expected.

- [ ] **Step 1: Write tests for claim missing coding + open denial**

Use existing claim facts, not new interpretation.

```ts
expect(items.some((item) => item.reason === "claim_missing_required_coding")).toBe(true);
expect(items.some((item) => item.reason === "open_denial")).toBe(true);
```

For a denial, amount may use the existing `denial.amountCents` because it is stored evidence; label it as amount under review/denied, not recovered money.

- [ ] **Step 2: Implement using existing claim path vocabulary**

Do not create a competing revenue state machine. Where possible, translate `RevenueIntegrityPath.firstUnresolved` / existing denial state into review items.

- [ ] **Step 3: Verify**

```bash
npm test -- tests/revenue-integrity-path.test.ts tests/revenue-integrity-repository.test.ts tests/revenue-review-repository.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(revenue): unify claim exceptions into revenue review"
```

### Task 4: Add revenue review to Billing Black Label workspace

**Files:**
- Modify: `src/app/(platform)/billing/page.tsx`
- Modify: `src/components/clinic/billing-workspace-real.tsx`
- Modify: `tests/billing-black-label-revenue-integrity.test.ts`

**Interfaces:**
- Billing page additionally loads `listRevenueReviewItems(session)`.
- `BillingWorkspaceReal` receives `revenueReview: RevenueReviewItem[]`.

- [ ] **Step 1: Write failing Billing contract**

Required public-facing copy:

```text
Needs review
Charge/claim path not found
Open denial
Amount under review
```

Prohibited copy:

```text
Lost revenue
Recovered revenue
Guaranteed recovery
```

- [ ] **Step 2: Load review items server-side**

Extend existing Promise.all without changing Grid/payments truth.

- [ ] **Step 3: Render the review queue as a primary actionable section**

For each item show:

- plain-language title;
- explanation;
- amount only if stored authoritative amount exists;
- evidence level language where useful;
- link to governed encounter/claim/billing surface.

- [ ] **Step 4: Verify Black Label responsive/accessibility behavior**

- [ ] **Step 5: Commit**

```bash
git add src/app/'(platform)'/billing/page.tsx src/components/clinic/billing-workspace-real.tsx tests/billing-black-label-revenue-integrity.test.ts
git commit -m "feat(billing): surface evidence-backed revenue review"
```

### Task 5: Feed revenue review into the universal unfinished-work projection

**Files:**
- Modify: `src/lib/home/needs-action-projection.ts`
- Modify: `src/app/(platform)/dashboard/page.tsx`
- Create/Modify: `tests/needs-action-revenue-projection.test.ts`

**Interfaces:**

```ts
export function projectRevenueNeedsAction(input: {
  organizationId: string;
  role: ClinicRole;
  items: RevenueReviewItem[];
}): NeedsActionItem[];
```

- [ ] **Step 1: Write failing role/privacy tests**

Owner/biller/admin with billing read may receive items. Clinical staff/provider without billing read must not receive financial projections merely because they can see an encounter.

- [ ] **Step 2: Map review vocabulary**

Examples:

```ts
{
  domain: "revenue",
  state: "needs_review",
  title: "Billing path may need review",
  reason: item.explanation,
  evidenceRef: `revenue-review:${item.id}`,
}
```

- [ ] **Step 3: Wire dashboard loading only for permitted roles**

Prefer avoiding the DB query entirely when billing read is unavailable.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/needs-action-revenue-projection.test.ts tests/living-home-needs-action.test.ts
git commit -am "feat(home): surface revenue review as unfinished work"
```

### Task 6: Connect Current Visit charge-readiness evaluation to actual evidence

**Files:**
- Modify: `src/app/(platform)/encounters/[encounterId]/page.tsx` or a server composition helper.
- Modify: `src/lib/clinical/current-visit-model.ts` tests if needed.
- Test: `tests/current-visit-charge-readiness.test.ts`
- Reuse: `close-visit-resolution.ts` `chargeReadiness` governed evaluation slot.

**Interfaces:**
- Produce a `GovernedDomainEvaluation<ChargeResolutionState>` from actual repository evidence:

```ts
{ state: "ready" | "needs_attention" | "not_applicable", source: "revenue-review", evidenceRef: "..." }
```

or preserve `not_evaluated` when evidence is insufficient.

- [ ] **Step 1: Write failing tests**

A Current Visit with no evaluated billing evidence remains `not_evaluated`; do not invent a pass. A finalized encounter with a verified review exception becomes `needs_attention` and the Close Visit panel explains that billing review remains.

- [ ] **Step 2: Implement server evaluation adapter**

Keep the evaluation out of the client.

- [ ] **Step 3: Verify**

```bash
npm test -- tests/current-visit-charge-readiness.test.ts tests/current-visit-model.test.ts
```

- [ ] **Step 4: Commit**

### Task 7: DB-backed revenue continuity journey

**Files:**
- Add a DB journey following repository conventions.

- [ ] **Step 1: Seed synthetic signed encounter + reviewed superbill + no claim**

Expected: one review item, `amountCents = null`.

- [ ] **Step 2: Create/link a claim draft**

Expected: pre-claim review item disappears; claim-level revenue path becomes the authority.

- [ ] **Step 3: Add an open denial**

Expected: denial review item appears using stored denial amount/date evidence.

- [ ] **Step 4: Resolve denial**

Expected: open-denial item disappears.

- [ ] **Step 5: Cross-tenant negative assertion**

- [ ] **Step 6: Commit**

### Task 8: Final verification and PR

- [ ] **Step 1: Reconcile latest main / current-visit / NeedsAction branches**

- [ ] **Step 2: Run**

```bash
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

- [ ] **Step 3: PR non-claims**

Explicitly state:

- no recovered-revenue claim;
- no fee schedule/expected dollar value unless separately configured;
- no live clearinghouse/payer confirmation beyond connector truth;
- no autonomous claim creation/submission;
- no reconciliation settlement claim unless real evidence exists.
