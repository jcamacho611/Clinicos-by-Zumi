# P02 — Public Value / Free Person Growth / Signup Continuity — Design

**Date:** 2026-09-03  
**Status:** FOUNDER-DIRECTED W1 SUBORDINATE DESIGN — review gate before implementation  
**Base audited:** `main@e8f79a5e2419cc24b54f08aba9c44522c9a94784`  
**Authority:** subordinate to the Master Canon, Master Engineering Blueprint, merged Master Execution Engine, P00 traceability, and current verified implementation truth.  
**Program:** `P02` / `W1`  
**Dependencies:** `P00`, P01 presentation runtime  
**Parallel gate:** `P16`

## 1. Product decision

P02 turns Klinikos public entry into a compounding acquisition engine:

> **ARRIVE → EXPRESS INTENT → RECEIVE REAL PUBLIC-SAFE VALUE → SAVE / CONTINUE → JOIN FREE AS ONE PERSON → RESUME THE SAME GOAL → REAUTHORIZE WITH PRIVATE CONTEXT → COMPLETE THE NEXT REAL OUTCOME**

The user is not forced through a module catalog, role picker, sales wall, or payment screen before understanding why Klinikos matters.

The Person account remains free.

Organization authority and activated operating capability remain commercial and governed by later P03/P04 work. P02 must not accidentally give a free Person institutional authority merely because they typed “I run a clinic.”

## 2. Existing kernels to reuse

Current main already contains the critical entry rails:

- public Living Universe / public gateway;
- `/signup`;
- `src/app/signup/signup-form.tsx`;
- `src/app/api/account/signup/route.ts`;
- `src/lib/auth/person-account-signup.ts`;
- `src/lib/auth/person-account-repository.ts`;
- `src/lib/auth/member-signup-release.ts`;
- `src/lib/auth/account-session.ts`;
- `/member` + `getMemberHomeProjection`;
- public-safe Grid/value behavior;
- existing versioned legal acceptance and signup release gates;
- `tests/public-free-entry-truthfulness.test.ts`;
- `tests/person-account-login-continuity.test.ts`;
- `tests/member-signup-legal-evidence-contract.test.ts`.

P02 extends this rail. It does **not** create `SignupV2`, a second identity table, a second auth provider, a parallel member home, or a separate public product.

## 3. Approaches considered

### A. Signup-first funnel

Simple to implement but strategically weak. It asks for trust before value and discards the founder-approved “public is the same Klinikos before authentication” model.

### B. Persist raw anonymous prompt and restore it after signup

High continuity but unacceptable privacy risk because public free-text can contain PHI/PII or sensitive organizational information.

### C. Public value + sanitized continuation envelope — selected

Process anonymous intent ephemerally, return a public-safe result, and preserve only a bounded **non-PHI continuation envelope** needed to resume the goal after authentication. Sensitive raw text is not copied into URLs, analytics, browser storage, or long-lived anonymous persistence.

After authentication, the server re-resolves the goal under the newly established identity/context rather than trusting public-stage permissions.

## 4. Core object model

P02 uses presentation/continuation objects around the existing Person/Account system.

### 4.1 `PublicIntentEnvelope`

Represents what the anonymous visitor is trying to accomplish, within public-safe boundaries.

Representative fields:

```ts
export type PublicIntentEnvelope = {
  version: 1;
  intentClass: PublicIntentClass;
  publicSelectors: Record<string, string | string[]>;
  source: "home" | "search" | "campaign" | "invite" | "grid" | "edu" | "other";
  createdAt: string;
};
```

It must not contain raw PHI, full clinical narratives, secret organization data, passwords, credentials, financial account data, or private evidence.

### 4.2 `PublicResult`

A truthful result that can be shown without authentication. It may contain public resources, public-safe opportunities/capacity, educational guidance, navigation, a bounded synthetic demonstration, or an explanation of what Klinikos can do next.

It must distinguish:

- real current result;
- synthetic/demo example;
- no result;
- connection/setup required;
- authentication required for private detail.

### 4.3 `IntentContinuation`

A short-lived, bounded continuation payload containing only the minimum non-sensitive information necessary to reconstruct the user’s goal after join/sign-in.

The initial W1 design favors **no new database table unless the then-current implementation audit proves one is necessary**. A signed/verified short-lived server-readable continuation token or equivalent existing session mechanism is preferred when it can safely hold only sanitized non-PHI state.

The token may be stored in an HttpOnly, SameSite-controlled cookie or another existing server session mechanism. It must not be readable as an authorization grant.

### 4.4 `SavedIntent`

A Person-owned persistent object is a later extension when the user explicitly saves a goal after authentication. W1 may defer durable cross-device intent storage if a safe existing repository abstraction does not already exist.

P02 must not create a premature generalized task system merely to persist one continuation.

## 5. Public-intent privacy law

Anonymous users will sometimes type sensitive information even when asked not to. The system therefore cannot rely on instructions alone.

Permanent rules:

- raw anonymous free text is treated as potentially sensitive;
- never place raw public prompt text in the URL;
- never place raw public prompt text in analytics event properties;
- never persist raw public prompt text to localStorage/sessionStorage/IndexedDB;
- do not create a long-lived anonymous database record from raw prompt text by default;
- derive only a bounded safe continuation classification/selectors when possible;
- if safe continuation cannot be derived, resume after auth with a neutral prompt such as “Continue what you were working on” and require the user to provide the sensitive detail in the authorized context;
- public Zumi cannot use anonymous self-assertion to establish clinical, professional, patient, tenant, or organization authority.

## 6. Public value architecture

P02 supports several public-safe intent families without turning them into permanent personas:

- “I need care / help finding a service”;
- “I work in healthcare / need work”;
- “I need staff / capacity / a service”;
- “I want to learn / train / place students”;
- “I run a healthcare organization”;
- “I want to understand Klinikos / connect my organization”;
- other bounded public-safe discovery intent.

These are **intent classes**, not account roles. A Person can move between them over a lifetime.

Public value examples:

- safe service/capacity discovery;
- public opportunity preview;
- training/program discovery;
- public organization/provider information where authorized;
- a useful “what would happen next” interpretation;
- transparent capability/setup status;
- a bounded Living Reality demonstration.

P02 must never invent supply, availability, clinicians, jobs, placement slots, prices, customer outcomes, or network density.

## 7. P01 integration

P02 is rendered through P01’s Living Reality grammar, but growth state remains business/application state, not scene state.

Example flow:

`F0 Arrival → F1 Intent → F2 Interpretation → F3 Active public result → F4 safe relationships → F8 first value → F9 Save/continue → free Person signup → authenticated Reality resumes`

A user on Precision Mode gets the same functional flow without the canvas.

The 3D experience must improve comprehension and conversion; it cannot make signup, terms, errors, or accessibility dependent on WebGL.

## 8. Signup continuity

The existing `/api/account/signup` rail remains canonical.

Target sequence:

1. public user receives value;
2. user selects Save/Continue/Join Free;
3. server creates/verifies a bounded non-PHI continuation envelope;
4. `/signup` renders with no hidden paid requirement;
5. existing versioned Terms/Privacy/legal acceptance executes;
6. account/Person creation completes through existing canonical services;
7. authentication/session is established through existing rail;
8. server consumes the continuation;
9. server **re-resolves** the intent using the now-authenticated Person and current authority/context;
10. user lands in the appropriate Living Reality with the prior goal visibly resumed;
11. sensitive details or claims are requested only if needed for the next authorized step.

Public interpretation is therefore continuity context, not authorization evidence.

## 9. Returning-user continuity

If a signed-out Person already has an account, the same continuation can survive sign-in rather than forcing a new signup.

P02 must prevent duplicate identities caused by funnel branching. Existing account discovery/login logic remains authoritative.

## 10. Organization intent

A user may say “I own/run/manage a clinic.” P02 may:

- recognize this as an organization-related intent;
- explain the value of connecting/claiming an organization;
- create a Person account;
- preserve a non-authoritative organization claim intent;
- route toward later organization claim/verification.

P02 may **not**:

- establish organization ownership;
- provision active clinic operating authority;
- grant tenant admin access;
- claim payment creates authority;
- bypass P03 identity/trust or P04 commercial activation.

## 11. Professional / student intent

P02 can help a free Person begin a professional or learner path, but resume/profile assertions remain claims.

Examples:

- “I’m an RN” → create/continue a profession claim path, not verified RN authority;
- “I’m a student” → education path, not institutional enrollment truth;
- “I need a job” → public-safe opportunities / profile next step, not eligibility certification.

## 12. Invite and referral continuity

Invites may preserve a safe source and target relationship request, but the invite cannot create the relationship merely because the link was opened.

After authentication:

- identity is established;
- invite is revalidated;
- target object still exists;
- expiration/revocation is checked;
- relationship/authority workflow proceeds according to domain policy.

## 13. Abuse / rate / origin controls

Public value creates an abuse surface. P02 must reuse or extend existing protections rather than shipping an unlimited public AI endpoint.

Required controls:

- same-origin / CSRF protections where state-changing routes require them;
- public endpoint rate limits;
- payload size limits;
- bounded structured output;
- abuse/spam handling;
- no arbitrary external tool execution for anonymous users;
- AI cost budget by public feature;
- safe fallback if AI provider is unavailable;
- no anonymous route that can enumerate private users/organizations/resources.

P16 owns the deeper security implementation gate.

## 14. Zumi boundary

Public Zumi may:

- interpret intent;
- ask minimal missing questions;
- explain public-safe value;
- structure a safe continuation;
- surface public-safe results;
- recommend the next step.

Public Zumi may not:

- diagnose or establish clinical truth;
- verify credentials;
- establish organization ownership;
- expose PHI/private records;
- perform consequential transactions;
- promise availability/outcomes;
- convert an anonymous statement into authority.

After authentication, Zumi receives a new authorized context envelope; it does not simply “upgrade” the anonymous result into truth.

## 15. Analytics and growth measurement

P02 should measure useful growth without collecting unnecessary sensitive content.

Events should use controlled identifiers/enums rather than raw prompt text:

- `public_intent_started`
- `public_intent_classified`
- `public_first_value_rendered`
- `public_no_result`
- `continue_selected`
- `signup_started`
- `signup_completed`
- `intent_resumed`
- `first_authenticated_outcome`

Primary KPIs:

- value-before-signup rate;
- public intent completion;
- signup conversion after first value;
- first authenticated value rate;
- intent resume success;
- duplicate-account rate;
- invite conversion;
- cost per successful public outcome;
- organization-intent → qualified commercial opportunity later, without counting an intent as a sale.

No raw PHI/PII should be placed into analytics properties merely to improve attribution.

## 16. Empty/error/degraded states

P02 must explicitly support:

- no result;
- partial result;
- AI unavailable;
- public search unavailable;
- rate limit reached;
- signup unavailable by release gate;
- legal acceptance version mismatch;
- account already exists;
- continuation expired;
- continuation invalid/tampered;
- continuation intentionally stripped because it could not be made non-sensitive;
- post-auth destination no longer available;
- unauthorized private detail;
- network empty in requested area.

The user always receives a truthful next step. No-result must not be cosmetically filled with fake opportunity cards.

## 17. Security and confidentiality

P02 must pass P16 gates for:

- browser storage;
- continuation-token tampering;
- open redirect prevention;
- signup/session fixation;
- private-cache separation;
- rate limit bypass;
- account enumeration;
- secret/hidden prompt exposure;
- PHI persistence from anonymous context;
- analytics leakage;
- cross-user continuation reuse.

## 18. Testing strategy

The implementation plan must include RED tests first and preserve all existing signup/legal/member continuity tests.

Required new/extended contracts:

- first useful public result exists before signup for supported intents;
- no credit card required to create a Person account;
- continuation contains only allowlisted non-sensitive structure;
- raw public prompt never appears in URL/browser storage/analytics test fixtures;
- expired/tampered continuation fails closed;
- same intent resumes after signup/sign-in;
- authenticated re-resolution occurs before private action;
- an organization self-claim does not create tenant authority;
- profession self-claim does not create verification;
- truthful empty/no-result state;
- rate limit / provider outage fallback;
- P01 WebGL failure does not break the signup/value path;
- 390px mobile + keyboard + screen-reader flow;
- exact-head build/start/browser evidence.

## 19. Cost discipline

The W1 growth engine should avoid new recurring vendors unless a measured need requires them.

Default strategy:

- reuse existing auth/signup/session infrastructure;
- reuse current public/member projection kernels;
- use bounded server logic before adding a new persistence service;
- do not store anonymous raw prompts;
- do not add a new CRM merely for P02 events;
- instrument existing analytics/telemetry pathway when appropriate;
- AI calls are budgeted and can fall back to deterministic public routing.

## 20. Commercial consequence

P02 is the top-of-funnel compounding engine:

`PUBLIC VALUE → FREE PERSON → REPEAT UTILITY → TRUST/VERIFICATION → NETWORK DENSITY → ORGANIZATION/INSTITUTIONAL INTENT → COMMERCIAL ACTIVATION / TRANSACTIONS / PROGRAMS`

The free Person is not the monetization failure. It is the distribution substrate.

Revenue must follow additional lawful value, not the right to exist in the ecosystem.

## 21. Definition of done for the P02 design

Ready for implementation planning when:

- one existing signup/auth identity rail is preserved;
- value-before-signup is explicit;
- intent continuation is non-PHI and non-authoritative;
- post-auth re-resolution is mandatory;
- organization/professional claims remain claims;
- no payment required for Person identity;
- error/no-result states are truthful;
- security/rate/abuse boundaries are explicit;
- measurable growth events avoid raw sensitive text;
- P01 and P16 integration points are explicit.

## 22. North star

> **A visitor should understand Klinikos by successfully doing something useful, join free without losing momentum, and return to the exact goal with more capability—but never more authority than the evidence and context actually permit.**
