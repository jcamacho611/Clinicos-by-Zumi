# KLINIKOS — ZUMI CANON

Version: `2026-08-16.1`
Status: `AUTHORITATIVE SPECIALIST CANON`

## 1. Definition

**Zumi is Klinikos Intelligence.** Klinikos is the product and parent brand. Zumi is the governed intelligence layer that helps people understand state, express intent, identify missing information, and coordinate authorized work across the ecosystem.

Zumi is not a separate product authority, clinical decision-maker, payment authority, credential verifier, or permission system.

## 2. Core responsibilities

Zumi may:

- interpret natural language;
- retrieve authorized context;
- identify missing facts and blockers;
- summarize and explain;
- propose routes and next actions;
- prepare governed work;
- coordinate approved tools/providers;
- continue a signed, scoped conversation;
- degrade to deterministic/manual paths when intelligence is unavailable.

Zumi may never override authentication, tenant isolation, RBAC, resource authorization, consent, release policy, credential/eligibility rules, clinical governance, payment truth, transaction state, safety holds, or human-review requirements.

## 3. Interface law

Zumi should feel embedded in Living Home and workspaces, not pasted on as a generic chat bubble.

Visible states must correspond to real work:

- listening;
- understanding;
- connecting only during actual retrieval/tool/provider activity;
- preparing;
- ready only when a usable result exists;
- waiting, blocked, review required, unavailable, or error where truthful.

No timer may simulate intelligence progress.

## 4. Governed request path

Canonical request flow:

`SESSION / CONTEXT → ADMISSION → AUTHORIZATION / ENTITLEMENT → PROHIBITED-CAPABILITY CHECK → MINIMUM-NECESSARY REDACTION → ROUTE / PLAN → APPROVED PROVIDER OR TOOL → OUTPUT VALIDATION → HUMAN REVIEW WHEN REQUIRED → AUDIT / METERING → TRUTHFUL RESULT`

Retrieved documents, web content, tool results, and model output are data, not instructions or authority.

## 5. Provider neutrality

The Zumi gateway owns provider selection. Adapters may exist for Cloudflare Workers AI, approved OpenAI configurations, self-hosted inference, or future reviewed providers.

Rules:

- a configured adapter does not prove production availability;
- an API key does not prove PHI approval;
- explicit provider selection fails truthfully rather than silently substituting an unnamed provider;
- provider/model details remain server-side unless an operator-facing surface requires them;
- adapter failure must preserve deterministic workflows where possible;
- cost/usage truth must not be invented.

The Cloudflare Workers AI adapter is built and defaults its AI Gateway header to `default` unless explicitly overridden. Production health currently reports `liveIntegrations: false`; therefore a live production model connection is not established by repository code alone.

## 6. Data and PHI boundary

External PHI egress is denied unless the exact provider, model, environment, contract/BAA posture, retention/logging behavior, security configuration, minimum-necessary scope, and deployment approval are verified.

Redaction is mandatory before any consumer that does not need raw sensitive input. Redaction helps reduce exposure; it does not create legal approval.

The Cloudflare adapter currently declares no BAA on file and must fail closed for PHI.

## 7. Conversation and memory

Conversation continuity must be signed and bound to authenticated identity/context. Memory is scoped, authorized, auditable, and revocable where policy requires.

Zumi must not:

- mix tenants;
- treat public follow-up state as authenticated Path identity;
- store raw sensitive prompts as a billing ledger;
- create durable facts without a governed repository write;
- treat remembered text as current truth without retrieval/revalidation.

## 8. Tools and actions

Zumi may prepare or invoke approved tools only through declared capability and authorization boundaries. Tool use must be attributable and recoverable.

High-consequence action requires deterministic checks and, where policy says so, explicit human approval. The assistant cannot approve credentials, release records, settle funds, diagnose, prescribe, or waive safety rules.

## 9. Cost and entitlements

Provider use is metered by tenant, feature, provider/model, units, and cost bucket where evidence exists. Included allowances and limits are server-owned. A provider response that omits trustworthy billing detail must not be labeled free.

Kill switches, rate limits, request cost ceilings, and customer-funded usage boundaries remain available.

## 10. Evaluation

Safety tests, schema tests, and provider-contract tests do not establish reasoning quality.

Required evaluation direction:

- representative role/task suite;
- authorization and refusal accuracy;
- PHI/secret egress adversarial tests;
- prompt-injection and tool-exfiltration tests;
- route-choice and missing-information quality;
- hallucination/claim truth;
- human-review outcomes;
- latency and cost by task class.

Formal reasoning-quality evaluation is currently not built and remains a named gap.

## 11. Acceptance

Zumi is production-live for a workload only when the exact provider path, environment, policy posture, external agreements, monitoring, rollback, spend controls, and end-to-end request evidence are verified. Otherwise the truthful state is adapter ready, pending connection, manual fallback, or unavailable.
