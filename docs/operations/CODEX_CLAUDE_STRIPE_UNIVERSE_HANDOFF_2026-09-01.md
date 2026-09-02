# Codex / Claude Handoff — Klinikos Stripe Universe Wiring

Status: `ACTIVE IMPLEMENTATION HANDOFF`

Purpose: give coding agents one unambiguous implementation contract for Stripe placement, ownership, sequencing, and verification. This file does not create a second product canon. `docs/KLINIKOS_MASTER_CANON.md` and verified current implementation/runtime truth remain superior.

---

## Paste this instruction into Codex or Claude

> You are implementing the approved Klinikos Stripe Universe commercialization architecture in `jcamacho611/Clinicos-by-Zumi`.
>
> **Do not start by coding.** First verify current `main`, open PRs, current owner assignments, and current Quality state. Read `AGENTS.md`, your runtime-specific instruction file (`CODEX.md` or `CLAUDE.md`), `docs/KLINIKOS_MASTER_CANON.md`, `docs/KLINIKOS_AUTHORITY_MAP.yaml`, `docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md`, issue #458, issue #462, `docs/superpowers/plans/2026-09-01-klinikos-stripe-universe-wiring.md`, and the current universe monetization/Stripe design docs. One active owner per consequential slice. Do not duplicate an active PR.
>
> **Architecture law:** Stripe is execution infrastructure, not product authority. Canon/server Offer Registry owns offer identity, buyer, amount/price rule, commercial route, exposure, entitlement boundary and lifecycle. Stripe may execute Checkout, Billing, Payment Links, Quotes, Invoices and Connect only after server policy selects the correct rail.
>
> **Money law:** `CHECKOUT_CREATED != PAID`; `PAYMENT != ENTITLEMENT != IMPLEMENTATION_COMPLETE != INTEGRATION_LIVE`; `CHARGE != PAYMENT != PAYABLE != PAYOUT != SETTLEMENT`. A redirect is never payment evidence. Only signed/verifiable processor evidence may advance financial state.
>
> **Healthcare authority law:** money must never buy or bypass PHI access, tenant authority, clinical authority, prescriptive authority, professional license/credential truth, competency truth, consent, scope, supervision, jurisdiction, Grid hard eligibility, referral priority, or pay-to-rank.
>
> **Secret/browser law:** never commit Stripe secret keys or webhook secrets. Never place trusted price, Stripe secret, authority logic, take-rate policy, proprietary matching logic or PHI in the browser. Browser may choose a bounded offer/cadence identifier; server resolves everything consequential.
>
> **Stripe identity law:** never hard-code `prod_...`, `price_...` or `plink_...` IDs as canonical application truth. Test/live IDs differ. Use stable server-owned lookup keys + pricing-version metadata. Validate Stripe amount/currency/interval/metadata against canonical projection before using a resolved Price ID.
>
> **Implementation law:** use RED → GREEN → REFACTOR. Write the failing test first and witness the expected failure. Make the minimum production change. Run focused tests, then full Quality. If any unexpected test fails, use systematic debugging before proposing a fix. Do not weaken tests or safety gates to obtain green CI.
>
> **Production law:** do not create a second live Stripe merchant if the existing Klinikos live account can be reconnected. Sandbox objects are evidence only. Do not claim an offer is live until the live catalog, webhook, signed payment evidence, bounded entitlement/delivery, refund/cancellation/failure, tax/receipt configuration and production path are verified.

---

## Ownership / placement map

| Concern | Canonical placement | Rule |
| --- | --- | --- |
| Public/business price anchors and commercial bundle copy | `src/lib/commercial/klinikos-commercial.ts` | Human/product truth, not Stripe IDs |
| Buyer-aware Offer Registry | `src/lib/commercial/product-catalog.ts` | One offer authority; extend, do not replace |
| Direct-checkout permission | `src/lib/commercial/product-catalog.ts` + `src/lib/commercial/checkout-service.ts` | Active does not imply self-serve |
| Stripe lookup-key projection | `src/lib/commercial/stripe-commercial-projection.ts` | New server-only adapter; environment-neutral |
| Stripe Price lookup/validation | `src/lib/commercial/stripe-price-resolver.ts` | New server-only adapter; fail closed on drift |
| Clinic recurring Checkout | `src/lib/commercial/stripe-clinic-subscriptions.ts` | Reuse current evidence/entitlement path |
| Clinic plan/cadence request schema | `src/lib/commercial/clinic-activation-rules.ts` | Browser may choose plan/cadence, never amount/Price ID |
| One-time Stripe execution | existing `src/lib/commercial/payment-connectors/stripe.ts` and `checkout-service.ts` | Extend only if needed; no duplicate connector |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` | Verify signature before normalization/state changes |
| Payment/entitlement evidence | `src/lib/commercial/payment-evidence-repository.ts` + existing provider-neutral ledger | Stripe evidence feeds it; Stripe is not the ledger |
| Usage/allowance truth | existing customer-funded access / FinOps / commercial usage code | Reuse; no Stripe-specific wallet as authority |
| Grid transaction fee policy | existing `src/lib/grid/fee-policy-monetization-gate.*`, settlement monetization gate, Grid financial rules | Resource/jurisdiction-specific; no global medical take rate |
| Quotes/enterprise | new provider-neutral quote service + `stripe-quote-adapter.ts` only when implementing Wave 5 | Stripe adapter remains infrastructure |
| Connect | new adapter behind existing Grid/organization authority only in Wave 6 | Separate SaaS merchant lane from Grid marketplace lane |
| Frontend prices/CTAs | server-projected browser-safe DTOs | No browser pricing constants as authority |
| Stripe test/live catalog reconciliation | `scripts/stripe/verify-commercial-catalog.mts` then optional sync script | Explicit admin operation; never an automatic production-deploy side effect |

---

## Division of labor

### Codex — preferred primary engineering lane

Codex should normally own server/domain/payment implementation:

1. Offer Registry integration and direct-checkout gate;
2. Stripe commercial projection;
3. monthly/annual server-owned billing variants;
4. Stripe Price lookup-key resolver;
5. signed webhook reconciliation;
6. provider-neutral entitlement and usage wallet wiring;
7. quotes/invoice adapter;
8. Connect adapters after policy prerequisites.

Codex must not redesign Living Universe UI while doing this work.

### Claude / frontend-capable agent — preferred presentation/review lane

Claude should normally own or review:

1. browser-safe pricing/offer projection consumption;
2. Living Universe placement of commercial CTAs in everyday language;
3. pricing/plan comparison surfaces without reintroducing module-first navigation;
4. post-purchase continuation UX;
5. accessibility/responsive/browser acceptance;
6. adversarial review that prices/links do not imply capabilities that are not implemented.

Claude must not move price authority, Stripe lookup, entitlement authority, policy, PHI, or Connect rules into client components.

### Governing Orchestrator / Council

The Orchestrator resolves conflicts, sequencing, commercial classification, pricing strategy, disclosure, live promotion, and whether a new monetization primitive belongs in Canon. It checks that code changes increase actual commercial capability without creating compliance/security/business-model debt.

---

## Approved commercial treatments

Every economic surface maps to exactly one treatment:

1. `PUBLIC_SELF_SERVE` — standardized fixed one-time purchase safe for direct checkout.
2. `PUBLIC_SUBSCRIBE` — standardized recurring subscription, still subject to product/tenant readiness rules.
3. `PRIVATE_QUOTED` — negotiated, starting-at, custom, enterprise, institutional or resource-specific economics.
4. `PREPAID_USAGE` — bounded customer-funded variable-cost balance.
5. `NOT_DIRECTLY_PURCHASABLE` — identity/trust/authority/eligibility/regulated truth that must never be bought.

Do not invent a sixth treatment without Canon change.

---

## Price lifecycle / Stripe object law

- Prices are versioned facts. Do not mutate a historical price amount in place.
- New price → new Stripe Price object.
- Old price → inactive for new sales but retained for existing subscriptions/evidence as required.
- Stable lookup key may be transferred only deliberately under pricing-version policy.
- App stores canonical offer/cadence/version; Stripe ID is correlation/evidence.
- Before Checkout, compare resolved Stripe Price against canonical amount/currency/recurrence/metadata.
- If Stripe and Canon disagree, fail closed and alert; never “trust Stripe because Stripe charged it.”

---

## Current price families to support in order

### Wave 1 — existing clinic revenue

- Clinic Operating Analysis — `$500` fixed one-time
- Implementation Blueprint — `$1,500` fixed, qualification path
- Founding Clinic Implementation — `from $8,000`, quoted
- Klinikos Core — `$995/mo` or `$10,149/yr`
- Klinikos Growth — `$1,995/mo` or `$20,349/yr`
- Klinikos Scale — `$3,995/mo` or `$40,749/yr`
- Enterprise — custom

### Wave 2 — professional + EDU

- Professional Pro — `$39/mo` / `$399/yr`
- Professional Business — `$129/mo` / `$1,299/yr`
- Professional Launch — `$499` one-time
- EDU Plus — `$29/mo` / `$296/yr`
- EDU Course standard anchor — `$99`
- EDU Pathway standard anchor — `$349`

Remain `TARGET_TEST` until entitlement tests exist.

### Wave 3 — customer-funded usage

- Usage Wallet — `$100 / $250 / $500 / $1,000`

### Wave 4 — organization expansion

- Grid Employer Access — `$499/mo` / `$5,090/yr`
- Capacity Host — `$199/mo` / `$2,030/yr`
- Partner OS — `$299/mo` / `$3,050/yr`
- Placement OS — `$999/mo` / `$10,190/yr`
- Trust & Credential Operations — `$399/mo` / `$4,070/yr` + `$1,500` starting setup

### Wave 5 — services / enterprise quote-to-cash

- Deep Operating Audit — sandbox anchor `$3,000`
- Proof Sprint — `$3,500`
- Optimization Retainer — sandbox anchor `$2,500/mo`
- Integration Launch — starting `$2,500`
- Data Migration & Go-Live — starting `$5,000`
- Enterprise Architecture Workshop — `$7,500`
- Workforce Program / EDU Institutional / API Network Access / Premium Connection / Private Intelligence Node / Enterprise — custom contract

### Wave 6 — Connect

- Klinikos Payments — private/contracted SaaS payments economics
- Grid Transaction Service — resource/jurisdiction/policy-priced, no universal public percentage

---

## Living Universe placement rules

Do not create a Stripe storefront as the primary experience.

Commercial continuation should appear when it helps complete the person's intent:

- `Help me run my practice` → Analysis / Blueprint / clinic subscription path
- `I work in healthcare` → free identity first; Pro/Business when useful
- `I have my own client` → governed opportunity assembly; never sell authority
- `I want to learn` → free EDU first; Plus/course/pathway where useful
- `I need someone` → employer/organization path
- `I have space available` → capacity path
- `I want to grow my healthcare business` → Professional Launch / service / organization path
- `I want to partner` → Partner OS / enterprise/integration path
- `I want to fund or finance` → never Stripe consumer checkout unless a specifically approved commercial transaction exists

The UI question remains `What do you need today?`, not `Which product do you want to buy?`.

---

## TDD contract

For each task:

1. create failing test;
2. run it and record the expected RED reason;
3. implement minimum code;
4. run focused test;
5. run adjacent commercial/Stripe/security tests;
6. run full Quality;
7. inspect current `main` again before merge;
8. merge only exact reviewed/green head.

Never write production code first and retrofit a passing test.

---

## Merge checklist

Before any Stripe tranche merges:

- [ ] current `main` refreshed;
- [ ] one active owner for shared files;
- [ ] exact-head TypeScript green;
- [ ] lint green (existing unrelated warnings documented, no new errors);
- [ ] full tests green;
- [ ] PostgreSQL MVP journeys green;
- [ ] production build/start green;
- [ ] source/post-build confidentiality gates green;
- [ ] `deploy-contract` green;
- [ ] no secret/PHI in diff;
- [ ] no browser price/authority leak;
- [ ] no Stripe ID used as canonical truth;
- [ ] failure/refund/cancel/idempotency tested where relevant;
- [ ] external product status remains truthful (`TARGET_TEST`, private, sandbox, etc.) until production verification.

---

## Definition of done

Stripe is wired correctly when a user can move from ordinary Living Universe intent into the correct commercial route, the server resolves the exact offer and price/policy, Stripe collects automatically where allowed, a signed event becomes provider-neutral Financial OS evidence, only the purchased bounded capability/next step is activated, and the system remains unable to buy or infer regulated authority.
