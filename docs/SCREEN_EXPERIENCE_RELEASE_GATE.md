# Klinikos Screen Experience Release Gate

Status: `AUTHORITATIVE IMPLEMENTATION GATE`  
Date: 2026-08-26

This document operationalizes `docs/KLINIKOS_EXPERIENCE_ENVELOPE_AND_ZUMI_DATA_GOVERNANCE.md`.

## Release law

Every real user-facing `src/app/**/page.tsx` surface MUST resolve to exactly one Screen Experience Contract before merge.

A page is not production-complete merely because it renders. Its governing contract must declare, directly or by an intentionally shared screen family:

- what is visible by default;
- what is intentionally hidden;
- what may be discovered or promoted;
- eligibility, entitlement and authority boundaries;
- the minimum-necessary data projection;
- permitted actions;
- what Zumi may read, infer, recommend, draft and execute through authorized tools;
- what Zumi is forbidden to do;
- AI-processing purpose, agreement basis, allowed/prohibited data classes and PHI gate;
- model-training default;
- audit and provenance requirements;
- commercial-targeting boundary;
- denied, blocked, loading, empty and error behavior;
- mobile and accessibility requirements.

## Mechanical enforcement

Authority files:

- `src/lib/screen-experience-contracts.ts` — detailed screen-family contracts.
- `src/lib/screen-experience-route-registry.ts` — explicit source-path-to-contract bindings.
- `tests/screen-experience-route-coverage.test.ts` — walks the real route tree and requires exactly one contract per page.

A zero-match page is a release blocker.

A multi-match page is a release blocker because competing contracts create ambiguous visibility, Zumi and data-processing behavior.

A global `.*` catch-all is prohibited as a substitute for deciding what a screen actually is.

New route groups or materially different screens must receive a deliberate contract family or source binding before they ship.

## Active Experience Envelope

The source binding is a release-time classification, not runtime authority.

At runtime the Active Experience Envelope recomputes what the current actor may see and do from identity, organization, location, relationship, role, profession, credential, assignment, consent, purpose, entitlement and other policy-relevant context.

Changing screen, organization or role never carries data or authority forward merely because the previous screen had it.

`EXISTS != DISCOVERABLE != PROMOTED != ELIGIBLE != ENTITLED != AUTHORIZED != VISIBLE DATA != ACTIONABLE NOW`

## Zumi law

Zumi is intelligence and orchestration, not authority.

Every screen contract must preserve at least these prohibitions:

- no granting authority;
- no manufacturing verified facts;
- no overriding deterministic eligibility or server-side permissions;
- no inventing payment/settlement state;
- no silent organization-context crossing;
- no silent data-scope expansion.

Clinical, credential, identity, payment, settlement and authorization truth remains governed by authoritative systems and human/deterministic controls where required.

## AI-processing and agreement law

Ordinary Klinikos AI-service processing may use only the minimum data necessary for the user-requested or explicitly disclosed product purpose, subject to the applicable agreement/notice and policy gate.

The normal agreement does NOT grant unrestricted permission to train general-purpose models on customer/user data.

Default:

`modelTraining = not-permitted-by-default`

Any future product that uses customer/user content for model training or materially different secondary purposes requires a separate, explicit, lawful opt-in and its own revocation/governance design.

PHI may never be accepted on public Zumi surfaces. PHI-capable healthcare workflows require the approved HIPAA-gated path, minimum-necessary projection, appropriate vendor/BAA posture, access control, audit and purpose limitation.

Clinical or PHI context must not be repurposed for unrelated commercial targeting.

## Agreement presentation

Where AI processing is applicable, the user experience must plainly disclose the relevant processing in terms people can understand. The agreement record must retain the exact version accepted.

Agreement wording is a legal artifact and remains subject to qualified counsel review. Engineering must not overstate that acceptance alone creates HIPAA compliance, a BAA, clinical consent, professional authority or a right to use data for unrestricted model training.

## Confidentiality

Browser-visible contract metadata is not a license to expose Klinikos proprietary execution logic.

The browser receives the minimum-necessary result and explanation. Hidden prompts, proprietary orchestration, ranking weights, trust/risk algorithms, security heuristics, private economics, credentials/secrets and unnecessary PHI/PII stay server-side under `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`.

## Definition of done

For material screen work, completion requires:

1. exactly one source contract binding;
2. runtime Active Experience Envelope enforcement;
3. minimum-necessary DTO/projection;
4. correct Zumi scope and forbidden actions;
5. correct agreement/AI-processing basis;
6. correct PHI/commercial-targeting boundary;
7. audit/provenance for consequential actions;
8. denied/blocked/loading/empty/error states;
9. mobile/accessibility behavior;
10. tests passing in an executable environment;
11. exact-head build/start verification;
12. production deployment verified to the merged Git SHA before claiming public parity.

If CI or deployment infrastructure is unavailable, the work may be source-complete but MUST NOT be described as verified-green or publicly matched until executable evidence exists.
