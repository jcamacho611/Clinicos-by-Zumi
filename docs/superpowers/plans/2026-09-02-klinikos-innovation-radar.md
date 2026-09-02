# Klinikos Innovation Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a governed, evidence-backed innovation intake/review system that keeps Klinikos current without letting agents or research results silently change Canon, pricing, security posture, or implementation claims.

**Architecture:** Persist focused `CompanyInnovationCandidate` records and source evidence, compare candidates against the existing Master Canon/canonical ecosystem graph/current implementation, score them as advisory inputs, and require founder/council decision evidence before any candidate becomes `APPROVED`. Company Command projects the queue; accepted changes still merge forward through the existing Canon/Blueprint protocol.

**Tech Stack:** TypeScript, Prisma/PostgreSQL, existing Company OS RBAC/audit patterns, canonical ecosystem graph, Next.js server components/API patterns, Vitest/Jest repository tests.

**Spec:** `docs/superpowers/specs/2026-09-02-klinikos-innovation-radar-design.md`

## Global Constraints

- Innovation Radar is subordinate to `docs/KLINIKOS_MASTER_CANON.md`.
- Research/connectors provide evidence, never product authority.
- `APPROVED` does not mean implemented; `LIVE_VERIFIED` requires implementation/runtime evidence.
- Radar may prepare Canon deltas but may not autonomously edit/merge the Canon.
- Preserve crown-jewel server boundaries during external research.
- Do not force internal product ideas into `CompanyExternalOpportunity`; use a focused innovation model because they are different domain facts.
- Reuse existing Organization/User relations, evidence conventions, Command projection patterns, and audit/idempotency patterns.

---

### Task 1: Canon synchronization for Innovation Radar

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`
- Modify: `docs/KLINIKOS_AUTHORITY_MAP.yaml`
- Modify: `tests/canon-synchronization.test.ts`

**Interfaces:**
- Produces canonical `INNOVATION RADAR` law and explicit no-auto-promotion rule

- [ ] **Step 1: Write RED Canon test**

```ts
it("locks the governed Innovation Radar protocol", () => {
  const master = read(masterPath);
  const required = [
    "KLINIKOS INNOVATION RADAR",
    "DISCOVER → VERIFY → COMPARE → SCORE",
    "APPROVED ≠ IMPLEMENTED",
    "RADAR MAY NOT AUTONOMOUSLY PROMOTE A DISCOVERY INTO CANON",
  ];
  expect(required.filter((anchor) => !master.includes(anchor))).toEqual([]);
});
```

- [ ] **Step 2: Run focused test and witness RED**

```bash
npx vitest run tests/canon-synchronization.test.ts
```

- [ ] **Step 3: Add concise Canon subsection**

Use the literal anchors above and point to the approved subordinate design spec.

- [ ] **Step 4: Extend authority-map implementation scope**

Add:

```yaml
    - company_innovation_radar
    - innovation_evidence_scoring_and_decision
```

- [ ] **Step 5: Re-run focused test**

- [ ] **Step 6: Commit**

```bash
git add docs/KLINIKOS_MASTER_CANON.md docs/KLINIKOS_AUTHORITY_MAP.yaml tests/canon-synchronization.test.ts
git commit -m "docs(canon): lock Innovation Radar protocol"
```

---

### Task 2: Persist focused innovation candidates and evidence

**Files:**
- Create: `prisma/models/company-innovation.prisma`
- Modify: `prisma/schema.prisma` only for existing Organization/User back-relations if the repository generator requires them
- Create migration using the repository's current migration naming timestamp
- Create matching `production-release.json` if current migration policy requires it
- Create: `tests/company-innovation-schema.test.ts`

**Interfaces:**
- Produces `CompanyInnovationCandidate` and `CompanyInnovationEvidence`

- [ ] **Step 1: Write RED schema test**

```ts
it("stores innovation lifecycle separately from implementation truth", () => {
  expect(schema).toContain("model CompanyInnovationCandidate {");
  for (const field of [
    "domain",
    "candidateState",
    "relationshipState",
    "expectedUpside",
    "executionBurden",
    "decisionState",
    "decisionRationale",
    "approvedAt",
    "implementedAt",
    "liveVerifiedAt",
  ]) {
    expect(schema).toContain(field);
  }
});
```

Also assert evidence stores source reference, observed/review timestamps, fingerprint, and supersession.

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Add focused models**

Minimum model shape:

```prisma
model CompanyInnovationCandidate {
  id                    String   @id @default(cuid())
  organizationId        String
  title                 String
  domain                String
  candidateState        String   @default("DISCOVERED")
  relationshipState     String   @default("NEW_COMPATIBLE")
  expectedUpside        String?
  executionBurden       String?
  summary               String
  affectedCanonSections Json?
  affectedNodeIds       Json?
  decisionState         String?
  decisionRationale     String?
  decidedByActorId      String?
  decidedAt             DateTime?
  approvedAt            DateTime?
  implementedAt         DateTime?
  liveVerifiedAt        DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  evidence              CompanyInnovationEvidence[]
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Restrict)
}

model CompanyInnovationEvidence {
  id                    String   @id @default(cuid())
  organizationId        String
  candidateId           String
  sourceSystem          String
  sourceType            String
  sourceReference       String
  sourceFingerprintSha256 String
  observedAt            DateTime
  reviewAfter           DateTime?
  expiresAt             DateTime?
  supersedesEvidenceId  String?
  claimText             String
  createdAt             DateTime @default(now())
  candidate             CompanyInnovationCandidate @relation(fields: [candidateId], references: [id], onDelete: Restrict)
}
```

Follow current repository relation/index naming patterns and tenant isolation conventions; do not use the snippet as permission to omit required composite organization scoping if current models require it.

- [ ] **Step 4: Generate/validate Prisma and run migration safety tests**

Use the exact current repo commands from `package.json`/CI.

- [ ] **Step 5: Commit**

```bash
git add prisma tests/company-innovation-schema.test.ts
git commit -m "feat(company): persist innovation candidates"
```

---

### Task 3: Define candidate contracts, evidence intake, and scoring

**Files:**
- Create: `src/lib/company/innovation-types.ts`
- Create: `src/lib/company/innovation-scoring.ts`
- Create: `src/lib/company/innovation-evidence.ts`
- Create: `tests/innovation-scoring.test.ts`

**Interfaces:**
- Produces `InnovationCandidateState`, `InnovationDomain`, `InnovationScorecard`, `scoreInnovationCandidate()`

- [ ] **Step 1: Write RED scoring tests**

```ts
it("keeps upside and burden separate", () => {
  const result = scoreInnovationCandidate({
    customerValue: 5,
    revenuePotential: 4,
    defensibility: 5,
    networkLeverage: 4,
    strategicFit: 5,
    timeToValue: 4,
    implementationCost: 2,
    operatingCost: 2,
    technicalComplexity: 2,
    securityRisk: 1,
    regulatoryRisk: 1,
    externalDependencyRisk: 2,
    reversibility: 4,
  });
  expect(result.expectedUpside).toBe("TRANSFORMATIVE");
  expect(result.executionBurden).toBe("LOW");
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement bounded 0-5 validation and deterministic summary classification**

No AI score may exceed the input bounds or become an approval decision.

- [ ] **Step 4: Add evidence normalization**

Normalize source reference/fingerprint/observed timestamps using the same cryptographic fingerprint pattern already used by CompanyOpportunity evidence where practical.

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/innovation-types.ts src/lib/company/innovation-scoring.ts src/lib/company/innovation-evidence.ts tests/innovation-scoring.test.ts
git commit -m "feat(company): add innovation evidence and scoring"
```

---

### Task 4: Compare candidates against current Canon and implementation

**Files:**
- Create: `src/lib/company/innovation-comparison.ts`
- Create: `tests/innovation-comparison.test.ts`
- Consume: `src/lib/ecosystem/canonical-ecosystem-graph.ts`
- Consume current Canon-layer registry/authority metadata; do not build a second Canon parser at request time

**Interfaces:**
- Produces `compareInnovationCandidate(input): InnovationRelationshipState`

- [ ] **Step 1: Write RED tests**

```ts
it("recognizes an already canonical capability instead of calling it new", () => {
  const result = compareInnovationCandidate({
    affectedNodeIds: ["infra.grid"],
    proposedCapability: "Grid exchange substrate",
    currentNodeStates: [{ id: "infra.grid", strategyState: "NOW", implementationState: "BUILT_NEEDS_VERIFICATION" }],
  });
  expect(result).toBe("ALREADY_CANONICAL");
});
```

Add tests for `PARTIALLY_IMPLEMENTED`, `NEW_REQUIRES_CANON_CHANGE`, and `CONFLICTS_WITH_CANON`.

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement comparison using references to canonical nodes/current implementation metadata**

The function may return `NEW_REQUIRES_CANON_CHANGE`; it may not edit Canon.

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git add src/lib/company/innovation-comparison.ts tests/innovation-comparison.test.ts
git commit -m "feat(company): compare innovation against current truth"
```

---

### Task 5: Add founder/council decision workflow and Canon-delta preparation

**Files:**
- Create: `src/lib/company/innovation-decision.ts`
- Create: `src/lib/company/innovation-canon-delta.ts`
- Create: `tests/innovation-decision.test.ts`

**Interfaces:**
- Produces `decideInnovationCandidate()` and `prepareInnovationCanonDelta()`
- `prepareInnovationCanonDelta()` returns text/proposed consequences only; it never writes files or merges code

- [ ] **Step 1: Write RED decision tests**

```ts
it("does not allow APPROVED without authorized decision evidence", () => {
  expect(() =>
    decideInnovationCandidate({
      currentState: "VERIFIED",
      decision: "APPROVE",
      decidedByActorId: "",
      rationale: "use it",
      decidedAt: now,
    }),
  ).toThrow(/authorized decision actor/i);
});
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement state transition law**

Allowed decision outputs:

- `APPROVE` → `APPROVED`
- `WATCH` → `WATCH`
- `REJECT` → `REJECTED`
- `MODIFY` → `PROPOSED` with amended scope

Require non-empty actor identity, timestamp, and rationale.

- [ ] **Step 4: Implement Canon-delta preparation**

Return:

```ts
{
  affectedCanonSections,
  proposedLaw,
  blueprintConsequences,
  implementationConsequences,
  commercialConsequences,
  securityLegalConditions,
}
```

This is a proposal artifact only.

- [ ] **Step 5: Run tests**

- [ ] **Step 6: Commit**

```bash
git add src/lib/company/innovation-decision.ts src/lib/company/innovation-canon-delta.ts tests/innovation-decision.test.ts
git commit -m "feat(company): govern innovation decisions"
```

---

### Task 6: Project Innovation Radar into existing Company Command

**Files:**
- Create: `src/lib/company/innovation-command-projection.ts`
- Modify the existing Company Command route/component discovered on current `main`
- Create focused projection/UI tests using current Command conventions

**Interfaces:**
- Produces read-only queue sections:
  - needs verification
  - high-upside verified
  - approved/unimplemented
  - implementing
  - measured
  - stale/review-needed

- [ ] **Step 1: Write RED projection test**

```ts
expect(projectInnovationRadar(candidates)).toEqual(
  expect.objectContaining({
    needsVerification: expect.any(Array),
    approvedUnimplemented: expect.any(Array),
    measured: expect.any(Array),
  }),
);
```

- [ ] **Step 2: Witness RED**

- [ ] **Step 3: Implement server projection**

Expose source title/date, score summary, relationship state, decision state, and safe next action. Do not serialize proprietary analysis prompts or restricted evidence text.

- [ ] **Step 4: Add compact Command UI**

Actions may prepare review/decision forms, but approval still requires authorized actor action.

- [ ] **Step 5: Run focused Command/UI tests**

- [ ] **Step 6: Commit**

Stage only exact changed files printed by `git status --short`.

---

### Task 7: Red-team innovation truth separation and run full verification

**Files:**
- Create: `tests/innovation-radar-red-team.test.ts`

- [ ] **Step 1: Encode permanent truth-separation cases**

```ts
[
  ["unsupported social claim", "VERIFICATION_REQUIRED"],
  ["already canonical idea", "ALREADY_CANONICAL"],
  ["approved but not built", "APPROVED"],
  ["built but not runtime verified", "IMPLEMENTED_NEEDS_VERIFICATION"],
  ["live verified after evidence", "LIVE_VERIFIED"],
] as const;
```

Also prove an AI-generated recommendation cannot directly set `APPROVED` without decision actor/rationale evidence.

- [ ] **Step 2: Run focused suites**

- [ ] **Step 3: Run full current CI commands**

At minimum:

```bash
git diff --check
npm run typecheck
npm run lint
npm test
npm run build
```

plus current confidentiality/security and database-backed journey gates.

- [ ] **Step 4: Verify exact-head CI**

- [ ] **Step 5: Commit final red-team suite**

```bash
git add tests/innovation-radar-red-team.test.ts
git commit -m "test(company): red-team Innovation Radar"
```

---

## Self-Review Checklist

### Spec coverage

- Evidence-backed discovery: Tasks 2-3.
- Current-Canon/current-implementation comparison: Task 4.
- Advisory scoring: Task 3.
- Human/founder authority: Task 5.
- No auto-Canon promotion: Tasks 1 and 5.
- Approved ≠ implemented: Tasks 1, 5, 7.
- Company Command visibility: Task 6.
- Measured post-adoption state: Tasks 2, 6, 7.
- Security/trade-secret boundary: Global constraints + Task 6.

### Placeholder scan

No `TBD`, `TODO`, or generic “implement later” steps remain.

### Type consistency

Candidate states and relationship states match the design spec; `APPROVED`, `IMPLEMENTED_NEEDS_VERIFICATION`, and `LIVE_VERIFIED` remain separate lifecycle states throughout the plan.
