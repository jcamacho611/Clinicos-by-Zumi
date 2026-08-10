# Zumi — the governed AI layer

Zumi is the operational intelligence layer inside Klinikos. This document describes
what it is permitted to do, what it is structurally prevented from doing, and how the
code enforces the difference.

Everything below is implemented. Where something is not, it says so.

## What Zumi is

Zumi observes clinic operations and raises work: what is overdue, what is unassigned,
what is missing, what is waiting, what looks anomalous, what is an opportunity, what
needs review, what is expiring. It summarizes, correlates, prioritizes, and explains.

## What Zumi is not

Zumi does not practise medicine and does not act on a clinic's behalf in any matter
where being wrong is not recoverable.

Nine capabilities are prohibited outright:

| Prohibited | |
| --- | --- |
| `diagnose` | `release_records_autonomously` |
| `prescribe` | `submit_claim_autonomously` |
| `interpret_result_as_final` | `approve_credential_autonomously` |
| `decide_treatment` | `authorize_care` |
| `guarantee_coverage` | |

These are enumerated in `src/features/zumi/schemas.ts` as `ZUMI_PROHIBITED` and
refused by `admitZumiRequest` **before any other check runs** — before the capability
catalog, before permissions, before entitlements, before the provider is consulted.

The ordering is deliberate. If availability were checked first, a prohibited request
in an unconfigured deployment would be refused with "Zumi is not connected", which
reads as a temporary outage and invites a retry once configuration lands. It is not a
configuration question, so it is not answered after a configuration check.

There is no entitlement, no role, and no configuration flag that unlocks any of them.

## The admission sequence

`src/features/zumi/policy.ts` is the single decision point. It is pure and
synchronous, so every branch is testable without a database, a session, or a provider.

1. **Prohibition** — the list above.
2. **Catalog** — eighteen declared capabilities in `zumiCapabilities`. A capability
   that is not declared cannot be invoked. Adding an AI surface means declaring it,
   which forces its risk tier, entitlement, and permission to be decided deliberately
   rather than inherited by accident.
3. **Tenant** — the organization named on the request must match the session's. The
   HTTP route does not accept an organization id at all; it passes the session's.
4. **Permission** — a universal `ai:read` baseline, then the capability's own
   requirement. Requirements are typed against the product's `ClinicResource` /
   `ClinicAction` vocabulary, so a capability that asks for a permission that does not
   exist is a compile error rather than a check that silently passes.
5. **Entitlement** — what the clinic bought. Denials here are **402**, not 403: they
   are payment-resolvable, not forbidden.
6. **Availability** — whether a provider is actually connected. **503.**

Zumi never widens what a role can already do. A user who cannot update a document
cannot have Zumi write draft metadata onto one for them.

## Risk tiers and human review

| Tier | Meaning | Human review |
| --- | --- | --- |
| LOW | Reads and explains state the user can already see | Not required |
| MEDIUM | Produces a draft or a suggestion | **Required** |
| HIGH | Prepares a proposal for a person to authorize | **Required** |

`requiresHumanReview` is derived from the tier by `requiresHumanReviewForTier`. It is
never accepted from the caller.

Every HIGH-tier capability is named `propose_*`. That naming is the contract: Zumi
prepares these, a person performs them. A test asserts it, so a HIGH-tier capability
that was going to *do* something cannot be added without the assertion failing.

## The governed output contract

Every meaningful Zumi recommendation carries source, reason, evidence, owner, review
posture, and a suggested action. `validateRecommendation` rejects:

- a recommendation with no evidence — that is an assertion, not a recommendation;
- a MEDIUM or HIGH capability whose output does not require human review;
- an urgent signal that does not say what to do;
- a recommendation naming a capability that does not exist.

Model output that fails the contract is **dropped, not repaired**. A recommendation
with invented evidence is worse than no recommendation, and quietly patching one would
hide that the model failed to follow the contract.

Confidence is never a bare number. It is `{ level, basis }` — an unexplained
confidence score is worse than none.

## Egress and redaction

`src/features/zumi/redaction.ts` runs before anything leaves for a model provider.

- Identifier shapes are scrubbed from free text: SSN, email, phone, date of birth,
  MRN, member/policy id, NPI, card-length digit runs.
- Object **keys** that announce sensitive content are dropped entirely rather than
  pattern-matched — a free-text `note`, `diagnosis`, or `narrative` cannot be reliably
  scrubbed, so it does not leave. Key names are preserved elsewhere because keys are
  schema and values are content.
- After building the prompt, `containsLikelyIdentifiers` re-checks it. If anything
  identifier-shaped survived, **the request is abandoned rather than sent**. Failing
  closed costs an answer; failing open costs a disclosure.
- Model prose is scrubbed again on the way back. A provider echoing an identifier out
  of its own context window is a real path back in.

**Redaction is not a BAA.** `REDACTION_LIMITATION_NOTICE` says so in the code, and
`phiEgressPermitted` requires two independent conditions before PHI may reach a
provider: the adapter declares a signed Business Associate Agreement, **and** the
deployment sets `ZUMI_PHI_EGRESS_APPROVED=1`. Neither alone is enough. The default is
no.

## Providers

`src/features/zumi/providers.ts` is the only place a model SDK may live. Nothing else
in the codebase is permitted to hold one, because scattered calls make redaction
before egress and an audit record after impossible to guarantee.

| State | Meaning |
| --- | --- |
| `NOT_CONFIGURED` | Registered, credentials absent. Reports Pending Connection. |
| `CONFIGURED` | Credentials present, not yet exercised in this process. |
| `HEALTHY` / `DEGRADED` | Reserved for live health reporting. |
| `ERROR` | Unusable. |
| `DISABLED` | `ZUMI_DISABLED` is set for this deployment. |

Behaviour that matters:

- A blank-string credential counts as absent.
- `ZUMI_PROVIDER` names an adapter explicitly. If it names one that is not
  registered, selection **errors** — it never silently substitutes another.
- `ZUMI_DISABLED` is a deployment kill switch that stops all AI egress without a
  redeploy. It overrides present credentials.
- There is no canned-response fallback. A deployment with no provider answers
  "Pending Connection", not a fabricated result that would make a demo look live.

### Current status: **ADAPTER READY — no provider registered**

No provider adapter is registered in this repository. `zumiGatewayStatus()` therefore
reports `available: false` in every environment today, and every Zumi request is
refused with 503. That is the honest state, and it is what the EDU surfaces render.

Registering a provider requires a contracted, approved vendor — see
`docs/EXTERNAL_DEPENDENCY_MATRIX.md`.

## Audit and metering

`ZumiInvocation` records every invocation, **including refusals**: capability, tier,
outcome, reason, provider, model, tokens, cost in integer micro-USD, duration, whether
human review was required, whether redaction fired, and which keys were dropped
(names only, never values). A matching `AuditLog` row is written with
`action: "zumi.<outcome>"`.

The table deliberately stores **no prompt text and no model output**. The operational
question it answers is "was this governed", not "what did it say", and a table of
prompts is a table of exactly the content the redaction layer exists to keep out of
places it does not belong.

A metering write that fails is logged and does not turn a successful, governed answer
into an error for the operator.

## HTTP surface

`POST /api/zumi` is the only HTTP entry point. Its request body accepts a capability,
a question, and structured context — and deliberately **cannot** name an organization,
a role, an entitlement, or a review posture. All four are resolved server-side from
the signed session.

`GET /api/zumi` returns gateway status and the capability catalog with per-capability
entitlement flags. The catalog is descriptive, not a grant: a capability listed there
is still subject to every check when it is actually invoked.

Entitlements resolve from `ClinicSubscription.modules` via
`entitlementsFromSubscriptions`, which does not trust the status column on its own —
an expired trial or billing period does not entitle whatever the column still says. A
database read failure resolves to no entitlements, failing in the recoverable
direction.

## What is not built

- **No provider adapter.** Blocked on a contracted vendor and, for any PHI workload, a
  BAA.
- **No streaming.** Responses are single-shot.
- **No retry policy.** A provider failure is reported, not retried; retrying an
  un-idempotent governed call needs a design decision, not a default.
- **`HEALTHY` / `DEGRADED` are declared but never assigned** — live health probing is
  not implemented, so a configured provider reports `CONFIGURED` until it is used.
- **No prompt-level evaluation harness.** The contract is enforced structurally on
  output; the quality of reasoning is not yet measured.

## Tests

`tests/zumi-gateway.test.ts` — 41 assertions covering the prohibition list and its
ordering, the catalog invariants, tenant and permission and entitlement denials, the
recommendation contract, redaction including the key-dropping and re-check behaviour,
provider selection and the kill switch, PHI egress, and entitlement resolution.

A prohibition nobody tests is a paragraph.
