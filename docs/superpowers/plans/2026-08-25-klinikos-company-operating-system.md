# Klinikos Company Operating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the approved Klinikos company master directive into an enforceable repository-native operating system that every implementation agent must load and that can be validated through machine-readable control registries and tests.

**Architecture:** Keep narrative company strategy in `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md`, add a machine-readable operating registry in `src/lib/company-operating-canon.ts`, test the registry with Vitest, and make the Company Operating System mandatory in `CLAUDE.md`. The registry does not create business truth; it defines required company functions, cadences, metrics, control tracks, and execution gates so agents cannot silently omit the corporate side while implementing product work.

**Tech Stack:** Next.js 15, TypeScript 5.9, Vitest 3, repository Markdown governance canon.

**Spec:** `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` and the approved KLINIKOS Supreme Company Master Prompt supplied 2026-08-25.

## Global Constraints

- Preserve CURRENT FACT / PROPOSED / EXECUTED distinctions.
- Do not fabricate customers, revenue, integrations, certifications, contracts, funding, ownership, savings, ROI, or clinical authority.
- Do not create parallel product/domain authorities.
- Company operating controls may guide implementation but do not themselves prove execution.
- The complexity belongs to Klinikos, not to the person using Klinikos.
- Broadly discoverable outside. Deeply orchestrated inside.
- Zumi may automate only within explicit authority and policy.
- Maintain one dependency-ordered company value loop: `DISCOVER → SELL → CONTRACT → COLLECT → IMPLEMENT → ACTIVATE → FIRST VALUE → REPEATED VALUE → RETAIN → EXPAND → GRID / NETWORK → COMPOUND`.

---

### Task 1: Make the Company Operating System mandatory for implementation agents

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md`
- Produces: mandatory read-order and company-operating-law instructions for all future agents.

- [ ] **Step 1: Update the required reading order**

Insert `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` immediately after the final-form business plan so product/business architecture are loaded together.

- [ ] **Step 2: Add company-operating law**

Add a section requiring every material implementation cycle to evaluate customer value, commercial path, implementation/adoption, capital efficiency, security/reliability, and network compounding where relevant.

- [ ] **Step 3: Verify the file remains internally consistent**

Check that the new law does not conflict with the existing P0 stay-on-course law, truth classes, or Zumi authority boundaries.

- [ ] **Step 4: Commit**

Commit message: `governance: require company operating system for agents`

### Task 2: Add machine-readable company operating canon

**Files:**
- Create: `src/lib/company-operating-canon.ts`
- Test: `tests/company-operating-canon.test.ts`

**Interfaces:**
- Produces: `companyFunctionRegistry`, `companyCadenceRegistry`, `companyMetricRegistry`, `capitalTrackRegistry`, `companyValueLoop`.

- [ ] **Step 1: Write failing registry tests**

Tests must assert:

- required company functions exist: executive, product, engineering, clinical, revenue-cycle/payer, security/privacy/trust, growth, sales, implementation/customer-success, finance/treasury, legal/governance, partnerships/corp-dev, Grid, EDU, enterprise/procurement, data/analytics, public-sector;
- every company function has a unique id, owner question, outcomes, and at least one metric;
- daily, weekly, monthly, quarterly cadences exist;
- capital tracks distinguish customer capital, non-dilutive, venture equity, debt, and strategic capital;
- the value loop preserves discover through compound ordering;
- company metrics include cash received, MRR, ARR, gross margin, qualified pipeline, activation, time-to-first-value, retention, expansion, Grid fulfillment, security incidents, uptime, and runway.

- [ ] **Step 2: Run focused test and confirm failure**

Run: `npm test -- tests/company-operating-canon.test.ts`

Expected: FAIL because `@/lib/company-operating-canon` does not yet exist.

- [ ] **Step 3: Implement the smallest complete canon**

Create typed immutable registries. Include explicit descriptions that distinguish governance targets from verified operating facts.

- [ ] **Step 4: Run focused test**

Run: `npm test -- tests/company-operating-canon.test.ts`

Expected: PASS.

- [ ] **Step 5: Run type-check**

Run: `npm run type-check`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `governance: add machine-readable company operating canon`

### Task 3: Add company control-register governance

**Files:**
- Create: `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md`

**Interfaces:**
- Consumes: company operating canon and company operating system.
- Produces: canonical required registers for executive operation.

- [ ] **Step 1: Define required registers**

Define exact fields and operating purpose for:

- Customer/Prospect Register
- Offer/Pricing Register
- Contract Register
- Vendor/Subprocessor Register
- Capital Opportunity Register
- Lender Readiness Register
- Investor Evidence Register
- Company Risk Register
- Decision Register
- Hiring/Bottleneck Register
- Partnership Register
- Build/Buy/Partner/Acquire Register
- Customer Value Evidence Register
- Grid Liquidity Register
- EDU Institutional Pipeline
- Security/Assurance Evidence Register
- Integration Truth Register
- Corporate Governance Evidence Register

- [ ] **Step 2: Define truth rules**

Each register must record source, date, owner, CURRENT/PROPOSED/EXECUTED status, evidence location, next action, and review date where applicable.

- [ ] **Step 3: Define cadence ownership**

Map each register to daily, weekly, monthly, or quarterly review.

- [ ] **Step 4: Commit**

Commit message: `governance: define company control registers`

### Task 4: Add company operating review contract

**Files:**
- Create: `governance/KLINIKOS_EXECUTIVE_REVIEW_GAUNTLET.md`

**Interfaces:**
- Consumes: company functions, metrics, risks, truth classes.
- Produces: mandatory multi-discipline decision review for major initiatives.

- [ ] **Step 1: Define review lenses**

Every major initiative must be challenged by CEO/strategy, customer, product, clinical, engineering, security, finance, sales, implementation/customer-success, legal/regulatory, network/marketplace, enterprise/procurement, data, capital and adversarial-investor lenses.

- [ ] **Step 2: Define output**

Every review records: benefit, evidence, assumption, risk, economic impact, dependency, reversibility, decision, owner, next action and re-review trigger.

- [ ] **Step 3: Define decision outcomes**

Allowed outcomes: BUILD, MODIFY, TEST, DEFER, PARTNER, BUY, REJECT, STOP.

- [ ] **Step 4: Commit**

Commit message: `governance: add executive review gauntlet`

### Task 5: Verify governance package

**Files:**
- Verify: `CLAUDE.md`
- Verify: `src/lib/company-operating-canon.ts`
- Verify: `tests/company-operating-canon.test.ts`
- Verify: `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md`
- Verify: `governance/KLINIKOS_EXECUTIVE_REVIEW_GAUNTLET.md`

**Interfaces:**
- Produces: evidence that the company operating layer is loadable, typed and test-covered.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/company-operating-canon.test.ts tests/public-capability-registry.test.ts`

Expected: PASS.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`

Expected: PASS.

- [ ] **Step 3: Run lint on changed TypeScript/test files or repository lint if practical**

Run: `npm run lint`

Expected: PASS or document pre-existing unrelated failures without weakening gates.

- [ ] **Step 4: Review truth boundaries**

Confirm none of the governance documents imply that proposed revenue, funding, compliance, customer traction, integrations, or corporate actions are already executed.

- [ ] **Step 5: Record exact head SHA and next dependency**

The next dependency after this governance package is the active P0 self-selling website/value loop, not another broad strategy expansion.
