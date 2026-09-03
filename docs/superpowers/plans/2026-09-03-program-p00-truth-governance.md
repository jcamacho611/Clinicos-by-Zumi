# KLINIKOS P00 Truth Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Klinikos authority, execution traceability, current-state evidence, release proof, and branch/PR governance mechanically consistent before production implementation of the maximum-scope rebuild begins.

**Architecture:** Extend the repository's existing Master Canon, Authority Map, Canon Layer Registry, Feature Status, external-dependency evidence, Branch Ledger, product-truth registry, Quality workflow, and release scripts. Do not add another product authority or another runtime subsystem. P00 adds subordinate contracts, tests, evidence reconciliation, and a repository-settings gate around the truth architecture already present.

**Tech Stack:** TypeScript 5.9, Vitest 3, Node 22, existing repository scripts, GitHub Actions `quality.yml`, Markdown/YAML/JSON governance artifacts.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p00-truth-governance-design.md`

## Global Constraints

- `docs/KLINIKOS_MASTER_CANON.md` remains the sole product/company authority.
- Current verified code/schema/tests/CI/runtime evidence controls claims about what exists today.
- `ACTUAL / CONTRACTED / PIPELINE / ASSUMPTION / SCENARIO / TARGET` remain distinct.
- `LIVE_VERIFIED / BUILT_NEEDS_VERIFICATION / PARTIAL / DESIGNED / PLANNED / EXTERNAL_CONNECTION_REQUIRED / LEGAL_REVIEW_REQUIRED / NOT_BUILT / HISTORICAL_ONLY` remain distinct.
- Free Person identity and commercial organization activation are the approved commercial entry law.
- No client-visible proprietary orchestration, ranking, risk, pricing, security, prompt, secret, or unnecessary PHI/PII disclosure.
- No production code from P01+ begins until this plan's governance contracts are green or explicitly recorded as external/admin-only gaps.
- Do not modify branch protection through an unsupported or unverified mechanism. Record the external repository-setting gate if the available connector cannot perform it.

---

## File Structure

### Files to create

- `tests/master-execution-traceability.test.ts` — source contract for Execution Engine + YAML ledger completeness.
- `tests/p00-authority-map.test.ts` — source contract proving execution artifacts are subordinate to Canon/Blueprint.
- `docs/runbooks/MAIN_BRANCH_PROTECTION.md` — exact required GitHub settings and verification evidence.
- `docs/verification/2026-09-03-p00-open-pr-classification.md` — current open-PR truth snapshot with conflict classifications.

### Files to modify

- `docs/KLINIKOS_AUTHORITY_MAP.yaml` — register Master Execution Engine and traceability ledger under subordinate execution control.
- `docs/KLINIKOS_ARCHITECTURE_INDEX.md` — add the approved execution artifacts to required read order.
- `src/lib/governance/canon-layer-registry.ts` — add one subordinate execution-traceability consequence layer; no product law.
- `docs/BRANCH_LEDGER.md` — classify current relevant PRs and block conflicting/stale merge-forward.
- `docs/KLINIKOS_CURRENT_PROJECT_STATE.md` — point current execution order to P00/P01/P02/P16 rather than older free-form sequencing.
- `docs/FEATURE_STATUS.md` — refresh header/current-evidence framing without rewriting every feature from assumption.
- `docs/EXTERNAL_DEPENDENCY_MATRIX.md` — refresh current-evidence framing and ensure configuration/sandbox/live distinctions remain explicit.
- `governance/product-truth-registry.json` — ensure public claims route to current authoritative evidence classes rather than stale historical docs.
- `.github/workflows/quality.yml` — run the new P00 source-contract tests as part of normal test execution; only add a dedicated step if the existing `npm test` path does not already include them.

### Files explicitly not modified by P00

- `prisma/schema.prisma`
- clinical domain code
- Grid matching/ranking logic
- Stripe/payment execution
- Zumi hidden prompts/tools
- public/private UI components

---

### Task 1: Lock the Execution Engine source contract

**Files:**
- Create: `tests/master-execution-traceability.test.ts`
- Read: `docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md`
- Read: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml`

**Interfaces:**
- Consumes: portfolio program IDs `P00` through `P23`, frames `F0` through `F11`, performance modes, release waves `W0` through `W6`.
- Produces: a regression contract preventing accidental deletion or contradictory commercial law.

- [ ] **Step 1: Write the failing test**

Create `tests/master-execution-traceability.test.ts` with source-level assertions that:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const plan = readFileSync("docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md", "utf8");
const ledger = readFileSync("docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml", "utf8");

describe("Klinikos Master Execution Engine", () => {
  it("preserves all portfolio programs and the approved commercial entry law", () => {
    for (let i = 0; i <= 23; i += 1) {
      const id = `P${String(i).padStart(2, "0")}`;
      expect(plan).toContain(`\`${id}\``);
      expect(ledger).toContain(`  ${id}:`);
    }

    expect(ledger).toContain("person_account: FREE");
    expect(ledger).toContain("organization_activation: COMMERCIAL");
    expect(plan).toContain("Person account = free. Organization activation = commercial.");
  });

  it("preserves the full Living Reality frame and performance vocabulary", () => {
    for (let i = 0; i <= 11; i += 1) expect(ledger).toContain(`  F${i}:`);
    expect(ledger).toContain("FULL_REALITY");
    expect(ledger).toContain("BALANCED_REALITY");
    expect(ledger).toContain("PRECISION_MODE");
  });
});
```

- [ ] **Step 2: Run the focused test and verify its current behavior**

Run:

```bash
npx vitest run tests/master-execution-traceability.test.ts
```

Expected on the stacked P00 branch: PASS because #525 already introduced the parent artifacts. If it fails, treat the failure as a parent-artifact defect and correct the parent branch/plan rather than weakening this test.

- [ ] **Step 3: Mutation-test the contract**

Temporarily remove `organization_activation: COMMERCIAL` from a local copy/worktree and rerun the focused test.

Expected: FAIL on the commercial-entry-law assertion.

Restore the file byte-for-byte.

- [ ] **Step 4: Commit**

```bash
git add tests/master-execution-traceability.test.ts
git commit -m "test(governance): lock master execution traceability"
```

---

### Task 2: Register execution authority without creating another Canon

**Files:**
- Create: `tests/p00-authority-map.test.ts`
- Modify: `docs/KLINIKOS_AUTHORITY_MAP.yaml`
- Modify: `docs/KLINIKOS_ARCHITECTURE_INDEX.md`

**Interfaces:**
- Consumes: existing authority hierarchy.
- Produces: explicit subordinate routing for the Master Execution Engine and traceability ledger.

- [ ] **Step 1: Write the failing authority test**

Create assertions similar to:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authority = readFileSync("docs/KLINIKOS_AUTHORITY_MAP.yaml", "utf8");
const index = readFileSync("docs/KLINIKOS_ARCHITECTURE_INDEX.md", "utf8");

describe("P00 execution authority", () => {
  it("routes execution artifacts below the Master Canon and Blueprint", () => {
    expect(authority).toContain("docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md");
    expect(authority).toContain("docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml");
    expect(authority).toContain("may_override_master: false");
    expect(index).toContain("KLINIKOS_EXECUTION_TRACEABILITY.yaml");
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/p00-authority-map.test.ts
```

Expected: FAIL until the two execution artifacts are explicitly registered.

- [ ] **Step 3: Update `docs/KLINIKOS_AUTHORITY_MAP.yaml`**

Add a subordinate block named `portfolio_execution_control` with:

```yaml
portfolio_execution_control:
  authority: SUBORDINATE_EXECUTION_ROUTER
  generated_from:
    - docs/KLINIKOS_MASTER_CANON.md
    - docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md
  files:
    master_execution_engine: docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md
    traceability_ledger: docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml
  may_override_master: false
  may_override_blueprint: false
  may_manufacture_implementation_status: false
  child_program_rule: CHILD_SPEC_AND_DETAILED_TDD_PLAN_REQUIRED_BEFORE_PRODUCTION_IMPLEMENTATION
```

- [ ] **Step 4: Update `docs/KLINIKOS_ARCHITECTURE_INDEX.md`**

Place the two new artifacts immediately after the Master Canon / Blueprint authority section and before historical/specialist references. State that they route execution and never redefine product truth.

- [ ] **Step 5: Run GREEN**

```bash
npx vitest run tests/p00-authority-map.test.ts tests/master-execution-traceability.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/KLINIKOS_AUTHORITY_MAP.yaml docs/KLINIKOS_ARCHITECTURE_INDEX.md tests/p00-authority-map.test.ts
git commit -m "docs(governance): route master execution authority"
```

---

### Task 3: Add the execution-traceability Canon consequence layer

**Files:**
- Modify: `src/lib/governance/canon-layer-registry.ts`
- Modify/Test: `tests/canon-synchronization.test.ts`

**Interfaces:**
- Consumes: `KlinikosCanonLayer` existing type.
- Produces: one layer with ID `execution-traceability` pointing to execution governance consequences.

- [ ] **Step 1: Extend the existing synchronization test first**

Add an expectation that `klinikosCanonLayers` contains exactly one `execution-traceability` layer and that its risk controls include `no-parallel-authority` and `no-manufactured-implementation-status`.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/canon-synchronization.test.ts
```

Expected: FAIL because the layer does not yet exist.

- [ ] **Step 3: Add the minimum registry entry**

Append one `KlinikosCanonLayer` entry:

```ts
{
  id: "execution-traceability",
  name: "Master execution traceability and release truth",
  canonAnchors: [
    "SOURCE-TO-CANON / BLUEPRINT COMPLETENESS GATE",
    "Merge-forward law",
    "ACTUAL / CONTRACTED / PIPELINE / ASSUMPTION / SCENARIO / TARGET",
  ],
  blueprintAnchors: [
    "SOURCE-TO-CANON / BLUEPRINT COMPLETENESS GATE",
    "REUSE → EXTEND → GENERALIZE → CONNECT → PARTNER → BUILD NEW",
  ],
  owners: ["architecture", "release-governance", "executive-council"],
  implementationConsequences: ["master-execution-engine", "execution-traceability-ledger", "child-program-gates", "release-proof"],
  evidence: ["exact-head-ci", "deployment-evidence", "runtime-evidence", "external-connection-evidence"],
  moneyPath: ["reduces-rework", "prevents-false-commercial-claims", "capital-efficiency"],
  riskControls: ["no-parallel-authority", "no-manufactured-implementation-status", "no-target-as-actual"],
  kpis: ["orphan-requirements", "false-status-claims", "exact-release-evidence-rate"],
},
```

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/canon-synchronization.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/governance/canon-layer-registry.ts tests/canon-synchronization.test.ts
git commit -m "feat(governance): register execution traceability layer"
```

---

### Task 4: Classify the open PR portfolio against current Canon

**Files:**
- Create: `docs/verification/2026-09-03-p00-open-pr-classification.md`
- Modify: `docs/BRANCH_LEDGER.md`

**Interfaces:**
- Consumes: current GitHub open PR metadata at execution time.
- Produces: explicit current classifications and overlap rules.

- [ ] **Step 1: Refresh GitHub open PR truth**

Use GitHub, not old chat history. Record head SHA, base SHA, draft/ready state, CI state, scope overlap, and current Canon conflict for at least:

`#525, #524, #521, #519, #520, #518, #505, #506, #498, #362, #294, #264, #262` plus any newer PRs that appear.

- [ ] **Step 2: Write the classification evidence file**

Use only these states:

```text
CURRENT
STACKED
INTENTIONALLY_RED
STALE_REANCHOR_REQUIRED
CONFLICTS_WITH_CANON
COUNSEL_GATED
EXTERNAL_GATE
SAFE_TO_CLOSE
READY_FOR_RELEASE_REVIEW
```

At minimum record:

- `#525 = READY_FOR_RELEASE_REVIEW` once exact-head CI is green;
- `#524 = CURRENT/SUBORDINATE` but P01 must reconcile final rendering limits;
- `#519 = CONFLICTS_WITH_CANON` until free-organization doctrine is removed;
- `#362 = COUNSEL_GATED` for production legal activation;
- RED commercial PRs remain RED until their own TDD plan completes.

- [ ] **Step 3: Update `docs/BRANCH_LEDGER.md`**

Do not paste full PR bodies. Add current classification, owner/scope, dependency/conflict, and merge rule.

- [ ] **Step 4: Self-review for false claims**

Verify no PR is described as implemented/green/deployed merely because GitHub says `mergeable=true`.

- [ ] **Step 5: Commit**

```bash
git add docs/verification/2026-09-03-p00-open-pr-classification.md docs/BRANCH_LEDGER.md
git commit -m "docs(governance): classify active PR portfolio"
```

---

### Task 5: Reconcile current-state evidence snapshots

**Files:**
- Modify: `docs/KLINIKOS_CURRENT_PROJECT_STATE.md`
- Modify: `docs/FEATURE_STATUS.md`
- Modify: `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
- Modify: `governance/product-truth-registry.json`
- Test: existing product-truth/current-state tests, plus focused source contract if needed.

**Interfaces:**
- Consumes: current `main`, current migrations/tests, exact-head CI, runtime evidence, external connection evidence.
- Produces: current-state snapshots that are explicitly dated/audited and never promoted above implementation evidence.

- [ ] **Step 1: Audit before editing**

For each document, identify the last audited SHA/date and statements that have been superseded by current verified code or external evidence.

Do not rewrite every row from memory.

- [ ] **Step 2: Add/extend a focused source test only if no existing test protects snapshot authority**

The test must assert that these files identify themselves as evidence snapshots/current-state indexes and defer to current verified implementation rather than claiming product-law authority.

- [ ] **Step 3: Refresh headers and only verified changed rows**

Use the exact audited commit and date. If a capability cannot be reverified, preserve/mark it `VERIFY_REQUIRED`, `BUILT_NEEDS_VERIFICATION`, `PARTIAL`, `PENDING CONNECTION`, or the existing equivalent instead of guessing.

- [ ] **Step 4: Reconcile `governance/product-truth-registry.json`**

For public claims, ensure the authoritative source points to the correct current evidence file and does not rely on historical pitch/business-plan prose.

- [ ] **Step 5: Run focused tests**

```bash
npx vitest run tests/canonical-ecosystem-graph.test.ts tests/canon-synchronization.test.ts tests/master-execution-traceability.test.ts tests/p00-authority-map.test.ts
```

Also run any existing product-truth/status tests discovered during implementation.

- [ ] **Step 6: Commit**

```bash
git add docs/KLINIKOS_CURRENT_PROJECT_STATE.md docs/FEATURE_STATUS.md docs/EXTERNAL_DEPENDENCY_MATRIX.md governance/product-truth-registry.json tests
git commit -m "docs(truth): reconcile current implementation evidence"
```

---

### Task 6: Document and verify the `main` branch protection gate

**Files:**
- Create: `docs/runbooks/MAIN_BRANCH_PROTECTION.md`
- Modify: `docs/BRANCH_LEDGER.md` only if protection state changes.

**Interfaces:**
- Consumes: GitHub repository branch/ruleset state.
- Produces: externally verifiable repository-governance requirement.

- [ ] **Step 1: Record current state from GitHub**

Verify `main` protection and repository rulesets through GitHub API/UI.

Expected current baseline at plan creation: branch protection disabled, no rulesets.

- [ ] **Step 2: Write the target protection runbook**

Document the desired settings:

```text
MAIN
- Require pull request before merge
- Require successful check: verify
- Require successful check: deploy-contract
- Require conversation resolution when available
- Block force pushes
- Block deletion
- Preserve emergency admin path only if explicitly justified
```

Include verification instructions using the branch endpoint/ruleset endpoint.

- [ ] **Step 3: Apply the settings using an authorized GitHub admin mechanism**

If the active toolset exposes no write-capable protection/ruleset action, **do not fake completion**. Record:

`EXTERNAL_REPOSITORY_SETTING_REQUIRED`

and surface the exact manual/admin action to the founder.

- [ ] **Step 4: Re-query protection state**

Expected after a successful external/admin action: protection/ruleset evidence shows the required checks and force-push/delete restrictions.

- [ ] **Step 5: Commit the evidence/runbook update**

```bash
git add docs/runbooks/MAIN_BRANCH_PROTECTION.md docs/BRANCH_LEDGER.md
git commit -m "docs(release): define main branch protection gate"
```

---

### Task 7: Ensure Quality runs the P00 contracts

**Files:**
- Modify only if needed: `.github/workflows/quality.yml`
- Test: `tests/master-execution-traceability.test.ts`
- Test: `tests/p00-authority-map.test.ts`

**Interfaces:**
- Consumes: current `npm test`/Vitest lane.
- Produces: exact-head CI enforcement of P00 source contracts.

- [ ] **Step 1: Inspect `quality.yml` and package scripts**

If `npm test -- --run` or equivalent already runs all `tests/*.test.ts`, do **not** add a redundant workflow step.

- [ ] **Step 2: Prove the tests are picked up**

Run:

```bash
npm test -- --run
```

Expected: the P00 test file names appear in the run and pass.

- [ ] **Step 3: Modify workflow only if discovery proves the P00 files are excluded**

If excluded, add the smallest dedicated step:

```yaml
- name: Verify P00 governance contracts
  run: npx vitest run tests/master-execution-traceability.test.ts tests/p00-authority-map.test.ts
```

- [ ] **Step 4: Commit only if workflow changed**

```bash
git add .github/workflows/quality.yml
git commit -m "ci(governance): enforce P00 truth contracts"
```

---

### Task 8: Full exact-head verification and P00 release evidence

**Files:**
- No speculative new files; use existing release-evidence mechanism unless it requires an explicit P00 verification note.

**Interfaces:**
- Consumes: final P00 candidate SHA.
- Produces: proof that P00 can merge without weakening runtime/security/release quality.

- [ ] **Step 1: Run source confidentiality gates**

```bash
npm run security:check
```

Expected: PASS.

- [ ] **Step 2: Run database/schema gate**

```bash
npm run db:generate
npm run db:validate
```

Apply all migrations to a fresh PostgreSQL database using the repository's existing Quality/MVP path.

Expected: PASS.

- [ ] **Step 3: Run code quality**

```bash
npm run type-check
npm run lint
npm test -- --run
npm run test:mvp
npm run build
```

Expected: PASS, with only already-documented non-blocking warnings if current release law permits them.

- [ ] **Step 4: Run production startup/release contract**

Use the same startup/deploy-contract path as `.github/workflows/quality.yml`.

Expected: health/startup success for the exact candidate SHA.

- [ ] **Step 5: Verify GitHub Actions on the exact head**

Both `verify` and `deploy-contract` must conclude `success` on the same head SHA.

- [ ] **Step 6: Final diff review**

Confirm P00 changed governance/tests/evidence only and did not widen runtime authority, PHI access, clinical logic, payment logic, Grid eligibility, or external-rail status.

- [ ] **Step 7: Merge only when green**

Use expected-head SHA in the merge call. Do not merge if the branch moved after verification.

---

## P00 Definition of Done

P00 is complete only when all of the following are true:

- Master Execution Engine and traceability ledger are explicitly subordinate in the Authority Map.
- P00 source contracts are mutation-proven and exact-head green.
- Canon Layer Registry contains the execution-traceability consequence layer.
- Current PR portfolio is classified with conflicts/RED/counsel/external gates explicit.
- Feature/current-project/external-dependency truth is refreshed only from verified evidence.
- Product-truth registry points public claims to current evidence sources.
- `main` protection is verified, or the unavailable admin mutation is explicitly recorded as the one remaining external gate.
- Quality/deploy-contract pass on the exact candidate SHA.
- No production capability, external integration, payment, clinical, credential, or PHI claim has been inflated by this program.

## Self-review checklist

Before calling this plan complete:

1. Every P00 design requirement maps to a task above.
2. No task says “TBD”, “TODO”, “add appropriate handling”, or “write tests” without concrete assertions/commands.
3. All paths named above exist on current `main` except the explicitly created files.
4. No new runtime/product authority is introduced.
5. Branch protection is never claimed fixed without a GitHub settings verification response.

## Handoff

After P00 merges, the next approved plans are:

1. `P01` — Living Reality Runtime / Black Label / True 3D;
2. `P02` — Public Value / Free Person Growth / Signup Continuity;
3. `P16` — Production Security / Privacy / Legal / PHI Gate in parallel.

Implementation should use **subagent-driven development** where available, one bounded task/reviewer gate at a time.