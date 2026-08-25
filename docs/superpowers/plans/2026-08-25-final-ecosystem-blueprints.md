# Klinikos Final Ecosystem Blueprints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install a complete repository-native final-form architecture and coding handoff so implementation agents know every major Klinikos domain, interface, authority, monetization path, website route, Zumi role, enterprise requirement and build-order gate without relying on chat history.

**Architecture:** Preserve current runtime/code as implementation truth while adding a governing target architecture under `governance/`. Use one master ecosystem map, focused domain blueprints, and cross-domain interface registries. Update `CLAUDE.md` so these artifacts become mandatory reading before material implementation.

**Tech Stack:** Markdown governance/specification files, current Next.js/TypeScript/Prisma architecture as referenced implementation context, GitHub branch/PR workflow.

**Spec:** `governance/KLINIKOS_FINAL_FORM_MASTER_BUILD_HANDOFF.md`

## Global Constraints

- Current repository/runtime remains authoritative for what is actually built.
- Source-locked founder/professional/customer requirements may not silently disappear.
- Current Visit remains the clinical encounter authority.
- Zumi orchestrates but does not bypass domain authority.
- External vendors follow `CONNECT → ABSTRACT → CONTROL → INTERNALIZE → REPLACE` or `NEVER REPLACE`.
- Plain-English frontend language precedes professional/internal terminology.
- Pricing is governed through a centralized Offer Registry; proposed pricing is not silently activated.
- No fake integrations, payments, customers, traction, certifications, revenue or clinical facts.
- No proprietary/security/price-margin logic or unnecessary sensitive data in browser bundles.
- Final-form scope is preserved while active implementation remains dependency ordered.

---

### Task 1: Install master build handoff

**Files:**
- Create: `governance/KLINIKOS_FINAL_FORM_MASTER_BUILD_HANDOFF.md`

**Interfaces:**
- Consumes: current governance documents and source-locked requirements
- Produces: authoritative final-form coding-agent handoff

- [ ] Write complete final-form product, website, pricing, payments, systems, production, security, scale, review and build-order requirements.
- [ ] Verify it explicitly distinguishes current fact, proposed pricing/strategy and executed state.
- [ ] Verify no direct professional requirement is contradicted.
- [ ] Commit.

### Task 2: Install ecosystem map and domain blueprints

**Files:**
- Create: `governance/KLINIKOS_FINAL_ECOSYSTEM_ARCHITECTURE.md`
- Create focused files under `governance/systems/`

**Interfaces:**
- Consumes: master build handoff
- Produces: bounded-context definitions that implementation agents can use independently

- [ ] Define platform kernel and Living Home.
- [ ] Define Care, Patient, Revenue, Financial, Zumi, Grid, Network, EDU, Identity/Trust.
- [ ] Define Payer/Value-Based Care, Pharmacy/Devices, Enterprise, Digital Business, Integration Hub, Data Platform, Implementation/Customer Success, Trust/Assurance and Platform Operations.
- [ ] For every blueprint include purpose, personas, frontend, backend authority, data, states, commands/events, Zumi level, adapters, permissions, audit, failure modes, economics, security, tests and phase.
- [ ] Commit.

### Task 3: Install cross-system interface registries

**Files:**
- Create files under `governance/interfaces/`

**Interfaces:**
- Produces: shared contracts preventing duplicated authority and ambiguous cross-system behavior

- [ ] Add domain-event registry.
- [ ] Add command registry.
- [ ] Add data-authority matrix.
- [ ] Add permission/authority matrix.
- [ ] Add Zumi tool/autonomy registry.
- [ ] Add integration lifecycle registry.
- [ ] Add money-flow registry.
- [ ] Commit.

### Task 4: Install website/pricing/commercial execution specification

**Files:**
- Create: `governance/systems/DIGITAL_BUSINESS_AND_WEBSITE.md`
- Create: `governance/interfaces/OFFER_AND_ENTITLEMENT_REGISTRY.md`

**Interfaces:**
- Consumes: commercial canon, current pricing anchors, Financial OS
- Produces: definitive public website journey, free/paid boundaries, approved/proposed pricing separation, payment/contract paths

- [ ] Define public navigation and all required route purposes.
- [ ] Define homepage and Operating Map experience.
- [ ] Define Free, Analysis, Blueprint, Implementation, Core, Growth, Scale and Enterprise offer shapes.
- [ ] Mark currently proposed vs active values truthfully.
- [ ] Define checkout, payment evidence, contracting, CRM, onboarding and entitlement states.
- [ ] Define AI sales/SEO/webmaster/follow-up boundaries.
- [ ] Commit.

### Task 5: Wire governance into Claude bootstrap

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: all new governance files
- Produces: mandatory agent startup/read protocol

- [ ] Add master handoff and ecosystem architecture to required reading.
- [ ] Require reading the relevant system blueprint and cross-domain registries for each implementation tranche.
- [ ] Require implementation-session status update against source-locked requirements and active roadmap.
- [ ] Commit.

### Task 6: Self-review and verify repository-only scope

**Files:**
- Verify all changed files on branch.

**Interfaces:**
- Produces: evidence that this tranche is governance/specification only and internally consistent

- [ ] Compare branch against base SHA `5eb1bda23c4053093f4e11d351298ffe1c7131ea`.
- [ ] Verify only intended governance/plan/bootstrap files changed.
- [ ] Search for placeholder language such as `TBD`, `TODO`, `implement later`, and fix plan/spec placeholders.
- [ ] Check links/paths referenced by `CLAUDE.md` exist on branch.
- [ ] Review domain ownership for duplicates/contradictions.
- [ ] Review pricing language for fact/proposal separation.
- [ ] Review source-locked clinical coverage.

### Task 7: Open, review and merge docs-only PR

**Files:**
- No new runtime files.

**Interfaces:**
- Produces: final repository-native architecture on `main`

- [ ] Open PR from `docs/final-ecosystem-blueprints-20260825` to `main`.
- [ ] Inspect PR changed-file list/diff.
- [ ] Verify no runtime code/schema was changed.
- [ ] Merge only if verification confirms intended scope.
- [ ] Fetch new `main` SHA and record it.
