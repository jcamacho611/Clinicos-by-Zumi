# P16 Security / Privacy / Legal / IP / Production PHI Gate — W1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the first enforceable P16 release-authority layer alongside P01 so Klinikos can prove what security controls are actually green, keep production PHI fail-closed, and prevent the new spatial browser runtime from widening data or authority exposure.

**Architecture:** Reuse P00 traceability plus existing confidentiality/API/env gates. Add one subordinate machine-readable security evidence register and a dependency-free validator that validates truthfulness of evidence state—not compliance marketing claims. Extend the current browser boundary to cover the P01 spatial runtime and keep PHI production authorization blocked until exact environment, technical, operational, vendor/contract, recovery, and legal evidence exists.

**Tech Stack:** Node built-ins, Vitest, existing `scripts/security/*`, existing Quality workflow, existing P00 JSON traceability. No paid security SaaS and no new runtime security dependency in this tranche.

**Spec:** `docs/superpowers/specs/2026-09-03-program-p16-production-security-gate-design.md`

## Global Constraints

- `MERGED ≠ DEPLOYED ≠ PRODUCTION VERIFIED ≠ PHI AUTHORIZED`.
- P16 evidence state is subordinate to the Master Canon and P00 implementation state; it cannot create product/company law.
- `PRODUCTION_VERIFIED` is scoped to an exact environment, data class, capability, provider/rail where applicable, and evidence timestamp.
- Unknown or incomplete PHI readiness fails closed.
- Do not claim MFA/passkeys, malware scanning, restore proof, BAA/DPA coverage, branch protection, or certification before verified evidence exists.
- Existing security gates are extended, not weakened or replaced.
- Browser/canvas/devtools/network payloads/local storage/screenshots are inspectable.
- Payment, clinical, professional, tenant, and legal authority remain server-owned.
- Dependency advisories are remediated through evidence and compatibility testing; never use `npm audit fix --force` merely to make a dashboard green.
- P01 may ship public/member non-PHI spatial projection only when its exact evidence is green; PHI-bearing spatial projection remains blocked until separately verified.

---

### Task 1: Create the security evidence register contract with fail-closed PHI state

**Files:**
- Create: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Create: `scripts/security/security-evidence-gate.mjs`
- Create: `tests/security-evidence-gate.test.ts`

**Interfaces:**
- Consumes: P00 authority refs and live evidence documents.
- Produces: deterministic process exit `0` for internally consistent evidence state and exit `1` for impossible/unsupported security claims.

- [ ] **Step 1: Write the RED validator behavior tests**

Create fixtures by mutating a temporary copy of the checked-in JSON. Tests must reject:

```ts
// production PHI cannot be verified without scoped evidence
record.state = "PRODUCTION_VERIFIED";
record.environment = "production";
record.dataClasses = ["PHI"];
record.technicalEvidenceRefs = [];
expect(() => runGate(path)).toThrow(/technicalEvidenceRefs must not be empty/);

// a repository-policy document cannot be misreported as enforced branch protection
record.controlId = "P16-GITHUB-MAIN-PROTECTION";
record.state = "PRODUCTION_VERIFIED";
record.technicalEvidenceRefs = ["docs/governance/GITHUB_MAIN_PROTECTION.md"];
expect(() => runGate(path)).toThrow(/branch protection remains manual/i);
```

Also reject placeholder owners, unsupported states, missing `lastVerifiedAt` on `TECHNICAL_EVIDENCE_GREEN` or stronger states, and any `customerClaimAllowed: true` while state is `BLOCKED`, `PARTIAL`, `NOT_EVALUATED`, `EXTERNAL_EVIDENCE_REQUIRED`, or `LEGAL_REVIEW_REQUIRED`.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/security-evidence-gate.test.ts`

Expected: FAIL because the register and validator do not exist.

- [ ] **Step 3: Create the initial truthful register**

Use this top-level contract:

```json
{
  "version": "2026-09-03.1",
  "status": "SECURITY_EVIDENCE_REGISTER",
  "authority": {
    "parent": "docs/KLINIKOS_MASTER_CANON.md",
    "traceability": "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json",
    "program": "P16"
  },
  "states": [
    "NOT_EVALUATED",
    "BLOCKED",
    "PARTIAL",
    "TECHNICAL_EVIDENCE_GREEN",
    "EXTERNAL_EVIDENCE_REQUIRED",
    "LEGAL_REVIEW_REQUIRED",
    "PRODUCTION_APPROVAL_REQUIRED",
    "PRODUCTION_VERIFIED",
    "DEGRADED_OR_REVOKED"
  ],
  "controls": []
}
```

Seed these exact truthful controls:

1. `P16-GITHUB-MAIN-PROTECTION`: `BLOCKED`, environment `repository`, evidence `docs/governance/GITHUB_MAIN_PROTECTION.md`, customer claim false.
2. `P16-PRODUCTION-PHI`: `BLOCKED`, environment `production`, data class `PHI`, blocker `Production PHI requires technical, operational, vendor/contract, recovery and legal evidence not yet proven for the exact production environment.`, customer claim false.
3. `P16-P01-SPATIAL-PROJECTION`: `NOT_EVALUATED`, environments `public` and `member`, data classes `PUBLIC_SAFE` and `ACCOUNT_SAFE`, customer claim false until P01 exact-head evidence.
4. `P16-DEPENDENCY-ADVISORIES`: `PARTIAL`, environment `repository`, evidence note that the 2026-09-03 P00 npm install reported three high-severity advisories but package/advisory identities were not captured in that summary; customer claim false.

Do not invent advisory package names, BAA status, certifications, restore proof, or PHI readiness.

- [ ] **Step 4: Implement the dependency-free validator**

Use Node built-ins only. Require non-empty strings/arrays where their evidence state demands them. `PRODUCTION_VERIFIED` must require:

- exact non-empty environment list;
- non-empty data class list;
- owner;
- `lastVerifiedAt` ISO timestamp;
- technical evidence;
- operational evidence;
- external/vendor evidence when the control declares an external dependency;
- legal/contract evidence when the control declares legal dependency;
- `blocker` must be null;
- customer claim may be true only if its exact claim text is non-empty.

Special-case `P16-GITHUB-MAIN-PROTECTION`: read `docs/governance/GITHUB_MAIN_PROTECTION.md`; if it contains `MANUAL_ADMIN_ACTION_REQUIRED`, the evidence record cannot be stronger than `BLOCKED`/`PARTIAL`.

- [ ] **Step 5: Run validator and tests**

```bash
node scripts/security/security-evidence-gate.mjs
npm test -- --run tests/security-evidence-gate.test.ts
```

Expected: `Klinikos security evidence valid: 2026-09-03.1` and all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/governance/KLINIKOS_SECURITY_EVIDENCE.json scripts/security/security-evidence-gate.mjs tests/security-evidence-gate.test.ts
git commit -m "feat(p16): add fail-closed security evidence register"
```

---

### Task 2: Wire P16 evidence truth into the existing security command and Quality

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/quality.yml`
- Modify: `tests/security-evidence-gate.test.ts`

**Interfaces:**
- Produces: `npm run security:evidence`; existing `npm run security:check` runs evidence validation after current client/env/API disclosure gates.

- [ ] **Step 1: Extend RED source assertions**

Assert:

```ts
expect(pkg.scripts["security:evidence"]).toBe("node scripts/security/security-evidence-gate.mjs");
expect(pkg.scripts["security:check"]).toContain("security:evidence");
expect(quality).toContain("npm run security:check");
```

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/security-evidence-gate.test.ts`

- [ ] **Step 3: Add the script without weakening current gates**

Set:

```json
"security:evidence": "node scripts/security/security-evidence-gate.mjs",
"security:check": "npm run security:client-boundary && npm run security:env-boundary && npm run security:api-disclosure && npm run security:evidence"
```

Do not remove or reorder away the existing three source gates.

- [ ] **Step 4: Run the combined security gate**

Run: `npm run security:check`

Expected: all four gates PASS while PHI remains truthfully blocked in evidence state.

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/quality.yml tests/security-evidence-gate.test.ts
git commit -m "ci(p16): enforce security evidence truth"
```

---

### Task 3: Extend the browser confidentiality boundary to the P01 runtime

**Files:**
- Modify: `scripts/security/browser-confidentiality-gate.mjs`
- Create: `tests/living-reality-confidentiality.test.ts`

**Interfaces:**
- Consumes: P01 files under `src/components/living-reality/**` and `src/lib/living-reality/**`.
- Produces: negative assurance that client runtime cannot transitively import DB/repositories/private orchestration/security internals and that runtime source does not contain forbidden browser markers.

- [ ] **Step 1: Write RED source tests**

The test must verify that client-side Living Reality modules fail if a temporary fixture imports any of:

```text
@/lib/db
@/lib/repositories/member-repository
@/lib/orchestration/engine-registry
@/features/zumi/master-directive
@/lib/security/secrets
```

It must also reject runtime source containing `DATABASE_URL`, `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `passwordHash`, or `internalScore` markers.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run tests/living-reality-confidentiality.test.ts`

- [ ] **Step 3: Add a reusable exported scan helper or fixture mode**

Refactor the gate only enough for testability. Preserve its current production walk behavior. Do not weaken existing `CLIENT_FORBIDDEN_IMPORTS`, `CLIENT_FORBIDDEN_RESOLVED_PATHS`, secret patterns, public asset rules, or transitive import traversal.

- [ ] **Step 4: Run the targeted and full client boundary**

```bash
npm test -- --run tests/living-reality-confidentiality.test.ts
npm run security:client-boundary
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/security/browser-confidentiality-gate.mjs tests/living-reality-confidentiality.test.ts
git commit -m "test(p16): defend living reality browser boundary"
```

---

### Task 4: Prove P01 public/member projection minimization before allowing technical-green state

**Files:**
- Modify: `tests/living-reality-confidentiality.test.ts`
- Consume after P01 Task 2/6 exists: `src/lib/living-reality/reality-projection.ts`, member/public projection builders.

**Interfaces:**
- Produces: evidence that P01 tranche 1 is limited to `PUBLIC_SAFE` and `ACCOUNT_SAFE` projection classes.

- [ ] **Step 1: Add projection-key allowlist tests**

For every `SpatialNodeProjection`, allow exactly:

```text
id, kind, label, state, summary, claimStatus, routeRef
```

For every `SpatialEdgeProjection`, allow exactly:

```text
id, fromId, toId, kind, label
```

Forbid serialized keys matching:

```regex
/(password|secret|token|ssn|socialSecurity|diagnosis|medication|insuranceId|internalScore|rankingWeight|margin|prompt|reasoning)/i
```

This key denylist is specific to the P01 public/member W1 tranche; later authorized clinical projections require a separate P16 review rather than silently expanding this list.

- [ ] **Step 2: Run targeted tests**

Run: `npm test -- --run tests/living-reality-confidentiality.test.ts tests/living-reality-projection.test.ts tests/public-living-reality-projection.test.ts`

Expected: PASS.

- [ ] **Step 3: Run security gates**

Run: `npm run security:check`

Expected: PASS while `P16-P01-SPATIAL-PROJECTION` is still not stronger than `NOT_EVALUATED` until exact-head release evidence exists.

- [ ] **Step 4: Commit**

```bash
git add tests/living-reality-confidentiality.test.ts
git commit -m "test(p16): prove spatial projection minimization"
```

---

### Task 5: Capture dependency advisory evidence without force-upgrading the application

**Files:**
- Create: `docs/governance/DEPENDENCY_SECURITY_POLICY.md`
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json` only with evidence actually returned by the command.

**Interfaces:**
- Consumes: npm registry advisory output when available.
- Produces: exact distinction between production dependency blockers, dev-only advisories, unavailable advisory service, and accepted/remediated risk.

- [ ] **Step 1: Run production-scope audit**

```bash
mkdir -p artifacts/security
npm audit --json --omit=dev > artifacts/security/npm-audit-production.json
AUDIT_EXIT=$?
printf 'npm_audit_exit=%s\n' "$AUDIT_EXIT" > artifacts/security/npm-audit-status.txt
```

Do not discard the JSON when exit is non-zero; a non-zero audit exit usually contains the findings needed for triage.

- [ ] **Step 2: Classify findings**

For each high/critical production finding, record package, advisory URL/ID, affected range, direct/transitive status, fix availability, and whether the proposed fix is semver-breaking. If the registry/audit service is unreachable, record `EXTERNAL_EVIDENCE_REQUIRED`; do not treat network failure as a clean audit.

- [ ] **Step 3: Write the policy**

`DEPENDENCY_SECURITY_POLICY.md` must state:

- no `npm audit fix --force` without scoped compatibility proof;
- critical exploitable production dependency = release blocker unless an explicitly reviewed compensating control exists;
- high production dependency = remediation/acceptance decision required before a production security claim;
- dev-only findings are classified separately from runtime exposure;
- every dependency remediation reruns typecheck, lint, tests, journeys, build, confidentiality and deploy-contract;
- audit service unavailable means evidence unavailable, not zero vulnerabilities.

- [ ] **Step 4: Update only factual evidence**

If exact findings were returned, replace the P16 dependency-control blocker/evidence text with their exact references and current state. Do not invent an advisory identity from the earlier `3 high severity vulnerabilities` npm summary.

- [ ] **Step 5: Commit policy/evidence**

```bash
git add docs/governance/DEPENDENCY_SECURITY_POLICY.md docs/governance/KLINIKOS_SECURITY_EVIDENCE.json
git commit -m "docs(p16): govern dependency advisory remediation"
```

The generated `artifacts/security/npm-audit-*.json` is release evidence, not source authority; upload through PR/CI evidence handling rather than committing it unless a later evidence policy explicitly requires source retention.

---

### Task 6: Update the P16 evidence state only after P01 exact-head verification

**Files:**
- Modify: `docs/governance/KLINIKOS_SECURITY_EVIDENCE.json`
- Modify: `docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json` with concrete P16/P01 evidence refs only; no new law.

**Interfaces:**
- Produces: truthful security state for the W1 spatial runtime.

- [ ] **Step 1: Run complete local/static release gates**

```bash
npm run governance:traceability
npm run security:check
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run build
```

- [ ] **Step 2: Require exact-head GitHub Quality evidence**

Both `Quality / verify` and `Quality / deploy-contract` must pass on the final P01/P16 head. Browser evidence must show meaningful Precision-mode behavior under CI's disabled-GPU path and no disclosure regression.

- [ ] **Step 3: Set the spatial control no stronger than the evidence permits**

If all W1 public/member technical gates are green, set `P16-P01-SPATIAL-PROJECTION` to `TECHNICAL_EVIDENCE_GREEN` for exact environments/data classes `public/member` + `PUBLIC_SAFE/ACCOUNT_SAFE`, with exact head/run/test refs and timestamp.

Do **not** set `P16-PRODUCTION-PHI` to `PRODUCTION_VERIFIED`; P01 W1 does not prove production PHI readiness, vendor contracts, restore drills, MFA/passkeys, malware scanning, BAA/DPA coverage, or legal approval.

- [ ] **Step 4: Re-run the evidence validator after state change**

Run: `npm run security:evidence`

Expected: PASS.

- [ ] **Step 5: Finish through the P01/P16 PR gate**

Use `superpowers:finishing-a-development-branch`; merge only the exact verified head. After merge, independently verify deployment before making any production claim.

---

## Deferred P16 tranches — explicitly not claimed by this W1 plan

The following remain separate P16 implementation plans because they are independent security subsystems: privileged MFA/passkeys, complete tenant adversarial matrix across every clinical/financial API, malware/file scanning, backup-restore proof automation, full incident/break-glass controls, external vendor/BAA/DPA evidence, enterprise SSO/security administration, formal penetration testing, SOC 2/HITRUST audit work, and PHI production authorization. Their absence keeps those claims blocked; it does not block the non-PHI public/member P01 renderer when W1 evidence is green.
