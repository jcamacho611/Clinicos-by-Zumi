# Klinikos Authority Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one server-owned, fail-closed preflight layer that prevents stale prices, restricted/wrong recipients, unsupported product claims, unauthorized meetings/commitments, unsafe disclosure, and stale/conflicting authority from reaching consequential external company actions.

**Architecture:** Extend the existing CompanyOpportunity/Symphony/commercial/ecosystem authorities. The Gateway is a pure policy composer that returns `ALLOW | REVIEW_REQUIRED | BLOCK`; existing domain executors remain responsible for actually sending, scheduling, submitting, publishing, or changing payment configuration. CompanyOpportunity evidence/events and existing audit substrates preserve durable evidence without creating a second universal action database.

**Tech Stack:** TypeScript, Next.js server modules, Zod where existing contracts use it, Prisma/PostgreSQL existing CompanyOpportunity models, Vitest/Jest-compatible repository tests, existing Symphony executor/approval code, current commercial product registry, canonical ecosystem graph.

**Spec:** `docs/superpowers/specs/2026-09-02-klinikos-authority-gateway-design.md`

## Global Constraints

- `docs/KLINIKOS_MASTER_CANON.md` remains the sole active product/company authority.
- Current verified implementation remains authority for what exists today.
- Do not create a second pricing registry, CompanyOpportunity model, capability graph, outbound executor, approval system, or Master Canon.
- Reuse `evaluateSymphonySendPolicy()` for email outreach rules.
- Reuse/generalize the payload-bound approval pattern in `src/lib/company/symphony-approval.ts`.
- Open commercial PRs #498 and #517 are dependencies; do not overwrite them or copy their logic into a competing registry.
- The founder's own professors/instructors/faculty are permanently blocked from company outreach unless a future explicit founder reversal supersedes that decision.
- No meeting may be accepted/scheduled on the founder's behalf without action-bound founder approval.
- `L4_CROWN_JEWEL` information is blocked from ordinary external release even when an NDA exists.
- Browser/client state is never authority.
- Missing or conflicting authority fails closed for consequential actions.

---

## File Structure

### New server-owned authority files

- `src/lib/company/authority-gateway-types.ts` — action/decision/reason contracts only.
- `src/lib/company/authority-gateway.ts` — deterministic composition/order; no connector calls.
- `src/lib/company/authority-recipient.ts` — founder restrictions + recipient/contact-state adapter.
- `src/lib/company/authority-meeting.ts` — meeting/commitment approval evaluation.
- `src/lib/company/authority-disclosure.ts` — L0-L4 disclosure classification/policy.
- `src/lib/company/authority-commercial.ts` — read-only commercial authority adapter.
- `src/lib/company/authority-claims.ts` — canonical implementation/evidence state → external claim permission.
- `src/lib/company/authority-manifest.ts` — current authority snapshot/freshness metadata.
- `src/lib/company/company-action-approval.ts` — generalized action-bound approval validator/store contract.

### Existing files modified

- `src/lib/company/symphony-approval.ts` — become a compatibility adapter over generalized approval validation.
- `src/lib/company/symphony-execution.ts` — invoke Authority Gateway before provider send.
- `src/lib/company/symphony-policy.ts` — no rule duplication; only export/typing adjustments if necessary.
- `src/lib/company/symphony-opportunity-types.ts` — add relationship tags/verified-role metadata only if needed by the adapter; preserve existing fields.
- `src/lib/commercial/product-catalog.ts` — consume final merged #498 interface only; no Gateway-specific pricing truth.
- `src/lib/ecosystem/canonical-ecosystem-graph.ts` — no new capability graph; only version export if needed.
- `docs/KLINIKOS_MASTER_CANON.md` — merge the approved Authority Gateway law into the existing Company Command/governance section.
- `docs/KLINIKOS_AUTHORITY_MAP.yaml` — add `company_authority_gateway` scope and spec/plan references.

### Tests

- `tests/authority-gateway-contract.test.ts`
- `tests/authority-recipient.test.ts`
- `tests/authority-meeting-approval.test.ts`
- `tests/authority-disclosure.test.ts`
- `tests/authority-commercial.test.ts`
- `tests/authority-claims.test.ts`
- `tests/authority-manifest.test.ts`
- modify `tests/symphony-outbound-approval.test.ts`
- modify `tests/symphony-runtime-recovery.test.ts`
- modify `tests/canon-synchronization.test.ts`

---

### Task 1: Merge the approved law into the existing authority chain

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md` under the Company Command / company governance section
- Modify: `docs/KLINIKOS_AUTHORITY_MAP.yaml`
- Modify: `tests/canon-synchronization.test.ts`

**Interfaces:**
- Consumes: founder-approved design in `docs/superpowers/specs/2026-09-02-klinikos-authority-gateway-design.md`
- Produces: canonical text anchors that all later tasks may rely on

- [ ] **Step 1: Write the failing Canon synchronization test**

Add to `tests/canon-synchronization.test.ts`:

```ts
it("locks the founder-approved Authority Gateway law", () => {
  const master = read(masterPath);
  const authorityMap = read(authorityMapPath);
  const required = [
    "KLINIKOS AUTHORITY GATEWAY",
    "ALLOW / REVIEW_REQUIRED / BLOCK",
    "FOUNDER ACADEMIC NETWORK NO-CONTACT",
    "MEETING ACCEPTANCE REQUIRES FOUNDER APPROVAL",
    "L4_CROWN_JEWEL",
    "CURRENT COMMERCIAL AUTHORITY AT ACTION TIME",
  ];

  expect(required.filter((anchor) => !master.includes(anchor))).toEqual([]);
  expect(authorityMap).toContain("company_authority_gateway");
  expect(authorityMap).toContain("docs/superpowers/specs/2026-09-02-klinikos-authority-gateway-design.md");
});
```

- [ ] **Step 2: Run the focused test and witness RED**

Run:

```bash
npx vitest run tests/canon-synchronization.test.ts
```

Expected: FAIL because the new anchors/scope are not in the active Canon/authority map yet.

- [ ] **Step 3: Add a concise Authority Gateway subsection to the Master Canon**

Add the approved law, without duplicating the entire design spec. The Canon subsection must include these literal anchor headings/statements:

```md
### KLINIKOS AUTHORITY GATEWAY

External company actions must pass a server-owned authority preflight.
Decision vocabulary: `ALLOW / REVIEW_REQUIRED / BLOCK`.

**FOUNDER ACADEMIC NETWORK NO-CONTACT:** the founder's own professors, instructors, and faculty are blocked from company outreach unless a future explicit founder reversal supersedes this rule.

**MEETING ACCEPTANCE REQUIRES FOUNDER APPROVAL:** Klinikos may prepare meeting options but may not accept/schedule the founder without action-bound founder approval.

**CURRENT COMMERCIAL AUTHORITY AT ACTION TIME:** no price may be represented externally from historical docs, conversation memory, stale decks, or processor objects when current canonical commercial authority differs or is unresolved.

**L4_CROWN_JEWEL:** ordinary external workflows must block source code, hidden prompts, proprietary ranking/matching, secret orchestration, security topology, credentials, and comparable crown-jewel implementation detail even when an NDA exists.
```

- [ ] **Step 4: Extend the authority map**

Under `canonical_implementation_contract.scope`, add:

```yaml
    - company_authority_gateway
    - external_action_preflight
    - commercial_claim_recipient_disclosure_freshness_authority
```

Add a subordinate design entry that points at the approved spec; do not create another supreme authority.

- [ ] **Step 5: Re-run the focused test**

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/KLINIKOS_MASTER_CANON.md docs/KLINIKOS_AUTHORITY_MAP.yaml tests/canon-synchronization.test.ts
git commit -m "docs(canon): lock Authority Gateway law"
```

---

### Task 2: Define the pure Authority Gateway contract

**Files:**
- Create: `src/lib/company/authority-gateway-types.ts`
- Create: `src/lib/company/authority-gateway.ts`
- Create: `tests/authority-gateway-contract.test.ts`

**Interfaces:**
- Produces:
  - `AuthorityActionKind`
  - `AuthorityDecisionState`
  - `AuthorityReasonCode`
  - `AuthorityOperatingManifest`
  - `AuthorityActionRequest`
  - `AuthorityCheckResult`
  - `AuthorityDecision`
  - `composeAuthorityDecision(checks, manifest)`

- [ ] **Step 1: Write the failing contract test**

```ts
import {
  authorityActionKinds,
  authorityDecisionStates,
  authorityReasonCodes,
} from "@/lib/company/authority-gateway-types";
import { composeAuthorityDecision } from "@/lib/company/authority-gateway";

it("uses exactly three final decision states and fail-closed precedence", () => {
  expect(authorityDecisionStates).toEqual(["ALLOW", "REVIEW_REQUIRED", "BLOCK"]);
  expect(authorityActionKinds).toContain("MEETING_ACCEPT_OR_SCHEDULE");
  expect(authorityReasonCodes).toContain("DISCLOSURE_CROWN_JEWEL_BLOCKED");

  const manifest = {
    evaluatedAt: new Date("2026-09-02T12:00:00Z"),
    releaseSha: "abc123",
    canonVersion: "2026-09-02.1",
    authorityMapVersion: "2026-09-02.1",
    commercialAuthorityVersion: null,
    capabilityGraphVersion: null,
  };

  expect(
    composeAuthorityDecision(
      [
        { state: "ALLOW", reasonCode: "AUTHORITY_CURRENT", reason: "current", evidenceReferences: [] },
        { state: "BLOCK", reasonCode: "RECIPIENT_SUPPRESSED", reason: "suppressed", evidenceReferences: [] },
      ],
      manifest,
    ).state,
  ).toBe("BLOCK");
});
```

- [ ] **Step 2: Run and verify RED**

```bash
npx vitest run tests/authority-gateway-contract.test.ts
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement the types exactly**

In `authority-gateway-types.ts`, define the action kinds, decision states, and reason codes from the approved spec. Include:

```ts
export type AuthorityCheckResult = {
  state: AuthorityDecisionState;
  reasonCode: AuthorityReasonCode;
  reason: string;
  evidenceReferences: readonly string[];
  requiredHumanGate?: string | null;
};
```

- [ ] **Step 4: Implement fail-closed composition**

In `authority-gateway.ts`:

```ts
import "server-only";
import type {
  AuthorityCheckResult,
  AuthorityDecision,
  AuthorityOperatingManifest,
} from "@/lib/company/authority-gateway-types";

const rank = { ALLOW: 0, REVIEW_REQUIRED: 1, BLOCK: 2 } as const;

export function composeAuthorityDecision(
  checks: readonly AuthorityCheckResult[],
  manifest: AuthorityOperatingManifest,
): AuthorityDecision {
  const state = checks.reduce<AuthorityDecision["state"]>(
    (current, check) => (rank[check.state] > rank[current] ? check.state : current),
    "ALLOW",
  );

  return {
    state,
    reasonCodes: checks.map((check) => check.reasonCode),
    reasons: checks.map((check) => check.reason),
    evaluatedAt: manifest.evaluatedAt,
    manifest,
    evidenceReferences: [...new Set(checks.flatMap((check) => check.evidenceReferences))],
    requiredHumanGates: [
      ...new Set(checks.flatMap((check) => (check.requiredHumanGate ? [check.requiredHumanGate] : []))),
    ],
  };
}
```

- [ ] **Step 5: Run test and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/authority-gateway-types.ts src/lib/company/authority-gateway.ts tests/authority-gateway-contract.test.ts
git commit -m "feat(company): add Authority Gateway contract"
```

---

### Task 3: Add recipient and relationship authority without duplicating Symphony policy

**Files:**
- Create: `src/lib/company/authority-recipient.ts`
- Create: `tests/authority-recipient.test.ts`
- Modify only if necessary: `src/lib/company/symphony-opportunity-types.ts`

**Interfaces:**
- Consumes: `SymphonyOpportunity`, `SymphonyContactHistory`, `evaluateSymphonySendPolicy()`
- Produces: `evaluateRecipientAuthority(input): AuthorityCheckResult[]`

- [ ] **Step 1: Write RED tests for permanent and existing restrictions**

```ts
it("blocks the founder's own professor/instructor relationship", () => {
  const result = evaluateRecipientAuthority({
    opportunity: makeOpportunity({ personalNetworkRestricted: true }),
    history: emptyHistory(),
    now: new Date("2026-09-02T12:00:00Z"),
    senderAvailable: true,
    relationshipTags: ["FOUNDER_ACADEMIC_INSTRUCTOR"],
    recipientRoleVerifiedAt: new Date("2026-09-01T12:00:00Z"),
    roleEvidenceReviewRequired: false,
  });

  expect(result).toContainEqual(
    expect.objectContaining({
      state: "BLOCK",
      reasonCode: "RECIPIENT_PERSONAL_ACADEMIC_NETWORK_BLOCKED",
    }),
  );
});

it("preserves portal-only, bounce and active-thread blocks from Symphony", () => {
  const portal = evaluateRecipientAuthority({
    opportunity: makeOpportunity({ officialContactPolicy: "PORTAL_ONLY" }),
    history: emptyHistory(),
    now,
    senderAvailable: true,
    relationshipTags: [],
    recipientRoleVerifiedAt: now,
    roleEvidenceReviewRequired: false,
  });
  expect(portal.some((check) => check.reasonCode === "CONTACT_PATH_PORTAL_ONLY")).toBe(true);
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement the adapter**

The function must call `evaluateSymphonySendPolicy()` first and map its existing reasons into Authority Gateway reason codes; do not copy the underlying if/else rules.

Explicit hard rule:

```ts
if (input.relationshipTags.includes("FOUNDER_ACADEMIC_INSTRUCTOR")) {
  checks.push({
    state: "BLOCK",
    reasonCode: "RECIPIENT_PERSONAL_ACADEMIC_NETWORK_BLOCKED",
    reason: "The recipient is in the founder's protected academic-instructor network.",
    evidenceReferences: ["founder-policy:academic-no-contact"],
  });
}
```

If `roleEvidenceReviewRequired === true`, return `REVIEW_REQUIRED` with `RECIPIENT_ROLE_STALE` before send eligibility can become `ALLOW`.

- [ ] **Step 4: Run focused tests**

- [ ] **Step 5: Run existing Symphony policy/recovery tests to prove no regression**

```bash
npx vitest run tests/symphony-runtime-recovery.test.ts tests/symphony-outbound-approval.test.ts tests/authority-recipient.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/authority-recipient.ts src/lib/company/symphony-opportunity-types.ts tests/authority-recipient.test.ts
git commit -m "feat(company): enforce recipient authority"
```

---

### Task 4: Generalize action-bound approvals and enforce the meeting rule

**Files:**
- Create: `src/lib/company/company-action-approval.ts`
- Create: `src/lib/company/authority-meeting.ts`
- Create: `tests/authority-meeting-approval.test.ts`
- Modify: `src/lib/company/symphony-approval.ts`
- Modify: `tests/symphony-outbound-approval.test.ts`

**Interfaces:**
- Produces:
  - `CompanyActionApprovalScope = "SYMPHONY_EMAIL_SEND" | "FOUNDER_MEETING_COMMITMENT" | "EXTERNAL_COMMERCIAL_COMMITMENT" | "PRODUCTION_PAYMENT_CONFIGURATION_CHANGE"`
  - `validateCompanyActionApproval(record, expectation)`
  - `evaluateMeetingAuthority(input)`
- Existing `validateClaimedSymphonyApproval()` remains callable with the same signature via compatibility adapter.

- [ ] **Step 1: Write a RED meeting test**

```ts
it("blocks meeting acceptance without founder approval", () => {
  expect(
    evaluateMeetingAuthority({
      actionKind: "MEETING_ACCEPT_OR_SCHEDULE",
      meeting: { externalCounterparty: "Example Health", founderApprovalId: null },
      approval: null,
      now,
    }),
  ).toEqual(
    expect.objectContaining({
      state: "BLOCK",
      reasonCode: "MEETING_FOUNDER_APPROVAL_REQUIRED",
    }),
  );
});
```

Add a second test proving a meeting approval cannot authorize an email send or a different counterparty/payload.

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Extract shared approval validation**

Move the generic identity/time/payload/tool/provider/consumption checks from `symphony-approval.ts` into `company-action-approval.ts`. Keep scope validation explicit.

In `symphony-approval.ts`, preserve the exported types/function but delegate:

```ts
export function validateClaimedSymphonyApproval(
  approval: SymphonyOutboundApprovalRecord,
  expected: SymphonyApprovalExpectation,
): SymphonyApprovalValidationResult {
  return validateCompanyActionApproval(approval, {
    ...expected,
    expectedScope: "SYMPHONY_EMAIL_SEND",
  });
}
```

- [ ] **Step 4: Implement meeting authority**

`evaluateMeetingAuthority()` returns `ALLOW` only when a valid, unexpired, unrevoked, counterparty/payload-bound `FOUNDER_MEETING_COMMITMENT` approval exists.

- [ ] **Step 5: Run new + existing approval tests**

Expected: all GREEN.

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/company-action-approval.ts src/lib/company/authority-meeting.ts src/lib/company/symphony-approval.ts tests/authority-meeting-approval.test.ts tests/symphony-outbound-approval.test.ts
git commit -m "feat(company): generalize action-bound approvals"
```

---

### Task 5: Add disclosure classification and crown-jewel fail-closed policy

**Files:**
- Create: `src/lib/company/authority-disclosure.ts`
- Create: `tests/authority-disclosure.test.ts`

**Interfaces:**
- Produces:
  - `DisclosureClass`
  - `AuthorityDisclosureItem`
  - `evaluateDisclosureAuthority(items)`

- [ ] **Step 1: Write RED tests**

```ts
it("blocks L4 crown jewels even when NDA evidence is present", () => {
  const result = evaluateDisclosureAuthority([
    {
      key: "matching_algorithm",
      classification: "L4_CROWN_JEWEL",
      ndaEvidenceReference: "nda:example",
      controlledDiligenceApproved: true,
    },
  ]);

  expect(result).toContainEqual(
    expect.objectContaining({
      state: "BLOCK",
      reasonCode: "DISCLOSURE_CROWN_JEWEL_BLOCKED",
    }),
  );
});

it("requires controlled diligence approval for L3", () => {
  const [result] = evaluateDisclosureAuthority([
    {
      key: "detailed_financial_model",
      classification: "L3_RESTRICTED",
      ndaEvidenceReference: null,
      controlledDiligenceApproved: false,
    },
  ]);
  expect(result.state).toBe("REVIEW_REQUIRED");
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement exact L0-L4 policy**

Rules:

```ts
switch (item.classification) {
  case "L0_PUBLIC":
  case "L1_PITCH_SAFE":
    return allow;
  case "L2_CONTROLLED":
    return item.purposeAuthorized ? allow : review;
  case "L3_RESTRICTED":
    return item.controlledDiligenceApproved ? allow : review;
  case "L4_CROWN_JEWEL":
    return block;
}
```

Do not let NDA evidence downgrade `L4_CROWN_JEWEL`.

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add src/lib/company/authority-disclosure.ts tests/authority-disclosure.test.ts
git commit -m "feat(company): add disclosure authority"
```

---

### Task 6: Add commercial authority adapter after #498/#517 convergence

**Dependency gate:** Before touching production commercial code, refresh `main`. If #498/#517 are still open, implement/test this task on top of their current approved interface only after rebasing/merging those dependencies into the execution branch. Do not copy their code into a second registry.

**Files:**
- Create: `src/lib/company/authority-commercial.ts`
- Create: `tests/authority-commercial.test.ts`
- Consume: `src/lib/commercial/product-catalog.ts`
- Consume: `src/lib/commercial/stripe-commercial-projection.ts`

**Interfaces:**
- Consumes final `getCommercialProduct()`, `CommercialPricingStatus`, `priceType`, `priceCents`, `commercialRoute`
- Produces `evaluateCommercialAuthority(productKeys)`

- [ ] **Step 1: Write RED tests against the final #498 interface**

```ts
it("blocks retired and scenario pricing from current external disclosure", () => {
  const retired = evaluateCommercialAuthority(["grid_professional"]);
  expect(retired.some((check) => check.reasonCode === "COMMERCIAL_STATUS_NOT_DISCLOSABLE")).toBe(true);
});

it("allows current fixed public pricing from the canonical product record", () => {
  const result = evaluateCommercialAuthority(["operational_audit"]);
  expect(result).toContainEqual(
    expect.objectContaining({ state: "ALLOW", reasonCode: "COMMERCIAL_PRICE_CURRENT" }),
  );
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement read-only commercial resolution**

```ts
const currentStatuses = new Set(["ACTIVE_PUBLIC", "ACTIVE_PRIVATE"] as const);

export function evaluateCommercialAuthority(keys: readonly string[]): AuthorityCheckResult[] {
  return keys.map((key) => {
    const product = getCommercialProduct(key);
    if (!product) return blockUnknown(key);
    if (!currentStatuses.has(product.pricingStatus)) return blockNonCurrent(product);
    if (product.priceType === "historical") return blockNonCurrent(product);
    return allowCurrent(product);
  });
}
```

The adapter may expose the canonical price object to the message/quote builder after `ALLOW`; it must never embed a second amount table.

- [ ] **Step 4: Add a conflict test if #517 exposes a Stripe catalog drift result**

If the catalog verifier reports amount/status mismatch for the requested product, exact price disclosure must become `BLOCK` with `COMMERCIAL_PRICE_CONFLICT`.

- [ ] **Step 5: Run commercial + Stripe focused tests**

```bash
npx vitest run tests/authority-commercial.test.ts tests/stripe-commercial-projection.test.ts tests/stripe-catalog-manifest.test.ts
```

Use only test files that exist after #498/#517 merge; if the PRs rename a test, use the merged canonical filename, not a duplicate.

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/authority-commercial.ts tests/authority-commercial.test.ts
git commit -m "feat(company): enforce current commercial authority"
```

---

### Task 7: Add capability/claim authority over the canonical ecosystem graph

**Files:**
- Create: `src/lib/company/authority-claims.ts`
- Create: `tests/authority-claims.test.ts`
- Consume: `src/lib/ecosystem/canonical-ecosystem-graph.ts`

**Interfaces:**
- Produces `evaluateCapabilityClaim({ nodeId, claimedState, runtimeEvidenceCurrent })`
- Does not create a second capability list

- [ ] **Step 1: Write RED tests**

```ts
it("blocks a planned capability from being claimed live", () => {
  const result = evaluateCapabilityClaim({
    nodeId: "external.pharmacy_erx_rail",
    claimedState: "LIVE_VERIFIED",
    runtimeEvidenceCurrent: false,
  });
  expect(result.state).toBe("BLOCK");
  expect(result.reasonCode).toBe("CLAIM_STATE_TOO_WEAK");
});

it("allows roadmap wording for DESIGNED/PLANNED state", () => {
  const result = evaluateCapabilityClaim({
    nodeId: "business.enterprise_value",
    claimedState: "PLANNED",
    runtimeEvidenceCurrent: false,
  });
  expect(result.state).toBe("ALLOW");
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Export a lookup helper from the existing graph if none exists**

Add only:

```ts
export function getCanonicalEcosystemNode(id: string) {
  return canonicalEcosystemGraph.nodes.find((node) => node.id === id);
}
```

Do not copy nodes into `authority-claims.ts`.

- [ ] **Step 4: Implement allowed claim-state mapping**

Direct present-tense `LIVE_VERIFIED` claims require canonical state `LIVE_VERIFIED` **and** current runtime evidence. `BUILT_NEEDS_VERIFICATION` may support only qualified built/not-live wording. `PARTIAL`, `DESIGNED`, `PLANNED`, `EXTERNAL_CONNECTION_REQUIRED`, `LEGAL_REVIEW_REQUIRED`, `NOT_BUILT`, and `HISTORICAL_ONLY` may not be promoted to live status.

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/authority-claims.ts src/lib/ecosystem/canonical-ecosystem-graph.ts tests/authority-claims.test.ts
git commit -m "feat(company): enforce capability claim evidence"
```

---

### Task 8: Add the operating manifest and freshness checks

**Files:**
- Create: `src/lib/company/authority-manifest.ts`
- Create: `tests/authority-manifest.test.ts`
- Consume: `docs/KLINIKOS_AUTHORITY_MAP.yaml` version through a build-time/version constant or existing generated authority metadata; do not parse Markdown on every request.

**Interfaces:**
- Produces `buildAuthorityOperatingManifest(input)`
- Produces `evaluateFreshnessAuthority(evidence)`

- [ ] **Step 1: Write RED tests**

```ts
it("distinguishes unknown release from current release", () => {
  const manifest = buildAuthorityOperatingManifest({
    evaluatedAt: now,
    releaseSha: null,
    canonVersion: "2026-09-02.1",
    authorityMapVersion: "2026-09-02.1",
    commercialAuthorityVersion: "2026-09-01.v1",
    capabilityGraphVersion: "2026-09-02.1",
  });
  expect(manifest.releaseSha).toBeNull();
});

it("requires review for source evidence whose explicit review window elapsed", () => {
  expect(
    evaluateFreshnessAuthority({
      sourceReference: "contact:example",
      observedAt: new Date("2026-07-01T00:00:00Z"),
      reviewAfter: new Date("2026-08-01T00:00:00Z"),
      expiresAt: null,
      superseded: false,
      now,
    }).state,
  ).toBe("REVIEW_REQUIRED");
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement source-specific freshness evaluation**

Use explicit `reviewAfter`, `expiresAt`, supersession, and release identity when available. Do not invent one global 30-day TTL inside the Gateway.

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add src/lib/company/authority-manifest.ts tests/authority-manifest.test.ts
git commit -m "feat(company): add authority freshness manifest"
```

---

### Task 9: Compose the full preflight service

**Files:**
- Modify: `src/lib/company/authority-gateway.ts`
- Modify: `tests/authority-gateway-contract.test.ts`

**Interfaces:**
- Produces `evaluateAuthorityAction(request, dependencies): Promise<AuthorityDecision>`
- Dependencies are explicit functions/data; the core composer does not reach directly into connectors.

- [ ] **Step 1: Add RED end-to-end preflight tests**

Test at minimum:

```ts
it("fails closed when one domain blocks an otherwise allowed action", async () => {
  const decision = await evaluateAuthorityAction(makeEmailRequest(), makeDependencies({
    recipientChecks: [{ state: "ALLOW", reasonCode: "AUTHORITY_CURRENT", reason: "ok", evidenceReferences: [] }],
    commercialChecks: [{ state: "ALLOW", reasonCode: "COMMERCIAL_PRICE_CURRENT", reason: "ok", evidenceReferences: [] }],
    claimChecks: [{ state: "ALLOW", reasonCode: "CLAIM_CURRENT", reason: "ok", evidenceReferences: [] }],
    disclosureChecks: [{ state: "BLOCK", reasonCode: "DISCLOSURE_CROWN_JEWEL_BLOCKED", reason: "secret", evidenceReferences: [] }],
  }));

  expect(decision.state).toBe("BLOCK");
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement deterministic evaluation order**

Order:

```ts
const checks = [
  ...deps.freshnessChecks,
  ...deps.recipientChecks,
  ...deps.commercialChecks,
  ...deps.claimChecks,
  ...deps.disclosureChecks,
  ...deps.meetingChecks,
  ...deps.commitmentChecks,
];
return composeAuthorityDecision(checks, deps.manifest);
```

Do not short-circuit before collecting reason codes unless a check would itself expose restricted data.

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add src/lib/company/authority-gateway.ts tests/authority-gateway-contract.test.ts
git commit -m "feat(company): compose Authority Gateway preflight"
```

---

### Task 10: Put Symphony email execution behind the Gateway

**Files:**
- Modify: `src/lib/company/symphony-execution.ts`
- Modify: `tests/symphony-runtime-recovery.test.ts`
- Modify: `tests/symphony-outbound-approval.test.ts`
- Add if cleaner than expanding existing suites: `tests/symphony-authority-gateway.test.ts`

**Interfaces:**
- Consumes `evaluateAuthorityAction()`
- Existing provider send remains unchanged after authorization

- [ ] **Step 1: Write RED integration tests**

Test that:

```ts
expect(provider.send).not.toHaveBeenCalled();
```

when the Authority Gateway returns `BLOCK` or `REVIEW_REQUIRED`.

Also test that the provider sends exactly once when:

- recipient/contact policy allows;
- no forbidden academic relationship exists;
- price/claims/disclosure are safe;
- exact Symphony send approval validates and is consumed;
- Gateway result is `ALLOW`.

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Integrate immediately before claimed approval/provider execution**

The execution sequence should become:

```ts
const authorityDecision = await input.authorityGateway.evaluate(request);
if (authorityDecision.state !== "ALLOW") {
  return {
    ok: false,
    state: "SEND_BLOCKED_POLICY",
    reason: authorityDecision.reasons.join(" "),
    authorityDecision,
  };
}

// Existing approval consumption/validation and provider send continue here.
```

Do not remove existing Symphony policy/approval validation; Gateway composes them.

- [ ] **Step 4: Run focused tests**

```bash
npx vitest run \
  tests/authority-gateway-contract.test.ts \
  tests/authority-recipient.test.ts \
  tests/authority-disclosure.test.ts \
  tests/authority-commercial.test.ts \
  tests/authority-claims.test.ts \
  tests/symphony-runtime-recovery.test.ts \
  tests/symphony-outbound-approval.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/company/symphony-execution.ts tests/symphony-runtime-recovery.test.ts tests/symphony-outbound-approval.test.ts tests/symphony-authority-gateway.test.ts
git commit -m "feat(company): gate Symphony sends through authority preflight"
```

---

### Task 11: Record durable authority evidence without a shadow action database

**Files:**
- Modify: `src/lib/company/company-opportunity-contract.ts`
- Modify: `src/lib/company/company-opportunity-api.ts` or the repository method that appends CompanyOpportunity events
- Add: `tests/company-authority-evidence.test.ts`
- No new Prisma model unless an implementation review proves an existing event/evidence substrate cannot preserve the required fields.

**Interfaces:**
- Produces `recordAuthorityDecisionEvent()` for CompanyOpportunity-scoped actions

- [ ] **Step 1: Write RED test**

Assert an event can persist:

```ts
{
  eventType: "AUTHORITY_PREFLIGHT_DECIDED",
  reason: "BLOCK: RECIPIENT_HARD_BOUNCED",
  railType: "AUTHORITY_GATEWAY",
}
```

with an evidence reference when one exists.

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Extend the existing event contract**

Use `CompanyOpportunityEvent`; do not add `AuthorityAction` as a second universal business object.

- [ ] **Step 4: Run CompanyOpportunity schema/contract tests**

```bash
npx vitest run tests/company-opportunity-schema.test.ts tests/company-authority-evidence.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/company/company-opportunity-contract.ts src/lib/company/company-opportunity-api.ts tests/company-authority-evidence.test.ts
git commit -m "feat(company): persist authority decision evidence"
```

---

### Task 12: Add Company Command governance projection

**Files:**
- Reuse the existing authenticated Command route/components discovered on current `main`; do not create a second founder app.
- Create a server-side projection module such as `src/lib/company/authority-command-projection.ts` if no current projection file owns this concern.
- Add focused projection/UI tests using the existing Company Command testing pattern.

**Interfaces:**
- Read-only metrics only; no new authority

- [ ] **Step 1: Write RED projection test**

```ts
expect(projectAuthorityHealth(input)).toEqual(
  expect.objectContaining({
    blockedActions: 2,
    pendingMeetingApprovals: 1,
    staleRecipientEvidence: 1,
    commercialConflicts: 0,
    crownJewelBlocks: 1,
  }),
);
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement a minimal projection over existing event/evidence data**

Do not expose secret policy internals, restricted evidence text, hidden prompts, or security topology.

- [ ] **Step 4: Add one compact Truth & Governance surface inside existing Command**

Display counts/statuses and safe drill-down reasons only.

- [ ] **Step 5: Run focused route/UI tests**

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/authority-command-projection.ts src/app tests
git commit -m "feat(command): project authority health"
```

Before committing, replace broad `src/app tests` staging with the exact changed Command paths printed by `git status --short`; never stage unrelated frontend work.

---

### Task 13: Red-team the permanent failure cases and run full verification

**Files:**
- Create: `tests/authority-gateway-red-team.test.ts`
- Modify no production behavior unless a failing red-team case exposes a real gap

**Interfaces:**
- Verifies the completed spec acceptance matrix

- [ ] **Step 1: Encode the failure matrix**

Use table-driven tests for:

```ts
[
  ["retired price", "BLOCK"],
  ["founder professor", "BLOCK"],
  ["hard bounce", "BLOCK"],
  ["portal only", "BLOCK"],
  ["duplicate active thread", "BLOCK"],
  ["meeting no approval", "BLOCK"],
  ["meeting wrong approval", "BLOCK"],
  ["L4 with NDA", "BLOCK"],
  ["planned claimed live", "BLOCK"],
  ["built unverified claimed live", "BLOCK"],
  ["stale recipient role", "REVIEW_REQUIRED"],
  ["verified safe action", "ALLOW"],
] as const;
```

- [ ] **Step 2: Run the red-team suite**

Expected: GREEN only after every permanent failure case is mechanically enforced.

- [ ] **Step 3: Run repository verification**

Run the repository's current canonical commands from `package.json`/CI after refreshing them from current `main`. At minimum:

```bash
git diff --check
npm run typecheck
npm run lint
npm test
npm run build
```

Also run the existing confidentiality/security gates and PostgreSQL-backed journey tests exactly as current CI defines them.

- [ ] **Step 4: Review exact-head CI**

Do not claim completion from local GREEN alone. Verify CI against the exact PR head.

- [ ] **Step 5: Browser/security verification for Command projection**

Confirm the client bundle contains no crown-jewel classifier data, hidden prompts, recipient-restriction internals beyond safe presentation DTOs, secrets, or raw evidence objects.

- [ ] **Step 6: Commit final test hardening**

```bash
git add tests/authority-gateway-red-team.test.ts
git commit -m "test(company): red-team Authority Gateway"
```

---

## P0 Administrative Controls Outside This Code Plan

These are separate from the code tranche and must be handled by a repository administrator because the current GitHub state at plan creation reports `main` as unprotected and the repository as public.

1. Make the production repository private unless a deliberate, reviewed open-source boundary is approved.
2. Add a GitHub ruleset/branch protection for `main` requiring PRs and current Quality/security checks.
3. Disallow force-push and branch deletion on `main`.
4. Preserve a controlled automation bypass only if the current merge/release train genuinely requires it.
5. Verify the ruleset against the existing multi-agent release flow before making it mandatory.

These controls are not substitutes for the Authority Gateway; they protect the code/Canon that defines it.

---

## Self-Review Checklist

### Spec coverage

- Stale/wrong pricing: Tasks 6, 9, 13.
- Wrong/restricted contacts: Tasks 3, 9, 10, 13.
- Permanent professor rule: Tasks 1, 3, 13.
- Meeting approval rule: Tasks 1, 4, 9, 13.
- Trade-secret disclosure: Tasks 5, 9, 13.
- Unsupported product claims: Task 7, 9, 13.
- Freshness/manifest: Task 8.
- Existing Symphony reuse: Tasks 3, 4, 10.
- Durable evidence/no shadow DB: Task 11.
- Company Command visibility: Task 12.
- Canon/authority synchronization: Task 1.
- Commercial dependency coordination with #498/#517: Task 6.

### Placeholder scan

This plan contains no `TBD`, `TODO`, “implement later,” generic error-handling placeholders, or undefined neighboring interfaces required for execution.

### Type consistency

The plan consistently uses `AuthorityCheckResult`, `AuthorityDecision`, `AuthorityOperatingManifest`, `AuthorityActionRequest`, `evaluateAuthorityAction()`, and the `ALLOW | REVIEW_REQUIRED | BLOCK` decision vocabulary established in Task 2.
