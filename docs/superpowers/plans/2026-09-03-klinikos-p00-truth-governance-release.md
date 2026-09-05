# Klinikos P00 Truth, Governance, Evidence & Release Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved Klinikos execution-traceability and release-governance contract machine-enforceable without introducing a second Canon, release system, or runtime dependency.

**Architecture:** Migrate the approved YAML execution ledger to one canonical JSON artifact, validate it with dependency-free Node code, wire the validator into the existing Quality workflow, extend the existing PR template with traceability fields, register known supersession conflicts, and document live `main` protection state truthfully. Existing Master Canon, Master Engineering Blueprint, confidentiality gates, `Quality / verify`, `Quality / deploy-contract`, tests, browser evidence, and production-host verification remain authoritative and are reused rather than replaced.

**Tech Stack:** Node.js from `.node-version`; JSON; TypeScript/Vitest for governance contract tests; existing npm scripts; GitHub Actions `Quality`; existing GitHub repository governance documents. No new npm dependency.

**Spec:** `docs/superpowers/specs/2026-09-03-klinikos-p00-truth-governance-release-design.md`

## Global Constraints

- `ONE KLINIKOS / ONE PERSON / ONE GRAPH / ONE ZUMI / ONE AUTHORITY MODEL.`
- Exactly five canonical planes remain; P00 creates no sixth plane.
- `Person account = FREE. Activated organization capability = COMMERCIAL.`
- `Intelligence ≠ authority.`
- `3D projects truth; it never owns truth.`
- `CLAIM ≠ EVIDENCE ≠ VERIFICATION ≠ ELIGIBILITY ≠ ENTITLEMENT ≠ AUTHORITY.`
- `PRICE ≠ QUOTE ≠ CONTRACT ≠ INVOICE ≠ PAYMENT ≠ PAYOUT ≠ SETTLEMENT.`
- `REUSE → EXTEND → GENERALIZE → CONNECT → PARTNER → BUILD NEW.`
- No new package solely for traceability parsing or validation.
- No existing Quality, migration, confidentiality, browser, or deploy-contract gate may be weakened.
- The YAML machine ledger must be retired when JSON becomes canonical; do not maintain sibling machine authorities.
- P00 changes governance/release control only. No EHR, Grid, EDU, Zumi inference, pricing, PHI, organization-provisioning, or Living Reality runtime behavior changes.
- Every completion claim requires exact-head evidence.

---

## File Structure

### Create

- `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json` — sole canonical machine execution ledger.
- `scripts/validate-execution-traceability.mjs` — dependency-free structural and law validator.
- `tests/execution-traceability-governance.test.ts` — RED/GREEN governance contract tests.
- `docs/governance/GITHUB_MAIN_PROTECTION.md` — live state + required main-branch protection contract.

### Modify

- `docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md` — point to JSON as the canonical machine ledger and state that YAML is retired.
- `package.json` — add `governance:traceability` script.
- `.github/workflows/quality.yml` — add the low-cost traceability validator early in `verify`.
- `.github/pull_request_template.md` — add traceability/reuse/commercial/authority/evidence fields.

### Delete after JSON and references are green

- `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml`

### Reuse unchanged

- `docs/KLINIKOS_MASTER_CANON.md`
- `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md`
- `SOURCE_OF_TRUTH.md`
- `AGENTS.md`
- existing architecture index
- existing confidentiality/server-boundary canon
- existing `Quality / verify` and `Quality / deploy-contract`

---

### Task 1: Write the RED execution-traceability governance contract

**Files:**
- Create: `tests/execution-traceability-governance.test.ts`
- Read: `docs/superpowers/specs/2026-09-03-klinikos-p00-truth-governance-release-design.md`
- Read: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml`

**Interfaces:**
- Consumes: repository filesystem; approved P00 path constants.
- Produces: source-level contract that requires the JSON ledger, validator script, npm script, Quality gate, PR traceability section, and absence of the old YAML artifact after migration.

- [ ] **Step 1: Write the failing test**

Create `tests/execution-traceability-governance.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const jsonLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
const yamlLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml");
const validator = resolve(root, "scripts/validate-execution-traceability.mjs");

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("P00 execution traceability governance", () => {
  it("has exactly one canonical machine ledger and it is JSON", () => {
    expect(existsSync(jsonLedger)).toBe(true);
    expect(existsSync(yamlLedger)).toBe(false);
  });

  it("keeps the approved commercial and authority laws machine-readable", () => {
    const ledger = JSON.parse(read(jsonLedger));
    expect(ledger.commercialLaws.personAccount).toBe("FREE");
    expect(ledger.commercialLaws.organizationActivation).toBe("COMMERCIAL");
    expect(ledger.commercialLaws.paymentNeverCreates).toEqual(
      expect.arrayContaining([
        "identity_authority",
        "professional_verification",
        "clinical_authority",
        "eligibility",
        "legal_authority",
        "tenant_permission",
        "referral_priority",
      ]),
    );
  });

  it("registers the known draft conflicts instead of silently inheriting them", () => {
    const ledger = JSON.parse(read(jsonLedger));
    const refs = ledger.openReconciliations.map((item: { subjectRef: string }) => item.subjectRef);
    expect(refs).toContain("PR#519");
    expect(refs).toContain("PR#524");
  });

  it("ships a dependency-free validator and wires it into package + Quality", () => {
    expect(existsSync(validator)).toBe(true);

    const pkg = JSON.parse(read(resolve(root, "package.json")));
    expect(pkg.scripts["governance:traceability"]).toBe(
      "node scripts/validate-execution-traceability.mjs",
    );

    const quality = read(resolve(root, ".github/workflows/quality.yml"));
    expect(quality).toContain("Validate execution traceability");
    expect(quality).toContain("npm run governance:traceability");
  });

  it("makes traceability consequences review-visible", () => {
    const template = read(resolve(root, ".github/pull_request_template.md"));
    expect(template).toContain("## Execution traceability");
    expect(template).toContain("Requirement IDs");
    expect(template).toContain("Code disposition");
    expect(template).toContain("Commercial consequence");
    expect(template).toContain("Authority / security / legal consequence");
    expect(template).toContain("Expected evidence");
  });
});
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run:

```bash
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: FAIL because the canonical JSON ledger and validator do not exist and the YAML file still exists.

- [ ] **Step 3: Commit the RED contract**

```bash
git add tests/execution-traceability-governance.test.ts
git commit -m "test(governance): define P00 traceability contract"
```

---

### Task 2: Migrate the machine ledger from YAML to canonical JSON

**Files:**
- Create: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`
- Modify: `docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md`
- Delete: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml`
- Test: `tests/execution-traceability-governance.test.ts`

**Interfaces:**
- Consumes: current YAML content and P00 schema.
- Produces: valid JSON object consumed by the validator and governance tests.

- [ ] **Step 1: Create the canonical JSON with the exact approved enums and laws**

The JSON must begin with this exact structural contract:

```json
{
  "version": "2026-09-03.2",
  "status": "IMPLEMENTATION_CONTRACT",
  "authority": {
    "parent": "docs/KLINIKOS_MASTER_CANON.md",
    "engineeringBlueprint": "docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md",
    "executionEngine": "docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md",
    "law": "This ledger routes accepted requirements into implementation and evidence consequences. It is subordinate to the Master Canon and may not create product or company law."
  },
  "truthClasses": ["ACTUAL", "CONTRACTED", "PIPELINE", "ASSUMPTION", "SCENARIO", "TARGET"],
  "strategyStates": ["NOW", "NEXT", "LATER", "PARTNER", "CONNECT", "INTERNALIZE", "NEVER_BUILD"],
  "implementationStates": [
    "LIVE_VERIFIED",
    "BUILT_NEEDS_VERIFICATION",
    "PARTIAL",
    "DESIGNED",
    "PLANNED",
    "EXTERNAL_CONNECTION_REQUIRED",
    "LEGAL_REVIEW_REQUIRED",
    "NOT_BUILT",
    "HISTORICAL_ONLY"
  ],
  "codeDispositions": ["REUSE", "EXTEND", "GENERALIZE", "CONNECT", "PARTNER", "BUILD_NEW"],
  "commercialLaws": {
    "personAccount": "FREE",
    "organizationActivation": "COMMERCIAL",
    "paymentNeverCreates": [
      "identity_authority",
      "professional_verification",
      "clinical_authority",
      "eligibility",
      "legal_authority",
      "tenant_permission",
      "referral_priority"
    ]
  },
  "experienceFrames": {
    "F0": "Arrival",
    "F1": "Intent",
    "F2": "Interpretation",
    "F3": "ActiveObject",
    "F4": "Relationships",
    "F5": "Inspector",
    "F6": "MissionOrPrecisionWorkspace",
    "F7": "GovernedAction",
    "F8": "VerifiedOutcome",
    "F9": "NextAction",
    "F10": "TimeAndChange",
    "F11": "RegionalNetworkSpatial"
  },
  "performanceModes": ["FULL_REALITY", "BALANCED_REALITY", "PRECISION_MODE"],
  "programs": {},
  "requirements": [],
  "openReconciliations": []
}
```

Populate `programs` from every P00–P23 program already present in the approved YAML. Preserve names and execution intent; do not invent a P24.

Populate `requirements` by losslessly translating any existing accepted requirement records. If the original YAML contains only program-level routing and not full `ExecutionRecord` rows, keep `requirements` as an empty array in this P00 migration and allow later program specs to append records through the validated contract. Do not fabricate requirement evidence.

- [ ] **Step 2: Add explicit reconciliation entries for #519 and #524**

Append exactly these meanings, using repository evidence refs already captured by the planning branch:

```json
[
  {
    "id": "REC-PR-519-COMMERCIAL",
    "subjectType": "PULL_REQUEST",
    "subjectRef": "PR#519",
    "state": "PARTIALLY_SUPERSEDED",
    "preservedLaws": [
      "network density matters more than registration count",
      "payment never creates authority",
      "free participation must remain governed",
      "AI usage requires server-enforced economic controls"
    ],
    "conflictingLaws": [
      "free organization core participation conflicts with free Person plus commercial organization activation"
    ],
    "requiredAction": "Reconcile useful network-density and authority laws into the current commercial architecture; do not merge PR #519 unchanged.",
    "evidenceRefs": ["PR#519"]
  },
  {
    "id": "REC-PR-524-SPATIAL",
    "subjectType": "PULL_REQUEST",
    "subjectRef": "PR#524",
    "state": "PARTIALLY_SUPERSEDED",
    "preservedLaws": [
      "semantic DOM and precision UI remain required",
      "routes and browser history remain real",
      "server-side authority remains authoritative",
      "reduced motion mobile and accessibility are release gates"
    ],
    "conflictingLaws": [
      "the no Three.js React Three Fiber or canvas first-tranche limit is not the final founder-approved Living Healthcare Reality direction"
    ],
    "requiredAction": "Reuse its accessibility and server-truth laws inside P01, but replace the renderer limitation through the founder-approved P01 design and plan before implementation.",
    "evidenceRefs": ["PR#524"]
  }
]
```

- [ ] **Step 3: Update the Master Execution Engine machine-ledger reference**

Replace references to:

```text
docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml
```

with:

```text
docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json
```

and add this sentence beside the reference:

```text
JSON is the sole canonical machine ledger. The earlier YAML transport is retired by P00 to avoid a second machine authority and a parser dependency.
```

- [ ] **Step 4: Delete the YAML ledger**

```bash
git rm docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml
```

- [ ] **Step 5: Run the targeted test**

```bash
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: still FAIL because the validator/package/CI/PR template pieces do not exist yet, while the canonical-ledger assertions now pass.

- [ ] **Step 6: Commit the ledger migration**

```bash
git add docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json \
  docs/superpowers/plans/2026-09-03-klinikos-master-execution-engine.md \
  tests/execution-traceability-governance.test.ts
git commit -m "docs(governance): migrate execution ledger to canonical JSON"
```

---

### Task 3: Implement the dependency-free traceability validator

**Files:**
- Create: `scripts/validate-execution-traceability.mjs`
- Test: `tests/execution-traceability-governance.test.ts`

**Interfaces:**
- Consumes: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`.
- Produces: process exit code `0` for valid ledger; exit code `1` with deterministic field-level messages for invalid ledger.

- [ ] **Step 1: Add validator behavior tests using temporary copies**

Extend `tests/execution-traceability-governance.test.ts` with:

```ts
import { mkdtempSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

function runValidator(path = jsonLedger) {
  return execFileSync(process.execPath, [validator, path], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

it("accepts the checked-in canonical ledger", () => {
  expect(runValidator()).toContain("Execution traceability valid");
});

it("rejects duplicate requirement IDs", () => {
  const ledger = JSON.parse(read(jsonLedger));
  ledger.requirements = [
    {
      requirementId: "REQ-DUP",
      title: "First",
      sourceRefs: ["source:first"],
      canonRefs: ["canon:first"],
      strategyState: "NOW",
      implementationState: "PLANNED",
      programId: "P00",
      realityIds: [],
      journeyIds: [],
      frameIds: [],
      domainObjects: [],
      routeOrApiContracts: [],
      events: [],
      zumiCapabilities: [],
      monetizationClasses: ["N/A"],
      authorityGates: ["N/A"],
      securityPrivacyLegalGates: ["N/A"],
      codeDisposition: "REUSE",
      reuseTargets: ["docs/KLINIKOS_MASTER_CANON.md"],
      testContracts: ["tests/execution-traceability-governance.test.ts"],
      dependencies: [],
      owner: "Product Engineering",
      kpis: ["traceability gate green"],
      releaseWave: "W0",
      evidenceRefs: ["planned:test"],
      currentGap: "Planned test record only"
    }
  ];
  ledger.requirements.push({ ...ledger.requirements[0] });

  const dir = mkdtempSync(resolve(tmpdir(), "klinikos-trace-"));
  const path = resolve(dir, "ledger.json");
  writeFileSync(path, JSON.stringify(ledger));

  expect(() => runValidator(path)).toThrow(/Duplicate requirementId: REQ-DUP/);
});
```

Also add tests that mutate the ledger to reject:

- `personAccount: "PAID"`;
- `organizationActivation: "FREE"`;
- unknown strategy state `SOON`;
- `programId: "P99"`;
- placeholder owner `TBD`;
- missing `evidenceRefs` when `implementationState = "LIVE_VERIFIED"`.

- [ ] **Step 2: Run the targeted test and verify RED**

```bash
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: FAIL because `scripts/validate-execution-traceability.mjs` does not exist.

- [ ] **Step 3: Implement `scripts/validate-execution-traceability.mjs`**

Use only Node built-ins. The implementation must follow this structure:

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultLedger = "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json";
const ledgerPath = resolve(process.cwd(), process.argv[2] ?? defaultLedger);
const errors = [];
const placeholder = /^(tbd|todo|fixme|unknown|fill later)$/i;

function fail(message) {
  errors.push(message);
}

function requireString(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${path} must be a non-empty string`);
    return;
  }
  if (placeholder.test(value.trim())) {
    fail(`${path} contains forbidden placeholder value: ${value}`);
  }
}

function requireStringArray(value, path, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    fail(`${path} must be an array`);
    return;
  }
  if (nonEmpty && value.length === 0) fail(`${path} must not be empty`);
  value.forEach((entry, index) => requireString(entry, `${path}[${index}]`));
}

function requireEnum(value, allowed, path) {
  if (!allowed.includes(value)) {
    fail(`${path} has unsupported value ${JSON.stringify(value)}; allowed: ${allowed.join(", ")}`);
  }
}

let ledger;
try {
  ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
} catch (error) {
  console.error(`Execution traceability invalid: ${error.message}`);
  process.exit(1);
}

requireString(ledger.version, "version");
requireString(ledger.status, "status");
requireString(ledger.authority?.parent, "authority.parent");
requireString(ledger.authority?.engineeringBlueprint, "authority.engineeringBlueprint");
requireString(ledger.authority?.executionEngine, "authority.executionEngine");

for (const [name, value] of Object.entries({
  truthClasses: ledger.truthClasses,
  strategyStates: ledger.strategyStates,
  implementationStates: ledger.implementationStates,
  codeDispositions: ledger.codeDispositions,
  performanceModes: ledger.performanceModes,
})) {
  requireStringArray(value, name, { nonEmpty: true });
}

if (ledger.commercialLaws?.personAccount !== "FREE") {
  fail("commercialLaws.personAccount must be FREE");
}
if (ledger.commercialLaws?.organizationActivation !== "COMMERCIAL") {
  fail("commercialLaws.organizationActivation must be COMMERCIAL");
}

const forbiddenAuthorityPurchases = [
  "identity_authority",
  "professional_verification",
  "clinical_authority",
  "eligibility",
  "legal_authority",
  "tenant_permission",
  "referral_priority",
];
for (const law of forbiddenAuthorityPurchases) {
  if (!ledger.commercialLaws?.paymentNeverCreates?.includes(law)) {
    fail(`commercialLaws.paymentNeverCreates must include ${law}`);
  }
}

const programIds = new Set();
for (const [programId, program] of Object.entries(ledger.programs ?? {})) {
  if (programIds.has(programId)) fail(`Duplicate programId: ${programId}`);
  programIds.add(programId);
  requireString(program?.name, `programs.${programId}.name`);
}

const requirementIds = new Set();
for (const [index, requirement] of (ledger.requirements ?? []).entries()) {
  const base = `requirements[${index}]`;
  requireString(requirement.requirementId, `${base}.requirementId`);
  if (requirementIds.has(requirement.requirementId)) {
    fail(`Duplicate requirementId: ${requirement.requirementId}`);
  }
  requirementIds.add(requirement.requirementId);

  requireString(requirement.title, `${base}.title`);
  requireStringArray(requirement.sourceRefs, `${base}.sourceRefs`, { nonEmpty: true });
  requireStringArray(requirement.canonRefs, `${base}.canonRefs`, { nonEmpty: true });
  requireEnum(requirement.strategyState, ledger.strategyStates, `${base}.strategyState`);
  requireEnum(requirement.implementationState, ledger.implementationStates, `${base}.implementationState`);
  requireEnum(requirement.codeDisposition, ledger.codeDispositions, `${base}.codeDisposition`);
  requireString(requirement.programId, `${base}.programId`);
  if (!programIds.has(requirement.programId)) {
    fail(`${base}.programId references unknown program ${requirement.programId}`);
  }

  for (const field of [
    "realityIds",
    "journeyIds",
    "frameIds",
    "domainObjects",
    "routeOrApiContracts",
    "events",
    "zumiCapabilities",
    "monetizationClasses",
    "authorityGates",
    "securityPrivacyLegalGates",
    "reuseTargets",
    "testContracts",
    "dependencies",
    "kpis",
    "evidenceRefs",
  ]) {
    requireStringArray(requirement[field], `${base}.${field}`);
  }

  requireString(requirement.owner, `${base}.owner`);
  requireString(requirement.releaseWave, `${base}.releaseWave`);
  requireString(requirement.currentGap, `${base}.currentGap`);
  requireStringArray(requirement.testContracts, `${base}.testContracts`, { nonEmpty: true });
  requireStringArray(requirement.kpis, `${base}.kpis`, { nonEmpty: true });

  if (["LIVE_VERIFIED", "BUILT_NEEDS_VERIFICATION", "PARTIAL"].includes(requirement.implementationState)) {
    requireStringArray(requirement.evidenceRefs, `${base}.evidenceRefs`, { nonEmpty: true });
  }
}

const reconciliationStates = ["REVIEW_REQUIRED", "PARTIALLY_SUPERSEDED", "SUPERSEDED", "BLOCKED", "RESOLVED"];
const reconciliationTypes = ["PULL_REQUEST", "DOCUMENT", "BRANCH", "RUNTIME", "EXTERNAL_RAIL"];
for (const [index, item] of (ledger.openReconciliations ?? []).entries()) {
  const base = `openReconciliations[${index}]`;
  requireString(item.id, `${base}.id`);
  requireEnum(item.subjectType, reconciliationTypes, `${base}.subjectType`);
  requireString(item.subjectRef, `${base}.subjectRef`);
  requireEnum(item.state, reconciliationStates, `${base}.state`);
  requireStringArray(item.preservedLaws, `${base}.preservedLaws`);
  requireStringArray(item.conflictingLaws, `${base}.conflictingLaws`);
  requireString(item.requiredAction, `${base}.requiredAction`);
  requireStringArray(item.evidenceRefs, `${base}.evidenceRefs`, { nonEmpty: true });
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  console.error(`Execution traceability invalid: ${errors.length} error(s)`);
  process.exit(1);
}

console.log(`Execution traceability valid: ${ledger.version}`);
```

- [ ] **Step 4: Run validator directly**

```bash
node scripts/validate-execution-traceability.mjs
```

Expected: `Execution traceability valid: 2026-09-03.2`.

- [ ] **Step 5: Run targeted tests**

```bash
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: validator behavior tests pass; source-wiring assertions may still be RED until Task 4/5.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-execution-traceability.mjs tests/execution-traceability-governance.test.ts
git commit -m "feat(governance): validate execution traceability"
```

---

### Task 4: Wire traceability into npm and existing Quality CI

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/quality.yml`
- Test: `tests/execution-traceability-governance.test.ts`

**Interfaces:**
- Consumes: `scripts/validate-execution-traceability.mjs`.
- Produces: `npm run governance:traceability`; cheap early `Quality / verify` failure on invalid governance state.

- [ ] **Step 1: Add the package script without changing existing scripts**

Add to `package.json` scripts:

```json
"governance:traceability": "node scripts/validate-execution-traceability.mjs"
```

Do not rename `security:check`, `type-check`, `test:mvp`, `build`, `render:build`, or any existing release script.

- [ ] **Step 2: Run npm governance command**

```bash
npm run governance:traceability
```

Expected: PASS with the same validator success message.

- [ ] **Step 3: Add the Quality step early in `verify`**

Immediately after dependency installation and before Prisma generation, add:

```yaml
      - name: Validate execution traceability
        run: npm run governance:traceability
```

Do not modify or reorder the existing fresh-Postgres, typecheck, lint, tests, MVP journey, build, confidentiality, startup, browser, evidence, or `deploy-contract` semantics except for the minimal insertion needed here.

- [ ] **Step 4: Run targeted governance test**

```bash
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: the npm/Quality source assertions now pass; PR-template assertion remains RED until Task 5.

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/quality.yml tests/execution-traceability-governance.test.ts
git commit -m "ci(governance): enforce execution traceability"
```

---

### Task 5: Make traceability consequences visible in every PR

**Files:**
- Modify: `.github/pull_request_template.md`
- Test: `tests/execution-traceability-governance.test.ts`

**Interfaces:**
- Consumes: approved traceability vocabulary.
- Produces: review-visible PR metadata; no runtime behavior.

- [ ] **Step 1: Add the traceability section after `Truthful implementation status`**

Insert exactly:

```markdown
## Execution traceability

Record the execution consequences of this PR. Use `N/A — <reason>` only when a dimension truly does not apply.

- **Requirement IDs:**
- **Canon references:**
- **Program / release wave:**
- **Code disposition:** `REUSE / EXTEND / GENERALIZE / CONNECT / PARTNER / BUILD NEW`
- **Implementation-state change:**
- **Commercial consequence:**
- **Authority / security / legal consequence:**
- **Expected evidence:**

If this PR adds or changes an accepted requirement, update the canonical execution traceability ledger or explain why the existing record already covers the change. A PR must not create product/company law by editing the ledger alone; the Master Canon remains the intended-truth authority.
```

- [ ] **Step 2: Run the targeted governance test**

```bash
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: all source-level P00 contract assertions pass.

- [ ] **Step 3: Commit**

```bash
git add .github/pull_request_template.md tests/execution-traceability-governance.test.ts
git commit -m "docs(governance): require PR execution traceability"
```

---

### Task 6: Record live main-branch protection truth without pretending documentation is enforcement

**Files:**
- Create: `docs/governance/GITHUB_MAIN_PROTECTION.md`
- Test: `tests/execution-traceability-governance.test.ts`

**Interfaces:**
- Consumes: live GitHub branch/ruleset evidence collected during implementation.
- Produces: auditable current state and exact admin target.

- [ ] **Step 1: Query live repository state**

Use the GitHub connector/API to fetch:

```text
GET /repos/jcamacho611/Clinicos-by-Zumi/branches/main
GET /repos/jcamacho611/Clinicos-by-Zumi/branches/main/protection
GET /repos/jcamacho611/Clinicos-by-Zumi/rulesets
```

Record the exact response date and whether `main` is protected. Do not copy the 2026-09-03 planning observation if live state has changed.

- [ ] **Step 2: Inspect exact check contexts on the current P00 head**

Use the exact-head workflow/status APIs after CI starts and record the actual check names. Expect the current workflow jobs to surface from `Quality` as `verify` and `deploy-contract`, but do not write required-context names from memory if GitHub reports different names.

- [ ] **Step 3: Create `docs/governance/GITHUB_MAIN_PROTECTION.md`**

The document must contain:

```markdown
# Klinikos `main` Protection Contract

**Authority:** operational governance evidence; subordinate to the Master Canon.
**Observed at:** <absolute UTC timestamp from the live query>
**Repository:** `jcamacho611/Clinicos-by-Zumi`
**Branch:** `main`

## Current enforcement state

`ENFORCED` or `MANUAL_ADMIN_ACTION_REQUIRED`

## Required controls

1. Ordinary changes enter `main` through pull requests.
2. Exact-head Quality checks are required before merge.
3. Required status contexts use the exact names reported by GitHub for the `Quality` workflow jobs.
4. Force pushes are disabled.
5. Branch deletion is disabled.
6. Any administrative bypass is treated as break-glass and must be recorded with reason, actor, commit SHA, follow-up verification and remediation.

## Live evidence

Record the branch/protection/ruleset observations from the GitHub API. Do not state that documentation itself enforces the branch.

## Operator action

If current state is `MANUAL_ADMIN_ACTION_REQUIRED`, specify the exact GitHub repository settings/ruleset changes required and re-query after the operator applies them.
```

Replace the angle-bracketed timestamp with the actual query timestamp during implementation; this is evidence data, not an unspecified design task.

- [ ] **Step 4: Add a source contract assertion**

Extend the test:

```ts
it("records main protection as live evidence rather than inferred documentation", () => {
  const doc = read(resolve(root, "docs/governance/GITHUB_MAIN_PROTECTION.md"));
  expect(doc).toContain("## Current enforcement state");
  expect(doc).toMatch(/ENFORCED|MANUAL_ADMIN_ACTION_REQUIRED/);
  expect(doc).toContain("## Live evidence");
  expect(doc).toContain("## Operator action");
});
```

- [ ] **Step 5: Run targeted tests and commit**

```bash
npm test -- --run tests/execution-traceability-governance.test.ts
git add docs/governance/GITHUB_MAIN_PROTECTION.md tests/execution-traceability-governance.test.ts
git commit -m "docs(governance): record main protection contract"
```

---

### Task 7: Self-review the P00 authority surface and reject duplicate governance

**Files:**
- Review only unless a gap is found.
- Relevant: `docs/KLINIKOS_MASTER_CANON.md`, Master Blueprint, Master Execution Engine, JSON ledger, validator, PR template, Quality workflow.

**Interfaces:**
- Consumes: completed P00 diff.
- Produces: corrected coherent authority chain; no sibling Canon.

- [ ] **Step 1: Search for obsolete YAML authority references**

Run:

```bash
git grep -n "KLINIKOS_EXECUTION_TRACEABILITY.yaml" -- ':!docs/superpowers/plans/2026-09-03-klinikos-p00-truth-governance-release.md'
```

Expected: no active reference remains.

- [ ] **Step 2: Search for duplicate traceability ledgers**

Run:

```bash
find docs -type f \( -iname '*execution*traceability*.json' -o -iname '*execution*traceability*.yaml' -o -iname '*execution*traceability*.yml' \) -print
```

Expected: only `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`.

- [ ] **Step 3: Search for forbidden commercial regression in the P00 files**

Run:

```bash
git grep -n -E 'organizationActivation.{0,20}FREE|free organization core' -- \
  docs/governance scripts tests .github package.json
```

Expected: no active P00 law says activated organization capability is free. Historical conflict text may appear only where explicitly labeled superseded/reconciliation evidence.

- [ ] **Step 4: Run the validator and targeted test**

```bash
npm run governance:traceability
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: PASS.

- [ ] **Step 5: Inspect the diff for accidental product changes**

```bash
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- \
  package.json \
  .github/workflows/quality.yml \
  .github/pull_request_template.md \
  scripts/validate-execution-traceability.mjs \
  tests/execution-traceability-governance.test.ts \
  docs/governance
```

Expected: governance/CI/docs/test changes only; no application routes, Prisma models, APIs, clinical logic, Grid logic, Zumi inference code, or pricing runtime changes.

- [ ] **Step 6: Commit any self-review correction**

If and only if the review required a correction:

```bash
git add -A
git commit -m "fix(governance): close P00 review gaps"
```

Do not create an empty commit.

---

### Task 8: Run exact-head verification and prepare the P00 merge gate

**Files:**
- No new planned files.
- Evidence: exact PR head SHA and GitHub Quality jobs/artifacts.

**Interfaces:**
- Consumes: final P00 implementation head.
- Produces: exact-head release evidence and truthful merge decision.

- [ ] **Step 1: Run low-cost local/static gates first**

```bash
npm run governance:traceability
npm run security:check
npm run type-check
npm run lint
npm test -- --run tests/execution-traceability-governance.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Run the full repository test suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run the existing PostgreSQL-backed journey contract**

Use the repository's existing disposable-test Postgres setup and run:

```bash
npm run test:mvp
```

Expected: PASS. Do not point destructive tests at a real customer or production database.

- [ ] **Step 4: Run production build and confidentiality gate**

```bash
npm run build
npm run security:check
```

Expected: PASS.

- [ ] **Step 5: Push the final head and wait only for exact-head GitHub evidence, not stale runs**

Record:

```text
P00_HEAD_SHA=<exact branch head SHA>
```

Then verify GitHub Actions for that exact SHA. Required evidence:

- `Quality / verify` green;
- `Quality / deploy-contract` green;
- no check is reused from an older SHA;
- frontend evidence artifacts exist if the unchanged workflow still generates them;
- branch/ruleset state is recorded truthfully.

- [ ] **Step 6: Update PR body with completion evidence**

Record:

- P00 Requirement IDs / program `P00`;
- Canon references;
- code disposition primarily `REUSE + EXTEND`;
- implementation state reached;
- commercial consequence: governance encodes current law but creates no new charge;
- authority/security consequence: validation only, no widened authority;
- exact SHA and exact checks;
- branch-protection status (`ENFORCED` or `MANUAL_ADMIN_ACTION_REQUIRED`);
- remaining risks.

- [ ] **Step 7: Do not merge red or ambiguous evidence**

If any exact-head gate is missing, queued without execution, cancelled, stale, or failing, the status remains **not verified**. Investigate the specific current failure; do not weaken Quality.

- [ ] **Step 8: Commit only if final evidence required a repository-document correction**

If evidence documentation was changed, that creates a new head SHA; rerun exact-head verification on the new SHA before merge.

---

## Self-Review

### Spec coverage

- Canon hierarchy preservation: Tasks 2, 5, 7.
- Single JSON machine authority: Task 2.
- Dependency-free validation: Task 3.
- Commercial/authority machine laws: Tasks 2–3.
- CI enforcement without a second release workflow: Task 4.
- PR review traceability: Task 5.
- #519/#524 reconciliation visibility: Task 2.
- Live branch-protection truth: Task 6.
- Existing exact-head release evidence reused: Task 8.
- No product/runtime scope creep: Tasks 7–8.
- Cost discipline: Tasks 2–4 use native Node/existing CI only.

### Placeholder scan

The plan contains no implementation placeholders such as `TBD`, `TODO`, `implement later`, or `similar to`. The only angle-bracket notation appears inside an explicitly provided documentation template where Task 6 requires replacing it with the live query timestamp during implementation.

### Type/name consistency

- Canonical ledger path is consistently `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`.
- Validator path is consistently `scripts/validate-execution-traceability.mjs`.
- npm script is consistently `governance:traceability`.
- CI step is consistently `Validate execution traceability`.
- Test path is consistently `tests/execution-traceability-governance.test.ts`.
- Commercial law property names are consistently `personAccount`, `organizationActivation`, and `paymentNeverCreates`.
- Reconciliation refs are consistently `PR#519` and `PR#524`.

---

## Execution Handoff

Plan complete at `docs/superpowers/plans/2026-09-03-klinikos-p00-truth-governance-release.md`.

**Recommended execution:** Subagent-Driven Development — a fresh implementation context per task with review between tasks. If execution remains in this session, use the `executing-plans` workflow and preserve the same RED → GREEN → review → exact-head evidence sequence.
