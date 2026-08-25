# Klinikos Company Execution Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the approved company operating architecture into a machine-readable, testable execution control plane that governs company registers, stage gates, revenue engines, Zumi company authority, and executive next-action discipline.

**Architecture:** Extend the existing `company-operating-canon.ts` rather than creating a competing company authority. Add one focused control-plane module containing registries and types, one Vitest contract suite, and governance documents that explain how agents use the registries. Update `CLAUDE.md` so future agents must load the execution layer.

**Tech Stack:** TypeScript 5.9, Vitest 3.2, existing Next.js repository conventions.

**Spec:** `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` plus the approved Supreme Company Master Prompt V2.

## Global Constraints

- Preserve `CURRENT FACT`, `PROPOSED`, and `EXECUTED` truth classes.
- Do not fabricate revenue, customers, capital, integrations, security evidence, or traction.
- Reuse `companyMetricRegistry` as metric authority instead of duplicating metric definitions.
- Scenario-only metrics may not satisfy execution stage gates.
- Zumi may automate routine delegated actions but may not cross legal signature, ownership, banking, clinical authority, patient consent, regulated credential authority, irreversible external commitments, or unsupported public claims.
- No new runtime dashboard is part of this tranche. This tranche creates the company governance substrate that a later dashboard can safely project.

---

### Task 1: Add the machine-readable company execution control plane

**Files:**
- Create: `src/lib/company-execution-control-plane.ts`
- Test: `tests/company-execution-control-plane.test.ts`

**Interfaces:**
- Consumes: `companyMetricRegistry` from `@/lib/company-operating-canon`.
- Produces: `companyRegisterRegistry`, `companyStageRegistry`, `companyRevenueEngineRegistry`, `companyDecisionClassRegistry`, `zumiCompanyAuthorityRegistry`, `companyExecutiveBriefContract`.

- [ ] **Step 1: Write failing contract tests** for unique IDs, required registers, ordered stage gates, revenue-engine ownership, non-delegable authority, and exclusion of scenario-only metrics from stage-gate evidence.
- [ ] **Step 2: Verify the new test is expected to fail before implementation** because the module does not exist.
- [ ] **Step 3: Implement the minimum typed registries** with explicit ownership, evidence, next-action, and truth requirements.
- [ ] **Step 4: Re-run the focused test** and confirm the registry contract passes.
- [ ] **Step 5: Commit** with `governance: add company execution control plane`.

### Task 2: Add stage-gate and executive execution governance

**Files:**
- Create: `governance/KLINIKOS_COMPANY_EXECUTION_CONTROL_PLANE.md`
- Create: `governance/KLINIKOS_COMPANY_STAGE_GATES.md`

**Interfaces:**
- Consumes: registries from `src/lib/company-execution-control-plane.ts` and company operating law from `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md`.
- Produces: the human-readable company command loop and evidence requirements for advancing from truth foundation to cash proof, repeatability, network proof, enterprise proof, and platform scale.

- [ ] **Step 1:** Document the executive command loop `READ TRUTH → IDENTIFY BOTTLENECK → CHOOSE NEXT ACTION → EXECUTE → VERIFY → UPDATE REGISTERS → MEASURE → CONTINUE`.
- [ ] **Step 2:** Define stage gates with explicit evidence, allowed claims, forbidden shortcuts, and exit conditions.
- [ ] **Step 3:** Define the executive brief contract for daily/weekly operation.
- [ ] **Step 4:** Define how capital, hiring, partnerships, pricing, and roadmap changes depend on stage/evidence rather than ambition alone.
- [ ] **Step 5:** Commit with `governance: define company stage gates`.

### Task 3: Make the execution layer mandatory for agents

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the newly added machine-readable and human-readable company execution control plane.
- Produces: mandatory agent bootstrap behavior.

- [ ] **Step 1:** Add the new company execution files to the required reading order directly after the existing company operating governance files.
- [ ] **Step 2:** Add a short company-stage-gate law requiring agents to distinguish current company stage from final-form ambition.
- [ ] **Step 3:** Add an execution-control-plane law requiring material company actions to update the correct register and next-action state.
- [ ] **Step 4:** Review for contradiction with existing `CLAUDE.md` laws and preserve all source-locked/product laws.
- [ ] **Step 5:** Commit with `governance: require company execution control plane`.

### Task 4: Verify and review the branch

**Files:**
- Review all files changed in Tasks 1-3.

**Interfaces:**
- Consumes: all new company governance artifacts.
- Produces: evidence that the change is internally consistent and ready for PR review.

- [ ] **Step 1:** Confirm every metric referenced by a company stage exists in `companyMetricRegistry`.
- [ ] **Step 2:** Confirm no stage gate accepts `SCENARIO_ONLY` evidence as proof.
- [ ] **Step 3:** Confirm every material revenue engine has a buyer, owner function, monetization class, and evidence expectation.
- [ ] **Step 4:** Confirm Zumi company authority contains explicit non-delegable boundaries.
- [ ] **Step 5:** Compare the branch against `main` and open a PR with an exact summary of truth, changes, and verification limitations.