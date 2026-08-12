# Zumi — governed operating intelligence

Zumi is the operational intelligence layer inside Klinikos. It observes authorized
operational state, explains what needs attention, and prepares bounded work. It is not
a clinician, medical authority, payment authority, credentialing authority, or a way
around tenant scope, RBAC, entitlements, privacy, or human review.

This document is an implementation record. Status words mean exactly:

- **IMPLEMENTED** — enforced in the current codebase.
- **PARTIAL** — a real slice exists but the full agent capability does not.
- **BLOCKED** — code intentionally cannot proceed until an external/compliance gate is satisfied.
- **PLANNED** — not implemented yet.

## Constitutional boundaries — IMPLEMENTED

`src/features/zumi/schemas.ts` enumerates capabilities that Zumi is never allowed to
perform autonomously:

- `diagnose`
- `prescribe`
- `interpret_result_as_final`
- `decide_treatment`
- `guarantee_coverage`
- `release_records_autonomously`
- `submit_claim_autonomously`
- `approve_credential_autonomously`
- `authorize_care`

`src/features/zumi/policy.ts` refuses prohibited requests before provider availability,
entitlements, or any other recoverable condition. There is no role, payment, feature
flag, or provider configuration that unlocks them.

## Admission sequence — IMPLEMENTED

Every Zumi request is admitted in this order:

1. prohibition
2. declared capability
3. tenant
4. permission
5. entitlement
6. provider availability

The browser cannot name the organization, role, entitlement, or review posture for
`POST /api/zumi`. Those are resolved server-side from the authenticated session and
server-owned subscription state.

Zumi never widens what a role can already do.

## Risk and human review — IMPLEMENTED

| Tier | Meaning | Human review |
| --- | --- | --- |
| LOW | Read/explain authorized operational state | Not inherently required |
| MEDIUM | Draft/suggest | Required |
| HIGH | Prepare a consequential proposal | Required |

HIGH capabilities are proposal capabilities. The model does not gain execution
permission because it generated a valid answer.

## Grounded recommendation contract — IMPLEMENTED

A governed recommendation carries evidence/provenance and must satisfy the typed
contract in `src/features/zumi/schemas.ts`. Invalid model output is dropped rather than
quietly repaired into something that looks trustworthy.

The output contract rejects, among other things:

- recommendations with no evidence;
- unknown capabilities;
- MEDIUM/HIGH output that incorrectly claims no human review is needed;
- urgent signals with no suggested next action.

Confidence is represented with a level plus an explicit basis, not a bare probability.

## Egress redaction — IMPLEMENTED

`src/features/zumi/redaction.ts` scrubs identifier-shaped content and drops sensitive
free-text fields before model egress. The final prompt is checked again and the call is
abandoned if likely identifiers remain. Model prose is scrubbed again on return.

**Redaction is not authorization to process PHI.**

`phiEgressPermitted` currently requires both:

1. the selected adapter declares its required Business Associate Agreement is on file;
2. the deployment explicitly sets `ZUMI_PHI_EGRESS_APPROVED=1`.

The self-hosted adapter intentionally declares `baaOnFile: false` today. This is
conservative by design: operating the hardware ourselves does not by itself prove the
storage, network, logging, access-control, backup, incident-response, and legal posture
is approved for protected health information. A future provider-assurance refactor can
model first-party infrastructure directly, but it must not weaken the present default.

## Provider boundary — IMPLEMENTED

`src/features/zumi/providers.ts` is the governed provider registry. Direct model calls
from UI code are not permitted.

Provider behavior that is enforced:

- blank required configuration is absent;
- `ZUMI_PROVIDER` is explicit and never silently substituted;
- `ZUMI_DISABLED` is a deployment kill switch;
- an unconfigured deployment reports **Pending Connection** instead of fabricating a result;
- provider failures are surfaced as governed failures, not fake success;
- audit/metering records provider, model, token usage, cost field, duration, outcome,
  redaction posture, and human-review posture without persisting prompt/model text.

### Self-hosted Zumi inference — IMPLEMENTED FOUNDATION

`src/features/zumi/adapters/self-hosted.ts` provides the first built-in production
adapter. It targets a Klinikos-operated OpenAI-compatible
`POST /v1/chat/completions` endpoint using native `fetch`, so the application does not
need a vendor SDK.

Configuration:

- `ZUMI_PROVIDER=self_hosted`
- `ZUMI_SELF_HOSTED_BASE_URL`
- `ZUMI_SELF_HOSTED_MODEL`
- optional `ZUMI_SELF_HOSTED_API_KEY` for an authenticated internal inference service
- `ZUMI_DISABLED` remains the global kill switch

The underlying serving engine can change without changing the Klinikos gateway as long
as the internal endpoint preserves the adapter contract.

The adapter records `costMicroUsd: 0` because that field represents external
per-invocation model charges. Self-hosted compute is still real infrastructure cost and
must be metered separately rather than pretending it is free.

External model companies remain optional future adapters, not the canonical Zumi brain.

## External connector integrity — IMPLEMENTED FOUNDATION

`src/lib/connectors/taxonomy.ts`, `catalog.ts`, and `status.ts` separate five independent
questions for every external dependency:

1. which server gateway owns it;
2. how it is wired;
3. whose account/authorization owns it;
4. who bears its variable cost and when;
5. which readiness gates have actually passed.

Readiness has nine independent gates: configuration, sandbox readiness, contract,
BAA, security review, enrollment, production credentials, explicit PHI approval, and
production-live status.

**Configuration is not approval.** A working key cannot promote a connector to
production or PHI use. Runtime status returns missing environment-variable names only,
never credential values. Browser credentials are limited to the separately restricted
Google Maps rendering exception; PHI-bearing connectors have no public credential path.

## Tenant isolation — IMPLEMENTED + STRUCTURALLY TESTED

Authenticated API routes derive organization and human actor identity from the session.
`tests/tenant-isolation.test.ts` scans the route surface so a new authenticated handler
cannot quietly start accepting tenant identifiers or decision-maker identities from a
request body. EDU institution/cohort filters also fail closed when scope cannot be
resolved.

## Audit and metering — IMPLEMENTED

`ZumiInvocation` records admitted, denied, and failed invocation metadata without
storing prompt text or model output. A corresponding audit event is written for the
operational history. The purpose is to prove governance and usage, not to create a
shadow database of model conversations containing sensitive content.

## Current capability status

| Layer | Status | Notes |
| --- | --- | --- |
| Constitutional prohibitions | IMPLEMENTED | Absolute, tested |
| Tenant/RBAC/entitlement admission | IMPLEMENTED | Server-owned |
| Redaction and PHI fail-closed policy | IMPLEMENTED | Self-hosting does not bypass it |
| Provider-neutral governed gateway | IMPLEMENTED | Current request shape is single-turn |
| Self-hosted inference adapter | IMPLEMENTED | OpenAI-compatible internal endpoint |
| Connector readiness taxonomy | IMPLEMENTED | Nine independent gates |
| Invocation audit/metering | IMPLEMENTED | No prompt/output persistence |
| Typed multi-turn provider messages | PLANNED | Current provider request is single-turn |
| Central typed Zumi tool registry | PLANNED | Required before agentic tool use |
| Bounded multi-turn agent runtime | PLANNED | No autonomous loop yet |
| Read-only Klinikos operational tools | PLANNED | Repository data exists; Zumi tools do not yet |
| Persisted action proposals/approvals | PLANNED | Existing product approvals are not yet one Zumi action framework |
| Consequential action verification | PLANNED | Must read back authoritative state after writes |
| Proactive event-driven Zumi follow-through | PLANNED | Deterministic product workflows exist separately |
| Prompt-level evaluation harness | PLANNED | Structural tests exist; reasoning quality evals do not |
| Model specialization/fine-tuning | PLANNED | Only after datasets/evals are mature |
| PHI use by self-hosted model | BLOCKED | Requires explicit first-party infrastructure assurance design/review |

## Next engineering dependency

The next safe dependency is not “give the model more power.” It is a provider-neutral
multi-turn contract plus a central typed tool registry. Only after tools independently
enforce tenant, RBAC, entitlement, policy, validation, provenance, and side-effect
classification should the bounded `ZumiAgentRuntime` be allowed to call them.

A prohibition nobody tests is a paragraph. A capability nobody can verify is a demo.
Zumi should earn execution authority one reversible, source-backed action class at a
time.
