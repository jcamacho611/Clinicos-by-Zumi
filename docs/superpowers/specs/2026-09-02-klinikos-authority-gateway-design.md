# Klinikos Authority Gateway Design

Status: `FOUNDER-APPROVED ARCHITECTURE — SUBORDINATE TO docs/KLINIKOS_MASTER_CANON.md`
Date: 2026-09-02
Baseline at approval: `main@16f0824db888a9887eb3e9d0a304eb802cc58cb7`

## 1. Purpose

Klinikos already has strong company truth classes, CompanyOpportunity/evidence/event persistence, Symphony outreach policy, payload-bound one-time outbound approvals, canonical ecosystem implementation states, commercial registries, and server-only confidentiality law. The remaining failure mode is that those controls are not yet composed into one mandatory preflight for every consequential external company action.

The **Klinikos Authority Gateway** is the server-owned policy composition layer that answers one question before an external company action executes:

> **Is this exact action, using this exact recipient, price, claim, disclosure, evidence set, tool, and approval state allowed right now?**

The Gateway is not a new source of product truth. It consumes existing authorities and fails closed when authority is absent, stale, contradictory, or restricted.

## 2. Governing authority and reuse law

Authority order remains:

1. current verified implementation for what exists today;
2. `docs/KLINIKOS_MASTER_CANON.md` for instituted product/company direction;
3. `docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md` for build shape;
4. machine registries and evidence stores subordinate to those documents;
5. connector/tool evidence as evidence only, never authority by itself.

The Gateway MUST **reuse and extend** rather than duplicate:

- `src/lib/company/company-truth.ts`;
- `prisma/models/company-external-opportunity.prisma`;
- `src/lib/company/symphony-opportunity-types.ts`;
- `src/lib/company/symphony-policy.ts`;
- `src/lib/company/symphony-approval.ts`;
- `src/lib/company/symphony-execution.ts`;
- `src/lib/commercial/product-catalog.ts`;
- `src/lib/commercial/klinikos-commercial.ts` until commercial convergence replaces historical duplication;
- `src/lib/commercial/stripe-commercial-projection.ts` and the catalog verifier once #498/#517 converge;
- `src/lib/ecosystem/canonical-ecosystem-graph.ts` for strategy/implementation state;
- the existing audit/evidence/event substrates;
- `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

The Gateway MUST NOT create a second CompanyOpportunity, second pricing authority, second capability graph, second outbound executor, second approval system, or second Master Canon.

## 3. Scope

### 3.1 In scope

Initial Gateway action kinds:

- `EMAIL_SEND`
- `ATTACHMENT_SEND`
- `MEETING_ACCEPT_OR_SCHEDULE`
- `PRICE_DISCLOSURE`
- `EXTERNAL_CLAIM_DISCLOSURE`
- `PROPOSAL_OR_BID_SUBMISSION`
- `APPLICATION_SUBMISSION`
- `CONTRACT_OR_COMMERCIAL_COMMITMENT`
- `PUBLICATION_OR_PUBLIC_COPY`
- `PRODUCTION_PAYMENT_CONFIGURATION_CHANGE`

The first production integration MUST be Symphony email/outbound because a real server-owned execution path already exists there.

### 3.2 Explicitly out of scope

The Gateway does not become:

- clinical authority;
- credential authority;
- medical decision authority;
- patient-consent authority;
- payer eligibility authority;
- payment system of record;
- Stripe settlement authority;
- legal counsel;
- a replacement for human signatures/attestations;
- an autonomous Canon editor.

Clinical/credential/security authorities remain in their existing deterministic domains.

## 4. Permanent founder restrictions

The following are hard policy, not prompt preferences:

### 4.1 Founder academic network no-contact rule

Klinikos MUST NOT initiate or continue company outreach to the founder's professors, instructors, or faculty members in the founder's personal academic network.

- Basic research/read-only review is allowed.
- Drafting for the founder to inspect is allowed only when it does not imply send eligibility.
- External send is `BLOCK`.
- This rule remains until a future explicit founder reversal is recorded as a newer authoritative decision.
- The rule does **not** classify every person with a professor title globally as forbidden; it applies to the founder's own academic instructors/faculty relationship.

### 4.2 Meeting rule

Klinikos MUST NOT accept, schedule, or commit the founder to a meeting without explicit founder approval bound to the specific meeting action.

The system may:

- summarize a request;
- check availability;
- recommend whether to take the meeting;
- draft possible replies;
- prepare proposed windows.

It may not externally accept or create the commitment until approval exists.

### 4.3 Trade-secret rule

Klinikos MUST NOT export crown-jewel proprietary information. An NDA does not automatically unlock crown-jewel disclosure.

## 5. Decision model

Every preflight returns exactly one decision state:

```ts
export const authorityDecisionStates = ["ALLOW", "REVIEW_REQUIRED", "BLOCK"] as const;
export type AuthorityDecisionState = (typeof authorityDecisionStates)[number];
```

Meaning:

- `ALLOW` — all mandatory authorities are satisfied for this exact action.
- `REVIEW_REQUIRED` — the action may be legitimate, but a required human/founder/legal/security/qualification decision is absent.
- `BLOCK` — policy prohibits the action or authority cannot safely be established.

No consequential action may treat `REVIEW_REQUIRED` as `ALLOW`.

## 6. Core contracts

```ts
export const authorityActionKinds = [
  "EMAIL_SEND",
  "ATTACHMENT_SEND",
  "MEETING_ACCEPT_OR_SCHEDULE",
  "PRICE_DISCLOSURE",
  "EXTERNAL_CLAIM_DISCLOSURE",
  "PROPOSAL_OR_BID_SUBMISSION",
  "APPLICATION_SUBMISSION",
  "CONTRACT_OR_COMMERCIAL_COMMITMENT",
  "PUBLICATION_OR_PUBLIC_COPY",
  "PRODUCTION_PAYMENT_CONFIGURATION_CHANGE",
] as const;

export type AuthorityActionKind = (typeof authorityActionKinds)[number];

export type AuthorityActionRequest = {
  organizationId: string;
  actorId: string;
  actionKind: AuthorityActionKind;
  opportunityId?: string | null;
  recipient?: {
    name?: string | null;
    email?: string | null;
    organizationName?: string | null;
    organizationDomain?: string | null;
    relationshipTags?: readonly string[];
  } | null;
  purpose: string;
  commercialProductKeys?: readonly string[];
  claimKeys?: readonly string[];
  disclosureItems?: readonly AuthorityDisclosureItem[];
  meeting?: {
    externalCounterparty: string;
    startsAt?: Date | null;
    endsAt?: Date | null;
    founderApprovalId?: string | null;
  } | null;
  providerId?: string | null;
  toolId?: string | null;
  payloadSha256?: string | null;
};

export type AuthorityDecision = {
  state: AuthorityDecisionState;
  reasonCodes: readonly AuthorityReasonCode[];
  reasons: readonly string[];
  evaluatedAt: Date;
  manifest: AuthorityOperatingManifest;
  evidenceReferences: readonly string[];
  requiredHumanGates: readonly string[];
};
```

## 7. Reason codes

Reason codes are machine-readable and stable enough for tests, audit, and Command projections.

Minimum initial vocabulary:

```ts
export const authorityReasonCodes = [
  "AUTHORITY_CURRENT",
  "AUTHORITY_STALE",
  "AUTHORITY_CONFLICT",
  "RECIPIENT_UNVERIFIED",
  "RECIPIENT_ROLE_STALE",
  "RECIPIENT_SUPPRESSED",
  "RECIPIENT_HARD_BOUNCED",
  "RECIPIENT_PERSONAL_ACADEMIC_NETWORK_BLOCKED",
  "CONTACT_PATH_PORTAL_ONLY",
  "CONTACT_PATH_PROHIBITED",
  "DUPLICATE_OUTREACH",
  "ACTIVE_THREAD_EXISTS",
  "FOLLOW_UP_NOT_DUE",
  "MEETING_FOUNDER_APPROVAL_REQUIRED",
  "MEETING_APPROVAL_MISMATCH",
  "COMMERCIAL_PRODUCT_UNKNOWN",
  "COMMERCIAL_STATUS_NOT_DISCLOSABLE",
  "COMMERCIAL_PRICE_CONFLICT",
  "COMMERCIAL_PRICE_CURRENT",
  "CLAIM_EVIDENCE_MISSING",
  "CLAIM_STATE_TOO_WEAK",
  "CLAIM_CURRENT",
  "DISCLOSURE_REVIEW_REQUIRED",
  "DISCLOSURE_RESTRICTED",
  "DISCLOSURE_CROWN_JEWEL_BLOCKED",
  "OFFICIAL_PROCESS_REQUIRES_OTHER_CHANNEL",
  "EXTERNAL_COMMITMENT_APPROVAL_REQUIRED",
  "PRODUCTION_PAYMENT_CHANGE_APPROVAL_REQUIRED",
] as const;
```

## 8. Commercial Authority

External price disclosure MUST resolve from the current executable commercial authority at action time.

Rules:

1. Never scrape or copy a price from historical docs, email text, lender packages, old decks, or conversation memory.
2. Never treat a Stripe object as product authority merely because it exists.
3. A price is externally usable only when the canonical product status explicitly permits the intended disclosure/sale path.
4. `TARGET`, `SCENARIO`, `RETIRED`, unresolved legacy, or conflicting values cannot be represented as a current public price.
5. If current registries disagree, exact price disclosure fails closed with `COMMERCIAL_PRICE_CONFLICT`.
6. #498 and #517 are dependencies/convergence tranches. The Gateway must consume their final merged interfaces; it must not duplicate or overwrite them.
7. Quote/contract-only products may expose safe positioning such as `custom` or approved `from` language only when the commercial registry explicitly allows it.

## 9. Recipient and Relationship Authority

The Gateway generalizes the existing Symphony contact policy.

For a send-capable action, it evaluates:

- target classification;
- fit evidence;
- official contact channel;
- recipient identity/address evidence;
- role freshness when role matters to the ask;
- founder-restricted relationships;
- hard bounces;
- suppression;
- prior touches;
- active substantive thread;
- deliberate follow-up date;
- duplicate purpose;
- procurement communication restrictions;
- sender/tool availability;
- action-specific approval.

Unknown material recipient identity or stale role evidence becomes `REVIEW_REQUIRED` or `BLOCK` according to the action's risk.

The Gateway MUST call/reuse `evaluateSymphonySendPolicy()` for Symphony email rather than reimplementing its rules.

## 10. Disclosure / IP Authority

Every externally releasable information item uses one of five disclosure classes:

```ts
export const disclosureClasses = [
  "L0_PUBLIC",
  "L1_PITCH_SAFE",
  "L2_CONTROLLED",
  "L3_RESTRICTED",
  "L4_CROWN_JEWEL",
] as const;
```

### L0 — Public

Approved website/public facts.

### L1 — Pitch Safe

High-level value proposition, public-safe product descriptions, broad architecture outcomes, approved market framing.

### L2 — Controlled

Detailed commercial/economic/pipeline/implementation information that may be shared with the correct recipient for a defined purpose after preflight.

### L3 — Restricted

Sensitive diligence, detailed contracts, non-public corporate/technical/financial evidence. Requires explicit controlled-diligence gate and purpose-specific approval.

### L4 — Crown Jewel

Never externally released through ordinary company workflows, including after NDA, unless a future explicit founder/counsel decision creates a narrowly defined exceptional process outside ordinary Gateway `ALLOW` semantics.

Examples include source code, hidden prompts, proprietary ranking/matching, fraud/trust internals, secret orchestration logic, security topology, credentials/secrets, unreleased trade-secret implementation methods, and internal exploit-sensitive details.

Any L4 item makes an ordinary external action `BLOCK`.

## 11. Product / capability claim authority

External product claims MUST derive from current implementation/evidence state, not strategy priority.

Use the canonical implementation vocabulary already in `src/lib/ecosystem/canonical-ecosystem-graph.ts`:

`LIVE_VERIFIED / BUILT_NEEDS_VERIFICATION / PARTIAL / DESIGNED / PLANNED / EXTERNAL_CONNECTION_REQUIRED / LEGAL_REVIEW_REQUIRED / NOT_BUILT / HISTORICAL_ONLY`.

Rules:

- `LIVE_VERIFIED` may support direct present-tense claims when the cited runtime/evidence is current.
- `BUILT_NEEDS_VERIFICATION` may support carefully qualified built/not-yet-live wording.
- `PARTIAL` requires bounded wording naming the implemented portion.
- `DESIGNED` and `PLANNED` must be future/roadmap language.
- `EXTERNAL_CONNECTION_REQUIRED` may not be described as an active production integration.
- `LEGAL_REVIEW_REQUIRED` may not be sold as an active regulated capability.
- `NOT_BUILT` and `HISTORICAL_ONLY` may not be represented as current functionality.

A new adapter may map canonical ecosystem/evidence state into external-safe claim language, but it may not create a second capability graph.

## 12. Freshness and operating manifest

Every preflight includes an `AuthorityOperatingManifest` describing the exact authority snapshot used.

```ts
export type AuthorityOperatingManifest = {
  evaluatedAt: Date;
  releaseSha: string | null;
  canonVersion: string;
  authorityMapVersion: string;
  commercialAuthorityVersion: string | null;
  capabilityGraphVersion: string | null;
};
```

Freshness rules are source-specific, not one arbitrary global TTL.

- Current price: resolve from current server-owned registry on every consequential action.
- Current implementation claim: invalidate/recheck after a newer release or when cited runtime evidence expires/supersedes.
- Recipient role/address: reverify before first consequential outreach and whenever the stored evidence is beyond its policy review window or contradictory evidence exists.
- Procurement contact/channel: verify from the current solicitation/process before send.
- Legal/regulatory/current-program terms: require current official or approved evidence for the action.
- Opportunity/cash/contract truth: use CompanyOpportunity evidence and supersession/expiry rules.

`UNKNOWN`, `STALE`, `CONFLICTED`, and `BLOCKED` remain distinct states.

## 13. Meeting and commitment authority

Meeting acceptance/scheduling and external commitments always require action-bound approval.

A prior generic instruction such as “handle meetings” is not enough.

The approval must identify the action/counterparty and be unexpired/unrevoked. The first implementation may reuse the same payload-binding/idempotent-consumption pattern as `symphony-approval.ts`, but meeting approval uses a distinct scope and cannot be confused with email-send approval.

## 14. Preflight sequence

The canonical company-side sequence is:

```text
INTENT / PREPARED ACTION
→ RESOLVE CURRENT OPERATING MANIFEST
→ RESOLVE ACTOR / TENANT
→ RESOLVE OPPORTUNITY / PURPOSE / OFFICIAL PROCESS
→ RESOLVE RECIPIENT + RELATIONSHIP + CONTACT HISTORY
→ RESOLVE COMMERCIAL AUTHORITY WHEN MONEY/PRICE IS PRESENT
→ RESOLVE CAPABILITY/CLAIM EVIDENCE WHEN CLAIMS ARE PRESENT
→ RESOLVE DISCLOSURE CLASSIFICATION FOR BODY/ATTACHMENTS
→ RESOLVE MEETING / COMMITMENT / SIGNATURE GATES
→ REUSE DOMAIN-SPECIFIC POLICY (e.g. Symphony send policy)
→ VALIDATE ACTION-BOUND APPROVAL WHEN REQUIRED
→ ALLOW / REVIEW_REQUIRED / BLOCK
→ EXECUTE THROUGH EXISTING DOMAIN EXECUTOR ONLY IF ALLOW
→ RECORD RESULT / EVIDENCE / DELIVERY
```

The Gateway never sends email, creates calendar events, changes Stripe, or submits applications itself. It authorizes an existing executor.

## 15. Audit and persistence

Do not create a universal shadow database of all actions.

- CompanyOpportunity-related decisions should record authority results as CompanyOpportunity events/evidence when a durable record is materially useful.
- Existing domain audit/event systems remain authoritative for their own actions.
- Gateway decisions include stable reason codes and evidence references so the durable domain event can preserve why an action was allowed or blocked.
- A transient blocked preflight need not become a new business object merely to exist.

## 16. Command / founder visibility

Company Command may project Authority Gateway health, but does not become authority itself.

Recommended read-only initial metrics:

- pricing authority conflicts;
- stale recipient evidence;
- blocked restricted contacts;
- pending meeting approvals;
- claim-evidence gaps;
- disclosure blocks;
- stale implementation claims;
- open commercial-registry drift;
- preflight outcomes by reason code.

The UI must not expose crown-jewel policy internals or secret security topology.

## 17. Innovation intake boundary

The Gateway does not autonomously change product law.

New product/technical/market discoveries go through the existing Canon new-discovery protocol:

`CLASSIFY → VERIFY → COMPARE → ACCEPT / REJECT / MODIFY → UPDATE MASTER CANON IF ACCEPTED → UPDATE BLUEPRINT CONSEQUENCES → IMPLEMENT → TEST → VERIFY → RECORD EVIDENCE`.

A separate **Innovation Radar** implementation may automate discovery capture, evidence, scoring, and review workflow. It remains subordinate to this protocol and cannot auto-promote a discovery into Canon.

## 18. Security properties

- Authority evaluation is server-only.
- Browser state is never authority.
- Secret prompts, proprietary rankings, trade-secret policy detail, credentials, and raw internal evidence remain server-side.
- Client receives only minimum-necessary decision/presentation DTOs.
- Every executor must be able to prove which preflight decision authorized the consequential action.
- Approval IDs are purpose/action bound, expiry bound, actor bound, tool/provider bound where applicable, and consumed idempotently.
- Missing evidence fails closed for high-consequence actions.

## 19. Acceptance tests

The Authority Gateway is not complete until the following behavior is mechanically proven:

```text
OLD / RETIRED / SCENARIO PRICE → BLOCK OR REVIEW; NEVER CURRENT PRICE
CONFLICTING CURRENT PRICE SOURCES → BLOCK EXACT PRICE DISCLOSURE
FOUNDER'S PROFESSOR / INSTRUCTOR → BLOCK SEND
HARD-BOUNCED ADDRESS → BLOCK SEND
SUPPRESSED ADDRESS → BLOCK SEND
PORTAL-ONLY PROCUREMENT → BLOCK EMAIL SEND
ACTIVE SUBSTANTIVE THREAD → BLOCK NEW COLD THREAD
DUPLICATE PURPOSE BEFORE FOLLOW-UP DATE → BLOCK
MEETING ACCEPTANCE WITHOUT FOUNDER APPROVAL → BLOCK
MISMATCHED MEETING APPROVAL → BLOCK
L4 CROWN-JEWEL DISCLOSURE → BLOCK EVEN IF NDA EXISTS
L3 RESTRICTED DISCLOSURE WITHOUT CONTROLLED-DILIGENCE APPROVAL → REVIEW/BLOCK
TEST STRIPE OBJECT CLAIMED AS LIVE MONEY → BLOCK CLAIM
PLANNED FEATURE CLAIMED AS LIVE → BLOCK CLAIM
BUILT BUT UNVERIFIED FEATURE CLAIMED AS LIVE_VERIFIED → BLOCK CLAIM
MERGED CODE CLAIMED AS DEPLOYED WITHOUT RUNTIME EVIDENCE → BLOCK CLAIM
STALE RECIPIENT ROLE → REVERIFY / REVIEW
CURRENT VERIFIED SAFE ACTION WITH REQUIRED APPROVAL → ALLOW
```

## 20. Rollout order

1. Canon/authority-map synchronization for this approved law.
2. Pure server-only Authority Gateway contract and decision composition.
3. Recipient/relationship policy adapter over existing Symphony policy.
4. Meeting/commitment approval scope.
5. Disclosure/IP classifier and attachment preflight.
6. Commercial authority adapter after/with #498 + #517 convergence.
7. Capability/claim evidence adapter over canonical ecosystem graph + verified evidence.
8. Operating manifest/freshness checks.
9. Integrate Gateway into `executeSymphonyEmail()` before send.
10. Add other external-action executors one at a time.
11. Add Command projection.
12. Red-team all acceptance cases.

## 21. Definition of success

The upgrade succeeds when consequential external actions no longer depend on an agent remembering scattered instructions. The system itself must resolve the current authority, detect stale/conflicting evidence, enforce permanent restrictions, require approval where necessary, protect crown jewels, and fail closed before execution.