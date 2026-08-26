# Klinikos Operating Network Tranche A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved operating-network architecture authoritative in the repository, remove the now-superseded mandatory rose/flower design law, add machine-readable operating-network invariants, and close the first real distribution gap between Public Zumi, the expanded Path catalog, and protected destinations.

**Architecture:** Preserve the existing Path, Grid, Zumi, identity, Financial OS, and Living Home authorities. Tranche A adds no parallel engines. It strengthens repository truth first, then makes the public intent layer derive its protected continuation from existing deterministic intent and destination contracts while carrying only low-sensitivity structured continuation metadata through authentication.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.9, Vitest 3, existing Klinikos orchestration/Path/auth contracts, GitHub Actions Quality workflow.

**Spec:** `docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md`

## Global Constraints

- Canonical brand: `Klinikos. The clinic operations ecosystem, powered by Zumi.`
- Complexity belongs in Klinikos, not in the user's hands.
- Free participation is distribution infrastructure.
- Land without displacement. Expand by usefulness. Replace by earned trust.
- Founder omission does not equal engineering omission.
- No known failure may disappear silently.
- Do not create a second Grid, Zumi, identity authority, Financial OS, Clinic OS, entitlement system, route authority, or product-truth authority.
- `CLAIM != VERIFIED FACT != AUTHORITY`.
- `MATCH != OFFER != ACCEPTANCE != RESERVATION`.
- `BOOKING != FULFILLMENT`.
- `PAYMENT INTENT != PAYMENT`.
- `FINANCIAL OBLIGATION != SETTLEMENT`.
- `DEPLOYED != PRODUCTION VERIFIED`.
- Public continuation must not place raw healthcare/clinical/user-entered free text in the URL. Carry only bounded, low-sensitivity structured destination/source identifiers.
- Current repository implementation and executed verification determine what exists. Design documents never manufacture runtime status.

---

### Task 1: Lock the approved parent architecture and supersede stale visual law

**Files:**
- Modify: `tests/canonical-truth-drift.test.ts`
- Modify: `docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md`
- Modify: `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
- Modify: `docs/FRONTEND_EXPERIENCE_CANON.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: approved operating-network design and current architecture precedence.
- Produces: one discoverable parent architecture contract and one frontend visual law in which product clarity outranks decoration.

- [ ] **Step 1: Write the failing canonical-truth tests**

Add assertions to `tests/canonical-truth-drift.test.ts` that:

```ts
const operatingNetworkSpec = "docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md";
const index = read("docs/KLINIKOS_ARCHITECTURE_INDEX.md");
const frontend = read("docs/FRONTEND_EXPERIENCE_CANON.md");
const claude = read("CLAUDE.md");
const design = read(operatingNetworkSpec);

expect(design).toContain("IMPLEMENTATION AUTHORIZED");
expect(index).toContain(operatingNetworkSpec);
expect(claude).toContain(operatingNetworkSpec);
expect(frontend).toContain("The interface itself is the signature.");
expect(frontend).not.toContain("## Rose environmental contract");
expect(frontend).toContain("No decorative motif is permanent");
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/canonical-truth-drift.test.ts`

Expected: FAIL because the approved spec is still marked implementation-not-authorized, the architecture index/Claude bootstrap do not yet point at it, and the frontend canon still contains the Rose environmental contract.

- [ ] **Step 3: Make the minimal canonical updates**

Update the approved design status to `APPROVED ARCHITECTURAL DESIGN — IMPLEMENTATION AUTHORIZED 2026-08-26`.

In `docs/KLINIKOS_ARCHITECTURE_INDEX.md`, add the approved operating-network spec immediately after `SOURCE_OF_TRUTH.md` as the newest approved parent architecture for final-form convergence, while preserving runtime/code precedence for what exists.

Replace the `Rose environmental contract` section in `docs/FRONTEND_EXPERIENCE_CANON.md` with:

```md
## Brand atmosphere contract

Brand atmosphere is subordinate to product clarity.

**The interface itself is the signature.**

No decorative motif is permanent and no page requires a flower, rose, orb, network illustration, stock image, or other decorative object merely to look like Klinikos.

Existing rose assets remain reusable historical/optional brand material, not a product requirement. Use them only when they improve hierarchy or atmosphere without competing with the user's work.

Prefer order emerging from complexity through spacing, typography, hierarchy, restrained state-driven motion, and progressive disclosure.

`prefers-reduced-motion` must preserve meaning while disabling non-essential motion.
```

In `CLAUDE.md`, insert the approved operating-network spec into required reading and add the permanent operating-network laws so future implementation agents do not fall back to feature-first/EHR-first framing.

- [ ] **Step 4: Re-run the focused test and verify GREEN**

Run: `npm test -- tests/canonical-truth-drift.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/canonical-truth-drift.test.ts docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md docs/KLINIKOS_ARCHITECTURE_INDEX.md docs/FRONTEND_EXPERIENCE_CANON.md CLAUDE.md
git commit -m "docs: lock operating-network architecture"
```

---

### Task 2: Add a machine-readable operating-network contract

**Files:**
- Create: `src/lib/operating-network-canon.ts`
- Create: `tests/operating-network-canon.test.ts`

**Interfaces:**
- Produces: `KLINIKOS_OPERATING_NETWORK_CANON`, a readonly server/client-safe declarative contract for architecture tests and future tooling. It contains no secrets, PHI, ranking weights, security heuristics, or proprietary execution logic.

- [ ] **Step 1: Write the failing contract test**

Create `tests/operating-network-canon.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { KLINIKOS_OPERATING_NETWORK_CANON } from "@/lib/operating-network-canon";

describe("Klinikos operating-network canon", () => {
  it("locks the approved company and experience laws", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.brand).toBe("Klinikos. The clinic operations ecosystem, powered by Zumi.");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("free-participation-is-distribution-infrastructure");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("land-without-displacement");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("founder-omission-does-not-equal-engineering-omission");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.laws).toContain("no-known-failure-disappears-silently");
  });

  it("keeps the growth journey value-first and identity-later", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.userOrder.slice(0, 4)).toEqual([
      "discover",
      "receive-value",
      "express-intent",
      "create-identity-when-persistence-matters",
    ]);
    expect(KLINIKOS_OPERATING_NETWORK_CANON.userOrder.indexOf("enter-grid-or-relevant-network")).toBeLessThan(
      KLINIKOS_OPERATING_NETWORK_CANON.userOrder.indexOf("paid-implementation-subscription-or-contract"),
    );
  });

  it("keeps consequential truth states separate", () => {
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("claim!=verified-fact!=authority");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("booking!=fulfillment");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("payment-intent!=payment");
    expect(KLINIKOS_OPERATING_NETWORK_CANON.truthSeparations).toContain("deployed!=production-verified");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/operating-network-canon.test.ts`

Expected: FAIL because `@/lib/operating-network-canon` does not exist.

- [ ] **Step 3: Implement the declarative contract**

Create `src/lib/operating-network-canon.ts` with a frozen/readonly object containing:

- canonical brand string;
- permanent law identifiers;
- the twenty-step user-order identifiers from the approved design;
- global truth-separation identifiers;
- role surface promises (`provider: one-visit`, `staff: one-handoff`, `patient: one-next-action`, `owner: one-operating-picture`, etc.);
- backend kernel names only, not confidential implementation details.

Use `as const` and no runtime dependencies.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- tests/operating-network-canon.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/operating-network-canon.ts tests/operating-network-canon.test.ts
git commit -m "feat: encode operating-network canon"
```

---

### Task 3: Close Public Zumi coverage drift against the expanded deterministic Path catalog

**Files:**
- Modify: `tests/public-living-home.test.ts`
- Modify: `src/lib/orchestration/public-living-intent.ts`

**Interfaces:**
- Consumes: `resolveIntentDeterministically()` and existing public destination rules.
- Produces: every deterministic Path currently known to Public Zumi resolves to an intentional high-level public destination class instead of relying on accidental regex fallback.

- [ ] **Step 1: Add failing coverage cases**

Extend the first `it.each` in `tests/public-living-home.test.ts` with representative intents from Path definitions that are already in `intent-engine.ts` but absent from `pathDestinationKeys`, including:

```ts
["I need a clinical placement", "edu", "/edu"],
["I want to work independently", "clinic", "/dashboard"],
["I want to own a clinic", "clinic", "/dashboard"],
["We have an empty room three days a week", "grid", "/grid"],
["Our clinic is disorganized", "clinic", "/dashboard"],
["We are losing money", "revenue", "/crm"],
["We want students", "edu", "/edu"],
["I want to be a preceptor", "edu", "/edu"],
["I need better opportunities", "grid", "/grid"],
["I need a clinic appointment", "patient", "/portal"],
```

Also add an explicit drift test that extracts every `pathId` string from the deterministic `rules` in `intent-engine.ts` and asserts it appears in `pathDestinationKeys` in `public-living-intent.ts`. This is intentionally a source-level anti-drift guard because the mapping is private to the module.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/public-living-home.test.ts`

Expected: FAIL on the path-destination coverage guard and any representative route whose fallback does not match the intended destination.

- [ ] **Step 3: Extend only the existing mapping**

Update `pathDestinationKeys` in `src/lib/orchestration/public-living-intent.ts` so every deterministic `pathId` maps to the appropriate existing public destination key. Do not create a second router and do not move the intent taxonomy to the browser.

Mapping policy:

- work/opportunity/capacity paths → `grid`
- learning/placement/preceptor/institutional-learning paths → `edu`
- clinic creation/operations/expansion/service paths → `clinic`
- staffing path → `staffing`
- revenue path → `revenue`
- referral continuity path → `referrals`
- patient care-discovery path → `patient`

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- tests/public-living-home.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/public-living-home.test.ts src/lib/orchestration/public-living-intent.ts
git commit -m "fix: align public intent with path catalog"
```

---

### Task 4: Preserve safe structured intent through authentication without leaking raw prompts

**Files:**
- Create: `src/lib/distribution/public-continuation.ts`
- Create: `src/lib/distribution/public-continuation.test.ts`
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Modify: `tests/public-living-home.test.ts`

**Interfaces:**
- Produces: `protectedPublicContinuationHref(href: string, intentKey: string): string`.
- Consumes: existing same-origin `safeReturnTo` semantics at login.
- Security contract: never serializes the user's raw prompt; only a bounded public destination key and source marker are added to the same-origin return destination.

- [ ] **Step 1: Write the failing continuation tests**

Create `src/lib/distribution/public-continuation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { protectedPublicContinuationHref } from "@/lib/distribution/public-continuation";

describe("public intent continuation", () => {
  it("carries only bounded structured intent through canonical returnTo", () => {
    expect(protectedPublicContinuationHref("/dashboard", "clinic")).toBe(
      "/login?returnTo=%2Fdashboard%3Ffrom%3Dpublic-zumi%26intent%3Dclinic",
    );
  });

  it("preserves an existing destination query while adding source metadata", () => {
    const href = protectedPublicContinuationHref("/grid/workspace?tab=matches", "grid");
    expect(decodeURIComponent(href)).toContain("/grid/workspace?tab=matches&from=public-zumi&intent=grid");
  });

  it("rejects external destinations and unsafe intent keys", () => {
    expect(protectedPublicContinuationHref("https://evil.example", "grid")).toBe("/login");
    expect(protectedPublicContinuationHref("/dashboard", "patient record for Jane Doe")).toBe("/login?returnTo=%2Fdashboard%3Ffrom%3Dpublic-zumi");
  });
});
```

- [ ] **Step 2: Run the unit test and verify RED**

Run: `npm test -- src/lib/distribution/public-continuation.test.ts`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement the helper**

Implement with:

- same-origin path validation equivalent to `safeReturnTo`;
- max destination length 500;
- intent key allow-list matching Public Zumi destination keys that may require staff authentication;
- `from=public-zumi` source marker;
- `intent=<key>` only for approved bounded keys;
- canonical login parameter `returnTo` rather than legacy `next`;
- no raw prompt, title, body, patient name, free text, or arbitrary context in the URL.

- [ ] **Step 4: Integrate with Public Living Home**

Change `destinationActionHref` to accept a full `PublicLivingDestination` and call the helper for protected destinations while keeping patient `/portal` and public-safe routes on their existing public paths.

Expected shape:

```ts
function destinationActionHref(destination: PublicLivingDestination) {
  if (destination.href === "/portal") return "/portal/login";
  if (publicActionPaths.has(destination.href)) return destination.href;
  return protectedPublicContinuationHref(destination.href, destination.key);
}
```

Update call sites from `destinationActionHref(resolution.destination.href)` to `destinationActionHref(resolution.destination)`.

- [ ] **Step 5: Update the public-Living-Home contract assertions**

Assert:

- the browser imports the continuation helper, not `safeReturnTo`;
- protected navigation uses canonical `returnTo`;
- no `prompt` or raw conversation value is passed into the continuation helper;
- public and patient routes stay out of clinic-staff authentication.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
npm test -- src/lib/distribution/public-continuation.test.ts tests/public-living-home.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/distribution/public-continuation.ts src/lib/distribution/public-continuation.test.ts src/components/marketing/public-living-gateway.tsx tests/public-living-home.test.ts
git commit -m "feat: preserve safe public intent through sign-in"
```

---

### Task 5: Add an initial machine-readable product-truth registry without inventing production status

**Files:**
- Create: `governance/product-truth-registry.json`
- Create: `tests/product-truth-registry.test.ts`
- Modify: `docs/KLINIKOS_ARCHITECTURE_INDEX.md`

**Interfaces:**
- Produces: a conservative registry with schema version, audit SHA/date, capability key, domain owner, truth state, evidence paths, external dependency state, public claim policy, and authoritative source.
- Truth vocabulary: `PRODUCTION_VERIFIED | DEPLOYED_UNVERIFIED | MERGED_NOT_DEPLOYED | IMPLEMENTED_UNVERIFIED | IN_ACTIVE_DEVELOPMENT | APPROVED_DESIGN | PLANNED | BLOCKED | DEPRECATED`.

- [ ] **Step 1: Write the failing registry test**

The test must require:

- registry JSON parses;
- allowed truth vocabulary only;
- unique capability keys;
- every record has at least one evidence path and an authoritative source;
- no record with state below `PRODUCTION_VERIFIED` may use public claim policy `claim-live-unqualified`;
- initial records include `public.living-home`, `grid.core`, `zumi.public`, `care.current-visit`, `edu.core`, `financial.payment-evidence`, and `operating-network.architecture`.

- [ ] **Step 2: Run and verify RED**

Run: `npm test -- tests/product-truth-registry.test.ts`

Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Create the conservative initial registry**

Populate from current repository evidence only. Use `APPROVED_DESIGN` for the operating-network architecture, and use no stronger runtime state than can be supported by current `FEATURE_STATUS`, code, tests, and deployment evidence. Do not mark any external connector `PRODUCTION_VERIFIED` merely because an adapter exists.

- [ ] **Step 4: Add the registry to the architecture index**

Document that it is machine-readable capability claim state and does not outrank current code/runtime evidence.

- [ ] **Step 5: Run and verify GREEN**

Run: `npm test -- tests/product-truth-registry.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add governance/product-truth-registry.json tests/product-truth-registry.test.ts docs/KLINIKOS_ARCHITECTURE_INDEX.md
git commit -m "feat: add product truth registry"
```

---

### Task 6: Full Tranche A verification and stacked PR

**Files:** no new implementation files unless verification exposes a defect.

- [ ] **Step 1: Run code verification**

Run:

```bash
npm run type-check
npm run lint
npm test
npm run security:check
```

Expected: all commands exit 0.

- [ ] **Step 2: Run database/schema verification because repository merge law requires it even though this tranche has no migration**

Run:

```bash
npm run db:generate
npm run db:validate
```

Expected: both commands exit 0.

- [ ] **Step 3: Run release verification**

Run: `npm run verify:code`

Expected: exit 0.

- [ ] **Step 4: Review branch diff against the approved design**

Verify that:

- no runtime authority moved to the browser;
- no raw public prompt is persisted in a URL;
- no parallel routing/identity/Grid/Financial OS exists;
- current rose assets were not deleted merely because they are no longer mandatory;
- public continuation remains same-origin;
- public Grid/EDU/patient routes remain low-friction;
- protected clinic routes still authenticate;
- no feature is mislabeled production verified.

- [ ] **Step 5: Open a stacked implementation PR**

Base: `design/klinikos-final-form-universal-experience-20260826`

Head: `feat/operating-network-tranche-a-20260826`

Title: `feat: begin Klinikos operating-network convergence`

Keep the PR draft until exact-head CI verification is green.

- [ ] **Step 6: Inspect exact-head GitHub Actions**

Fetch workflow runs for the implementation head SHA. For every required job, inspect conclusion and failed-step logs when needed. Do not call the tranche complete unless fresh exact-head evidence is green.

---

## Self-review

### Spec coverage

This tranche implements the approved design's first dependency layer: canonical truth, visual supersession, machine-readable architecture law, public distribution intent coverage, safe auth continuation, and product claim truth. It intentionally does not implement organization conversion, Current Visit convergence, Grid fulfillment expansion, SRE runtime infrastructure, or enterprise controls; those remain separate testable tranches B-J.

### Placeholder scan

No `TBD`, `TODO`, `implement later`, or unnamed error-handling steps are permitted in this plan. Each code-bearing task names exact files, interfaces, tests, and verification commands.

### Type consistency

`protectedPublicContinuationHref(href: string, intentKey: string): string` is the only new behavior-level interface in this tranche. Public Living Home consumes it with the existing `PublicLivingDestination.key` and `href` values. The helper never receives raw prompt text.
