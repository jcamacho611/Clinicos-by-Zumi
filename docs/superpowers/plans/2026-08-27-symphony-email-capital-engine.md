# Symphony Email-First Company Execution Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first production-shaped, no-migration Symphony foundation that classifies company opportunities, enforces outbound safety/deduplication, prioritizes the highest-leverage work, builds truthful email messages, and reuses the existing outbound communications port without creating a parallel CRM or funding database.

**Architecture:** Keep Symphony server-side and pure wherever possible. The first tranche consists of typed orchestration modules plus an injected execution boundary; persistence remains behind caller-provided history/register interfaces until existing company-register storage is reconciled. A thin server adapter reuses `src/lib/communications/outbound.ts` so provider evidence remains authoritative.

**Tech Stack:** TypeScript 5.9, Vitest 3.2, Next.js 15 repository conventions.

**Spec:** `docs/superpowers/specs/2026-08-27-symphony-email-capital-engine-design.md`

## Global Constraints

- Preserve `CURRENT_FACT`, `PROPOSED`, and `EXECUTED` truth semantics.
- Do not create a second CRM, capital register, customer register, investor register, or email-delivery system.
- Do not add a Prisma migration in this tranche.
- Reuse the existing company register identities and `src/lib/communications/outbound.ts`.
- Provider acceptance is not response, application submission, award, contract, or cash.
- Unknown/competitor targets fail closed for ordinary outreach.
- Hard bounces and explicit suppression fail closed.
- Existing substantive threads outrank additional generic first-touch email.
- User-only gates include identity verification, SSN, MFA, personal attestations, hard pulls, personal guarantees, collateral, signatures, binding legal/financial acceptance, and securities issuance/acceptance.
- No sensitive personal financial documents or credentials are included in generated email.
- No browser/UI work in this tranche; proprietary prioritization/policy remains server-side.
- Current GitHub Actions runner allocation is externally blocked. Contract tests must be committed before implementation, but exact RED/GREEN execution cannot be claimed until a real runner or local checkout executes them.

---

### Task 1: Lock Symphony vocabulary and existing-register mappings

**Files:**
- Create: `tests/symphony-email-capital-engine.test.ts`
- Create: `src/lib/company/symphony-opportunity-types.ts`

**Interfaces:**
- Consumes: `CompanyTruthClass` and existing register IDs from `src/lib/company-execution-control-plane.ts`.
- Produces: `SymphonyOpportunityClass`, `SymphonyTargetClass`, `SymphonyExecutionState`, `SymphonyMessageFamily`, `SymphonyOpportunity`, `SymphonyContactHistory`, `SymphonyUserGate`, and `symphonyRegisterMap`.

- [ ] **Step 1:** Add contract tests that import the Symphony module before it exists and require all ten opportunity classes, ten target classes, twenty-one execution states, and mappings into existing register IDs.
- [ ] **Step 2:** Execute `npm test -- tests/symphony-email-capital-engine.test.ts` when a runner is available and confirm RED because `@/lib/company/symphony-opportunity-types` does not exist.
- [ ] **Step 3:** Implement the minimum typed vocabulary and register map.
- [ ] **Step 4:** Re-run the focused test and confirm GREEN when executable infrastructure is available.

### Task 2: Add deterministic outreach policy and deduplication

**Files:**
- Modify: `tests/symphony-email-capital-engine.test.ts`
- Create: `src/lib/company/symphony-policy.ts`

**Interfaces:**
- Consumes: `SymphonyOpportunity`, `SymphonyContactHistory`, `SymphonyTargetClass`, and `SymphonyUserGate`.
- Produces: `evaluateSymphonySendPolicy(input)` and `requiresSymphonyUserAction(gate)`.

Policy contract:

```ts
export type SymphonySendPolicyInput = {
  opportunity: SymphonyOpportunity;
  history: SymphonyContactHistory;
  now: Date;
  senderAvailable: boolean;
};

export type SymphonySendPolicyResult =
  | { allowed: true; nextState: "EMAIL_PREPARED"; reason: string }
  | { allowed: false; nextState: "READY_TO_SEND_CONNECTION_REQUIRED" | "SEND_BLOCKED_POLICY" | "CLOSED"; reason: string };
```

- [ ] **Step 1:** Add failing tests for UNKNOWN, COMPETITOR, hard-bounce, explicit suppression, personal-network restriction, duplicate same-purpose first-touch, active substantive thread, not-yet-due follow-up, stale deadline, portal-contact prohibition, and missing sender.
- [ ] **Step 2:** Confirm the tests fail because policy functions do not exist when execution is available.
- [ ] **Step 3:** Implement fail-closed policy with normalized email/domain comparisons and deliberate follow-up timing.
- [ ] **Step 4:** Confirm focused tests pass when executable infrastructure is available.

### Task 3: Add explainable priority scoring

**Files:**
- Modify: `tests/symphony-email-capital-engine.test.ts`
- Create: `src/lib/company/symphony-priority.ts`

**Interfaces:**
- Produces: `scoreSymphonyOpportunity(input)` returning `{ score, reasons }`.

Input factors are normalized `0..100` values for fit, eligibility confidence, urgency, expected-value signal, strategic multiplier, effort burden, commitment burden, and founder-action burden plus relationship state.

- [ ] **Step 1:** Add failing tests proving that a substantive reply/referral/requested proposal outranks an unrelated cold target even when the cold target has a larger theoretical value.
- [ ] **Step 2:** Add a failing test proving lender/debt commitment burden reduces priority rather than being mislabeled as free capital.
- [ ] **Step 3:** Implement a deterministic weighted formula with a large warm-response bonus and returned human-readable reasons.
- [ ] **Step 4:** Confirm all priority tests pass when executable infrastructure is available.

### Task 4: Add truthful message-family builder

**Files:**
- Modify: `tests/symphony-email-capital-engine.test.ts`
- Create: `src/lib/company/symphony-message-builder.ts`

**Interfaces:**
- Consumes an explicit `SymphonyCompanyProfile` rather than hidden chat memory.
- Produces: `buildSymphonyEmail(input): { channel: "email"; to: string; subject: string; body: string }`.

The company profile separates:

```ts
verifiedFacts: Array<{ text: string; truthClass: "CURRENT_FACT" | "EXECUTED" }>;
visionStatements: string[];
```

- [ ] **Step 1:** Add failing tests for funding/program routing, government, customer, accelerator, investor, lender, and partnership message families.
- [ ] **Step 2:** Add tests proving the builder rejects empty recipients/asks and does not promote `PROPOSED` statements into verified-current-fact slots.
- [ ] **Step 3:** Implement concise message builders that state one specific ask and keep vision distinct from current verified facts.
- [ ] **Step 4:** Confirm tests pass when executable infrastructure is available.

### Task 5: Add execution orchestrator and real outbound adapter

**Files:**
- Modify: `tests/symphony-email-capital-engine.test.ts`
- Create: `src/lib/company/symphony-execution.ts`
- Create: `src/lib/company/symphony-outbound-adapter.ts`

**Interfaces:**

```ts
export type SymphonySender = (message: OutboundMessage) => Promise<OutboundResult>;

export async function executeSymphonyEmail(input: {
  opportunity: SymphonyOpportunity;
  history: SymphonyContactHistory;
  profile: SymphonyCompanyProfile;
  now: Date;
  senderAvailable: boolean;
  sender: SymphonySender;
}): Promise<SymphonyExecutionResult>;
```

`createKlinikosSymphonySender()` in the server-only adapter delegates to `deliverOutbound`.

- [ ] **Step 1:** Add tests proving missing sender returns `READY_TO_SEND_CONNECTION_REQUIRED` without calling the sender.
- [ ] **Step 2:** Add tests proving provider rejection returns `DELIVERY_FAILED` and provider acceptance returns `PROVIDER_ACCEPTED` only when a provider reference exists.
- [ ] **Step 3:** Add tests proving blocked policy never invokes the sender.
- [ ] **Step 4:** Implement orchestration and thin server adapter.
- [ ] **Step 5:** Confirm focused tests pass when executable infrastructure is available.

### Task 6: Document runtime truth and future persistence boundary

**Files:**
- Create: `docs/business/KLINIKOS_SYMPHONY_EMAIL_ONLY_CONTROL_PLANE.md`
- Modify: `docs/superpowers/specs/2026-08-27-symphony-email-capital-engine-design.md`

- [ ] **Step 1:** Document what v1 actually implements versus what remains an external adapter/persistence task.
- [ ] **Step 2:** Record that Outlook connected to ChatGPT is operator tooling, not production application evidence.
- [ ] **Step 3:** Record that Resend/configuration existence is not verified-live delivery until runtime/provider evidence exists.
- [ ] **Step 4:** Record next persistence decision: first reconcile existing prospect/register data before any new table.

### Task 7: Review and PR

**Files:** all files in Tasks 1-6.

- [ ] **Step 1:** Compare branch against current `main` and identify concurrent overlap.
- [ ] **Step 2:** Verify no Prisma/schema/migration change exists.
- [ ] **Step 3:** Verify no secrets, private contact lists, sensitive financial data, or private mailbox content were added.
- [ ] **Step 4:** Run focused test, type-check, lint, security gates, and build if an executable environment becomes available.
- [ ] **Step 5:** If execution remains unavailable because GitHub cannot allocate a runner, open a **draft** PR and state that exact limitation instead of calling it green.
- [ ] **Step 6:** Do not merge until exact-head executable verification is available or another trusted execution path proves the candidate.