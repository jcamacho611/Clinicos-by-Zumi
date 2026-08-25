# Klinikos Capital & Bankability Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Klinikos company, product, corporate, commercial, and financing work into one current execution program for customer capital, non-dilutive funding, debt/bankability, accelerators/equity, and strategic capital without creating a competing business plan or duplicate company-truth register.

**Architecture:** The program inherits `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md`, `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md`, and `governance/KLINIKOS_FINAL_FORM_BUSINESS_PLAN.md`. The Capital Opportunity Register and Lender Readiness Register remain the canonical company-state stores; this program defines how opportunities are researched, ranked, prepared, approved, and converted into evidence-backed capital actions.

**Tech Stack:** Repository governance Markdown, current GitHub implementation truth, existing company-operating canon, primary-source external funding research.

**Spec:** `governance/KLINIKOS_CAPITAL_AND_BANKABILITY_PROGRAM.md`

## Global Constraints

- Current repository/runtime truth outranks historical chat or planning snapshots.
- `KLINIKOS_COMPANY_CONTROL_REGISTERS.md` remains authoritative for company register definitions; do not create a shadow capital spreadsheet authority.
- Revenue, traction, production readiness, ownership, tax elections, grants, awards, and integrations may not be represented as executed without evidence.
- No hard inquiry should be authorized merely to discover a lender's underwriting box when a non-binding conversation or prequalification is available.
- Debt repayment must be modeled from operating cash flow, not future grants, equity raises, or unicorn valuation.
- Customer-funded capital remains the preferred proof source when commercially available.
- Grid percentage economics remain unavailable until the current legal/policy gate permits them.
- Production/PHI readiness may not be claimed while release/deployment evidence remains unresolved.
- Intended Klinikos ownership may not be used as actual ownership until executed corporate records support it.
- Application-specific external program requirements must be refreshed before submission.

---

### Task 1: Reconcile current capital truth

**Files:**
- Create: `governance/KLINIKOS_CAPITAL_AND_BANKABILITY_PROGRAM.md`

**Interfaces:**
- Consumes: current `main`, Company Operating System, Company Control Registers, Final-Form Business Plan, current corporate records, current commercial/revenue evidence, current production/release evidence.
- Produces: a verified/proposed/blocked capital execution contract that feeds the existing Capital Opportunity and Lender Readiness registers.

- [ ] **Step 1: Record current repository and company truth**

Capture the exact current `main` SHA and distinguish verified corporate/product facts from intended ownership, proposed pricing, pipeline, and roadmap claims.

- [ ] **Step 2: Record current application blockers**

Include missing/unknown founder credit data, unverified business-banking history, no verified recurring revenue, production deploy/migration deadlock, CI runner failure, and unresolved Klinikos cap-table evidence.

- [ ] **Step 3: Define application consistency law**

Require legal entity, ownership, EIN, address, business activity, management, revenue, cash, debt, use of funds, customer status, affiliates, and forecasts to reconcile before any lender/grant/equity submission.

- [ ] **Step 4: Bind facts to existing company registers**

Capital opportunities populate the Capital Opportunity Register. Lender qualification and application evidence populate the Lender Readiness Register. Corporate evidence stays in the Corporate Governance Evidence Register. Do not duplicate these states in another authority.

### Task 2: Build the full-spectrum capital board

**Files:**
- Modify: `governance/KLINIKOS_CAPITAL_AND_BANKABILITY_PROGRAM.md`

**Interfaces:**
- Consumes: reconciled fact register rules and current primary-source funding research.
- Produces: prioritized customer, grant, accelerator/equity, state, debt/CDFI, and strategic-capital lanes.

- [ ] **Step 1: Rank capital lanes by economics**

Use `probability × speed × amount × dilution × repayment burden × strategic value × evidence burden` rather than ranking by headline amount.

- [ ] **Step 2: Add currently verified time-sensitive opportunities**

Record Techstars AI Health Baltimore, Northwestern Medicine & Techstars, Techstars NYC, NSF SBIR/STTR, NIH SBIR/STTR, and NY Ventures only with current-source dates/terms and explicit re-verification requirements.

- [ ] **Step 3: Preserve customer-money priority**

Define the commercial perimeter as no-PHI assessments/sprints/implementation and institutional contracts that can finance production protection and recurring product maturation.

- [ ] **Step 4: Define no-apply-yet conditions**

Prevent shotgun bank/card applications, debt stacking, Grid economics assumptions, or loan applications that lack consistency/repayment evidence.

### Task 3: Build lender readiness and controlled use-of-proceeds

**Files:**
- Modify: `governance/KLINIKOS_CAPITAL_AND_BANKABILITY_PROGRAM.md`

**Interfaces:**
- Consumes: company/corporate truth, Finance/Treasury operating law, Lender Readiness Register, lender research.
- Produces: readiness score, data-room checklist, underwriting objections, repayment model, application sequence, and capital-release controls.

- [ ] **Step 1: Set a provisional readiness score with explicit reasons**

Score organization/governance/product maturity separately from cash-flow/credit/deployment evidence so the number cannot hide weak repayment evidence.

- [ ] **Step 2: Define lender data room**

Include formation/EIN, cap table/ownership evidence, bank statements, bookkeeping, P&L, balance sheet, cash-flow forecast, AR/contracts, debt schedule, owner/guarantor information where required, use of proceeds, and repayment analysis.

- [ ] **Step 3: Define staged use of proceeds**

Every category receives budget, owner, milestone, expected commercial effect, actual spend, and variance. Release capital after evidence when operationally practical.

- [ ] **Step 4: Define base/conservative/stress repayment cases**

Primary repayment is customer operating cash flow. Grants, future equity, Grid national liquidity, and speculative valuation are excluded from required debt service.

### Task 4: Make the program discoverable and reviewable

**Files:**
- Modify: `CLAUDE.md`
- Create: `governance/KLINIKOS_CAPITAL_AND_BANKABILITY_PROGRAM.md`

**Interfaces:**
- Consumes: completed capital program and current required-reading hierarchy.
- Produces: one discoverable execution authority beneath the existing company/business authorities.

- [ ] **Step 1: Add required-reading reference**

Place the capital program after the Company Operating System / company-control authorities so future agents inherit it before making financing/commercial claims.

- [ ] **Step 2: Review for contradictions**

Confirm the program does not present pricing proposals as approved Offer Registry values, pipeline as revenue, proposed ownership as issued equity, security architecture as compliance certification, or merged code as deployed production.

- [ ] **Step 3: Compare branch against current main**

Confirm only the plan, capital program, and narrow required-reading edit are present.

- [ ] **Step 4: Open a reviewable PR**

Describe the control-register integration, current blockers, verified opportunities, and explicit non-claims. Do not call the branch CI-green if hosted Actions still fail before checkout.
