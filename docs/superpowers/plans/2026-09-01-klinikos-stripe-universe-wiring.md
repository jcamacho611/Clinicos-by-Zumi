# Klinikos Stripe Universe Wiring Implementation Plan

> **For Codex / Claude:** REQUIRED SUB-SKILL: use `superpowers:executing-plans` to execute this plan task-by-task. For every implementation task, use `superpowers:test-driven-development`. For any failing test or unexpected Stripe/runtime behavior, use `superpowers:systematic-debugging` before changing production code. Before claiming completion, use `superpowers:verification-before-completion`.

**Status:** APPROVED IMPLEMENTATION PLAN — dependency ordered; current runtime truth still controls execution.

**Goal:** Make Stripe the governed payment/billing execution projection of the full Klinikos commercial universe while keeping the Master Canon and server-owned Offer Registry authoritative. Standardized buyers should be able to pay automatically; verified Stripe evidence should drive only the bounded entitlement/delivery state that the purchased offer permits; negotiated enterprise/regulated work must remain quote/contract/policy routed.

**Architecture:** `MASTER CANON / SERVER OFFER REGISTRY → STRIPE COMMERCIAL PROJECTION → CHECKOUT / BILLING / QUOTE / USAGE / CONNECT RAIL → SIGNED STRIPE EVIDENCE → PROVIDER-NEUTRAL FINANCIAL OS → BOUNDED ENTITLEMENT / DELIVERY`. Stripe Product/Price/Payment Link IDs are environment evidence, never canonical product authority. Stable lookup keys and pricing versions bridge test/live environments. Payment never creates clinical, professional, credential, tenant, PHI, referral, or Grid hard-eligibility authority.

**Tech stack:** Next.js / TypeScript, Zod, Prisma/PostgreSQL, Stripe Node SDK, Stripe Checkout/Billing/Payment Links/Quotes/Invoicing/Connect, Vitest, GitHub Actions Quality + deploy-contract.

---

## 0. Execution and concurrency gate

**Read before work:**

- `AGENTS.md`
- `CODEX.md` or `CLAUDE.md` for the active agent
- `docs/KLINIKOS_MASTER_CANON.md`
- `docs/KLINIKOS_AUTHORITY_MAP.yaml`
- `docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md`
- `docs/superpowers/specs/2026-09-01-integrated-commercial-execution-design.md`
- `docs/business/KLINIKOS_UNIVERSE_MONETIZATION_AND_STRIPE_CATALOG_2026-09-01.md` once merged
- `docs/business/KLINIKOS_STRIPE_CONNECT_PAYMENTS_AND_TRUST_EXPANSION_2026-09-01.md` once merged
- Issue `#458`
- Issue `#462`
- current open PRs touching `src/lib/commercial/**`, Stripe webhooks, pricing, or Financial OS.

**Permanent rule:** one active owner per consequential slice. Never independently edit shared commercial files while another active PR owns that slice.

**Preflight commands / evidence:**

```bash
git fetch origin
git rev-parse origin/main
git status --short
gh pr list --state open --search "Stripe OR commercial OR pricing OR Offer Registry"
```

Expected: exact current `main` SHA recorded in the task/PR. If another PR owns a shared file, either wait, stack intentionally on its verified head, or take a non-overlapping slice.

---

## 1. Land the buyer-aware Offer Registry before additional Stripe runtime wiring

**Existing implementation:** PR `#464`, issue `#458`.

**Files owned by this tranche:**

- `src/lib/commercial/product-catalog.ts`
- `src/lib/commercial/checkout-service.ts`
- `tests/commercial-offer-registry.test.ts`
- `tests/commercial-direct-checkout-gate.test.ts`

**Required behavior:**

1. one governing offer/product record answers buyer, revenue class, commercial route, price type, qualification requirement, conversion destination, lifecycle, public purchasability, allowance and post-purchase boundary;
2. `lifecycle: active` alone never means direct checkout;
3. fixed self-serve Analysis may enter direct checkout;
4. qualified Blueprint, starting-at implementation, reviewed recurring clinic subscriptions, Enterprise and historical aliases do not bypass their governed path;
5. browser amount never overrides server price;
6. payment rail availability never changes offer definition.

**Current diagnostic blocker:** a later merge-ref Quality run failed in unrelated `tests/person-account-signup-db.test.ts` while all Offer Registry/commercial tests passed. Do not merge until the exact merge-ref is green or systematic debugging proves and repairs the independent shared-DB isolation defect.

**Merge gate:**

```bash
npm run type-check
npm run lint
npm test
npm run verify:mvp:postgres
npm run build
```

Plus GitHub `verify` and `deploy-contract` green for the exact head against current `main`.

**Commit:** already represented by PR `#464`; do not duplicate it.

---

## 2. Add one server-only Stripe commercial projection with stable lookup keys

**Purpose:** stop scattering Stripe price identity across code and never hard-code environment-specific `price_...` IDs.

**Files:**

- Create `src/lib/commercial/stripe-commercial-projection.ts`
- Create `tests/stripe-commercial-projection.test.ts`
- Update `src/lib/commercial/product-catalog.ts` only if the merged Offer Registry lacks a required neutral field; prefer projection/adaptor over widening the core type unnecessarily.

### RED first

Write tests asserting:

1. each currently implemented Stripe-capable offer resolves to an environment-neutral lookup-key projection;
2. Core/Growth/Scale expose separate monthly and annual variants with exact server-owned amounts;
3. lookup keys contain no Stripe object IDs and no environment-specific test/live marker;
4. `PRIVATE_QUOTED` / `NOT_DIRECTLY_PURCHASABLE` offers cannot produce a direct checkout price reference;
5. starting-at prices are never represented as exact self-serve prices;
6. no projection field may contain PHI, customer-specific data, secrets, credential truth, or clinical authority;
7. every price projection carries `pricingVersion`, `offerKey`, `treatment`, `currency`, `billingCadence`, `amountCents` where exact, and `lookupKey` where a reusable Stripe Price is intended.

Expected RED: module/export missing.

### GREEN

Recommended shape:

```ts
export type StripeCommercialTreatment =
  | "public_self_serve"
  | "public_subscribe"
  | "private_quoted"
  | "prepaid_usage"
  | "not_directly_purchasable";

export type StripeBillingCadence = "one_time" | "month" | "year";

export type StripePriceProjection = {
  offerKey: CommercialProductKey;
  pricingVersion: string;
  treatment: StripeCommercialTreatment;
  cadence: StripeBillingCadence;
  currency: "usd";
  amountCents: number | null;
  lookupKey: string | null;
  publicLinkEligible: boolean;
  automaticCollection: boolean;
  entitlementBoundary: string;
};
```

Current stable lookup-key scheme for implemented clinic offers:

- `klinikos_operational_audit_one_time_v1`
- `klinikos_implementation_blueprint_one_time_v1`
- `klinikos_founding_implementation_starting_v1` — evidence/quote anchor only; never direct checkout
- `klinikos_clinic_core_monthly_v1`
- `klinikos_clinic_core_annual_v1`
- `klinikos_clinic_growth_monthly_v1`
- `klinikos_clinic_growth_annual_v1`
- `klinikos_clinic_scale_monthly_v1`
- `klinikos_clinic_scale_annual_v1`

Add-on/target lookup keys may exist in Stripe sandbox but become runtime-supported only when the corresponding Offer Registry + entitlement exists.

**Do not store** `prod_...`, `price_...`, or `plink_...` IDs in the canonical registry. Those differ across environments.

**Commit:**

```bash
git add src/lib/commercial/stripe-commercial-projection.ts tests/stripe-commercial-projection.test.ts
git commit -m "feat(commercial): add canonical Stripe offer projection"
```

---

## 3. Support server-owned monthly vs annual clinic subscription cadence

**Files:**

- Modify `src/lib/commercial/clinic-activation-rules.ts`
- Modify `src/lib/commercial/stripe-clinic-subscriptions.ts`
- Modify relevant activation API route/component only after reading current runtime path
- Modify `tests/stripe-recurring-subscription-rules.test.ts`
- Modify `tests/recurring-plan-rail-readiness.test.ts`
- Add/modify checkout route tests for cadence tampering.

### RED first

Add tests proving:

1. request accepts only `monthly | annual` cadence enum;
2. amount is resolved server-side from `clinicPlans`, never accepted from browser;
3. Core monthly = `99_500`, annual = `1_014_900` cents;
4. Growth monthly = `199_500`, annual = `2_034_900` cents;
5. Scale monthly = `399_500`, annual = `4_074_900` cents;
6. Checkout uses `recurring.interval = month` or `year` according to server-resolved cadence;
7. a browser cannot submit a fake amount, lookup key or Stripe Price ID;
8. annual selection persists/correlates in the commercial intent metadata using bounded non-PHI values;
9. signed recurring webhook reconciliation validates offer/cadence/amount/currency before entitlement state changes.

Expected RED: cadence absent / monthly-only builder.

### GREEN

Add:

```ts
export const clinicBillingCadences = ["monthly", "annual"] as const;
```

Keep browser input limited to plan key + cadence + necessary purchaser fields. Resolve amount/lookup key from server projection.

**Do not make the pricing page a price authority.** It can render browser-safe server projection only.

**Commit:**

```bash
git commit -am "feat(billing): support governed annual clinic subscriptions"
```

---

## 4. Resolve Stripe Prices by lookup key and verify the Stripe object before Checkout

**Purpose:** wire the real Stripe catalog to runtime without making Stripe authoritative.

**Files:**

- Create `src/lib/commercial/stripe-price-resolver.ts`
- Modify `src/lib/commercial/stripe-clinic-subscriptions.ts`
- Modify one-time Stripe connector only if needed after reading current implementation
- Create `tests/stripe-price-resolver.test.ts`
- Update `.env.example` with a non-secret rollout gate if required.

### RED first

Mock Stripe SDK and prove:

1. resolver queries by the canonical lookup key rather than hard-coded ID;
2. no price found → fail closed when catalog lookup mode is enabled;
3. multiple active prices sharing the lookup key → fail closed;
4. amount mismatch → fail closed;
5. currency mismatch → fail closed;
6. recurring interval mismatch → fail closed;
7. metadata offer key/pricing version mismatch → fail closed when metadata is expected;
8. inactive price → fail closed;
9. test/live Price object may differ in ID but same lookup key is accepted when all canonical properties match;
10. Stripe error details are not leaked to the browser.

### GREEN

Implement server-only resolver. Return only validated `price.id` to the Checkout builder after canonical comparison. Never cache a live ID in browser code.

Rollout pattern:

- test mode first;
- live catalog reconciled second;
- enable catalog-backed checkout only after live lookup keys exist and signed webhook path is verified;
- no silent fallback to a mismatched Stripe amount.

**Commit:**

```bash
git add src/lib/commercial/stripe-price-resolver.ts tests/stripe-price-resolver.test.ts
git commit -m "feat(stripe): resolve and verify canonical prices by lookup key"
```

---

## 5. Separate public links from automatic application fulfillment

**Principle:** Stripe Payment Links collect money automatically; Klinikos entitlement/delivery automation still requires signed evidence and a deterministic product correlation path.

**Files:**

- Read/extend `src/app/api/webhooks/stripe/route.ts`
- Read/extend `src/lib/commercial/payment-evidence-repository.ts`
- Create a narrowly scoped normalizer only if current webhook code cannot identify Payment-Link-originated Checkout Sessions
- Tests under `tests/stripe-webhook-route.test.ts` and a new static-link fulfillment test if needed.

### Required behavior

- `checkout.session.completed` is not enough if payment status is unpaid/pending;
- async methods reconcile on the definitive paid event;
- Stripe Payment Link metadata contains only non-PHI commercial keys;
- duplicate events are idempotent;
- recognized fixed service purchase creates/updates the correct provider-neutral commercial evidence and next delivery state automatically;
- subscription payment link / checkout events feed existing subscription evidence, not a second ledger;
- regulated permissions remain independent;
- unknown product key or mismatched amount fails closed into an exception queue, not automatic entitlement.

**Important:** if a static Payment Link cannot be safely correlated to the intended buyer/organization under current schema, do not fake correlation. Keep the link payment-automatic but route fulfillment to a bounded reconciliation exception until a provider-neutral post-payment identity model is implemented.

---

## 6. Promote Professional + EDU offers only with real entitlement code

**Files:**

- Extend existing `src/lib/commercial/klinikos-commercial.ts`
- Extend merged Offer Registry in `src/lib/commercial/product-catalog.ts`
- Add provider-neutral entitlement mappings in existing payment/entitlement repository; do not create Stripe-specific membership truth
- Add tests specific to professional/EDU commercial entitlement.

**Candidate target prices already designed in Stripe sandbox:**

- Professional Pro: `$39/mo`, `$399/yr`
- Professional Business: `$129/mo`, `$1,299/yr`
- Professional Launch: `$499` one-time
- EDU Plus: `$29/mo`, `$296/yr`
- EDU Course standard primitive: `$99` within existing `$49–199` category
- EDU Pathway standard primitive: `$349` within existing `$199–499` category

### RED requirements

- payment activates only purchased software/education entitlement;
- payment never marks license/credential/competency/placement/clinical eligibility verified;
- cancellation/refund/renewal update the bounded entitlement idempotently;
- Free identity and basic Grid/EDU liquidity remain free.

Only after GREEN should these offers move from `TARGET_TEST` toward active public checkout.

---

## 7. Build the prepaid Usage Wallet as provider-neutral Financial OS truth

**Candidate packs:** `$100`, `$250`, `$500`, `$1,000`.

**Reuse:** existing commercial usage/payment tables and customer-funded access/FinOps rules. Do not create `stripe_usage_balance` as the canonical balance.

**Files:**

- inspect `src/lib/commercial/payment-evidence-repository.ts`
- inspect current commercial usage / allowance repository and `tests/customer-funded-access.test.ts`
- extend the provider-neutral ledger minimally
- Stripe webhook writes verified funding evidence; provider-neutral code computes spendable balance.

**Spend order:**

1. included allowance;
2. prepaid wallet;
3. explicitly authorized bounded overage if configured;
4. otherwise stop/degrade safely.

**RED requirements:** duplicate payment cannot double-credit; refund/chargeback reverses available value correctly; no negative/open-ended balance becomes implicit authorization; tenant boundaries hold.

---

## 8. Expand organization monetization without double charging

**Candidates:**

- Grid Employer Access: `$499/mo`, `$5,090/yr`
- Capacity Host: `$199/mo`, `$2,030/yr`
- Partner OS: `$299/mo`, `$3,050/yr`
- Placement OS: `$999/mo`, `$10,190/yr`
- Trust & Credential Operations: `$399/mo`, `$4,070/yr`, plus `$1,500` starting setup

Before public activation, define package-composition law so a Growth/Scale/Enterprise customer is not billed again for capability already included in its contract.

Trust product wording must explicitly state payment buys operations/monitoring software, not credential/license/scope/eligibility truth.

---

## 9. Quote-to-cash for sales-led services and enterprise

Use Stripe Quotes + Invoicing for negotiated B2B rather than public Buy Now.

**Private/quoted objects include:**

- Founding Clinic Implementation
- Deep Operating Audit
- Proof Sprint
- Optimization Retainer
- Integration Launch
- Data Migration & Go-Live
- Enterprise Architecture Workshop
- Workforce Program
- EDU Institutional License / Custom Program Build
- Premium Connection
- API & Network Access
- Private Intelligence Node
- Enterprise

**Files:**

- Create a provider-neutral quote request/domain service before a Stripe-specific adapter if none exists
- Create `src/lib/commercial/stripe-quote-adapter.ts` only as execution infrastructure
- Add signed invoice payment reconciliation into existing Financial OS evidence
- Add tests for quote amount/scope/version, invoice paid, credit note/refund, idempotency, and contract/entitlement separation.

Do not put confidential architecture, PHI, or proprietary implementation detail into Stripe invoice/quote metadata.

---

## 10. Stripe Connect — two distinct money-movement lanes

Do not implement until the Offer Registry, evidence, entitlement, and category policy are mature.

### 10A. Clinic/business SaaS payments

For an approved clinic/business collecting from its own customers:

- connected business is merchant of record for its own sale;
- prefer direct charges;
- use embedded onboarding/components;
- prefer Stripe-owned pricing/loss liability initially where supported;
- Klinikos may later monetize via approved SaaS/application-fee/platform-pricing economics.

### 10B. Grid marketplace transactions

Only permitted resource classes.

- destination charges when one permitted recipient and no hold/split is required;
- separate charges + transfers when holding, splitting, or independent settlement is required;
- platform fraud/risk controls and Radar;
- no universal percentage on regulated professional medical fees, referrals, or prescription/regulated product commerce;
- fee rule comes from resource class + jurisdiction + contracting/payment structure, not a global `takeRate` constant.

**Existing Grid financial invariants/tests are superior to Stripe convenience.**

---

## 11. Customer lifecycle: Portal, revenue recovery, receipts and automatic continuation

After subscription rail is proven:

- enable Stripe Customer Portal or a server-generated portal session for subscription management;
- cancel-at-period-end by default unless contract says otherwise;
- enable Smart Retries + automated failed-payment emails for eligible recurring subscriptions;
- consume `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` and relevant refund/credit-note evidence;
- ensure customer can return to Klinikos with safe same-origin state;
- never infer paid state from a redirect.

No external email automation should be added outside the user's established approval policy except Stripe's standard transactional billing/receipt/recovery messages explicitly configured for the payment relationship.

---

## 12. Stripe catalog verification/synchronization tooling

**Files:**

- Create `scripts/stripe/verify-commercial-catalog.mts`
- Optionally create `scripts/stripe/sync-commercial-catalog.mts` only after verifier is proven
- Add package scripts such as `stripe:catalog:verify` and `stripe:catalog:sync:test`
- Add tests for pure manifest generation; external Stripe API calls are not ordinary unit tests.

**Verifier:** read-only. Compare canonical projection vs Stripe by lookup key and report:

- missing price;
- wrong amount/currency/interval;
- duplicate active lookup key;
- metadata/version drift;
- incorrect active/public status;
- unknown live Stripe objects that claim a Klinikos canonical key.

**Sync:** explicit environment/action only. Never runs as an automatic production deploy side effect. Price changes create new immutable Stripe Price objects; old prices are archived for new sales and retained for historical subscriptions/evidence. Use lookup-key transfer only when the pricing-version policy explicitly allows it.

---

## 13. Website / Living Universe placement

The user does not browse “Stripe products.” The frontend remains action-first.

Examples:

- `Help me run my practice` → qualifying clinic path → appropriate Analysis/Blueprint/plan
- `I work in healthcare` → free identity first → Pro/Business only when value is relevant
- `I want to learn` → free EDU entry → Plus/course/pathway when appropriate
- `I need people` → organization/employer path
- `I have space available` → Capacity Host path when monetization adds value
- `I want to grow my healthcare business` → Professional Launch / organization setup / services
- `I want to partner` → Partner OS / private enterprise/integration route

**Frontend rules:**

- price values come from browser-safe server projection;
- CTA destination comes from Offer Registry;
- browser never sends a trusted amount, Price ID, take rate, entitlement or authority decision;
- no module-first Stripe store page becomes the primary Living Universe experience.

---

## 14. Production promotion gate

A Stripe sandbox object is not a live product.

Before marking any offer `LIVE`:

1. expose/reconnect the existing live Klinikos Stripe merchant rather than creating a duplicate merchant unless proven necessary;
2. create/verify live Product/Price lookup keys from canonical manifest;
3. verify live webhook endpoint/signing secret and subscribed event types;
4. test a real low-risk purchase/subscription using the production app path;
5. prove signed webhook → provider-neutral evidence → correct bounded entitlement/delivery;
6. prove duplicate webhook idempotency;
7. prove refund/cancellation/failure behavior;
8. verify no PHI/secret/customer-sensitive data leaks into Stripe metadata;
9. verify tax/receipt/customer-portal configuration for the offer class;
10. capture non-secret runtime evidence in `docs/runtime-evidence/`;
11. only then change product/feature status to live.

`CREATED IN STRIPE != LIVE IN KLINIKOS`.

---

## 15. Full verification before completion

Run on exact final head:

```bash
npm run security:check
npm run db:generate
npm run db:validate
npm run type-check
npm run lint
npm test
npm run verify:mvp:postgres
npm run build
```

Then require GitHub Actions:

- `verify` = success
- `deploy-contract` = success

Additional Stripe-specific evidence:

- test-mode one-time checkout paid → evidence → correct service continuation;
- test-mode Core/Growth/Scale monthly and annual checkout → signed webhook → correct entitlement period;
- wrong amount/lookup key/interval rejected;
- duplicate webhook does not double activate or double credit;
- cancellation/refund/failure behave correctly;
- private quote cannot accidentally create direct checkout;
- usage wallet cannot overdraw without bounded authorization;
- money cannot change professional/clinical/credential/tenant/Grid authority.

Only after these gates may the tranche be called complete.

---

## Sandbox evidence policy

Current Stripe sandbox objects are useful evidence, not canonical IDs. Record them in a dated evidence file if useful, but runtime code must resolve by canonical offer + lookup key. Test/live Stripe IDs will differ.

Current canonical price anchors already created in test mode include the clinic ladder, annual variants, add-ons, professional/EDU/Grid/organization target offers, usage wallet, services, enterprise/Trust/Connect target objects. Their presence does **not** automatically promote unimplemented offers to public or live status.

---

## End-state commercial law

`PERSON / ORGANIZATION INTENT → OFFER REGISTRY → CORRECT COMMERCIAL ROUTE → CANONICAL PRICE / QUOTE / POLICY → STRIPE EXECUTION → SIGNED PAYMENT EVIDENCE → FINANCIAL OS → BOUNDED ENTITLEMENT / DELIVERY → RETENTION / EXPANSION`

while permanently preserving:

`PAYMENT ≠ CLINICAL AUTHORITY ≠ CREDENTIAL TRUTH ≠ PHI ACCESS ≠ TENANT AUTHORITY ≠ GRID HARD ELIGIBILITY ≠ REFERRAL PRIORITY`.
