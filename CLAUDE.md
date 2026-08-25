# KLINIKOS Claude Operating Contract

This file is the bootstrap for Claude Code and other implementation agents working in this repository.

## Start here

Klinikos is being built as a **governed healthcare operating network**, not merely an EHR, practice-management app, marketplace, LMS, billing tool, AI assistant, or marketing website.

The governing human-experience law is:

> **The complexity belongs to Klinikos, not to the person using Klinikos.**

The governing operating question is:

> **What needs to happen next?**

The governing business objective is:

> Build a product that creates measurable customer value, becomes recurring infrastructure, progressively consolidates fragmented vendor workflows, compounds through Grid, Network, EDU, identity, evidence and Zumi, and can be operated with enterprise-grade security, reliability and discipline.

## Required reading order

Before material work, read current repository/runtime truth and then read these files in order:

1. `docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md`
2. `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
3. `docs/SOURCE_OF_TRUTH.md`
4. `src/lib/feature-registry-canon.ts`
5. `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`
6. `docs/CLINIC_OS_CANON.md`
7. `docs/GRID_CANON.md`
8. `docs/EDU_CANON.md`
9. `docs/ZUMI_CANON.md`
10. `docs/FINANCIAL_OS_CANON.md`
11. `docs/KLINIKOS_COMMERCIAL_CANON.md`
12. `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`
13. `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`
14. `docs/SECURITY_ARCHITECTURE.md`
15. `docs/CLINICAL_SAFETY.md`
16. `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md`
17. `docs/business/KLINIKOS_VENTURE_SCALE_OPERATING_PACKAGE_2026-08-24.md`
18. `governance/KLINIKOS_FINAL_FORM_CONTROL_PLANE.md`
19. `governance/KLINIKOS_SOURCE_LOCKED_REQUIREMENTS.md`
20. `governance/KLINIKOS_FINAL_FORM_BUSINESS_PLAN.md`
21. `governance/KLINIKOS_PRODUCTION_AND_ENTERPRISE_READINESS.md`
22. `governance/KLINIKOS_UNICORN_OPPORTUNITY_REGISTER.md`

Current code/schema/tests/runtime determine **what exists**. Governing product documents determine **what should exist**. Source-locked requirements determine **what user needs may not silently disappear**.

## Three truth classes

Always distinguish:

- **CURRENT FACT**: verified/observed repository, runtime, provider, contract or signed corporate evidence.
- **PROPOSED**: strategy, pricing, architecture, business model or opportunity not yet formally enacted.
- **EXECUTED**: actually implemented, signed, activated, paid, connected or legally effective.

Never turn a recommendation into corporate/product reality by wording alone.

## Source-locked requirement law

Direct founder instructions, professional/doctor feedback, customer/prospect requests and the canonical feature registry are product requirement evidence.

You may improve, combine, generalize, hide, automate, rename or replace the implementation, but you may not silently delete the original user need. If superseding a direct requirement, record where its intent now lives and how acceptance is proven.

## Plain-English frontend law

Every user-facing surface translates complexity before professional terminology.

Prefer:

- `Insurance approval is still needed.` over `AUTHORIZATION_REQUIREMENT_MISSING`.
- `This referral still needs follow-up.` over internal obligation names.
- `Payment is still being verified.` over reconciliation jargon.
- `This visit may need billing review.` over internal revenue-exception terms.

The UI should answer:

1. What is happening?
2. Why does it matter?
3. What can I do?
4. What happens next?

Professional detail may appear secondarily for expert users.

## Current Visit law

Current Visit already exists. Do not create a second encounter editor or second clinical authority.

Preserve and perfect the existing convergence sequence:

`PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT & PLAN → ORDERS & RESULTS → DOCUMENTATION & CODING → CLOSE VISIT`

## Zumi law

Zumi is the intelligence/orchestration layer, not final authority.

Architecture:

`UNDERSTAND → GOVERNED VALIDATION → AUTHORIZED EXECUTION → EVIDENCE → EXPLANATION`

Use autonomy levels:

- L0 observe
- L1 recommend
- L2 prepare
- L3 execute after authorized approval
- L4 explicitly authorized low-risk deterministic autopilot
- L5 prohibited autonomy for diagnosis, clinical signature, prescription authority, professional licensure, patient consent, high-risk clinical judgment, unauthorized payments or other authority that must remain human/deterministic/external.

## Vendor replacement law

For every external vendor/system classify:

`CONNECT → ABSTRACT → CONTROL → INTERNALIZE → REPLACE`, or `NEVER REPLACE` where recreating an authoritative/regulatory rail is irrational.

Own the customer workflow first. Make external providers swappable adapters. Internalize high-value layers when customer value, margin, retention, reliability and regulatory feasibility justify it.

## Unicorn discovery law

Do not limit opportunity discovery to founder-mentioned ideas.

Continuously ask:

- What workflow still leaves Klinikos?
- What still uses phone, fax, email, paper, spreadsheet or memory?
- What unused resource can become supply?
- What need can become Grid demand?
- What shortage can EDU address?
- What relationship can become Network?
- What operating event should create a revenue expectation?
- What can Zumi make invisible?
- What vendor can become an adapter or be eliminated?
- What capability creates customer revenue and Klinikos revenue simultaneously?
- What two existing Klinikos engines create a third business when connected?

Record new opportunities in the Unicorn Opportunity Register. Do not silently place them into P0.

## Stay-on-course law

Preserve the complete final-form map, but keep **one active dependency-ordered company value loop**.

Current default active loop:

`VISITOR → UNDERSTANDS KLINIKOS → QUALIFIES → PAYS/CONTRACTS → ACTIVATES → FIRST VALUE → REPEATED VALUE → EXPANDS → GRID/NETWORK VALUE`

A new idea interrupts current P0 only if it is required for safety, required customer value, revenue activation, a blocker, or a reusable prerequisite.

Otherwise record it, score it and continue the active tranche.

## Professional software-studio law

The founder should not need to know to ask for security engineering, SRE, backups, disaster recovery, load testing, accessibility, release governance, migration safety, observability, incident response, threat modeling, support operations, vendor risk, procurement documentation, rate limiting, idempotency, rollback or other professional requirements.

Agents must proactively identify and schedule them at the correct dependency point.

## Before implementing

1. Fetch current `main` and record exact SHA.
2. Inspect relevant open PRs and recent commits.
3. Reconcile current implementation with source-locked requirements.
4. Identify the single vertical slice being advanced.
5. State user outcome, business outcome, architecture, data authority, security/privacy impact, monetization impact and acceptance tests.
6. For architectural work, present design and obtain approval before implementation.

## During implementation

Use:

`PRESERVE → UNDERSTAND → ADAPT → HARDEN → GENERALIZE → EXTEND`

Prefer TDD for features/bug fixes. Do not create parallel authorities.

## Definition of done

A capability is not done until the supported path works:

`VISIBLE UI → USER UNDERSTANDS STATE → IDENTITY/CONTEXT → AUTHORIZATION → DOMAIN AUTHORITY → REAL DATA/EXTERNAL EVIDENCE → PERSISTENCE/EVENT → TRUTHFUL RESULT → AUDIT/RECONCILIATION → NEXT ACTION`

A route, component, mock, adapter or browser redirect alone is not completion.

## End-of-session output

Report:

- exact main/head SHA used
- what changed
- what was verified
- what remains blocked
- source-locked requirements advanced
- new opportunities discovered
- risks introduced/reduced
- commercial/customer value
- next dependency-ordered action

Do not end with generic “more research.”
