# KLINIKOS Architecture & Source-of-Truth Index

Status: `AUTHORITATIVE INDEX`
Date: 2026-08-22

This file is navigation. It deliberately avoids duplicating architecture detail.

## Precedence

1. Current code/schema/migrations/tests/exact-head CI/verified runtime and production evidence.
2. `docs/SOURCE_OF_TRUTH.md`.
3. `docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md`.
4. `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`.
5. Specialist canons.
6. `docs/FEATURE_STATUS.md`.
7. `docs/EXTERNAL_DEPENDENCY_MATRIX.md`.
8. Journey, recovery and implementation plans.
9. Historical/legacy material.

## Required read order before material work

1. Fetch current `main`, recent commits, open PRs, CI and relevant runtime truth.
2. Read `docs/SOURCE_OF_TRUTH.md`.
3. Read `docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md` for any material cross-domain architecture, identity, clinical, Grid, Commerce, EDU, Zumi, finance/pricing, trust, integration, enterprise, distribution or configuration work.
4. Read `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` when accepted professional/research reasoning matters.
5. Read the relevant specialist canon(s).
6. Read `docs/FEATURE_STATUS.md` before claiming capability status.
7. Read `docs/EXTERNAL_DEPENDENCY_MATRIX.md` before claiming external connectivity.
8. Read branch/recovery/roadmap docs when touching concurrent or historical work.
9. Resolve conflicts explicitly; never silently revive older assumptions.

## Supreme architecture

Klinikos converges on:

**ONE REPO · ONE SHARED SUBSTRATE · ONE IDENTITY FABRIC · ONE AUTHORIZATION FOUNDATION · ONE EVENT FOUNDATION · ONE AUDIT FOUNDATION · ONE FINANCIAL TRUTH · ONE HEALTHCARE RELATIONSHIP GRAPH · MANY CONTEXTUAL EXPERIENCES.**

The Supreme Canon defines the permanent laws for identity, organizations, authority, trust, graph semantics, data, events, audit, configuration, no-customer-fork, specialties, clinical convergence, Clinical Change, obligations, Grid, Commerce, transactions, financial truth, pricing fabric, EDU, Zumi, frontend simplicity, interoperability, privacy, trade-secret boundaries, trust/safety, legal gateway, distribution/network effects, enterprise and deployment truth.

## Major specialist authorities

### Clinical / Clinic OS
- `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`
- `docs/CLINIC_OS_CANON.md`

Current Visit remains the clinician convergence surface:

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

### Grid / Commerce / Network
- `docs/GRID_CANON.md`

Grid is **I NEED / I HAVE** over shared participants, resources, demand, eligibility, offers, commitments, fulfillment and financial truth. Commerce is a shared capability layer, not a second marketplace.

### Intelligence
- `docs/ZUMI_CANON.md`
- `docs/ZUMI_CONVERSATION_INTELLIGENCE_CANON.md`

Zumi is Klinikos Intelligence. It may interpret, retrieve, explain, prepare and orchestrate; it does not become identity, clinical, credential, payment, legal or security authority.

### Education
- `docs/EDU_CANON.md`

EDU owns learning/simulation/competency evidence. Grid owns opportunity/placement matching. Education evidence never silently becomes professional authority.

### Identity / portals
- `docs/PORTAL_AND_ROLE_CANON.md`

One person may hold many contexts; active tenant/role/context remains explicit and server-authorized. Patient context remains separately protected.

### Finance / pricing
- `docs/FINANCIAL_OS_CANON.md`
- `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`

Financial truth is evidence-based. Pricing is server-owned, versioned and transaction-class specific; no universal take rate.

### Security / confidentiality
- `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`

If information must remain confidential, keep it server-side. Browser-delivered data is inspectable.

### Design / frontend
- current design-package and design/wiring canons

Permanent UX law:

**BACKEND COMPLEXITY MAY INCREASE. FRONTEND PERCEIVED COMPLEXITY MUST DECREASE.**

Living Home is the adaptive front door; Current Visit is the clinical front door; Grid is I NEED / I HAVE.

## Implementation truth indexes

- `docs/FEATURE_STATUS.md`
- `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
- `docs/MVP_JOURNEYS.md`
- `docs/PRODUCTION_ENVIRONMENT_TRUTH.md`
- `docs/BRANCH_LEDGER.md`
- `docs/RECOVERY_AND_COMPLETION_ROADMAP.md`

## Migration direction

`PRESERVE → UNDERSTAND → ADAPT → HARDEN → GENERALIZE → EXTEND`

Near-term dependency order:

1. Supreme Canon/source hierarchy convergence.
2. Lifelong Person + organization/location relationship substrate behind existing auth.
3. Profession/credential/privilege/supervision authority convergence.
4. Encounter-specific Staff Handoff.
5. Structured clinical components + Clinical Change Graph.
6. Shared obligation/completion semantics.
7. Grid/Commerce policy-class convergence.
8. Pricing Fabric/entitlements/metering.
9. Durable integration outbox/inbox/reconciliation.
10. Shared Trust & Safety infrastructure.
11. Governed Zumi durable memory/action registry.
12. Enterprise hierarchy/network governance and distribution/liquidity loops.

No architecture document changes feature status or external-live status by itself.