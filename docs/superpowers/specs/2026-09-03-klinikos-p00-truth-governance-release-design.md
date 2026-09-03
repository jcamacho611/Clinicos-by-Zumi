# KLINIKOS P00 — Truth, Governance, Evidence & Release Control Design

**Version:** 2026-09-03.1  
**Status:** FOUNDER_APPROVED_MASTER_DERIVATIVE — subordinate child design, not new product law  
**Parent authority:** `docs/KLINIKOS_MASTER_CANON.md`  
**Engineering authority:** `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md`  
**Execution router:** `docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md`

---

## 1. Purpose

P00 makes the existing Klinikos authority chain **enforceable**. It does not create another Canon, product architecture, release system, security model, pricing authority, or application shell.

The governing hierarchy remains:

`CURRENT CODE / SCHEMA / MIGRATIONS / TESTS / EXACT-HEAD CI / VERIFIED RUNTIME & EXTERNAL EVIDENCE`

for what actually exists, and:

`MASTER CANON → MASTER ENGINEERING BLUEPRINT → APPROVED SUBORDINATE DESIGNS / PLANS`

for intended product and engineering truth.

The Master Execution Engine is an execution router below that hierarchy. P00 exists so accepted requirements cannot disappear between source material, Canon, code, commercial consequence, test evidence, and release.

---

## 2. Problems P00 solves

### 2.1 Traceability is currently descriptive rather than enforceable

The approved Master Execution Engine defines an `ExecutionRecord` and a machine-readable ledger, but the repository does not yet fail CI when that ledger is malformed, duplicated, contradictory, or incomplete.

### 2.2 The approved ledger is YAML but the repository has no YAML parser dependency

Adding a parser solely for governance would create avoidable package and supply-chain surface. P00 therefore standardizes the canonical machine ledger as JSON, readable with native Node.js. The existing YAML artifact is migrated and retired rather than maintained as a second authority.

### 2.3 Existing governance controls are strong but distributed

The repository already has:

- the Master Canon;
- the Master Engineering Blueprint;
- `SOURCE_OF_TRUTH.md`;
- `AGENTS.md`;
- the architecture index;
- confidentiality/server-boundary law;
- a substantial PR template;
- `Quality` CI with `verify` and `deploy-contract` jobs;
- migration-on-empty-Postgres verification;
- typecheck, lint, tests and MVP journeys;
- production build/start smoke;
- browser-interaction and frontend evidence capture;
- confidentiality checks before and after build.

P00 **reuses these controls**. It adds only the missing execution-traceability and governance checks.

### 2.4 Open draft work contains superseded or partially superseded doctrine

At P00 design time:

- PR #524 contains useful semantic/accessibility/server-truth safeguards but its first tranche explicitly prohibits Three.js / React Three Fiber / canvas, which is not the founder-approved final Living Healthcare Reality direction.
- PR #519 contains useful network-density and lawful-authority concepts but allows free organization core participation, which conflicts with the newer founder-approved law: **free Person identity; commercial activated organization capability**.

P00 must make these conflicts visible and reviewable. It must not silently merge, close, or rewrite historical work.

### 2.5 `main` is not currently protected at the repository branch level

Exact-head CI is already strong, but branch-level enforcement is a separate control. P00 documents the required protection/ruleset contract and records whether it is actually enabled. If the connected GitHub capability cannot write repository rulesets, P00 must fail honestly into `MANUAL_ADMIN_ACTION_REQUIRED`; it may not claim protection exists because the documentation exists.

---

## 3. Non-negotiable inherited laws

1. **ONE KLINIKOS / ONE PERSON / ONE GRAPH / ONE ZUMI / ONE AUTHORITY MODEL.**
2. Exactly five canonical planes remain. P00 does not create a sixth plane.
3. **Person account = FREE. Activated organization capability = COMMERCIAL.**
4. **Intelligence ≠ authority.** Zumi never establishes consequential permission, clinical truth, credential truth, payment truth, legal eligibility, or tenant authority.
5. **3D projects truth; it never owns truth.**
6. **CLAIM ≠ EVIDENCE ≠ VERIFICATION ≠ ELIGIBILITY ≠ ENTITLEMENT ≠ AUTHORITY.**
7. **PRICE ≠ QUOTE ≠ CONTRACT ≠ INVOICE ≠ PAYMENT ≠ PAYOUT ≠ SETTLEMENT.**
8. **REUSE → EXTEND → GENERALIZE → CONNECT → PARTNER → BUILD NEW.**
9. Strategy state and implementation/evidence state remain separate.
10. No fabricated implementation, connection, revenue, customer, credential, payment, deployment, network density, certification, security posture, or proof.
11. Browser/client output remains a disclosure boundary; confidential decision logic stays server-side.
12. No PHI production claim without exact security, legal, vendor/contract, configuration, runtime and release evidence.
13. A green local test, mergeable PR, or successful redirect is not equivalent to exact-head release truth.
14. Founder omission does not equal product omission.
15. P00 must minimize new dependencies and operational cost.

---

## 4. Scope

### 4.1 Canonical machine traceability ledger

Create one canonical machine-readable artifact:

`docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`

The current YAML ledger is migrated into JSON and deleted in the same P00 implementation sequence once all references have moved. There must never be two active machine ledgers.

The JSON document owns **execution routing metadata only**. It cannot amend the Master Canon.

Required top-level fields:

- `version`
- `status`
- `authority`
- `truthClasses`
- `strategyStates`
- `implementationStates`
- `codeDispositions`
- `commercialLaws`
- `experienceFrames`
- `performanceModes`
- `programs`
- `requirements`
- `openReconciliations`

### 4.2 ExecutionRecord contract

Each accepted requirement record must carry enough information to terminate in execution and evidence.

Required shape:

```ts
export type ExecutionRecord = {
  requirementId: string;
  title: string;
  sourceRefs: string[];
  canonRefs: string[];
  strategyState:
    | "NOW"
    | "NEXT"
    | "LATER"
    | "PARTNER"
    | "CONNECT"
    | "INTERNALIZE"
    | "NEVER_BUILD";
  implementationState:
    | "LIVE_VERIFIED"
    | "BUILT_NEEDS_VERIFICATION"
    | "PARTIAL"
    | "DESIGNED"
    | "PLANNED"
    | "EXTERNAL_CONNECTION_REQUIRED"
    | "LEGAL_REVIEW_REQUIRED"
    | "NOT_BUILT"
    | "HISTORICAL_ONLY";
  programId: string;
  realityIds: string[];
  journeyIds: string[];
  frameIds: string[];
  domainObjects: string[];
  routeOrApiContracts: string[];
  events: string[];
  zumiCapabilities: string[];
  monetizationClasses: string[];
  authorityGates: string[];
  securityPrivacyLegalGates: string[];
  codeDisposition:
    | "REUSE"
    | "EXTEND"
    | "GENERALIZE"
    | "CONNECT"
    | "PARTNER"
    | "BUILD_NEW";
  reuseTargets: string[];
  testContracts: string[];
  dependencies: string[];
  owner: string;
  kpis: string[];
  releaseWave: string;
  evidenceRefs: string[];
  currentGap: string;
};
```

A record may have an empty array only where the dimension is genuinely not applicable. The record must still explain its `currentGap` and retain evidence/test ownership appropriate to its state.

### 4.3 Validator

Create a dependency-free Node validator:

`scripts/validate-execution-traceability.mjs`

The validator must fail non-zero for:

- malformed JSON;
- missing top-level authority references;
- unknown truth/strategy/implementation/disposition enum values;
- duplicate `requirementId` values;
- duplicate program IDs;
- a requirement whose `programId` does not exist;
- duplicate experience-frame IDs;
- missing commercial law `personAccount = FREE`;
- missing commercial law `organizationActivation = COMMERCIAL`;
- any payment-to-authority mapping that violates the approved authority law;
- accepted records missing `sourceRefs`, `canonRefs`, `owner`, `releaseWave`, `currentGap`, `testContracts`, `kpis`, or `evidenceRefs` where their implementation state asserts built/live truth;
- placeholder values such as `TBD`, `TODO`, `FIXME`, `unknown`, `fill later`, or empty whitespace in required strings;
- an unrecognized open-reconciliation disposition;
- references to a non-existent program;
- a second active traceability-ledger path declared in the execution engine.

The validator must print actionable, deterministic error messages identifying the exact record/field that failed.

### 4.4 CI integration

Reuse `.github/workflows/quality.yml`.

Add a named step to the existing `verify` job:

`Validate execution traceability`

running:

`npm run governance:traceability`

The check belongs before expensive build/browser work so governance failures fail cheaply.

Do **not** weaken, skip, fork, or replace existing Quality gates.

The existing `deploy-contract` job remains the production-host contract. P00 does not create a third release workflow.

### 4.5 Package script

Add:

```json
"governance:traceability": "node scripts/validate-execution-traceability.mjs"
```

No new npm dependency is permitted for P00 traceability validation.

### 4.6 PR traceability gate

Extend `.github/pull_request_template.md` with a compact section requiring authors to record:

- Requirement IDs affected;
- Canon references;
- code disposition (`REUSE / EXTEND / GENERALIZE / CONNECT / PARTNER / BUILD NEW`);
- implementation-state change;
- commercial consequence or `N/A`;
- authority/security/legal consequence or `N/A`;
- exact evidence expected.

This is not a checkbox theater exercise. It provides review context and makes omitted consequences visible.

### 4.7 Open-work reconciliation register

Represent current known conflict/supersession work in `openReconciliations` inside the canonical JSON ledger.

Each entry must include:

```ts
type OpenReconciliation = {
  id: string;
  subjectType: "PULL_REQUEST" | "DOCUMENT" | "BRANCH" | "RUNTIME" | "EXTERNAL_RAIL";
  subjectRef: string;
  state: "REVIEW_REQUIRED" | "PARTIALLY_SUPERSEDED" | "SUPERSEDED" | "BLOCKED" | "RESOLVED";
  preservedLaws: string[];
  conflictingLaws: string[];
  requiredAction: string;
  evidenceRefs: string[];
};
```

Initial records include PR #519 and PR #524.

P00 does **not** close them automatically. Their eventual close/merge/supersession must occur only when a replacement/merged-forward artifact exists and exact evidence supports the action.

### 4.8 Main-branch protection contract

Create:

`docs/governance/GITHUB_MAIN_PROTECTION.md`

It records the desired repository control, current observed state, evidence date, and operator action.

Required target protection:

- changes to `main` through pull requests rather than ordinary direct pushes;
- Quality status required before merge;
- both `Quality / verify` and `Quality / deploy-contract` required if GitHub exposes those exact check names;
- stale approvals/statuses handled according to the repository's actual supported ruleset capabilities;
- force pushes disabled;
- branch deletion disabled;
- administrators do not silently bypass required release truth except through an explicitly documented emergency/break-glass process.

P00 must query actual GitHub branch/ruleset state before claiming enforcement.

If the connected tooling cannot enable these controls, the document status must say:

`MANUAL_ADMIN_ACTION_REQUIRED`

and include the exact GitHub UI/API settings needed. Documentation must never be presented as enforcement.

### 4.9 Exact-head evidence law

P00 reuses current Quality evidence:

- fresh PostgreSQL migration deployment;
- typecheck;
- lint;
- full tests;
- PostgreSQL MVP journeys;
- production build;
- confidentiality before/after build;
- production startup smoke;
- browser interaction verification;
- frontend release evidence where applicable;
- production-host deploy contract.

A P00 implementation is complete only when checks run against the exact PR head that would merge.

---

## 5. Non-goals

P00 must **not**:

- alter EHR/clinical workflows;
- change Grid matching;
- change EDU behavior;
- add 3D rendering libraries;
- implement Living Reality visuals;
- change customer pricing beyond encoding already-approved commercial law;
- provision an organization;
- change PHI access;
- change Zumi model behavior;
- introduce a new auth or RBAC model;
- introduce another task/event/financial system;
- rewrite Quality CI;
- merge/close #519 or #524 without their own reconciliation evidence;
- claim branch protection is enabled if it is not;
- add an npm dependency solely to parse governance data.

---

## 6. Security & failure behavior

Governance validation must fail closed.

If the ledger is malformed, contradictory, or incomplete, CI fails before expensive application build work.

The validator must never:

- read secrets;
- call external services;
- mutate repository files;
- infer product authority from payment;
- inspect PHI;
- make network calls;
- depend on environment-specific production data.

It operates only on checked-in governance metadata and repository-relative paths.

---

## 7. Cost discipline

P00 should add approximately zero recurring infrastructure cost:

- native Node JSON parsing;
- existing GitHub Actions workflow;
- existing repository test runner;
- no new hosted service;
- no new database;
- no new analytics vendor;
- no new package solely for governance.

The only material ongoing cost is a small amount of CI compute, minimized by placing the traceability validation early.

---

## 8. Acceptance criteria

P00 is accepted when all are true:

1. exactly one canonical machine execution ledger exists;
2. it is JSON and dependency-free to parse;
3. CI fails on malformed or internally contradictory execution truth;
4. program/requirement references are validated;
5. current approved commercial and authority laws are machine-checked;
6. PRs must state traceability consequences;
7. #519 and #524 conflicts are explicitly registered rather than silently inherited;
8. branch-protection state is documented from live GitHub truth and is either enforced or explicitly `MANUAL_ADMIN_ACTION_REQUIRED`;
9. no existing Quality/release/security gate is weakened;
10. exact-head Quality is green on the final P00 implementation head;
11. final diff proves no product/runtime behavior was unintentionally changed.

---

## 9. Definition of success

After P00, a future agent should not be able to say:

> “I implemented the feature but forgot the authority rule, revenue consequence, mobile experience, evidence requirement, or Canon dependency.”

without creating a machine-detectable gap in the execution record or a review-visible traceability omission.

P00 does not make the company bureaucratic. It makes the company **harder to accidentally compress, fork, misrepresent, or break as the system gets larger**.
