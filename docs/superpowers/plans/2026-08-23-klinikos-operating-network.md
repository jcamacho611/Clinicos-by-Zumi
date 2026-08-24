# Klinikos Operating Network Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge Klinikos into one configurable healthcare operating network whose Care, Grid, Network, EDU, Intelligence, Patient, and Enterprise commercial doors share product truth, identity, evidence, and policy while preserving domain boundaries.

**Architecture:** Introduce a canonical product/configuration registry and shared commercial narrative first, then make Workforce/Kentucky a configuration of existing EDU and relationship infrastructure rather than a fork. Subsequent tasks bridge EDU to Grid and Enterprise only through explicit, governed interfaces so network effects compound without widening authorization or overstating readiness.

**Tech Stack:** Next.js, TypeScript, Prisma/PostgreSQL, existing Klinikos design system, existing Living Home routing, existing commercial registry, existing EDU/Grid/Network/identity domains.

**Spec:** `docs/superpowers/specs/2026-08-23-klinikos-operating-network-design.md`

## Global Constraints

- One core platform, many governed configurations.
- No Kentucky-specific product fork.
- Existing implementation truth in `docs/FEATURE_STATUS.md` remains authoritative.
- Never convert roadmap, adapter-ready, or pending-connection state into BUILT claims.
- Deterministic systems retain authorization, payment, eligibility, clinical release, completion authority, and sensitive-data egress control.
- Zumi may interpret and prepare but may not widen authority.
- Manual-but-truthful is acceptable; fake automation is prohibited.
- Public experience remains conversation-first and progressively discloses deeper product surfaces.
- Preserve separate patient authorization/session boundaries.

---

### Task 1: Canonical Product Configuration Registry

**Files:**
- Create: `src/lib/product/klinikos-configurations.ts`
- Create: `src/lib/product/klinikos-configurations.test.ts`
- Modify: `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md`

**Interfaces:**
- Produces: `KlinikosConfigurationId`, `KlinikosConfiguration`, `KLINIKOS_CONFIGURATIONS`, `getKlinikosConfiguration(id)`.
- Consumes: existing public routes and commercial product language; no database access.

- [ ] **Step 1: Write the failing registry tests**

```ts
import { describe, expect, it } from "vitest";
import {
  KLINIKOS_CONFIGURATIONS,
  getKlinikosConfiguration,
} from "./klinikos-configurations";

describe("Klinikos configuration registry", () => {
  it("defines every canonical commercial door", () => {
    expect(Object.keys(KLINIKOS_CONFIGURATIONS).sort()).toEqual([
      "care",
      "edu",
      "enterprise",
      "grid",
      "intelligence",
      "network",
      "patient",
    ]);
  });

  it("keeps workforce as an EDU configuration rather than a separate product", () => {
    const edu = getKlinikosConfiguration("edu");
    expect(edu.configurations).toContain("workforce");
    expect(Object.keys(KLINIKOS_CONFIGURATIONS)).not.toContain("workforce");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/lib/product/klinikos-configurations.test.ts`

Expected: FAIL because the configuration module does not exist.

- [ ] **Step 3: Implement the canonical registry**

```ts
export type KlinikosConfigurationId =
  | "care"
  | "grid"
  | "network"
  | "edu"
  | "intelligence"
  | "patient"
  | "enterprise";

export type KlinikosConfiguration = {
  id: KlinikosConfigurationId;
  label: string;
  promise: string;
  entryPath: string;
  configurations: readonly string[];
};

export const KLINIKOS_CONFIGURATIONS: Record<
  KlinikosConfigurationId,
  KlinikosConfiguration
> = {
  care: {
    id: "care",
    label: "Klinikos Care",
    promise: "Run your organization.",
    entryPath: "/start",
    configurations: ["clinic", "multi-site"],
  },
  grid: {
    id: "grid",
    label: "Klinikos Grid",
    promise: "Find what you need.",
    entryPath: "/grid",
    configurations: ["exchange", "capacity"],
  },
  network: {
    id: "network",
    label: "Klinikos Network",
    promise: "Coordinate your network.",
    entryPath: "/network",
    configurations: ["referral", "partner"],
  },
  edu: {
    id: "edu",
    label: "Klinikos EDU",
    promise: "Train your workforce.",
    entryPath: "/edu",
    configurations: ["academy", "workforce", "institutional"],
  },
  intelligence: {
    id: "intelligence",
    label: "Klinikos Intelligence",
    promise: "Connect the work with governed intelligence.",
    entryPath: "/",
    configurations: ["zumi"],
  },
  patient: {
    id: "patient",
    label: "Klinikos Patient",
    promise: "Serve your patients.",
    entryPath: "/portal/login",
    configurations: ["portal"],
  },
  enterprise: {
    id: "enterprise",
    label: "Klinikos Enterprise",
    promise: "Operate across organizations.",
    entryPath: "/start",
    configurations: ["institutional", "network", "workforce"],
  },
};

export function getKlinikosConfiguration(id: KlinikosConfigurationId) {
  return KLINIKOS_CONFIGURATIONS[id];
}
```

- [ ] **Step 4: Update the authoritative product map**

Add a `Canonical commercial doors` section that references the registry and explicitly states that these labels are configuration/packaging constructs over one platform, not separate authorization domains.

- [ ] **Step 5: Run focused tests, type-check, and lint**

Run:

```bash
npm test -- src/lib/product/klinikos-configurations.test.ts
npm run type-check
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/product/klinikos-configurations.ts src/lib/product/klinikos-configurations.test.ts docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md
git commit -m "feat(product): add canonical Klinikos configuration registry"
```

---

### Task 2: Public Ecosystem Narrative Without Module-Wall Regression

**Files:**
- Modify: existing Living Home public copy/configuration source discovered by code search.
- Create or modify: focused Living Home copy/routing test adjacent to the existing public intent tests.

**Interfaces:**
- Consumes: `KLINIKOS_CONFIGURATIONS`.
- Produces: a truthful ecosystem explanation that can be surfaced when users ask what Klinikos does without replacing the conversation-first home with a catalog.

- [ ] **Step 1: Locate the existing public intent/copy source**

Run:

```bash
git grep -n "Run your organization\|Find what you need\|Klinikos EDU\|Living Home" -- src
```

Use the existing routing/copy module rather than creating a competing homepage content system.

- [ ] **Step 2: Write a failing test for ecosystem explanation**

Add a test asserting that an intent equivalent to `what does Klinikos do` returns a concise response containing all of these concepts exactly once: organization operations, Grid/resource discovery, workforce training, network coordination, patient service, and Klinikos Intelligence.

- [ ] **Step 3: Verify failure**

Run the exact focused public Living Home test file.

Expected: FAIL because the current explanation is narrower or lacks the canonical ecosystem wording.

- [ ] **Step 4: Implement minimal ecosystem explanation**

Use the canonical message:

`Klinikos is the operating ecosystem for healthcare: run your organization, find what you need through Grid, train your workforce through EDU, coordinate your network, serve patients, and let Klinikos Intelligence connect the work.`

Do not render seven permanent cards on the homepage. Preserve the dominant composer and progressive routing.

- [ ] **Step 5: Verify**

Run the focused test, then `npm run type-check`, `npm run lint`, and the existing Living Home/public-intent test suite.

- [ ] **Step 6: Commit**

```bash
git add <resolved-public-files>
git commit -m "feat(site): explain Klinikos as one healthcare operating ecosystem"
```

---

### Task 3: Workforce Configuration Contract

**Files:**
- Create: `src/lib/edu/workforce/workforce-configuration.ts`
- Create: `src/lib/edu/workforce/workforce-configuration.test.ts`
- Modify: existing EDU route/operator configuration source discovered by code search.
- Modify: `docs/FEATURE_STATUS.md` only after verified implementation exists.

**Interfaces:**
- Produces: `WorkforceConfiguration`, `SCWDB_WORKFORCE_CONFIGURATION`.
- Consumes: canonical EDU identity and current EDU session/attendance/assessment/reporting capabilities.

- [ ] **Step 1: Write a failing configuration-contract test**

```ts
import { describe, expect, it } from "vitest";
import { SCWDB_WORKFORCE_CONFIGURATION } from "./workforce-configuration";

describe("SCWDB workforce configuration", () => {
  it("uses EDU rather than a forked product identity", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.product).toBe("edu");
    expect(SCWDB_WORKFORCE_CONFIGURATION.configuration).toBe("workforce");
  });

  it("keeps consequential completion authority human", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.completion).toBe("human");
    expect(SCWDB_WORKFORCE_CONFIGURATION.authority.aiMayApproveCompletion).toBe(false);
  });

  it("supports the required training portfolio", () => {
    expect(SCWDB_WORKFORCE_CONFIGURATION.pathways).toEqual([
      "career-readiness",
      "healthcare",
      "manufacturing",
      "construction",
      "transportation-logistics",
      "professional-services",
    ]);
  });
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- src/lib/edu/workforce/workforce-configuration.test.ts`

- [ ] **Step 3: Implement the typed configuration**

```ts
export type WorkforcePathway =
  | "career-readiness"
  | "healthcare"
  | "manufacturing"
  | "construction"
  | "transportation-logistics"
  | "professional-services";

export type WorkforceConfiguration = {
  product: "edu";
  configuration: "workforce";
  customer: string;
  pathways: readonly WorkforcePathway[];
  deliveryModes: readonly ("live-remote" | "in-person")[];
  authority: {
    completion: "human";
    aiMayApproveCompletion: false;
  };
};

export const SCWDB_WORKFORCE_CONFIGURATION: WorkforceConfiguration = {
  product: "edu",
  configuration: "workforce",
  customer: "South Central Workforce Development Board",
  pathways: [
    "career-readiness",
    "healthcare",
    "manufacturing",
    "construction",
    "transportation-logistics",
    "professional-services",
  ],
  deliveryModes: ["live-remote", "in-person"],
  authority: {
    completion: "human",
    aiMayApproveCompletion: false,
  },
};
```

- [ ] **Step 4: Wire the configuration into the existing EDU operator/demo entry**

Expose the configuration only through existing EDU routing/components. Do not create `/kentucky-*` product forks unless a procurement-specific public demo path is explicitly required; even then it must consume this configuration object.

- [ ] **Step 5: Verify**

Run the focused test, EDU tests, type-check, lint, and production build.

- [ ] **Step 6: Update FEATURE_STATUS truthfully**

Only mark the workforce configuration BUILT if the route consumes the typed configuration and works in verified tests. Keep institutional SSO, external legal review, and any unconnected integrations in their existing status.

- [ ] **Step 7: Commit**

```bash
git add src/lib/edu/workforce docs/FEATURE_STATUS.md <resolved-edu-files>
git commit -m "feat(edu): make workforce delivery a governed EDU configuration"
```

---

### Task 4: Workforce Evidence Chain Contract

**Files:**
- Create: `src/lib/edu/workforce/workforce-evidence.ts`
- Create: `src/lib/edu/workforce/workforce-evidence.test.ts`
- Modify: existing completion/reporting service only where needed after inspection.

**Interfaces:**
- Produces: `WorkforceEvidenceStage`, `getWorkforceEvidenceStatus(input)`.
- Consumes: persisted enrollment/session/attendance/submission/assessment/completion/certificate state already present in EDU.

- [ ] **Step 1: Write failing tests for ordered evidence**

Tests must prove that certificate eligibility cannot be true when attendance, required assessment, or explicit human completion approval is absent.

- [ ] **Step 2: Run and verify failure**

Run the focused test.

- [ ] **Step 3: Implement a pure evidence-status projection**

The projection must return stages in this order:

`enrollment → session → attendance → applied-evidence → knowledge → instructor-review → completion-approval → credential → reporting`

It must not write completion state and must never infer human approval from an AI score.

- [ ] **Step 4: Integrate projection into existing instructor/admin reporting UI**

Reuse persisted truth. No duplicate database state solely for UI progress.

- [ ] **Step 5: Verify**

Run focused tests plus existing EDU DB-backed tests, type-check, lint, and build.

- [ ] **Step 6: Commit**

```bash
git add src/lib/edu/workforce <resolved-edu-reporting-files>
git commit -m "feat(edu): expose deterministic workforce evidence chain"
```

---

### Task 5: EDU → Grid Governed Bridge Design Contract

**Files:**
- Create: `src/lib/edu/grid/edu-grid-bridge.ts`
- Create: `src/lib/edu/grid/edu-grid-bridge.test.ts`

**Interfaces:**
- Produces: `buildEduGridDiscoveryContext()`.
- Consumes: released/non-sensitive learner achievement summary and explicit user opt-in.
- Does not create Grid eligibility, employment qualification, credential verification, or automatic applications.

- [ ] **Step 1: Write failing privacy/authority tests**

Tests must prove:
- no context is produced without explicit opt-in;
- unreleased grade/instructor-private fields are never included;
- a completion certificate is represented as training evidence, not licensure or employment eligibility.

- [ ] **Step 2: Verify failure**

Run focused test.

- [ ] **Step 3: Implement minimal read-only discovery context**

Return only pathway, released competencies, completion date, and user-selected opportunity intents. Do not create an application or match automatically.

- [ ] **Step 4: Verify**

Run focused tests, relevant Grid/EDU tests, type-check, lint.

- [ ] **Step 5: Commit**

```bash
git add src/lib/edu/grid
git commit -m "feat(network): add governed EDU to Grid discovery bridge"
```

---

### Task 6: Enterprise Expansion and Revenue Map

**Files:**
- Modify: `src/lib/commercial/klinikos-commercial.ts`
- Modify or create adjacent commercial tests.
- Create: `docs/KLINIKOS_REVENUE_ENGINE_MAP.md`

**Interfaces:**
- Consumes: existing server-owned commercial anchors.
- Produces: truthful expansion relationships between current offers and future configurable revenue engines; does not expose unapproved prices as active checkout offers.

- [ ] **Step 1: Write failing tests preserving current server-owned offers**

Tests must lock existing public prices and prove that descriptive future revenue engines cannot be used as trusted checkout products until explicitly promoted into the server-owned offer registry.

- [ ] **Step 2: Verify failure**

Run focused commercial tests.

- [ ] **Step 3: Add a separate non-checkout revenue-engine descriptor**

Represent Clinic SaaS, implementation, intelligence usage, Grid transaction revenue, EDU contracts, Enterprise/Network, analytics, readiness services, and integrations as planning descriptors with `checkoutEnabled: false` unless already backed by an active product.

- [ ] **Step 4: Document the expansion model**

Document land-and-expand examples:

`Operating Analysis → Implementation → Core/Growth/Scale → Intelligence → Grid → EDU → Network/Enterprise`.

- [ ] **Step 5: Verify payment-truth regression**

Run commercial/payment tests and DB-backed paid activation journey.

- [ ] **Step 6: Commit**

```bash
git add src/lib/commercial docs/KLINIKOS_REVENUE_ENGINE_MAP.md
git commit -m "feat(commercial): model Klinikos multi-engine expansion safely"
```

---

### Task 7: Repository Truth and Architecture Index Convergence

**Files:**
- Modify: `README.md`
- Modify: `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
- Modify: `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md`
- Modify: `docs/FEATURE_STATUS.md`

**Interfaces:**
- Consumes: verified outputs of Tasks 1-6.
- Produces: canonical repository explanation of the operating-network architecture and exact implementation status.

- [ ] **Step 1: Update README product model**

Explain the seven commercial doors and shared substrates in concise language. Preserve all existing safety/truth caveats.

- [ ] **Step 2: Update architecture index**

Add links to the operating-network spec, configuration registry, Workforce configuration, evidence chain, EDU→Grid bridge, and revenue-engine map.

- [ ] **Step 3: Reconcile FEATURE_STATUS**

For every changed capability, use only existing status vocabulary and cite exact verification evidence in notes. Anything not implemented remains PARTIAL, ADAPTER READY, PENDING CONNECTION, BLOCKED, or NOT BUILT as appropriate.

- [ ] **Step 4: Run documentation/truth guards**

Run any repository source-of-truth, feature-status, brand, and confidentiality guards discovered in `package.json`/scripts.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/KLINIKOS_ARCHITECTURE_INDEX.md docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md docs/FEATURE_STATUS.md
git commit -m "docs: converge Klinikos around operating network architecture"
```

---

### Task 8: Full Verification and Release Gate

**Files:**
- No new product files unless verification discovers a defect.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: release evidence only; no green claim without command output.

- [ ] **Step 1: Run database validation/generation**

```bash
npm run db:validate
npm run db:generate
```

Expected: PASS.

- [ ] **Step 2: Run strict type and lint gates**

```bash
npm run type-check
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run full automated tests**

```bash
npm test
```

Expected: PASS with zero failures.

- [ ] **Step 4: Run DB-backed MVP journeys**

```bash
npm run test:mvp
```

Expected: every journey passes on disposable PostgreSQL.

- [ ] **Step 5: Run production build and startup/release contract**

Use the repository's canonical Render-equivalent release gate from `package.json`/docs, including production build/start smoke and confidentiality checks.

- [ ] **Step 6: Run browser verification**

Verify at minimum:
- public Living Home remains conversation-first;
- `what does Klinikos do` returns the ecosystem explanation;
- `/edu` remains first-class;
- Workforce configuration can be reached through the intended EDU path;
- Grid remains truthful and functional;
- patient login remains separate;
- no new horizontal overflow or dead CTA is introduced.

- [ ] **Step 7: Record exact verified commit and unresolved external blockers**

Do not claim newest production deployment, external integrations, PHI-capable model use, marketplace payouts, institutional SSO, or legal approvals unless separately verified.

- [ ] **Step 8: Commit verification-only fixes if necessary**

Use narrowly scoped fix commits with exact failing test or release-gate evidence.
