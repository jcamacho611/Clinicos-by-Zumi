# P16 — Security / Privacy / Legal / IP / Production PHI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make production-PHI/security readiness a fail-closed, evidence-backed release decision that protects tenant boundaries, browser/AI/vendor data flows, secrets, dependencies, uploads, recovery, legal/vendor evidence, and future enterprise diligence without manufacturing compliance claims.

**Architecture:** Extend the current security substrate (`scripts/security/*`, existing auth/resource authorization, Zumi PHI-egress controls, Quality/deploy-contract, P00 traceability) with one subordinate machine-readable security evidence register, a dependency-free validator, and a pure production-readiness decision function. Unknown required evidence remains blocking. P16 records exact environment/control evidence and gates P01/P02 and every later PHI/enterprise program; it does not create another Canon and does not label Klinikos broadly compliant.

**Tech Stack:** Existing Node security scripts, Next.js 15.5.22, React 19.1.1, TypeScript 5.9.2, Prisma/PostgreSQL, Zod 4.0.17, current auth/session/authorization layers, existing Zumi policy/redaction/audit controls, Vitest, npm audit/SBOM-capable npm tooling, GitHub Actions Quality/deploy-contract.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p16-production-security-gate-design.md`

## Global Constraints

- Real PHI is not enabled and Klinikos does not claim production PHI readiness merely because UI/schema/encryption/provider settings exist.
- `PRODUCTION_VERIFIED` is scoped to an exact environment, data class, capability, provider/rail where applicable, evidence timestamp, and applicable control set.
- Unknown required evidence fails closed.
- Do not create a second source of product/company law; P16 evidence is subordinate to P00 and the Master Canon.
- Do not claim “HIPAA compliant,” “SOC 2 compliant,” “certified,” or equivalent broad status from internal tests alone.
- Do not fabricate BAAs, DPAs, vendor attestations, backup/restore proof, WAF state, MFA state, or external deployment evidence.
- Existing exact-head Quality, migration, browser, confidentiality, and deploy-contract gates may only be strengthened, never weakened.
- P01 canvas/scene graphs count as browser surfaces and receive no confidentiality exemption.
- P02 anonymous public text is potentially sensitive and must not be persisted/logged/telemetered as raw content.
- `npm audit fix --force` is prohibited without a separate reviewed compatibility decision.
- Prefer current CI, native tooling, and low-cost/open-source controls before paid security vendors.
- Branch-protection documentation remains `MANUAL_ADMIN_ACTION_REQUIRED` until live GitHub API/ruleset evidence proves enforcement.
- Every code task uses RED → GREEN TDD and ends with an independently reviewable commit.

---

### Task 1: Lock the RED security-evidence and production-readiness contract

**Files:**
- Create: `tests/security/production-security-gate-contract.test.ts`
- Read: `scripts/security/browser-confidentiality-gate.mjs`
- Read: `scripts/security/server-env-taint-gate.mjs`
- Read: `scripts/security/api-disclosure-gate.mjs`
- Read: `.github/workflows/quality.yml`
- Read: `docs/governance/GITHUB_MAIN_PROTECTION.md`
- Read: `docs/ZUMI.md`

**Interfaces:**
- Produces RED requirements for a security evidence register, validator, and runtime/readiness decision module.

- [ ] **Step 1: Write failing contract tests**

```ts
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("P16 production security gate contract", () => {
  it("has one subordinate machine-readable security evidence register", () => {
    expect(existsSync("docs/governance/KLINIKOS_SECURITY_EVIDENCE.json")).toBe(true);
  });

  it("validates security evidence in the existing security gate chain", () => {
    expect(existsSync("scripts/security/validate-security-evidence.mjs")).toBe(true);
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["security:evidence"]).toBe("node scripts/security/validate-security-evidence.mjs");
    expect(pkg.scripts["security:check"]).toContain("security:evidence");
  });

  it("implements a fail-closed PHI production decision", () => {
    expect(existsSync("src/lib/security/production-readiness.ts")).toBe(true);
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/security/production-security-gate-contract.test.ts
```

Expected: FAIL because P16 evidence/decision artifacts do not exist.

- [ ] **Step 3: Prove existing security baseline before edits**

```bash
npm run security:check
npm run governance:traceability
```

Expected: PASS on the clean base.

- [ ] **Step 4: Commit RED contract**

```bash
git add tests/security/production-security-gate-contract.test.ts
git commit -m "test(security): lock P16 production gate contract"
```

---

### Task 2: Create the subordinate security evidence register and dependency-free validator

**Files:**
- Create: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Create: `scripts/security/validate-security-evidence.mjs`
- Modify: `package.json`
- Create: `tests/security/security-evidence-validator.test.ts`

**Interfaces:**
- Register control states:
  - `NOT_EVALUATED`
  - `BLOCKED`
  - `PARTIAL`
  - `TECHNICAL_EVIDENCE_GREEN`
  - `EXTERNAL_EVIDENCE_REQUIRED`
  - `LEGAL_REVIEW_REQUIRED`
  - `PRODUCTION_APPROVAL_REQUIRED`
  - `PRODUCTION_VERIFIED`
  - `DEGRADED_OR_REVOKED`
- Each record includes: `controlId`, `family`, `environments`, `dataClasses`, `capabilities`, `state`, `disposition`, `technicalEvidenceRefs`, `operationalEvidenceRefs`, `externalEvidenceRefs`, `legalEvidenceRefs`, `owner`, `lastVerifiedAt`, `expiresAt`, `blockerReason`, `allowedClaim`.

- [ ] **Step 1: Write RED validator mutation tests**

Require rejection of:
- unknown state/family/data class;
- duplicate `controlId`;
- placeholder owner or evidence;
- `PRODUCTION_VERIFIED` with empty technical evidence;
- `PRODUCTION_VERIFIED` for PHI/external rail with required legal/vendor evidence empty;
- future `lastVerifiedAt`;
- expired evidence that still claims verified;
- `allowedClaim` containing broad unsupported phrases such as `HIPAA compliant`, `SOC 2 compliant`, or `certified` without an exact external evidence class defined by the register.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/security/security-evidence-validator.test.ts
```

- [ ] **Step 3: Create an initial truthful register**

Seed only observed/known controls. Examples:
- existing browser confidentiality gate → `TECHNICAL_EVIDENCE_GREEN` with script/test refs;
- existing API disclosure gate → `TECHNICAL_EVIDENCE_GREEN`;
- existing server-env taint gate → `TECHNICAL_EVIDENCE_GREEN`;
- production PHI overall → `BLOCKED` or `PARTIAL` until exact environment/vendor/legal/recovery evidence is present;
- branch protection → `BLOCKED` / manual admin action with `docs/governance/GITHUB_MAIN_PROTECTION.md` evidence;
- MFA/passkeys → `NOT_EVALUATED` or `BLOCKED` for privileged PHI use until implementation is verified;
- backup/restore → `EXTERNAL_EVIDENCE_REQUIRED` unless exact provider/restore evidence already exists;
- BAAs/DPAs → `EXTERNAL_EVIDENCE_REQUIRED` or `LEGAL_REVIEW_REQUIRED` unless exact signed evidence is available.

Do not populate a control as green based on assumptions.

- [ ] **Step 4: Implement dependency-free validator**

Use Node built-ins only. Keep the register subordinate by requiring `authority.parent` to point to P00/Master Canon and rejecting any field that claims the register overrides product authority.

- [ ] **Step 5: Wire into existing security chain**

Add:

```json
"security:evidence": "node scripts/security/validate-security-evidence.mjs"
```

and append it to `security:check` without removing existing gates.

- [ ] **Step 6: Run GREEN**

```bash
npm run security:evidence
npx vitest run tests/security/security-evidence-validator.test.ts tests/security/production-security-gate-contract.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add docs/governance/KLINIKOS_SECURITY_EVIDENCE.json scripts/security/validate-security-evidence.mjs package.json tests/security
git commit -m "feat(security): add evidence-backed P16 register"
```

---

### Task 3: Implement the pure fail-closed production-readiness decision function

**Files:**
- Create: `src/lib/security/production-readiness.ts`
- Create: `tests/security/production-readiness.test.ts`

**Interfaces:**
- `DataClass = "PUBLIC" | "INTERNAL_CONFIDENTIAL" | "PII" | "PHI" | "SECRET" | "CROWN_JEWEL"`
- `evaluateProductionReadiness(input: ProductionReadinessInput): ProductionReadinessDecision`
- Decision states: `BLOCKED | PARTIAL | PRODUCTION_VERIFIED | DEGRADED_OR_REVOKED`

- [ ] **Step 1: Write RED decision-table tests**

Cover:
- all applicable evidence verified → `PRODUCTION_VERIFIED` for the exact scope only;
- one required control unknown → `BLOCKED`;
- required BAA missing for an external PHI rail → `BLOCKED`;
- AI egress environment flag true but legal/vendor evidence absent → `BLOCKED`;
- verified technical controls but production approval pending → `PARTIAL`;
- expired/revoked evidence → `DEGRADED_OR_REVOKED`;
- evidence for staging does not authorize production;
- evidence for one provider/model does not authorize another;
- public data capability may be released without PHI-specific controls when its own applicable set is green.

- [ ] **Step 2: Run RED**

```bash
npx vitest run tests/security/production-readiness.test.ts
```

- [ ] **Step 3: Implement a pure evaluator**

The evaluator takes explicit evidence records as input; do not import browser/client modules. It returns a decision plus blocking control IDs and the narrow allowed claim. It must never mutate evidence state.

- [ ] **Step 4: Run GREEN**

```bash
npx vitest run tests/security/production-readiness.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/security/production-readiness.ts tests/security/production-readiness.test.ts
git commit -m "feat(security): fail closed on production PHI readiness"
```

---

### Task 4: Build the cross-tenant/context adversarial authorization suite

**Files:**
- Create: `tests/security/tenant-context-adversarial.test.ts`
- Reuse current auth/session/tenant/resource fixtures/helpers discovered in existing tests
- Modify production authorization code only when the new negative test exposes a real defect

**Interfaces:**
- Produces denial evidence across representative actors/objects without creating a parallel auth framework.

- [ ] **Step 1: Enumerate current representative protected resources from the repository**

Use existing implemented routes/entities in these families where available on current main: patient/encounter, appointment, task, referral, claim/billing, organization/clinic, Grid private action, file/export, and admin/company endpoints. Select at least five different resource families plus one list/search endpoint.

- [ ] **Step 2: Write RED/verification matrix**

For each selected family test:
- wrong tenant ID substitution;
- wrong Person/context;
- stale/revoked membership fixture where supported;
- role label without resource authority;
- guessed object ID;
- list/search does not reveal cross-tenant records;
- export/download independently reauthorizes;
- context switch recomputes access.

Tests may initially pass; the purpose is to create persistent negative evidence. Any failure is a merge blocker and must be fixed in the owning authorization layer, not hidden in the test.

- [ ] **Step 3: Run the suite**

```bash
npx vitest run tests/security/tenant-context-adversarial.test.ts
```

- [ ] **Step 4: Fix actual defects with the smallest owning-layer change**

Never add client-side filtering as the security fix. Authorization must reject before returning the resource.

- [ ] **Step 5: Re-run and commit**

```bash
npx vitest run tests/security/tenant-context-adversarial.test.ts
npm run security:api-disclosure
git add tests/security/tenant-context-adversarial.test.ts src
git commit -m "test(security): prove tenant and context isolation"
```

---

### Task 5: Extend browser/API disclosure gates for P01/P02 and sensitive new client surfaces

**Files:**
- Modify: `scripts/security/browser-confidentiality-gate.mjs`
- Modify: `scripts/security/api-disclosure-rules.mjs`
- Create: `tests/security/living-reality-disclosure.test.ts`
- Create: `tests/security/public-growth-disclosure.test.ts`

**Interfaces:**
- P01 scene DTOs and P02 continuation/public-result payloads become explicitly covered disclosure surfaces.

- [ ] **Step 1: Write RED leakage fixtures/tests**

Mutation cases must fail when a client/scene/public response includes names such as:
- `rankingWeight`
- `eligibilityScore`
- `hiddenPrompt`
- `systemPrompt`
- `riskWeight`
- `internalMargin`
- raw `prompt` continuation
- raw ORM-style nested record spreads
- server-only secret/env values.

- [ ] **Step 2: Extend rules narrowly**

Add P01 `src/components/living-reality/**`, `src/lib/living-reality/**` client-safe outputs, P02 public/continuation DTOs, and new APIs to the existing rules rather than creating another disclosure scanner.

- [ ] **Step 3: Prove positive safe cases**

Safe `RealityProjection`, public intent enums, and sanitized continuation fields must pass; do not create a rule so broad it bans legitimate display labels.

- [ ] **Step 4: Run GREEN**

```bash
npm run security:client-boundary
npm run security:api-disclosure
npx vitest run tests/security/living-reality-disclosure.test.ts tests/security/public-growth-disclosure.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add scripts/security tests/security/living-reality-disclosure.test.ts tests/security/public-growth-disclosure.test.ts
git commit -m "feat(security): gate 3D and growth disclosure boundaries"
```

---

### Task 6: Prove Zumi/external-AI PHI egress remains fail-closed

**Files:**
- Read/modify the existing Zumi admission/policy/adapter files that enforce PHI egress
- Modify: `docs/ZUMI.md` only if current implementation evidence changes
- Create: `tests/security/zumi-phi-egress-adversarial.test.ts`
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`

**Interfaces:**
- Produces negative evidence for exact provider/model/environment PHI egress and records legal/external blockers separately from technical capability.

- [ ] **Step 1: Write adversarial tests**

Require denial when:
- request contains PHI-class input and `ZUMI_PHI_EGRESS_APPROVED` is absent/false;
- adapter BAA-required declaration is false/missing;
- provider/model differs from the approved evidence scope;
- user/client tries to override the gate;
- prompt injection asks Zumi/tooling to expose hidden prompts, secrets, tenant data, or bypass human approval;
- provider unavailable triggers a safe fallback rather than a silent provider substitution.

- [ ] **Step 2: Run tests before changing implementation**

```bash
npx vitest run tests/security/zumi-phi-egress-adversarial.test.ts
```

If already green, retain existing implementation and record evidence. If a case fails, fix the server admission/policy layer.

- [ ] **Step 3: Update evidence register narrowly**

Technical gate can be green while external/legal state remains required. Do not upgrade the overall PHI capability to `PRODUCTION_VERIFIED` without exact BAA/vendor/deployment evidence.

- [ ] **Step 4: Commit**

```bash
git add tests/security/zumi-phi-egress-adversarial.test.ts src docs/ZUMI.md docs/governance/KLINIKOS_SECURITY_EVIDENCE.json
git commit -m "test(zumi): prove fail-closed PHI egress"
```

---

### Task 7: Investigate and remediate the three inherited high-severity dependency advisories safely

**Files:**
- Modify: `package.json` / `package-lock.json` only for targeted compatible remediation
- Create: `docs/security/DEPENDENCY_RISK_REGISTER.md`
- Create: `tests/security/dependency-risk-contract.test.ts`
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`

**Interfaces:**
- Produces exact advisory/package/path/exposure/decision evidence; no force upgrade.

- [ ] **Step 1: Capture exact current audit evidence**

Run:

```bash
npm ci --ignore-scripts
npm audit --json > /tmp/klinikos-npm-audit.json
npm audit
```

Record each high advisory ID, dependency path, affected range, patched range, direct/transitive status, and runtime vs dev/build exposure in `docs/security/DEPENDENCY_RISK_REGISTER.md`.

- [ ] **Step 2: Write a contract test that prevents silent regression**

The test should parse a checked-in normalized risk summary, not the volatile full npm audit output. It must require every high/critical advisory to have one of: `REMEDIATED`, `MITIGATED_WITH_EVIDENCE`, or `BLOCKING`, plus owner and review date.

- [ ] **Step 3: Attempt minimal compatible upgrades one advisory at a time**

Use normal `npm install <package>@<patched-compatible-version>` or `overrides` only when dependency semantics justify it. After each change run targeted tests + `npm run build`.

- [ ] **Step 4: Never force an unreviewed major upgrade**

Do not run `npm audit fix --force`. If no safe compatible patch exists, keep the residual risk explicit with a mitigation/expiry and keep PHI production blocked if exploitability warrants it.

- [ ] **Step 5: Run full security/build verification**

```bash
npm run security:check
npm run type-check
npm test
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json docs/security/DEPENDENCY_RISK_REGISTER.md tests/security/dependency-risk-contract.test.ts docs/governance/KLINIKOS_SECURITY_EVIDENCE.json
git commit -m "fix(security): reconcile inherited dependency advisories"
```

---

### Task 8: Gate uploads/file claims until quarantine and malware-scanning evidence is real

**Files:**
- Discover current upload/file route and storage modules on current main
- Create: `src/lib/security/upload-readiness.ts`
- Create: `tests/security/upload-readiness.test.ts`
- Modify upload routes only where they currently accept untrusted files without a safe gate
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`

**Interfaces:**
- `evaluateUploadReadiness({ dataClass, quarantine, typeValidation, malwareScan, storageAuthorization, audit }): UploadReadinessDecision`

- [ ] **Step 1: Inventory active upload paths**

Search source for `FormData`, multipart handlers, file/blob/storage APIs, document/image uploads, and signed upload URLs. Classify each path as public, internal, PII, PHI-capable, or inactive/demo.

- [ ] **Step 2: Write RED/readiness tests**

For PHI-capable/untrusted upload, require:
- size/type validation;
- quarantine before broad access;
- malware/content scan state;
- authorized storage;
- independent read authorization;
- audit;
- retention/deletion state.

If malware scanning is not implemented, decision must be `BLOCKED`/`EXTERNAL_EVIDENCE_REQUIRED`; UI/claims must not say files are scanned.

- [ ] **Step 3: Implement fail-closed readiness evaluation**

Do not buy a scanner in this task. Reuse existing provider scanning if verified; otherwise keep the relevant production feature blocked and record the cheapest viable future connection (for example a self-hosted/open-source scanner) as a strategy disposition, not as implemented truth.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run tests/security/upload-readiness.test.ts
npm run security:check
git add src/lib/security/upload-readiness.ts tests/security/upload-readiness.test.ts src docs/governance/KLINIKOS_SECURITY_EVIDENCE.json
git commit -m "feat(security): fail closed on unverified upload safety"
```

---

### Task 9: Add backup/restore, incident-response, and vendor/legal evidence contracts without faking external proof

**Files:**
- Create: `docs/security/BACKUP_RESTORE_EVIDENCE.md`
- Create: `docs/security/INCIDENT_RESPONSE_RUNBOOK.md`
- Create: `docs/security/VENDOR_DATA_EVIDENCE_REGISTER.md`
- Create: `tests/security/operational-evidence-contract.test.ts`
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`

**Interfaces:**
- Produces operational evidence requirements and truthful external-evidence states; these docs do not themselves make the controls verified.

- [ ] **Step 1: Write RED structural tests**

Require the backup/restore evidence doc to contain exact fields for datastore/environment, backup source, schedule, retention, access control, restore procedure, restore test date, integrity result, RPO target, RTO target, owner, and evidence reference. Require `restore test date` to remain explicitly unverified when no actual test exists.

Require incident runbook sections for severity, intake/detection, containment, evidence preservation, credential/session revocation, notification decision path, recovery, post-incident review, and corrective-action tracking.

Require vendor register fields for exact service/product, data classes, role, contract status, BAA/DPA state, retention/training terms, subprocessors/region where relevant, termination/export/deletion, owner, renewal/review date.

- [ ] **Step 2: Create docs from verified facts only**

Where external facts are not available, write `EXTERNAL_EVIDENCE_REQUIRED` or `LEGAL_REVIEW_REQUIRED`; do not use `compliant`, `covered`, `certified`, or invented contract dates.

- [ ] **Step 3: Add one tabletop scenario**

Use a cross-tenant PHI exposure scenario with detection → containment → session/secret revocation → evidence preservation → legal/customer notification decision → recovery → postmortem. Label it `TABLETOP_PLAN` until actually executed; execution evidence is a separate future artifact.

- [ ] **Step 4: Run GREEN and commit**

```bash
npx vitest run tests/security/operational-evidence-contract.test.ts
npm run security:evidence
git add docs/security tests/security/operational-evidence-contract.test.ts docs/governance/KLINIKOS_SECURITY_EVIDENCE.json
git commit -m "docs(security): establish recovery incident and vendor evidence contracts"
```

---

### Task 10: Verify session/origin/rate/secret controls used by P02 and privileged paths

**Files:**
- Create: `tests/security/session-origin-abuse.test.ts`
- Reuse current account/session, same-origin, admission/rate-limit, return-to, and secret config modules
- Modify production code only when a new negative test exposes a defect

**Interfaces:**
- Produces negative evidence for session fixation, logout/revocation, safe redirects, CSRF/same-origin, enumeration, rate controls, and secret/client separation.

- [ ] **Step 1: Add negative tests**

Cover:
- old session cookie cannot survive account/session rotation where the current design rotates;
- logout clears appropriate auth state;
- cross-origin state-changing account/continuation requests fail;
- return-to rejects external/protocol-relative URLs;
- public/account rate limits fail safely;
- trusted proxy headers are ignored unless explicitly enabled;
- client bundle/source cannot import server secret config;
- user-controlled role/intent/continuation cannot widen authority.

- [ ] **Step 2: Run and repair true defects**

```bash
npx vitest run tests/security/session-origin-abuse.test.ts
```

Fix the server-owned control, not the test expectation, for genuine vulnerabilities.

- [ ] **Step 3: Commit**

```bash
git add tests/security/session-origin-abuse.test.ts src
git commit -m "test(security): harden session origin and abuse controls"
```

---

### Task 11: Carry branch-protection truth and privileged-auth gap as explicit release risks

**Files:**
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Modify: `docs/governance/GITHUB_MAIN_PROTECTION.md` only after fresh live GitHub evidence changes
- Create: `tests/security/release-governance-truth.test.ts`

**Interfaces:**
- Produces truthful state for branch policy and stronger-auth readiness.

- [ ] **Step 1: Re-query live GitHub branch/ruleset evidence during execution**

If protection/rulesets still are not enforced, keep `MANUAL_ADMIN_ACTION_REQUIRED`. Do not change the state from documentation alone.

- [ ] **Step 2: Record privileged-auth truth**

If no MFA/passkey/WebAuthn implementation is found and verified, record privileged/PHI stronger-auth control as `BLOCKED` or `NOT_EVALUATED` according to scope. Do not block free public Person P02 merely because privileged clinical authentication is unfinished; do block any future capability whose risk profile requires it.

- [ ] **Step 3: Write truth tests**

The test must fail if the evidence register claims branch protection `PRODUCTION_VERIFIED` while `GITHUB_MAIN_PROTECTION.md` says manual action, or claims MFA verified without a concrete implementation/evidence ref.

- [ ] **Step 4: Run and commit**

```bash
npx vitest run tests/security/release-governance-truth.test.ts
npm run security:evidence
git add docs/governance tests/security/release-governance-truth.test.ts
git commit -m "docs(security): preserve release governance truth"
```

---

### Task 12: Run the full P16 gate, reconcile P00 traceability, and capture exact-head evidence

**Files:**
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json`
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Reuse the current release/evidence registry and Quality workflow

**Interfaces:**
- Produces final W0/W1 P16 evidence state without converting unknown external evidence into false green claims.

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

All applicable checks must pass.

- [ ] **Step 2: Update P00 traceability with implemented P16 controls**

Record new tests/gates, exact residual blockers, operational/external evidence states, and the security consequence for P01/P02. Keep production-PHI implementation state scoped and truthful.

- [ ] **Step 3: Push final candidate and require exact-head GitHub Quality**

Both `Quality / verify` and `Quality / deploy-contract` must be green on the same final SHA. A prior green SHA is not release evidence.

- [ ] **Step 4: Final claim review**

Search changed docs/UI for unsupported broad phrases (`HIPAA compliant`, `SOC 2 compliant`, `certified`, `production ready`) and replace them with exact verified control statements or explicit remaining evidence requirements.

- [ ] **Step 5: Commit evidence reconciliation**

```bash
git add docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json docs/governance/KLINIKOS_SECURITY_EVIDENCE.json
git commit -m "docs(governance): record P16 security evidence"
```

## P16 Definition of Done for W0/W1

P16's W0/W1 tranche is complete only when:

1. one subordinate security evidence register is machine-validated and wired into `security:check`;
2. production readiness is fail-closed by exact environment/data/capability/provider evidence;
3. cross-tenant/context negative tests cover representative protected resources;
4. P01 scene and P02 continuation/public surfaces are covered by confidentiality/API disclosure gates;
5. Zumi PHI egress remains fail-closed and legal/vendor evidence stays separate from technical capability;
6. inherited high advisories are remediated or explicitly risk-classified without force-upgrade theater;
7. PHI-capable untrusted upload claims remain blocked until quarantine/scanning evidence is real;
8. backup/restore, incident, and vendor/legal evidence requirements are explicit and truthful;
9. session/origin/rate/redirect/secret negative controls are tested;
10. branch protection and MFA/passkey state are represented as actually verified, not aspirational;
11. no broad compliance/certification claim exceeds evidence;
12. exact-head Quality/deploy-contract are green;
13. unknown external/legal/operational evidence remains blocking for the exact capabilities that require it, without unnecessarily blocking public/free-Person functionality that does not use PHI.
