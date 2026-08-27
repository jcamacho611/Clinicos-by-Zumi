# KLINIKOS SYMPHONY EMAIL-ONLY CONTROL PLANE

Status: V1 FOUNDATION IMPLEMENTED / EXECUTABLE VERIFICATION BLOCKED
Date: 2026-08-27
Repository branch: `design/symphony-email-capital-engine-20260827`

## 1. Purpose

Symphony is Klinikos company-execution orchestration for capital, revenue, procurement, partnerships, accelerators, investors, incentives, and startup-friendly financing.

It is not:

- another CRM;
- another Zumi;
- a second capital register;
- a second prospect database;
- a bulk-mail sender;
- a substitute for legal, financial, identity, clinical, or securities authority.

The first operating loop is:

`OPPORTUNITY → CLASSIFY → VERIFY FIT → CHECK HISTORY → EMAIL-FIRST DECISION → PREPARE → POLICY CHECK → SEND OR HOLD → PROVIDER EVIDENCE → FOLLOW-UP → RESPONSE / REFERRAL → NEXT GOVERNED ACTION → USER GATE IF REQUIRED`

The practical objective is to move each qualified opportunity as far as possible before requiring founder action.

## 2. What v1 implements

### Typed opportunity and target classes

Implemented in:

- `src/lib/company/symphony-opportunity-types.ts`

Symphony classifies work into:

- customer revenue;
- grants/non-dilutive capital;
- government contracts;
- workforce/institutional opportunities;
- accelerator programs;
- investors;
- partnerships;
- credits/incentives;
- lender/CDFI opportunities;
- other review-required opportunities.

Each class maps back into the existing company-control registers. Symphony does not create a new authoritative business-truth taxonomy.

### Outbound policy and deduplication

Implemented in:

- `src/lib/company/symphony-policy.ts`

The policy fails closed for:

- unknown targets;
- competitors without an explicitly approved strategic partnership purpose;
- unverified opportunity fit;
- portal-only or contact-prohibited processes;
- founder-restricted personal-network contacts;
- hard-bounced addresses;
- suppressed addresses;
- active substantive threads;
- duplicate first-touch purposes before the deliberate follow-up window;
- completed ordinary follow-up sequences without new evidence;
- expired opportunities.

When the message is otherwise eligible but no verified sender is available, Symphony produces `READY_TO_SEND_CONNECTION_REQUIRED`, not a false send claim.

### Explainable opportunity priority

Implemented in:

- `src/lib/company/symphony-priority.ts`

Priority uses deterministic factors for:

- evidence-backed fit;
- eligibility confidence;
- urgency/deadline;
- potential value signal;
- strategic multiplier;
- effort burden;
- repayment/dilution/commitment burden;
- founder-only action burden;
- relationship state.

A substantive reply, referral, requested proposal, or diligence request receives a major priority advantage over unrelated cold outreach.

The scoring formula is internal company logic and should remain server-side.

### Truthful message families

Implemented in:

- `src/lib/company/symphony-message-builder.ts`

The builder supports:

- funding/program routing;
- government procurement;
- workforce/institutional;
- customer/pilot;
- accelerator fit;
- investor thesis fit;
- lender pre-screen;
- partnership/teaming;
- referral follow-up;
- response to requested information.

It accepts an explicit company profile containing verified current/executed facts plus separately labeled future vision. It rejects proposed statements placed inside the verified-fact channel.

The builder is deliberately not allowed to treat chat memory as corporate truth.

### Governed execution

Implemented in:

- `src/lib/company/symphony-execution.ts`

The execution function:

1. evaluates policy;
2. blocks prohibited outreach before sender invocation;
3. builds a message from verified company input;
4. returns a ready-to-send draft when the sender is unavailable;
5. invokes an injected sender only when policy allows;
6. records provider failure as failure;
7. records `PROVIDER_ACCEPTED` only when a real provider reference is returned;
8. schedules the default first follow-up three days after accepted delivery.

### Existing outbound port reuse

Implemented in:

- `src/lib/company/symphony-outbound-adapter.ts`

This adapter delegates to:

- `src/lib/communications/outbound.ts`

Symphony therefore does not invent a second email-delivery truth source.

## 3. Truth hierarchy

The following distinctions are permanent:

`EMAIL_PREPARED ≠ PROVIDER_ACCEPTED`

`PROVIDER_ACCEPTED ≠ RESPONSE_RECEIVED`

`RESPONSE_RECEIVED ≠ APPLICATION_SUBMITTED`

`APPLICATION_SUBMITTED ≠ AWARD`

`AWARD / CONTRACT ≠ CASH RECEIVED`

Capital, contract, and customer truth must ultimately be supported by the governing financial, contractual, or provider evidence.

## 4. Existing company registers remain authoritative

Symphony maps into the existing company execution framework rather than replacing it.

Relevant existing registers include:

- Customer / Prospect;
- Offer / Pricing;
- Contract;
- Capital Opportunity;
- Lender Readiness;
- Investor Evidence;
- Partnership;
- EDU Institutional Pipeline;
- Customer Value Evidence;
- Decision.

The governing definitions remain:

- `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md`
- `src/lib/company-execution-control-plane.ts`

## 5. Email-first law

Before asking the founder to complete a full application, Symphony should determine whether a legitimate professional contact can first:

- confirm fit;
- identify the correct program;
- identify a real decision-maker;
- make an introduction;
- pre-screen lender eligibility;
- explain required evidence;
- identify a procurement or subcontracting path;
- request a deck/capability statement;
- request a proposal;
- invite an application.

This is especially useful for SBA/resource partners, SBDCs/APEX, NIH/NSF/state program officers, economic-development agencies, health/workforce agencies, procurement offices, CDFIs, accelerators, investors, primes/teaming partners, and healthcare buyers.

Email-first never overrides a solicitation that requires a portal-only process or restricts communications.

## 6. Founder-only gates

Symphony may prepare work but must stop before actions requiring the founder's non-delegable authority, including:

- SSN or highly sensitive identity information;
- government-ID verification;
- MFA/device confirmation;
- personal bank login;
- personal financial attestation;
- hard-credit authorization;
- personal guarantee;
- collateral pledge;
- binding legal certification;
- contract signature;
- final debt acceptance;
- binding commercial terms outside approved authority;
- equity issuance;
- SAFE/note/warrant/options acceptance;
- valuation/investor-rights/securities acceptance;
- irreversible third-party commitments.

The eventual operator experience should reduce these to one clear instruction rather than returning the founder to complete the whole workflow manually.

## 7. Runtime email truth

The current authoritative external-dependency matrix describes transactional email as `Configurable / Pending connection`.

The current application outbound port includes a Resend adapter, but code or configuration presence is not proof that a production sender is verified live.

Therefore:

- v1 does not claim production autonomous email is live;
- v1 fails closed when the sender is unavailable;
- a real provider reference is required before Symphony claims provider acceptance;
- no current Outlook production adapter is claimed.

The Outlook mailbox connected to ChatGPT is an authorized operator tool in this conversation. It is not automatically a deployed Klinikos runtime dependency.

A future Microsoft Graph/Outlook adapter may be added behind the existing outbound interface after credentials, permissions, security review, environment truth, and runtime evidence are established.

## 8. What v1 intentionally does NOT implement

The following are not claimed complete:

- autonomous web opportunity discovery inside the deployed application;
- a production mailbox reader;
- automatic reply ingestion from Outlook;
- persistent Symphony-specific database tables;
- a Symphony dashboard/UI;
- autonomous form/portal completion;
- automated calendar booking;
- automatic attachment/data-room delivery;
- production-verified Resend or Outlook sending;
- continuous background operation;
- award, contract, revenue, or funding evidence from an email alone.

These are later tranches and must reuse governing systems rather than create parallel authority.

## 9. Persistence decision

No Prisma migration is added in v1.

Before adding persistence, reconcile what already exists in:

- current customer/prospect persistence;
- company-control registers;
- funding/outreach execution documents;
- mailbox evidence;
- existing sales/commercial persistence.

Only add an additive storage model if a required durable fact cannot be represented without ambiguity.

Any eventual persistence must preserve:

- opportunity identity;
- organization/contact identity;
- outreach purpose;
- source and provenance;
- state/event history;
- provider/reference evidence;
- bounce/suppression state;
- response classification;
- next action and owner;
- user-action gate;
- truth class;
- evidence reference.

## 10. Test and release truth

The behavioral contract is:

- `tests/symphony-email-capital-engine.test.ts`

It was committed before the production Symphony modules.

However, GitHub Actions is currently blocked before checkout because the private repository cannot obtain a hosted runner. The repository's own workflow records this as `runner_id: 0` / no steps executed.

No Replit mirror of the Klinikos repository was found through the connected Replit account.

Therefore this tranche must NOT be described as:

- tests green;
- type-check green;
- lint green;
- build green;
- CI green;
- production deployed;
- production live.

The candidate remains a draft until an executable exact-head environment runs the focused Symphony test plus the repository's normal type, lint, security, test, and build gates.

## 11. Next implementation tranche

After exact-head verification, the next highest-value Symphony work is:

1. reconcile existing company/prospect/outreach persistence;
2. define a normalized inbound mailbox event contract;
3. add an authorized mailbox adapter without widening authority;
4. classify replies, referrals, bounces, requests, and acknowledgments;
5. update existing registers from verified events;
6. add application orchestration that stops only at founder-only gates;
7. expose a minimum-necessary operator queue showing `READY`, `WAITING`, `BLOCKED`, and `ACTION REQUIRED` rather than internal strategy or proprietary scores.

## 12. Final operating rule

Symphony is successful when it converts qualified opportunities into:

- human responses;
- introductions;
- confirmed eligibility;
- requested applications;
- requested proposals;
- lender pre-screens;
- diligence;
- meetings;
- customer pilots;
- government opportunities;
- executed contracts;
- verified funding or revenue.

Raw email count is not the objective.
