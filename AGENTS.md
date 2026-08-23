# Klinikos agent operating law

## Repository boundary

This repository is `jcamacho611/Clinicos-by-Zumi`, the Klinikos application. Never mix unrelated repositories, databases, tenants, environments, credentials or product resources into Klinikos work.

Before every material run:

1. verify repository/branch/remote;
2. fetch current `main`, recent commits, open PRs and relevant branches;
3. inspect CI and production/dependency truth where relevant;
4. read `docs/SOURCE_OF_TRUTH.md` and `docs/KLINIKOS_ARCHITECTURE_INDEX.md`;
5. read `docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md` for any material cross-domain architecture, identity, clinical, Grid, Commerce, EDU, Zumi, finance/pricing, trust/safety, interoperability, enterprise, distribution, configuration or frontend-simplicity work;
6. read `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` when professional/research findings affect the work;
7. read the relevant specialist canon(s);
8. read `docs/FEATURE_STATUS.md` before making capability claims;
9. read `docs/EXTERNAL_DEPENDENCY_MATRIX.md` and `docs/PRODUCTION_ENVIRONMENT_TRUTH.md` before external-live, vendor, PHI, payment or deployment claims;
10. inspect overlapping current work before editing.

### Mandatory specialist reads

- For frontend, API, Zumi, Grid, Quality/Assurance, pricing, security, analytics, admin, integration or client-visible work: `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.
- For Zumi shell/control, public UX, product comprehension, navigation, SEO, metadata, sitemap, robots, indexing or growth surfaces: `docs/KLINIKOS_PRODUCT_CONTROL_AND_COMPREHENSION_CANON.md`.
- For Zumi conversation, routing, role/goal understanding, public intelligence, fallback/degraded behavior, quick replies, provider, memory/context or assistant-response work: `docs/ZUMI_CONVERSATION_INTELLIGENCE_CANON.md`.
- For encounter, Current Visit, clinical templates, intake/staff handoff, longitudinal change, body map, clinical AI, coding, orders/results or close-visit work: `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`.
- For competitor research, paid-product simplicity, paywall continuity or outbound targeting: `docs/COMPETITOR_INTELLIGENCE_AND_SIMPLICITY_CANON.md`.
- For recovery work: `docs/BRANCH_LEDGER.md` and the current recovery roadmap.

## Permanent architecture

Klinikos is one governed healthcare operating ecosystem.

**ONE REPO · ONE SHARED SUBSTRATE · ONE IDENTITY FABRIC · ONE AUTHORIZATION FOUNDATION · ONE EVENT FOUNDATION · ONE AUDIT FOUNDATION · ONE FINANCIAL TRUTH · ONE HEALTHCARE RELATIONSHIP GRAPH · MANY CONTEXTUAL EXPERIENCES.**

Migration law:

`PRESERVE → UNDERSTAND → ADAPT → HARDEN → GENERALIZE → EXTEND`

Do not create a second Grid, second Zumi, second finance system, second clinical record, duplicate authorization foundation or customer-specific fork when shared primitives/configuration/adapters are sufficient.

## Environment truth law

- `.env.example` is a configuration contract, never proof a production value exists.
- `docs/PRODUCTION_ENVIRONMENT_TRUTH.md` records known environment state without storing secrets.
- `OPERATOR-REPORTED CONFIGURED` is weaker than `PRODUCTION_VERIFIED` / `VERIFIED LIVE`.
- Never print, log, commit, echo, screenshot or copy secrets into source, docs, PRs, issues, fixtures or reports.
- A credential proves only potential authentication, not a working journey, webhook, settlement, payout, PHI approval or compliance posture.
- Preserve environment/runtime discrepancies explicitly instead of silently choosing the optimistic state.

## Authority law

Consequential authority is server-side.

A role label, profile, Grid listing, uploaded credential, EDU completion, owner/admin title, payment state, frontend state or AI output never widens authority by itself.

For regulated/sensitive actions, evaluate the applicable combination of identity, tenant/org, active context, location, role, profession, capability, assignment/relationship, purpose, credential, privilege, supervision/delegation, consent, effective date and policy.

UI hiding is usability, never authorization.

## Identity law

One real person must be capable of remaining one Klinikos person across decades and multiple simultaneous contexts.

Do not create disconnected identities merely because the same person is a student, employee, professional, provider, contractor, Grid participant, seller, owner, educator, preceptor, organization representative or patient in a separately governed context.

Existing `User`, `PortalAccount`, `Provider`, `Patient` and Grid models may remain as compatibility surfaces during migration. Never collapse patient context into public/network identity automatically.

## Clinical convergence law

Read `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md` before encounter/clinical work.

Current Visit is the provider-facing convergence surface:

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

Structured longitudinal change is deterministic evidence:

`INITIAL → PRIOR → CURRENT`

AI may summarize governed change. It may not manufacture clinical truth, sign, prescribe, finalize coding, release records, submit claims or close clinical work without governing human/deterministic authority.

Staff handoff is encounter-specific; general patient summary state must not be mislabeled as completed intake. Specialty breadth comes from reusable versioned components/configuration, not incompatible EHR forks.

## Grid / Commerce law

Grid is the universal healthcare relationship/resource/capacity/opportunity/transaction network. User language is **I NEED / I HAVE**.

Hard eligibility precedes ranking.

Commerce is a shared catalog/listing/transaction capability layer, not a second marketplace. Do not build duplicate transaction engines for workforce, space, products, education and services.

Transaction classes may have distinct eligibility, contract, pricing, payment, refund, fulfillment, insurance, credential, jurisdiction, tax and fee policies.

Payment or sponsorship never purchases eligibility.

## Zumi law

Zumi is Klinikos Intelligence, not domain authority and not a regex router wearing a chat UI.

Zumi may interpret intent, retrieve authorized state, explain, summarize, prepare, preview and invoke approved actions through governed server capabilities.

Zumi may never become authority for identity, tenant isolation, RBAC, credential validity, privileges, eligibility, clinical signing, medication authority, payment, settlement, legal acceptance or security policy.

Memory authority order:

1. authoritative live data;
2. verified external evidence;
3. approved institutional knowledge;
4. human-confirmed personal memory;
5. conversation-derived memory;
6. AI hypothesis.

Lower authority never silently overrides higher authority.

### Persistent and degraded conversation law

- Authenticated core surfaces preserve access to the canonical shell-level Zumi control or `/zumi`; do not create competing primary assistants.
- Public Zumi remains a separately bounded anonymous intelligence surface and is never an anonymous clinic session.
- Ordinary safe turns provide useful value before requesting more information when possible.
- Short turns such as `like what`, `how`, `why`, `what else`, and `for me` inherit relevant prior conversational context rather than restarting.
- Self-described roles/goals personalize conversation but do not become verified credentials or authority.
- Provider failure degrades to state-aware, solution-first behavior rather than a generic dead-end carousel.
- Public quick replies are normalized prompt shortcuts, not model-generated executable actions.
- Anonymous/public context must not inherit authenticated tenant memory.

## Financial and pricing law

Financial OS is the single economic-truth substrate.

Use integer cents. Browser redirect/query/client state is never payment evidence. Obligation is not payout; payout request is not settlement.

Pricing is server-owned, versioned and policy-specific. There is no universal Grid take rate.

Healthcare fee-splitting, referral, anti-kickback, corporate-practice, staffing/employment or similar counsel-dependent questions must fail closed to a reviewed commercial model rather than assuming a percentage fee is lawful.

## Frontend simplicity and product comprehension law

**BACKEND COMPLEXITY MAY INCREASE. FRONTEND PERCEIVED COMPLEXITY MUST DECREASE.**

Living Home is the adaptive operating front door. The normal interaction increasingly begins with **WHAT DO YOU NEED?**

Do not expose the module architecture merely because it exists. Prefer role/context-aware next actions and progressive disclosure.

Current Visit is the clinical convergence experience. Grid is I NEED / I HAVE. System/Light/Dark are presentation preferences only and never affect authority.

Plain-language comprehension outranks internal architecture jargon on buyer/user surfaces.

### SEO / indexing boundary

- Public metadata, structured data, canonical URLs, sitemap and robots rules must reflect truthful canonical messaging.
- Authenticated/private/admin/API workspaces are not public SEO inventory.
- Do not inherit the homepage canonical onto unrelated routes.
- SEO/public profile pages use intentionally public projections only; never turn private patient, employee, credential or operational state into indexable inventory.
- Growth is judged by qualified discovery, activation, retained use, conversion/expansion, network liquidity, cost-to-serve and trust rather than vanity traffic.

## Security / confidentiality law

Read `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` before frontend/API/Zumi/Grid/pricing/analytics/admin/integration or client-visible sensitive work.

The browser is inspectable.

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER-SIDE POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY PRESENTATION DTO → BROWSER`

Anything that must remain confidential stays server-side, including secrets, hidden Zumi directives, proprietary orchestration/ranking/trust/risk/fraud logic, private pricing/margin formulas, unreleased strategy, privileged security details and unnecessary PHI/PII.

Raw ORM/domain records are not browser contracts. Server-to-client props, API responses, client logs, source maps, public env values, static assets, browser storage, telemetry and errors are disclosure surfaces.

Material frontend/API work requires response-minimization, tenant/RBAC, cache, error-sanitization and browser-exposure review before merge.

## External integration truth

Internal Klinikos domain models remain application truth; vendors/standards live behind adapters.

Never call an integration live because code, credentials, an adapter or sandbox exists.

Use explicit states such as planned, contract pending, credentials pending, sandbox, connected, UAT, controlled production, production verified, degraded, disabled or blocked.

External contractual, BAA, licensing, enrollment, certification and security gates remain independent.

## Trust / safety law

Trust & Safety is shared infrastructure across accounts, organizations, credentials, listings, transactions, reviews, AI/tools and payments.

Support evidence-based reporting, blocking, rate limits, anti-bot controls, account-takeover defenses, verification, risk/fraud/payment holds, manual review, moderation, suspension, appeals, incident investigation and anti-manipulation controls as the risk requires.

Risk scores are signals unless explicit deterministic policy says otherwise; they do not silently become clinical/credential/legal authority.

## Competitive intelligence and outbound law

Before ordinary sales, pilot, audit, onboarding or implementation outreach, classify the target as `BUYER`, `PARTNER`, `COMPETITOR` or `UNKNOWN`.

- Direct/near-direct healthcare software competitors are research-only by default unless an explicit partnership/interoperability strategy is approved.
- `UNKNOWN` targets are researched before outreach; do not send first and classify later.
- Competitor research uses lawful public information only; never request or use leaked/private credentials, customer data or trade secrets.
- Learn from public patterns without copying proprietary UI, code, language, workflows or protected material.

## Testing / verification law

For material tranches, test first where practical and run the applicable chain:

- Prisma generate;
- Prisma validate;
- fresh PostgreSQL migrations;
- type-check;
- lint;
- unit/integration tests;
- DB-backed MVP journeys;
- security/negative-authorization tests;
- production build/start/health smoke;
- browser/responsive/accessibility verification where UI changed.

If GitHub Actions fails before checkout, record an infrastructure failure. Do not claim green CI and do not call it a code-test failure.

## Concurrent-work / merge law

`FETCH → COMPARE → INSPECT → PRESERVE → RE-ANCHOR → TEST → REVIEW → MERGE`

Never overwrite stronger concurrent work or force stale history.

Before merge:

1. refresh `main`;
2. inspect overlap;
3. review full diff;
4. preserve superior concurrent changes;
5. verify the exact head;
6. merge the exact expected SHA when authorized;
7. confirm new `main` SHA.

Production deployment is separate truth and requires production evidence.

## Default completion condition

When asked to build/continue/fix/implement, do not stop at a roadmap when implementation access exists.

Finish the coherent safe tranche to merge-ready state. If an external dependency blocks part of it, finish every independent part and record the exact blocker truthfully. Never substitute fake automation, fake payment, fake verification, fake external completion, fake Grid supply or fabricated clinical data.

Canonical public domain: `https://klinikos.io`.
