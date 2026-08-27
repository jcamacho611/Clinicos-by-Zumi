# KLINIKOS CODEX OPERATING CONTRACT

Version: `2026-08-27.1`

This is the execution bootstrap for Codex working in `jcamacho611/Clinicos-by-Zumi`.

Codex is the default server/domain/security/test/release implementation lane for one Klinikos. It does not own a separate product architecture.

## 1. Start here

Before material work:

1. inspect current `main`, branch, recent commits, relevant open PRs, exact-head CI, runtime/deployment and external dependency evidence;
2. read `docs/KLINIKOS_MASTER_CANON.md`;
3. read `docs/KLINIKOS_AUTHORITY_MAP.yaml`;
4. read `docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md`;
5. read `AGENTS.md`;
6. read only specialist canons required for the task;
7. inspect overlapping Claude/ChatGPT/Symphony/other agent work before editing;
8. reverify status before claims.

Never revive an older architecture because its implementation is convenient.

## 2. Codex's default lane

Codex is the default lead for:

- Active Experience Envelope and Experience Engine infrastructure;
- identity/account/relationship/claim/verification/authority wiring;
- server-side policy and authorization;
- repositories and authoritative domain services;
- Prisma/schema/migrations/backfills;
- APIs and server actions;
- event/evidence/audit foundations;
- Grid eligibility, geospatial backend, offers/reservations/fulfillment/transaction state;
- Financial OS, billing, payment evidence, obligations, reconciliation;
- Zumi tool/action server boundaries and provider adapters;
- security, tenant isolation, minimum necessary data;
- external integration lifecycle/reconciliation;
- TDD, type/lint/test/security/build/start verification;
- release and deployment contracts.

Codex may implement UI when explicitly assigned, but when Claude is simultaneously working the experience layer, Codex should own the domain/API/projection contract and avoid competing presentation work.

## 3. Protected application order

Preserve:

`PUBLIC DISCOVERY / SEARCH / REFERRAL / INVITATION`
→ `ENTER KLINIKOS`
→ `PROTECTED ACCESS TERMS + CONFIDENTIALITY / IP / RESTRICTED-USE AIRLOCK`
→ `SIGN IN OR CREATE ONE KLINIKOS IDENTITY`
→ `BIND AGREEMENT ACCEPTANCE TO IDENTITY / SESSION`
→ `RESTORE SAFE ENTRY CONTEXT`
→ `AUTHENTICATED ZUMI`
→ `INTENT / CONTEXT DISCOVERY`
→ `CLAIMS / RELATIONSHIPS AS NEEDED`
→ `PATH-AWARE VERIFICATION`
→ `ACTIVE EXPERIENCE ENVELOPE`
→ `EXPERIENCE ENGINE`
→ `PURPOSE-BUILT EXPERIENCE PROJECTION`
→ `REAL ACTION`
→ `FULFILLMENT / OUTCOME / EVIDENCE`
→ `MEMORY / NEXT ACTION`
→ `RETURN / CONTEXT SWITCH / EXPANSION`.

Do not implement a permanent persona picker, separate identity stacks, or public-Zumi-first protected app flow.

## 4. Experience Engine backend contract

The Experience Engine is server authority for selecting and composing the minimum-necessary experience projection.

Inputs may include:

- authenticated person/account;
- assurance state;
- organization/location;
- relationships;
- patient/caregiver relationship;
- role/profession;
- claims/verification;
- licenses/credentials/privileges;
- assignments;
- delegation/supervision;
- purpose/consent;
- active patient/case/resource;
- intent;
- current work/obligations;
- entitlements;
- policy blockers;
- external dependency state;
- time/jurisdiction/risk;
- safe remembered context.

Output is a deliberate minimum-necessary Experience Contract, not a raw database graph.

It can include current context, experience family, dominant purpose/object/action, permitted workspaces, safe visible state, required verification, blockers, relevant tools, relevant Zumi capabilities, entitlement boundary, and audit requirements.

It must never serialize proprietary policy internals or unnecessary PHI merely because the UI could use them.

## 5. Purpose-built experience families are projections

Backend design must support distinct experiences without duplicating authority.

Patient, caregiver, front desk, MA, LPN, RN, NP/PA/physician, allied health, biller/coder, owner/operator, manager/admin, Grid professional, learner, instructor/preceptor, institution, network/enterprise, and protected partner contexts all project from shared canonical domains.

Do not create role-specific copies of identity, payments, tasks, scheduling, patient data, credentialing, or Zumi memory.

## 6. Identity and authority separation

Permanent law:

`IDENTITY != CLAIM != VERIFIED FACT != RELATIONSHIP != ELIGIBILITY != ENTITLEMENT != AUTHORITY`.

A claim can create contextual/network value without creating tenant access.

Email equality is not identity proof.

Organization membership is not automatically verified representation.

License verification is not all-purpose activity eligibility.

Payment/subscription is not professional or clinical authority.

Role labels are not full authorization policies.

Existing-account relationship/claim work must not silently mutate legacy tenant/session/role/provider truth.

Fail closed on ambiguous identity mappings or conflicting authority.

## 7. Browser/server confidentiality boundary

Permanent architecture:

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER-SIDE POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY DTO → BROWSER`.

Keep server-side:

- hidden Zumi prompts/orchestration/model routing;
- Grid ranking/matching/eligibility/anti-gaming rules;
- risk/fraud/trust heuristics;
- private pricing/margin/discount logic;
- secrets and credentials;
- privileged security/infrastructure information;
- unreleased business strategy;
- raw domain records where a bounded DTO suffices;
- unnecessary PHI/PII/private tenant state.

Never use frontend flags as authority.

## 8. Zumi server architecture

Zumi is Klinikos Intelligence, not authority.

Canonical action path:

`USER INTENT → PRIVACY/SECURITY GATE → ACTIVE EXPERIENCE ENVELOPE → AUTHORIZED CONTEXT → DETERMINISTIC POLICY → MODEL REASONING WHERE USEFUL → TOOL/ACTION PROPOSAL → AUTHORIZATION/HUMAN CONFIRMATION WHEN REQUIRED → DETERMINISTIC DOMAIN ACTION → VERIFIED RESULT → AUDIT/PROVENANCE → UI`.

Extend existing adapters. Do not create a second Zumi or second model client merely to move faster.

The model may interpret misspelled or incomplete language, but consequential ambiguity must remain explicit.

No model output independently proves clinical, credential, legal, financial, or transaction truth.

## 9. Grid domain law

Grid is universal healthcare demand/resource/capacity/opportunity infrastructure.

Core flow:

`NEED / HAVE → STRUCTURED DEMAND / RESOURCE → REQUIREMENTS → HARD ELIGIBILITY → CANDIDATE SET → RANK / EXPLAIN → OFFER / REQUEST → AGREEMENT → RESERVATION / ASSIGNMENT → FINANCIAL OBLIGATION → FULFILLMENT → EVIDENCE → REPUTATION / OUTCOME → REPEAT`.

Hard eligibility before ranking.

Separate:

- listing/presence;
- discoverability;
- verification;
- eligibility;
- offer;
- acceptance;
- reservation;
- fulfillment;
- obligation;
- payment evidence;
- settlement;
- reputation evidence.

No fake inventory or availability in fixtures presented as real.

Map queries and public coordinates must follow current privacy-reduction rules.

## 10. Clinical domain law

Current Visit is the provider convergence surface, but the underlying domains retain authority.

Support:

`SCHEDULE → INTAKE → STAFF HANDOFF → CURRENT VISIT → PATIENT SNAPSHOT → WHAT CHANGED → TODAY → CLINICAL → ASSESSMENT/PLAN → ORDERS/RESULTS → DOCUMENTATION/CODING → BILLING READY → REVIEW/SIGN/LOCK → FOLLOW-UP`.

Structured longitudinal change is deterministic truth.

AI may summarize but not invent clinical evidence.

Draft, review, sign, lock, addendum, and provenance remain explicit.

Telemedicine reuses the encounter model.

Orders/results maintain internal and external lifecycle truth and reconciliation work.

## 11. EDU / evidence domain law

EDU evidence is not a credentialing shortcut.

Preserve:

`LEARN → PRACTICE / SIMULATE → EVIDENCE → HUMAN REVIEW → COMPLETION / COMPETENCY → VERIFIED READINESS WHERE APPLICABLE → GRID DISCOVERY / ELIGIBILITY`.

EDU may release permitted evidence into Grid or professional context. It must not automatically create licensure, employment eligibility, or clinical authority.

Synthetic-data-first for Virtual Clinic Lab.

## 12. Financial OS law

Keep financial states semantically separate:

`PRICE != QUOTE != CHARGE != INVOICE != PAYMENT INTENT != PAYMENT EVIDENCE != ENTITLEMENT != OBLIGATION != PAYABLE != PAYOUT != SETTLEMENT != REFUND != RECONCILIATION`.

`REDIRECT != PAYMENT`.

Revenue flow:

`CARE → DOCUMENTATION → EVIDENCE → CODING → CHARGE → BILLING READINESS → CLAIM → EXTERNAL RAIL → ACCEPTANCE/REJECTION → ADJUDICATION → REMITTANCE → PAYMENT → RECONCILIATION → REVENUE INTEGRITY`.

External adapters never manufacture success. Reconcile provider callbacks/status into authoritative Klinikos state.

## 13. External integration lifecycle

Use explicit lifecycle states rather than a generic `integrated` claim.

Examples:

- PLANNED
- CONTRACT_PENDING
- CREDENTIALS_PENDING
- ADAPTER_READY
- SANDBOX
- CONNECTED
- UAT
- CONTROLLED_PRODUCTION
- PRODUCTION_VERIFIED
- DEGRADED
- DISABLED
- BLOCKED

Connected is not production verified.

Credentials are not a BAA.

Sandbox is not production.

A live key is not a complete workflow.

External failures become visible reconciliation work where operationally relevant.

## 14. Migrations and data safety

For schema work:

- prefer additive, reversible/convergent change where possible;
- inspect all existing migrations and production-schema evidence;
- never use `prisma db push` against production as a shortcut;
- run fresh full migration chain on disposable PostgreSQL before merge where applicable;
- rehearse risky/current-production compatibility on an isolated copy when available;
- preserve old authority during staged migrations;
- fail closed on ambiguous backfills;
- document exact deployment and rollback/reconciliation conditions.

## 15. Testing discipline

Use TDD for feature/bugfix behavior when feasible:

1. write focused failing contract;
2. observe intended RED state;
3. implement minimum correct behavior;
4. observe GREEN;
5. run broader affected suites;
6. run type/lint/security/build/start gates as applicable;
7. verify exact candidate head.

Do not rewrite a valid test merely because implementation conflicts with it. First determine whether the test or implementation is wrong against current canon and domain truth.

## 16. Security verification

Material server/API changes require review for:

- authentication;
- tenant isolation;
- relationship/resource authorization;
- role/permission/purpose;
- minimum necessary projection;
- PHI/PII egress;
- secrets/client bundle exposure;
- cache boundaries;
- replay/idempotency;
- rate limits/abuse;
- audit/provenance;
- error sanitization;
- external webhook verification where applicable.

## 17. Concurrency and file ownership

Before touching schema, identity, Zumi, Grid, clinical, finance, or shared server contracts, inspect open PRs.

Do not duplicate an active branch's domain engine.

When Claude is building the UX for the same tranche, agree on a minimum safe projection/API boundary and avoid editing the same presentation files unless coordinated.

When another Codex/agent branch owns the same backend authority, stack/reconcile rather than fork silently.

## 18. Required handoff

Use `docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md`.

Every material Codex handoff includes:

- objective and canon basis;
- exact base/head/PR;
- files changed;
- domain authority touched;
- what is built vs not built;
- schema/migration impact;
- authorization/security boundary;
- tests and exact results;
- external dependency truth;
- overlap/concurrency;
- next dependency-safe step;
- explicit no-claims.

## 19. Merge/readiness standard

Use:

`FETCH → COMPARE → INSPECT → PRESERVE → RE-ANCHOR → TEST → REVIEW → MERGE`.

Before merge, rebase/reconcile latest main, resolve overlap, verify exact head, and ensure PR description matches reality.

Do not equate mergeability with safety.

Do not equate old green CI with a new head.

Do not merge blocked external assumptions as fake implementation.

## 20. Closing instruction

Codex builds the governed machinery beneath Klinikos simplicity.

The backend may be complex. The user should not have to understand that complexity.

Preserve one identity, one authority fabric, one financial truth, one Grid transaction truth, one clinical truth, and one Zumi tool boundary while enabling many purpose-built experiences.