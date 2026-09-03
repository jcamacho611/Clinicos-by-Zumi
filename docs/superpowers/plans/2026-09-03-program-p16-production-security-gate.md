# P16 — Security / Privacy / Legal / IP / Production PHI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make production-PHI/security readiness a fail-closed, evidence-backed release decision that protects tenant boundaries, P01/P02 browser/API disclosure, Zumi/external-AI egress, dependencies, uploads, recovery, vendor/legal evidence, and enterprise diligence without manufacturing compliance claims.

**Architecture:** Extend the existing `scripts/security/*` chain, current server-side authorization/repository patterns, Zumi PHI-egress policy, Quality/deploy-contract, and P00 traceability. Add exactly one subordinate machine-readable security evidence register plus a dependency-free validator and a pure production-readiness evaluator. Unknown required evidence remains blocking for the capability that needs it; P16 does not create another Canon and does not broadly label Klinikos compliant.

**Tech Stack:** Node built-ins for evidence validation, Next.js 15.5.22, React 19.1.1, TypeScript 5.9.2, Prisma/PostgreSQL, existing auth/RBAC/resource repositories, existing Zumi policy/redaction/audit controls, npm audit, Vitest, GitHub Actions Quality/deploy-contract.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p16-production-security-gate-design.md`

## Global Constraints

- Real PHI is not enabled merely because UI/schema/provider code exists.
- `PRODUCTION_VERIFIED` is scoped to exact environment + data class + capability + provider/rail where applicable.
- Unknown required evidence fails closed.
- Never claim “HIPAA compliant”, “SOC 2 compliant”, “certified”, or equivalent broad status from internal tests alone.
- Never fabricate BAA/DPA/vendor, WAF, MFA, backup/restore, incident, or deployment evidence.
- Existing Quality/migration/browser/confidentiality/deploy-contract gates may only be strengthened.
- P01 canvas/scene code is a browser disclosure surface.
- P02 raw anonymous public text is potentially sensitive.
- Never run `npm audit fix --force` as automatic remediation.
- Branch protection remains `MANUAL_ADMIN_ACTION_REQUIRED` until live GitHub evidence proves enforcement.
- Prefer native/current/open-source controls before adding paid security vendors.
- Every code task follows RED → GREEN and ends with an independently reviewable commit.

---

### Task 1: Add the one subordinate security-evidence register and validator

**Files:**
- Create: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Create: `scripts/security/validate-security-evidence.mjs`
- Modify: `package.json`
- Create: `tests/security/security-evidence-validator.test.ts`

**Interfaces:**
- `SecurityEvidenceState = NOT_EVALUATED | BLOCKED | PARTIAL | TECHNICAL_EVIDENCE_GREEN | EXTERNAL_EVIDENCE_REQUIRED | LEGAL_REVIEW_REQUIRED | PRODUCTION_APPROVAL_REQUIRED | PRODUCTION_VERIFIED | DEGRADED_OR_REVOKED`
- Each record has `controlId`, `family`, `environments`, `dataClasses`, `capabilities`, `state`, `technicalEvidenceRefs`, `operationalEvidenceRefs`, `externalEvidenceRefs`, `legalEvidenceRefs`, `owner`, `lastVerifiedAt`, `expiresAt`, `blockerReason`, `allowedClaim`.

- [ ] **Step 1: Write the RED validator tests**

```ts
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const canonical = "docs/governance/KLINIKOS_SECURITY_EVIDENCE.json";
const validator = "scripts/security/validate-security-evidence.mjs";
function run(path = canonical) {
  return execFileSync(process.execPath, [validator, path], { encoding: "utf8" });
}
function mutate(mutator: (ledger: any) => void) {
  const ledger = JSON.parse(readFileSync(canonical, "utf8"));
  mutator(ledger);
  const path = resolve(mkdtempSync(resolve(tmpdir(), "k-sec-")), "ledger.json");
  writeFileSync(path, JSON.stringify(ledger));
  return path;
}

describe("P16 security evidence", () => {
  it("accepts the checked-in register", () => expect(run()).toContain("Security evidence valid"));
  it("rejects duplicate control IDs", () => {
    const path = mutate((l) => l.controls.push({ ...l.controls[0] }));
    expect(() => run(path)).toThrow(/duplicate control/i);
  });
  it("rejects broad unsupported compliance claims", () => {
    const path = mutate((l) => { l.controls[0].allowedClaim = "HIPAA compliant"; });
    expect(() => run(path)).toThrow(/unsupported broad claim/i);
  });
  it("rejects PHI production verified without scoped evidence", () => {
    const path = mutate((l) => {
      l.controls[0] = { ...l.controls[0], dataClasses: ["PHI"], state: "PRODUCTION_VERIFIED", technicalEvidenceRefs: [], legalEvidenceRefs: [] };
    });
    expect(() => run(path)).toThrow(/PRODUCTION_VERIFIED/i);
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/security/security-evidence-validator.test.ts
```

Expected: FAIL because register/validator do not exist.

- [ ] **Step 3: Create the initial truthful register**

```json
{
  "version": "2026-09-03.1",
  "status": "SUBORDINATE_SECURITY_EVIDENCE",
  "authority": {
    "parent": "docs/KLINIKOS_MASTER_CANON.md",
    "traceability": "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json",
    "mayOverrideProductAuthority": false
  },
  "states": [
    "NOT_EVALUATED", "BLOCKED", "PARTIAL", "TECHNICAL_EVIDENCE_GREEN",
    "EXTERNAL_EVIDENCE_REQUIRED", "LEGAL_REVIEW_REQUIRED",
    "PRODUCTION_APPROVAL_REQUIRED", "PRODUCTION_VERIFIED", "DEGRADED_OR_REVOKED"
  ],
  "dataClasses": ["PUBLIC", "INTERNAL_CONFIDENTIAL", "PII", "PHI", "SECRET", "CROWN_JEWEL"],
  "controls": [
    {
      "controlId": "P16-BROWSER-CONFIDENTIALITY",
      "family": "browser_disclosure",
      "environments": ["repository"],
      "dataClasses": ["INTERNAL_CONFIDENTIAL", "PII", "PHI", "SECRET", "CROWN_JEWEL"],
      "capabilities": ["frontend"],
      "state": "TECHNICAL_EVIDENCE_GREEN",
      "technicalEvidenceRefs": ["scripts/security/browser-confidentiality-gate.mjs"],
      "operationalEvidenceRefs": [], "externalEvidenceRefs": [], "legalEvidenceRefs": [],
      "owner": "Security Engineering",
      "lastVerifiedAt": "2026-09-03T00:00:00Z", "expiresAt": null,
      "blockerReason": null,
      "allowedClaim": "Repository browser-confidentiality source gate is implemented and passing at the cited candidate."
    },
    {
      "controlId": "P16-PRODUCTION-PHI",
      "family": "production_phi",
      "environments": ["production"],
      "dataClasses": ["PHI"],
      "capabilities": ["clinical_phi"],
      "state": "BLOCKED",
      "technicalEvidenceRefs": [], "operationalEvidenceRefs": [], "externalEvidenceRefs": [], "legalEvidenceRefs": [],
      "owner": "Security Engineering",
      "lastVerifiedAt": null, "expiresAt": null,
      "blockerReason": "Exact production database, tenant, access, audit, encryption, vendor/legal, recovery and operational evidence is incomplete.",
      "allowedClaim": "Production PHI readiness is not yet verified."
    }
  ]
}
```

Keep existing branch protection, MFA/passkey, backup/restore, BAA/DPA, and external provider items non-green unless exact evidence exists at execution time.

- [ ] **Step 4: Implement the dependency-free validator**

```js
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.argv[2] ?? "docs/governance/KLINIKOS_SECURITY_EVIDENCE.json");
const ledger = JSON.parse(readFileSync(path, "utf8"));
const errors = [];
const forbiddenClaims = /\b(?:HIPAA compliant|SOC ?2 compliant|certified)\b/i;
const ids = new Set();

for (const [index, c] of (ledger.controls ?? []).entries()) {
  if (!c.controlId || ids.has(c.controlId)) errors.push(`duplicate control ${c.controlId ?? index}`);
  ids.add(c.controlId);
  if (!ledger.states?.includes(c.state)) errors.push(`${c.controlId}: unknown state`);
  if (forbiddenClaims.test(c.allowedClaim ?? "")) errors.push(`${c.controlId}: unsupported broad claim`);
  if (c.state === "PRODUCTION_VERIFIED") {
    if (!Array.isArray(c.technicalEvidenceRefs) || c.technicalEvidenceRefs.length === 0) errors.push(`${c.controlId}: PRODUCTION_VERIFIED lacks technical evidence`);
    if ((c.dataClasses ?? []).includes("PHI") &&
        (!Array.isArray(c.operationalEvidenceRefs) || c.operationalEvidenceRefs.length === 0))
      errors.push(`${c.controlId}: PRODUCTION_VERIFIED PHI lacks operational evidence`);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Security evidence valid: ${ledger.version}`);
```

Extend this exact implementation with timestamp expiry/future-date, placeholder owner, and scoped legal/vendor evidence checks asserted by the tests; do not introduce a YAML twin.

- [ ] **Step 5: Wire into the current security chain**

```json
"security:evidence": "node scripts/security/validate-security-evidence.mjs"
```

Append `npm run security:evidence` to existing `security:check`; retain all existing browser/env/API checks.

- [ ] **Step 6: Run GREEN and commit**

```bash
npm run security:evidence
npx vitest run tests/security/security-evidence-validator.test.ts
npm run security:check
git add docs/governance/KLINIKOS_SECURITY_EVIDENCE.json scripts/security/validate-security-evidence.mjs package.json tests/security/security-evidence-validator.test.ts
git commit -m "feat(security): add evidence-backed P16 register"
```

---

### Task 2: Implement the pure fail-closed production-readiness evaluator

**Files:**
- Create: `src/lib/security/production-readiness.ts`
- Create: `tests/security/production-readiness.test.ts`

**Interfaces:**
- `evaluateProductionReadiness(input): ProductionReadinessDecision`
- Decision state: `BLOCKED | PARTIAL | PRODUCTION_VERIFIED | DEGRADED_OR_REVOKED`.

- [ ] **Step 1: Write RED decision tests**

```ts
import { describe, expect, it } from "vitest";
import { evaluateProductionReadiness } from "@/lib/security/production-readiness";

const base = {
  environment: "production",
  dataClass: "PHI" as const,
  capability: "zumi_phi",
  provider: "provider-a",
};

describe("production readiness", () => {
  it("blocks unknown required evidence", () => {
    expect(evaluateProductionReadiness({ ...base, controls: [] }).state).toBe("BLOCKED");
  });
  it("does not let an environment flag replace BAA/vendor evidence", () => {
    const d = evaluateProductionReadiness({ ...base, controls: [{ controlId: "egress", applicable: true, state: "TECHNICAL_EVIDENCE_GREEN" }] });
    expect(d.state).not.toBe("PRODUCTION_VERIFIED");
  });
  it("does not reuse staging evidence in production", () => {
    const d = evaluateProductionReadiness({ ...base, controls: [{ controlId: "x", applicable: false, state: "PRODUCTION_VERIFIED" }] });
    expect(d.state).toBe("BLOCKED");
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/security/production-readiness.test.ts
```

- [ ] **Step 3: Implement exact pure types/evaluator**

```ts
export type ReadinessState = "BLOCKED" | "PARTIAL" | "PRODUCTION_VERIFIED" | "DEGRADED_OR_REVOKED";
export type ReadinessControl = {
  controlId: string;
  applicable: boolean;
  state: "NOT_EVALUATED" | "BLOCKED" | "PARTIAL" | "TECHNICAL_EVIDENCE_GREEN" |
    "EXTERNAL_EVIDENCE_REQUIRED" | "LEGAL_REVIEW_REQUIRED" | "PRODUCTION_APPROVAL_REQUIRED" |
    "PRODUCTION_VERIFIED" | "DEGRADED_OR_REVOKED";
};
export type ProductionReadinessDecision = { state: ReadinessState; blockers: string[] };

export function evaluateProductionReadiness(input: {
  environment: string;
  dataClass: "PUBLIC" | "INTERNAL_CONFIDENTIAL" | "PII" | "PHI" | "SECRET" | "CROWN_JEWEL";
  capability: string;
  provider?: string;
  controls: ReadinessControl[];
}): ProductionReadinessDecision {
  const applicable = input.controls.filter((c) => c.applicable);
  if (applicable.length === 0) return { state: "BLOCKED", blockers: ["NO_APPLICABLE_EVIDENCE"] };
  const degraded = applicable.filter((c) => c.state === "DEGRADED_OR_REVOKED");
  if (degraded.length) return { state: "DEGRADED_OR_REVOKED", blockers: degraded.map((c) => c.controlId) };
  const blockers = applicable.filter((c) => c.state !== "PRODUCTION_VERIFIED").map((c) => c.controlId);
  if (blockers.length === 0) return { state: "PRODUCTION_VERIFIED", blockers: [] };
  const hasTechnical = applicable.some((c) => c.state === "TECHNICAL_EVIDENCE_GREEN" || c.state === "PARTIAL");
  return { state: hasTechnical ? "PARTIAL" : "BLOCKED", blockers };
}
```

The caller—not this pure function—selects only controls whose environment/data/capability/provider scope exactly matches the requested operation. Tests must prove staging/provider-B evidence is not selected for production/provider-A.

- [ ] **Step 4: Run GREEN and commit**

```bash
npx vitest run tests/security/production-readiness.test.ts
npm run type-check
git add src/lib/security/production-readiness.ts tests/security/production-readiness.test.ts
git commit -m "feat(security): fail closed on production readiness"
```

---

### Task 3: Extend the existing disclosure gates to P01 and P02

**Files:**
- Modify: `scripts/security/browser-confidentiality-gate.mjs`
- Modify: `scripts/security/api-disclosure-rules.mjs`
- Create: `tests/security/living-reality-disclosure.test.ts`
- Create: `tests/security/public-growth-disclosure.test.ts`

**Interfaces:**
- P01 `RealityProjection`/`RealityClientIntent` and P02 public Path/return-to payloads become first-class existing-gate targets.

- [ ] **Step 1: Write leakage mutation tests**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const forbidden = [
  "rankingWeight", "eligibilityScore", "hiddenPrompt", "systemPrompt",
  "riskWeight", "internalMargin", "rawOrm", "process.env",
];

describe("P01 browser disclosure", () => {
  it("keeps proprietary/authority fields out of Living Reality client files", () => {
    const files = [
      "src/lib/living-reality/reality-projection.ts",
      "src/lib/living-reality/reality-client-intent.ts",
      "src/components/living-reality/living-reality-runtime.tsx",
    ];
    const source = files.map((f) => readFileSync(f, "utf8")).join("\n");
    for (const value of forbidden) expect(source).not.toContain(value);
  });
});
```

P02 test must assert `src/lib/distribution/public-continuation.ts`, public Path projections, signup/login return-to code, and any growth-event payload do not serialize raw prompt/email/patient/notes.

- [ ] **Step 2: Extend the current gate rule lists**

Add exact P01/P02 paths to the existing scanners and add field-name deny rules for the forbidden names above. Keep allowlisted display labels possible; do not ban generic words like `state` or `score` globally.

- [ ] **Step 3: Run GREEN and commit**

```bash
npm run security:client-boundary
npm run security:api-disclosure
npx vitest run tests/security/living-reality-disclosure.test.ts tests/security/public-growth-disclosure.test.ts
git add scripts/security tests/security/living-reality-disclosure.test.ts tests/security/public-growth-disclosure.test.ts
git commit -m "feat(security): gate P01 and P02 disclosure"
```

---

### Task 4: Prove tenant/resource authorization on concrete clinical and scheduling boundaries

**Files:**
- Create: `tests/security/tenant-resource-adversarial.test.ts`
- Reuse/modify only when a test exposes a defect:
  - `src/app/api/appointments/route.ts`
  - `src/lib/repositories/appointment-repository.ts`
  - `src/lib/auth/api-authorization.ts`
  - representative existing referral/billing/clinical repository selected by exact current-main path during task start

**Interfaces:**
- Existing appointment boundary is canonical evidence pattern: route obtains `session.organizationId`; repository query includes both `appointment.organizationId` and `patient.organizationId`; mutations use organization-scoped `findFirst/updateMany`.

- [ ] **Step 1: Write the concrete appointment negative contract**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("src/app/api/appointments/route.ts", "utf8");
const repo = readFileSync("src/lib/repositories/appointment-repository.ts", "utf8");

describe("appointment tenant boundary", () => {
  it("takes organization scope only from the authenticated clinic session", () => {
    expect(route).toContain("listAppointmentsForOrganization(session.organizationId)");
    expect(route).toContain("organizationId: session.organizationId");
  });
  it("scopes appointment and patient rows to the same organization", () => {
    expect(repo).toContain("organizationId,");
    expect(repo).toContain("patient: { organizationId }");
    expect(repo).toContain("updateMany");
  });
});
```

- [ ] **Step 2: Add a mocked repository behavior test**

Mock Prisma and call `listAppointmentsForOrganization("org-a")`; assert every `findMany/findFirst` where clause receives `org-a` and a guessed `org-b` patient/provider cannot be projected. Use the same mock style already used by repository tests in this repo; do not require a live production database.

- [ ] **Step 3: Add two more concrete families after reading current main**

At task start, select the currently implemented referral and billing/claim repositories that expose `...ForOrganization` functions. Add table-driven source + mocked behavior tests with the same invariant: authenticated organization is passed by the route and included in the repository where clause. If either family lacks an organization-scoped repository, the test is intentionally RED and the fix is to add one there—not client filtering.

- [ ] **Step 4: Run and repair true defects**

```bash
npx vitest run tests/security/tenant-resource-adversarial.test.ts
npm run security:api-disclosure
```

- [ ] **Step 5: Commit**

```bash
git add tests/security/tenant-resource-adversarial.test.ts src/app/api src/lib/repositories src/lib/auth/api-authorization.ts
git commit -m "test(security): prove tenant resource isolation"
```

---

### Task 5: Prove Zumi/external-PHI egress stays fail-closed and dependency risk is explicit

**Files:**
- Create: `tests/security/zumi-phi-egress-adversarial.test.ts`
- Create: `docs/security/DEPENDENCY_RISK_REGISTER.md`
- Create: `tests/security/dependency-risk-contract.test.ts`
- Modify only if a failing test proves a defect: current Zumi admission/policy/adapter files
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Modify: `package.json` / `package-lock.json` only for targeted compatible dependency fixes

**Interfaces:**
- External PHI requires exact provider/model/environment + egress approval + contractual/vendor evidence where applicable; no one flag is sufficient.
- Every high/critical npm advisory must be `REMEDIATED | MITIGATED_WITH_EVIDENCE | BLOCKING`.

- [ ] **Step 1: Write Zumi denial tests before modifying policy**

```ts
import { describe, expect, it } from "vitest";
// Import the current server-side Zumi admission function discovered from docs/ZUMI.md.
// Bind its exact current signature here before implementation edits.

describe("Zumi PHI egress", () => {
  it("denies PHI when deployment approval is absent", async () => {
    // Call current admission with PHI-class input and ZUMI_PHI_EGRESS_APPROVED unset.
    // Assert its existing denied/blocked result; never snapshot provider prompt text.
  });
});
```

During task start, replace the comments with the exact current admission function call after reading its module; this test file is committed only once it contains the real signature and assertion. Required cases: approval flag absent, BAA-required adapter evidence absent, provider/model mismatch, client override attempt, provider outage with no silent provider substitution, prompt injection requesting secrets/hidden prompts/other-tenant data.

- [ ] **Step 2: Capture exact dependency evidence**

```bash
npm ci --ignore-scripts
npm audit --json > /tmp/klinikos-npm-audit.json
npm audit
```

Normalize each high/critical advisory into `docs/security/DEPENDENCY_RISK_REGISTER.md` with advisory ID, package, direct/transitive path, affected/patched range, runtime/build exposure, disposition, owner, review date.

- [ ] **Step 3: Add dependency risk contract**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const register = readFileSync("docs/security/DEPENDENCY_RISK_REGISTER.md", "utf8");
describe("dependency risk register", () => {
  it("does not leave high/critical findings without a disposition", () => {
    expect(register).toMatch(/REMEDIATED|MITIGATED_WITH_EVIDENCE|BLOCKING/);
    expect(register).not.toMatch(/\bTBD\b|\bTODO\b/);
  });
});
```

- [ ] **Step 4: Apply only compatible targeted fixes**

For each advisory with a compatible patched version:

```bash
npm install <exact-package>@<compatible-patched-version>
npm test
npm run build
npm audit
```

Do not run `npm audit fix --force`. If no safe patch exists, keep it explicit and block the affected production capability if exploitability warrants it.

- [ ] **Step 5: Run/commit**

```bash
npx vitest run tests/security/zumi-phi-egress-adversarial.test.ts tests/security/dependency-risk-contract.test.ts
npm run security:check
npm run build
git add tests/security docs/security/DEPENDENCY_RISK_REGISTER.md docs/governance/KLINIKOS_SECURITY_EVIDENCE.json package.json package-lock.json src
git commit -m "fix(security): reconcile AI egress and dependency risk"
```

---

### Task 6: Fail closed on unverified uploads, recovery, vendor/legal, MFA, and branch-protection evidence

**Files:**
- Create: `src/lib/security/upload-readiness.ts`
- Create: `tests/security/upload-readiness.test.ts`
- Create: `docs/security/BACKUP_RESTORE_EVIDENCE.md`
- Create: `docs/security/INCIDENT_RESPONSE_RUNBOOK.md`
- Create: `docs/security/VENDOR_DATA_EVIDENCE_REGISTER.md`
- Create: `tests/security/operational-evidence-contract.test.ts`
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Modify: `docs/governance/GITHUB_MAIN_PROTECTION.md` only if fresh live GitHub evidence changes it.

**Interfaces:**
- `evaluateUploadReadiness(input): { state: "BLOCKED" | "PRODUCTION_VERIFIED"; blockers: string[] }`
- Missing scan/quarantine for untrusted PHI-capable uploads is blocking.

- [ ] **Step 1: Write upload RED tests**

```ts
import { describe, expect, it } from "vitest";
import { evaluateUploadReadiness } from "@/lib/security/upload-readiness";

describe("upload readiness", () => {
  it("blocks an untrusted PHI upload without quarantine and malware scan", () => {
    expect(evaluateUploadReadiness({
      dataClass: "PHI", untrusted: true, sizeTypeValidated: true,
      quarantined: false, malwareScanned: false, storageAuthorized: true, audited: true,
    }).state).toBe("BLOCKED");
  });
});
```

- [ ] **Step 2: Implement pure upload evaluator**

```ts
export function evaluateUploadReadiness(i: {
  dataClass: "PUBLIC" | "PII" | "PHI";
  untrusted: boolean;
  sizeTypeValidated: boolean;
  quarantined: boolean;
  malwareScanned: boolean;
  storageAuthorized: boolean;
  audited: boolean;
}) {
  const blockers = [
    !i.sizeTypeValidated && "SIZE_TYPE_VALIDATION",
    i.untrusted && !i.quarantined && "QUARANTINE",
    i.untrusted && !i.malwareScanned && "MALWARE_SCAN",
    !i.storageAuthorized && "STORAGE_AUTHORIZATION",
    !i.audited && "AUDIT",
  ].filter(Boolean) as string[];
  return { state: blockers.length ? "BLOCKED" as const : "PRODUCTION_VERIFIED" as const, blockers };
}
```

Do not claim scanning exists unless an actual upload path has a verified scanner connection.

- [ ] **Step 3: Create operational evidence templates with truthful states**

`BACKUP_RESTORE_EVIDENCE.md` must contain fields: environment/datastore, backup source, schedule, retention, access control, restore procedure, last restore-test date, integrity result, RPO target, RTO target, owner, evidence ref. Unknown external fields are literally `EXTERNAL_EVIDENCE_REQUIRED`, not guessed.

`INCIDENT_RESPONSE_RUNBOOK.md` must contain severity, detection/intake, containment, evidence preservation, session/credential revocation, notification decision path, recovery, post-incident review, corrective-action tracking. Include one `TABLETOP_PLAN` cross-tenant PHI scenario; do not call it executed.

`VENDOR_DATA_EVIDENCE_REGISTER.md` must contain service/product, data classes, role, contract status, BAA/DPA state, retention/training terms, subprocessors/region where relevant, deletion/export/termination, owner, review date.

- [ ] **Step 4: Add structural evidence tests**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("operational security evidence", () => {
  it("does not manufacture restore/vendor proof", () => {
    const backup = readFileSync("docs/security/BACKUP_RESTORE_EVIDENCE.md", "utf8");
    const vendor = readFileSync("docs/security/VENDOR_DATA_EVIDENCE_REGISTER.md", "utf8");
    expect(backup).toContain("restore-test");
    expect(backup).toMatch(/EXTERNAL_EVIDENCE_REQUIRED|PRODUCTION_VERIFIED/);
    expect(vendor).toMatch(/LEGAL_REVIEW_REQUIRED|EXTERNAL_EVIDENCE_REQUIRED|PRODUCTION_VERIFIED/);
  });
});
```

- [ ] **Step 5: Refresh branch/MFA truth**

Re-query live GitHub main/rulesets. If protection is still absent, preserve `MANUAL_ADMIN_ACTION_REQUIRED`. Search current code for verified WebAuthn/passkey/MFA enforcement; if absent, record privileged-PHI stronger authentication as `BLOCKED`/`NOT_EVALUATED`, while leaving non-PHI free-Person capability independently evaluable.

- [ ] **Step 6: Run/commit**

```bash
npx vitest run tests/security/upload-readiness.test.ts tests/security/operational-evidence-contract.test.ts
npm run security:evidence
git add src/lib/security/upload-readiness.ts tests/security docs/security docs/governance/KLINIKOS_SECURITY_EVIDENCE.json docs/governance/GITHUB_MAIN_PROTECTION.md
git commit -m "feat(security): gate uploads and operational evidence"
```

---

### Task 7: Run the full P16 gate and reconcile exact-head truth

**Files:**
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Reuse existing Quality/release evidence; do not create another release registry.

**Interfaces:**
- Produces exact P16 state and blockers for P01/P02 and future PHI/enterprise programs.

- [ ] **Step 1: Run complete local verification**

```bash
npm run security:evidence
npm run security:check
npm run governance:traceability
npm run db:generate
npm run db:validate
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
```

- [ ] **Step 2: Search for unsupported broad claims**

```bash
grep -RInE 'HIPAA compliant|SOC ?2 compliant|certified|production ready' docs src governance || true
```

Review every match. Historical quoted/negative text may remain clearly marked; active unsupported claims are corrected to exact evidence-backed wording.

- [ ] **Step 3: Update P00/P16 machine evidence**

Populate exact test/evidence refs, residual blockers, environment scope, and implementation state. Public/P01/P02 non-PHI capabilities may be green even while production PHI remains blocked; do not collapse them.

- [ ] **Step 4: Push final candidate and require exact-head GitHub Quality**

Both `Quality / verify` and `Quality / deploy-contract` must pass on the same final SHA.

- [ ] **Step 5: Commit evidence reconciliation**

```bash
git add docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json docs/governance/KLINIKOS_SECURITY_EVIDENCE.json
git commit -m "docs(governance): record P16 security evidence"
```

## P16 Definition of Done for W0/W1

P16's W0/W1 tranche is complete only when:

1. one subordinate machine-readable security evidence register is validated inside `security:check`;
2. production readiness fails closed by exact environment/data/capability/provider evidence;
3. P01 scene and P02 continuation/public surfaces are covered by existing confidentiality/API-disclosure gates;
4. tenant/resource negative evidence covers concrete appointment plus referral and billing/claim families;
5. Zumi external-PHI egress remains fail-closed and legal/vendor evidence is separate from technical capability;
6. high/critical dependency advisories are remediated or explicitly risk-classified without force-upgrade theater;
7. untrusted PHI-capable upload claims remain blocked until quarantine/scanning evidence is real;
8. backup/restore, incident, vendor/legal, branch-protection, and privileged-auth evidence are truthful;
9. no broad compliance/certification claim exceeds evidence;
10. exact-head Quality/deploy-contract are green;
11. unknown regulated evidence blocks only the capabilities that require it rather than unnecessarily blocking public/free-Person non-PHI functionality.
