# KLINIKOS FULL-STACK ARCHITECTURE CANON

Version: `2026-08-27.1`  
Status: `AUTHORITATIVE ENGINEERING DESTINATION, CONSTRAINED BY CURRENT IMPLEMENTATION TRUTH`

## 1. Purpose

This document explains how the final Klinikos product is composed from browser to database to external rails. It does not invent infrastructure that is not in the repository. Current `package.json`, Prisma schema, environment truth, tests and runtime evidence remain authoritative for the exact current stack.

## 2. Current verified stack baseline

Current repository truth establishes:

- Next.js `15.5.x` App Router;
- React `19.1.x`;
- TypeScript;
- Tailwind CSS `4.x`;
- Prisma `6.14.x`;
- PostgreSQL using `DATABASE_URL`;
- Zod;
- Framer Motion;
- Stripe server SDK;
- Vitest;
- server-side repositories/services/routes inside the Next.js application;
- Render deployment/start/build contract.

The architecture must **not** describe Zustand, React Query, BullMQ, Redis, Supabase or another service as current production truth unless current code/runtime later proves adoption.

## 3. System shape

```text
PUBLIC WEB / AUTHENTICATED APP / PATIENT / EDU / GRID
                    ↓
          NEXT.JS SERVER BOUNDARY
                    ↓
        AUTHENTICATION + CONTEXT
                    ↓
     ACTIVE EXPERIENCE ENVELOPE
                    ↓
      AUTHORIZATION / POLICY
                    ↓
   DOMAIN SERVICES / REPOSITORIES
                    ↓
        POSTGRESQL / PRISMA
                    ↓
  OUTBOX / AUDIT / FINANCIAL EVIDENCE
                    ↓
        EXTERNAL ADAPTERS
```

Zumi is integrated across this shape but does not replace it:

```text
USER INTENT
   ↓
AUTHORIZED CONTEXT
   ↓
DETERMINISTIC POLICY
   ↓
ZUMI ORCHESTRATOR
   ↓
MODEL REASONING WHEN USEFUL
   ↓
AUTHORIZED TOOL PROPOSAL
   ↓
SERVER ACTION
   ↓
VERIFIED DOMAIN RESULT
```

## 4. Browser law

The browser is an experience surface, not a security or proprietary-logic boundary.

Browser code may own:

- display state;
- local form state;
- optimistic UX where reversible and safe;
- accessible interaction state;
- client-side validation as convenience;
- map interaction;
- explicit geolocation request;
- transient presentation preferences.

Browser code must not be authority for:

- tenant membership;
- professional credentials;
- clinical privileges;
- encounter signature/lock;
- payment/settlement;
- Grid eligibility;
- confidential ranking;
- pricing/margin logic not deliberately public;
- PHI release;
- consent truth;
- external integration completion.

## 5. Server capability boundary

Every sensitive action should expose a narrow authenticated server capability rather than generic record access.

Preferred pattern:

`BROWSER INTENT → AUTHENTICATED SERVER CAPABILITY → VALIDATION → CONTEXT / AUTHORIZATION → DOMAIN SERVICE → PERSISTENCE / EVENT → MINIMUM-NECESSARY DTO`.

Raw Prisma models are not browser contracts.

## 6. Identity and context architecture

One account/person may participate in multiple relationships and organizations. The server computes the active experience from identity assurance, organization/location, profession, role, credential/privilege, purpose, entitlement, work object, patient/case context, policy, jurisdiction, time and risk.

Context changes must invalidate or recompute:

- permitted data;
- navigation;
- server DTO scope;
- Zumi context/tools;
- cached data where relevant;
- notifications;
- promoted actions;
- audit context.

## 7. Public acquisition architecture

Public routes are problem-oriented and must remain useful without authentication when persistence/authority is not required.

Typical path:

`SEO / REFERRAL / SHARE → PROBLEM ROUTE → PUBLIC VALUE → PUBLIC ZUMI → INTENT → VALUE PREVIEW → ACCOUNT TRIGGER → CONTINUATION`.

Public Zumi receives only public-safe context and must not become an anonymous tenant session.

## 8. Grid architecture

Grid is a shared exchange substrate, not separate staffing/space/education marketplace implementations.

Core server concepts should converge on reusable primitives for:

- participant;
- resource/capability;
- demand;
- requirement;
- eligibility;
- availability;
- match;
- offer;
- agreement;
- reservation/booking;
- financial obligation;
- fulfillment;
- dispute/incident;
- reputation/evidence.

Hard eligibility precedes ranking. Ranking and anti-gaming logic remain server-confidential.

## 9. Clinical architecture

Current Visit is a composition layer over authoritative domains.

It reads projections from existing patient, encounter, results, orders/referrals, documentation, coding and financial state. It does not duplicate those records into client-owned state.

Canonical flow:

`SCHEDULED → INTAKE → PATIENT SNAPSHOT → WHAT CHANGED → STAFF HANDOFF → TODAY → CLINICAL → ASSESSMENT/PLAN → ORDERS/RESULTS → DOCUMENTATION/CODING → CLOSE`.

Encounter lifecycle remains server-governed.

## 10. Telemedicine architecture

Telemedicine attaches to the encounter instead of creating a second chart.

Required boundaries:

- appointment modality;
- readiness/consent;
- video-session adapter;
- same encounter identifier;
- same documentation/signature authority;
- same order/referral/result lifecycle;
- same follow-up/close path;
- separate external connection truth for the video vendor.

The absence of a live video provider must render an explicit setup/unavailable state rather than fake a video session.

## 11. Financial architecture

Financial OS is shared truth for:

- server-owned product/price intent;
- quote/checkout intent;
- payment evidence;
- subscription entitlement;
- Grid obligation;
- payout evidence;
- refund;
- settlement;
- reconciliation;
- audit.

All monetary values use integer cents in authoritative state.

`SUCCESS PAGE != PAYMENT`. `PAYMENT != PAYOUT`. `OBLIGATION != SETTLEMENT`.

## 12. Zumi/OpenAI architecture

Current main already has a provider-neutral gateway and an OpenAI Responses adapter. OpenAI is the primary intelligence provider, not the authority system.

Required server modules should remain separated by responsibility:

- provider adapter;
- task classifier;
- authorized-context builder;
- policy/admission layer;
- tool registry;
- tool authorization;
- model invocation;
- source/provenance capture;
- cost accounting;
- conversation continuity;
- memory classification;
- audit/evaluation.

No API key, system prompt or unrestricted tool definition is sent to the browser.

## 13. Tool contract standard

Every model-callable tool declares:

```ts
interface ZumiToolContract<I, O> {
  name: string;
  description: string;
  inputSchema: unknown;
  dataClass: 'PUBLIC' | 'INTERNAL' | 'SENSITIVE' | 'PHI';
  requiresAuth: boolean;
  requiresHumanConfirmation: boolean;
  idempotency: 'REQUIRED' | 'RECOMMENDED' | 'NOT_APPLICABLE';
  auditEvent: string;
  execute(input: I, context: AuthorizedToolContext): Promise<O>;
}
```

The exact runtime type may differ; the invariant may not.

## 14. AI task routing

Task routing should use the cheapest adequate path:

- deterministic path when no reasoning is needed;
- lower-cost model for lightweight public/product explanation when approved;
- stronger model for complex authorized reasoning when measured quality warrants it;
- realtime-capable model for future approved voice workflows;
- independent evaluator/fallback provider where appropriate.

Model identifiers are configuration, not permanent product architecture.

## 15. PHI rail

Clinical PHI model processing is disabled until the exact OpenAI BAA/organization/eligible endpoint/retention/security/data-flow gates are approved.

Until then:

- public Zumi: no PHI;
- clinical AI development: synthetic/deidentified data;
- no clinical context silently falls back to an unrestricted provider;
- authentication/payment secrets never enter model context.

## 16. External adapters

External providers remain adapters around internal Klinikos truth. Current external matrix controls live status.

Examples:

- Stripe: payment evidence;
- Twilio: communications/verification;
- MapLibre/OpenFreeMap: primary Grid maps;
- healthcare transaction rail: eligibility/claims adapters;
- labs/imaging: future clinic/vendor interfaces;
- video: future approved telemedicine rail;
- identity/credential sources: evidence, never sole policy authority unless approved.

An adapter existing in source code does not mean the vendor is production-live.

## 17. Integration reliability

For asynchronous/external workflows use domain-appropriate combinations of:

- idempotency keys;
- database transactions;
- outbox/inbox;
- retries/backoff;
- dead-letter/reconciliation work;
- correlation IDs;
- explicit external state;
- duplicate event protection;
- late-success handling;
- correction/amendment handling.

Never hide external rejection or mapping failure.

## 18. Data projection and caching

Every sensitive API/surface must define its minimum-necessary DTO.

Review:

- tenant scope;
- role/purpose scope;
- PHI/PII fields;
- proprietary fields;
- cache headers/no-store;
- server/client component boundary;
- error sanitization;
- analytics/telemetry payload;
- static/public asset exposure.

## 19. Frontend design architecture

Use one semantic token system and one appearance authority:

- Auto/System;
- Marble;
- Obsidian.

Shared primitives should support both contemplative and operative density. Do not fork Grid, EDU, Clinical or Financial themes.

Critical UI primitives should converge around:

- adaptive shell;
- Object Stage;
- Inspector;
- attention/unfinished-work treatment;
- narrative timelines/progressions;
- role/context-aware navigation;
- persistent governed Zumi access;
- truthful loading/empty/partial/blocked/error states.

## 20. Accessibility

Release acceptance includes:

- keyboard operation;
- visible focus;
- semantic labels/headings;
- dialog focus trapping/restoration;
- reduced motion;
- minimum 44px touch targets for explicit interactive controls where appropriate;
- no horizontal overflow at supported mobile widths;
- 200% zoom usability;
- color contrast across Marble and Obsidian;
- screen-reader-safe status updates.

## 21. Testing architecture

Required layers according to changed risk:

- unit;
- domain/policy;
- authorization/tenant negative tests;
- API contract;
- database/migration;
- external adapter contract;
- Zumi provider/tool tests;
- AI eval/adversarial tests;
- Grid lifecycle/concurrency;
- clinical lifecycle/signature;
- Financial OS/payment evidence;
- end-to-end journeys;
- browser/mobile/accessibility;
- build/start/deploy-contract;
- production smoke after deployment.

## 22. Definition of done

A feature is done only when the relevant chain is real:

`VISIBLE UI → USER ACTION → IDENTITY/CONTEXT → AUTHORIZATION → DOMAIN ENGINE → REAL DATA → PERSISTENCE/EVENT → TRUTHFUL RESULT → AUDIT/FINANCIAL EVIDENCE WHEN REQUIRED → NEXT USEFUL ACTION`.

A route that renders a nice page but breaks this chain is incomplete.
