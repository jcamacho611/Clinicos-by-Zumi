# KLINIKOS — CURRENT SOURCE OF TRUTH

Version: `2026-08-22.2`
Status: `AUTHORITATIVE OPERATING INDEX`

This file is deliberately concise. It identifies current authority; it does not duplicate every specialist canon.

## 1. Truth precedence

When sources conflict, use this order:

1. **Current implementation truth** — code, schema, migrations, tests, exact-head CI and independently verified runtime/production evidence.
2. **This Source of Truth** — current repository-wide operating law and authority map.
3. **`docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md`** — supreme cross-domain product and architecture law.
4. **`docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`** — accepted professional/research findings, provenance, rationale and cross-domain implications.
5. **Specialist canons** — detailed domain law where they do not conflict with the Supreme Canon.
6. **`docs/FEATURE_STATUS.md`** — capability implementation status.
7. **`docs/EXTERNAL_DEPENDENCY_MATRIX.md`** — external connection, contract, credential and production-integration status.
8. Journey/recovery/implementation plans.
9. Historical canons, old prompts, stale estimates and old PR bodies as preserved reasoning only.

A longer or older document does not outrank a newer authoritative correction.

## 2. Product definition

**KLINIKOS is one governed healthcare operating ecosystem.**

Klinikos is not reducible to an EHR/EMR, CRM, clinic app, staffing marketplace, LMS, patient portal, billing product, commerce site or AI assistant.

**Zumi is Klinikos Intelligence.** It is intelligence/orchestration, never identity, clinical, credential, payment, legal or security authority.

**Grid is the universal healthcare relationship/resource/capacity/opportunity/transaction network.** Its user language is **I NEED / I HAVE**.

**Klinikos EDU** is the education/simulation/competency-evidence/career engine and does not grant professional authority.

**Clinic OS** is the healthcare-organization operating engine. **Current Visit** is the provider-facing clinical convergence experience.

## 3. Permanent architecture

Klinikos converges on:

**ONE REPO · ONE SHARED SUBSTRATE · ONE IDENTITY FABRIC · ONE AUTHORIZATION FOUNDATION · ONE EVENT FOUNDATION · ONE AUDIT FOUNDATION · ONE FINANCIAL TRUTH · ONE HEALTHCARE RELATIONSHIP GRAPH · MANY CONTEXTUAL EXPERIENCES.**

Migration follows:

`PRESERVE → UNDERSTAND → ADAPT → HARDEN → GENERALIZE → EXTEND`

No big-bang rewrite. No second Grid, Zumi, finance system, clinical record, authorization foundation or customer-specific fork.

## 4. Authority and privacy

Consequential authority is server-side and context-aware. A generic role label, UI state, Grid profile, EDU evidence, uploaded credential, AI recommendation, owner title or payment status never widens authorization by itself.

The browser is an inspectable disclosure environment.

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER-SIDE POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY PRESENTATION DTO → BROWSER`

Anything that must remain confidential remains server-side.

Patient identity remains protected and never automatically becomes public/Grid-visible.

## 5. Clinical truth

Current Visit remains:

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

Longitudinal change is evidence-derived:

`INITIAL → PRIOR → CURRENT`

AI may summarize deterministic clinical change; it may not invent it.

Signed/final clinical history remains attributable and versioned. External completion is never inferred from internal UI state.

## 6. Financial and transaction truth

Shared economic semantics remain evidence-based:

`AGREEMENT / COMMITMENT → FULFILLMENT CONDITION → FINANCIAL OBLIGATION → VERIFIED PAYMENT EVIDENCE → PAYABLE / PAYOUT EVIDENCE → RECONCILIATION`

Use integer cents. **REDIRECT ≠ PAYMENT.** Obligation ≠ payout. Payout request ≠ settlement.

Pricing is a versioned server-owned policy fabric. There is no universal Grid take rate.

## 7. Frontend law

**BACKEND COMPLEXITY MAY INCREASE. FRONTEND PERCEIVED COMPLEXITY MUST DECREASE.**

Living Home is the adaptive front door and increasingly asks:

> **WHAT DO YOU NEED?**

The UI adapts to identity, active organization/location, role, task, permissions and real state. Users should not hunt through module architecture to accomplish ordinary work.

System/Light/Dark are presentation preferences only and never change authority.

## 8. External integration truth

Internal models are Klinikos domain truth; vendors and standards live behind adapters.

Never call an integration live because code, credentials, an adapter or sandbox exists.

External lifecycle may include:

`PLANNED → CONTRACT_PENDING → CREDENTIALS_PENDING → SANDBOX → CONNECTED → UAT → CONTROLLED_PRODUCTION → PRODUCTION_VERIFIED`

plus `DEGRADED`, `DISABLED` and `BLOCKED`.

## 9. Required specialist authorities

Read as applicable:

- `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`
- `docs/GRID_CANON.md`
- `docs/ZUMI_CANON.md`
- `docs/EDU_CANON.md`
- `docs/CLINIC_OS_CANON.md`
- `docs/PORTAL_AND_ROLE_CANON.md`
- `docs/FINANCIAL_OS_CANON.md`
- `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`
- `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`
- current design/wiring canons
- Assurance/Rules & Evidence specialist canon where present on the active branch

The Supreme Canon defines how these domains fit together and wins when cross-domain architecture conflicts.

## 10. Status truth

Capability labels belong in `docs/FEATURE_STATUS.md` and do not change merely because architecture expands.

External rail status belongs in `docs/EXTERNAL_DEPENDENCY_MATRIX.md` and cannot be upgraded without external evidence.

Manual-but-truthful work is allowed. Fake automation, fake payment, fake verification, fake payout, fake external completion, fake Grid inventory or fabricated clinical truth are prohibited.

## 11. Engineering completion law

For material implementation:

`FETCH CURRENT MAIN → INSPECT OPEN/OVERLAPPING WORK → TEST/IMPLEMENT ON ISOLATED BRANCH → REFRESH MAIN → REVIEW DIFF → VERIFY EXACT HEAD → MERGE EXACT EXPECTED SHA WHEN AUTHORIZED → VERIFY NEW MAIN → VERIFY PRODUCTION SEPARATELY`

If GitHub Actions fails before checkout, record infrastructure failure truthfully. It is neither passing evidence nor a code-test failure.

Canonical public domain: `https://klinikos.io`. Infrastructure hostnames are not the product identity.