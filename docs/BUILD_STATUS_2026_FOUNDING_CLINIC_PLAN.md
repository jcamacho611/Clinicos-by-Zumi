# Klinikos Founding Clinic / Build Status

Status date: 2026-08-12
Document role: **CURRENT RELEASE STATUS + HISTORICAL POINTER**

This file originally tracked the August 9 Founding Clinic implementation slices. Those sections were useful release notes at the time, but they became dangerous when read as current product truth.

Current authoritative documents are:

1. `docs/SOURCE_OF_TRUTH.md`
2. `docs/FEATURE_STATUS.md`
3. `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
4. `docs/MVP_JOURNEYS.md`

Older ClinicOS/Clinicos/Zumi-on-Render wording in git history is historical only.

## Current product identity

The product is **Klinikos**.

- `Clinicos` remains only where legacy repository/migration/compatibility identifiers make immediate renaming risky.
- Zumi is **Klinikos Intelligence**, not the master brand.
- Canonical public identity is **https://klinikos.io**.
- Render is infrastructure, not public identity.

## Current application baseline

Application baseline immediately before the documentation truth-sync branch:

`0299240e71d81cab9c885f4225925b1173fc8058`

This is the squash merge of PR #66, the frontend/commercial convergence release.

The exact PR candidate passed:

- Prisma validation and generation;
- all 50 committed migrations against fresh PostgreSQL;
- TypeScript;
- lint;
- 547 tests across 71 files;
- all ten DB-backed MVP journeys;
- production Next.js build;
- production startup smoke;
- exact Render deploy-contract.

Those checks prove the repository candidate. The newest production deployment must still be verified from the actual hosting environment.

## Current production host contract

```bash
# Build
npm ci --include=dev --ignore-scripts && npm run render:build

# Start
npm start
```

Health endpoint: `/api/health`.

Do not move migrations/build back into runtime startup.

## What the Founding Clinic path has become

The old “private demo” concept has evolved into a clearer commercial ladder:

| Current offer | Anchor |
| --- | --- |
| Clinic Operating Analysis | $500 |
| Implementation Blueprint | $1,500 |
| Founding Clinic Implementation | from $8,000 |
| Klinikos Core | $995/mo |
| Klinikos Growth | $1,995/mo |
| Klinikos Scale | $3,995/mo |
| Klinikos Enterprise | Custom |

The `$500` Clinic Operating Analysis is the currently wired public checkout entry. Klinikos creates a server-owned checkout intent before opening the configured GoDaddy paylink.

A browser redirect does not establish payment. Verified/manual evidence and entitlement activation remain separate deterministic state.

## Current product surfaces

### Clinic OS

PostgreSQL-backed patient, appointment, encounter, document, form, lab, imaging, medication, task, operational-action, referral, network, case, payment, revenue/coding, and portal foundations exist at varying maturity levels.

External labs, payers, clearinghouses, eRx/EPCS, fax, messaging, telemedicine, credential sources, and other rails remain connection-dependent unless the exact production environment is independently verified.

### Grid

Grid is now a generalized healthcare opportunity/resource/capacity exchange rather than a nurse/injector-only marketplace.

The model supports broad resource classes, hard eligibility, offers, reservations, financial obligations, trust/problem workflows, and concurrency protection.

The public map may use the visitor's real location when permission is granted. It does not create fake nearby inventory.

### Network

Partner directory, relationships, governed handoffs, consent/purpose/minimum-necessary boundaries, internal connected delivery, and recoverable manual fallbacks exist.

External fax/Direct/other vendor delivery must remain explicitly manual/Pending Connection until evidence exists.

### Klinikos EDU

EDU is a first-class public/authenticated surface with synthetic virtual-clinic scenarios, student submissions/evidence, grading/release rules, and cohort/course foundations.

Institutional LTI/SSO and FERPA/legal deployment review remain external gates.

### Klinikos Intelligence / Zumi

The provider-neutral gateway, deterministic admission rules, egress boundaries, continuity/context direction, and governed tool/research architecture exist.

PHI/sensitive redaction must happen before any planner/router/memory/tool/provider consumer reads the question.

Production model/provider availability and PHI approval are environment-specific external gates. Never infer them from code presence.

### Living Home / frontend

The frontend convergence release changed the product from a dense architecture-first presentation toward:

- role-aware Living Home;
- goal-first plain language;
- progressive authenticated navigation;
- materially more whitespace and editorial hierarchy;
- first-class Grid/EDU entry;
- adaptive Aegean atmosphere (Auto/Dawn/Day/Golden Hour/Night);
- fewer card walls and less backend vocabulary.

## Current MVP proof set

`npm run test:mvp` executes ten real PostgreSQL-backed journeys:

1. fresh deploy;
2. commercial payment truth;
3. paid activation/provisioning;
4. clinic operations;
5. Grid transaction;
6. Grid trust/problem handling;
7. Zumi governed/degraded behavior;
8. tenant isolation;
9. role routing;
10. failure/recovery/concurrency.

See `docs/MVP_JOURNEYS.md` for exact contracts.

## Claims that still must not be made

Do not state or imply merely from the repository that Klinikos is:

- a certified EHR;
- HIPAA compliant by virtue of code alone;
- connected live to every healthcare vendor or network it has architecture for;
- automatically verifying licenses/malpractice against external authorities;
- autonomously diagnosing, prescribing, releasing records, approving credentials, or overriding human-required clinical decisions;
- moving Grid payouts merely because a financial ledger/obligation exists;
- verifying payment because a buyer returned from checkout.

Use truthful states such as Built, Partially built, Manual fallback, Adapter ready, Pending connection, Blocked, and Roadmap.

## Historical release material

The original August 9 sections describing Private Workflow Demo, early Grid provider marketplace, Network Command, and initial Zumi Copilot remain available in git history if release archaeology is needed.

They are **not** current operating truth and should not be copied forward into new prompts, product copy, deployment instructions, or planning without reconciliation against the authoritative files above.
